/* Progressive lossless point-cloud chunks served by GitHub Pages. */
(() => {
  const nativeFetch = window.fetch.bind(window);
  const chunkSize = 4 * 1024 * 1024;
  const cache = new Map();
  // Each chunk preserves the exact 16-byte point records; byte reordering is lossless.
  async function chunk(url, signal) {
    const response = await nativeFetch(url, { signal });
    if (!response.ok) throw Error('Point-cloud download failed: ' + response.status);
    if (!response.body || typeof DecompressionStream === 'undefined') {
      throw Error('This browser does not support gzip point-cloud decoding. Please use a current browser.');
    }
    const shuffled = new Uint8Array(await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    if (shuffled.length % 16) throw Error('Invalid point-cloud record length');
    const count = shuffled.length / 16;
    const raw = new Uint8Array(shuffled.length);
    for (let byte = 0; byte < 16; byte++) {
      for (let point = 0; point < count; point++) raw[point * 16 + byte] = shuffled[byte * count + point];
    }
    return raw;
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
      const raw = await chunk(url, local.signal);
      if (local.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
      const offset = index * chunkSize;
      if (raw.length !== Math.min(chunkSize, item.bytes-offset)) throw Error('Point-cloud length mismatch');
      entry.bytes.set(raw, offset);
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
