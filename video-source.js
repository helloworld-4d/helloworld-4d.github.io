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
    source.src = window.hwMediaPages?.[url] || url;
  }
};
