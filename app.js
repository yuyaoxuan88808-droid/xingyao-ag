(() => {
  'use strict';
  const profileUrl = 'https://www.liblib.art/userpage/9d8925c591a643bbad8ca8cfbb87922c/publish/libtv';
  const data = window.PORTFOLIO_DATA || {};
  const safeUrl = (value, fallback = '') => {
    if (typeof value !== 'string' || !value.trim()) return fallback;
    try {
      const parsed = new URL(value, window.location.href);
      return ['http:', 'https:', 'file:'].includes(parsed.protocol) ? parsed.href : fallback;
    } catch (_) { return fallback; }
  };
  const normalizeWorks = (items, limit) => (Array.isArray(items) ? items : [])
    .filter(work => work && typeof work.title === 'string' && work.title.trim())
    .slice(0, limit)
    .map(work => ({
      title: work.title.trim(),
      category: typeof work.category === 'string' && work.category.trim() ? work.category.trim() : '影像作品',
      cover: safeUrl(work.cover),
      previewVideo: safeUrl(work.previewVideo),
      coverType: typeof work.coverType === 'string' ? work.coverType : '',
      url: safeUrl(work.url, profileUrl),
      description: typeof work.description === 'string' ? work.description.trim() : ''
    }));
  const works = normalizeWorks(data.works, 12);
  const videoWorks = normalizeWorks(data.videoClips, 8);

  document.getElementById('current-year').textContent = String(new Date().getFullYear());
  const menuToggle = document.querySelector('.menu-toggle');
  const mainNav = document.getElementById('main-nav');
  const closeMenu = () => {
    menuToggle.setAttribute('aria-expanded', 'false');
    mainNav.classList.remove('open');
  };
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    menuToggle.setAttribute('aria-expanded', String(open));
    mainNav.classList.toggle('open', open);
  });
  mainNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) closeMenu();
  });

  const heroImage = document.getElementById('hero-image');
  const heroArt = document.getElementById('hero-art');
  const heroSrc = './assets/aster-yu-director.png?v=2';
  if (heroSrc) {
    heroImage.addEventListener('load', () => { heroImage.hidden = false; heroArt.classList.add('has-image'); });
    heroImage.addEventListener('error', () => { heroImage.hidden = true; heroArt.classList.remove('has-image'); });
    heroImage.src = heroSrc;
  }

  const grid = document.getElementById('work-grid');
  const count = document.getElementById('works-count');
  const dialog = document.getElementById('work-dialog');
  const dialogImage = document.getElementById('dialog-image');
  const dialogImageWrap = dialogImage.parentElement;
  let lastTrigger = null;

  const closeDialog = () => {
    if (dialog.open) dialog.close();
  };
  dialog.querySelector('.dialog-close').addEventListener('click', closeDialog);
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus({ preventScroll: true });
  });
  dialogImage.addEventListener('error', () => { dialogImageWrap.classList.add('image-failed'); });

  function openWork(work, trigger) {
    lastTrigger = trigger;
    document.getElementById('dialog-title').textContent = work.title;
    document.getElementById('dialog-category').textContent = work.category + ' / XINGYAO AG';
    const description = document.getElementById('dialog-description');
    description.textContent = work.description;
    description.hidden = !work.description;
    document.getElementById('dialog-link').href = work.url;
    dialogImageWrap.classList.toggle('image-failed', !work.cover);
    dialogImage.alt = work.title + '作品封面';
    if (work.cover) dialogImage.src = work.cover;
    else dialogImage.removeAttribute('src');
    dialog.showModal();
    document.body.classList.add('modal-open');
  }

  let destroyCarousel = () => {};

  function whenFlexReady() {
    if (typeof window.mountFlexCarousel === 'function') return Promise.resolve(window.mountFlexCarousel);
    return new Promise((resolve) => {
      const done = () => resolve(window.mountFlexCarousel);
      window.addEventListener('flex-carousel-ready', done, { once: true });
      // Safety timeout — fall back to null
      window.setTimeout(() => {
        window.removeEventListener('flex-carousel-ready', done);
        resolve(window.mountFlexCarousel || null);
      }, 4000);
    });
  }

  function renderWorks() {
    destroyCarousel();
    grid.replaceChildren();
    const clipCount = videoWorks.length;
    const workCount = works.length;
    count.textContent = String(clipCount).padStart(2, '0') + ' 段影像 · ' + String(workCount).padStart(2, '0') + ' 部代表作';
    grid.classList.add('work-carousel');
    grid.setAttribute('role', 'region');
    grid.setAttribute('aria-roledescription', '作品展示');
    grid.setAttribute('aria-label', '影像轮播与代表作');
    if (!clipCount && !workCount) return;

    const events = new AbortController();
    const listen = (target, type, handler, options = {}) => {
      target.addEventListener(type, handler, { ...options, signal: events.signal });
    };
    const make = (tag, className, text) => {
      const element = document.createElement(tag);
      element.className = className;
      if (text !== undefined) element.textContent = text;
      return element;
    };
    const makeButton = (className, label, text) => {
      const button = make('button', className, text);
      button.type = 'button';
      button.setAttribute('aria-label', label);
      return button;
    };

    // —— Primary: liquid FlexCarousel video reel ——
    const flexSection = make('section', 'works-flex');
    flexSection.setAttribute('aria-label', '作品画面 · 影像轮播');
    const flexHeader = make('div', 'works-flex-header');
    const flexIntro = make('div', 'works-flex-intro');
    flexIntro.append(
      make('span', 'works-flex-eyebrow', 'VIDEO REEL / 作品画面'),
      make('h3', 'works-flex-title', '作品画面。')
    );
    const flexNote = make('p', 'works-flex-note', '拖拽或滚轮浏览 · 点击聚焦 · 完整作品见 Liblib');
    flexHeader.append(flexIntro, flexNote);
    const shell = make('div', 'works-flex-shell');
    const mountEl = make('div', 'flex-carousel');
    mountEl.id = 'works-flex-carousel';
    shell.append(mountEl);
    flexSection.append(flexHeader, shell);
    grid.append(flexSection);

    const flexItems = videoWorks.map((work) => ({
      src: work.cover || '',
      video: work.previewVideo || '',
      title: work.title,
      alt: work.title + '影像预览',
      subtitle: work.category || '视频片段',
      url: work.url,
      description: work.description,
      coverType: work.coverType,
      category: work.category,
      cover: work.cover,
      previewVideo: work.previewVideo
    }));

    let flexApi = null;

    const mountFallback = () => {
      mountEl.remove();
      const fallback = make('div', 'works-flex-fallback');
      fallback.setAttribute('role', 'list');
      videoWorks.forEach((work, index) => {
        const card = make('div', 'works-flex-fallback-card');
        card.setAttribute('role', 'listitem');
        if (work.previewVideo) {
          const video = make('video');
          video.muted = true;
          video.loop = true;
          video.playsInline = true;
          video.setAttribute('playsinline', '');
          video.preload = index === 0 ? 'metadata' : 'none';
          video.src = work.previewVideo;
          if (work.cover) video.poster = work.cover;
          listen(card, 'pointerenter', () => video.play().catch(() => {}));
          listen(card, 'pointerleave', () => video.pause());
          card.append(video);
        } else if (work.cover) {
          const img = make('img');
          img.src = work.cover;
          img.alt = work.title;
          card.append(img);
        }
        card.append(make('span', '', work.title));
        listen(card, 'click', () => openWork(work, card));
        fallback.append(card);
      });
      shell.append(fallback);
    };

    whenFlexReady().then((mountFlexCarousel) => {
      if (!mountFlexCarousel || !flexItems.length) {
        if (flexItems.length) mountFallback();
        return;
      }
      try {
        flexApi = mountFlexCarousel(mountEl, {
          items: flexItems,
          preset: 'liquid',
          intro: 'rise',
          cardHeight: 0.5,
          gap: 12,
          squeeze: 0.2,
          focusOnClick: true,
          captions: false,
          fit: 'natural',
          radius: 0,
          captureWheel: true,
          autoplay: false,
          ariaLabel: '星曜AG 影像轮播',
          onSelect: (index, item) => {
            const work = videoWorks[index] || item;
            if (work) openWork({
              title: work.title,
              category: work.category || '视频片段',
              cover: work.cover || work.src,
              previewVideo: work.previewVideo || work.video,
              url: work.url || profileUrl,
              description: work.description || '',
              coverType: work.coverType || ''
            }, mountEl);
          }
        });
        if (!mountEl.querySelector('canvas')) {
          if (flexApi && flexApi.destroy) flexApi.destroy();
          flexApi = null;
          mountFallback();
          return;
        }
      } catch (err) {
        console.warn('[works] FlexCarousel failed, using fallback', err);
        mountFallback();
      }
    });

    // —— Secondary: compact named-work posters (no second video UI) ——
    if (works.length) {
      const posters = make('section', 'works-poster-strip');
      posters.setAttribute('aria-label', '代表作海报');
      const top = make('div', 'works-poster-topline');
      top.append(
        make('span', '', 'FEATURED POSTERS / 代表作'),
        make('span', '', '点击查看详情')
      );
      const track = make('div', 'works-poster-track');
      works.forEach((work, index) => {
        const card = makeButton('works-poster-card', '查看作品：' + work.title);
        if (work.cover) {
          const img = make('img');
          img.src = work.cover;
          img.alt = work.title + '海报';
          img.loading = index < 2 ? 'eager' : 'lazy';
          img.decoding = 'async';
          listen(img, 'error', () => { img.style.opacity = '0.3'; });
          card.append(img);
        }
        card.append(make('strong', '', work.title), make('small', '', work.category));
        listen(card, 'click', () => openWork(work, card));
        track.append(card);
      });
      posters.append(top, track);
      grid.append(posters);

      // Mobile: single-row poster auto-carousel (pause on user interaction)
      let posterTimer = 0;
      let posterPausedUntil = 0;
      const mobilePosterMq = window.matchMedia('(max-width: 720px)');
      const cardStep = () => {
        const card = track.querySelector('.works-poster-card');
        if (!card) return 240;
        const style = window.getComputedStyle(track);
        const gap = parseFloat(style.columnGap || style.gap) || 12;
        return card.getBoundingClientRect().width + gap;
      };
      const advancePoster = () => {
        if (!mobilePosterMq.matches) return;
        if (performance.now() < posterPausedUntil) return;
        if (document.hidden) return;
        const max = track.scrollWidth - track.clientWidth;
        if (max <= 4) return;
        const step = cardStep();
        const next = track.scrollLeft + step;
        if (next >= max - 2) {
          track.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          track.scrollBy({ left: step, behavior: 'smooth' });
        }
      };
      const pausePoster = (ms = 4500) => {
        posterPausedUntil = performance.now() + ms;
      };
      const startPosterAuto = () => {
        window.clearInterval(posterTimer);
        posterTimer = 0;
        if (!mobilePosterMq.matches) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        posterTimer = window.setInterval(advancePoster, 3200);
      };
      listen(track, 'pointerdown', () => pausePoster(5000));
      listen(track, 'touchstart', () => pausePoster(5000), { passive: true });
      listen(track, 'wheel', () => pausePoster(4000), { passive: true });
      listen(document, 'visibilitychange', () => {
        if (document.hidden) pausePoster(1000);
      });
      if (typeof mobilePosterMq.addEventListener === 'function') {
        mobilePosterMq.addEventListener('change', startPosterAuto);
        events.signal.addEventListener('abort', () => {
          mobilePosterMq.removeEventListener('change', startPosterAuto);
        });
      }
      startPosterAuto();
      events.signal.addEventListener('abort', () => {
        window.clearInterval(posterTimer);
        posterTimer = 0;
      });
    }

    destroyCarousel = () => {
      events.abort();
      if (flexApi && typeof flexApi.destroy === 'function') {
        try { flexApi.destroy(); } catch (_) {}
      }
      flexApi = null;
    };
  }

  if (works.length || videoWorks.length) {
    const empty = document.getElementById('works-empty');
    if (empty) empty.hidden = true;
    renderWorks();
  }
})();
