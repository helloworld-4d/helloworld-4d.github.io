(() => {
 const nativeFetch=window.fetch.bind(window);let queue=Promise.resolve();
 function loadChunk(url){return new Promise((resolve,reject)=>{
  const script=document.createElement('script');let raw;
  window.__hwChunk=value=>{raw=value;};
  script.onload=()=>{script.remove();delete window.__hwChunk;raw===undefined?reject(Error('Missing point-cloud chunk')):resolve(raw);};
  script.onerror=()=>{script.remove();delete window.__hwChunk;reject(Error('Point-cloud download failed'));};
  script.src=url;document.head.append(script);
 });}
 window.fetch=(input,options)=>{
  const path=new URL(String(input),location.href).pathname;
  const match=path.match(/\/assets\/real\/lidar\/wx\/([^/]+)\.(json|bin)$/);
  if(!match)return nativeFetch(input,options);
  const item=window.__hwLidar[match[1]];
  if(!item)return Promise.resolve(new Response('',{status:404}));
  if(match[2]==='json')return Promise.resolve(new Response(JSON.stringify(item.manifest),{headers:{'Content-Type':'application/json'}}));
  const task=queue.then(async()=>{
   const bytes=new Uint8Array(item.bytes);let offset=0;
   for(const url of item.chunks){const text=atob(await loadChunk(url));for(let i=0;i<text.length;i++)bytes[offset+i]=text.charCodeAt(i);offset+=text.length;}
   if(offset!==bytes.length)throw Error('Point-cloud length mismatch');
   return new Response(bytes,{headers:{'Content-Type':'application/octet-stream'}});
  });queue=task.catch(()=>{});return task;
 };
})();