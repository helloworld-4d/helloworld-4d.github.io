(() => {
  const video = document.getElementById('product-demo-video');
  const caption = document.getElementById('product-demo-description');
  const buttons = [...document.querySelectorAll('[data-product-demo]')];
  if (!video || !caption) return;
  const clips = {
    edit: {
      src: 'https://github.com/helloworld-4d/helloworld-4d.github.io/releases/download/media-20260923/product-demo-native10-en-v2.mp4',
      ratio: '2496 / 1394',
      label: 'Edit a Scene: interactive scene editing',
      caption: 'Edit a driving scene to generate controllable, multi-modal training data.'
    },
    describe: {
      src: 'https://github.com/helloworld-4d/helloworld-4d.github.io/releases/download/media-20260923/describe-scene-demo.mp4',
      ratio: '16 / 9',
      label: 'Describe a Scene: agent workflow and generated scenarios',
      caption: 'Describe a scene through an agent, inspect a generated example, and explore nine multi-modal scenarios.'
    }
  };
  buttons.forEach(button => button.addEventListener('click', () => {
    const clip = clips[button.dataset.productDemo];
    if (!clip || button.getAttribute('aria-pressed') === 'true') return;
    video.pause();
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    video.src = clip.src;
    video.style.aspectRatio = clip.ratio;
    video.setAttribute('aria-label', clip.label);
    caption.textContent = clip.caption;
    video.load();
  }));
})();
