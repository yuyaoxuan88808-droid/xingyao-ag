/* Full-bleed tiled starfield for the about section; mouse parallax, no card frame. */
(() => {
  'use strict';

  document.querySelectorAll('.about-section.galaxy-field').forEach((section) => {
    const canvas = section.querySelector('.galaxy-canvas');
    const ctx = canvas && canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const TAU = Math.PI * 2;
    let seed = 9061;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    // Dense flat starfield across the whole section.
    const fieldStars = Array.from({ length: 420 }, () => ({
      x: random(),
      y: random(),
      size: .2 + Math.pow(random(), 2.4) * 1.55,
      alpha: .12 + random() * .55,
      warm: random() > .72,
      depth: .25 + random() * .75,
      twinkle: random() * TAU
    }));

    // Soft spiral arms remain as ambient glow, not a framed object.
    const arms = Array.from({ length: 520 }, (_, i) => {
      const radius = Math.pow(random(), .68);
      return {
        radius,
        angle: (i % 4) * Math.PI / 2 + radius * 5.4 + (random() - .5) * (.21 + radius * .55),
        height: (random() - .5) * .075 * (1 - radius * .3),
        size: .2 + Math.pow(random(), 4) * 1.2,
        alpha: .16 + random() * .55,
        warm: random() > .68,
        depth: .4 + random() * .6
      };
    });
    const glints = arms.filter((star, i) => i % 72 === 0 && star.radius > .26);
    const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, strength: 0, targetStrength: 0 };
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let lastTime = 0;
    let phase = 0;
    let visible = false;

    const drawHalo = (x, y, radius, stops) => {
      const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
      stops.forEach(([position, color]) => glow.addColorStop(position, color));
      ctx.fillStyle = glow;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    };

    const projectArm = (star, centerX, centerY, orbitRadius, rotation) => {
      const angle = star.angle + rotation;
      const x = Math.cos(angle) * star.radius * orbitRadius;
      const y = Math.sin(angle) * star.radius * orbitRadius * .38 + star.height * orbitRadius;
      const tilt = -.37;
      let px = centerX + x * Math.cos(tilt) - y * Math.sin(tilt) + pointer.x * 18 * star.depth;
      let py = centerY + x * Math.sin(tilt) + y * Math.cos(tilt) + pointer.y * 14 * star.depth;
      const dx = width * (.5 + pointer.x * .5) - px;
      const dy = height * (.42 + pointer.y * .4) - py;
      const influence = Math.max(0, 1 - Math.hypot(dx, dy) / (width * .5)) * pointer.strength;
      px += dx * influence * .04;
      py += dy * influence * .04;
      return [px, py];
    };

    function render() {
      if (!width || !height) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      // Tiled starfield with depth parallax following the pointer.
      fieldStars.forEach((star) => {
        const driftX = pointer.x * 28 * star.depth;
        const driftY = pointer.y * 20 * star.depth;
        const x = ((star.x * width + driftX) % width + width) % width;
        const y = ((star.y * height + driftY) % height + height) % height;
        const twinkle = .75 + .25 * Math.sin(phase * 1.4 + star.twinkle);
        const a = star.alpha * twinkle * (0.65 + pointer.strength * .2);
        ctx.fillStyle = star.warm
          ? `rgba(235,212,166,${a})`
          : `rgba(220,226,230,${a})`;
        if (star.size > 1.05) {
          ctx.beginPath();
          ctx.arc(x, y, star.size, 0, TAU);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, star.size, star.size);
        }
      });

      const centerX = width * .32 + pointer.x * 22;
      const centerY = height * .48 + pointer.y * 14;
      const orbitRadius = Math.min(width, height) * .72;
      const rotation = phase * .02;
      ctx.globalCompositeOperation = 'screen';
      drawHalo(centerX, centerY, orbitRadius * 1.05, [
        [0, 'rgba(224,207,165,.1)'], [.25, 'rgba(186,174,144,.06)'],
        [.55, 'rgba(119,133,126,.03)'], [1, 'rgba(0,0,0,0)']
      ]);

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-.37);
      ctx.scale(1, .38);
      drawHalo(0, 0, orbitRadius * .95, [
        [0, 'rgba(244,231,201,.16)'], [.18, 'rgba(199,184,149,.08)'],
        [.55, 'rgba(182,174,155,.025)'], [1, 'rgba(0,0,0,0)']
      ]);
      for (let arm = 0; arm < 4; arm += 1) {
        ctx.beginPath();
        for (let step = 3; step < 95; step += 1) {
          const r = step / 100;
          const a = arm * Math.PI / 2 + r * 5.4 + rotation;
          const x = Math.cos(a) * r * orbitRadius;
          const y = Math.sin(a) * r * orbitRadius;
          if (step === 3) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = 'rgba(210,199,170,.05)';
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(246,232,200,.06)';
        ctx.lineWidth = .6;
        ctx.stroke();
      }
      ctx.restore();

      arms.forEach((star) => {
        const [x, y] = projectArm(star, centerX, centerY, orbitRadius, rotation);
        if (x < -20 || y < -20 || x > width + 20 || y > height + 20) return;
        ctx.fillStyle = star.warm
          ? `rgba(235,212,166,${star.alpha})`
          : `rgba(227,233,227,${star.alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, star.size, 0, TAU);
        ctx.fill();
      });

      glints.forEach((star) => {
        const [x, y] = projectArm(star, centerX, centerY, orbitRadius, rotation);
        if (x < -10 || y < -10 || x > width + 10 || y > height + 10) return;
        const r = 5 + star.size * 3.5;
        drawHalo(x, y, r, [[0, 'rgba(255,249,222,.42)'], [.15, 'rgba(240,229,191,.12)'], [1, 'rgba(0,0,0,0)']]);
        ctx.strokeStyle = 'rgba(244,237,211,.16)';
        ctx.lineWidth = .5;
        ctx.beginPath();
        ctx.moveTo(x - 3, y); ctx.lineTo(x + 3, y);
        ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 4);
        ctx.stroke();
      });

      drawHalo(centerX, centerY, orbitRadius * .22, [
        [0, 'rgba(255,252,239,.7)'], [.08, 'rgba(255,245,216,.35)'],
        [.22, 'rgba(245,226,183,.12)'], [.5, 'rgba(223,198,148,.04)'], [1, 'rgba(0,0,0,0)']
      ]);
      if (pointer.strength > .01) {
        drawHalo(
          width * (.5 + pointer.x * .45),
          height * (.45 + pointer.y * .4),
          Math.max(width, height) * .22,
          [[0, `rgba(213,217,196,${.05 * pointer.strength})`], [1, 'rgba(0,0,0,0)']]
        );
      }
      ctx.globalCompositeOperation = 'source-over';
    }

    function tick(time) {
      frame = 0;
      if (!visible || document.hidden || reducedMotion.matches) return;
      const elapsed = Math.min((time - (lastTime || time)) / 1000, .05);
      lastTime = time;
      phase += elapsed;
      const ease = 1 - Math.exp(-elapsed * 6);
      pointer.x += (pointer.targetX - pointer.x) * ease;
      pointer.y += (pointer.targetY - pointer.y) * ease;
      pointer.strength += (pointer.targetStrength - pointer.strength) * ease;
      render();
      frame = window.requestAnimationFrame(tick);
    }

    function updatePlayback() {
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      if (visible && !document.hidden && !reducedMotion.matches) frame = window.requestAnimationFrame(tick);
      else if (reducedMotion.matches && visible && !document.hidden) render();
    }

    function resize() {
      const rect = section.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      render();
    }

    function move(event) {
      if (reducedMotion.matches) return;
      const rect = section.getBoundingClientRect();
      pointer.targetX = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - .5) * 2));
      pointer.targetY = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - .5) * 2));
      pointer.targetStrength = event.pointerType === 'touch' ? .5 : 1;
    }
    function leave() {
      pointer.targetX = 0;
      pointer.targetY = 0;
      pointer.targetStrength = 0;
    }

    section.addEventListener('pointermove', move, { passive: true });
    section.addEventListener('pointerdown', move, { passive: true });
    section.addEventListener('pointerleave', leave, { passive: true });
    section.addEventListener('pointercancel', leave, { passive: true });
    section.addEventListener('pointerup', (event) => { if (event.pointerType !== 'mouse') leave(); }, { passive: true });
    document.addEventListener('visibilitychange', updatePlayback);
    reducedMotion.addEventListener('change', () => {
      leave();
      if (reducedMotion.matches) { pointer.x = 0; pointer.y = 0; pointer.strength = 0; }
      updatePlayback();
    });
    new ResizeObserver(resize).observe(section);
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      updatePlayback();
    }, { threshold: 0, rootMargin: '50px' }).observe(section);
    resize();
  });
})();
