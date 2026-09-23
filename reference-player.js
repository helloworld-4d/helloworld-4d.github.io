/* The seven cameras retain their original encoded streams. Canvas adds only pose overlays. */
const sources=window.REFERENCE_MEDIA;
const labels=['Front Left','Front Tele','Front Right','Front Wide','Rear Left','Rear','Rear Right'];
const groups=new Map();
function build(host){
 const grid=document.createElement('div');grid.className='surround-grid';host.append(grid);
 const videos=[],canvases=[];
 for(let i=0;i<7;i++){
  const cell=document.createElement('div');cell.className='surround-cell';
  const video=document.createElement('video');video.muted=true;video.playsInline=true;video.preload='none';video.setAttribute('aria-label',labels[i]);
  const canvas=document.createElement('canvas');canvas.width=832;canvas.height=480;
  const label=document.createElement('span');label.textContent=labels[i];cell.append(video,canvas,label);grid.append(cell);videos.push(video);canvases.push(canvas);
 }
 let overlay=null,version=0;
 const group={host,videos,key:host.dataset.surround,activate:null,controller:null};
 async function set(key){
  group.controller?.pause();group.key=key;const item=sources[key];const current=++version;overlay=null;
  videos.forEach((v,i)=>{v.preload='auto';v.src=item.views[i];v.load();});draw();
  if(item.overlay){try{const r=await fetch(item.overlay);if(!r.ok)throw Error('Trajectory unavailable');const data=await r.json();if(current===version){overlay=data;draw();}}catch(e){status(e.message);}}
 }
 function status(text){let p=host.querySelector('.video-error');if(!p){p=document.createElement('p');p.className='video-error';host.append(p);}p.textContent=text;}
 function draw(){
  const frame=overlay?.frames[Math.min(overlay.frames.length-1,Math.floor(videos[3].currentTime*overlay.fps))];
  canvases.forEach((canvas,i)=>{const c=canvas.getContext('2d');c.clearRect(0,0,832,480);if(!frame)return;c.fillStyle='rgba(42,219,174,.40)';for(const poly of frame[i]){c.beginPath();poly.forEach(([x,y],j)=>j?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}});
 }
 const video=videos[3];if(video.requestVideoFrameCallback){const tick=()=>{draw();video.requestVideoFrameCallback(tick);};video.requestVideoFrameCallback(tick);}else video.addEventListener('timeupdate',draw);
 video.addEventListener('seeked',draw);
 videos.forEach(v=>v.addEventListener('error',()=>status('Video could not be loaded. Please reload the page.')));
 group.activate=()=>{if(!videos[0].getAttribute('src'))set(group.key);};group.set=set;groups.set(host,group);return group;
}
function controller(items,box,observe){
 const videos=items.flatMap(g=>g.videos),master=items[0].videos[3];
 const button=document.createElement('button');button.type='button';button.textContent='Play';
 const slider=document.createElement('input');slider.type='range';slider.min=0;slider.max=1;slider.step=.01;slider.value=0;slider.setAttribute('aria-label','Synchronized playback position');
 const clock=document.createElement('output');clock.textContent='0.0 / — s';box.append(button,slider,clock);
 let playing=false,attempt=0;
 const duration=()=>Math.min(...videos.map(v=>Number.isFinite(v.duration)?v.duration:Infinity),...items.map(g=>sources[g.key].duration||Infinity));
 function update(){const d=duration();if(Number.isFinite(d)){slider.max=d;slider.value=master.currentTime;clock.textContent=`${master.currentTime.toFixed(1)} / ${d.toFixed(1)} s`;}}
 function pause(){attempt++;playing=false;videos.forEach(v=>v.pause());button.textContent='Play';}
 async function play(){
  if(playing){pause();return;}items.forEach(g=>g.activate());const token=++attempt;button.textContent='Loading…';
  try{
   await Promise.all(videos.map(v=>v.readyState>=2?Promise.resolve():new Promise((resolve,reject)=>{
    const clean=()=>{clearTimeout(timer);v.removeEventListener('loadeddata',ready);v.removeEventListener('error',fail);};const ready=()=>{clean();resolve();};const fail=()=>{clean();reject(Error('Video could not be loaded'));};const timer=setTimeout(fail,20000);v.addEventListener('loadeddata',ready);v.addEventListener('error',fail);v.preload='auto';
   })));
   if(token!==attempt)return;
   if(master.currentTime>=duration()-.05)master.currentTime=0;
   videos.forEach(v=>v.currentTime=master.currentTime);playing=true;button.textContent='Pause';
   await Promise.all(videos.map(v=>v.play()));if(token!==attempt)videos.forEach(v=>v.pause());
  }catch(e){if(token===attempt){pause();clock.textContent=e.message;}}
 }
 button.addEventListener('click',play);slider.addEventListener('input',()=>{pause();videos.forEach(v=>{if(v.readyState)v.currentTime=Number(slider.value);});update();});
 videos.forEach(v=>{v.addEventListener('loadedmetadata',update);v.addEventListener('ended',pause);v.addEventListener('error',pause);v.addEventListener('waiting',()=>{if(playing){videos.forEach(other=>{if(other!==v)other.pause();});}});v.addEventListener('canplay',()=>{if(playing&&videos.every(other=>other.readyState>=3))videos.forEach(other=>other.play().catch(pause));});});
 master.addEventListener('timeupdate',()=>{update();if(master.currentTime>=duration()){pause();return;}if(playing)videos.forEach(v=>{if(v!==master&&v.readyState&&Math.abs(v.currentTime-master.currentTime)>.06)v.currentTime=master.currentTime;});});
 const api={pause};items.forEach(g=>g.controller=api);
 new IntersectionObserver(entries=>{if(entries[0].isIntersecting)items.forEach(g=>g.activate());else pause();},{rootMargin:'100px'}).observe(observe);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});return api;
}
for(const host of document.querySelectorAll('[data-surround]')){
 const g=build(host);if(!host.dataset.shared){const controls=document.createElement('div');controls.className='surround-controls';host.append(controls);controller([g],controls,host);}
}
const shared=[...groups.values()].filter(g=>g.host.dataset.shared==='distillation');
if(shared.length)controller(shared,document.getElementById('distillation-shared-controls'),document.getElementById('distillation-comparison'));
function clipButtons(attr,videoId,clips,captionId){
 const video=document.getElementById(videoId);if(!video)return;
 document.querySelectorAll(`[data-${attr}]`).forEach(button=>button.addEventListener('click',()=>{
  const src=clips[button.dataset[attr]];if(!src)return;
  document.querySelectorAll(`[data-${attr}]`).forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  video.pause();video.preload='auto';video.src=src;video.load();video.setAttribute('aria-label',button.textContent);
  if(attr==='trajectory'){const lane=button.dataset.trajectory.startsWith('lane-');document.getElementById('pose-caption').textContent=button.textContent+(lane?' · 7 views · 10 fps · 6.1 s. Separate lane-change example. Green: projected future pose trajectory.':' · 7 views · 81 frames · 10 fps · 8.1 s. Same scene and initial frame. Green: projected future pose trajectory.');}
  if(attr==='layout')document.getElementById('layout-caption').textContent='Generated RGB placeholder · '+button.textContent+'. Layout-editing process recording pending.';
  if(captionId){const cap=document.getElementById(captionId);if(cap)cap.textContent='Seven-view clip · '+button.textContent;}
 }));
}
clipButtons('trajectory','pose-video',{"left":"https://dev-07061353.ds-hpc-prod-bd-su01.hellorobotaxi.top/studio/namespaces/infra-sim/devspaces/dev-07061353/jupyter/files/helloworld-report-share-20260923/assets/real/single/pose-left-future.mp4?v=pose-future1","straight":"https://dev-07061353.ds-hpc-prod-bd-su01.hellorobotaxi.top/studio/namespaces/infra-sim/devspaces/dev-07061353/jupyter/files/helloworld-report-share-20260923/assets/real/single/pose-straight-future.mp4?v=pose-future1","right":"https://dev-07061353.ds-hpc-prod-bd-su01.hellorobotaxi.top/studio/namespaces/infra-sim/devspaces/dev-07061353/jupyter/files/helloworld-report-share-20260923/assets/real/single/pose-right-future.mp4?v=pose-future1","lane-left":"https://dev-07061353.ds-hpc-prod-bd-su01.hellorobotaxi.top/studio/namespaces/infra-sim/devspaces/dev-07061353/jupyter/files/helloworld-report-share-20260923/assets/real/single/pose-lane-left-future.mp4?v=pose-future1","lane-right":"https://dev-07061353.ds-hpc-prod-bd-su01.hellorobotaxi.top/studio/namespaces/infra-sim/devspaces/dev-07061353/jupyter/files/helloworld-report-share-20260923/assets/real/single/pose-lane-right-future.mp4?v=pose-future1"});
clipButtons('layout','layout-video',{intersection:'https://dev-07061353.ds-hpc-prod-bd-su01.hellorobotaxi.top/studio/namespaces/infra-sim/devspaces/dev-07061353/jupyter/files/helloworld-report-share-20260923/assets/real/layout-intersection-result.mp4?v=fwcenter',boulevard:'https://dev-07061353.ds-hpc-prod-bd-su01.hellorobotaxi.top/studio/namespaces/infra-sim/devspaces/dev-07061353/jupyter/files/helloworld-report-share-20260923/assets/real/layout-boulevard-result.mp4?v=fwcenter',overpass:'https://dev-07061353.ds-hpc-prod-bd-su01.hellorobotaxi.top/studio/namespaces/infra-sim/devspaces/dev-07061353/jupyter/files/helloworld-report-share-20260923/assets/real/layout-overpass-result.mp4?v=fwcenter',construction:'https://dev-07061353.ds-hpc-prod-bd-su01.hellorobotaxi.top/studio/namespaces/infra-sim/devspaces/dev-07061353/jupyter/files/helloworld-report-share-20260923/assets/real/layout-construction-result.mp4?v=fwcenter'});
const weatherCaptions={
 sunny:'A driving scene under clear blue skies, with bright sunlight and crisp shadows.',
 overcast:'A driving scene under a gray overcast sky, with soft diffuse daylight.',
 'light-rain':'A driving scene in light drizzle, with fine sparse raindrops and a gently wet road.',
 'rainy-night':'A driving scene at night in light drizzle, with sparse fine raindrops and streetlights reflected on damp pavement.',
 snow:'A driving scene with falling snow and a light layer of snow on the road and surroundings.',
 fog:'Dense white fog surrounds the road in every direction. Nearby objects fade into mist and distant details disappear.',
 'golden-hour':'Warm golden-hour sunlight with long shadows.',
 'blue-hour':'Blue-hour twilight with dim ambient light and streetlights on.'
};
const weatherVideo=document.getElementById('weather-video');
document.querySelectorAll('[data-weather]').forEach(button=>button.addEventListener('click',()=>{
 const key=button.dataset.weather;if(!weatherCaptions[key]||!weatherVideo)return;
 document.querySelectorAll('[data-weather]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 weatherVideo.setAttribute('aria-label','Environment control, '+button.textContent);weatherVideo.pause();weatherVideo.src='https://dev-07061353.ds-hpc-prod-bd-su01.hellorobotaxi.top/studio/namespaces/infra-sim/devspaces/dev-07061353/jupyter/files/helloworld-report-share-20260923/assets/real/single/env-'+key+'.mp4?v=fwcenter';weatherVideo.load();
 document.getElementById('weather-caption').textContent='Seven views in one clip · same boulevard clip · 10 fps · 10.1 s. '+weatherCaptions[key];
}));
const specialCaptions={
 construction:'Seven views in one clip · 10 fps · 10.1 s. A large road construction site occupies the middle of the roadway directly ahead. A yellow tracked excavator is digging into a wide section of torn-up asphalt, its boom lowered and bucket scooping earth. Bright orange cones, red-and-white barriers, piles of soil and broken pavement clearly mark the central work zone.'
};
const specialVideo=document.getElementById('special-video');
document.querySelectorAll('[data-special]').forEach(button=>button.addEventListener('click',()=>{
 const key=button.dataset.special;if(!key||!specialVideo)return;
 document.querySelectorAll('[data-special]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 specialVideo.setAttribute('aria-label','Special scenario, '+button.textContent);specialVideo.pause();specialVideo.src='https://dev-07061353.ds-hpc-prod-bd-su01.hellorobotaxi.top/studio/namespaces/infra-sim/devspaces/dev-07061353/jupyter/files/helloworld-report-share-20260923/assets/real/single/special-'+key+'.mp4?v='+(key==='construction'?'excavation':'fwcenter');specialVideo.load();
 document.getElementById('special-caption').textContent=specialCaptions[key]||('Seven views in one clip · 10 fps · 10.1 s · '+button.textContent);
}));
const distillPair=[document.getElementById('distill-teacher'),document.getElementById('distill-student')];
if(distillPair.every(Boolean)){
 const [master,student]=distillPair,button=document.getElementById('distill-toggle'),seek=document.getElementById('distill-seek'),clock=document.getElementById('distill-time');
 let wanted=false,starting=false,generation=0;
 const duration=()=>Math.min(...distillPair.map(v=>Number.isFinite(v.duration)?v.duration:6.1));
 function update(){seek.max=duration();seek.value=master.currentTime;clock.textContent=master.currentTime.toFixed(1)+' / '+duration().toFixed(1)+' s';}
 function pause(){wanted=false;generation++;distillPair.forEach(v=>v.pause());button.textContent='Play both';}
 async function resume(){
  if(!wanted||starting||!distillPair.every(v=>v.readyState>=3))return;
  starting=true;const token=generation;
  try{await Promise.all(distillPair.map(v=>v.play()));if(token===generation&&wanted)button.textContent='Pause both';else distillPair.forEach(v=>v.pause());}
  catch(e){if(token===generation){pause();clock.textContent='Unable to play. Please try again.';}}
  finally{starting=false;if(wanted&&token!==generation)resume();}
 }
 function start(){if(document.hidden||wanted)return;wanted=true;button.textContent='Loading…';if(master.currentTime>=duration()-.05)master.currentTime=0;student.currentTime=master.currentTime;distillPair.forEach(v=>{v.muted=true;v.playsInline=true;v.preload='auto';});resume();}
 button.addEventListener('click',()=>{if(wanted)pause();else start();});
 seek.addEventListener('input',()=>{pause();distillPair.forEach(v=>v.currentTime=Number(seek.value));update();});
 distillPair.forEach(v=>{
  v.addEventListener('canplay',resume);v.addEventListener('seeked',resume);v.addEventListener('loadedmetadata',update);
  v.addEventListener('waiting',()=>{if(wanted){distillPair.forEach(x=>x.pause());button.textContent='Loading…';}});
  v.addEventListener('ended',pause);v.addEventListener('error',()=>{pause();clock.textContent='Video could not be loaded.';});
 });
 master.addEventListener('timeupdate',()=>{update();if(wanted&&!master.paused&&!student.seeking&&Math.abs(student.currentTime-master.currentTime)>.09)student.currentTime=master.currentTime;});
 document.querySelectorAll('[data-distill]').forEach(tab=>tab.addEventListener('click',()=>{
  const key=tab.dataset.distill;if(!['turn','lane','slight','bus'].includes(key))return;pause();
  document.querySelectorAll('[data-distill]').forEach(b=>b.setAttribute('aria-pressed',String(b===tab)));
  distillPair.forEach((v,i)=>{v.src='https://dev-07061353.ds-hpc-prod-bd-su01.hellorobotaxi.top/studio/namespaces/infra-sim/devspaces/dev-07061353/jupyter/files/helloworld-report-share-20260923/assets/real/single/distill-'+key+'-'+(i?'dmd':'teacher')+'.mp4';v.load();});seek.value=0;clock.textContent='0.0 / 6.1 s';
  document.getElementById('distill-caption').textContent=tab.textContent+' · Teacher 20 steps (left) / DMD 4 steps (right) · 7 views each · 10 fps · 6.1 s. Synchronized playback.';
  if(comparisonVisible)start();
 }));
 let comparisonVisible=false;
 new IntersectionObserver(entries=>{const entry=entries[0];const next=entry.isIntersecting&&entry.intersectionRatio>=.25;if(next&&!comparisonVisible)start();else if(!next)pause();comparisonVisible=next;},{threshold:[0,.25]}).observe(document.getElementById('distillation-comparison'));
 document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
}
const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)e.target.pause();}));
document.querySelectorAll('video').forEach(v=>{if(!v.closest('[data-surround]')&&v.id!=='lidar-input-video'&&!distillPair.includes(v))observer.observe(v);});

// Closed-loop demo: switch between policy rollouts. Each clip keeps its own encoded stream.
const closedLoopClips={
 sim1:{src:'https://dev-07061353.ds-hpc-prod-bd-su01.hellorobotaxi.top/studio/namespaces/infra-sim/devspaces/dev-07061353/jupyter/files/helloworld-report-share-20260923/assets/videos/0923-v1-gt_helloworld_exhibition_8s.mp4?v=0923',text:'Closed-loop rollout with Alpamayo 1.5 in HWsimulator, beside the road-test replay. Night clip, 10 fps, 8.0 s. The policy keeps distance from a stopped lead vehicle, then opens a gap because a stopped car blocks an immediate merge to the right.'},
 sim2:{src:'https://dev-07061353.ds-hpc-prod-bd-su01.hellorobotaxi.top/studio/namespaces/infra-sim/devspaces/dev-07061353/jupyter/files/helloworld-report-share-20260923/assets/videos/0923-v2-gt_helloworld_exhibition_8s.mp4?v=0923',text:'The same closed-loop setup on another night clip, 10 fps, 8.0 s. The road test is stopped behind a truck on the right side of the lane; the simulated rollout nudges left to clear it.'}
};
const closedLoopVideo=document.getElementById('closed-loop-video');
const closedLoopText=document.getElementById('closed-loop-description');
if(closedLoopVideo)document.querySelectorAll('[data-closedloop]').forEach(button=>button.addEventListener('click',()=>{
 const clip=closedLoopClips[button.dataset.closedloop];if(!clip)return;
 document.querySelectorAll('[data-closedloop]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 closedLoopVideo.pause();closedLoopVideo.preload='auto';closedLoopVideo.src=clip.src;closedLoopVideo.load();
 if(closedLoopText)closedLoopText.textContent=clip.text;
}));

const longVideo=document.getElementById('long-video');
if(longVideo)document.querySelectorAll('[data-long]').forEach(button=>button.addEventListener('click',()=>{
 const key=button.dataset.long;if(!key)return;
 document.querySelectorAll('[data-long]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 document.getElementById('long-caption').textContent=button.textContent+' · 7 views · '+(button.dataset.longFrames||401)+' frames · 10 fps · '+(button.dataset.longDuration||'40.1')+' s.';longVideo.setAttribute('aria-label','Long-horizon generation, '+button.textContent);
 longVideo.pause();longVideo.src=button.dataset.longSrc||('https://dev-07061353.ds-hpc-prod-bd-su01.hellorobotaxi.top/studio/namespaces/infra-sim/devspaces/dev-07061353/jupyter/files/helloworld-report-share-20260923/assets/real/single/long-'+key+'.mp4?v=fwcenter');longVideo.load();
}));
