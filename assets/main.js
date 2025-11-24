const nav = document.getElementById('site-nav');
const toggle = document.querySelector('.menu-toggle');
const yearEl = document.getElementById('current-year');
const form = document.getElementById('contact-form');
const feedback = document.getElementById('form-feedback');
const accordionItems = document.querySelectorAll('.accordion-item');
const preferenceButtons = document.querySelectorAll('.chip-toggle');
const modeHeading = document.getElementById('mode-heading');
const prefNotifications = document.getElementById('pref-notifications');
const prefIntegrations = document.getElementById('pref-integrations');
const prefAutomations = document.getElementById('pref-automations');
const activityFeed = document.getElementById('activity-feed');

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

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const name = formData.get('name');
  feedback.textContent = name
    ? `Danke, ${name}! Wir melden uns in Kürze.`
    : 'Danke! Wir melden uns in Kürze.';
  form.reset();
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
  modeHeading && (modeHeading.textContent = mode);
  prefNotifications && (prefNotifications.textContent = preset.notifications);
  prefIntegrations && (prefIntegrations.textContent = preset.integrations);
  prefAutomations && (prefAutomations.textContent = preset.automations);
}

preferenceButtons.forEach((button) => {
  button.addEventListener('click', () => {
    preferenceButtons.forEach((btn) => btn.classList.remove('active'));
    button.classList.add('active');
    applyPreset(button.dataset.mode);
  });
});

applyPreset(modeHeading?.textContent?.trim());

const activityTemplates = [
  {
    source: 'Kalender',
    text: 'Zeitslot mit Priya bestätigt und Zoom-Link erstellt.',
  },
  {
    source: 'WhatsApp',
    text: 'Reminder an Familie gesendet: Einkaufsliste aktualisiert.',
  },
  {
    source: 'E-Mail',
    text: 'Follow-up zu Angebot verschickt und Lesebestätigung angefragt.',
  },
  {
    source: 'Telefonie',
    text: 'Anruf geplant, um Liefertermin zu bestätigen und Protokoll zu speichern.',
  },
  {
    source: 'Slack',
    text: 'Standup-Update gepostet und Ticket-Status auf "in review" gesetzt.',
  },
];

function prependActivity(entry) {
  if (!activityFeed) return;
  const li = document.createElement('li');
  li.innerHTML = `
    <div class="activity-meta">
      <span class="pill-badge">${entry.source}</span>
      <span class="time">${entry.time}</span>
    </div>
    <p>${entry.text}</p>
  `;
  activityFeed.prepend(li);
  while (activityFeed.children.length > 6) {
    activityFeed.lastElementChild?.remove();
  }
}

if (activityFeed) {
  setInterval(() => {
    const template = activityTemplates[Math.floor(Math.random() * activityTemplates.length)];
    const time = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    prependActivity({ ...template, time });
  }, 5200);
}
