'use strict';
const root = document.documentElement;
const config = window.PORTFOLIO || {};
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const header = document.querySelector('.header');
const menu = document.querySelector('#menu');
const menuButton = document.querySelector('.menu-toggle');
const motionButton = document.querySelector('.motion-toggle');
const hero = document.querySelector('.hero');
const stage = document.querySelector('.interface-stage');
const dialog = document.querySelector('#screen-dialog');
let paused = reducedMotion.matches;
try { paused ||= localStorage.getItem('inacyo-motion') === 'paused'; } catch {}
let lastScroll = scrollY;
let scheduled = false;
let dialogTrigger;

document.querySelectorAll('[data-contact]').forEach(link => {
  const type = link.dataset.contact;
  const value = config[type];
  if (!value) return;
  link.href = type === 'email' ? `mailto:${value}` : value;
  link.hidden = false;
  if (type === 'email') link.textContent = value;
});
if (config.courseTitle) document.querySelector('#course-title').textContent = config.courseTitle;

function closeMenu(restoreFocus = false) {
  menu.classList.remove('open');
  menuButton.setAttribute('aria-expanded', 'false');
  if (restoreFocus) menuButton.focus();
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menu.classList.toggle('open', open);
  menuButton.setAttribute('aria-expanded', String(open));
});
menu.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('click', event => { if (!event.target.closest('.header')) closeMenu(); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.classList.contains('open')) closeMenu(true);
});
matchMedia('(min-width: 761px)').addEventListener('change', () => closeMenu());

function applyMotionPreference() {
  const off = paused || reducedMotion.matches;
  root.classList.toggle('motion-off', off);
  motionButton.setAttribute('aria-pressed', String(off));
  const label = off ? 'Ativar efeitos de movimento' : 'Pausar efeitos de movimento';
  motionButton.title = label;
  motionButton.querySelector('.sr-only').textContent = label;
  motionButton.querySelector('path').setAttribute('d', off ? 'm8 5 11 7-11 7z' : 'M8 5v14M16 5v14');
  if (reducedMotion.matches) {
    motionButton.title = 'Movimento reduzido conforme a preferência do dispositivo';
    motionButton.querySelector('.sr-only').textContent = motionButton.title;
  }
  if (off) {
    document.querySelectorAll('.pending').forEach(element => element.classList.remove('pending'));
    header.classList.remove('is-away');
    root.style.setProperty('--hero-shift', '0px');
    root.style.setProperty('--stage-shift', '0px');
    root.style.setProperty('--hero-fade', '1');
    root.style.setProperty('--mx', '0deg');
    root.style.setProperty('--my', '0deg');
  }
  scheduleUpdate();
}
motionButton.addEventListener('click', () => {
  if (reducedMotion.matches) return;
  paused = !paused;
  try { localStorage.setItem('inacyo-motion', paused ? 'paused' : 'enabled'); } catch {}
  applyMotionPreference();
});
reducedMotion.addEventListener('change', applyMotionPreference);

function updateScroll() {
  scheduled = false;
  const y = scrollY;
  const total = root.scrollHeight - innerHeight;
  root.style.setProperty('--progress', total > 0 ? String(y / total) : '0');
  if (!paused && !reducedMotion.matches) {
    const heroHeight = hero.offsetHeight;
    root.style.setProperty('--hero-shift', `${Math.min(y, heroHeight) * .13}px`);
    root.style.setProperty('--hero-fade', String(Math.max(.15, 1 - y / (heroHeight * .9))));
    const rect = stage.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < innerHeight) {
      const offset = (innerHeight / 2 - rect.top - rect.height / 2) * .075;
      root.style.setProperty('--stage-shift', `${Math.max(-24, Math.min(24, offset))}px`);
    }
    if (Math.abs(y - lastScroll) > 6) {
      header.classList.toggle('is-away', y > heroHeight && y > lastScroll && !menu.classList.contains('open') && !header.contains(document.activeElement));
      lastScroll = y;
    }
  }
}
function scheduleUpdate() {
  if (!scheduled) { scheduled = true; requestAnimationFrame(updateScroll); }
}
addEventListener('scroll', scheduleUpdate, { passive: true });
addEventListener('resize', scheduleUpdate, { passive: true });
applyMotionPreference();
root.classList.add('enhanced');

if ('IntersectionObserver' in window) {
  if (!paused && !reducedMotion.matches) {
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.remove('pending'); reveal.unobserve(entry.target); }
    }), { threshold: .08 });
    document.querySelectorAll('.reveal').forEach((element, index) => {
      element.style.setProperty('--delay', `${index % 3 * 70}ms`);
      element.classList.add('pending');
      reveal.observe(element);
    });
  }
  const sections = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    menu.querySelectorAll('a').forEach(link => {
      if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }), { rootMargin: '-15% 0px -65% 0px' });
  document.querySelectorAll('main section[id]').forEach(section => sections.observe(section));
}

// Effects follow native scrolling; no scroll hijacking or permanent animation loop.
hero.addEventListener('pointermove', event => {
  if (paused || reducedMotion.matches || !finePointer.matches) return;
  const rect = hero.getBoundingClientRect();
  root.style.setProperty('--mx', `${((event.clientX - rect.left) / rect.width - .5) * 4}deg`);
});
hero.addEventListener('pointerleave', () => root.style.setProperty('--mx', '0deg'));
const contactArt = document.querySelector('.contact-art');
contactArt.addEventListener('pointermove', event => {
  if (paused || reducedMotion.matches || !finePointer.matches) return;
  const rect = contactArt.getBoundingClientRect();
  root.style.setProperty('--my', `${((event.clientX - rect.left) / rect.width - .5) * 16}deg`);
});
contactArt.addEventListener('pointerleave', () => root.style.setProperty('--my', '0deg'));

document.querySelectorAll('.service').forEach(item => item.addEventListener('toggle', () => {
  if (item.open) document.querySelectorAll('.service').forEach(other => { if (other !== item) other.open = false; });
  scheduleUpdate();
}));
document.querySelectorAll('.view-screens').forEach(button => button.addEventListener('click', () => {
  dialogTrigger = button;
  dialog.showModal();
  document.body.classList.add('dialog-open');
  document.querySelector('.close-dialog').focus();
}));
document.querySelector('.close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom)) dialog.close();
});
dialog.addEventListener('close', () => {
  document.body.classList.remove('dialog-open');
  dialogTrigger?.focus();
});
document.querySelector('.copy-email').addEventListener('click', async () => {
  const status = document.querySelector('#copy-status');
  const email = config.email || 'inacyoguimaraes@gmail.com';
  try {
    await navigator.clipboard.writeText(email);
    status.textContent = 'E-mail copiado.';
  } catch {
    status.textContent = `Copie o endereço: ${email}`;
  }
});
