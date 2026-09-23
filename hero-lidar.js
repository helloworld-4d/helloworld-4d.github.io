/* Decorative brand-colour LiDAR horizon; no external dependencies. */
(() => {
  const hero = document.querySelector('.hero');
  const canvas = document.getElementById('hero-lidar-canvas');
  if (!hero || !canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const button = hero.querySelector('.hero-motion-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = reduced.matches, visible = false, raf = 0, previous = 0;
  let width = 0, height = 0, time = 0, pulses = [];
  const pointer = { x: 0, y: 0 }, target = { x: 0, y: 0 };
  function glow(x, y, radius, color) {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color); gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient; ctx.fillRect(x-radius, y-radius, radius*2, radius*2);
  }
  function draw() {
    if (!width || !height) return;
    const background = ctx.createLinearGradient(0, height*.1, width, height*.85);
    background.addColorStop(0, '#125397');
    background.addColorStop(.48, '#155976');
    background.addColorStop(1, '#318d78');
    ctx.fillStyle = background; ctx.fillRect(0, 0, width, height);
    glow(width*.1, height*.42, width*.65, '#3998f54a');
    glow(width*.93, height*.6, width*.55, '#80dfad38');
    const hx = width*.5 + pointer.x*width*.038;
    const hy = height*.43 + pointer.y*13;
    glow(hx, hy, width*.48, '#70d9e328');
    const project = (x, z) => {
      const depth = 1/(1+z*4.2);
      let hill = Math.sin(x*2.2+z*8+time*.25)*.11 + Math.cos(x*4-z*4)*.06;
      hill *= Math.min(1, Math.max(0, Math.abs(x)-.22)*2);
      return [hx+x*width*.62*depth, hy+(height*.98+hill*height)*depth];
    };
    const rows = width < 600 ? 26 : 35;
    const half = width < 600 ? 20 : 28;
    for (let row=0; row<rows; row++) {
      const z = row/(rows-1)+(time*.025)%(1/(rows-1));
      ctx.beginPath();
      for (let i=-half; i<=half; i++) {
        const point=project(i/(half*.61), z);
        if (i===-half) ctx.moveTo(...point); else ctx.lineTo(...point);
      }
      ctx.strokeStyle=`rgba(95,201,241,${.08+(1-z)*.21})`;
      ctx.lineWidth=.7; ctx.stroke();
      for (let i=-half; i<=half; i++) {
        const point=project(i/(half*.61), z);
        const scan=.5+.5*Math.sin(z*14-time*1.7);
        ctx.fillStyle=`rgba(${i%3===0?'128,239,185':'97,186,255'},${.2+scan*.58})`;
        ctx.beginPath(); ctx.arc(point[0],point[1],.6+(1-z)*1.15,0,Math.PI*2);ctx.fill();
      }
    }
    for (const edge of [-.27,.27]) {
      ctx.beginPath();
      for(let j=0;j<=75;j++) {
        const z=j/75, point=project(edge+.03*Math.sin(z*4+time*.15),z);
        if(j)ctx.lineTo(...point);else ctx.moveTo(...point);
      }
      ctx.strokeStyle='#9af4c9aa';ctx.lineWidth=1.4;ctx.stroke();
    }
    pulses=pulses.filter(p=>time-p.born<3);
    for(const pulse of pulses) {
      const age=time-pulse.born;
      ctx.beginPath();ctx.arc(pulse.x,pulse.y,10+age*130,0,Math.PI*2);
      ctx.strokeStyle=`rgba(156,255,206,${(1-age/3)*.7})`;ctx.lineWidth=1.3;ctx.stroke();
    }
  }
  function animate(now) {
    raf=0;
    if(paused || !visible || document.hidden)return;
    if(now-previous>=32) {
      const dt=previous?Math.min((now-previous)/1000,.06):0;
      previous=now;time+=dt*.7;
      pointer.x+=(target.x-pointer.x)*.09;pointer.y+=(target.y-pointer.y)*.09;
      draw();
    }
    raf=requestAnimationFrame(animate);
  }
  function sync() {
    cancelAnimationFrame(raf);raf=0;previous=0;
    button.textContent=paused?'Play animation':'Pause animation';
    button.setAttribute('aria-pressed',String(paused));
    if(!paused && visible && !document.hidden)raf=requestAnimationFrame(animate);
  }
  function resize() {
    const rect=hero.getBoundingClientRect();width=rect.width;height=rect.height;
    const ratio=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(width*ratio);canvas.height=Math.round(height*ratio);
    ctx.setTransform(ratio,0,0,ratio,0,0);draw();
  }
  hero.addEventListener('pointermove',event=>{
    if(paused)return;
    const rect=hero.getBoundingClientRect();
    target.x=((event.clientX-rect.left)/rect.width-.5)*2;
    target.y=((event.clientY-rect.top)/rect.height-.5)*2;
  },{passive:true});
  hero.addEventListener('pointerleave',()=>{target.x=0;target.y=0;});
  hero.addEventListener('pointerdown',event=>{
    if(paused || event.target.closest('a,button'))return;
    const rect=hero.getBoundingClientRect();
    pulses.push({x:event.clientX-rect.left,y:event.clientY-rect.top,born:time});
    if(pulses.length>5)pulses.shift();
  });
  button.addEventListener('click',()=>{paused=!paused;sync();});
  reduced.addEventListener('change',()=>{paused=reduced.matches;sync();draw();});
  document.addEventListener('visibilitychange',sync);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();}).observe(hero);
  new ResizeObserver(resize).observe(hero);
  resize();sync();
})();
