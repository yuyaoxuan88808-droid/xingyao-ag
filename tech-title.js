(() => {
  'use strict';
  const title = document.getElementById('works-title');
  if (!title) return;
  const source = [...title.childNodes];
  const fragment = document.createDocumentFragment();
  let index = 0;
  const appendText = (value, muted = false) => {
    for (const char of Array.from(value)) {
      if (/\s/.test(char)) { fragment.append(document.createTextNode(char)); continue; }
      const glyph = document.createElement('span');
      glyph.className = `tech-glyph${muted ? ' is-muted' : ''}`; glyph.style.setProperty('--glyph-index', index++); glyph.textContent = char;
      glyph.addEventListener('click', () => { glyph.classList.remove('is-kicked'); requestAnimationFrame(() => glyph.classList.add('is-kicked')); });
      fragment.append(glyph);
    }
  };
  source.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) appendText(node.textContent || '');
    else if (node.nodeName === 'BR') { const br = document.createElement('br'); br.className = 'tech-break'; fragment.append(br); }
    else appendText(node.textContent || '', node.nodeName === 'SPAN');
  });
  title.replaceChildren(fragment); title.classList.add('tech-title');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) { title.classList.add('is-introduced'); return; }
  const observer = new IntersectionObserver(entries => { if (entries[0].isIntersecting) { title.classList.add('is-introduced'); observer.disconnect(); } }, {threshold:.35});
  observer.observe(title);
})();
