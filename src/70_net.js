/* ---------------- NETWORK CLIENT ---------------- */
const NET={ws:null,state:'idle',token:null,snapInt:100,lastSnap:0,snapId:0,retry:0,wantName:'',wantColor:null,seed:null,dead:null,rtt:0,pingAt:0,viewT:0,lastView:''};
let ME=null; // my player record (lives inside G.players)
try{NET.token=localStorage.getItem('deadfront_token')||null}catch(e){}
const has=id=>ME&&ME.done.has(id);
const afford=c=>affordP(ME,c);
const ucost=t=>ucostP(ME,t);
const canPlace=(t,x,y)=>canPlaceP(ME,t,x,y);
const uArmor=u=>uArmorP(ME,u);
const myHQ=()=>{for(const b of G.buildings)if(b.o===ME.id&&b.type==='hq')return b;return null};
function serverUrl(){const q=new URLSearchParams(location.search).get('server');if(q)return q;const p=location.protocol==='https:'?'wss://':'ws://';return p+location.host+'/ws'}
function httpBase(){const q=new URLSearchParams(location.search).get('server');if(q)return q.replace(/^ws/,'http').replace(/\/ws$/,'');return ''}
function netSend(o){if(NET.ws&&NET.ws.readyState===1)NET.ws.send(JSON.stringify(o))}
function netConnect(name,color){
 NET.wantName=name;NET.wantColor=color;
 if(location.protocol==='file:'){$('loading').classList.add('hidden');titleMsg('Open this page from your DEAD FRONT server (not from a file).');return}
 NET.state='connecting';$('loading').classList.remove('hidden');$('loading').textContent='CONNECTING TO SERVER…';
 let ws;try{ws=new WebSocket(serverUrl())}catch(e){titleMsg('Could not connect: '+e.message);return}
 ws.binaryType='arraybuffer';NET.ws=ws;
 ws.onopen=()=>{netSend({t:'join',name,color,token:NET.token})};
 ws.onmessage=ev=>{if(ev.data instanceof ArrayBuffer){try{applySnap(ev.data)}catch(e){console.error('snap',e)}return}let m;try{m=JSON.parse(ev.data)}catch(e){return}try{onNet(m)}catch(e){console.error('net',m.t,e)}};
 ws.onclose=()=>{if(NET.ws!==ws)return;NET.ws=null;if(UI.state==='play'||NET.state==='loading'){NET.state='lost';showConn('CONNECTION LOST — RECONNECTING…');setTimeout(()=>netConnect(NET.wantName,NET.wantColor),1800)}else if(NET.state==='connecting'){titleMsg('Server unreachable. Is it running?');$('loading').classList.add('hidden');NET.state='idle'}};
 ws.onerror=()=>{}}
function showConn(t){const e=$('conn');e.textContent=t;e.classList.toggle('hidden',!t)}
function titleMsg(t){const e=$('titleMsg');e.textContent=t;e.classList.toggle('hidden',!t);$('title').classList.remove('hidden')}
async function loadWorld(w){
 if(NET.seed!==w.seed||!WORLD){
  $('loading').textContent='DOWNLOADING TERRAIN…';
  let buf;const need=w.MW*w.MH*4;
  try{if(typeof DecompressionStream==='undefined')throw 0;const res=await fetch(httpBase()+'/world.gz?s='+w.seed,{cache:'no-store'});buf=await new Response(res.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();if(buf.byteLength!==need)throw 0}
  catch(e){const res=await fetch(httpBase()+'/world.raw?s='+w.seed,{cache:'no-store'});buf=await res.arrayBuffer();if(buf.byteLength!==need)throw new Error('terrain download incomplete ('+buf.byteLength+'/'+need+')')}
  
  setMapSize(w.MW,w.MH);const N=MW*MH;T.set(new Uint8Array(buf,0,N));const e16=new Uint16Array(buf,N,N);for(let i=0;i<N;i++)E[i]=e16[i]/30000-.5;const f8=new Uint8Array(buf,N*3,N);for(let i=0;i<N;i++)F[i]=f8[i]/255;
  WORLD={seed:w.seed,s4:w.s4,deposits:[]};buildMiniBG();terrainReset();NET.seed=w.seed}
 else{occ.fill(0);depGrid.fill(0);WORLD.deposits=[]}
 for(const d of w.dep)addDeposit(d[0],d[1],d[2],d[3],d[4]);for(const d of w.dep)WORLD.deposits[d[0]-1].used=!!d[5]}
function newClientGame(w){
 G={t:w.gt,tBase:w.gt,tAt:performance.now(),day:w.day,units:[],zombies:[],buildings:[],nests:[],proj:[],parts:[],alerts:[],banner:null,sel:[],groups:{},aid:0,players:new Map(),
  uM:new Map(),zM:new Map(),bM:new Map(),nM:new Map(),res:{c:0,m:0,f:0},rate:{c:0,m:0,f:0},pop:0,popCap:0,done:new Set(),cur:null,labs:0,hasRadar:false,alive:!!w.alive,
  mods:baseMods(),muts:[],floats:[],shake:0,stats:{kills:0,lost:0,built:0,trained:0},seen:new Set(['walker']),endless:true,speed:1,paused:false,over:null,zc:0,nn:0,age:1,
  mini:{z:[],n:[],f:[],rad:0},chat:[],online:1,nextMut:3,pend:null,reqIn:[],reqOut:[]};
 ME={id:w.you.id,name:w.you.name,color:w.you.color,res:G.res,done:G.done,allies:new Set(),alive:!!w.alive,online:true,perks:[],fx:computeFx([])};G.players.set(ME.id,ME);
 applyRoster(w.players);G.muts=w.muts||[];recomputeClientMods();for(const c of w.chat||[])pushChat(c);
 for(const n of w.nests)syncNest(n)}
function applyRoster(list){const seen=new Set();for(const r of list){seen.add(r.id);let p=G.players.get(r.id);if(!p){p={id:r.id,res:{c:0,m:0,f:0},done:new Set(),allies:new Set()};G.players.set(r.id,p)}
  p.name=r.n;p.color=r.c;p.alive=!!r.a;p.online=!!r.o;p.age=r.age;p.best=r.best;p.kills=r.k;p.hqPos=r.hq;if(p!==ME||true){p.allies=new Set(r.al)}if(p===ME)ME.alive=!!r.a}
 for(const id of[...G.players.keys()])if(!seen.has(id)&&id!==ME.id)G.players.delete(id);UI.rosterKey=''}
function recomputeClientMods(){let m=baseMods();for(const id of G.muts){const x=MUTS.find(q=>q.id===id);if(x)x.fx(m)}G.mods=m}
function zFlags(){const m=G.mods;return(m.armor>0?1:0)|(m.acid?2:0)|(m.dmgMul>1?4:0)}
function syncNest(a){let n=G.nM.get(a[0]);if(!n){n={k:'n',id:a[0],x:a[1],y:a[2],tx:Math.floor(a[1]/TILE),ty:Math.floor(a[2]/TILE),r:34,pulse:rnd(TAU),hurtT:0,dead:false,hp:1,maxhp:1};G.nM.set(n.id,n);G.nests.push(n)}n.lvl=a[3];n.disc=!!a[4];n.island=!!a[5]}

function onNet(m){switch(m.t){
 case'w':{NET.state='loading';loadWorld(m).then(()=>{newClientGame(m);NET.token=m.you.token;G.wm=m.wm;if(m.wm)setTimeout(()=>{try{banner('WORLD: '+m.wm.n.toUpperCase(),m.wm.d,'')}catch(e){}},1200);try{localStorage.setItem('deadfront_token',m.you.token)}catch(e){}
   UI.state='play';UI.alertIdx=0;UI.key='';UI.infoKey='';UIs.build=null;UIs.markers=[];$('feed').innerHTML='';$('banner').innerHTML='';$('title').classList.add('hidden');$('loading').classList.add('hidden');showConn('');$('end').classList.add('hidden');
   NET.state='play';NET.snapId=0;const h=m.hq;if(h)centerOn(h[0],h[1]+30);else centerOn(WW/2,WH/2);cam.z=.9;clampCam();G.alive=!!m.alive;if(!m.alive)showDead(NET.dead||{msg:'Your base has fallen.'});
   UI.chatLog&&UI.chatLog();refreshRoster(true)}).catch(e=>{console.error(e);$('loading').textContent='FAILED TO LOAD WORLD: '+e.message});return}
 case'st':{if(!G)return;if(ME){const pk=m.pk||[];if(pk.join()!==ME.perks.join()){ME.perks=pk;ME.fx=computeFx(pk);UI.key=''}showOffer(m.of);setMission(m.mi,m.bm,pk)}G.tBase=m.gt;G.tAt=performance.now();G.day=m.day;G.res.c=m.res[0];G.res.m=m.res[1];G.res.f=m.res[2];G.rate.c=m.rate[0];G.rate.m=m.rate[1];G.rate.f=m.rate[2];G.pop=m.pop;G.popCap=m.popCap;
  if(m.done.length!==G.done.size||m.done.some(x=>!G.done.has(x))){G.done.clear();for(const d of m.done)G.done.add(d);UI.key=''}
  G.cur=m.cur;G.labs=m.labs;G.hasRadar=!!m.radar;ME.allies=new Set(m.allies);G.reqIn=m.reqIn;G.reqOut=m.reqOut;
  if(m.muts.length!==G.muts.length||m.muts.some((x,i)=>x!==G.muts[i])){G.muts=m.muts;recomputeClientMods()}G.nextMut=m.nextMut;G.pend=m.pend;G.zc=m.zc;G.nn=m.nn;G.stats=m.st;G.online=m.online;NET.sv=m.sv;G.age=m.age;
  if(!!m.alive!==G.alive){G.alive=!!m.alive}return}
 case'pong':{NET.rtt=Math.round(performance.now()-m.ts);return}
 case'bl':{if(G)applyBuildings(m.a);return}
 case'mini':{if(!G)return;G.mini=m;for(const n of m.n)syncNest(n);return}
 case'pl':{if(G){applyRoster(m.a);G.crates=(m.cr||[]).map(c=>({id:c[0],x:c[1],y:c[2]}))}return}
 case'ev':{if(!G)return;for(const e of m.e){const f=EVH[e[0]];if(f)f(e)}return}
 case'n':{if(!G)return;notify(m.m,m.k,m.x,m.y);return}
 case'bn':{if(!G)return;banner(m.a,m.b,m.k);if(m.s)sfx(m.s);else sfx(m.k==='bad'?'horn':'done');return}
 case'fl':{if(G)G.floats.push({x:m.x,y:m.y,t:m.v,life:1.4,max:1.4});return}
 case's':{sfx(m.n);return}
 case'c':{if(G){pushChat(m);UI.chatLog&&UI.chatLog()}return}
 case'dead':{NET.dead=m;if(G){G.alive=false;ME.alive=false;G.sel=[];showDead(m)}return}
 case'spawn':{if(G){G.alive=true;ME.alive=true;centerOn(m.x,m.y+30);$('end').classList.add('hidden');UI.endShown=false;UI.key='';UI.infoKey=''}return}
 case'err':{toast(m.m,'warn');if(UI.state!=='play')titleMsg(m.m);return}
 case'full':{titleMsg('Server is full. Try again in a minute.');$('loading').classList.add('hidden');NET.state='idle';return}
}}
function pushChat(c){G.chat.push(c);if(G.chat.length>80)G.chat.shift()}

/* ---- binary snapshot: zombies + units ---- */
const A2R=TAU/255;
function applySnap(buf){if(!G||NET.state!=='play')return;const dv=new DataView(buf);if(dv.getUint8(0)!==1)return;
 const now=performance.now();if(NET.lastSnap)NET.snapInt=clamp(NET.snapInt*.8+(now-NET.lastSnap)*.2,50,250);NET.lastSnap=now;const sid=++NET.snapId;
 const nZ=dv.getUint16(5,true),nU=dv.getUint16(7,true);let o=9;
 const zs=[];
 for(let i=0;i<nZ;i++){const id=dv.getUint32(o,true),ti=dv.getUint8(o+4),x=dv.getUint16(o+5,true),y=dv.getUint16(o+7,true),ang=dv.getUint8(o+9)*A2R,hp=dv.getUint8(o+10)/255,fl=dv.getUint8(o+11);o+=12;
  let z=G.zM.get(id);const type=ZK[ti];
  if(!z){const d=Z[type];z={k:'z',id,type,d,x,y,ang,hp:1,maxhp:100,r:d.r,elite:false,mode:'idle',anim:rnd(10),v:id&3,fly:!!d.fly,burn:0,hurtT:0,dead:false,vis:true,x0:x,y0:y,a0:ang,x1:x,y1:y,a1:ang};G.zM.set(id,z);G.seen.add(type);if(!UI.bestiaryDirty)UI.bestiaryDirty=1}
  else{if(hp<z.hp-.001)z.hurtT=2;z.x0=z.x;z.y0=z.y;z.a0=z.ang;z.x1=x;z.y1=y;z.a1=ang}
  z.hp=hp*(fl&16?200:100);z.maxhp=fl&16?200:100;z.hpf=hp;z.elite=!!(fl&1);z.mode=fl&2?'assault':'idle';z.burn=fl&4?1:0;z.mv=!!(fl&32);z.r=z.d.r*(z.elite?1.25:1);z.s=sid;z.ta=now;zs.push(z)}
 for(const z of G.zombies)if(z.s!==sid)G.zM.delete(z.id);
 G.zombies=zs;
 const us=[];
 for(let i=0;i<nU;i++){const id=dv.getUint32(o,true),ti=dv.getUint8(o+4),ow=dv.getUint8(o+5),x=dv.getUint16(o+6,true),y=dv.getUint16(o+8,true),ang=dv.getUint8(o+10)*A2R,tang=dv.getUint8(o+11)*A2R,hp=dv.getUint16(o+12,true),mh=dv.getUint16(o+14,true),fl=dv.getUint8(o+16);o+=17;
  let u=G.uM.get(id);const type=UK[ti];
  if(!u){const d=U[type];u={k:'u',id,o:ow,type,d,x,y,ang,tang,r:d.r,hp,maxhp:mh,moving:false,anim:rnd(10),flash:0,hurtT:0,dead:false,x0:x,y0:y,a0:ang,t0:tang,x1:x,y1:y,a1:ang,t1:tang,dest:null,q:[]};G.uM.set(id,u)}
  else{u.x0=u.x;u.y0=u.y;u.a0=u.ang;u.t0=u.tang;u.x1=x;u.y1=y;u.a1=ang;u.t1=tang}
  u.o=ow;u.hp=hp;u.maxhp=mh;u.moving=!!(fl&1);u.flash=fl&2?.1:0;u.hurtT=fl&4?.3:0;u.s=sid;u.ta=now;us.push(u)}
 for(const u of G.units)if(u.s!==sid){G.uM.delete(u.id)}
 G.units=us;if(G.sel.length)G.sel=G.sel.filter(e=>e.k!=='u'||G.uM.get(e.id)===e);
 if(!G.firstSnap){G.firstSnap=1}}

function applyBuildings(list){const seen=new Set();const out=[];
 for(const r of list){const id=r[0];seen.add(id);let b=G.bM.get(id);const type=BK[r[1]];
  if(!b){const d=B[type],s=d.size;b={k:'b',id,type,d,tx:r[2],ty:r[3],s,x:(r[2]+s/2)*TILE,y:(r[3]+s/2)*TILE,w:s*TILE,h:s*TILE,r:s*TILE/2,hp:0,maxhp:1,prog:0,done:false,queue:[],rally:null,ang:0,hurtT:0,flash:0,water:false,mask:0,dead:false,o:r[8]};
   for(let y=0;y<s;y++)for(let x=0;x<s;x++){occ[(b.ty+y)*MW+b.tx+x]=id;if(T[(b.ty+y)*MW+b.tx+x]===0)b.water=true}G.bM.set(id,b);b.isNew=true}
  if(r[4]<b.hp-.5)b.hurtT=.3;b.hp=r[4];b.maxhp=r[5];b.prog=r[6]/100;b.done=!!r[7];b.o=r[8];b.ang=r[9]/100;b.flash=r[10]?.1:0;
  if(r.length>11){b.queue=r[11].map(q=>({type:UK[q[0]],prog:q[1]/100}));b.rally=r[12]?{x:r[12][0],y:r[12][1]}:null}
  out.push(b)}
 let changed=false;for(const b of G.buildings)if(!seen.has(b.id)){G.bM.delete(b.id);for(let y=0;y<b.s;y++)for(let x=0;x<b.s;x++)if(occ[(b.ty+y)*MW+b.tx+x]===b.id)occ[(b.ty+y)*MW+b.tx+x]=0;changed=true}
 for(const b of out)if(b.isNew){b.isNew=false;changed=true}
 out.sort((a,b)=>a.y-b.y);G.buildings=out;
 for(const b of out)if(B[b.type].wall){const isW=(xx,yy)=>{if(!inMap(xx,yy))return 0;const o=G.bM.get(occ[yy*MW+xx]);return o&&B[o.type].wall?1:0};b.mask=isW(b.tx,b.ty-1)|(isW(b.tx+1,b.ty)<<1)|(isW(b.tx,b.ty+1)<<2)|(isW(b.tx-1,b.ty)<<3)}
 if(G.sel.length)G.sel=G.sel.filter(e=>e.k!=='b'||G.bM.get(e.id)===e);
 UI.infoKey=''}

/* ---- per-frame client update (interpolation + cosmetics) ---- */
function clientUpdate(dt,now){
 G.t=G.tBase+(now-G.tAt)/1000;
 const dur=NET.snapInt*1.25;
 for(const z of G.zombies){const f=clamp((now-z.ta)/dur,0,1);z.x=z.x0+(z.x1-z.x0)*f;z.y=z.y0+(z.y1-z.y0)*f;z.ang=z.a0+angDiff(z.a0,z.a1)*f;if(z.hurtT>0)z.hurtT-=dt;if(z.mv)z.anim+=dt*z.d.speed*(z.mode==='idle'?.45:1)/9;else if(z.d.fly)z.anim+=dt*2}
 for(const u of G.units){const f=clamp((now-u.ta)/dur,0,1);u.x=u.x0+(u.x1-u.x0)*f;u.y=u.y0+(u.y1-u.y0)*f;u.ang=u.a0+angDiff(u.a0,u.a1)*f;u.tang=u.t0+angDiff(u.t0,u.t1)*f;if(u.moving)u.anim+=dt*u.d.speed/10;if(u.dest&&!u.moving&&(u.destT=(u.destT||0)+dt)>.6){u.dest=null;u.destT=0}else if(u.moving)u.destT=0}
 for(const b of G.buildings){if(b.hurtT>0)b.hurtT-=dt;if(b.flash>0)b.flash-=dt}
 for(const n of G.nests){n.pulse+=dt}
 ambientFx(dt);updateProjFx(dt);updateParts(dt);if(G.shake>0)G.shake=Math.max(0,G.shake-dt*2)}
function ambientFx(dt){
 for(const b of G.buildings){if(!onScr(b.x,b.y,100))continue;if(!b.done)continue;
  if(b.hp<b.maxhp*.4&&Math.random()<dt*5)P('smoke',b.x+rnd(-b.r,b.r)*.6,b.y+rnd(-b.r,b.r)*.6,rnd(-5,5),-14,1.2,rnd(6,10),'#222');
  if(b.hp<b.maxhp*.2&&Math.random()<dt*6)P('fire',b.x+rnd(-b.r,b.r)*.6,b.y+rnd(-b.r,b.r)*.6,rnd(-5,5),-24,.5,rnd(4,7),'#ff8030');
  if(b.type==='factory'&&b.queue.length&&Math.random()<dt*1.5)P('smoke',b.x+36,b.y-30,rnd(-3,3),-18,1.8,7,'#777')}
 for(const n of G.nests){if(!onScr(n.x,n.y,200))continue;if(Math.random()<dt*2.5)P('spore',n.x+rnd(-30,30),n.y+rnd(-30,30),rnd(-6,6),rnd(-22,-8),rnd(1.2,2.2),rnd(2,4),'#c860ff')}
 for(const u of G.units){if(u.hp<u.maxhp*.35&&onScr(u.x,u.y,60)&&Math.random()<dt*4)P('smoke',u.x,u.y,rnd(-6,6),-10,.9,5,'#222');if(u.d.dom==='water'&&u.moving&&onScr(u.x,u.y,60)&&Math.random()<dt*10)P('wake',u.x-Math.cos(u.ang)*u.r*.8,u.y-Math.sin(u.ang)*u.r*.8,rnd(-4,4),rnd(-4,4),1,u.r*.35,'#fff')}}
// aim the camera view at the server so it knows what to stream us
function sendView(){const k=[Math.round(cam.x/64),Math.round(cam.y/64),Math.round(cam.z*20)].join(',');const now=performance.now();if(k===NET.lastView&&now-NET.viewT<2500)return;NET.lastView=k;NET.viewT=now;netSend({t:'vw',x0:Math.round(cam.x),y0:Math.round(cam.y),x1:Math.round(cam.x+VW/cam.z),y1:Math.round(cam.y+(VH)/cam.z)})}

/* ---- commands (same names the UI always used; now they talk to the server) ---- */
function orderMove(list,x,y,am){if(!list.length)return;netSend({t:'mv',ids:list.map(u=>u.id),x:Math.round(x),y:Math.round(y),am:am?1:0});const n=list.length;list.forEach((u,i)=>{const o=n>1?formOff(i,n):[0,0];u.dest={x:x+o[0],y:y+o[1]};u.destT=0})}
function formOff(i,n){const cols=Math.ceil(Math.sqrt(n));const row=Math.floor(i/cols),col=i%cols;const rows=Math.ceil(n/cols);return[(col-(cols-1)/2)*24,(row-(rows-1)/2)*24]}
function orderAttack(list,t){if(!list.length||t.k!=='z')return;netSend({t:'at',ids:list.map(u=>u.id),tid:t.id})}
function orderStop(list){if(!list.length)return;netSend({t:'st',ids:list.map(u=>u.id)});for(const u of list)u.dest=null}
function placeBuilding(type,tx,ty){netSend({t:'bd',b:type,tx,ty});const d=B[type];for(const k in d.cost)G.res[k]-=d.cost[k];sfx('build');return null}
function enqueue(b,type){const d=U[type];if(!afford(ucost(type)))return'Not enough resources';if(G.pop+d.pop>G.popCap)return'Population cap reached';if(b.queue.length>=6)return'Queue full';netSend({t:'tr',b:b.id,u:type});const c=ucost(type);for(const k in c)G.res[k]-=c[k];b.queue.push({type,prog:0});return null}
function dequeue(b,i){netSend({t:'dq',b:b.id,i});b.queue.splice(i,1)}
function sellBuilding(b){netSend({t:'sl',b:b.id})}
function setRally(b,x,y){b.rally={x,y};netSend({t:'ry',b:b.id,x:Math.round(x),y:Math.round(y)})}
function startResearch(id){const t=TECH_BY[id];if(G.cur)return'Already researching';if(G.labs<1)return'Build a Research Lab first';if(techState(id)!=='ready')return'Unavailable';if(!afford(t.cost))return'Not enough resources';netSend({t:'rs',id});for(const k in t.cost)G.res[k]-=t.cost[k];G.cur={id,prog:0,total:t.time};return null}
function cancelResearch(){netSend({t:'rc'});G.cur=null}
function techState(id){if(G.done.has(id))return'done';if(G.cur&&G.cur.id===id)return'active';const t=TECH_BY[id];if(!t.req.every(r=>G.done.has(r)))return'locked';return'ready'}
