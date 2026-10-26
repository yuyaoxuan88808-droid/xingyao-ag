(() => {
  'use strict';
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const revealTargets = [
    '.hero-wordmark', '.hero-identity', '.hero-art', '.hero-footer',
    '.works-section .section-topline', '.works-heading', '.works-toolbar',
    '.work-grid', '.work-honors', '.all-works-link', '.about-grid',
    '.contact-top',
    '.contact-big', '.footer-bottom'
  ].flatMap(selector => [...document.querySelectorAll(selector)]);

  function setReveals() {
    if (reduced.matches || !('IntersectionObserver' in window)) {
      revealTargets.forEach(element => element.classList.add('motion-in'));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('motion-in');
        observer.unobserve(entry.target);
      });
    }, { threshold: .12, rootMargin: '0px 0px -7% 0px' });
    revealTargets.forEach(element => observer.observe(element));
    requestAnimationFrame(() => {
      document.querySelectorAll('.hero-wordmark, .hero-identity, .hero-art, .hero-footer').forEach(element => element.classList.add('motion-in'));
    });
  }
  setReveals();

  if (!reduced.matches) {
    const hero = document.querySelector('.hero');
    const portrait = document.querySelector('.pixel-portrait .hero-image');
    if (hero && portrait && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      hero.addEventListener('pointermove', event => {
        const rect = hero.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        portrait.style.transform = `translate(${x * 10}px, ${y * 8}px)`;
      }, { passive: true });
      hero.addEventListener('pointerleave', () => { portrait.style.transform = ''; }, { passive: true });
    }
  }

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduced.matches) {
    const cursor = document.createElement('span');
    cursor.className = 'motion-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    const label = document.createElement('span');
    label.className = 'motion-cursor-label';
    label.setAttribute('aria-hidden', 'true');
    document.body.append(cursor, label);
    const labels = new Map([
      ['.cinema-stage-button', 'VIEW'], ['.cinema-thumb', 'PREVIEW'],
      ['.contact-big', 'CREATE']
    ]);
    let pointerX = -100;
    let pointerY = -100;
    window.addEventListener('pointermove', event => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      cursor.style.transform = `translate3d(${pointerX}px,${pointerY}px,0)`;
      label.style.transform = `translate3d(${pointerX + 15}px,${pointerY + 15}px,0)`;
      cursor.classList.add('is-visible');
    }, { passive: true });
    document.addEventListener('pointerover', event => {
      const target = event.target.closest('a, button');
      const pair = [...labels].find(([selector]) => target && target.closest(selector));
      cursor.classList.toggle('is-active', Boolean(target));
      label.textContent = pair ? pair[1] : '';
      label.classList.toggle('is-visible', Boolean(pair));
    });
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
  }

  const meter = document.createElement('div');
  meter.className = 'scroll-meter';
  meter.setAttribute('aria-hidden', 'true');
  const fill = document.createElement('span');
  meter.append(fill);
  document.body.append(meter);
  let ticking = false;
  const updateMeter = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    fill.style.height = `${max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0}%`;
  };
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateMeter);
  }, { passive: true });
  updateMeter();
})();
