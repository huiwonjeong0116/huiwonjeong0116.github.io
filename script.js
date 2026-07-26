/* ---------- Shared elements and media queries ---------- */
const header = document.querySelector('.site-header');
const navToggle = document.querySelector('.nav-toggle');
const navPanel = document.querySelector('.nav-links');
const menuLinks = [...document.querySelectorAll('.nav-links a')];
const sections = [...document.querySelectorAll('main section[id]')];
const toTop = document.querySelector('.to-top');
const mobileQuery = window.matchMedia('(max-width: 900px)');
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let menuIsOpen = false;
let scrollUpdatePending = false;

/* ---------- Accessible mobile navigation ---------- */
function setMenuAccessibility() {
  if (mobileQuery.matches) {
    navPanel.toggleAttribute('inert', !menuIsOpen);
    navPanel.setAttribute('aria-hidden', String(!menuIsOpen));
  } else {
    navPanel.removeAttribute('inert');
    navPanel.removeAttribute('aria-hidden');
  }
}

function closeMenu({ restoreFocus = false } = {}) {
  if (!menuIsOpen && mobileQuery.matches) {
    setMenuAccessibility();
    return;
  }

  menuIsOpen = false;
  navToggle.classList.remove('open');
  navPanel.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
  navToggle.setAttribute('aria-label', 'Open navigation');
  document.body.classList.remove('menu-open');
  setMenuAccessibility();

  if (restoreFocus && mobileQuery.matches) navToggle.focus();
}

function openMenu() {
  menuIsOpen = true;
  navToggle.classList.add('open');
  navPanel.classList.add('open');
  navToggle.setAttribute('aria-expanded', 'true');
  navToggle.setAttribute('aria-label', 'Close navigation');
  document.body.classList.add('menu-open');
  setMenuAccessibility();
  menuLinks[0]?.focus();
}

navToggle.addEventListener('click', () => {
  if (menuIsOpen) closeMenu({ restoreFocus: true });
  else openMenu();
});

menuLinks.forEach((link) => link.addEventListener('click', () => closeMenu()));

document.addEventListener('keydown', (event) => {
  if (!menuIsOpen) return;

  if (event.key === 'Escape') {
    event.preventDefault();
    closeMenu({ restoreFocus: true });
    return;
  }

  if (event.key !== 'Tab') return;
  const focusableItems = [navToggle, ...menuLinks];
  const firstItem = focusableItems[0];
  const lastItem = focusableItems[focusableItems.length - 1];

  if (event.shiftKey && document.activeElement === firstItem) {
    event.preventDefault();
    lastItem.focus();
  } else if (!event.shiftKey && document.activeElement === lastItem) {
    event.preventDefault();
    firstItem.focus();
  }
});

mobileQuery.addEventListener('change', () => closeMenu());
setMenuAccessibility();

/* ---------- Header and scroll-to-top state ---------- */
function updateScrollUI() {
  header.classList.toggle('scrolled', window.scrollY > 24);
  toTop.classList.toggle('visible', window.scrollY > 600);
  scrollUpdatePending = false;
}

window.addEventListener('scroll', () => {
  if (scrollUpdatePending) return;
  scrollUpdatePending = true;
  window.requestAnimationFrame(updateScrollUI);
}, { passive: true });

updateScrollUI();
toTop.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: reducedMotionQuery.matches ? 'auto' : 'smooth' });
});

/* ---------- Progressive reveal animation ---------- */
const revealItems = [...document.querySelectorAll('.reveal')];

if ('IntersectionObserver' in window && !reducedMotionQuery.matches) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -35px' });

  revealItems.forEach((element, index) => {
    element.style.transitionDelay = `${Math.min(index % 3, 2) * 70}ms`;
    revealObserver.observe(element);
  });
} else {
  revealItems.forEach((element) => element.classList.add('visible'));
}

/* ---------- Current-section navigation state ---------- */
function setActiveSection(sectionId) {
  menuLinks.forEach((link) => {
    const isCurrent = link.hash === `#${sectionId}`;
    link.classList.toggle('active', isCurrent);
    if (isCurrent) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}

if ('IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver((entries) => {
    const visibleEntry = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (visibleEntry) setActiveSection(visibleEntry.target.id);
  }, { rootMargin: '-30% 0px -58%', threshold: [0, 0.25, 0.5] });

  sections.forEach((section) => sectionObserver.observe(section));
}
