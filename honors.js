(() => {
  'use strict';
  const honors = [
    {
      title: '悉尼国际AI电影节',
      detail: 'OMNI INTERNATIONAL AI FILM FESTIVAL · SYDNEY · 2026',
      status: '官方入选 / 提名',
      visual: 'OMNI',
      visualType: 'OFFICIAL SELECTION',
      tone: 'omni',
      logo: './assets/honors-logos/omni.png',
      logoFound: true
    },
    {
      title: '香港AI艺术创作大赛',
      detail: 'HONG KONG AI ART COMPETITION',
      status: '专业组优胜奖',
      visual: 'HONG KONG',
      visualType: 'PROFESSIONAL AWARD',
      tone: 'gold',
      logo: './assets/honors-logos/hkaida.png',
      logoFound: true
    },
    {
      title: '“一带一路”国际城市非遗数字艺术设计',
      detail: 'INTERNATIONAL URBAN INTANGIBLE CULTURAL HERITAGE DIGITAL ART',
      status: '三等奖',
      visual: 'CULTURAL',
      visualType: 'DIGITAL ART DESIGN',
      tone: 'red',
      logo: './assets/honors-logos/belt-road.png',
      logoFound: false
    },
    {
      title: '2026全民AI创作大赛',
      detail: 'NATIONAL AI CREATION COMPETITION · 2026',
      status: '优秀创意奖',
      visual: '2026',
      visualType: 'CREATIVE AWARD',
      tone: 'blue',
      logo: './assets/honors-logos/quanmin-ai.png',
      logoFound: false
    },
    {
      title: '金灿杯山海之光全国AI大赛',
      detail: 'GOLDEN SPLENDOUR · MOUNTAINS AND SEAS · NATIONAL AI COMPETITION',
      status: '决赛入围奖',
      visual: 'SHANHAI',
      visualType: 'FINALIST SELECTION',
      tone: 'gold',
      logo: './assets/honors-logos/jincan.png',
      logoFound: false
    },
    {
      title: '亚洲城市文化国际海报展',
      detail: 'ASIAN CITY CULTURE · INTERNATIONAL POSTER EXHIBITION',
      status: '展览',
      visual: 'ASIA',
      visualType: 'POSTER EXHIBITION',
      tone: 'red',
      logo: './assets/honors-logos/asia-poster.png',
      logoFound: false
    }
  ];

  /* Positions mapped onto the elliptical orbits (percent of visual box). */
  const orbitSlots = [
    { x: 10, y: 46 },
    { x: 24, y: 18 },
    { x: 74, y: 14 },
    { x: 90, y: 44 },
    { x: 72, y: 80 },
    { x: 24, y: 82 }
  ];

  const list = document.getElementById('honor-steps');
  const visual = document.getElementById('honor-visual');
  const index = document.getElementById('honor-visual-index');
  const type = document.getElementById('honor-visual-type');
  if (!list || !visual || !index || !type) return;

  let orbitLayer = document.getElementById('honor-orbit-icons');
  if (!orbitLayer) {
    orbitLayer = document.createElement('div');
    orbitLayer.id = 'honor-orbit-icons';
    orbitLayer.className = 'honor-orbit-icons';
    orbitLayer.setAttribute('aria-hidden', 'true');
    visual.append(orbitLayer);
  }

  const iconNodes = honors.map((honor, position) => {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'honor-orbit-icon' + (honor.logoFound ? ' has-logo' : ' is-mark');
    node.dataset.index = String(position);
    node.setAttribute('aria-label', honor.title);
    const slot = orbitSlots[position] || orbitSlots[0];
    node.style.setProperty('--ox', slot.x + '%');
    node.style.setProperty('--oy', slot.y + '%');
    node.style.setProperty('--delay', (position * 0.35) + 's');
    node.innerHTML = `<img src="${honor.logo}" alt="" width="48" height="48" loading="lazy" decoding="async">`;
    orbitLayer.append(node);
    node.addEventListener('click', () => {
      setActive(position);
      const step = steps[position];
      if (step) step.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    return node;
  });

  const steps = honors.map((honor, position) => {
    const item = document.createElement('li');
    item.className = 'honor-step';
    item.dataset.index = String(position);
    item.innerHTML = `<span class="honor-step-index">${String(position + 1).padStart(2, '0')}</span><div><h4>${honor.title}</h4><p>${honor.detail}</p><span class="honor-status">${honor.status}</span></div>`;
    list.append(item);
    return item;
  });

  let active = -1;
  function setActive(position) {
    if (position === active || !honors[position]) return;
    active = position;
    const honor = honors[position];
    visual.classList.add('is-switching');
    window.setTimeout(() => {
      visual.dataset.tone = honor.tone;
      index.textContent = String(position + 1).padStart(2, '0');
      type.textContent = honor.visualType;
      visual.classList.remove('is-switching');
    }, 120);
    steps.forEach((step, stepIndex) => step.classList.toggle('is-active', stepIndex === position));
    iconNodes.forEach((node, stepIndex) => node.classList.toggle('is-active', stepIndex === position));
  }

  setActive(0);
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (visible) setActive(Number(visible.target.dataset.index));
  }, { threshold: [.2, .45, .7], rootMargin: '-30% 0px -34% 0px' });
  steps.forEach(step => observer.observe(step));
})();
