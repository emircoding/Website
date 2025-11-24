const nav = document.getElementById('site-nav');
const toggle = document.querySelector('.menu-toggle');
const yearEl = document.getElementById('current-year');
const form = document.getElementById('contact-form');
const feedback = document.getElementById('form-feedback');
const accordionItems = document.querySelectorAll('.accordion-item');

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
  feedback.textContent = name ? `Thanks, ${name}! We will reply soon.` : 'Thanks! We will reply soon.';
  form.reset();
});
