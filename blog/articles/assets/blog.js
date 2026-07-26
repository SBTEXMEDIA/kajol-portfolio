/* ══════════════════════════════════════════════════════════════
   SBTEXMEDIA — BLOG SYSTEM JAVASCRIPT
   /blog/assets/blog.js

   REQUIRES /assets/shared.js TO BE LOADED FIRST.
   shared.js provides the cursor, nav, mobile menu, theme toggle,
   scroll reveal, back-to-top, reading progress and SBTEX.showToast.
   This file adds ONLY blog behaviour. Nothing is duplicated.

   Load order in every blog page:
     <script src="/assets/shared.js" defer></script>
     <script src="/blog/assets/blog.js" defer></script>
══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const toast = (t, m) => (window.SBTEX && window.SBTEX.showToast)
    ? window.SBTEX.showToast(t, m) : null;

  /* ═════════════════════════════════════════════
     BLOG HOME — search, category filter, pagination
  ═════════════════════════════════════════════ */
  const grid = document.getElementById('postsGrid');
  if (grid) {
    const cards       = Array.from(grid.querySelectorAll('.post-card'));
    const searchInput = document.getElementById('blogSearch');
    const catBtns     = Array.from(document.querySelectorAll('.cat-btn'));
    const pager       = document.getElementById('pagination');
    const noResults   = document.getElementById('noResults');
    const PER_PAGE    = parseInt(grid.dataset.perPage || '6', 10);

    let activeCat = 'all', query = '', page = 1;

    function matches(card) {
      const cat = (card.dataset.category || '').toLowerCase();
      const hay = ((card.dataset.title || '') + ' ' + (card.dataset.tags || '') + ' ' + cat).toLowerCase();
      return (activeCat === 'all' || cat === activeCat) && (!query || hay.includes(query));
    }

    function render() {
      const visible = cards.filter(matches);
      const pages   = Math.max(1, Math.ceil(visible.length / PER_PAGE));
      if (page > pages) page = pages;

      cards.forEach(c => { c.style.display = 'none'; });
      visible.slice((page - 1) * PER_PAGE, page * PER_PAGE)
             .forEach(c => { c.style.display = ''; });

      if (noResults) noResults.style.display = visible.length ? 'none' : 'block';
      buildPager(pages, visible.length);
    }

    function buildPager(pages, total) {
      if (!pager) return;
      pager.innerHTML = '';
      if (total <= PER_PAGE) return;

      const mk = (label, target, opts) => {
        opts = opts || {};
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'page-btn' + (opts.active ? ' active' : '');
        b.textContent = label;
        if (opts.disabled) b.disabled = true;
        if (opts.label)    b.setAttribute('aria-label', opts.label);
        if (opts.active)   b.setAttribute('aria-current', 'page');
        b.addEventListener('click', () => {
          page = target; render();
          grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
        pager.appendChild(b);
      };

      mk('←', page - 1, { disabled: page === 1, label: 'Previous page' });
      for (let i = 1; i <= pages; i++) mk(String(i), i, { active: i === page, label: 'Page ' + i });
      mk('→', page + 1, { disabled: page === pages, label: 'Next page' });
    }

    if (searchInput) {
      let debounce;
      searchInput.addEventListener('input', function () {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          query = this.value.trim().toLowerCase();
          page = 1; render();
        }, 180);
      });
    }

    catBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        catBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        activeCat = (btn.dataset.filter || 'all').toLowerCase();
        page = 1; render();
      });
    });

    render();
  }

  /* ─────────────────────────────────────────────
     NEWSLETTER (Formspree — same endpoint as site)
  ───────────────────────────────────────────── */
  const news = document.getElementById('newsletterForm');
  if (news) {
    news.addEventListener('submit', async function (e) {
      e.preventDefault();
      const btn = news.querySelector('button');
      const original = btn.textContent;
      btn.disabled = true; btn.textContent = 'Subscribing...';
      try {
        const res = await fetch(news.action, {
          method: 'POST',
          body: new FormData(news),
          headers: { Accept: 'application/json' }
        });
        if (!res.ok) throw new Error();
        toast('✓ Subscribed!', "You'll get new articles straight to your inbox.");
        news.reset();
      } catch (err) {
        toast('✕ Something went wrong', 'Please try again or email me directly.');
      } finally {
        btn.disabled = false; btn.textContent = original;
      }
    });
  }

  /* ═════════════════════════════════════════════
     ARTICLE PAGE — TOC, FAQ, share, reading time
  ═════════════════════════════════════════════ */
  const prose   = document.querySelector('.prose');
  const tocList = document.getElementById('tocList');

  /* Auto-build Table of Contents from H2/H3 */
  if (tocList && prose) {
    const heads = prose.querySelectorAll('h2, h3');
    let n = 0;

    heads.forEach(h => {
      if (!h.id) {
        h.id = (h.textContent || '').toLowerCase().trim()
          .replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').slice(0, 60) || 'section-' + (++n);
      }
      const li = document.createElement('li');
      li.className = 'lvl-' + h.tagName.charAt(1);
      const a = document.createElement('a');
      a.href = '#' + h.id;
      a.textContent = h.textContent;
      li.appendChild(a);
      tocList.appendChild(li);
    });

    const links = Array.from(tocList.querySelectorAll('a'));
    if (heads.length) {
      const so = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + en.target.id));
        });
      }, { rootMargin: '-90px 0px -70% 0px', threshold: 0 });
      heads.forEach(h => so.observe(h));
    }
  }

  /* FAQ accordion */
  document.querySelectorAll('.faq-item').forEach(item => {
    const q = item.querySelector('.faq-q');
    const a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.setAttribute('aria-expanded', 'false');
    q.addEventListener('click', () => {
      const open = item.classList.toggle('open');
      q.setAttribute('aria-expanded', open ? 'true' : 'false');
      a.style.maxHeight = open ? a.scrollHeight + 'px' : '0px';
    });
  });

  /* Share buttons */
  const shareBar = document.querySelector('.share-bar');
  if (shareBar) {
    const url   = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);
    const targets = {
      facebook: 'https://www.facebook.com/sharer/sharer.php?u=' + url,
      x:        'https://twitter.com/intent/tweet?url=' + url + '&text=' + title,
      linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + url,
      whatsapp: 'https://wa.me/?text=' + title + '%20' + url
    };
    shareBar.querySelectorAll('[data-share]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.share;
        if (key === 'copy') {
          navigator.clipboard.writeText(window.location.href)
            .then(() => toast('✓ Link copied', 'Article URL is on your clipboard.'))
            .catch(() => toast('✕ Copy failed', 'Please copy the URL manually.'));
          return;
        }
        if (targets[key]) window.open(targets[key], '_blank', 'noopener,noreferrer,width=620,height=560');
      });
    });
  }

  /* Reading time — auto-calculated when left empty */
  const rt = document.getElementById('readingTime');
  if (rt && prose && !rt.textContent.trim()) {
    const words = (prose.innerText || '').trim().split(/\s+/).length;
    rt.textContent = Math.max(1, Math.round(words / 200)) + ' min read';
  }
})();
