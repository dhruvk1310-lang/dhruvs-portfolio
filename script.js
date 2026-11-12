(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Custom cursor, only for a real mouse or trackpad
  const cursor = document.getElementById('cursor');
  const ring = document.getElementById('cursor-ring');
  if (cursor && ring && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    let mx = 0, my = 0, rx = 0, ry = 0, seen = false;
    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      if (!seen) { seen = true; rx = mx; ry = my; document.body.classList.add('has-cursor'); }
    });
    function animateCursor() {
      cursor.style.left = mx + 'px';
      cursor.style.top = my + 'px';
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
      requestAnimationFrame(animateCursor);
    }
    animateCursor();
  }

  // Scramble text on the home page name
  const el = document.getElementById('scramble');
  if (el && !reduceMotion) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const original = el.textContent;
    let frame = 0;
    function scramble() {
      el.textContent = original.split('').map((char, i) => {
        if (i < frame / 3) return char;
        return chars[Math.floor(Math.random() * chars.length)];
      }).join('');
      frame++;
      if (frame < original.length * 3) requestAnimationFrame(scramble);
      else el.textContent = original;
    }
    setTimeout(scramble, 300);
  }

  // Home tiles: spotlight follows the cursor
  document.querySelectorAll('.tile').forEach(tile => {
    tile.addEventListener('pointermove', e => {
      const r = tile.getBoundingClientRect();
      tile.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      tile.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  // Projects: filter by tool
  const chips = document.querySelectorAll('.chip-btn');
  if (chips.length) {
    const cards = Array.from(document.querySelectorAll('.project-card[data-tools]'));
    const status = document.getElementById('filter-status');
    const allText = status.textContent;
    chips.forEach(chip => chip.addEventListener('click', () => {
      const f = chip.dataset.filter;
      chips.forEach(c => c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'));
      let shown = 0;
      cards.forEach(card => {
        const match = f === 'all' || card.dataset.tools.split(' ').includes(f);
        card.hidden = !match;
        if (match) { shown++; card.classList.add('visible'); }
      });
      const name = chip.firstChild.textContent.trim();
      status.textContent = f === 'all' ? allText
        : `Showing ${shown} of ${cards.length} projects that use ${name}.`;
    }));
  }

  // Projects: hover or tap a bar to see the detail behind it
  document.querySelectorAll('.result-chart').forEach(fig => {
    const note = fig.querySelector('.rc-note');
    const rows = fig.querySelector('.rc-rows');
    const active = () => rows.querySelector('.rc-row.is-active');
    const restore = () => { const a = active(); note.textContent = a ? a.dataset.note : note.dataset.default; };
    fig.querySelectorAll('.rc-row').forEach(row => {
      row.addEventListener('mouseenter', () => { note.textContent = row.dataset.note; });
      row.addEventListener('click', () => {
        const turnOn = !row.classList.contains('is-active');
        rows.querySelectorAll('.rc-row').forEach(r => r.classList.remove('is-active'));
        rows.classList.toggle('has-active', turnOn);
        if (turnOn) row.classList.add('is-active');
        restore();
      });
    });
    rows.addEventListener('mouseleave', restore);
  });

  // Experience: career chart
  const detail = document.querySelector('.cc-detail');
  if (detail) {
    const bars = document.querySelectorAll('.cc-bar');
    const show = bar => {
      bars.forEach(b => b.classList.toggle('is-active', b === bar));
      detail.textContent = bar ? bar.dataset.detail : detail.dataset.default;
    };
    bars.forEach(bar => {
      bar.addEventListener('mouseenter', () => show(bar));
      bar.addEventListener('focus', () => show(bar));
      bar.addEventListener('click', () => {
        show(bar);
        const target = bar.dataset.target && document.getElementById(bar.dataset.target);
        if (!target) return;
        target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
        target.classList.add('is-flash');
        setTimeout(() => target.classList.remove('is-flash'), 1600);
      });
    });
    document.querySelector('.cc-plot').addEventListener('mouseleave', () => show(null));
  }

  // Skills: show where each skill is used
  const mapEl = document.getElementById('skill-map');
  if (mapEl) {
    const map = JSON.parse(mapEl.textContent);
    const panel = document.getElementById('skill-panel');
    const title = panel.querySelector('.skill-panel-title');
    const list = panel.querySelector('.skill-panel-list');
    const buttons = document.querySelectorAll('.skill-btn');
    buttons.forEach(btn => btn.addEventListener('click', () => {
      const skill = map[btn.dataset.skill];
      if (!skill) return;
      buttons.forEach(b => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
      title.textContent = skill.name;
      list.replaceChildren(...skill.items.map(item => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = item.href;
        a.textContent = item.title + (item.ext ? ' ↗' : '');
        if (item.ext) { a.target = '_blank'; a.rel = 'noopener'; }
        const kind = document.createElement('span');
        kind.textContent = item.kind;
        li.append(a, kind);
        return li;
      }));
      panel.classList.add('visible');
      const r = panel.getBoundingClientRect();
      if (r.top > window.innerHeight - 80 || r.bottom < 0) {
        panel.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest' });
      }
    }));
  }

  // Copy buttons (citations, email)
  document.querySelectorAll('.copy-btn').forEach(btn => {
    const label = btn.textContent;
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      try {
        await navigator.clipboard.writeText(text);
        btn.textContent = btn.dataset.done;
        btn.classList.add('is-done');
        setTimeout(() => { btn.textContent = label; btn.classList.remove('is-done'); }, 1800);
      } catch (err) {
        const scope = btn.closest('article') || btn.closest('main');
        const fallback = scope && scope.querySelector('.copy-fallback');
        if (!fallback) return;
        fallback.textContent = text;
        fallback.hidden = false;
        const range = document.createRange();
        range.selectNodeContents(fallback);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    });
  });

  // Scroll reveal
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduceMotion) {
    items.forEach(item => item.classList.add('visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => entry.target.classList.add('visible'), i * 80);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    items.forEach(item => observer.observe(item));
  }
})();
