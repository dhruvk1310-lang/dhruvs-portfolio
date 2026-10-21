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

  // Scroll reveal
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || reduceMotion) {
    items.forEach(item => item.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('visible'), i * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  items.forEach(item => observer.observe(item));
})();
