/* ---------------- RENDER ---------------- */
let cv,ctx,VW=800,VH=600,dpr=1;const cam={x:0,y:0,z:.9};
let LIGHT=null,LCV=null,LCX=null;
const UIs={sel:null,build:null,markers:[],box:null,amove:false,hover:null,mouse:{x:0,y:0}};
function initRender(){cv=document.getElementById('cv');ctx=cv.getContext('2d',{alpha:false,desynchronized:true});LCV=document.createElement('canvas');LCX=LCV.getContext('2d');resize();window.addEventListener('resize',resize);
 LIGHT=document.createElement('canvas');LIGHT.width=LIGHT.height=128;const l=LIGHT.getContext('2d');const g=l.createRadialGradient(64,64,0,64,64,64);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.45,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');l.fillStyle=g;l.fillRect(0,0,128,128);
}
let QUAL=0;
function setQual(q){QUAL=q;resize()}
function resize(){dpr=QUAL>=3?.6:QUAL>=2?.75:QUAL>=1?1:Math.min(1.25,window.devicePixelRatio||1);VW=window.innerWidth;VH=window.innerHeight;cv.width=Math.floor(VW*dpr);cv.height=Math.floor(VH*dpr);cv.style.width=VW+'px';cv.style.height=VH+'px';LCV.width=Math.ceil(cv.width/4);LCV.height=Math.ceil(cv.height/4);clampCam()}
function clampCam(){const minZ=Math.max(.4,Math.min(VW/(WW+500),VH/(WH+500)));cam.z=clamp(cam.z,minZ,1.9);const vw=VW/cam.z,vh=VH/cam.z;cam.x=clamp(cam.x,-250,WW+250-vw);cam.y=clamp(cam.y,-250,WH+250-vh)}
function centerOn(x,y){cam.x=x-VW/cam.z/2;cam.y=y-(VH-190)/cam.z/2;clampCam()}
const w2sx=x=>(x-cam.x)*cam.z,w2sy=y=>(y-cam.y)*cam.z;
const s2w=(sx,sy)=>({x:cam.x+sx/cam.z,y:cam.y+sy/cam.z});
const onScr=(x,y,m)=>x>cam.x-m&&y>cam.y-m&&x<cam.x+VW/cam.z+m&&y<cam.y+VH/cam.z+m;

function drawWater(t){const z=cam.z*dpr;ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#0c3b66';ctx.fillRect(0,0,cv.width,cv.height);
 if(!WATER)return;if(!WPAT){WPAT=ctx.createPattern(WATER.base,'repeat');WPAT2=ctx.createPattern(WATER.hi,'repeat')}
 const layer=(pat,ox,oy,sc,al)=>{const zz=z*sc;ctx.setTransform(zz,0,0,zz,(-cam.x*cam.z+ox*cam.z)*dpr,(-cam.y*cam.z+oy*cam.z)*dpr);ctx.globalAlpha=al;ctx.fillStyle=pat;const x0=(-ox*cam.z+cam.x*cam.z)/ (cam.z*sc),y0=(-oy*cam.z+cam.y*cam.z)/(cam.z*sc);ctx.fillRect(x0*1-4/sc,y0-4/sc,VW/(cam.z*sc)/1+8,VH/(cam.z*sc)+8)};
 // simpler: compute in pattern space directly
 ctx.globalAlpha=1;
 const draw=(pat,vx,vy,sc,al)=>{const zz=cam.z*sc*dpr;ctx.setTransform(zz,0,0,zz,-cam.x*cam.z*dpr+vx*t*cam.z*dpr,-cam.y*cam.z*dpr+vy*t*cam.z*dpr);ctx.globalAlpha=al;ctx.fillStyle=pat;
  // visible rect in pattern space
  const px0=(cam.x*cam.z-vx*t*cam.z)/(cam.z*sc),py0=(cam.y*cam.z-vy*t*cam.z)/(cam.z*sc);ctx.fillRect(px0-2,py0-2,VW/(cam.z*sc)*cam.z/cam.z+4,VH/(cam.z*sc)+4)};
 draw(WPAT,7,3,1,1);if(QUAL<1)draw(WPAT2,-10,6,1.35,.5);ctx.globalAlpha=1}

function sortY(a,b){return a.y-b.y}
const drawList=[];
function render(t){
 if(!G||!WORLD)return;const night=nightAmt(gameHour());
 let sx=0,sy=0;if(G.shake>0){sx=(Math.random()-.5)*G.shake*10;sy=(Math.random()-.5)*G.shake*10}
 const ocx=cam.x,ocy=cam.y;cam.x+=sx;cam.y+=sy;
 drawWater(t);
 ctx.setTransform(cam.z*dpr,0,0,cam.z*dpr,-cam.x*cam.z*dpr,-cam.y*cam.z*dpr);ctx.imageSmoothingEnabled=true;
 drawTerrain(t);
 const x0=cam.x,y0=cam.y,x1=cam.x+VW/cam.z,y1=cam.y+VH/cam.z;
 if(QUAL<3)drawBlight(t);drawDeposits(t);
 drawSupplyAndGhost(t,1);
 // buildings
 for(const b of G.buildings){if(b.x+b.r<x0-40||b.x-b.r>x1+40||b.y+b.r<y0-40||b.y-b.r>y1+40)continue;drawBuilding(b,t)}
 // selection under
 drawSelection(t);
 // ground entities
 drawList.length=0;
 for(const n of G.nests)if(!n.dead&&onScr(n.x,n.y,120))drawList.push(n);
 for(const u of G.units)if(u.d.dom!=='air'&&onScr(u.x,u.y,60))drawList.push(u);
 for(const z of G.zombies)if(!z.fly&&onScr(z.x,z.y,60))drawList.push(z);
 drawList.sort(sortY);
 const lod=cam.z<.45||drawList.length>400;for(const e of drawList){if(e.k==='n')drawNest(e,t);else if(e.k==='u')drawUnit(e,t);else if(lod){ctx.fillStyle=e.elite?'#e0f':'#7a8f5a';ctx.beginPath();ctx.arc(e.x,e.y,e.elite?9:6,0,6.3);ctx.fill()}else drawZombie(e,t)}
 // particles low
 drawParts(t,false);
 drawCrates(t);
 drawProj(t);
 // air
 drawList.length=0;for(const u of G.units)if(u.d.dom==='air'&&onScr(u.x,u.y,100))drawList.push(u);for(const z of G.zombies)if(z.fly&&onScr(z.x,z.y,60))drawList.push(z);
 for(const e of drawList){if(e.k==='u')drawAirUnit(e,t);else drawGargoyle(e,t)}
 drawParts(t,true);
 drawFloats();
 drawBars();
 drawMarkers(t);
 drawGhostTop(t);
 // lighting
 if(night>.02&&QUAL<2)drawLighting(t,night);
 ctx.setTransform(dpr,0,0,dpr,0,0);
 drawEdgeIndicators(t);
 if(UIs.box){const b=UIs.box;ctx.strokeStyle='rgba(110,255,150,.9)';ctx.fillStyle='rgba(110,255,150,.1)';ctx.lineWidth=1;const x=Math.min(b.x0,b.x1),y=Math.min(b.y0,b.y1),w=Math.abs(b.x1-b.x0),h=Math.abs(b.y1-b.y0);ctx.fillRect(x,y,w,h);ctx.strokeRect(x+.5,y+.5,w,h)}
 cam.x=ocx;cam.y=ocy;
}
function drawBlight(t){for(const n of G.nests){if(n.dead||!onScr(n.x,n.y,300))continue;const R=150+Math.min(n.lvl,10)*26+Math.sin(t*.8+n.pulse)*6;
 const g=ctx.createRadialGradient(n.x,n.y,R*.2,n.x,n.y,R);g.addColorStop(0,'rgba(90,20,110,.55)');g.addColorStop(.6,'rgba(70,16,90,.3)');g.addColorStop(1,'rgba(60,10,80,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(n.x,n.y,R,0,TAU);ctx.fill();
 ctx.strokeStyle='rgba(120,30,90,.5)';ctx.lineWidth=2.4;ctx.lineCap='round';for(let i=0;i<12;i++){const a=i/12*TAU+hash2(i,n.id,1)*.4;const L=R*(.55+hash2(i,n.id,2)*.4);ctx.beginPath();ctx.moveTo(n.x+Math.cos(a)*30,n.y+Math.sin(a)*30);ctx.quadraticCurveTo(n.x+Math.cos(a+.4+Math.sin(t+i)*.1)*L*.6,n.y+Math.sin(a+.4)*L*.6,n.x+Math.cos(a)*L,n.y+Math.sin(a)*L);ctx.stroke()}ctx.lineCap='butt'}}
function drawDeposits(t){for(const d of WORLD.deposits){if(!d)continue;const x=(d.tx+1)*TILE,y=(d.ty+1)*TILE;if(!onScr(x,y,60))continue;if(d.used)continue;const s=d.type==='ore'?oreSprite():oilSprite(d.water);ctx.drawImage(s,x-35,y-35,70,70);
 if(d.type==='ore'){const k=.5+.5*Math.sin(t*3+d.id);ctx.fillStyle='rgba(255,255,255,'+k*.8+')';ctx.fillRect(x-8+d.id%5*3,y-6,2,2)}
 UIs.build&&UIs.build.type&&B[UIs.build.type].dep===d.type&&(ctx.strokeStyle='rgba(255,220,80,.9)',ctx.lineWidth=2,ctx.setLineDash([6,4]),ctx.strokeRect(d.tx*TILE,d.ty*TILE,64,64),ctx.setLineDash([]))}}
function drawSupplyAndGhost(t,pass){const bd=UIs.build;if(!bd||!bd.type)return;ctx.save();ctx.globalAlpha=.1;ctx.fillStyle='#58ff90';ctx.beginPath();for(const b of G.buildings){if(!b.done||b.dead||!isFriend(ME.id,b.o))continue;if(!onScr(b.x,b.y,16*TILE+50))continue;ctx.moveTo(b.x+16*TILE,b.y);ctx.arc(b.x,b.y,16*TILE,0,TAU)}ctx.fill();ctx.restore();
 for(const n of G.nests){if(n.dead||!onScr(n.x,n.y,300))continue;ctx.fillStyle='rgba(255,40,60,.12)';ctx.beginPath();ctx.arc(n.x,n.y,8*TILE,0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,60,80,.5)';ctx.setLineDash([8,6]);ctx.stroke();ctx.setLineDash([])}}
function drawBuilding(b,t){const d=b.d;const sp=buildingSprite(b.type,b.d.wall?b.mask:(b.water&&b.type==='derrick'?'w':0));
 ctx.save();
 if(!b.done){ctx.globalAlpha=.35+.55*clamp(b.prog,0,1)}
 ctx.drawImage(sp,b.x-sp._w/2,b.y-sp._h/2,sp._w,sp._h);
 ctx.globalAlpha=1;
 if(!b.done){ctx.strokeStyle='rgba(255,200,60,.9)';ctx.lineWidth=1.5;ctx.setLineDash([5,4]);ctx.strokeRect(b.x-b.w/2,b.y-b.h/2,b.w,b.h);ctx.setLineDash([]);ctx.strokeStyle='rgba(255,200,60,.35)';ctx.beginPath();for(let i=-b.w;i<b.w;i+=10){ctx.moveTo(b.x-b.w/2+i,b.y-b.h/2);ctx.lineTo(b.x-b.w/2+i+b.h,b.y+b.h/2)}ctx.save();ctx.beginPath();ctx.rect(b.x-b.w/2,b.y-b.h/2,b.w,b.h);ctx.clip();ctx.stroke();ctx.restore()}
 else{
  const tu=buildingTurret(b.type);if(tu){ctx.translate(b.x,b.y);ctx.rotate(b.ang);ctx.drawImage(tu,-tu._w/2,-tu._h/2,tu._w,tu._h);if(b.flash>0){ctx.fillStyle='rgba(255,220,140,.9)';ctx.beginPath();ctx.arc(tu._w/2-6,0,6,0,TAU);ctx.fill()}ctx.rotate(-b.ang);ctx.translate(-b.x,-b.y)}
  buildingAnim(b,t)}
 if(b.hurtT>0){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.3;ctx.drawImage(sp,b.x-sp._w/2,b.y-sp._h/2,sp._w,sp._h);ctx.globalCompositeOperation='source-over'}
 ctx.restore();teamMark(b)}
function ownerColor(o){const p=G.players.get(o);return p?p.color:'#aaa'}
function teamMark(b){const col=ownerColor(b.o);const x=b.x-b.w/2,y=b.y+b.h/2;ctx.save();ctx.fillStyle=col;ctx.globalAlpha=.9;if(b.d.wall){ctx.fillRect(b.x-3,b.y-3,6,6)}else{ctx.fillRect(x+1,y-4,b.w-2,3);ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(x+1,y-1,b.w-2,1)}
 if(b.type==='hq'){const p=G.players.get(b.o);if(p){ctx.globalAlpha=1;ctx.font='800 13px Oxanium,sans-serif';ctx.textAlign='center';ctx.fillStyle='rgba(0,0,0,.75)';ctx.fillText(p.name,b.x+1,b.y-b.h/2-16);ctx.fillStyle=col;ctx.fillText(p.name,b.x,b.y-b.h/2-17)}}ctx.restore()}
function buildingAnim(b,t){const x=b.x,y=b.y;switch(b.type){
 case'derrick':{const a=Math.sin(t*2+b.id)*.35;ctx.save();ctx.translate(x-(b.water?10:18),y-(b.water?4:6));ctx.rotate(a);ctx.fillStyle='#d8a020';ctx.strokeStyle='#4a3000';ctx.lineWidth=1;ctx.fillRect(-4,-2.5,34,5);ctx.strokeRect(-4,-2.5,34,5);ctx.beginPath();ctx.arc(30,0,3.5,0,TAU);ctx.fillStyle='#333';ctx.fill();ctx.restore()}break;
 case'radar':{ctx.save();ctx.translate(x,y);ctx.rotate(t*1.1+b.id);ctx.fillStyle='#d6dce0';ctx.strokeStyle='#222';ctx.lineWidth=1.2;ctx.beginPath();ctx.ellipse(0,0,6,24,0,0,TAU);ctx.fill();ctx.stroke();ctx.fillStyle='#8a929a';ctx.fillRect(-1,-1,16,2);ctx.beginPath();ctx.arc(15,0,2.4,0,TAU);ctx.fillStyle='#ff4a3a';ctx.fill();ctx.restore()}break;
 case'mine':{ctx.save();ctx.translate(x,y+2);ctx.rotate(t*1.5);ctx.strokeStyle='#bbb';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,7,0,TAU);ctx.moveTo(-7,0);ctx.lineTo(7,0);ctx.moveTo(0,-7);ctx.lineTo(0,7);ctx.stroke();ctx.restore()}break;
 case'tesla':{const k=.5+.5*Math.sin(t*5+b.id);ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(x,y,0,x,y,28);g.addColorStop(0,'rgba(140,220,255,'+(.5+k*.3)+')');g.addColorStop(1,'rgba(140,220,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,28,0,TAU);ctx.fill();ctx.globalCompositeOperation='source-over';if(Math.random()<.15){ctx.strokeStyle='#bfefff';ctx.lineWidth=1;ctx.beginPath();let px=x,py=y;for(let i=0;i<4;i++){px+=rnd(-8,8);py+=rnd(-8,8);ctx.lineTo(px,py)}ctx.stroke()}}break;
 case'lab':{const k=.5+.5*Math.sin(t*2+b.id);ctx.fillStyle='rgba(80,255,120,'+(.25+k*.4)+')';ctx.beginPath();ctx.arc(x-18,y+14,4,0,TAU);ctx.fill();if(G.cur){ctx.fillStyle='rgba(120,220,255,'+(.4+k*.4)+')';ctx.fillRect(x-20,y-20,26,14)}}break;
 case'hq':{const k=.5+.5*Math.sin(t*3);ctx.fillStyle='rgba(255,70,60,'+(.4+.6*k)+')';ctx.beginPath();ctx.arc(x-6,y-46+(-0),2.6,0,TAU);ctx.fill();ctx.save();ctx.translate(x+26,y+26);ctx.rotate(t*6);ctx.strokeStyle='rgba(220,220,220,.5)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(12,0);ctx.stroke();ctx.restore()}break;
 case'hospital':{const k=Math.sin(t*3)>0;ctx.fillStyle=k?'rgba(255,60,60,.9)':'rgba(255,255,255,.3)';ctx.beginPath();ctx.arc(x+16,y-16,2.5,0,TAU);ctx.fill()}break;
 case'airfield':case'factory':case'barracks':case'harbor':if(b.queue.length){const q=b.queue[0];ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(b.x-b.w/2+4,b.y+b.h/2-9,b.w-8,5);ctx.fillStyle='#ffb020';ctx.fillRect(b.x-b.w/2+5,b.y+b.h/2-8,(b.w-10)*q.prog,3)}break;
}}
function drawSelection(t){for(const e of G.sel){if(e.dead)continue;if(e.k==='u'){const rr=e.r+5+(e.d.dom==='air'?2:0);ctx.strokeStyle='#6dff9a';ctx.lineWidth=1.6;ctx.beginPath();ctx.ellipse(e.x,e.y+(e.d.dom==='air'?14:2),rr+2,(rr+2)*.7,0,0,TAU);ctx.stroke();ctx.fillStyle='rgba(109,255,154,.12)';ctx.fill();if(e.dest){ctx.strokeStyle='rgba(109,255,154,.35)';ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.dest.x,e.dest.y);ctx.stroke();ctx.setLineDash([])}
   if(e.d.range&&G.sel.length<4){ctx.strokeStyle='rgba(109,255,154,.22)';ctx.beginPath();ctx.arc(e.x,e.y,e.d.range,0,TAU);ctx.stroke()}}
  else if(e.k==='b'){const x=e.x-e.w/2-3,y=e.y-e.h/2-3,w=e.w+6,h=e.h+6,L=Math.min(10,w/3);ctx.strokeStyle='#6dff9a';ctx.lineWidth=2;ctx.beginPath();for(const[cx,cy,dx,dy]of[[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]]){ctx.moveTo(cx+dx*L,cy);ctx.lineTo(cx,cy);ctx.lineTo(cx,cy+dy*L)}ctx.stroke();
   const wp=e.d.weapon;if(wp){ctx.strokeStyle='rgba(109,255,154,.25)';ctx.beginPath();ctx.arc(e.x,e.y,wp.range,0,TAU);ctx.stroke();if(wp.minRange){ctx.beginPath();ctx.arc(e.x,e.y,wp.minRange,0,TAU);ctx.stroke()}}
   if(e.rally){ctx.strokeStyle='rgba(255,220,80,.6)';ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.rally.x,e.rally.y);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#ffd24a';ctx.fillRect(e.rally.x,e.rally.y-14,1.6,14);ctx.beginPath();ctx.moveTo(e.rally.x+1.6,e.rally.y-14);ctx.lineTo(e.rally.x+11,e.rally.y-10);ctx.lineTo(e.rally.x+1.6,e.rally.y-6);ctx.fill()}}
  else if(e.k==='n'){ctx.strokeStyle='#ff5a6a';ctx.lineWidth=2;ctx.beginPath();ctx.arc(e.x,e.y,e.r*1.4,0,TAU);ctx.stroke()}}}
function drawNest(n,t){const tier=n.lvl<=2?0:n.lvl<=4?1:2;const s=nestSprite(tier);const pul=(1+Math.sin(t*2.2+n.pulse)*.03)*(1+Math.min(.6,(n.lvl-1)*.035));ctx.save();ctx.translate(n.x,n.y);ctx.scale(pul,pul);ctx.drawImage(s,-s._w/2,-s._h/2,s._w,s._h);nestCore(ctx,t+n.pulse,s._w*.42);
 if(n.hurtT>0){ctx.globalCompositeOperation='lighter';ctx.fillStyle='rgba(255,255,255,.3)';ctx.beginPath();ctx.arc(0,0,s._w*.4,0,TAU);ctx.fill()}ctx.restore()}
function drawUnit(u,t){const d=u.d;const sh=d.dom==='water'?0:.28;ringTeam(u);
 if(d.dom==='land'){ell(ctx,u.x+2,u.y+3,u.r+2,(u.r+2)*.7,'rgba(0,0,0,'+sh+')')}
 if(d.cls==='inf'){const s=infSprite(u.type,u.moving?(Math.floor(u.anim)&1):0);ctx.save();ctx.translate(u.x,u.y);ctx.rotate(u.ang);ctx.drawImage(s,-s._w/2,-s._h/2,s._w,s._h);if(u.flash>0){ctx.fillStyle='rgba(255,230,150,.9)';ctx.beginPath();ctx.arc(16,2,3,0,TAU);ctx.fill()}
   if((u.d.look||u.type)==='flamer'&&u.tgt&&u.cd<.05){}ctx.restore()}
 else if(d.cls==='veh'){const s=vehSprite(u.type),tu=vehTurret(u.type);ctx.save();ctx.translate(u.x,u.y);ctx.rotate(u.ang);ctx.drawImage(s,-s._w/2,-s._h/2,s._w,s._h);ctx.restore();ctx.save();ctx.translate(u.x,u.y);ctx.rotate(u.tang);const off=u.flash>0?-2:0;ctx.drawImage(tu,-tu._w/2+off,-tu._h/2,tu._w,tu._h);if(u.flash>0){ctx.fillStyle='rgba(255,230,150,.95)';ctx.beginPath();ctx.arc(tu._w/2+4,0,(u.d.look||u.type)==='jeep'?4:8,0,TAU);ctx.fill()}ctx.restore()}
 else if(d.cls==='nav'){const s=navSprite(u.type);const bob=Math.sin(t*2+u.id)*.6;ctx.save();ctx.translate(u.x,u.y+bob);ctx.globalAlpha=.25;ctx.fillStyle='#000';ctx.restore();
  ctx.save();ctx.translate(u.x,u.y);ctx.rotate(u.ang);ctx.drawImage(s,-s._w/2,-s._h/2,s._w,s._h);ctx.restore();
  const tu=navTurret(u.type);for(const[ox,oy]of NAVTUR[u.d.look||u.type]||[]){const c=Math.cos(u.ang),sn=Math.sin(u.ang);ctx.save();ctx.translate(u.x+ox*c-oy*sn,u.y+ox*sn+oy*c);ctx.rotate(u.tang);ctx.drawImage(tu,-tu._w/2,-tu._h/2,tu._w,tu._h);ctx.restore()}
  if((u.d.look||u.type)==='patrol'){ctx.save();ctx.translate(u.x+Math.cos(u.ang)*14,u.y+Math.sin(u.ang)*14);ctx.rotate(u.tang);ctx.fillStyle='#222';ctx.fillRect(0,-1,10,2);ctx.restore()}
  if(u.flash>0){ctx.fillStyle='rgba(255,230,150,.9)';ctx.beginPath();ctx.arc(u.x+Math.cos(u.tang)*(u.r+6),u.y+Math.sin(u.tang)*(u.r+6),6,0,TAU);ctx.fill()}}
 if(u.hurtT>0&&d.cls==='inf'){ctx.fillStyle='rgba(255,60,60,.35)';ctx.beginPath();ctx.arc(u.x,u.y,u.r+1,0,TAU);ctx.fill()}}
function ringTeam(u){const mine=u.o===ME.id;ctx.strokeStyle=ownerColor(u.o);ctx.globalAlpha=mine?.55:.9;ctx.lineWidth=mine?1.2:1.8;ctx.beginPath();ctx.ellipse(u.x,u.y+(u.d.dom==='air'?14:2),u.r+3,(u.r+3)*.7,0,0,TAU);ctx.stroke();ctx.globalAlpha=1}
function drawAirUnit(u,t){const d=u.d;ringTeam(u);const bob=Math.sin(t*2.4+u.id)*1.6;const s=airSprite(u.type);const alt=d.cls==='air'&&(u.d.look||u.type)==='drone'?10:(u.d.look||u.type)==='bomber'?22:16;
 ctx.save();ctx.globalAlpha=.22;ctx.translate(u.x+alt*1.0,u.y+alt*1.5);ctx.rotate(u.ang);ctx.drawImage(s,-s._w/2*.9,-s._h/2*.9,s._w*.9,s._h*.9);ctx.globalCompositeOperation='source-atop';ctx.restore();
 ctx.save();ctx.translate(u.x,u.y+bob);ctx.rotate(u.ang);
 if((u.d.look||u.type)==='fighter'||(u.d.look||u.type)==='bomber')ctx.scale(1.05,1.05);
 ctx.drawImage(s,-s._w/2,-s._h/2,s._w,s._h);
 if((u.d.look||u.type)==='gunship'){ctx.rotate(-u.ang+t*38);ctx.strokeStyle='rgba(30,30,30,.75)';ctx.lineWidth=2.4;ctx.beginPath();ctx.moveTo(-26,0);ctx.lineTo(26,0);ctx.moveTo(0,-26);ctx.lineTo(0,26);ctx.stroke();ctx.fillStyle='rgba(200,220,230,.13)';ctx.beginPath();ctx.arc(0,0,26,0,TAU);ctx.fill();ctx.rotate(-t*38+u.ang);ctx.save();ctx.translate(-31,0);ctx.rotate(t*50);ctx.strokeStyle='rgba(30,30,30,.7)';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(-5,0);ctx.lineTo(5,0);ctx.stroke();ctx.restore()}
 if((u.d.look||u.type)==='drone'){for(const[x,y]of[[-9,-9],[9,-9],[-9,9],[9,9]]){ctx.fillStyle='rgba(210,220,230,.28)';ctx.beginPath();ctx.arc(x,y,6.5,0,TAU);ctx.fill()}}
 if((u.d.look||u.type)==='bomber'){for(const y of[-24,-12,12,24]){ctx.fillStyle='rgba(210,220,230,.25)';ctx.beginPath();ctx.arc(10,y,7,0,TAU);ctx.fill();ctx.save();ctx.translate(10,y);ctx.rotate(t*40+y);ctx.strokeStyle='rgba(20,20,20,.5)';ctx.beginPath();ctx.moveTo(-7,0);ctx.lineTo(7,0);ctx.stroke();ctx.restore()}}
 if((u.d.look||u.type)==='fighter'){ctx.fillStyle='rgba(255,170,60,'+(.5+.4*Math.random())+')';ctx.beginPath();ctx.moveTo(-30,-2);ctx.lineTo(-38-Math.random()*6,0);ctx.lineTo(-30,2);ctx.fill()}
 if(u.flash>0){ctx.rotate(u.tang-u.ang);ctx.fillStyle='rgba(255,230,150,.95)';ctx.beginPath();ctx.arc(d.r+8,0,4,0,TAU);ctx.fill()}
 ctx.restore()}
function drawZombie(z,t){const d=z.d;const fr=Math.floor(z.anim)&3;const s=zombieSprite(z.type,fr,z.v,zFlags());const sc=(z.elite?1.25:1);
 const inW=!z.fly&&T[clamp((z.y/TILE)|0,0,MH-1)*MW+clamp((z.x/TILE)|0,0,MW-1)]===0;
 if(!inW)ell(ctx,z.x+2,z.y+3,z.r+1,(z.r+1)*.7,'rgba(0,0,0,.28)');
 if(z.elite){ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(z.x,z.y,2,z.x,z.y,z.r*2.6);g.addColorStop(0,'rgba(255,60,200,.55)');g.addColorStop(1,'rgba(255,60,200,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(z.x,z.y,z.r*2.6,0,TAU);ctx.fill();ctx.globalCompositeOperation='source-over'}
 if(d.boss){ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(z.x,z.y,4,z.x,z.y,70);g.addColorStop(0,'rgba(255,90,40,.45)');g.addColorStop(1,'rgba(255,90,40,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(z.x,z.y,70,0,TAU);ctx.fill();ctx.globalCompositeOperation='source-over'}
 ctx.save();ctx.translate(z.x,z.y);ctx.rotate(z.ang);if(sc!==1)ctx.scale(sc,sc);if(inW)ctx.globalAlpha=.78;
 const hurtFlash=z.hurtT>1.85;ctx.drawImage(s,-s._w/2,-s._h/2,s._w,s._h);
 if(z.type==='bloater'){const pu=.5+.5*Math.sin(t*5+z.id);ctx.fillStyle='rgba(210,255,90,'+pu*.18+')';ctx.beginPath();ctx.arc(0,0,11,0,TAU);ctx.fill()}
 if(hurtFlash){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.4;ctx.drawImage(s,-s._w/2,-s._h/2,s._w,s._h)}
 ctx.restore();
 if(inW){ctx.strokeStyle='rgba(220,245,255,.5)';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(z.x,z.y,z.r+3+Math.sin(t*4+z.id)*1.5,(z.r+3)*.7,0,0,TAU);ctx.stroke()}
 if(z.burn>0){ctx.globalCompositeOperation='lighter';const g=ctx.createRadialGradient(z.x,z.y,1,z.x,z.y,z.r*2);g.addColorStop(0,'rgba(255,170,50,.7)');g.addColorStop(1,'rgba(255,100,20,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(z.x,z.y,z.r*2,0,TAU);ctx.fill();ctx.globalCompositeOperation='source-over'}}
function drawGargoyle(z,t){const s=zombieSprite('gargoyle',Math.floor(z.anim*1.5)&3,0,zFlags());ctx.save();ctx.globalAlpha=.25;ctx.translate(z.x+10,z.y+16);ctx.rotate(z.ang);ctx.drawImage(s,-s._w/2,-s._h/2,s._w,s._h);ctx.restore();ctx.save();ctx.translate(z.x,z.y+Math.sin(t*5+z.id)*1.5);ctx.rotate(z.ang);ctx.drawImage(s,-s._w/2,-s._h/2,s._w,s._h);ctx.restore()}
function drawParts(t,top){ctx.save();for(const p of G.parts){const isTop=p.t==='smoke'||p.t==='bolt'||p.t==='flash'||p.t==='ring'||p.t==='fire'||p.t==='spore'||p.t==='tracer'||p.t==='heal';if(top!==isTop&&!(top===false&&!isTop))continue;if(top!==isTop)continue;
  if(p.x<cam.x-100&&p.t!=='bolt'||p.x>cam.x+VW/cam.z+100&&p.t!=='bolt'||p.y<cam.y-100&&p.t!=='bolt'||p.y>cam.y+VH/cam.z+100&&p.t!=='bolt')continue;
  const f=p.life/p.max;
  switch(p.t){
   case'tracer':ctx.strokeStyle=p.c;ctx.globalAlpha=f;ctx.lineWidth=p.s;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+(p.x2-p.x)*(1-f*.3),p.y+(p.y2-p.y)*(1-f*.3));ctx.stroke();break;
   case'flash':ctx.globalCompositeOperation='lighter';ctx.globalAlpha=f;{const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.s);g.addColorStop(0,p.c);g.addColorStop(1,'rgba(255,160,40,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,p.s,0,TAU);ctx.fill()}ctx.globalCompositeOperation='source-over';break;
   case'ring':ctx.globalAlpha=f;ctx.strokeStyle=p.c;ctx.lineWidth=3*f+1;ctx.beginPath();ctx.arc(p.x,p.y,p.s*(1.2-f*.9),0,TAU);ctx.stroke();break;
   case'smoke':ctx.globalAlpha=f*.4;ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,p.s,0,TAU);ctx.fill();break;
   case'fire':case'flame':ctx.globalCompositeOperation='lighter';ctx.globalAlpha=f*.85;{const r=p.s*(p.t==='flame'?(1.6-f):f+.3);const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);g.addColorStop(0,'rgba(255,240,170,.95)');g.addColorStop(.4,p.c);g.addColorStop(1,'rgba(200,40,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r,0,TAU);ctx.fill()}ctx.globalCompositeOperation='source-over';break;
   case'bolt':ctx.globalCompositeOperation='lighter';ctx.globalAlpha=f;ctx.strokeStyle=p.c;ctx.lineWidth=3;ctx.shadowColor='#6fd8ff';ctx.shadowBlur=8;ctx.beginPath();for(let i=0;i<p.pts.length-1;i++){const a=p.pts[i],b=p.pts[i+1];ctx.moveTo(a.x,a.y);const n=5;for(let k=1;k<n;k++){const q=k/n;ctx.lineTo(a.x+(b.x-a.x)*q+rnd(-6,6),a.y+(b.y-a.y)*q+rnd(-6,6))}ctx.lineTo(b.x,b.y)}ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.stroke();ctx.globalCompositeOperation='source-over';break;
   case'spore':ctx.globalAlpha=f*.8;ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,p.s*f+.5,0,TAU);ctx.fill();break;
   case'heal':ctx.globalAlpha=f;ctx.fillStyle=p.c;ctx.fillRect(p.x-1,p.y-3,2,6);ctx.fillRect(p.x-3,p.y-1,6,2);break;
   case'wake':ctx.globalAlpha=f*.5;ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.x,p.y,p.s*(2-f),0,TAU);ctx.stroke();break;
   case'acid':case'blood':case'debris':case'spark':ctx.globalAlpha=Math.min(1,f*1.5);ctx.fillStyle=p.c;ctx.beginPath();ctx.arc(p.x,p.y,p.s*(p.t==='spark'?f:1),0,TAU);ctx.fill();break;
  }
  ctx.globalAlpha=1}ctx.restore()}
function drawProj(t){for(const p of G.proj){const f=clamp(p.age/p.dur,0,1);
 if(p.t==='shell'){const h=Math.sin(f*Math.PI)*Math.min(60,Math.hypot(p.tx-p.sx,p.ty-p.sy)*.25);ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(p.x,p.y,3,2,0,0,TAU);ctx.fill();ctx.fillStyle=p.big?'#ffd890':'#ffe9b0';ctx.beginPath();ctx.arc(p.x,p.y-h,p.big?3.6:2.6,0,TAU);ctx.fill();ctx.strokeStyle='rgba(255,220,150,.4)';ctx.beginPath();ctx.moveTo(p.x,p.y-h);ctx.lineTo(lerp(p.sx,p.x,.9),lerp(p.sy,p.y,.9)-h);ctx.stroke()}
 else if(p.t==='rocket'){ctx.fillStyle='#ddd';ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.atan2(p.ty-p.sy,p.tx-p.sx));ctx.fillRect(-4,-1.2,8,2.4);ctx.fillStyle='#ff9a30';ctx.fillRect(-7,-1,3,2);ctx.restore()}
 else if(p.t==='acid'){const h=Math.sin(f*Math.PI)*24;ctx.fillStyle='#b6ff4a';ctx.beginPath();ctx.arc(p.x,p.y-h,3.2,0,TAU);ctx.fill();ctx.fillStyle='rgba(90,140,20,.4)';ctx.beginPath();ctx.ellipse(p.x,p.y,3,2,0,0,TAU);ctx.fill()}
 else if(p.t==='bomb'){const alt=(1-f)*40;ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(p.x,p.y,4,3,0,0,TAU);ctx.fill();ctx.fillStyle='#2a2a2a';ctx.beginPath();ctx.ellipse(p.x,p.y-alt,2.5,4.5,0,0,TAU);ctx.fill()}}}
function drawFloats(){ctx.font='700 13px Oxanium,sans-serif';ctx.textAlign='center';for(const f of G.floats){ctx.globalAlpha=clamp(f.life/f.max*1.5,0,1);ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillText(f.t,f.x+1,f.y+1);ctx.fillStyle='#ffd24a';ctx.fillText(f.t,f.x,f.y)}ctx.globalAlpha=1}
function hpBar(x,y,w,f,col){ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(x-w/2-1,y-1,w+2,5);ctx.fillStyle=col||(f>.6?'#5be37d':f>.3?'#ffcc40':'#ff4b3e');ctx.fillRect(x-w/2,y,w*clamp(f,0,1),3)}
function drawBars(){for(const b of G.buildings){if(b.dead||!onScr(b.x,b.y,100))continue;const sel=G.sel.includes(b);if(b.hp<b.maxhp*.995||sel||!b.done)hpBar(b.x,b.y-b.h/2-9,Math.max(22,b.w*.8),b.hp/b.maxhp,!b.done?'#ffb020':null)}
 for(const u of G.units){if(!onScr(u.x,u.y,60))continue;const sel=G.sel.includes(u);if(u.hp<u.maxhp*.995||sel)hpBar(u.x,u.y-u.r-(u.d.dom==='air'?18:8),Math.max(16,u.r*2),u.hp/u.maxhp)}
 for(const z of G.zombies){if(!onScr(z.x,z.y,60))continue;if(z.hpf<.995&&(z.maxhp>150||z.hurtT>1))hpBar(z.x,z.y-z.r-8,Math.max(14,z.r*2.2),z.hpf,'#d946ef');else if(z.d.boss)hpBar(z.x,z.y-z.r-14,60,z.hpf,'#ff5a3a')}
 for(const n of G.nests){if(n.dead||!onScr(n.x,n.y,120))continue;ctx.fillStyle='#f0b0ff';ctx.font='700 11px Oxanium,sans-serif';ctx.textAlign='center';ctx.fillText('NEST Lv'+n.lvl+(G.endless?' ∞':''),n.x,n.y-n.r*(G.endless?1+Math.min(.6,(n.lvl-1)*.035):1)-26)}}
function drawMarkers(t){for(const m of UIs.markers){const f=(t-m.t)/.8;if(f>1)continue;ctx.strokeStyle=m.c;ctx.globalAlpha=1-f;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(m.x,m.y,18*(1-f)+4,(18*(1-f)+4)*.65,0,0,TAU);ctx.stroke();ctx.globalAlpha=1}UIs.markers=UIs.markers.filter(m=>t-m.t<.8)}
function drawGhostTop(t){const bd=UIs.build;if(!bd||!bd.type||bd.tx===undefined)return;const d=B[bd.type];const x=bd.tx*TILE,y=bd.ty*TILE,w=d.size*TILE;const ok=!bd.err;
 const sp=buildingSprite(bd.type,B[bd.type].wall?0:(bd.type==='derrick'&&bd.water?'w':0));ctx.save();ctx.globalAlpha=.65;ctx.drawImage(sp,x+w/2-sp._w/2,y+w/2-sp._h/2,sp._w,sp._h);const tu=buildingTurret(bd.type);if(tu)ctx.drawImage(tu,x+w/2-tu._w/2,y+w/2-tu._h/2,tu._w,tu._h);ctx.globalAlpha=.35;ctx.fillStyle=ok?'#38ff7a':'#ff3a3a';ctx.fillRect(x,y,w,w);ctx.globalAlpha=1;ctx.strokeStyle=ok?'#38ff7a':'#ff3a3a';ctx.lineWidth=2;ctx.strokeRect(x,y,w,w);
 if(d.weapon){ctx.strokeStyle=ok?'rgba(110,255,150,.5)':'rgba(255,90,90,.4)';ctx.beginPath();ctx.arc(x+w/2,y+w/2,d.weapon.range,0,TAU);ctx.stroke()}ctx.restore()}
function drawLighting(t,night){const a=.6*night;const Q=.25;const W=LCV.width,H=LCV.height;LCX.globalCompositeOperation='source-over';LCX.setTransform(1,0,0,1,0,0);LCX.fillStyle='rgba(5,9,28,'+a+')';LCX.fillRect(0,0,W,H);LCX.globalCompositeOperation='destination-out';
 const k=cam.z*dpr*Q;let cnt=0;const L=(x,y,r,al)=>{if(cnt>160||!onScr(x,y,r))return;cnt++;LCX.globalAlpha=al;const s=r*2*k;LCX.drawImage(LIGHT,(x-cam.x)*k-s/2,(y-cam.y)*k-s/2,s,s)};
 for(const b of G.buildings){if(b.done&&b.d.light)L(b.x,b.y,b.d.light*1.3,.95)}
 for(const u of G.units)L(u.x,u.y,u.d.cls==='inf'?58:u.d.cls==='air'?80:85,.9);
 for(const n of G.nests)L(n.x,n.y,150,.55);
 for(const p of G.parts)if(p.t==='flash'||p.t==='flame')L(p.x,p.y,(p.s||10)*3.5,.6*p.life/p.max);
 for(const z of G.zombies)if(z.elite||z.burn>0||z.d.boss)L(z.x,z.y,z.d.boss?120:46,.55);
 LCX.globalAlpha=1;LCX.globalCompositeOperation='source-over';
 ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=true;ctx.drawImage(LCV,0,0,W,H,0,0,cv.width,cv.height);
 ctx.setTransform(cam.z*dpr,0,0,cam.z*dpr,-cam.x*cam.z*dpr,-cam.y*cam.z*dpr);ctx.globalCompositeOperation='lighter';
 for(const n of G.nests)if(onScr(n.x,n.y,200)){ctx.globalAlpha=.22*night;ctx.drawImage(tint('#d040ff'),n.x-130,n.y-130,260,260)}
 ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'}
const TINT={};function tint(col){if(TINT[col])return TINT[col];const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.drawImage(LIGHT,0,0);x.globalCompositeOperation='source-in';x.fillStyle=col;x.fillRect(0,0,128,128);TINT[col]=c;return c}
function drawEdgeIndicators(t){const buckets={};const cx=cam.x+VW/cam.z/2,cy=cam.y+VH/cam.z/2;for(const z of G.zombies){if(z.mode!=='assault'||z.dead)continue;if(onScr(z.x,z.y,20))continue;const a=Math.atan2(z.y-cy,z.x-cx);const k=Math.round(a/(TAU/16));const b=buckets[k]||(buckets[k]={n:0,a:k*TAU/16});b.n++}
 for(const k in buckets){const b=buckets[k];if(b.n<4)continue;const a=b.a;const mx=VW/2-40,my=(VH-190)/2-30;const s=Math.min(Math.abs(mx/Math.cos(a)),Math.abs(my/Math.sin(a)));const x=VW/2+Math.cos(a)*s,y=(VH-190)/2+80+Math.sin(a)*s*.98;
  ctx.save();ctx.translate(x,y);ctx.rotate(a);const p=.6+.4*Math.sin(t*6);ctx.fillStyle='rgba(255,70,60,'+(.55+.4*p)+')';ctx.beginPath();ctx.moveTo(16,0);ctx.lineTo(-8,-11);ctx.lineTo(-3,0);ctx.lineTo(-8,11);ctx.closePath();ctx.fill();ctx.restore();ctx.fillStyle='#fff';ctx.font='700 11px Oxanium,sans-serif';ctx.textAlign='center';ctx.fillText(b.n,x-Math.cos(a)*16,y-Math.sin(a)*16+4)}}

function drawCrates(t){if(!G||!G.crates)return;for(const c of G.crates){if(!onScr(c.x,c.y,80))continue;const p=.5+.5*Math.sin(t*3+c.id);ctx.save();ctx.translate(c.x,c.y);ctx.globalAlpha=.25+.2*p;ctx.fillStyle='#ffd24a';ctx.beginPath();ctx.arc(0,0,34+6*p,0,TAU);ctx.fill();ctx.globalAlpha=1;ctx.fillStyle='#8a5a22';ctx.strokeStyle='#2a1808';ctx.lineWidth=2;ctx.fillRect(-11,-9,22,18);ctx.strokeRect(-11,-9,22,18);ctx.strokeStyle='#e8c070';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(-11,0);ctx.lineTo(11,0);ctx.moveTo(0,-9);ctx.lineTo(0,9);ctx.stroke();ctx.fillStyle='#fff';ctx.globalAlpha=.8;ctx.fillRect(-1.5,-90+6*p,3,70);ctx.restore()}}
