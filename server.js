const http = require('http');
const fs = require('fs');
const path = require('path');
const { randomUUID, createSign } = require('crypto');
const url = require('url');
const tls = require('tls');
const net = require('net');

const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const TASK_FILE = path.join(DATA_DIR, 'tasks.json');
const STATIC_DIR = __dirname;

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(TASK_FILE)) {
  fs.writeFileSync(TASK_FILE, '[]', 'utf-8');
}

function loadTasks() {
  try {
    const content = fs.readFileSync(TASK_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Kann Tasks nicht laden', error);
    return [];
  }
}

function saveTasks(tasks) {
  fs.writeFileSync(TASK_FILE, JSON.stringify(tasks, null, 2), 'utf-8');
}

function sendJson(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        req.connection.destroy();
        reject(new Error('Payload zu groß'));
      }
    });
    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        resolve(parsed);
      } catch (error) {
        reject(error);
      }
    });
  });
}

function inferTaskType(description = '', explicitType) {
  if (explicitType) return explicitType;
  const text = description.toLowerCase();
  if (/kalender|termin|calendar/.test(text)) return 'calendarCreate';
  if (/mail|e-mail|email/.test(text)) return 'emailSend';
  if (/preis|angebot|kosten|price/.test(text)) return 'priceCheck';
  return 'routine';
}

async function handleGoogleAuth() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!clientEmail || !privateKey || !calendarId) {
    throw new Error('Google Calendar Credentials fehlen (GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_CALENDAR_ID).');
  }
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 3600;
  const scope = 'https://www.googleapis.com/auth/calendar';
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({ iss: clientEmail, scope, aud: 'https://oauth2.googleapis.com/token', exp, iat })
  ).toString('base64url');
  const signatureBase = `${header}.${payload}`;
  const sign = createSign('RSA-SHA256');
  sign.update(signatureBase);
  sign.end();
  const signature = sign.sign(privateKey, 'base64url');
  const assertion = `${signatureBase}.${signature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }).toString(),
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    throw new Error(`Token-Request fehlgeschlagen: ${tokenRes.status} ${text}`);
  }
  const tokenJson = await tokenRes.json();
  return { accessToken: tokenJson.access_token, calendarId };
}

async function handleCalendarCreate(task) {
  const payload = task.payload || {};
  if (!payload.title || !payload.start || !payload.end) {
    throw new Error('Kalender-Task benötigt title, start und end.');
  }
  const { accessToken, calendarId } = await handleGoogleAuth();
  const eventBody = {
    summary: payload.title,
    description: payload.description || task.description,
    start: { dateTime: payload.start, timeZone: payload.timezone || 'UTC' },
    end: { dateTime: payload.end, timeZone: payload.timezone || 'UTC' },
  };
  const resp = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventBody),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Kalender-API antwortet mit ${resp.status}: ${text}`);
  }
  const data = await resp.json();
  return { id: data.id, htmlLink: data.htmlLink, start: data.start, end: data.end };
}

function readResponse(socket) {
  return new Promise((resolve) => {
    let buffer = '';
    const handler = (data) => {
      buffer += data.toString();
      if (/\r?\n/.test(buffer)) {
        const lines = buffer.trim().split(/\r?\n/);
        const last = lines[lines.length - 1];
        if (/^\d{3} /.test(last)) {
          socket.removeListener('data', handler);
          resolve(lines.join('\n'));
        }
      }
    };
    socket.on('data', handler);
  });
}

async function sendSmtpMail({ host, port = 587, user, pass, from, to, subject, text }) {
  if (!host || !user || !pass || !from || !to) {
    throw new Error('SMTP Konfiguration unvollständig (HOST, USER, PASS, FROM, TO).');
  }
  const useTls = port === 465 || process.env.SMTP_SECURE === 'true';
  const socket = useTls ? tls.connect(port, host) : net.createConnection(port, host);

  const send = async (command) => {
    socket.write(`${command}\r\n`);
    return readResponse(socket);
  };

  await readResponse(socket); // greeting
  await send(`EHLO localhost`);
  await send('AUTH LOGIN');
  await send(Buffer.from(user).toString('base64'));
  await send(Buffer.from(pass).toString('base64'));
  await send(`MAIL FROM:<${from}>`);
  await send(`RCPT TO:<${to}>`);
  await send('DATA');
  const message = `From: ${from}\r\nTo: ${to}\r\nSubject: ${subject}\r\n\r\n${text}\r\n.`;
  await send(message);
  await send('QUIT');
  socket.end();
  return { deliveredTo: to };
}

async function handleEmailSend(task) {
  const payload = task.payload || {};
  const to = payload.to || process.env.DEFAULT_MAIL_TO;
  const subject = payload.subject || 'Automations-Mail';
  const text = payload.text || task.description || 'Kein Inhalt angegeben.';
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;
  return sendSmtpMail({ host, port, user, pass, from, to, subject, text });
}

async function handlePriceCheck(task) {
  const query = task.payload?.query || task.description || 'laptop';
  const endpoint = process.env.PRICE_FEED_URL || `https://dummyjson.com/products/search?q=${encodeURIComponent(query)}`;
  const res = await fetch(endpoint);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Preis-API antwortet mit ${res.status}: ${text}`);
  }
  const data = await res.json();
  const products = data.products || data.items || [];
  const items = products.slice(0, 5).map((item) => ({
    title: item.title || item.name,
    price: item.price,
    link: item.url || item.thumbnail || item.link || '#',
    vendor: item.brand || item.store || 'Shop',
  }));
  return { query, items };
}

async function processTask(task) {
  let result = null;
  let error = null;
  const tasks = loadTasks();
  const idx = tasks.findIndex((t) => t.id === task.id);
  if (idx >= 0) {
    tasks[idx] = { ...task, status: 'processing', updatedAt: new Date().toISOString() };
    saveTasks(tasks);
  }

  try {
    switch (task.type) {
      case 'calendarCreate':
        result = await handleCalendarCreate(task);
        break;
      case 'emailSend':
        result = await handleEmailSend(task);
        break;
      case 'priceCheck':
        result = await handlePriceCheck(task);
        break;
      default:
        result = { message: 'Routine ausgeführt – keine spezifische Aktion hinterlegt.' };
    }
    const finished = { ...task, status: 'done', updatedAt: new Date().toISOString(), result };
    tasks[idx] = finished;
    saveTasks(tasks);
    return finished;
  } catch (err) {
    error = err instanceof Error ? err.message : String(err);
    const failed = { ...task, status: 'failed', updatedAt: new Date().toISOString(), error };
    tasks[idx] = failed;
    saveTasks(tasks);
    return failed;
  }
}

function serveStatic(req, res) {
  const parsed = url.parse(req.url);
  let pathname = parsed.pathname === '/' ? '/index.html' : parsed.pathname;
  const filePath = path.join(STATIC_DIR, pathname);
  if (!filePath.startsWith(STATIC_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const typeMap = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
  };
  res.writeHead(200, { 'Content-Type': typeMap[ext] || 'text/plain' });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const parsed = url.parse(req.url, true);
  if (parsed.pathname === '/api/task' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      const description = body.description || '';
      const type = inferTaskType(description, body.type);
      const now = new Date().toISOString();
      const task = {
        id: randomUUID(),
        description,
        type,
        status: 'new',
        createdAt: now,
        updatedAt: now,
        payload: body.payload || {},
        result: null,
        error: null,
      };
      const tasks = loadTasks();
      tasks.push(task);
      saveTasks(tasks);
      const finished = await processTask(task);
      sendJson(res, 200, finished);
    } catch (error) {
      console.error('Task-Fehler', error);
      sendJson(res, 400, { message: error instanceof Error ? error.message : String(error) });
    }
    return;
  }

  if (parsed.pathname === '/api/tasks' && req.method === 'GET') {
    const tasks = loadTasks().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    sendJson(res, 200, { tasks });
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
