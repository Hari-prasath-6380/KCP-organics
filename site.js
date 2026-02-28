// Mobile nav toggle for header
document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.querySelector('.nav-toggle');
  if (!toggle) return;

  const nav = document.querySelector('.navbar');
  let mobileMenu = document.querySelector('.mobile-menu');
  if (!mobileMenu) {
    mobileMenu = document.createElement('div');
    mobileMenu.className = 'mobile-menu';
    // Clone main links
    const links = [];
    const section1 = document.querySelector('.section1');
    const section2 = document.querySelector('.section2');
    if (section1) links.push(...Array.from(section1.querySelectorAll('a')));
    if (section2) links.push(...Array.from(section2.querySelectorAll('a')));
    links.forEach(a => {
      const clone = a.cloneNode(true);
      clone.addEventListener('click', () => mobileMenu.classList.remove('show'));
      mobileMenu.appendChild(clone);
    });
    nav.appendChild(mobileMenu);
  }

  toggle.addEventListener('click', function () {
    const expanded = this.getAttribute('aria-expanded') === 'true';
    this.setAttribute('aria-expanded', String(!expanded));
    mobileMenu.classList.toggle('show');
  });

  // Close on outside click
  document.addEventListener('click', function (e) {
    if (!mobileMenu.contains(e.target) && !toggle.contains(e.target) && mobileMenu.classList.contains('show')) {
      mobileMenu.classList.remove('show');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
});
