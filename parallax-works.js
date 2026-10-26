(() => {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const update = () => {
    const height = window.innerHeight || 1;
    document.querySelectorAll('.parallax-works').forEach(stage => {
      const rect = stage.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (height - rect.top) / (height + rect.height)));
      const travel = (progress - .5) * 54;
      stage.style.setProperty('--parallax-one-y', `${Math.round(travel * -.72)}px`);
      stage.style.setProperty('--parallax-two-y', `${Math.round(travel * .48)}px`);
      stage.style.setProperty('--parallax-three-y', `${Math.round(travel * -.94)}px`);
    });
  };
  let frame = 0;
  window.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; update(); }); }, { passive:true });
  window.addEventListener('resize', update, { passive:true });
  new MutationObserver(update).observe(document.getElementById('work-grid'), { childList:true, subtree:true });
  update();
})();
