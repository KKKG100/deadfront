'use strict';
/* Admin console backend: live view of the whole world + god-mode commands. PIN-protected (env ADMIN_PIN, default 1100). */
module.exports=function({S,awss,admins,hV,onlineCount,sendJ}){
const PIN=String(process.env.ADMIN_PIN||'1100');
const fails=new Map(); // ip -> {n,until}
const TILE=S.TILE;
const clampN=(v,a,b)=>Math.max(a,Math.min(b,+v||0));

awss.on('connection',(ws,req)=>{
 const ip=(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',')[0].trim();ws.authed=false;
 ws.on('error',()=>{});
 ws.on('close',()=>{admins.delete(ws)});
 ws.on('message',(data,isBin)=>{if(isBin)return;let m;try{m=JSON.parse(data.toString())}catch(e){return}if(!m||typeof m.t!=='string')return;
  if(!ws.authed){
   if(m.t!=='auth')return;const f=fails.get(ip)||{n:0,until:0};if(Date.now()<f.until){sendJ(ws,{t:'denied',m:'Too many attempts. Wait a few minutes.'});return}
   if(String(m.pin)===PIN){ws.authed=true;fails.delete(ip);admins.add(ws);const G=S.G;
    sendJ(ws,{t:'ok',MW:S.MW,MH:S.MH,seed:G.seed,zk:S.ZK,uk:S.UK,bk:S.BK,mut:S.MUTS.map(x=>[x.id,x.name]),tech:S.TECHS.filter(t=>!t.cure).map(t=>t.id),dep:S.WORLD.deposits.map(d=>[d.id,d.type==='ore'?0:1,d.tx,d.ty,d.water?1:0,d.used?1:0])})}
   else{f.n++;if(f.n>=5){f.until=Date.now()+5*60*1000;f.n=0}fails.set(ip,f);sendJ(ws,{t:'denied',m:'Wrong PIN'})}
   return}
  try{const r=cmd(ws,m);if(r)sendJ(ws,{t:'msg',m:r})}catch(e){console.error('admin cmd',e);sendJ(ws,{t:'msg',m:'Error: '+e.message})}});
});

function ent(id){const e=S.G.ent.get(id|0);return e&&!e.dead?e:null}
function placeAt(e,x,y){x=clampN(x,16,S.MW*TILE-16);y=clampN(y,16,S.MH*TILE-16);
 if(e.k==='z'&&!e.fly||e.k==='u'&&e.d.dom!=='air'){const pass=e.k==='z'?(e.swim?S.passA:S.passL):(e.d.dom==='water'?S.passW:S.passL);const i=((y/TILE)|0)*S.MW+((x/TILE)|0);const ni=S.nearestPass(i,pass,12);if(ni<0)return false;if(!pass(i)){x=(ni%S.MW+.5)*TILE;y=((ni/S.MW|0)+.5)*TILE}}
 e.x=x;e.y=y;if(e.k==='u'){e.path=null;e.goal=null;e.focus=null;e.tgt=null;e.hx=x;e.hy=y}else{e.tgt=null;e.home={x,y};e.wx=x;e.wy=y}return true}

function cmd(ws,m){const G=S.G;
 switch(m.t){
  case'inspect':{const e=ent(m.id);if(!e){sendJ(ws,{t:'info',id:m.id,gone:1});return}
   sendJ(ws,{t:'info',id:e.id,k:e.k,type:e.type,hp:Math.round(e.hp),maxhp:Math.round(e.maxhp),o:e.o,x:Math.round(e.x),y:Math.round(e.y),mode:e.mode,ld:e.ld,elite:e.elite,prog:e.prog,done:e.done,lvl:e.lvl,act:e.act});return}
  case'spawnz':{const type=S.Z[m.type]?m.type:'walker';const n=clampN(m.n,1,200)|0;let c=0;const ld=clampN(m.ld,1,200);
   for(let i=0;i<n;i++){const a=Math.random()*6.283,r=Math.sqrt(Math.random())*(n>1?Math.min(160,20+n*3):0);const z=S.spawnZombie(type,clampN(m.x+Math.cos(a)*r,8,S.MW*TILE-8),clampN(m.y+Math.sin(a)*r,8,S.MH*TILE-8),null,m.mode==='idle'?'idle':'assault',ld);
    if(z){z.nest=0;if(m.elite){z.elite=true;z.hp=z.maxhp*=3;z.r*=1.25}if(!placeAt(z,z.x,z.y)){z.dead=true;continue}c++}}
   return'Spawned '+c+' '+type+(c===1?'':'s')}
  case'killz':{const r=clampN(m.r,0,3000);let c=0;if(m.id){const z=ent(m.id);if(z&&z.k==='z'){S.killZombie(z,'admin');c=1}}else for(const z of G.zombies){if(!z.dead&&Math.hypot(z.x-m.x,z.y-m.y)<=r){S.killZombie(z,'admin');c++}}return'Killed '+c+' zombies'}
  case'clearz':{let c=0;for(const z of G.zombies)if(!z.dead){z.dead=true;c++}return'Removed '+c+' zombies'}
  case'move':{const e=ent(m.id);if(!e||e.k==='b'||e.k==='n')return'Cannot move that';return placeAt(e,m.x,m.y)?null:'No valid ground there'}
  case'hp':{const e=ent(m.id);if(!e||e.k==='n')return'No such entity';const v=Math.max(1,+m.hp||1);e.hp=Math.min(v,e.maxhp*(e.k==='z'?50:50));if(v>e.maxhp)e.maxhp=v;e.hp=v;return null}
  case'killu':{const e=ent(m.id);if(!e)return'Gone';if(e.k==='u'){e.dead=true}else if(e.k==='b'&&e.type!=='hq'){S.removeBuilding(e);const p=S.PL(e.o);if(p)S.recalcEcon(p)}else if(e.k==='b'){e.hp=0;return'Use Eliminate on the player to remove an HQ'}return null}
  case'spawnd':{const type=m.type==='ore'?'ore':'oil';const tx=Math.floor(m.x/TILE-.5)+0,ty=Math.floor(m.y/TILE-.5)+0;if(!S.inMap(tx,ty)||!S.inMap(tx+1,ty+1))return'Out of bounds';
   let water=null;for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const i=(ty+dy)*S.MW+tx+dx;const w=S.T[i]===0;if(S.depGrid[i]||S.occ[i])return'Tile occupied';if(water===null)water=w;else if(water!==w)return'Must be fully on land or fully on water';if(!w&&S.T[i]!==1)return'Needs open ground'}
   if(water&&type==='ore')return'Ore must be on land';const d=S.WORLD.addDep(type,tx,ty,water);S.ev('dep',0,0,d.id,type==='ore'?0:1,tx,ty,water?1:0);for(const w of admins)sendJ(w,{t:'dep',d:[d.id,type==='ore'?0:1,tx,ty,water?1:0,0]});return'Added '+type+' deposit'}
  case'rmd':{const d=S.WORLD.deposits[(m.id|0)-1];if(!d||d.type==='none')return'No such deposit';if(d.used&&d.b){const b=S.G.ent.get(d.b);if(b&&!b.dead){S.removeBuilding(b);const p=S.PL(b.o);if(p)S.recalcEcon(p)}}
   for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)S.depGrid[(d.ty+dy)*S.MW+d.tx+dx]=0;d.type='none';d.used=true;S.ev('dx',0,0,d.id);for(const w of admins)sendJ(w,{t:'depx',id:d.id});return'Deposit deleted'}
  case'nestlvl':{const n=ent(m.id);if(!n||n.k!=='n')return'No such nest';n.lvl=clampN(m.lvl,1,25)|0;n.maxhp=700+450*n.lvl;n.hp=n.maxhp;return null}
  case'pres':{const p=S.PL(m.pid);if(!p)return'No such player';for(const k of['c','m','f'])if(m[k]!==undefined&&m[k]!==null&&m[k]!=='')p.res[k]=clampN(m[k],0,1e9);return null}
  case'pname':{const p=S.PL(m.pid);if(!p)return'No such player';p.name=String(m.name||'').replace(/[^\w \-.]/g,'').slice(0,16)||p.name;return null}
  case'pcolor':{const p=S.PL(m.pid);if(!p||!/^#[0-9a-f]{6}$/i.test(m.color))return'Bad';p.color=m.color;return null}
  case'ptech':{const p=S.PL(m.pid);if(!p)return'No such player';for(const t of S.TECHS)if(!t.cure)p.done.add(t.id);S.recalcEcon(p);return'All technology unlocked for '+p.name}
  case'pheal':{const p=S.PL(m.pid);if(!p)return'No such player';for(const u of G.units)if(u.o===p.id)u.hp=u.maxhp;for(const b of G.buildings)if(b.o===p.id&&!b.dead){b.hp=b.maxhp;if(!b.done){b.done=true;b.prog=1}}S.recalcEcon(p);return'Healed everything of '+p.name}
  case'pelim':{const p=S.PL(m.pid);if(!p)return'No such player';S.eliminate(p,'An admin removed your base');return p.name+' eliminated'}
  case'prespawn':{const p=S.PL(m.pid);if(!p)return'No such player';if(p.alive)S.eliminate(p,'An admin relocated your base',true);return S.respawn(p)||'Respawned '+p.name+' at a new location'}
  case'pbase':{const p=S.PL(m.pid);if(!p)return'No such player';const tx=Math.floor(m.x/TILE),ty=Math.floor(m.y/TILE);
   for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const x=tx+dx,y=ty+dy;if(!S.inMap(x,y))return'Too close to the map edge';const i=y*S.MW+x;if(S.T[i]!==1&&S.T[i]!==3)return'Needs a solid land spot (7x7 clear of water/rock)';if(S.depGrid[i])return'A deposit is in the way'}
   const sv={c:p.res.c,m:p.res.m,f:p.res.f};if(p.alive)S.eliminate(p,'An admin moved your base',true);
   if(!S.spawnPlayer(p,null,{tx,ty}))return'Failed';p.res=sv;return'Moved '+p.name+"'s base to the chosen spot (buildings reset)"}
  case'pkick':{const p=S.PL(m.pid);if(!p)return'No such player';if(p.conn){try{p.conn.close()}catch(e){}}return'Kicked '+p.name}
  case'ptp':{const p=S.PL(m.pid);if(!p)return'No such player';let n=0;const us=G.units.filter(u=>u.o===p.id&&!u.dead);us.forEach((u,i)=>{const a=i*2.4,r=14*Math.sqrt(i);if(placeAt(u,m.x+Math.cos(a)*r,m.y+Math.sin(a)*r))n++});return'Teleported '+n+' units of '+p.name}
  case'pgive':{const p=S.PL(m.pid);if(!p||!p.alive)return'No such player';const t=S.U[m.type]?m.type:'rifleman';const n=clampN(m.n,1,50)|0;const base=p.hq||{x:m.x||0,y:m.y||0};for(let i=0;i<n;i++)S.addUnit(p,t,base.x+Math.random()*120-60,base.y+90+Math.random()*60);return'Gave '+n+' '+t}
  case'time':{G.t=(Math.floor(G.t/S.DAY_LEN))*S.DAY_LEN+((clampN(m.hour,0,23.99)-6+24)%24)/24*S.DAY_LEN;return'Time set'}
  case'day':{const d=clampN(m.day,1,500)|0;G.t=(d-1)*S.DAY_LEN+(G.t%S.DAY_LEN);return'Day set to '+d+' (takes effect next tick)'}
  case'mut':{const x=S.MUTS.find(q=>q.id===m.id);if(!x)return'Unknown mutation';if(G.muts.includes(x.id)){G.muts=G.muts.filter(q=>q!==x.id)}else G.muts.push(x.id);S.recomputeMods();return'Mutations: '+G.muts.length}
  case'event':{const e=S.EVENTS.find(q=>q.id===m.id);if(!e)return'Unknown event';e.run();return'Triggered '+e.id}
  case'say':{S.sysChat('[ADMIN] '+String(m.text||'').slice(0,160));return null}
 }}

/* ---- live feed ---- */
setInterval(()=>{if(!admins.size)return;const G=S.G;
 const players=[];const cnt={},bc={};for(const u of G.units)if(!u.dead)cnt[u.o]=(cnt[u.o]||0)+1;for(const b of G.buildings)if(!b.dead)bc[b.o]=(bc[b.o]||0)+1;
 for(const p of G.players.values())players.push({id:p.id,n:p.name,c:p.color,a:p.alive?1:0,o:p.online?1:0,res:[Math.floor(p.res.c),Math.floor(p.res.m),Math.floor(p.res.f)],pop:p.pop,cap:p.popCap,hq:p.hq?[Math.round(p.hq.x),Math.round(p.hq.y)]:null,u:cnt[p.id]||0,b:bc[p.id]||0,k:p.stats.kills,age:p.alive?+(1+(G.t-p.spawnT)/90).toFixed(1):0,al:[...p.allies]});
 const info={t:'s',gt:+G.t.toFixed(1),day:G.day,players,nests:G.nests.map(n=>[n.id,Math.round(n.x),Math.round(n.y),n.lvl,n.act?1:0]),muts:G.muts,zc:G.zombies.length,sv:0,paused:onlineCount()===0?0:0};
 const zs=G.zombies.filter(z=>!z.dead),us=G.units.filter(u=>!u.dead),bs=G.buildings.filter(b=>!b.dead);
 const buf=Buffer.allocUnsafe(7+zs.length*10+us.length*10+bs.length*10);buf[0]=2;buf.writeUInt16LE(zs.length,1);buf.writeUInt16LE(us.length,3);buf.writeUInt16LE(bs.length,5);let o=7;
 for(const z of zs){buf.writeUInt32LE(z.id,o);buf[o+4]=S.ZI[z.type];buf[o+5]=(z.mode!=='idle'?1:0)|(z.elite?2:0);buf.writeUInt16LE(Math.min(65535,z.x|0),o+6);buf.writeUInt16LE(Math.min(65535,z.y|0),o+8);o+=10}
 for(const u of us){buf.writeUInt32LE(u.id,o);buf[o+4]=S.UI_[u.type];buf[o+5]=u.o;buf.writeUInt16LE(Math.min(65535,u.x|0),o+6);buf.writeUInt16LE(Math.min(65535,u.y|0),o+8);o+=10}
 for(const b of bs){buf.writeUInt32LE(b.id,o);buf[o+4]=S.BI[b.type];buf[o+5]=b.o;buf.writeUInt16LE(b.tx,o+6);buf.writeUInt16LE(b.ty,o+8);o+=10}
 for(const w of admins){if(w.readyState!==1||w.bufferedAmount>2e6)continue;w.send(JSON.stringify(info));w.send(buf)}
},250);
};
