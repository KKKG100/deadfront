'use strict';
/* DEAD FRONT — multiplayer server. One authoritative world, any number of browsers connect over WebSocket. */
const http=require('http'),fs=require('fs'),path=require('path'),zlib=require('zlib'),crypto=require('crypto');
const {WebSocketServer}=require('ws');
const S=require('./sim.js');

const PORT=+process.env.PORT||3000;
const SEED=+process.env.SEED||Math.floor(Math.random()*1e9);
const MAX_PLAYERS=+process.env.MAX_PLAYERS||24;
const SIM_HZ=20,DT=1/SIM_HZ;
if(process.env.MAX_ZOMBIES)S.CFG.zcap=+process.env.MAX_ZOMBIES;
S.CFG.zcapMax=Math.max(S.CFG.zcap,+process.env.MAX_ZOMBIES_CAP||2600);

console.log('Generating world, seed',SEED,'…');
const t0=Date.now();S.newWorld(SEED);console.log('World ready in',Date.now()-t0,'ms');
const {MW,MH,TILE}=S;
const hV=new S.SHash(); // zombie view-hash (includes sleeping zombies)

/* ---------- static files ---------- */
const PUB=path.join(__dirname,'..','public');
const gzCache={};
function sendFile(req,res,file,type){let c=gzCache[file];const st=fs.statSync(file);if(!c||c.m!==st.mtimeMs){c={m:st.mtimeMs,raw:fs.readFileSync(file)};c.gz=zlib.gzipSync(c.raw,{level:6});gzCache[file]=c}
 const ae=req.headers['accept-encoding']||'';const h={'Content-Type':type,'Cache-Control':'no-cache'};
 if(/\bgzip\b/.test(ae)){h['Content-Encoding']='gzip';res.writeHead(200,h);res.end(c.gz)}else{res.writeHead(200,h);res.end(c.raw)}}
// terrain payload: T (u8) + E (u16 LE) + F (u8), identical for every client
function buildWorldBin(){const N=MW*MH;const out=Buffer.alloc(N*4);S.T.forEach((v,i)=>out[i]=v);const dv=new DataView(out.buffer,out.byteOffset,out.byteLength);
 for(let i=0;i<N;i++)dv.setUint16(N+i*2,Math.max(0,Math.min(65535,Math.round((S.E[i]+.5)*30000))),true);
 for(let i=0;i<N;i++)out[N*3+i]=Math.max(0,Math.min(255,Math.round(S.F[i]*255)));return out}
const WORLD_RAW=buildWorldBin(),WORLD_GZ=zlib.gzipSync(WORLD_RAW,{level:6});
console.log('world payload',WORLD_RAW.length,'bytes ->',WORLD_GZ.length,'gz');

const server=http.createServer((req,res)=>{const u=req.url.split('?')[0];
 if(u==='/'||u==='/index.html')return sendFile(req,res,path.join(PUB,'index.html'),'text/html; charset=utf-8');
 if(u==='/world.gz'){res.writeHead(200,{'Content-Type':'application/octet-stream','Content-Length':WORLD_GZ.length,'Cache-Control':'no-store'});return res.end(WORLD_GZ)}
 if(u==='/world.raw'){res.writeHead(200,{'Content-Type':'application/octet-stream','Content-Length':WORLD_RAW.length,'Cache-Control':'no-store'});return res.end(WORLD_RAW)}
 if(u==='/api/status'){const G=S.G;res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-cache','Access-Control-Allow-Origin':'*'});return res.end(JSON.stringify({online:onlineCount(),max:MAX_PLAYERS,day:G.day,seed:SEED,zombies:G.zombies.length}))}
 if(u==='/adminconsole'||u==='/adminconsole/')return sendFile(req,res,path.join(PUB,'admin.html'),'text/html; charset=utf-8');
 if(u==='/health'){res.writeHead(200);return res.end('ok')}
 res.writeHead(404);res.end('not found')});
const wss=new WebSocketServer({noServer:true,maxPayload:8192,perMessageDeflate:false});
const awss=new WebSocketServer({noServer:true,maxPayload:8192,perMessageDeflate:false});
server.on('upgrade',(req,sock,head)=>{const u=req.url.split('?')[0];if(u==='/ws')wss.handleUpgrade(req,sock,head,ws=>wss.emit('connection',ws,req));else if(u==='/adminws')awss.handleUpgrade(req,sock,head,ws=>awss.emit('connection',ws,req));else sock.destroy()});

/* ---------- connections ---------- */
const conns=new Set();const admins=new Set();
const onlineCount=()=>{let n=0;for(const p of S.G.players.values())if(p.online)n++;return n};
const cleanName=s=>String(s||'').replace(/[^\w \-.]/g,'').trim().slice(0,16)||'Survivor';
function sendJ(ws,o){if(ws.readyState===1)ws.send(JSON.stringify(o))}
function roster(){const G=S.G;const out=[];for(const p of G.players.values()){out.push({id:p.id,n:p.name,c:p.color,a:p.alive?1:0,o:p.online?1:0,al:[...p.allies],age:p.alive?Math.floor(1+(G.t-p.spawnT)/90):0,best:p.best,k:p.stats.kills,hq:p.hq?[Math.round(p.hq.x),Math.round(p.hq.y)]:null})}return out}
function depList(){return S.WORLD.deposits.map(d=>[d.id,d.type==='ore'?0:1,d.tx,d.ty,d.water?1:0,d.used?1:0])}
function nestList(){return S.G.nests.map(n=>[n.id,Math.round(n.x),Math.round(n.y),n.lvl,n.disc?1:0,n.island?1:0])}

wss.on('connection',(ws,req)=>{
 ws.p=null;ws.rate=0;ws.alive=true;ws.on('pong',()=>ws.alive=true);conns.add(ws);
 ws.on('message',(data,isBin)=>{if(isBin)return;let m;try{m=JSON.parse(data.toString())}catch(e){return}if(!m||typeof m.t!=='string')return;
  try{onMsg(ws,m)}catch(e){console.error('msg error',e)}});
 ws.on('close',()=>{conns.delete(ws);const p=ws.p;if(p&&p.conn===ws){p.online=false;p.conn=null;p.offT=S.G.t;S.sysChat(p.name+' disconnected')}});
 ws.on('error',()=>{});
});
setInterval(()=>{for(const ws of conns){if(!ws.alive){ws.terminate();continue}ws.alive=false;try{ws.ping()}catch(e){}}},20000);

function onMsg(ws,m){const G=S.G;
 if(m.t==='join'){if(ws.p)return;
  let p=null;if(m.token){for(const q of G.players.values())if(q.token===m.token){p=q;break}}
  if(p){if(p.conn&&p.conn!==ws){try{p.conn.p=null;p.conn.close()}catch(e){}}p.conn=ws;p.online=true;ws.p=p;if(m.name)p.name=cleanName(m.name)}
  else{if(onlineCount()>=MAX_PLAYERS){sendJ(ws,{t:'full'});return}
   const used=new Set([...G.players.values()].map(q=>q.color));let col=S.PCOLORS.includes(m.color)&&!used.has(m.color)?m.color:S.PCOLORS.find(c=>!used.has(c))||S.PCOLORS[(G.nextPid)%S.PCOLORS.length];
   p=S.newPlayer(cleanName(m.name),col,crypto.randomBytes(12).toString('hex'));p.conn=ws;ws.p=p;if(!S.spawnPlayer(p)){sendJ(ws,{t:'err',m:'The world is full — no free land found.'})}
   S.sysChat(p.name+' joined the world.')}
  p.msgs=[];p.view=null;
  sendJ(ws,{t:'w',you:{id:p.id,token:p.token,name:p.name,color:p.color},MW,MH,seed:SEED,s4:S.WORLD.s4,dep:depList(),nests:nestList(),day:G.day,gt:G.t,muts:G.muts,players:roster(),chat:G.chat.slice(-30),alive:p.alive?1:0,hq:p.hq?[Math.round(p.hq.x),Math.round(p.hq.y)]:null,tick:SIM_HZ,wm:{n:G.wm.name,d:G.wm.desc}});
  if(!p.alive)toDead(p);
  return}
 const p=ws.p;if(!p)return;if(++p.cmdN>400)return; // per-second budget, reset in snapshot timer
 const G2=S.G;const err=handle(p,m);if(err)sendJ(ws,{t:'err',m:err})}
function toDead(p){S.toP(p,{t:'dead',msg:'Your base has fallen. Choose a new location to start over.',day:p.best,stats:p.stats,time:0})}
const own=(p,id)=>{const e=S.G.ent.get(id);return e&&!e.dead&&e.o===p.id?e:null};
function handle(p,m){const G=S.G;
 switch(m.t){
  case'ping':{S.toP(p,{t:'pong',ts:m.ts});return}
  case'vw':{if(typeof m.x0==='number'&&typeof m.y1==='number'){p.view={x0:m.x0-260,y0:m.y0-260,x1:m.x1+260,y1:m.y1+260}}return}
  case'mv':{if(!p.alive||!Array.isArray(m.ids))return;const list=[];for(const id of m.ids.slice(0,200)){const u=own(p,id);if(u&&u.k==='u')list.push(u)}if(list.length&&isFinite(m.x)&&isFinite(m.y))S.orderMove(list,+m.x,+m.y,!!m.am);return}
  case'at':{if(!p.alive||!Array.isArray(m.ids))return;const t=G.ent.get(m.tid);if(!t||t.dead||t.k!=='z')return;const list=[];for(const id of m.ids.slice(0,200)){const u=own(p,id);if(u&&u.k==='u')list.push(u)}S.orderAttack(list,t);return}
  case'st':{if(!p.alive||!Array.isArray(m.ids))return;const list=[];for(const id of m.ids.slice(0,200)){const u=own(p,id);if(u&&u.k==='u')list.push(u)}S.orderStop(list);return}
  case'pk':return S.choosePerk(p,m.id);
  case'bd':{if(!p.alive)return'You are not deployed';if(typeof m.b!=='string'||!S.B[m.b])return;return S.placeBuilding(p,m.b,m.tx|0,m.ty|0)}
  case'tr':{const b=own(p,m.b);if(!b||b.k!=='b')return;return S.enqueue(p,b,String(m.u))}
  case'dq':{const b=own(p,m.b);if(!b||b.k!=='b')return;S.dequeue(p,b,m.i|0);return}
  case'ry':{const b=own(p,m.b);if(!b||b.k!=='b'||!b.d.train||!isFinite(m.x)||!isFinite(m.y))return;b.rally={x:S.clamp(+m.x,0,MW*TILE),y:S.clamp(+m.y,0,MH*TILE)};return}
  case'sl':{const b=own(p,m.b);if(!b||b.k!=='b')return;return S.sellBuilding(p,b)}
  case'rs':{return S.startResearch(p,String(m.id))}
  case'rc':{S.cancelResearch(p);return}
  case'al':{return S.reqAlly(p,m.to|0)}
  case'ac':{return S.acceptAlly(p,m.from|0)}
  case'ad':{return S.declineAlly(p,m.from|0)}
  case'ab':{return S.breakAlly(p,m.to|0)}
  case'aid':{return S.sendAid(p,m.to|0,m.a)}
  case'rsp':{return S.respawn(p)}
  case'ch':{const text=String(m.text||'').replace(/[\u0000-\u001f]/g,'').slice(0,160).trim();if(!text)return;if(p.chatT&&G.t-p.chatT<.8)return;p.chatT=G.t;
   const msg={t:'c',from:p.id,name:p.name,color:p.color,text};
   if(m.ally){for(const q of G.players.values())if(q===p||p.allies.has(q.id))S.toP(q,Object.assign({ally:1},msg))}else{G.chat.push(msg);if(G.chat.length>60)G.chat.shift();S.toAll(msg)}return}
  case'dbg':{if(process.env.DEBUG!=='1'||!p.hq)return;if(m.k==='z'){for(let i=0;i<(m.n|0);i++){const a=Math.random()*6.28,r=380+Math.random()*120;const z=S.spawnZombie(m.type||'walker',p.hq.x+Math.cos(a)*r,p.hq.y+Math.sin(a)*r,null,'assault',m.ld||5);if(z)z.nest=0}}else if(m.k==='res'){p.res={c:9999,m:9999,f:999};for(const k of['marksman','incendiary','aviation','maritime','antiair','electrics','armor1','ordnance'])p.done.add(k)}else if(m.k==='night'){G.t=Math.floor(G.t/90)*90+0.5*90}return}
  case'name':{p.name=cleanName(m.name);return}
 }}

/* ---------- snapshots ---------- */
let snapN=0;
function pushSnapshots(){const G=S.G;snapN++;const evs=G.ev;G.ev=[];
 // view hash for zombies (incl. sleeping)
 hV.clear();for(const z of G.zombies)if(!z.dead)hV.add(z);
 const doState=snapN%2===0,doB=snapN%3===0,doMini=snapN%10===0;
 if(snapN%10===0){const r=roster();for(const p of G.players.values())if(p.online)S.toP(p,{t:'pl',a:r,cr:G.crates.map(c=>[c.id,Math.round(c.x),Math.round(c.y)])})}
 for(const p of G.players.values()){const ws=p.conn;if(!p.online||!ws||ws.readyState!==1)continue;
  if(ws.bufferedAmount>1.5e6)continue; // slow client: skip
  const v=p.view||(p.hq?{x0:p.hq.x-1100,y0:p.hq.y-700,x1:p.hq.x+1100,y1:p.hq.y+700}:{x0:0,y0:0,x1:2200,y1:1400});
  // --- binary entity snapshot ---
  const zs=[];hV.rect(v.x0,v.y0,v.x1,v.y1,z=>{if(zs.length<1600)zs.push(z)});
  const us=[];const seen=new Set();for(const u of G.units){if(u.dead)continue;if(u.o===p.id||(u.x>=v.x0&&u.x<=v.x1&&u.y>=v.y0&&u.y<=v.y1))us.push(u)}
  const buf=Buffer.allocUnsafe(9+zs.length*12+us.length*17);buf[0]=1;buf.writeFloatLE(G.t,1);buf.writeUInt16LE(zs.length,5);buf.writeUInt16LE(us.length,7);let o=9;
  for(const z of zs){buf.writeUInt32LE(z.id,o);buf[o+4]=S.ZI[z.type];buf.writeUInt16LE(Math.max(0,Math.min(65535,z.x|0)),o+5);buf.writeUInt16LE(Math.max(0,Math.min(65535,z.y|0)),o+7);buf[o+9]=((z.ang%6.2832+6.2832)%6.2832)/6.2832*255|0;buf[o+10]=Math.max(0,Math.min(255,Math.ceil(z.hp/z.maxhp*255)));
   buf[o+11]=(z.elite?1:0)|(z.mode!=='idle'?2:0)|(z.burn>0?4:0)|(z.hurtT>1.85?8:0)|(z.maxhp>150?16:0)|(z.mv?32:0)|(z.atk>0?64:0);o+=12}
  for(const u of us){buf.writeUInt32LE(u.id,o);buf[o+4]=S.UI_[u.type];buf[o+5]=u.o;buf.writeUInt16LE(Math.max(0,Math.min(65535,u.x|0)),o+6);buf.writeUInt16LE(Math.max(0,Math.min(65535,u.y|0)),o+8);buf[o+10]=((u.ang%6.2832+6.2832)%6.2832)/6.2832*255|0;buf[o+11]=((u.tang%6.2832+6.2832)%6.2832)/6.2832*255|0;
   buf.writeUInt16LE(Math.max(0,Math.min(65535,u.hp|0)),o+12);buf.writeUInt16LE(Math.max(0,Math.min(65535,u.maxhp|0)),o+14);buf[o+16]=(u.moving||(u.type==='bomber'&&u.bs!=='rearm')?1:0)|(u.flash>0?2:0)|(u.hurtT>0?4:0);o+=17}
  ws.send(buf);
  // --- buildings (JSON, 3.3 Hz) ---
  if(doB){const bl=[];for(const b of G.buildings){if(b.dead)continue;const mine=b.o===p.id;if(!mine&&!(b.x>=v.x0-60&&b.x<=v.x1+60&&b.y>=v.y0-60&&b.y<=v.y1+60))continue;
    const row=[b.id,S.BI[b.type],b.tx,b.ty,Math.ceil(b.hp),Math.ceil(b.maxhp),Math.round(b.prog*100),b.done?1:0,b.o,Math.round((b.ang%6.2832+6.2832)%6.2832*100),b.flash>0?1:0];
    if(mine&&b.d.train)row.push(b.queue.map(q=>[S.UI_[q.type],Math.round(q.prog*100)]),b.rally?[Math.round(b.rally.x),Math.round(b.rally.y)]:0);bl.push(row)}
   sendJ(ws,{t:'bl',a:bl})}
  // --- state (5 Hz) ---
  if(doState){const mods=G.mods;sendJ(ws,{t:'st',gt:+G.t.toFixed(2),day:G.day,res:[p.res.c,p.res.m,p.res.f].map(Math.floor),rate:[p.rate.c,p.rate.m,p.rate.f].map(x=>+x.toFixed(2)),pop:p.pop,popCap:p.popCap,done:[...p.done],cur:p.cur?{id:p.cur.id,prog:+p.cur.prog.toFixed(1),total:p.cur.total}:null,labs:p.labs,radar:p.hasRadar?1:0,alive:p.alive?1:0,
    allies:[...p.allies],reqIn:[...p.reqIn],reqOut:[...p.reqOut],muts:G.muts,nextMut:G.nextMutDay,pend:p.done.has('sequencing')?G.pendingMut:null,zc:G.zombies.length,nn:G.aliveNests,st:p.stats,sv:[+SV.ema.toFixed(1),+SV.pk.toFixed(0)],pk:p.perks,of:p.offer,mi:p.mission&&p.alive?[p.mission.text,S.missionProg(p,p.mission),p.mission.goal,Object.keys(p.mission.rew).map(k=>'+'+p.mission.rew[k]+({c:'$',m:'▣',f:'⛽'})[k]).join(' ')]:null,bm:G.t<G.bmUntil?1:0,online:onlineCount(),age:p.alive?+(1+(G.t-p.spawnT)/90).toFixed(1):0})}
  // --- minimap data (1 Hz) ---
  if(doMini&&p.alive)sendJ(ws,minimap(p));
  // --- events ---
  const out=[];for(const e of evs){const t=e[0];if(t==='dep'||t==='du'){out.push(e);continue}const x=e[1],y=e[2];if(x>=v.x0&&x<=v.x1&&y>=v.y0&&y<=v.y1){if(out.length<260)out.push(e)}}
  if(out.length)sendJ(ws,{t:'ev',e:out});
  // --- direct messages ---
  if(p.msgs.length){for(const m of p.msgs.splice(0,40))sendJ(ws,m);p.msgs.length=0}
 }
 for(const p of G.players.values())if(!p.online)p.msgs.length=0;
}
function minimap(p){const G=S.G;const friends=[p.id,...p.allies];const eyes=[];const fr=[];
 for(const f of friends){const q=S.PL(f);if(!q||!q.alive)continue;const bs=[],us=[];for(const b of G.buildings)if(b.o===f&&!b.dead){bs.push(Math.round(b.x/16),Math.round(b.y/16),b.type==='hq'?5:b.s>1?3:2)}for(const u of G.units)if(u.o===f&&!u.dead)us.push(Math.round(u.x/16),Math.round(u.y/16));fr.push([f,bs,us])}
 // zombies visible: near any friendly unit/building, or within radar range
 const zs=new Set();const rad=[];
 for(const f of friends){const q=S.PL(f);if(!q||!q.alive)continue;if(q.hasRadar)for(const b of G.buildings)if(b.o===f&&b.type==='radar'&&b.done&&!b.dead)rad.push(b);
  let k=0;for(const b of G.buildings){if(b.o!==f||b.dead)continue;if((k++&1)&&b.s===1)continue;hV.each(b.x,b.y,380,z=>zs.add(z))}for(const u of G.units){if(u.o!==f||u.dead)continue;hV.each(u.x,u.y,300,z=>zs.add(z))}}
 if(rad.length){const R=3600;for(const z of G.zombies){if(z.dead)continue;for(const b of rad){if(Math.abs(z.x-b.x)<R&&Math.abs(z.y-b.y)<R&&Math.hypot(z.x-b.x,z.y-b.y)<R){zs.add(z);break}}}}
 const zl=[];for(const z of zs){if(zl.length>1800)break;zl.push(Math.round(z.x/16),Math.round(z.y/16),z.mode!=='idle'?1:0)}
 return{t:'mini',z:zl,n:nestList(),f:fr,rad:rad.length?1:0}}

/* ---------- main loop ---------- */
const SV={ema:0,max:0,pk:0};setInterval(()=>{SV.pk=SV.max;SV.max=0},3000);
let last=Date.now(),acc=0,tick=0,lastCmdReset=Date.now();
setInterval(()=>{const now=Date.now();let el=(now-last)/1000;last=now;if(el>.5)el=.5;
 if(now-lastCmdReset>1000){lastCmdReset=now;for(const p of S.G.players.values())p.cmdN=0}
 if(onlineCount()===0&&admins.size===0){acc=0;return} // world sleeps while empty
 acc+=el;let n=0;
 try{while(acc>=DT&&n<5){const a0=process.hrtime.bigint();S.stepSim(DT);const ms=Number(process.hrtime.bigint()-a0)/1e6;SV.ema=SV.ema*.95+ms*.05;if(ms>SV.max)SV.max=ms;acc-=DT;n++;tick++;if(tick%2===0)pushSnapshots()}}catch(e){console.error('TICK ERROR',e);acc=0}
 if(n>=5)acc=0;
},25);

require('./admin.js')({S,awss,admins,hV,onlineCount,sendJ});
server.listen(PORT,()=>console.log('DEAD FRONT server listening on :'+PORT));
