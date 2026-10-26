(() => {
  'use strict';

  const PATTERNS = {
    arrow: { 3: { cells: [1, 2, 3, 0, 1, 2, 1, 2, 3], loop: 7.2, scale: 1 } },
    dots: { 3: { cells: [0, 1, 2, 0, 1, 2, 0, 1, 2], loop: 3, scale: 2.4 } },
    ripple: { 3: { cells: [2, 1, 2, 1, 0, 1, 2, 1, 2], loop: 4.8, scale: 1.5 } },
    spiral: { 3: { cells: [0, 1, 2, 7, 8, 3, 6, 5, 4], loop: 9, scale: 1.2, lit: 0.35 } },
    orbit: {
      3: { cells: [0, 1, 2, 7, null, 3, 6, 5, 4], loop: 8, scale: 1.2 },
      4: { cells: [0, 1, 2, 3, 11, null, null, 4, 10, null, null, 5, 9, 8, 7, 6], loop: 6, scale: 1.2, lit: 0.45 }
    },
    snake: {
      3: { cells: [0, 1, 2, 5, 4, 3, 6, 7, 8], loop: 9, scale: 1, lit: 0.35 },
      4: { cells: [0, 1, 2, 3, 7, 6, 5, 4, 8, 9, 10, 11, 15, 14, 13, 12], loop: 16, scale: 1, lit: 0.25 }
    },
    sweep: { 4: { cells: [0, 1, 2, 3, 1, 2, 3, 4, 2, 3, 4, 5, 3, 4, 5, 6], loop: 5, scale: 1, lit: 0.45 } },
    spin: { 4: { cells: [0, 0, 1, 1, 0, 0, 1, 1, 3, 3, 2, 2, 3, 3, 2, 2], loop: 4, scale: 1.6, lit: 0.35 } },
    rain: { 4: { cells: [0, 2, 1, 3, 1, 3, 2, 4, 2, 4, 3, 5, 3, 5, 4, 6], loop: 4, scale: 1.2, lit: 0.35 } },
    pulse: { 4: { cells: [2, 1, 1, 2, 1, 0, 0, 1, 1, 0, 0, 1, 2, 1, 1, 2], loop: 2.4, scale: 2.5, lit: 0.45 } }
  };

  const DEFAULT_PATTERN = { 3: 'orbit', 4: 'sweep' };
  const MARKS = {
    3: { done: [2, 3, 5, 7], error: [0, 2, 4, 6, 8] },
    4: { done: [7, 8, 10, 13], error: [0, 3, 5, 6, 9, 10, 12, 15] }
  };

  const resolvePattern = (pattern, grid) => {
    if (typeof pattern === 'string') {
      const named = PATTERNS[pattern];
      return (named && named[grid]) || PATTERNS[DEFAULT_PATTERN[grid]][grid];
    }
    const cells = Array.from({ length: grid * grid }, (_, i) =>
      pattern.cells[i] !== undefined ? pattern.cells[i] : null
    );
    const max = Math.max(0, ...cells.filter((v) => v != null));
    return {
      cells,
      loop: pattern.loop ?? max + 4.2,
      scale: pattern.scale ?? 1,
      lit: pattern.lit ?? 0.62
    };
  };

  const fmt = (ds) =>
    ds < 600
      ? `${(ds / 10).toFixed(1)}s`
      : `${Math.floor(ds / 600)}m ${((ds % 600) / 10).toFixed(1)}s`;

  const spoken = (ds) =>
    ds < 600
      ? `${(ds / 10).toFixed(1)} seconds`
      : `${Math.floor(ds / 600)} minutes ${((ds % 600) / 10).toFixed(1)} seconds`;

  const defaults = {
    label: 'Thinking',
    doneLabel: 'Done in',
    errorLabel: 'Failed after',
    status: 'working',
    pattern: 'orbit',
    grid: 3,
    shape: 'round',
    color: 'currentColor',
    doneColor: '#22c55e',
    errorColor: '#ef4444',
    cellSize: 6,
    gap: 2,
    fontSize: 14,
    step: 90,
    idleOpacity: 0.15,
    glow: false,
    glowColor: '',
    showTimer: true,
    elapsed: null,
    className: '',
    style: null
  };

  function mountLatticeLoader(el, options) {
    if (!el) return null;
    const opts = { ...defaults, ...(options || {}) };
    const n = opts.grid === 4 ? 4 : 3;
    const pat = resolvePattern(opts.pattern, n);
    const marks = MARKS[n];
    const d = opts.step * pat.scale;
    const cycle = Math.round(pat.loop * d);

    let status = opts.status;
    let mark = status === 'working' ? 'done' : status;
    let ds = 0;
    let timerId = null;
    let timerEl = null;
    let announceEl = null;
    let root = null;

    const paint = (value) => {
      ds = value;
      if (timerEl) timerEl.textContent = fmt(ds);
    };

    const setAnnounce = (text) => {
      if (announceEl) announceEl.textContent = text;
    };

    const applyStatus = () => {
      if (!root) return;
      root.dataset.status = status;
      root.style.setProperty(
        '--ll-mark',
        status === 'error' ? opts.errorColor : opts.doneColor
      );
      root.style.setProperty(
        '--ll-mark-glow',
        opts.glowColor || (status === 'error' ? opts.errorColor : opts.doneColor)
      );

      root.querySelectorAll('.lattice-loader__text').forEach((node) => {
        const key = node.dataset.key;
        if (
          (key === 'working' && status === 'working') ||
          (key === 'done' && status === 'done') ||
          (key === 'error' && status === 'error')
        ) {
          node.setAttribute('data-active', '');
        } else {
          node.removeAttribute('data-active');
        }
      });

      const markLayer = root.querySelector('.lattice-loader__mark');
      if (markLayer) {
        const onSet = new Set(marks[mark] || marks.done);
        markLayer.querySelectorAll('.lattice-loader__cell').forEach((cell, i) => {
          if (onSet.has(i)) cell.setAttribute('data-on', '');
          else cell.removeAttribute('data-on');
        });
      }

      if (status === 'working') {
        setAnnounce(`${opts.label}, in progress`);
      } else {
        setAnnounce(
          `${status === 'done' ? opts.doneLabel : opts.errorLabel}${
            opts.showTimer ? ` ${spoken(ds)}` : ''
          }`
        );
      }
    };

    const stopTimer = () => {
      if (timerId != null) {
        clearInterval(timerId);
        timerId = null;
      }
    };

    const startTimer = () => {
      stopTimer();
      if (opts.elapsed != null) {
        paint(Math.round(opts.elapsed * 10));
        return;
      }
      if (status !== 'working') return;
      const startedAt = performance.now();
      paint(0);
      timerId = setInterval(() => {
        paint(Math.floor((performance.now() - startedAt) / 100));
      }, 100);
    };

    const build = () => {
      root = document.createElement('span');
      root.setAttribute('role', 'status');
      root.className = `lattice-loader${opts.className ? ` ${opts.className}` : ''}`;
      root.dataset.status = status;
      root.dataset.shape = opts.shape;
      if (opts.glow) root.setAttribute('data-glow', '');

      Object.assign(root.style, {
        '--ll-n': String(n),
        '--ll-cell': `${opts.cellSize}px`,
        '--ll-gap': `${opts.gap}px`,
        '--ll-font': `${opts.fontSize}px`,
        '--ll-color': opts.color,
        '--ll-mark': status === 'error' ? opts.errorColor : opts.doneColor,
        '--ll-idle': String(opts.idleOpacity),
        '--ll-glow': opts.glowColor || opts.color,
        '--ll-mark-glow':
          opts.glowColor || (status === 'error' ? opts.errorColor : opts.doneColor),
        '--ll-cycle': `${cycle}ms`,
        ...(opts.style || {})
      });

      const grid = document.createElement('span');
      grid.className = 'lattice-loader__grid';
      grid.setAttribute('aria-hidden', 'true');

      const run = document.createElement('span');
      run.className = 'lattice-loader__layer lattice-loader__run';
      pat.cells.forEach((unit) => {
        const cell = document.createElement('span');
        cell.className = 'lattice-loader__cell';
        if (unit == null) {
          cell.setAttribute('data-hole', '');
        } else {
          if (pat.lit && pat.lit !== 0.62) {
            cell.setAttribute('data-lit', String(Math.round(pat.lit * 100)));
          }
          cell.style.animationDelay = `${Math.round(unit * d)}ms`;
        }
        run.appendChild(cell);
      });

      const markLayer = document.createElement('span');
      markLayer.className = 'lattice-loader__layer lattice-loader__mark';
      const onSet = new Set(marks[mark] || marks.done);
      pat.cells.forEach((_, i) => {
        const cell = document.createElement('span');
        cell.className = 'lattice-loader__cell';
        if (onSet.has(i)) cell.setAttribute('data-on', '');
        markLayer.appendChild(cell);
      });

      grid.appendChild(run);
      grid.appendChild(markLayer);

      const labelWrap = document.createElement('span');
      labelWrap.className = 'lattice-loader__label';
      labelWrap.setAttribute('aria-hidden', 'true');

      const texts = [
        ['working', opts.label],
        ['done', opts.doneLabel],
        ['error', opts.errorLabel]
      ];
      texts.forEach(([key, text]) => {
        const span = document.createElement('span');
        span.className = 'lattice-loader__text';
        span.dataset.key = key;
        span.textContent = text;
        if (
          (key === 'working' && status === 'working') ||
          (key === 'done' && status === 'done') ||
          (key === 'error' && status === 'error')
        ) {
          span.setAttribute('data-active', '');
        }
        labelWrap.appendChild(span);
      });

      root.appendChild(grid);
      root.appendChild(labelWrap);

      if (opts.showTimer) {
        timerEl = document.createElement('span');
        timerEl.className = 'lattice-loader__timer';
        timerEl.setAttribute('aria-hidden', 'true');
        timerEl.textContent = '0.0s';
        root.appendChild(timerEl);
      }

      announceEl = document.createElement('span');
      announceEl.className = 'lattice-loader__sr';
      announceEl.textContent = `${opts.label}, in progress`;
      root.appendChild(announceEl);

      el.replaceChildren(root);
    };

    build();
    startTimer();
    applyStatus();

    return {
      el: root,
      setStatus(next) {
        if (next !== 'working' && next !== 'done' && next !== 'error') return;
        if (status === 'working' && next !== 'working') {
          mark = next;
        }
        status = next;
        if (status === 'working') mark = mark || 'done';
        else mark = status;
        applyStatus();
        if (status === 'working') startTimer();
        else stopTimer();
      },
      destroy() {
        stopTimer();
        el.replaceChildren();
      }
    };
  }

  const HERO_OPTIONS = {
    status: 'working',
    label: '进入我的影像世界',
    doneLabel: 'Done in',
    errorLabel: 'Failed after',
    pattern: 'orbit',
    grid: 4,
    shape: 'round',
    doneColor: '#22c55e',
    errorColor: '#ef4444',
    cellSize: 6,
    gap: 2,
    fontSize: 14,
    step: 90,
    idleOpacity: 0.15,
    glow: false,
    glowColor: '#0d63ed',
    showTimer: true,
    color: '#f5f5f5'
  };

  const autoMount = () => {
    document.querySelectorAll('[data-lattice-loader]').forEach((node) => {
      if (node.dataset.latticeMounted) return;
      node.dataset.latticeMounted = '1';
      const custom = {};
      if (node.dataset.status) custom.status = node.dataset.status;
      if (node.dataset.label) custom.label = node.dataset.label;
      if (node.dataset.pattern) custom.pattern = node.dataset.pattern;
      if (node.dataset.grid) custom.grid = Number(node.dataset.grid);
      mountLatticeLoader(node, { ...HERO_OPTIONS, ...custom });
    });
  };

  window.mountLatticeLoader = mountLatticeLoader;
  window.LatticeLoaderHeroOptions = HERO_OPTIONS;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMount, { once: true });
  } else {
    autoMount();
  }
})();
