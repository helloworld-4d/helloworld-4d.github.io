/* Keep an explicit media type for iOS when Releases serves octet-stream. */
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
    source.src = url;
  }
};
