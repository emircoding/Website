const nav = document.getElementById('site-nav');
const toggle = document.querySelector('.menu-toggle');
const yearEl = document.getElementById('current-year');
const taskForm = document.getElementById('task-form');
const taskFeedback = document.getElementById('task-feedback');
const taskSubmitBtn = document.getElementById('task-submit');
const taskTypeSelect = document.getElementById('task-type');
const taskStatusList = document.getElementById('task-status-list');
const taskListState = document.getElementById('task-list-state');
const resultState = document.getElementById('result-state');
const taskResult = document.getElementById('task-result');
const taskResultText = document.getElementById('task-result-text');
const priceResults = document.getElementById('price-results');
const activityFeed = document.getElementById('activity-feed');
const accordionItems = document.querySelectorAll('.accordion-item');
const preferenceButtons = document.querySelectorAll('.chip-toggle');
const modeHeading = document.getElementById('mode-heading');
const prefNotifications = document.getElementById('pref-notifications');
const prefIntegrations = document.getElementById('pref-integrations');
const prefAutomations = document.getElementById('pref-automations');

if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
  });
}

function closeNavOnLinkClick() {
  nav?.classList.remove('open');
  toggle?.setAttribute('aria-expanded', 'false');
}

nav?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeNavOnLinkClick);
});

accordionItems.forEach((item) => {
  item.addEventListener('click', () => {
    const isExpanded = item.getAttribute('aria-expanded') === 'true';
    accordionItems.forEach((other) => other.setAttribute('aria-expanded', 'false'));
    item.setAttribute('aria-expanded', String(!isExpanded));
  });
});

const presets = {
  'Ruhiger Start': {
    notifications: 'Gebündelt, leise Pushes, E-Mail Digest',
    integrations: 'Kalender, Mail, WhatsApp, Notion',
    automations: 'Termine, Erinnerungen, Zusammenfassungen',
  },
  Fokusphase: {
    notifications: 'Nur Blocker, keine Ablenkungen, Desktop-Widgets',
    integrations: 'Slack, Teams, Notion, Preis-APIs',
    automations: 'Research, Follow-ups, Preisalarme, Status-Updates',
  },
  Unterwegs: {
    notifications: 'SMS + Push, Hands-free Voice, Live-Navigation',
    integrations: 'Maps, Telefonie, Kalender, WhatsApp',
    automations: 'Anrufe aufbauen, Zeiten verschieben, Reise-Checks',
  },
  Abendruhe: {
    notifications: 'Nur Wichtiges, Abend-Digest, Keine Pings',
    integrations: 'Mail, Kalender, Erinnerungen, Home-Automation',
    automations: 'Offene Tasks schließen, Logs sichern, Plan für morgen',
  },
};

function applyPreset(mode) {
  const preset = presets[mode];
  if (!preset) return;
  if (modeHeading) modeHeading.textContent = mode;
  if (prefNotifications) prefNotifications.textContent = preset.notifications;
  if (prefIntegrations) prefIntegrations.textContent = preset.integrations;
  if (prefAutomations) prefAutomations.textContent = preset.automations;
}

preferenceButtons.forEach((button) => {
  button.addEventListener('click', () => {
    preferenceButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    applyPreset(button.dataset.mode);
  });
});

applyPreset(modeHeading?.textContent?.trim());

function setTaskFeedback(message, type = 'info') {
  if (!taskFeedback) return;
  taskFeedback.textContent = message;
  taskFeedback.className = `form-feedback ${type}`;
}

function toggleFieldGroups(type) {
  const groups = taskForm?.querySelectorAll('.field-group');
  groups?.forEach((group) => {
    const shouldShow = group.dataset.for === type;
    group.toggleAttribute('hidden', !shouldShow);
  });
}

function setLoading(isLoading) {
  if (taskSubmitBtn) {
    taskSubmitBtn.disabled = isLoading;
    taskSubmitBtn.textContent = isLoading ? 'Wird ausgeführt…' : 'Automation ausführen';
  }
  if (resultState) {
    resultState.textContent = isLoading ? 'Arbeite' : 'Bereit';
    resultState.classList.toggle('pulse', isLoading);
  }
}

function buildPayload(type) {
  const payload = {};
  const description = document.getElementById('task-description')?.value || '';
  if (type === 'calendarCreate') {
    payload.title = document.getElementById('calendar-title')?.value || description;
    payload.start = document.getElementById('calendar-start')?.value;
    payload.end = document.getElementById('calendar-end')?.value;
    payload.timezone = document.getElementById('calendar-timezone')?.value || 'UTC';
    payload.description = description;
  }
  if (type === 'emailSend') {
    payload.to = document.getElementById('email-to')?.value;
    payload.subject = document.getElementById('email-subject')?.value;
    payload.text = document.getElementById('email-body')?.value || description;
  }
  if (type === 'priceCheck') {
    payload.query = document.getElementById('price-query')?.value || description;
  }
  return payload;
}

function formatTime(isoString) {
  const date = new Date(isoString);
  return `${date.toLocaleDateString('de-DE')} ${date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`;
}

function renderPrice(items = []) {
  if (!priceResults) return;
  priceResults.innerHTML = '';
  if (!items.length) {
    priceResults.setAttribute('hidden', '');
    return;
  }
  const list = document.createElement('ul');
  items.forEach((item) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div>
        <p class="label">${item.vendor || 'Shop'}</p>
        <p>${item.title || 'Angebot'}</p>
      </div>
      <div class="price-row">
        <span class="chip">${item.price ? `${item.price} €` : 'n/a'}</span>
        ${item.link ? `<a class="ghost-link" href="${item.link}" target="_blank" rel="noopener">Link</a>` : ''}
      </div>
    `;
    list.appendChild(li);
  });
  priceResults.appendChild(list);
  priceResults.removeAttribute('hidden');
}

function renderResult(task) {
  if (!taskResult || !taskResultText) return;
  taskResult.removeAttribute('hidden');
  if (task.status === 'done') {
    const result = task.result;
    if (task.type === 'priceCheck') {
      renderPrice(result?.items);
      taskResultText.textContent = `Preisprüfung abgeschlossen für "${result?.query}".`;
    } else if (task.type === 'emailSend') {
      taskResultText.textContent = `E-Mail gesendet an ${result?.deliveredTo || 'Empfänger'}.`;
      priceResults?.setAttribute('hidden', '');
    } else if (task.type === 'calendarCreate') {
      taskResultText.textContent = `Kalendereintrag erstellt (Start ${result?.start?.dateTime}).`;
      priceResults?.setAttribute('hidden', '');
    } else {
      taskResultText.textContent = result?.message || 'Routine abgeschlossen.';
      priceResults?.setAttribute('hidden', '');
    }
    resultState?.classList.remove('error');
    resultState?.classList.add('success');
    resultState && (resultState.textContent = 'Erfolg');
  } else {
    taskResultText.textContent = task.error || 'Fehler bei der Ausführung.';
    priceResults?.setAttribute('hidden', '');
    resultState?.classList.add('error');
    resultState && (resultState.textContent = 'Fehler');
  }
}

function buildTaskItem(task) {
  const li = document.createElement('li');
  li.className = 'task-row';
  const statusClass = task.status === 'done' ? 'success' : task.status === 'failed' ? 'error' : 'info';
  li.innerHTML = `
    <div>
      <p class="label">${task.type}</p>
      <p>${task.description || 'Ohne Beschreibung'}</p>
    </div>
    <div class="task-meta">
      <span class="chip ${statusClass}">${task.status}</span>
      <span class="time">${formatTime(task.updatedAt)}</span>
    </div>
  `;
  return li;
}

function syncActivityFeed(tasks = []) {
  if (!activityFeed) return;
  activityFeed.innerHTML = '';
  tasks.slice(0, 4).forEach((task) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="activity-meta">
        <span class="pill-badge">${task.type}</span>
        <span class="time">${formatTime(task.updatedAt)}</span>
      </div>
      <p>${task.result?.message || task.description || 'Ausgeführt'}</p>
    `;
    activityFeed.appendChild(li);
  });
}

async function loadTasks() {
  try {
    if (taskListState) taskListState.textContent = 'Laden…';
    const res = await fetch('/api/tasks');
    if (!res.ok) throw new Error('Tasks konnten nicht geladen werden');
    const data = await res.json();
    const tasks = data.tasks || [];
    if (taskStatusList) {
      taskStatusList.innerHTML = '';
      if (!tasks.length) {
        const empty = document.createElement('li');
        empty.className = 'muted';
        empty.textContent = 'Noch keine Tasks ausgeführt.';
        taskStatusList.appendChild(empty);
      } else {
        tasks.slice(0, 10).forEach((task) => taskStatusList.appendChild(buildTaskItem(task)));
      }
    }
    syncActivityFeed(tasks);
    if (taskListState) taskListState.textContent = 'Aktualisiert';
  } catch (error) {
    console.error(error);
    if (taskListState) taskListState.textContent = 'Fehler';
  }
}

async function submitTask(payload) {
  setLoading(true);
  setTaskFeedback('', 'info');
  try {
    const res = await fetch('/api/task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res
      .json()
      .catch(() => ({ message: 'Antwort konnte nicht gelesen werden.' }));
    if (!res.ok) {
      throw new Error(data.message || 'Task fehlgeschlagen');
    }
    setTaskFeedback('Task ausgeführt.', 'success');
    renderResult(data);
    loadTasks();
  } catch (error) {
    setTaskFeedback(error.message || 'Fehler beim Senden', 'error');
    renderResult({ status: 'failed', error: error.message });
  } finally {
    setLoading(false);
  }
}

taskTypeSelect?.addEventListener('change', (event) => {
  toggleFieldGroups(event.target.value);
});

taskForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const description = document.getElementById('task-description')?.value || '';
  const type = taskTypeSelect?.value || 'routine';
  const payload = buildPayload(type);
  submitTask({ description, type, payload });
});

// Init
if (taskTypeSelect) toggleFieldGroups(taskTypeSelect.value);
loadTasks();
setInterval(loadTasks, 15000);
