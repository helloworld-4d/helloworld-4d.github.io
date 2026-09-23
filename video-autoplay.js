/* Autoplay only visible media; existing players retain their synchronization. */
(() => {
  const videos = [...document.querySelectorAll('video')].filter(video =>
    !video.closest('[data-surround]') && !['distill-teacher', 'distill-student'].includes(video.id));
  const visible = new Set();
  const resumeAfterHidden = new Set();
  const loading = document.getElementById('loading');
  function play(video) {
    if (!visible.has(video) || document.hidden) return;
    if (video.id === 'lidar-input-video' && loading && !loading.hidden) return;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    if (video.ended) video.currentTime = 0;
    const source = video.getAttribute('src');
    video.play().then(() => {
      if (!visible.has(video) || document.hidden) video.pause();
    }).catch(() => {
      // Source changes can cancel a pending play; the new source is observed below.
      if (video.getAttribute('src') !== source) return;
      // Keep native controls available if the browser declines autoplay.
    });
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const video = entry.target;
      const wasVisible = visible.has(video);
      if (entry.isIntersecting && entry.intersectionRatio >= .25) {
        visible.add(video);
        if (!wasVisible) play(video);
      } else {
        visible.delete(video);
        video.pause();
      }
    });
  }, { threshold: [0, .25] });
  videos.forEach(video => {
    observer.observe(video);
    new MutationObserver(() => play(video)).observe(video, { attributes: true, attributeFilter: ['src'] });
  });
  if (loading) new MutationObserver(() => {
    if (loading.hidden) {
      const video = document.getElementById('lidar-input-video');
      if (video) play(video);
    }
  }).observe(loading, { attributes: true, attributeFilter: ['hidden'] });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      videos.forEach(video => {
        if (!video.paused && visible.has(video)) resumeAfterHidden.add(video);
        video.pause();
      });
    } else {
      resumeAfterHidden.forEach(play);
      resumeAfterHidden.clear();
    }
  });
})();
