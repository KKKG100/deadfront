/* ---------------- CLIENT FX: particles, projectiles, floats ---------------- */
function P(t,x,y,vx,vy,life,s,c,o){if(G.parts.length>1500)return null;const p={t,x,y,vx,vy,life,max:life,s,c};if(o)Object.assign(p,o);G.parts.push(p);return p}
function explodeFx(x,y,r,big){sfx('boom',x,y);P('flash',x,y,0,0,.25,r*2.2,'#ffd080');P('ring',x,y,0,0,.4,r,'rgba(255,200,120,.8)');for(let i=0;i<(big?14:7);i++){const a=rnd(TAU),s=rnd(30,120);P('fire',x+Math.cos(a)*r*.3,y+Math.sin(a)*r*.3,Math.cos(a)*s,Math.sin(a)*s,rnd(.3,.7),rnd(4,10)*(r/30+.5),'#ff9030')}for(let i=0;i<(big?10:4);i++)P('smoke',x+rnd(-r,r)*.5,y+rnd(-r,r)*.5,rnd(-20,20),rnd(-40,-10),rnd(1,2),rnd(8,16)*(r/30+.5),'#333');if(big&&onScr(x,y,300))G.shake=Math.min(1,G.shake+r/120)}
function updateProjFx(dt){const a=G.proj;for(let i=0;i<a.length;i++){const p=a[i];p.age+=dt;const f=clamp(p.age/p.dur,0,1);
  if(p.t==='shell'||p.t==='acid'||p.t==='rocket'){p.x=lerp(p.sx,p.tx,f);p.y=lerp(p.sy,p.ty,f);if(p.t==='rocket'&&Math.random()<.8)P('smoke',p.x,p.y,rnd(-8,8),rnd(-8,8),.5,4,'#bbb');if(p.t==='acid'&&Math.random()<.5)P('acid',p.x,p.y,rnd(-8,8),rnd(-8,8),.3,2,'#9aff40');
   if(f>=1){p.dead=true;if(p.t==='acid'){for(let k=0;k<6;k++)P('acid',p.tx,p.ty,rnd(-60,60),rnd(-60,60),.5,3,'#9aff40');splat(p.tx,p.ty,18,'rgba(100,160,30,.5)')}}}
  else if(p.t==='bomb'){if(f>=1)p.dead=true}}
 G.proj=a.filter(p=>!p.dead)}
function updateParts(dt){const a=G.parts;let j=0;for(let i=0;i<a.length;i++){const p=a[i];p.life-=dt;if(p.life<=0)continue;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.t==='smoke'){p.vx*=.97;p.s+=dt*5}else if(p.t==='blood'||p.t==='debris'){p.vx*=.93;p.vy*=.93}a[j++]=p}a.length=j;
 for(const f of G.floats){f.life-=dt;f.y-=14*dt}G.floats=G.floats.filter(f=>f.life>0)}
function notify(msg,type,x,y){G.alerts.push({id:++G.aid,msg,type:type||'info',x,y,t:G.t});if(type==='danger'||type==='warn')sfx('alert')}
function banner(t,s,kind){G.banner={text:t,sub:s,kind:kind||'',t:NOW,id:++G.aid}}
// Server-sent events -> visuals. Format: [type,x,y,...args]
const EVH={
 b(e){const[,x,y,tx,ty,heavy]=e;P('tracer',x,y,0,0,.08,1.2,heavy?'#fff6c0':'#ffe9a0',{x2:tx,y2:ty});P('flash',x,y,0,0,.06,10,'#ffe090');sfx(heavy?'rifle':'mg',x,y)},
 f(e){const[,x,y,a100]=e;const a=a100/100;for(let i=0;i<3;i++){const sp=rnd(120,200),an=a+rnd(-.2,.2);P('flame',x,y,Math.cos(an)*sp,Math.sin(an)*sp,rnd(.25,.4),rnd(4,8),'#ff8a20')}sfx('flame',x,y)},
 sh(e){const[,x,y,tx,ty,dur,big]=e;G.proj.push({t:'shell',x,y,sx:x,sy:y,tx,ty,age:0,dur,big:!!big});P('flash',x,y,0,0,.12,big?26:16,'#ffd080');const a=Math.atan2(ty-y,tx-x);for(let i=0;i<3;i++)P('smoke',x,y,Math.cos(a)*30+rnd(-10,10),Math.sin(a)*30+rnd(-10,10),.7,5,'#aaa');sfx('cannon',x,y);if(big&&onScr(x,y,200))G.shake=Math.min(1,G.shake+.1)},
 fk(e){const[,x,y,px,py]=e;P('flash',px,py,0,0,.14,26,'#ffe9a0');P('smoke',px,py,rnd(-8,8),rnd(-8,8),.8,10,'#222');P('tracer',x,y,0,0,.1,1.4,'#fff0b0',{x2:px,y2:py});sfx('cannon',x,y)},
 tz(e){const pts=[];const a=e[3];for(let i=0;i<a.length;i+=2)pts.push({x:a[i],y:a[i+1]});P('bolt',0,0,0,0,.18,2,'#8fe0ff',{pts});sfx('zap',e[1],e[2])},
 rk(e){const[,x,y,tx,ty,dur]=e;G.proj.push({t:'rocket',x,y,sx:x,sy:y,tx,ty,age:0,dur});sfx('cannon',x,y)},
 bm(e){const[,x,y,dur]=e;G.proj.push({t:'bomb',x,y,tx:x,ty:y,age:0,dur});sfx('bomb',x,y)},
 ac(e){const[,x,y,tx,ty,dur]=e;G.proj.push({t:'acid',x,y,sx:x,sy:y,tx,ty,age:0,dur});sfx('spit',x,y)},
 ex(e){const[,x,y,r,big]=e;explodeFx(x,y,r,big);splat(x,y,r*(big?1.4:.9),'rgba(20,15,10,.28)')},
 zd(e){const[,x,y,ti,r]=e;const type=ZK[ti];sfx('zdie',x,y);splat(x,y,r*2.6+rnd(4),type==='bloater'||type==='spitter'?'rgba(70,110,20,.5)':type==='drowned'?'rgba(40,80,90,.45)':'rgba(90,10,12,.55)');
  for(let i=0;i<5;i++)P('blood',x,y,rnd(-60,60),rnd(-60,60),rnd(.3,.6),rnd(1.5,3),type==='bloater'?'#7a9a30':'#8a1010')},
 ud(e){const[,x,y,inf]=e;explodeFx(x,y,inf?6:14,!inf);if(inf)splat(x,y,10,'rgba(90,10,12,.5)')},
 bd(e){const[,x,y,r,s]=e;explodeFx(x,y,r*.9,true);for(let i=0;i<s*5;i++)P('debris',x+rnd(-r,r),y+rnd(-r,r),rnd(-80,80),rnd(-80,80),rnd(.5,1),rnd(2,4),'#444');splat(x,y,r*1.6,'rgba(15,12,10,.6)')},
 dx(e){const d=WORLD.deposits[e[3]-1];if(d){d.used=true;d.type='none';for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)depGrid[(d.ty+dy)*MW+d.tx+dx]=0}},
 cr(e){if(G){G.crates=G.crates||[];if(!G.crates.some(c=>c.id===e[3]))G.crates.push({id:e[3],x:e[1],y:e[2]})}},
 cx(e){if(G&&G.crates)G.crates=G.crates.filter(c=>c.id!==e[3])},
 dep(e){const[,,,id,type,tx,ty,water]=e;addDeposit(id,type,tx,ty,water)},
 du(e){const d=WORLD&&WORLD.deposits[e[3]-1];if(d)d.used=!!e[4]}
};
function addDeposit(id,type,tx,ty,water){if(WORLD.deposits[id-1])return;const d={id,type:type===0||type==='ore'?'ore':'oil',tx,ty,water:!!water,used:false};WORLD.deposits[id-1]=d;for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)depGrid[(ty+dy)*MW+tx+dx]=id}
