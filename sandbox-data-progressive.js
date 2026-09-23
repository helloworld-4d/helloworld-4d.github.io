/* Script transport is required by the Notebook's opaque-origin sandbox. */
(() => {
  const nativeFetch = window.fetch.bind(window);
  const chunkSize = 4 * 1024 * 1024;
  const cache = new Map();
  const pending = new Map();
  window.__hwChunk = value => {
    const src = document.currentScript?.src;
    const item = pending.get(src);
    if (item) item.value = value;
  };
  function chunk(url, signal) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      const key = script.src;
      const item = {};
      function cleanup() {
        clearTimeout(timer); if (pending.get(key) === item) pending.delete(key); script.remove();
        signal?.removeEventListener('abort', abort);
      }
      function abort() { cleanup(); reject(new DOMException('Cancelled', 'AbortError')); }
      const timer = setTimeout(() => { cleanup(); reject(Error('Point-cloud download timed out')); }, 30000);
      pending.set(key, item);
      script.onload = () => {
        const value = item.value; cleanup();
        value === undefined ? reject(Error('Missing point-cloud chunk')) : resolve(value);
      };
      script.onerror = () => { cleanup(); reject(Error('Point-cloud download failed')); };
      if (signal?.aborted) { abort(); return; }
      signal?.addEventListener('abort', abort, { once: true });
      document.head.append(script);
    });
  }
  window.hwLoadLidar = async (key, { signal, onProgress = () => {} } = {}) => {
    const item = window.__hwLidar[key];
    if (!item) throw Error('Unknown LiDAR case');
    let entry = cache.get(key);
    if (!entry) entry = { bytes: new Uint8Array(item.bytes), loaded: new Set() };
    cache.delete(key); cache.set(key, entry);
    while (cache.size > 2) cache.delete(cache.keys().next().value);
    function report() {
      let contiguous = 0;
      while (entry.loaded.has(contiguous)) contiguous++;
      onProgress(entry.bytes.buffer, Math.min(item.bytes, contiguous * chunkSize), item.bytes);
    }
    report();
    const missing = item.chunks.map((url, index) => ({ url, index })).filter(x => !entry.loaded.has(x.index));
    let next = 0;
    const local = new AbortController();
    const abort = () => local.abort();
    if (signal?.aborted) local.abort();
    signal?.addEventListener('abort', abort, { once: true });
    async function loadPart({ url, index }) {
      if (local.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
      const raw = atob(await chunk(url, local.signal));
      if (local.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
      const offset = index * chunkSize;
      if (raw.length !== Math.min(chunkSize, item.bytes-offset)) throw Error('Point-cloud length mismatch');
      for (let i=0;i<raw.length;i++) entry.bytes[offset+i] = raw.charCodeAt(i);
      entry.loaded.add(index); report();
    }
    async function worker() {
      while (next < missing.length) await loadPart(missing[next++]);
    }
    try {
      // Give the first visible frame full bandwidth before background prefetch.
      if (missing[0]?.index === 0) await loadPart(missing[next++]);
      await Promise.all(Array.from({ length: Math.min(4, missing.length-next) }, worker));
    }
    catch (error) { local.abort(); throw error; }
    finally { signal?.removeEventListener('abort', abort); }
    return entry.bytes.buffer;
  };
  // Retain the prior fetch adapter for compatibility with other consumers.
  window.fetch = (input, options) => {
    const path = new URL(String(input), location.href).pathname;
    const match = path.match(/\/assets\/real\/lidar\/wx\/([^/]+)\.(json|bin)$/);
    if (!match) return nativeFetch(input, options);
    const item = window.__hwLidar[match[1]];
    if (!item) return Promise.resolve(new Response('', { status: 404 }));
    if (match[2] === 'json') return Promise.resolve(new Response(JSON.stringify(item.manifest), { headers: { 'Content-Type': 'application/json' } }));
    return window.hwLoadLidar(match[1], { signal: options?.signal }).then(bytes => new Response(bytes));
  };
})();
