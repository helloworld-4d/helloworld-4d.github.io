/* Mobile copies preserve frame count and duration; desktops retain original streams. */
window.hwUseMobileVideo = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
window.hwMobileVideoSources = {
  "https://helloworld-4d.github.io/helloworld-media-2/distill-lane-dmd.mp4?v=1": "mobile-videos/distill-lane-dmd.mp4?v=1",
  "https://helloworld-4d.github.io/helloworld-media-1/distill-bus-teacher.mp4?v=1": "mobile-videos/distill-bus-teacher.mp4?v=1",
  "https://helloworld-4d.github.io/helloworld-media-1/distill-bus-dmd.mp4?v=1": "mobile-videos/distill-bus-dmd.mp4?v=1",
  "https://helloworld-4d.github.io/helloworld-media-2/distill-lane-teacher.mp4?v=1": "mobile-videos/distill-lane-teacher.mp4?v=1",
  "https://helloworld-4d.github.io/helloworld-media-1/distill-slight-dmd.mp4?v=1": "mobile-videos/distill-slight-dmd.mp4?v=1",
  "https://helloworld-4d.github.io/helloworld-media-1/distill-slight-teacher.mp4?v=1": "mobile-videos/distill-slight-teacher.mp4?v=1",
  "https://helloworld-4d.github.io/helloworld-media-2/distill-turn-teacher.mp4?v=1": "mobile-videos/distill-turn-teacher.mp4?v=1",
  "https://helloworld-4d.github.io/helloworld-media-1/distill-turn-dmd.mp4?v=1": "mobile-videos/distill-turn-dmd.mp4?v=1",
  "https://helloworld-4d.github.io/helloworld-media-2/0923-v1-gt_helloworld_exhibition_8s.mp4?v=1": "mobile-videos/0923-v1-gt_helloworld_exhibition_8s.mp4?v=1",
  "https://helloworld-4d.github.io/helloworld-media-1/0923-v2-gt_helloworld_exhibition_8s.mp4?v=1": "mobile-videos/0923-v2-gt_helloworld_exhibition_8s.mp4?v=1"
};
/* Resolve legacy clip templates to verified Pages URLs; retain the iOS MP4 hint. */
window.hwVideoSource = {
  get(video) {
    return video.querySelector('source')?.getAttribute('src') || video.getAttribute('src') || '';
  },
  set(video, url) {
    let source = video.querySelector('source');
    if (!source) {
      source = document.createElement('source');
      video.append(source);
    }
    // A video-level src takes precedence over typed child sources.
    video.removeAttribute('src');
    source.type = 'video/mp4';
    const resolved = window.hwMediaPages?.[url] || url;
    source.src = (window.hwUseMobileVideo && window.hwMobileVideoSources[resolved]) || resolved;
  }
};

// Run before autoplay/synchronization scripts; initial videos use preload=none.
if (window.hwUseMobileVideo) {
  document.querySelectorAll('video').forEach(video => {
    const url = window.hwVideoSource.get(video);
    if (window.hwMobileVideoSources[url]) {
      window.hwVideoSource.set(video, url);
      video.load();
    }
  });
}
