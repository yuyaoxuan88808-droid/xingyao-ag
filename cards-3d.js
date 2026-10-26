(() => {
  'use strict';
  const media = window.matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const selector = '.cinema-stage, .cinema-thumb';
  const bind = card => {
    if (card.dataset.card3dBound || card.classList.contains('parallax-works') || !media.matches || reduced.matches) return;
    card.dataset.card3dBound = 'true';
    card.classList.add('card-3d');
    card.addEventListener('pointermove', event => {
      if (event.pointerType !== 'mouse') return;
      const rect = card.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - .5;
      const y = (event.clientY - rect.top) / rect.height - .5;
      const strength = card.classList.contains('cinema-stage') ? 7 : 9;
      card.style.setProperty('--card-rx', `${(-y * strength).toFixed(2)}deg`);
      card.style.setProperty('--card-ry', `${(x * strength).toFixed(2)}deg`);
      card.classList.add('is-tilting');
    }, { passive:true });
    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-tilting');
      card.style.removeProperty('--card-rx');
      card.style.removeProperty('--card-ry');
    }, { passive:true });
  };
  const bindAll = () => document.querySelectorAll(selector).forEach(bind);
  bindAll();
  const grid = document.getElementById('work-grid');
  if (grid && 'MutationObserver' in window) new MutationObserver(bindAll).observe(grid,{childList:true,subtree:true});
})();
