/* ══════════════════════════════════════════════════════════════
   SBTEXMEDIA — SHARED SHELL JAVASCRIPT
   /assets/shared.js

   Loaded FIRST by every sub-system page (/blog/, /gallery/,
   /case-studies/, /resources/ …). Provides the behaviours every
   page shares: custom cursor, nav scroll, mobile menu, theme
   toggle, scroll reveal, back-to-top, reading progress and a
   toast helper.

   The homepage (/index.html) does NOT load this file — it keeps
   its own inline JavaScript untouched. Behaviour here mirrors it.

   Every block self-detects its elements, so this file is safe to
   include on any page regardless of which elements exist.

   Exposes: window.SBTEX.showToast(title, message)
            window.SBTEX.onScroll(fn)   ← register extra handlers
══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  window.SBTEX = window.SBTEX || {};

  /* ─────────────────────────────────────────────
     1. CUSTOM CURSOR
  ───────────────────────────────────────────── */
  const dot  = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');

  if (dot && ring && window.matchMedia('(min-width: 601px)').matches) {
    let mx = 0, my = 0, rx = 0, ry = 0;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
    });

    (function loop() {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(loop);
    })();

    document.addEventListener('mousedown', () => dot.classList.add('clicking'));
    document.addEventListener('mouseup',   () => dot.classList.remove('clicking'));

    /* Systems can extend this list via data-cursor-hover on any element */
    const hoverables = 'a, button, [data-cursor-hover], .post-card, .service-chip, .cat-btn, .faq-item';
    document.querySelectorAll(hoverables).forEach(el => {
      el.addEventListener('mouseenter', () => ring.classList.add('hovered'));
      el.addEventListener('mouseleave', () => ring.classList.remove('hovered'));
    });
  }

  /* ─────────────────────────────────────────────
     2. SCROLL — nav state, back-to-top, progress
     Single listener; other systems hook in via
     SBTEX.onScroll() instead of adding their own.
  ───────────────────────────────────────────── */
  const navbar    = document.getElementById('navbar');
  const backToTop = document.getElementById('backToTop');
  const progress  = document.getElementById('readProgress');
  const scrollFns = [];

  window.SBTEX.onScroll = fn => { if (typeof fn === 'function') scrollFns.push(fn); };

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (navbar)    navbar.classList.toggle('scrolled', y > 60);
    if (backToTop) backToTop.classList.toggle('visible', y > 600);
    if (progress) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
    scrollFns.forEach(fn => fn(y));
  }, { passive: true });

  if (backToTop) {
    backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ─────────────────────────────────────────────
     3. MOBILE MENU
  ───────────────────────────────────────────── */
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (hamburger && mobileMenu) {
    const bars = hamburger.querySelectorAll('span');

    const setBars = open => {
      if (open) {
        bars[0].style.transform = 'rotate(45deg) translate(4px, 4px)';
        bars[1].style.opacity   = '0';
        bars[2].style.transform = 'rotate(-45deg) translate(4px, -4px)';
      } else {
        bars.forEach(b => { b.style.transform = ''; b.style.opacity = ''; });
      }
    };

    hamburger.addEventListener('click', () => {
      setBars(mobileMenu.classList.toggle('open'));
    });

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        setBars(false);
      });
    });

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        mobileMenu.classList.remove('open');
        setBars(false);
      }
    });
  }

  /* ─────────────────────────────────────────────
     4. DARK / LIGHT MODE
  ───────────────────────────────────────────── */
  const modeBtn = document.getElementById('modeToggle');
  if (modeBtn) {
    let isDark = true;
    modeBtn.addEventListener('click', () => {
      isDark = !isDark;
      document.body.classList.toggle('light-mode', !isDark);
      modeBtn.textContent = isDark ? '🌙' : '☀️';
    });
  }

  /* ─────────────────────────────────────────────
     5. SCROLL REVEAL
  ───────────────────────────────────────────── */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const ro = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('revealed'); ro.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach(el => ro.observe(el));
  }

  /* ─────────────────────────────────────────────
     6. TOAST — shared by every system
  ───────────────────────────────────────────── */
  window.SBTEX.showToast = function (title, msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    const tt = t.querySelector('.toast-title');
    const tm = t.querySelector('.toast-msg');
    if (tt) tt.textContent = title;
    if (tm) tm.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 4000);
  };
})();
