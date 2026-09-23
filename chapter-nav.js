/* Anchor links work without JavaScript; this adds chapter highlighting and offsets. */
(() => {
  const header = document.querySelector('.chapter-nav');
  if (!header) return;
  const links = [...header.querySelectorAll('.chapter-links a')];
  const chapters = links.map(link => document.getElementById(link.hash.slice(1)));
  let pending = false;
  function update() {
    pending = false;
    const height = header.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--chapter-nav-height', `${height}px`);
    let active = -1;
    chapters.forEach((chapter, index) => {
      if (chapter && chapter.getBoundingClientRect().top <= height + 60) active = index;
    });
    links.forEach((link, index) => {
      if (index === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  function schedule() {
    if (!pending) { pending = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  new ResizeObserver(schedule).observe(header);
  update();
})();
