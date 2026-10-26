(() => {
  'use strict';

  const OUT = 0.4;
  const STORAGE_KEY = 'xingyao-ag-like';

  const THUMB_PATHS = [
    'M7 10v12',
    'M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z'
  ];

  const HEART_PATHS = [
    'M19.5 12.572 12 20l-7.5-7.428A5 5 0 1 1 12 6.006a5 5 0 1 1 7.5 6.572'
  ];

  const STAR_PATHS = [
    'M12 2.5l2.4 6.9H22l-5.7 4.3 2.2 7L12 16.8 5.5 20.7l2.2-7L2 9.4h7.6z'
  ];

  const ICONS = { thumb: THUMB_PATHS, heart: HEART_PATHS, star: STAR_PATHS };

  const back = (k, c) => {
    const u = k - 1;
    return 1 + (c + 1) * u ** 3 + c * u ** 2;
  };
  const swellOf = (t, c) =>
    t <= 0 ? 0 : t < OUT ? 1 - (1 - t / OUT) ** 3 : 1 - back((t - OUT) / (1 - OUT), c);
  const format = (n) => new Intl.NumberFormat().format(n);
  const reducedMotion = () =>
    typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const readStore = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (typeof data !== 'object' || data == null) return null;
      return {
        liked: !!data.liked,
        count: Number.isFinite(Number(data.count)) ? Number(data.count) : null
      };
    } catch {
      return null;
    }
  };

  const writeStore = (liked, count) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ liked: !!liked, count: Number(count) || 0 }));
    } catch {
      /* ignore quota / private mode */
    }
  };

  const defaults = {
    liked: undefined,
    defaultLiked: false,
    count: 219,
    onChange: null,
    showCount: true,
    icon: 'thumb',
    idleOutline: true,
    size: 22,
    corner: 18,
    likedColor: '#ff4d6d',
    idleColor: '#8b8b93',
    pillColor: '#232326',
    textColor: '#f5f5f5',
    duration: 560,
    dotSize: 0.3,
    overshoot: 1.7,
    beat: 3,
    rollDuration: 350,
    disabled: false,
    label: '点赞',
    className: '',
    persist: true
  };

  function mountPulseHeart(el, options) {
    if (!el) return null;
    const opts = { ...defaults, ...(options || {}) };
    const controlled = opts.liked !== undefined;

    let stored = opts.persist ? readStore() : null;
    let liked = controlled ? !!opts.liked : stored ? stored.liked : !!opts.defaultLiked;
    let total =
      stored && stored.count != null
        ? stored.count
        : Number(opts.count) || 0;
    // If stored liked but count missing, bump base once
    if (stored && stored.count == null && stored.liked) total = (Number(opts.count) || 0) + 1;

    let shown = { liked, count: total };
    let roll = null;
    let raf = 0;
    let rollTimer = 0;
    let viaPointer = false;
    const logical = { liked, count: total };
    const cfg = {
      duration: opts.duration,
      dotSize: opts.dotSize,
      overshoot: opts.overshoot,
      beat: opts.beat,
      rollDuration: opts.rollDuration
    };

    const root = document.createElement('button');
    root.type = 'button';
    root.className = `pulse-heart${opts.className ? ` ${opts.className}` : ''}`;
    root.setAttribute('aria-pressed', String(liked));
    root.disabled = !!opts.disabled;
    root.dataset.liked = String(shown.liked);
    if (!opts.idleOutline) root.dataset.solid = '';
    if (!opts.showCount) root.dataset.noCount = '';
    root.style.setProperty('--ph-size', `${opts.size}px`);
    root.style.setProperty('--ph-corner', `${opts.corner}px`);
    root.style.setProperty('--ph-pill', opts.pillColor);
    root.style.setProperty('--ph-idle', opts.idleColor);
    root.style.setProperty('--ph-liked', opts.likedColor);
    root.style.setProperty('--ph-text', opts.textColor);
    root.style.setProperty('--ph-roll', `${opts.rollDuration}ms`);
    root.style.setProperty('--ph-stroke', `${(1.5 * opts.size) / 24}px`);

    const pill = document.createElement('span');
    pill.className = 'pulse-heart__pill';

    const heart = document.createElement('span');
    heart.className = 'pulse-heart__heart';
    heart.setAttribute('aria-hidden', 'true');

    const paths = ICONS[opts.icon] || ICONS.thumb;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const glyph = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    paths.forEach((d) => {
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', d);
      path.setAttribute('vector-effect', 'non-scaling-stroke');
      glyph.appendChild(path);
    });
    svg.appendChild(glyph);
    heart.appendChild(svg);

    const countEl = document.createElement('span');
    countEl.className = 'pulse-heart__count';
    countEl.setAttribute('aria-hidden', 'true');

    const sr = document.createElement('span');
    sr.className = 'pulse-heart__sr';

    pill.appendChild(heart);
    if (opts.showCount) pill.appendChild(countEl);
    pill.appendChild(sr);
    root.appendChild(pill);

    el.replaceChildren(root);

    let rollRef = null;

    const renderCount = () => {
      countEl.replaceChildren();
      rollRef = null;
      const text = format(shown.count);
      let cells;
      if (roll) {
        if (roll.at === -1) {
          cells = [{ top: roll.up ? roll.a : roll.b, bottom: roll.up ? roll.b : roll.a }];
        } else {
          cells = [...roll.b].map((ch, i) =>
            i === roll.at
              ? { top: roll.up ? roll.a[i] : ch, bottom: roll.up ? ch : roll.a[i] }
              : { ch }
          );
        }
      } else {
        cells = [...text].map((ch) => ({ ch }));
      }

      cells.forEach((cell, i) => {
        if ('ch' in cell) {
          const span = document.createElement('span');
          span.textContent = cell.ch;
          countEl.appendChild(span);
        } else {
          const slot = document.createElement('span');
          slot.className = 'pulse-heart__slot';
          const rollSpan = document.createElement('span');
          rollSpan.className = 'pulse-heart__roll';
          const top = document.createElement('span');
          top.textContent = cell.top;
          const bottom = document.createElement('span');
          bottom.textContent = cell.bottom;
          rollSpan.appendChild(top);
          rollSpan.appendChild(bottom);
          slot.appendChild(rollSpan);
          countEl.appendChild(slot);
          if (!rollRef) rollRef = rollSpan;
        }
      });

      if (roll && rollRef) {
        rollRef.style.transition = 'none';
        rollRef.style.transform = `translateY(${roll.up ? '0' : '-1em'})`;
        rollRef.getBoundingClientRect();
        rollRef.style.transition = '';
        rollRef.style.transform = `translateY(${roll.up ? '-1em' : '0'})`;
      }
    };

    const syncUi = () => {
      root.setAttribute('aria-pressed', String(logical.liked));
      root.dataset.liked = String(shown.liked);
      sr.textContent = opts.showCount ? `${opts.label}, ${format(logical.count)}` : opts.label;
      if (opts.showCount) renderCount();
      if (root.dataset.instant !== undefined) {
        root.getBoundingClientRect();
        delete root.dataset.instant;
      }
    };

    const startRoll = (from, to) => {
      if (from === to) return;
      const a = format(from);
      const b = format(to);
      const changed =
        a.length === b.length ? [...b].flatMap((ch, i) => (ch !== a[i] ? [i] : [])) : [];
      roll = { a, b, at: changed.length === 1 ? changed[0] : -1, up: to > from };
      clearTimeout(rollTimer);
      rollTimer = setTimeout(() => {
        roll = null;
        renderCount();
      }, cfg.rollDuration);
    };

    const run = (nextLiked, nextCount) => {
      root.dataset.running = '';
      let swapped = false;
      let prev = 0;
      const t0 = performance.now();
      const tick = (now) => {
        const { duration: D, dotSize: dot, overshoot: c, beat: B } = cfg;
        const t = Math.min(1, (now - t0) / D);
        const step = prev ? now - prev : 1000 / 60;
        prev = now;
        const s = swellOf(t, c);
        const k = 1 - (1 - dot) * s;
        glyph.setAttribute('transform', `translate(12 12) scale(${k}) translate(-12 -12)`);
        pill.style.transform = `scale(${1 - (B / 100) * s})`;
        if (!swapped && t + step / 2 / D >= OUT) {
          swapped = true;
          root.dataset.liked = String(nextLiked);
          startRoll(shown.count, nextCount);
          shown = { liked: nextLiked, count: nextCount };
          syncUi();
        }
        if (t < 1) {
          raf = requestAnimationFrame(tick);
          return;
        }
        raf = 0;
        glyph.removeAttribute('transform');
        heart.style.transform = '';
        pill.style.transform = '';
        delete root.dataset.running;
        if (logical.liked !== shown.liked || logical.count !== shown.count) {
          shown = { liked: logical.liked, count: logical.count };
          syncUi();
        }
      };
      raf = requestAnimationFrame(tick);
    };

    const handlePointerDown = (e) => {
      if (e.button !== 0 || opts.disabled) return;
      viaPointer = true;
      if (!reducedMotion()) root.dataset.pressed = '';
    };
    const handlePointerUp = () => {
      delete root.dataset.pressed;
    };
    const handlePointerCancel = () => {
      viaPointer = false;
      handlePointerUp();
    };
    const handleKeyDown = () => {
      viaPointer = false;
    };
    const handleClick = (e) => {
      if (opts.disabled || raf) return;
      const pointer = viaPointer && e.detail !== 0;
      viaPointer = false;
      const nextLiked = !liked;
      const nextCount = total + (nextLiked ? 1 : -1);
      if (!controlled) liked = nextLiked;
      total = nextCount;
      logical.liked = nextLiked;
      logical.count = nextCount;
      if (opts.persist) writeStore(nextLiked, nextCount);
      if (typeof opts.onChange === 'function') opts.onChange(nextLiked, nextCount);
      if (pointer && !reducedMotion()) run(nextLiked, nextCount);
      else {
        root.dataset.instant = '';
        shown = { liked: nextLiked, count: nextCount };
        syncUi();
      }
    };

    root.addEventListener('pointerdown', handlePointerDown);
    root.addEventListener('pointerup', handlePointerUp);
    root.addEventListener('pointerleave', handlePointerUp);
    root.addEventListener('pointercancel', handlePointerCancel);
    root.addEventListener('keydown', handleKeyDown);
    root.addEventListener('click', handleClick);

    syncUi();

    return {
      el: root,
      getLiked: () => logical.liked,
      getCount: () => logical.count,
      destroy() {
        cancelAnimationFrame(raf);
        clearTimeout(rollTimer);
        root.remove();
      }
    };
  }

  const SITE_OPTIONS = {
    count: 219,
    defaultLiked: false,
    showCount: true,
    icon: 'thumb',
    idleOutline: true,
    size: 22,
    corner: 18,
    likedColor: '#ff4d6d',
    idleColor: '#8b8b93',
    pillColor: '#232326',
    textColor: '#f5f5f5',
    duration: 560,
    dotSize: 0.3,
    overshoot: 1.7,
    beat: 3,
    rollDuration: 350,
    disabled: false,
    label: '点赞',
    persist: true
  };

  const autoMount = () => {
    document.querySelectorAll('[data-pulse-heart]').forEach((node) => {
      if (node.dataset.pulseMounted) return;
      node.dataset.pulseMounted = '1';
      mountPulseHeart(node, SITE_OPTIONS);
    });
  };

  window.mountPulseHeart = mountPulseHeart;
  window.PulseHeartSiteOptions = SITE_OPTIONS;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMount, { once: true });
  } else {
    autoMount();
  }
})();
