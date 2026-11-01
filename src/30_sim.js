/* ---------------- SIMULATION (server, authoritative) ---------------- */
var hZ=null,hP=null;
function onMapResize(){hZ=new SHash();hP=new SHash()}
const CFG={zcap:1500,act:3600,field:120};
let KILLER=0;
const has=(p,id)=>p.done.has(id);
const modsOf=z=>G.MODSK[Math.min(z.mk,G.MODSK.length-1)];
const mkFor=ld=>Math.min(G.muts.length,Math.max(0,Math.floor((ld-1)/2)));
function ev(t,x,y,...r){G.ev.push([t,Math.round(x),Math.round(y),...r])}
function toP(p,o){if(p&&p.online&&p.msgs)p.msgs.push(o)}
function toAll(o){for(const p of G.players.values())toP(p,o)}
function notifyP(p,msg,type,x,y,key){if(!p)return;if(key){if(p.alertCD[key]&&G.t-p.alertCD[key]<12)return;p.alertCD[key]=G.t}toP(p,{t:'n',m:msg,k:type||'info',x:x===undefined?undefined:Math.round(x),y:y===undefined?undefined:Math.round(y)})}
function bannerP(p,text,sub,kind,snd){toP(p,{t:'bn',a:text,b:sub,k:kind||'',s:snd})}
function bannerAll(text,sub,kind,snd){for(const p of G.players.values())bannerP(p,text,sub,kind,snd)}
function sysChat(text){const m={t:'c',from:0,text};G.chat.push(m);if(G.chat.length>60)G.chat.shift();toAll(m)}

function newWorld(seed){
 setMapSize(CFG.w||560,CFG.h||400);genWorld(seed);
 G={seed,t:0,day:1,frame:0,players:new Map(),units:[],zombies:[],buildings:[],nests:[],proj:[],nid:1,bById:new Map(),ent:new Map(),nById:new Map(),
  mods:baseMods(),muts:[],MODSK:[baseMods()],nextMutDay:4,wm:pick(WMODS),crates:[],bmUntil:0,nextEvT:DAY_LEN*1.6,lastEv:'',tiers:(()=>{const a=[1];let d=1;while(d<700){d+=rndi(3,6);a.push(d)}return a})(),pendingMut:null,zcap:CFG.zcap,surge:1,growT:DAY_LEN*1.2,ev:[],aliveNests:0,
  fieldL:new Float32Array(MW*MH),fieldA:new Float32Array(MW*MH),fieldDirty:true,fieldT:-9,pres:null,presT:-9,actT:-9,chat:[],nextPid:1,kills:0,shake:0};
 WORLD.nests.forEach((n,i)=>addNest(n.tx,n.ty,n.island,300+rnd(0,160)+(i%9)*10));
 return G}
function addNest(tx,ty,island,asT){const n={k:'n',id:G.nid++,idx:G.nests.length,nextLvl:(G.day||1)+rndi(3,5),x:(tx+.5)*TILE,y:(ty+.5)*TILE,tx,ty,lvl:1,island,hp:0,maxhp:0,r:34,asT,spawnAcc:rnd(1),idleN:0,disc:false,dead:false,act:false,ld:1,idle:[]};n.maxhp=nestHp(1);n.hp=n.maxhp;G.nests.push(n);G.nById.set(n.id,n);G.ent.set(n.id,n);return n}

/* ---- players ---- */
function newPlayer(name,color,token){const id=G.nextPid++;const p={id,name,color,token,res:{c:0,m:0,f:0},rate:{c:0,m:0,f:0},pop:0,popCap:0,done:new Set(),cur:null,labs:0,hasRadar:false,hq:null,alive:false,allies:new Set(),reqIn:new Set(),reqOut:new Set(),online:true,conn:null,view:null,
  stats:{kills:0,lost:0,built:0,trained:0,elites:0,crates:0},perks:[],fx:computeFx([]),offer:null,nextOfferAge:5,mission:null,spawnT:0,alertCD:{},best:0,lives:0,offT:0,msgs:[],mini:null,cmdN:0,ageDay:1};G.players.set(id,p);return p}
function spawnPlayer(p,avoid,force){let st=force||findStart(avoid?[avoid]:[]);if(!st)st=findStart([]);if(!st)return false;
 for(const d of ensureDeposits(st))ev('dep',0,0,d.id,d.type,d.tx,d.ty,d.water?1:0);
 const sm=(G.wm&&G.wm.start)||1;p.res={c:Math.round(950*sm),m:Math.round(480*sm),f:Math.round(130*sm)};p.perks=[];p.fx=computeFx([]);p.offer=pickPerks(p,3);p.nextOfferAge=5;p.mission=null;p.rate={c:0,m:0,f:0};p.done=new Set();p.cur=null;p.alive=true;p.spawnT=G.t;p.lives++;p.stats={kills:0,lost:0,built:0,trained:0,elites:0,crates:0};p.reqIn.clear();p.reqOut.clear();p.alertCD={};
 const hq=addBuilding(p,'hq',st.tx-1,st.ty-1,true);p.hq=hq;
 for(let i=0;i<4;i++)addUnit(p,'rifleman',hq.x+rnd(-70,70),hq.y+75+rnd(0,30));addUnit(p,'engineer',hq.x+60,hq.y+70);
 recalcEcon(p);G.fieldDirty=true;
 toP(p,{t:'spawn',x:hq.x,y:hq.y});return true}
function eliminate(p,msg,silent){if(!p.alive)return;p.offer=null;p.mission=null;if(p.hq)p.lastHq={x:p.hq.x,y:p.hq.y};p.alive=false;const age=Math.floor(1+(G.t-p.spawnT)/DAY_LEN);p.best=Math.max(p.best,age);
 for(const b of G.buildings){if(b.o!==p.id||b.dead)continue;if(!silent&&Math.random()<.5)ev('bd',b.x,b.y,b.r,b.s);removeBuilding(b)}
 for(const u of G.units)if(u.o===p.id&&!u.dead){u.dead=true;if(!silent)ev('ud',u.x,u.y,u.d.cls==='inf'?1:0)}
 p.hq=null;p.cur=null;for(const a of p.allies){const q=PL(a);if(q)q.allies.delete(p.id)}p.allies.clear();
 for(const a of p.reqIn){const q=PL(a);if(q)q.reqOut.delete(p.id)}for(const a of p.reqOut){const q=PL(a);if(q)q.reqIn.delete(p.id)}p.reqIn.clear();p.reqOut.clear();
 toP(p,{t:'dead',msg:msg||'Your Command Center was destroyed',day:age,stats:p.stats,time:Math.floor(G.t-p.spawnT)});
 if(!silent)sysChat(p.name+"'s base has fallen on day "+age+'.');G.fieldDirty=true}
function respawn(p){if(p.alive)return'You are already deployed';const old=p.lastHq;if(!spawnPlayer(p,old)){return'No free land found'}sysChat(p.name+' has re-deployed.');return null}
function makeAllies(a,b){a.allies.add(b.id);b.allies.add(a.id);a.reqIn.delete(b.id);a.reqOut.delete(b.id);b.reqIn.delete(a.id);b.reqOut.delete(a.id);toP(a,{t:'n',m:'You are now allied with '+b.name,k:'good'});toP(b,{t:'n',m:'You are now allied with '+a.name,k:'good'});sysChat(a.name+' and '+b.name+' formed an alliance.')}
function reqAlly(p,toId){const q=PL(toId);if(!q||q===p||!q.alive||!p.alive)return'Invalid player';if(p.allies.has(toId))return'Already allied';if(q.reqOut.has(p.id)){makeAllies(p,q);return null}if(p.reqOut.has(toId))return'Request already sent';p.reqOut.add(toId);q.reqIn.add(p.id);toP(q,{t:'n',m:p.name+' proposes an alliance (open Players to accept)',k:'warn'});toP(p,{t:'n',m:'Alliance request sent to '+q.name,k:''});return null}
function acceptAlly(p,fromId){const q=PL(fromId);if(!q||!p.reqIn.has(fromId))return'No such request';makeAllies(p,q);return null}
function declineAlly(p,fromId){const q=PL(fromId);p.reqIn.delete(fromId);if(q)q.reqOut.delete(p.id);return null}
function breakAlly(p,withId){const q=PL(withId);if(!q||!p.allies.has(withId))return'Not allied';p.allies.delete(withId);q.allies.delete(p.id);toP(q,{t:'n',m:p.name+' ended the alliance',k:'warn'});toP(p,{t:'n',m:'Alliance with '+q.name+' ended',k:''});return null}
function sendAid(p,toId,amt){const q=PL(toId);if(!q||q===p||!q.alive||!p.alive)return'Invalid recipient';let tot=0;const v={};for(const k of['c','m','f']){const x=Math.floor(+(amt&&amt[k])||0);if(x<0||!isFinite(x))return'Invalid amount';if(x>p.res[k]+1e-6)return'Not enough '+RES[k].toLowerCase();v[k]=x;tot+=x}if(tot<=0)return'Nothing to send';
 for(const k in v){p.res[k]-=v[k];q.res[k]+=v[k]}const txt=(v.c?'$'+v.c+' ':'')+(v.m?'▣'+v.m+' ':'')+(v.f?'⛽'+v.f:'');toP(q,{t:'n',m:p.name+' sent you '+txt,k:'good',s:'done'});toP(p,{t:'n',m:'Sent '+txt+'to '+q.name,k:'good'});return null}

/* ---- entities ---- */
function addUnit(p,type,x,y){const d=U[type];const mh=uMaxHpP(p,type);const u={k:'u',id:G.nid++,o:p.id,type,d,x,y,ang:rnd(TAU),tang:0,hp:mh,maxhp:mh,cd:rnd(.3),cd2:0,scan:rnd(.3),path:null,pi:0,goal:null,am:false,focus:null,tgt:null,moving:false,r:d.r,stk:0,rep:0,hurtT:0,dead:false,bs:'idle',ammo:0,hx:x,hy:y,flash:0};u.tang=u.ang;G.units.push(u);G.ent.set(u.id,u);return u}
function addBuilding(p,type,tx,ty,instant){const d=B[type],s=d.size;const b={k:'b',id:G.nid++,o:p.id,type,d,tx,ty,s,x:(tx+s/2)*TILE,y:(ty+s/2)*TILE,w:s*TILE,h:s*TILE,r:s*TILE/2,hp:0,maxhp:bMaxHpP(p,type),prog:instant?1:0,done:!!instant,queue:[],rally:null,cd:0,scan:rnd(.3),ang:rnd(TAU),tgt:null,dead:false,hurtT:0,flash:0,water:false,mask:0};
 b.hp=instant?b.maxhp:b.maxhp*.12;
 for(let y=0;y<s;y++)for(let x=0;x<s;x++){occ[(ty+y)*MW+tx+x]=b.id;if(T[(ty+y)*MW+tx+x]===0)b.water=true}
 if(d.dep){const dep=WORLD.deposits[depGrid[ty*MW+tx]-1];if(dep){dep.used=true;dep.b=b.id;b.dep=dep;ev('du',0,0,dep.id,1)}}
 G.buildings.push(b);G.bById.set(b.id,b);G.ent.set(b.id,b);G.fieldDirty=true;
 if(B[type].wall)updateWallMasks(tx,ty);
 ejectFrom(b);return b}
function updateWallMasks(tx,ty){for(const[dx,dy]of[[0,0],[0,-1],[1,0],[0,1],[-1,0]]){const x=tx+dx,y=ty+dy;if(!inMap(x,y))continue;const id=occ[y*MW+x];const b=id&&G.bById.get(id);if(!b||!b.d.wall)continue;const isW=(xx,yy)=>{if(!inMap(xx,yy))return 0;const o=G.bById.get(occ[yy*MW+xx]);return o&&o.d.wall?1:0};b.mask=isW(x,y-1)|(isW(x+1,y)<<1)|(isW(x,y+1)<<2)|(isW(x-1,y)<<3)}}
function ejectFrom(b){const chk=(e,dom)=>{const tx=(e.x/TILE)|0,ty=(e.y/TILE)|0;if(tx>=b.tx&&tx<b.tx+b.s&&ty>=b.ty&&ty<b.ty+b.s){const pass=e.k==='z'?(e.swim?passA:passL):(dom==='water'?passW:passL);const ni=nearestPass(ty*MW+tx,pass,8);if(ni>=0){e.x=(ni%MW+.5)*TILE;e.y=((ni/MW|0)+.5)*TILE}}};
 const x0=b.x-b.r-40,x1=b.x+b.r+40,y0=b.y-b.r-40,y1=b.y+b.r+40;
 for(const u of G.units)if(u.d.dom!=='air'&&u.x>x0&&u.x<x1&&u.y>y0&&u.y<y1)chk(u,u.d.dom);for(const z of G.zombies)if(!z.fly&&z.x>x0&&z.x<x1&&z.y>y0&&z.y<y1)chk(z)}
function removeBuilding(b){if(b.dead&&b.removed)return;b.dead=true;b.removed=true;G.bById.delete(b.id);G.ent.delete(b.id);for(let y=0;y<b.s;y++)for(let x=0;x<b.s;x++)occ[(b.ty+y)*MW+b.tx+x]=0;if(b.dep){b.dep.used=false;ev('du',0,0,b.dep.id,0)}G.fieldDirty=true;if(b.d.wall)updateWallMasks(b.tx,b.ty)}
function placeBuilding(p,type,tx,ty){if(!p.alive)return'You are not deployed';const d=B[type];if(!d)return'Unknown building';if(!Number.isInteger(tx)||!Number.isInteger(ty))return'Bad position';const err=canPlaceP(p,type,tx,ty);if(err)return err;if(!affordP(p,d.cost))return'Not enough resources';spendP(p,d.cost);addBuilding(p,type,tx,ty,false);p.stats.built++;return null}
function sellBuilding(p,b){if(!b||b.dead||b.o!==p.id||b.type==='hq')return'Cannot sell';const f=b.done?.5:1;refundP(p,b.d.cost,f);for(const q of b.queue)refundP(p,q.cost,1);ev('ex',b.x,b.y,18,0);removeBuilding(b);recalcEcon(p);return null}
function recalcEcon(p){const r={c:0,m:0,f:0};let cap=0,labs=0,radar=false;for(const b of G.buildings){if(b.o!==p.id||!b.done||b.dead)continue;const d=b.d;if(d.inc){for(const k in d.inc){let v=d.inc[k];if(k==='m'&&has(p,'mining'))v*=1.35;if(k==='f'&&has(p,'refining'))v*=1.35;if(k==='m'&&has(p,'drilling'))v*=1.3;if(k==='f'&&has(p,'offshore'))v*=1.3;if(k==='c'&&b.type==='market'&&has(p,'commerce'))v*=1.4;if(k==='c'&&(b.type==='house'||b.type==='market')&&has(p,'urban'))v*=1.4;r[k]+=v}}if(d.pop)cap+=d.pop+(b.type==='house'&&has(p,'urban')?2:0);if(b.type==='lab')labs++;if(b.type==='radar')radar=true}
 {const f=fxOf(p),wi=(G.wm&&G.wm.inc)||1;r.c*=f.icr*wi;r.m*=f.imt*wi;r.f*=f.ifl*wi;cap+=f.house*G.buildings.reduce((a,b)=>a+(b.o===p.id&&b.done&&!b.dead&&b.type==='house'?1:0),0)}
 p.rate=r;p.popCap=cap;p.labs=labs;p.hasRadar=radar}
function enqueue(p,b,type){if(!b||b.o!==p.id||!b.done||b.dead)return'Not ready';if(!b.d.train||!b.d.train.includes(type))return'Cannot train that here';if(!unitAvailP(p,type))return'Requires research';const d=U[type];const c=ucostP(p,type);if(!affordP(p,c))return'Not enough resources';if(p.pop+d.pop>p.popCap)return'Population cap reached';if(b.queue.length>=6)return'Queue full';
 spendP(p,c);b.queue.push({type,prog:0,cost:c});p.pop+=d.pop;return null}
function dequeue(p,b,i){if(!b||b.o!==p.id)return;const q=b.queue[i];if(!q)return;refundP(p,q.cost,1);b.queue.splice(i,1)}
function findSpawn(b,dom){const s=b.s;let best=null,bd=1e9;const tx0=b.tx,ty0=b.ty;const tgt=b.rally||{x:b.x,y:b.y+200};
 for(let y=-2;y<=s+1;y++)for(let x=-2;x<=s+1;x++){if(x>=0&&x<s&&y>=0&&y<s)continue;const X=tx0+x,Y=ty0+y;if(!inMap(X,Y))continue;const i=Y*MW+X;const ok=dom==='water'?passW(i):passL(i);if(!ok)continue;const d=Math.hypot((X+.5)*TILE-tgt.x,(Y+.5)*TILE-tgt.y)+rnd(0,18);if(d<bd){bd=d;best=[X,Y]}}
 if(!best&&dom==='water'){const ni=nearestPass(((ty0+(s>>1))*MW+tx0+(s>>1)),passW,8);if(ni>=0)best=[ni%MW,(ni/MW)|0]}
 if(!best)return{x:b.x,y:b.y+b.h/2+16};return{x:(best[0]+.5)*TILE+rnd(-6,6),y:(best[1]+.5)*TILE+rnd(-6,6)}}
function finishTrain(p,b,q){const d=U[q.type];let pt;if(d.dom==='air')pt={x:b.x+rnd(-14,14),y:b.y+rnd(-14,14)};else pt=findSpawn(b,d.dom);const u=addUnit(p,q.type,pt.x,pt.y);u.hx=u.x;u.hy=u.y;if(b.rally)issueMove(u,b.rally.x+rnd(-18,18),b.rally.y+rnd(-18,18),false);p.stats.trained++;return u}

/* ---- damage ---- */
function hurtZombie(z,amt,type){if(z.dead)return;const m=modsOf(z);let a=amt;
 if(type==='bullet')a*=m.ballRes;if(type==='fire')a*=m.fireRes;
 const arm=(z.d.armor||0)+m.armor;if(type==='bullet')a=Math.max(a-arm,a*.2);else if(type==='blast')a=Math.max(a-arm*.5,a*.4);
 z.hp-=a;z.hurtT=2;if(z.hp<=0)killZombie(z,type)}
function killZombie(z,why){if(z.dead)return;z.dead=true;const d=z.d,m=modsOf(z);G.kills++;
 const kp=KILLER?PL(KILLER):null;const bounty=Math.round(d.bounty*(z.elite?3:1)*(1+Math.min(2,(z.ld-1)*.03))*(kp?fxOf(kp).bounty:1)*((G.wm&&G.wm.bounty)||1));
 if(kp){kp.res.c+=bounty;kp.res.m+=fxOf(kp).killm;kp.stats.kills++;if(z.elite)kp.stats.elites++;if(d.boss||z.elite||d.bounty>=10)toP(kp,{t:'fl',x:Math.round(z.x),y:Math.round(z.y-12),v:'+'+bounty});if(d.boss)kp.res.m+=100}
 ev('zd',z.x,z.y,ZI[z.type],z.r);
 if(z.type==='bloater'){const R=(m.cysts?112:84),dm=(m.cysts?95:72);explode(z.x,z.y,R,dm,'z',{gas:true})}
 if(m.acid)hurtPlayersIn(z.x,z.y,46,12);
 if(d.boss){bannerAll('TYRANT DOWN',(kp?kp.name:'Survivors')+' brought down a Tyrant.','good');ev('ex',z.x,z.y,40,1)}
}
function hurtPlayersIn(x,y,r,dmg){hP.each(x,y,r+30,e=>{if(e.k==='u'){const dd=Math.hypot(e.x-x,e.y-y);if(dd<r)hurtUnit(e,dmg*(1-dd/r*.5))}else if(e.k==='b'){const dd=rectDist(e,x,y);if(dd<r)hurtBuilding(e,dmg*1.5*(1-dd/r*.5))}})}
function hurtUnit(u,amt){if(u.dead)return;const p=PL(u.o);const a=Math.max(amt-(p?uArmorP(p,u):0),amt*.25)*(p?fxOf(p).taken:1);u.hp-=a;u.hurtT=.4;
 if(u.hp<=0){u.dead=true;if(p)p.stats.lost++;ev('ud',u.x,u.y,u.d.cls==='inf'?1:0);notifyP(p,u.d.name+' lost','warn',u.x,u.y,'lost'+u.type)}else notifyP(p,'Units under attack!','danger',u.x,u.y,'ua')}
function hurtBuilding(b,amt){if(b.dead)return;b.hp-=amt;b.hurtT=.3;if(b.hp<=0){destroyBuilding(b)}else if(b.done)notifyP(PL(b.o),b.d.name+' under attack!','danger',b.x,b.y,'ba'+(b.d.wall?'w':b.id))}
function destroyBuilding(b){if(b.dead)return;const p=PL(b.o);ev('bd',b.x,b.y,b.r,b.s);removeBuilding(b);if(p){p.stats.lost++;if(!b.d.wall)notifyP(p,b.d.name+' destroyed','danger',b.x,b.y);recalcEcon(p)}
 if(b.type==='hq'&&p){p.lastHq={x:b.x,y:b.y};const age=Math.floor(1+(G.t-p.spawnT)/DAY_LEN);eliminate(p,'Your Command Center fell on day '+age)}}
function hurtNest(n,amt){if(n.dead)return;n.hurtT=.2}
function explode(x,y,r,dmg,side,o){ev('ex',x,y,Math.round(r*.6),r>50?1:0);if(side==='p'){hZ.each(x,y,r+20,z=>{const d=Math.hypot(z.x-x,z.y-y);if(d<r+z.r){hurtZombie(z,dmg*(1-clamp(d/(r+z.r),0,1)*.6),'blast')}})}
 else hurtPlayersIn(x,y,r,dmg)}

/* ---- orders ---- */
function formOff(i,n){const cols=Math.ceil(Math.sqrt(n));const row=Math.floor(i/cols),col=i%cols;const rows=Math.ceil(n/cols);return[(col-(cols-1)/2)*24,(row-(rows-1)/2)*24]}
function issueMove(u,x,y,am,lead){if(u.dead)return;u.focus=null;u.am=!!am;u.stk=0;u.rep=0;x=clamp(x,16,WW-16);y=clamp(y,16,WH-16);
 if(u.d.bomber){u.manual={x,y};if(u.bs==='idle'||u.bs==='home'||u.bs==='rearm'){startRun(u,u.manual);u.manual=null}return}
 u.goal={x,y};if(u.d.dom==='air'){u.path=[{x,y}];u.pi=0;return}
 const dom=u.d.dom;
 if(lead){const L=lead[dom];if(L){if(L.fail){u.path=null;u.goal=null;return}if(Math.hypot(L.u.x-u.x,L.u.y-u.y)<120&&L.path){const pp=L.path.slice(0,-1);pp.push({x,y});u.path=pp;u.pi=0;return}}}
 u.path=findPath(u.x,u.y,x,y,dom);u.pi=0;if(!u.path)u.goal=null;
 if(lead&&!lead[dom])lead[dom]={u,path:u.path,fail:!u.path}}
function orderMove(list,x,y,am){const n=list.length;const lead={};list.forEach((u,i)=>{const o=n>1?formOff(i,n):[0,0];issueMove(u,x+o[0],y+o[1],am,n>1?lead:null)})}
function orderAttack(list,t){for(const u of list){if(u.dead)continue;if(u.d.bomber){issueMove(u,t.x,t.y);continue}if(!u.d.w&&!u.d.heal)continue;u.focus=t;u.am=false;u.path=null;u.goal=null;u.stk=0}}
function orderStop(list){for(const u of list){u.path=null;u.goal=null;u.focus=null;u.am=false;if(u.d.bomber){u.manual=null}}}

/* ---- zombies ---- */
function pickZombieType(n){const day=n.ld,m=G.MODSK[mkFor(n.ld)];const w=[['walker',100]];
 if(day>=2)w.push(['runner',35]);if(day>=3)w.push(['spitter',22]);if(day>=4)w.push(['brute',16+Math.min(day,40)]);if(day>=6||m.cysts)w.push(['bloater',m.cysts?28:14]);if(day>=8)w.push(['screamer',9]);
 if(m.spores&&day>=3)w.push(['gargoyle',30]);else if(day>=9)w.push(['gargoyle',10]);
 const coast=WORLD.dw[n.ty*MW+n.tx]<=6;if(day>=5&&(n.island||coast))w.push(['drowned',n.island?30:12]);
 let tot=0;for(const x of w)tot+=x[1];let r=Math.random()*tot;for(const x of w){r-=x[1];if(r<=0)return x[0]}return'walker'}
function spawnZombie(type,x,y,nest,mode,ld){if(G.zombies.length>=G.zcap)return null;const d=Z[type];ld=ld||(nest?nest.ld:1);const mk=mkFor(ld),m=G.MODSK[mk];const scale=.8*(1+(ld-1)*.04)*((G.wm&&G.wm.hp)||1);const eliteP=Math.max(m.elite,Math.min(.25,Math.max(0,(ld-10)*.01)));const elite=!d.boss&&Math.random()<eliteP;
 const hp=d.hp*m.hpMul*scale*(elite?3:1);
 const z={k:'z',id:G.nid++,type,d,ld,mk,x,y,ang:rnd(TAU),hp,maxhp:hp,r:d.r*(elite?1.25:1),elite,nest:nest?nest.id:0,home:nest?{x:nest.x,y:nest.y}:{x,y},mode:mode||'idle',scan:rnd(.4),tgt:null,cd:rnd(.6),burn:0,burnBy:0,hurtT:0,flowT:0,stk:0,buff:0,fly:!!d.fly,swim:!!d.swim||m.swim,wx:x,wy:y,wT:0,dead:false,mv:0};
 G.zombies.push(z);G.ent.set(z.id,z);return z}
function zSpeed(z){const m=modsOf(z);let s=z.d.speed*m.spdMul*(z.buff>0?1.3:1)*(z.elite?1.1:1);if(z.mode==='idle')s*=.45;return s}
function canStandZ(z,x,y){if(z.fly)return x>0&&y>0&&x<WW&&y<WH;const tx=(x/TILE)|0,ty=(y/TILE)|0;if(!inMap(tx,ty))return false;return z.swim?passA(ty*MW+tx):passL(ty*MW+tx)}
function moveZ(z,vx,vy){if(z.fly){z.x=clamp(z.x+vx,2,WW-2);z.y=clamp(z.y+vy,2,WH-2);return true}let ok=false;if(canStandZ(z,z.x+vx,z.y)){z.x+=vx;ok=true}if(canStandZ(z,z.x,z.y+vy)){z.y+=vy;ok=true}return ok}
function entDistZ(z,t){if(t.k==='b')return rectDist(t,z.x,z.y);return Math.hypot(t.x-z.x,t.y-z.y)-(t.r||6)}
function acquireZ(z){const m=modsOf(z),d=z.d;let best=null,bd=1e9;const ar=(z.mode==='idle'?150:190)*m.aggro*(d.fly?1.4:1);
 hP.each(z.x,z.y,Math.max(ar,110),e=>{if(e.k==='u'){if(e.d.dom==='air'&&!d.fly)return;if(e.d.dom==='water'&&!z.swim&&!d.range&&Math.hypot(e.x-z.x,e.y-z.y)>d.reach+40)return;if(e.d.dom==='air'&&e.d.bomber)return;const dd=Math.hypot(e.x-z.x,e.y-z.y);if(dd<ar&&dd<bd){bd=dd;best=e}}});
 if(best)return best;
 if(z.mode!=='idle'||d.fly){const br=d.range?d.range:(d.fly?500:70);
  hP.each(z.x,z.y,br+40,e=>{if(e.k==='b'){const dd=rectDist(e,z.x,z.y);if(dd<br&&dd<bd){bd=dd;best=e}}})}
 return best}
function zAttack(z,t){const d=z.d,m=modsOf(z);let dmg=d.dmg*((G.wm&&G.wm.dmg)||1)*m.dmgMul*(z.elite?1.5:1)*(z.buff>0?1.2:1)**.85*(1+(z.ld-1)*.02);
 if(d.range){const dist=Math.hypot(t.x-z.x,t.y-z.y);const dur=Math.max(.3,dist/220);G.proj.push({t:'acid',x:z.x,y:z.y,sx:z.x,sy:z.y,tx:t.x,ty:t.y,age:0,dur,dmg:dmg*(t.k==='b'?2:1),splash:30});ev('ac',z.x,z.y,t.x,t.y,dur);return}
 if(z.type==='bloater'){z.hp=0;killZombie(z,'self');return}
 if(t.k==='b'){hurtBuilding(t,dmg*(z.type==='brute'||z.type==='tyrant'?1.8:1));if(t.d.thorns&&!z.dead&&!z.fly){const k=KILLER;KILLER=t.o;hurtZombie(z,t.d.thorns,'thorns');KILLER=k;if(z.dead)return}}else hurtUnit(t,dmg);
 if(z.type==='tyrant'){explode(t.x,t.y,60,40,'z')}
 z.atk=.25}
function updateZombie(z,dt){const d=z.d,m=modsOf(z);const ox0=z.x,oy0=z.y;
 if(z.burn>0){z.burn-=dt;const k=KILLER;KILLER=z.burnBy;hurtZombie(z,7*dt,'fire');KILLER=k;if(z.dead)return}
 if(z.hurtT>0)z.hurtT-=dt;else if(m.regen&&z.hp<z.maxhp)z.hp=Math.min(z.maxhp,z.hp+m.regen*dt);
 if(z.buff>0)z.buff-=dt;if(z.atk>0)z.atk-=dt;z.cd-=dt;z.scan-=dt;z.flowT-=dt;
 if(d.aura&&(z.scanA=(z.scanA||0)-dt)<=0){z.scanA=.5;hZ.each(z.x,z.y,d.aura,o=>{o.buff=.8})}
 if(z.scan<=0){z.scan=.3+Math.random()*.2;
  if(z.flowT>0)z.tgt=null;else{const t=acquireZ(z);if(t&&z.mode==='idle'&&Math.hypot(t.x-z.home.x,t.y-z.home.y)>520)z.tgt=null;else z.tgt=t}}
 if(z.tgt&&(z.tgt.dead))z.tgt=null;
 const spd=zSpeed(z);let moved=false;
 if(z.tgt){const t=z.tgt,dd=entDistZ(z,t);const reach=d.range||d.reach+(z.elite?3:0);
  if(dd<=reach){z.ang=turnTo(z.ang,Math.atan2(t.y-z.y,t.x-z.x),dt*10);if(z.cd<=0){z.cd=d.cd*(z.buff>0?.8:1);zAttack(z,t)}z.stk=0}
  else{const a=Math.atan2(t.y-z.y,t.x-z.x);z.ang=turnTo(z.ang,a,dt*8);const ox=z.x,oy=z.y;moveZ(z,Math.cos(z.ang)*spd*dt,Math.sin(z.ang)*spd*dt);moved=true;
   if(Math.hypot(z.x-ox,z.y-oy)<spd*dt*.25){z.stk+=dt;if(z.stk>.7){z.flowT=2.5;z.tgt=null;z.stk=0}}else z.stk=Math.max(0,z.stk-dt)}}
 else if(z.mode==='idle'){z.wT-=dt;if(z.wT<=0){z.wT=rnd(2,5);const a=rnd(TAU),r=rnd(10,70);z.wx=z.home.x+Math.cos(a)*r;z.wy=z.home.y+Math.sin(a)*r}
  const dd=Math.hypot(z.wx-z.x,z.wy-z.y);if(dd>8){const a=Math.atan2(z.wy-z.y,z.wx-z.x);z.ang=turnTo(z.ang,a,dt*5);moveZ(z,Math.cos(z.ang)*spd*dt,Math.sin(z.ang)*spd*dt);moved=true}}
 else if(z.fly){ // winged: fly straight at the nearest base building
  if((z.fscan=(z.fscan||0)-dt)<=0||!z.ftgt||z.ftgt.dead){z.fscan=1.5;let best=null,bd=1e9;for(const b of G.buildings){if(b.dead)continue;const dd=Math.abs(b.x-z.x)+Math.abs(b.y-z.y);if(dd<bd){bd=dd;best=b}}z.ftgt=best}
  if(z.ftgt){const a=Math.atan2(z.ftgt.y-z.y,z.ftgt.x-z.x);z.ang=turnTo(z.ang,a,dt*4);moveZ(z,Math.cos(z.ang)*spd*dt,Math.sin(z.ang)*spd*dt);moved=true}else{z.mode='idle';z.nest=0;z.home={x:z.x,y:z.y}}}
 else{ // flow
  const tx=clamp((z.x/TILE)|0,0,MW-1),ty=clamp((z.y/TILE)|0,0,MH-1);const field=z.swim?G.fieldA:G.fieldL,pass=z.swim?passA:passL;
  if(field[ty*MW+tx]>=1e8){z.mode='idle';z.nest=0;z.home={x:z.x,y:z.y}}
  else{const ni=flowNext(field,tx,ty,pass);if(ni>=0){if(occ[ni]){const b=G.bById.get(occ[ni]);if(b)z.tgt=b}else{const cx=(ni%MW+.5)*TILE+Math.sin(z.id)*6,cy=((ni/MW|0)+.5)*TILE+Math.cos(z.id*1.7)*6;const a=Math.atan2(cy-z.y,cx-z.x);z.ang=turnTo(z.ang,a,dt*8);moveZ(z,Math.cos(z.ang)*spd*dt,Math.sin(z.ang)*spd*dt);moved=true}}}}
 // separation
 if(!z.fly&&((z.id+G.frame)&1)===0){let px=0,py=0,n=0;hZ.each(z.x,z.y,16,o=>{if(o===z||o.fly)return;const dx=z.x-o.x,dy=z.y-o.y,dd=dx*dx+dy*dy;if(dd<(z.r+o.r)*(z.r+o.r)*.8&&n<6){const l=Math.sqrt(dd)||1;px+=dx/l;py+=dy/l;n++}});if(n)moveZ(z,px/n*26*dt*2,py/n*26*dt*2)}
 z.mv=moved?1:0}

/* ---- player weapons ---- */
function wspec(e){return e.k==='u'?e.d:e.d.weapon}
function dmgMul(e,s){let m=1;const p=PL(e.o);if(p)m*=fxOf(p).dmg;if(s.w==='bullet'){if(p&&has(p,'fmj'))m*=1.2}return m}
function canHitZ(s,z){if(s.aaOnly)return z.fly;if(z.fly)return !!s.aa;return true}
function findTargetFor(e){const s=wspec(e);if(!s)return null;let best=null,bd=1e9;const r=s.range,mr=s.minRange||0;
 hZ.each(e.x,e.y,r+14,z=>{if(!canHitZ(s,z))return;const dd=Math.hypot(z.x-e.x,z.y-e.y);if(dd>r+z.r*.5||dd<mr)return;let sc=dd;if(z.d.boss)sc-=40;if(z.type==='spitter'||z.type==='screamer')sc-=30;if(sc<bd){bd=sc;best=z}});
 return best}
function hurtTarget(t,dmg,type){if(t.k==='z')hurtZombie(t,dmg,type)}
function fireWeapon(e,s,t){KILLER=e.o;const a=Math.atan2(t.y-e.y,t.x-e.x);const mx=e.x+Math.cos(a)*(e.r*.8+4),my=e.y+Math.sin(a)*(e.r*.8+4);const mul=dmgMul(e,s);
 switch(s.w){
  case'bullet':{hurtTarget(t,s.dmg*mul,'bullet');ev('b',mx,my,t.x+rnd(-4,4),t.y+rnd(-4,4),s.dmg>30?1:0);e.flash=.12;break}
  case'flame':{hZ.each(e.x,e.y,s.range+10,z=>{if(z.fly)return;const dx=z.x-e.x,dy=z.y-e.y,dd=Math.hypot(dx,dy);if(dd>s.range+z.r)return;if(Math.abs(angDiff(a,Math.atan2(dy,dx)))<.42){hurtZombie(z,s.dmg*mul,'fire');z.burn=3;z.burnBy=e.o}});
   ev('f',mx,my,Math.round(a*100));e.flash=.12;break}
  case'shell':{const d=Math.hypot(t.x-mx,t.y-my);const dur=Math.max(.25,d/(s.splash>70?420:520));const tx=t.x+rnd(-8,8),ty=t.y+rnd(-8,8);G.proj.push({t:'shell',x:mx,y:my,sx:mx,sy:my,tx,ty,age:0,dur,dmg:s.dmg*mul,splash:s.splash,own:e.o});ev('sh',mx,my,tx,ty,dur,s.splash>70?1:0);e.flash=.15;break}
  case'flak':{const px=t.x+rnd(-10,10),py=t.y+rnd(-10,10);ev('fk',mx,my,px,py);hZ.each(px,py,s.splash+10,z=>{if(z.fly&&Math.hypot(z.x-px,z.y-py)<s.splash)hurtZombie(z,s.dmg*mul,'blast')});e.flash=.12;break}
  case'tesla':{let cur=t,hit=[t],dm=s.dmg*mul;const pts=[Math.round(e.x),Math.round(e.y-4)];for(let i=0;i<(s.chain||4);i++){if(!cur)break;pts.push(Math.round(cur.x),Math.round(cur.y));hurtTarget(cur,dm,'elec');dm*=.8;let nx=null,nd=80;hZ.each(cur.x,cur.y,80,z=>{if(hit.includes(z)||!canHitZ(s,z))return;const dd=Math.hypot(z.x-cur.x,z.y-cur.y);if(dd<nd){nd=dd;nx=z}});if(nx)hit.push(nx);cur=nx}
   ev('tz',e.x,e.y,pts);break}
 }}
function updateAim(e,t,dt,rate){const a=Math.atan2(t.y-e.y,t.x-e.x);const ref=e.k==='u'?(e.tang=turnTo(e.tang,a,dt*rate)):(e.ang=turnTo(e.ang,a,dt*rate));return Math.abs(angDiff(ref,a))}
function tgtValid(e,t,s){if(!t||t.dead)return false;const dd=Math.hypot(t.x-e.x,t.y-e.y);return dd<=s.range+(t.r||0)+10&&dd>=(s.minRange||0)}

function followPath(u,dt,spd){if(!u.path)return false;const wp=u.path[u.pi];if(!wp){u.path=null;u.goal=null;u.am=false;return false}
 const dx=wp.x-u.x,dy=wp.y-u.y,dd=Math.hypot(dx,dy);if(dd<(u.pi===u.path.length-1?4:7)){u.pi++;if(u.pi>=u.path.length){u.path=null;u.goal=null;u.am=false}return false}
 const a=Math.atan2(dy,dx);u.ang=turnTo(u.ang,a,dt*(u.d.cls==='inf'?12:u.d.dom==='air'?3:4));const sp=Math.min(spd*dt,dd);const dom=u.d.dom;
 const vx=Math.cos(u.ang)*sp,vy=Math.sin(u.ang)*sp;const ox=u.x,oy=u.y;
 if(dom==='air'){u.x+=vx;u.y+=vy}else{if(passTile(dom,((u.x+vx)/TILE)|0,(u.y/TILE)|0))u.x+=vx;if(passTile(dom,(u.x/TILE)|0,((u.y+vy)/TILE)|0))u.y+=vy}
 if(Math.hypot(u.x-ox,u.y-oy)<sp*.2){u.stk+=dt;if(u.stk>.8){u.stk=0;if(u.rep<3&&u.goal){u.rep++;u.path=findPath(u.x,u.y,u.goal.x,u.goal.y,dom);u.pi=0;if(!u.path){u.goal=null}}else{u.path=null;u.goal=null}}}else u.stk=0;
 return true}
function updateUnit(u,dt){const d=u.d;u.cd-=dt;u.scan-=dt;if(u.hurtT>0)u.hurtT-=dt;if(u.flash>0)u.flash-=dt;
 if(u.d.bomber){updateBomber(u,dt);return}
 const s=d.w?d:null;u.moving=false;
 if(u.focus&&u.focus.dead)u.focus=null;
 if(s){if(u.focus){u.tgt=u.focus}else if(u.scan<=0){u.scan=.2+Math.random()*.1;u.tgt=findTargetFor(u)}if(u.tgt&&(u.tgt.dead||(!u.focus&&!tgtValid(u,u.tgt,s))))u.tgt=null}
 if(u.focus&&s){const dd=Math.hypot(u.focus.x-u.x,u.focus.y-u.y)-(u.focus.r||0);
  if(dd>s.range*.92||dd<(s.minRange||0)){u.rep2=(u.rep2||0)-dt;if(!u.path||u.rep2<=0){u.rep2=1.2;const ex=u.focus.x,ey=u.focus.y;if(d.dom==='air'){u.path=[{x:ex-Math.cos(u.ang)*s.range*.6,y:ey-Math.sin(u.ang)*s.range*.6}];u.pi=0}else u.path=findPath(u.x,u.y,ex,ey,d.dom),u.pi=0;u.goal=u.path?{x:ex,y:ey}:null}}
  else{u.path=null}}
 if(d.heal)medicAI(u,dt);if(d.repair)engineerAI(u,dt);
 if(u.path){const stopForTarget=u.am&&u.tgt&&!u.tgt.dead&&s&&tgtValid(u,u.tgt,s);if(!stopForTarget){u.moving=followPath(u,dt,d.speed)}}
 if(s&&u.tgt){const t=u.tgt;const err=updateAim(u,t,dt,d.cls==='inf'?12:6);if(d.cls==='inf'&&!u.moving)u.ang=turnTo(u.ang,u.tang,dt*10);if(d.dom==='air'&&!u.moving)u.ang=turnTo(u.ang,u.tang,dt*3);
  if(u.cd<=0&&err<.25&&tgtValid(u,t,s)){u.cd=s.cd;fireWeapon(u,s,t)}
  if(d.rocket){u.cd2-=dt;if(u.cd2<=0&&Math.hypot(t.x-u.x,t.y-u.y)<d.range+30&&t.k==='z'&&!t.fly){u.cd2=d.rocket.cd;const dur=Math.hypot(t.x-u.x,t.y-u.y)/380+.05;G.proj.push({t:'rocket',x:u.x,y:u.y,sx:u.x,sy:u.y,tx:t.x,ty:t.y,age:0,dur,dmg:d.rocket.dmg,splash:d.rocket.splash,own:u.o});ev('rk',u.x,u.y,t.x,t.y,dur)}}}
 else if(s){u.tang=turnTo(u.tang,u.ang,dt*4)}
 else u.tang=u.ang;
 if(d.dom!=='air'&&((u.id+G.frame)%2)===0){let px=0,py=0,n=0;hP.each(u.x,u.y,18,o=>{if(o===u||o.k!=='u'||o.d.dom!==d.dom)return;const dx=u.x-o.x,dy=u.y-o.y,dd=dx*dx+dy*dy,rr=(u.r+o.r)*.9;if(dd<rr*rr&&n<5){const l=Math.sqrt(dd)||1;px+=dx/l;py+=dy/l;n++}});
  if(n){const vx=px/n*22*dt*2,vy=py/n*22*dt*2;if(passTile(d.dom,((u.x+vx)/TILE)|0,(u.y/TILE)|0))u.x+=vx;if(passTile(d.dom,(u.x/TILE)|0,((u.y+vy)/TILE)|0))u.y+=vy}}}
function medicAI(u,dt){u.healT=(u.healT||0)-dt;if(u.healT>0)return;u.healT=.25;const p=PL(u.o);let best=null,bs=0;hP.each(u.x,u.y,u.d.healR,o=>{if(o.k!=='u'||o===u||!isFriend(u.o,o.o))return;const miss=o.maxhp-o.hp;if(miss>2&&miss>bs){bs=miss;best=o}});if(!best&&u.hp<u.maxhp)best=u;
 if(best){const h=u.d.heal*(p&&has(p,'triage')?1.5:1)*.25;best.hp=Math.min(best.maxhp,best.hp+h)}}
function engineerAI(u,dt){u.healT=(u.healT||0)-dt;if(u.healT>0)return;u.healT=.25;let best=null,bd=1e9;hP.each(u.x,u.y,340,b=>{if(b.k!=='b'||b.dead||!b.done||b.hp>=b.maxhp||!isFriend(u.o,b.o))return;const dd=rectDist(b,u.x,u.y);if(dd<bd){bd=dd;best=b}});
 if(best&&bd<46){best.hp=Math.min(best.maxhp,best.hp+u.d.repair*.25);u.path=null;const a=Math.atan2(best.y-u.y,best.x-u.x);u.ang=turnTo(u.ang,a,.5)}
 else if(best&&!u.path&&bd<340&&!u.focus){u.path=findPath(u.x,u.y,best.x,best.y,'land');u.pi=0;u.goal=null}}

/* bombers */
function startRun(u,P0){u.bs='run';u.P=P0;u.ammo=14;u.pass=0;u.minD=1e9}
function updateBomber(u,dt){const d=u.d;
 const hx=u.hx,hy=u.hy;
 if(u.bs==='idle'){u.orb=(u.orb||0)+dt*.6;const ox=hx+Math.cos(u.orb)*70,oy=hy+Math.sin(u.orb)*70;const a=Math.atan2(oy-u.y,ox-u.x);u.ang=turnTo(u.ang,a,dt*2);const sp=Math.min(d.speed*.5,Math.hypot(ox-u.x,oy-u.y)*3+20);u.x+=Math.cos(u.ang)*sp*dt;u.y+=Math.sin(u.ang)*sp*dt;
  if(u.manual){startRun(u,u.manual);u.manual=null}
  else if((u.scan-=dt)<=0){u.scan=1.2;let bestP=null,bc=3;hZ.each(hx,hy,1100,z=>{if(z.fly||bestP&&Math.random()<.7)return;let c=0;hZ.each(z.x,z.y,90,o=>{if(!o.fly)c++});if(c>bc){bc=c;bestP={x:z.x,y:z.y}}});if(bestP)startRun(u,bestP)}return}
 if(u.bs==='run'){const P0=u.P;const a=Math.atan2(P0.y-u.y,P0.x-u.x);u.ang=turnTo(u.ang,a,dt*(Math.hypot(P0.x-u.x,P0.y-u.y)>200?2.2:.4));u.x+=Math.cos(u.ang)*d.speed*dt;u.y+=Math.sin(u.ang)*d.speed*dt;const dd=Math.hypot(P0.x-u.x,P0.y-u.y);u.minD=Math.min(u.minD,dd);
  if(dd<150&&u.ammo>0){if(u.cd<=0){u.cd=.1;u.ammo--;G.proj.push({t:'bomb',x:u.x,y:u.y,tx:u.x,ty:u.y,age:0,dur:.55,dmg:d.dmg,splash:d.splash,own:u.o});ev('bm',u.x,u.y,.55)}}
  if(u.minD<150&&dd>u.minD+40){u.bs='away'}return}
 if(u.bs==='away'){u.x+=Math.cos(u.ang)*d.speed*dt;u.y+=Math.sin(u.ang)*d.speed*dt;const dd=Math.hypot(u.P.x-u.x,u.P.y-u.y);if(dd>480){u.pass++;let near=false;hZ.each(u.P.x,u.P.y,170,z=>{near=true});if(u.ammo>0&&u.pass<3&&near){u.bs='run';u.minD=1e9}else u.bs='home'}u.x=clamp(u.x,0,WW);u.y=clamp(u.y,0,WH);return}
 if(u.bs==='home'){const a=Math.atan2(hy-u.y,hx-u.x);u.ang=turnTo(u.ang,a,dt*2);u.x+=Math.cos(u.ang)*d.speed*dt;u.y+=Math.sin(u.ang)*d.speed*dt;if(Math.hypot(hx-u.x,hy-u.y)<60){u.bs='rearm';u.rearm=4}return}
 if(u.bs==='rearm'){u.rearm-=dt;u.x+=Math.cos(u.ang)*d.speed*.3*dt;u.y+=Math.sin(u.ang)*d.speed*.3*dt;if(u.rearm<=0)u.bs='idle'}}

/* buildings */
function updateBuilding(b,dt){const p=PL(b.o);
 if(b.hurtT>0)b.hurtT-=dt;if(b.flash>0)b.flash-=dt;
 if(!b.done){b.prog+=dt*fxOf(PL(b.o)||{}).build/Math.max(1,b.d.time);const nh=b.maxhp*(.12+.88*clamp(b.prog,0,1));b.hp=Math.min(b.maxhp,Math.max(b.hp,nh));
  if(b.prog>=1){b.done=true;b.hp=Math.max(b.hp,b.maxhp*.12);if(p){recalcEcon(p);notifyP(p,b.d.name+' completed','good',b.x,b.y);toP(p,{t:'s',n:'done'})}}return}
 if(b.queue.length&&p){const q=b.queue[0];const d=U[q.type];q.prog+=dt*fxOf(p).train/d.time;if(q.prog>=1){b.queue.shift();finishTrain(p,b,q)}}
 const s=b.d.weapon;if(s){b.cd-=dt;b.scan-=dt;if(b.scan<=0){b.scan=.2+Math.random()*.1;b.tgt=findTargetFor(b)}if(b.tgt&&(b.tgt.dead||!tgtValid(b,b.tgt,s)))b.tgt=null;
  if(b.tgt){const err=updateAim(b,b.tgt,dt,s.w==='shell'?3:9);if(b.cd<=0&&err<.2){b.cd=s.cd;fireWeapon(b,s,b.tgt)}}}
 if(b.d.heal){b.healT=(b.healT||0)-dt;if(b.healT<=0){b.healT=.5;hP.each(b.x,b.y,b.d.heal.r,o=>{if(o.k==='u'&&o.hp<o.maxhp&&isFriend(b.o,o.o)){o.hp=Math.min(o.maxhp,o.hp+b.d.heal.hps*.5*(p&&has(p,'triage')?1.5:1))}})}}
}

/* ---- projectiles ---- */
function updateProj(dt){const a=G.proj;for(let i=0;i<a.length;i++){const p=a[i];p.age+=dt;const f=clamp(p.age/p.dur,0,1);
  if(p.t==='shell'||p.t==='acid'||p.t==='rocket'){if(f>=1){p.dead=true;if(p.t==='acid'){hurtPlayersIn(p.tx,p.ty,p.splash,p.dmg)}else{KILLER=p.own;explode(p.tx,p.ty,p.splash,p.dmg,'p')}}}
  else if(p.t==='bomb'){if(f>=1){p.dead=true;KILLER=p.own;explode(p.x,p.y,p.splash,p.dmg,'p')}}}
 G.proj=a.filter(p=>!p.dead)}

/* ---- outbreak director ---- */
function buildPresence(){const PW=Math.ceil(WW/256),PH=Math.ceil(WH/256);G.PW=PW;G.PH=PH;let a=G.pres,b=G.pres2;if(!a){a=G.pres=new Uint8Array(PW*PH);b=G.pres2=new Uint8Array(PW*PH)}a.fill(0);
 const mark=e=>{a[clamp((e.y/256)|0,0,PH-1)*PW+clamp((e.x/256)|0,0,PW-1)]=1};for(const e of G.buildings)if(!e.dead)mark(e);for(const e of G.units)if(!e.dead)mark(e);
 const R=4;b.fill(0);for(let y=0;y<PH;y++)for(let x=0;x<PW;x++){if(!a[y*PW+x])continue;for(let dx=-R;dx<=R;dx++){const X=x+dx;if(X>=0&&X<PW)b[y*PW+X]=1}}
 a.fill(0);for(let y=0;y<PH;y++)for(let x=0;x<PW;x++){if(!b[y*PW+x])continue;for(let dy=-R;dy<=R;dy++){const Y=y+dy;if(Y>=0&&Y<PH)a[Y*PW+x]=1}}}
const awake=z=>z.mode!=='idle'||G.pres[((z.y/256)|0)*G.PW+((z.x/256)|0)]===1;
function strengthDay(a){a=Math.floor(a);let t=1;for(const x of G.tiers){if(x<=a)t=x;else break}return t}
function updateActive(){for(const n of G.nests){n.act=false;n.ld=1}const A=CFG.act;
 for(const p of G.players.values()){if(!p.alive)continue;p.ageDay=Math.min(G.day,1+(G.t-p.spawnT)/DAY_LEN);if(!p.offer&&p.ageDay>=p.nextOfferAge){p.nextOfferAge+=5;p.offer=pickPerks(p,3);if(p.offer.length)notifyP(p,'A new doctrine is available — choose one!','good');else p.offer=null}
  for(const n of G.nests){let near=false;for(const b of G.buildings){if(b.o!==p.id||b.dead)continue;if(Math.abs(b.x-n.x)<A&&Math.abs(b.y-n.y)<A&&Math.hypot(b.x-n.x,b.y-n.y)<A){near=true;break}}if(near){n.act=true;const sd=strengthDay(p.ageDay);if(sd>n.ld)n.ld=sd}}}}
function updateNests(dt){const D={spawn:1};const night=nightAmt(gameHour());let alive=0;
 for(const n of G.nests)n.idle.length=0;
 for(const z of G.zombies)if(z.nest&&z.mode==='idle'&&!z.dead){const n=G.nById.get(z.nest);if(n)n.idle.push(z)}
 for(const n of G.nests){if(n.dead)continue;alive++;n.idleN=n.idle.length;if(n.hurtT>0)n.hurtT-=dt;if(!n.act)continue;
  const ld=n.ld;const elvl=Math.min(n.lvl,Math.max(1,Math.ceil(ld/3)));const em=clamp((.2+(ld-1)*.07)*((G.wm&&G.wm.spawn)||1)*(G.t<G.bmUntil?2.5:1),.2,5);const cap=(8+elvl*5)*clamp(em,.5,3);
  if(n.idleN<cap&&G.zombies.length<G.zcap-20){n.spawnAcc+=dt*(.05+.03*Math.min(elvl,14))*em*(1+night*.35)*G.MODSK[mkFor(ld)].spawnMul*(ld<2?.8:1)*G.surge;
   while(n.spawnAcc>=1){n.spawnAcc-=1;const a=rnd(TAU),r=rnd(24,50);const z=spawnZombie(pickZombieType(n),n.x+Math.cos(a)*r,n.y+Math.sin(a)*r,n,'idle');if(z)n.idle.push(z)}}
  n.asT-=dt*(1+night*.25)*G.surge;if(n.asT<=0){launchAssault(n);n.asT=Math.max(30,100-ld*2)*rnd(.9,1.25)}}
 G.aliveNests=alive}
function launchAssault(n){const list=n.idle.filter(z=>!z.dead);if(list.length<4){n.asT=8;return}
 const ni=n.ty*MW+n.tx;const landOK=G.fieldL[ni]<1e8,seaOK=G.fieldA[ni]<1e8;const go=[];for(const z of list){if(z.fly||(z.swim?seaOK||landOK:landOK))go.push(z)}
 if(go.length<4){n.asT=15;return}
 for(const z of go){z.mode='assault';z.tgt=null;z.nest=0}
 // warn players whose base is the likely target (nearest HQ within range)
 let tp=null,td=1e9;for(const p of G.players.values()){if(!p.alive||!p.hq)continue;const d=Math.hypot(n.x-p.hq.x,n.y-p.hq.y);if(d<td){td=d;tp=p}}
 for(const p of G.players.values()){if(!p.alive||!p.hq)continue;const d=Math.hypot(n.x-p.hq.x,n.y-p.hq.y);if(d>5200)continue;const a=Math.atan2(n.y-p.hq.y,n.x-p.hq.x);
  if(go.length>=5)notifyP(p,'Horde of '+go.length+' marching from the '+compass(a)+' ('+Math.round(d/TILE)+' tiles)','danger',n.x,n.y,'as'+n.id);
  if(go.some(z=>z.type==='gargoyle'))notifyP(p,'Winged mutants spotted in the '+compass(a)+'!','warn',n.x,n.y,'garg');
  if(go.some(z=>z.type==='drowned'))notifyP(p,'Drowned approaching from the sea ('+compass(a)+')','warn',n.x,n.y,'drown');
  if(d<3200)toP(p,{t:'s',n:'horn'})}}
function growOutbreak(){const alive=G.nests.filter(n=>!n.dead&&n.act);if(!alive.length)return;const maxN=Math.min(110,WORLD.nests.length*2);
 if(G.nests.length<maxN&&Math.random()<.5){
  for(let t=0;t<200;t++){const src=pick(alive);const a=rnd(TAU),r=rnd(10,22);const tx=Math.round(src.tx+Math.cos(a)*r),ty=Math.round(src.ty+Math.sin(a)*r);if(!inMap(tx,ty))continue;const i=ty*MW+tx;if(T[i]!==1||depGrid[i]||occ[i])continue;
   let ok=true;for(const n of G.nests)if(Math.abs(n.tx-tx)<12&&Math.abs(n.ty-ty)<12)ok=false;for(const b of G.buildings)if(Math.abs(b.x-(tx+.5)*TILE)<22*TILE&&Math.abs(b.y-(ty+.5)*TILE)<22*TILE)ok=false;if(!ok)continue;
   const isl=WORLD.sizes[WORLD.comp[i]]<WORLD.BIG;const n=addNest(tx,ty,isl,50);n.lvl=Math.max(1,Math.floor(G.day/3));n.maxhp=nestHp(n.lvl);n.hp=n.maxhp;n.act=true;n.ld=src.ld;
   for(const p of G.players.values()){if(!p.alive||!p.hq)continue;const d=Math.hypot(n.x-p.hq.x,n.y-p.hq.y);if(d<6000){notifyP(p,'Spore burst! A new nest formed to the '+compass(Math.atan2(n.y-p.hq.y,n.x-p.hq.x)),'danger',n.x,n.y)}}return}}
 const cand=alive.filter(n=>n.lvl<NEST_MAXLVL);if(cand.length){const n=pick(cand);n.lvl++;n.maxhp=nestHp(n.lvl);n.hp=n.maxhp}}
function mutPool(){const p=MUTS.filter(m=>!G.muts.includes(m.id));return p.length?p:MUTS}
function recomputeMods(){let m=baseMods();G.MODSK=[m];for(const id of G.muts){const n=Object.assign({},m);MUTS.find(x=>x.id===id).fx(n);G.MODSK.push(n);m=n}G.mods=m;for(const z of G.zombies)z.swim=!!z.d.swim||modsOf(z).swim}
function triggerMutation(){const pool=mutPool();
 let m=G.pendingMut?MUTS.find(x=>x.id===G.pendingMut):pick(pool);G.pendingMut=null;if(!m)m=pick(pool);
 G.muts.push(m.id);recomputeMods();bannerAll('THE VIRUS HAS MUTATED',m.name+': '+m.desc,'bad','mutate');sysChat('Mutation: '+m.name+' — '+m.desc);G.nextMutDay=G.day+(G.wm&&G.wm.mut?rndi(G.wm.mut[0],G.wm.mut[1]):rndi(3,6));G.pendingMut=pick(mutPool()).id}
function onNewDay(){G.day=Math.floor(G.t/DAY_LEN)+1;const isBoss=G.day%5===0;bannerAll('DAY '+G.day,isBoss?'A TYRANT approaches...':'The outbreak grows stronger.',isBoss?'bad':'');
 for(const n of G.nests){if(!n.dead&&G.day>=n.nextLvl&&n.lvl<NEST_MAXLVL){n.lvl++;n.nextLvl=G.day+rndi(3,5);n.maxhp=nestHp(n.lvl)}}
 if(G.day%4===0)G.zcap=Math.min(CFG.zcapMax||2400,G.zcap+60);
 if(isBoss){const al=G.nests.filter(n=>!n.dead&&n.act).sort((a,b)=>b.lvl-a.lvl);const cnt=Math.min(3,1+Math.floor(G.day/20));for(let k=0;k<Math.min(cnt,al.length);k++){const n=al[k];const z=spawnZombie('tyrant',n.x,n.y,n,'assault');if(z){z.elite=false;z.nest=0;for(const p of G.players.values()){if(p.alive&&p.hq&&Math.hypot(n.x-p.hq.x,n.y-p.hq.y)<6000)notifyP(p,'A TYRANT has risen from the '+compass(Math.atan2(n.y-p.hq.y,n.x-p.hq.x))+' nest!','danger',n.x,n.y)}}}}
 if(G.day>=G.nextMutDay)triggerMutation();
 if(G.day===2)G.pendingMut=pick(mutPool()).id}


/* ---- doctrines ---- */
function pickPerks(p,n){const pool=PERKS.filter(x=>!p.perks.includes(x.id));const out=[];while(out.length<n&&pool.length)out.push(pool.splice((Math.random()*pool.length)|0,1)[0].id);return out}
function choosePerk(p,id){if(!p.alive||!p.offer||!p.offer.includes(id))return'No such doctrine offered';const pk=PERK_BY[id];p.perks.push(id);p.offer=null;p.fx=computeFx(p.perks);
 if(pk.once)for(const k in pk.once)p.res[k]+=pk.once[k];
 for(const u of G.units){if(u.o!==p.id)continue;const nm=uMaxHpP(p,u.type);u.hp=u.hp/u.maxhp*nm;u.maxhp=nm}
 for(const b of G.buildings){if(b.o!==p.id||b.dead)continue;const nm=bMaxHpP(p,b.type);b.hp=b.hp/b.maxhp*nm;b.maxhp=nm}
 recalcEcon(p);notifyP(p,'Doctrine adopted: '+pk.name,'good');return null}

/* ---- missions ---- */
function newMission(p){const a=Math.floor(p.ageDay||1);const r5=x=>Math.max(5,Math.round(x/5)*5);const opts=[];
 const k=r5(20+a*7);opts.push({stat:'kills',goal:k,text:'Kill '+k+' zombies',rew:{c:k*13,m:k*3}});
 const bl=3+Math.floor(a/4);opts.push({stat:'built',goal:bl,text:'Construct '+bl+' buildings',rew:{c:260+a*30,m:140}});
 const tr=5+Math.floor(a*.8);opts.push({stat:'trained',goal:tr,text:'Train '+tr+' units',rew:{c:300+a*25,f:40}});
 opts.push({stat:'age',goal:Math.floor(a)+3,text:'Survive until day '+(Math.floor(a)+3),rew:{c:420+a*30,m:160,f:50}});
 if(a>=6)opts.push({stat:'elites',goal:3,text:'Kill 3 elite zombies',rew:{c:800,m:320,f:90}});
 if(G.crates.length)opts.push({stat:'crates',goal:1,text:'Claim a supply drop',rew:{c:600,m:260,f:70}});
 const m=pick(opts.filter(o=>!p.mission||o.stat!==p.mission.stat).concat(opts));m.base=m.stat==='age'?0:(p.stats[m.stat]||0);p.mission=m;return m}
function missionProg(p,m){return m.stat==='age'?Math.floor(p.ageDay||1):Math.max(0,(p.stats[m.stat]||0)-m.base)}
function updateMissions(){for(const p of G.players.values()){if(!p.alive)continue;if(!p.mission)newMission(p);const m=p.mission;if(missionProg(p,m)>=m.goal){for(const k in m.rew)p.res[k]+=m.rew[k];p.stats.missions=(p.stats.missions||0)+1;notifyP(p,'Mission complete: '+m.text+' — reward '+Object.keys(m.rew).map(k=>'+'+m.rew[k]+' '+({c:'credits',m:'materials',f:'fuel'})[k]).join(', '),'good');p.mission=null;newMission(p)}}}

/* ---- random world events ---- */
function alivePs(){return [...G.players.values()].filter(p=>p.alive&&p.hq)}
function landPointNear(x,y,rmin,rmax){for(let k=0;k<30;k++){const a=Math.random()*TAU,r=rnd(rmin,rmax);const px=clamp(x+Math.cos(a)*r,64,WW-64),py=clamp(y+Math.sin(a)*r,64,WH-64);const i=((py/TILE)|0)*MW+((px/TILE)|0);if(T[i]===1&&!depGrid[i]&&!occ[i]){let near=false;for(const n of G.nests)if(Math.hypot(n.x-px,n.y-py)<NEST_BUF*TILE+60){near=true;break}if(!near)return{x:px,y:py}}}return null}
const EVENTS=[
 {id:'bloodmoon',w:2,min:3,run(){G.bmUntil=G.t+DAY_LEN*.4;bannerAll('BLOOD MOON','The dead are restless. Expect far more zombies for a while.','bad','mutate');sysChat('A Blood Moon rises: zombie activity surges.')}},
 {id:'drop',w:3,run(){const ps=alivePs();if(!ps.length)return;const p=pick(ps);const q=landPointNear(p.hq.x,p.hq.y,700,1500);if(!q)return;const s=1+G.day*.06;const rew=pick([{c:Math.round(700*s),m:Math.round(220*s)},{m:Math.round(520*s),f:Math.round(60*s)},{f:Math.round(180*s),c:Math.round(240*s)},{unit:'tank',n:2},{unit:'rifleman',n:6}]);
   const c={id:G.nid++,x:q.x,y:q.y,rew,exp:G.t+DAY_LEN*.7};G.crates.push(c);ev('cr',c.x,c.y,c.id);bannerAll('SUPPLY DROP','A crate landed '+compass(Math.atan2(c.y-p.hq.y,c.x-p.hq.x))+' of '+p.name+'. First unit to reach it claims it!','good','mutate');sysChat('Supply drop spotted — first to reach it wins.')}},
 {id:'horde',w:3,min:4,run(){const ps=alivePs();if(!ps.length)return;const p=pick(ps);const ld=strengthDay(p.ageDay||1);const n=Math.min(110,6+G.day*3);const types=['walker','walker','walker','runner','runner','brute','spitter'].filter(t=>Z[t]);let c=0;const ang0=Math.random()*TAU;
   for(let i=0;i<n;i++){const a=ang0+rnd(-.7,.7);const q=landPointNear(p.hq.x+Math.cos(a)*1500,p.hq.y+Math.sin(a)*1500,0,350);if(!q)continue;const z=spawnZombie(pick(types),q.x,q.y,null,'assault',ld);if(z){z.nest=0;c++}}
   if(c)bannerAll('HORDE MIGRATION','A massive horde is converging on '+p.name+' from the '+compass(ang0)+'!','bad','mutate')}},
 {id:'refugees',w:2,run(){const ps=alivePs();if(!ps.length)return;const p=pick(ps);for(let i=0;i<4;i++)addUnit(p,i<3?'rifleman':'engineer',p.hq.x+rnd(-60,60),p.hq.y+80+rnd(0,30));notifyP(p,'Refugees arrived at your base and joined you!','good',p.hq.x,p.hq.y);sysChat('Refugees have joined '+p.name+'.')}},
 {id:'meteor',w:3,run(){const ps=alivePs();if(!ps.length)return;const p=pick(ps);const q=landPointNear(p.hq.x,p.hq.y,1300,2800);if(!q)return;const tx0=(q.x/TILE)|0,ty0=(q.y/TILE)|0;let spot=null;
   for(let r=0;r<8&&!spot;r++)for(let dy=-r;dy<=r&&!spot;dy++)for(let dx=-r;dx<=r&&!spot;dx++){const tx=tx0+dx,ty=ty0+dy;let ok=inMap(tx,ty)&&inMap(tx+1,ty+1);for(let a=0;a<2&&ok;a++)for(let b=0;b<2&&ok;b++){const i=(ty+b)*MW+tx+a;if(T[i]!==1||depGrid[i]||occ[i])ok=false}if(ok)spot={tx,ty}}
   if(!spot)return;ev('bd',q.x,q.y,60,3);const d=WORLD.addDep('ore',spot.tx,spot.ty,false);ev('dep',0,0,d.id,d.type,d.tx,d.ty,0);let z=0;for(let i=0;i<7;i++){const zz=spawnZombie(pick(['walker','runner','spitter'].filter(t=>Z[t])),q.x+rnd(-70,70),q.y+rnd(-70,70),null,'assault',strengthDay(p.ageDay||1));if(zz){zz.nest=0;z++}}
   bannerAll('METEOR IMPACT','Something fell '+compass(Math.atan2(q.y-p.hq.y,q.x-p.hq.x))+' of '+p.name+': a new ore deposit — and infected survivors.','good','mutate')}}
];
function updateEvents(){if(G.t<G.nextEvT||G.day<2)return;const ps=alivePs();if(!ps.length)return;const pool=EVENTS.filter(e=>e.id!==G.lastEv&&(e.min||0)<=G.day);let tot=0;for(const e of pool)tot+=e.w;let r=Math.random()*tot,ch=pool[0];for(const e of pool){r-=e.w;if(r<=0){ch=e;break}}
 G.lastEv=ch.id;try{ch.run()}catch(e){console.error('event',ch.id,e)}G.nextEvT=G.t+rnd(DAY_LEN*1.0,DAY_LEN*2.4)/((G.wm&&G.wm.events)||1)}
function updateCrates(dt){if(!G.crates.length)return;if(G.frame%10)return;for(const c of G.crates){if(c.dead)continue;if(G.t>c.exp){c.dead=true;ev('cx',c.x,c.y,c.id);continue}
  let who=null;hP.each(c.x,c.y,46,e=>{if(!who&&e.k==='u'&&!e.dead&&Math.hypot(e.x-c.x,e.y-c.y)<46)who=e});
  if(who){const p=PL(who.o);if(!p)continue;c.dead=true;ev('cx',c.x,c.y,c.id);p.stats.crates++;const r=c.rew;if(r.unit){for(let i=0;i<r.n;i++)addUnit(p,r.unit,c.x+rnd(-40,40),c.y+rnd(-40,40))}else for(const k in r)p.res[k]+=r[k];
   notifyP(p,'You claimed the supply drop!','good',c.x,c.y);sysChat(p.name+' claimed the supply drop.')}}
 G.crates=G.crates.filter(c=>!c.dead)}

/* ---- research ---- */
function techState(p,id){if(p.done.has(id))return'done';if(p.cur&&p.cur.id===id)return'active';const t=TECH_BY[id];if(!t.req.every(r=>p.done.has(r)))return'locked';return'ready'}
function startResearch(p,id){const t=TECH_BY[id];if(!t||t.cure)return'Unavailable';if(p.cur)return'Already researching';if(p.labs<1)return'Build a Research Lab first';if(techState(p,id)!=='ready')return'Unavailable';if(!affordP(p,t.cost))return'Not enough resources';spendP(p,t.cost);p.cur={id,prog:0,total:t.time};return null}
function cancelResearch(p){if(!p.cur)return;refundP(p,TECH_BY[p.cur.id].cost,.6);p.cur=null}
function finishResearch(p,id){p.done.add(id);p.cur=null;const t=TECH_BY[id];notifyP(p,'Research complete: '+t.name,'good');toP(p,{t:'s',n:'done'});
 if(['kevlar','composite'].includes(id)){for(const u of G.units){if(u.o!==p.id)continue;const nm=uMaxHpP(p,u.type);u.hp=u.hp/u.maxhp*nm;u.maxhp=nm}}
 if(id==='fortify'){for(const b of G.buildings){if(b.o!==p.id)continue;const nm=bMaxHpP(p,b.type);b.hp=b.hp/b.maxhp*nm;b.maxhp=nm}}
 if(id==='counter'&&G.muts.length){G.muts.shift();recomputeMods();bannerAll('COUNTER-AGENT DEPLOYED',p.name+' purged the oldest mutation.','good')}
 recalcEcon(p)}

/* ---- main step ---- */
function stepSim(dt){G.frame++;G.t+=dt;if(Math.floor(G.t/DAY_LEN)+1>G.day)onNewDay();
 for(const p of G.players.values()){if(!p.alive)continue;for(const k in p.rate)p.res[k]+=p.rate[k]*dt;if(p.cur&&p.labs>0){p.cur.prog+=dt*(1+.6*Math.max(0,p.labs-1))*fxOf(p).res;if(p.cur.prog>=p.cur.total)finishResearch(p,p.cur.id)}}
 if(G.t-G.presT>1){G.presT=G.t;buildPresence()}
 if(G.t-G.actT>1){G.actT=G.t;updateActive();updateMissions();updateEvents()}
 updateCrates(dt);for(const u of G.units){if(u.dead||u.hp>=u.maxhp)continue;const pp=PL(u.o);if(pp&&pp.fx&&pp.fx.regen)u.hp=Math.min(u.maxhp,u.hp+pp.fx.regen*dt)}
 hZ.clear();hP.clear();for(const z of G.zombies)if(!z.dead&&awake(z))hZ.add(z);for(const u of G.units)if(!u.dead)hP.add(u);for(const b of G.buildings)if(!b.dead)hP.add(b);
 if(G.fieldDirty&&G.t-G.fieldT>5){G.fieldDirty=false;G.fieldT=G.t;const src=[];for(const b of G.buildings){if(b.dead)continue;for(let y=0;y<b.s;y++)for(let x=0;x<b.s;x++)src.push((b.ty+y)*MW+b.tx+x)}computeField(G.fieldL,passL,src,CFG.field);computeField(G.fieldA,passA,src,CFG.field)}
 G.growT-=dt;if(G.growT<=0){G.growT=DAY_LEN*1.1;growOutbreak()}
 updateNests(dt);
 for(const b of G.buildings)if(!b.dead)updateBuilding(b,dt);
 for(const u of G.units)if(!u.dead)updateUnit(u,dt);
 for(const z of G.zombies)if(!z.dead&&awake(z))updateZombie(z,dt);
 updateProj(dt);
 // despawn orphaned zombies nobody is near (every 2s)
 if((G.frame&31)===0)for(const z of G.zombies){if(z.dead||z.nest||z.mode!=='idle')continue;if(G.pres[((z.y/256)|0)*G.PW+((z.x/256)|0)]!==1)z.dead=true}
 for(const n of G.nests){if(n.disc)continue;hP.each(n.x,n.y,420,()=>{n.disc=true})}
 // compact
 let zd=false;for(const z of G.zombies)if(z.dead){zd=true;G.ent.delete(z.id)}if(zd)G.zombies=G.zombies.filter(z=>!z.dead);
 let ud=false;for(const u of G.units)if(u.dead){ud=true;G.ent.delete(u.id)}if(ud)G.units=G.units.filter(u=>!u.dead);
 if(G.buildings.some(b=>b.dead))G.buildings=G.buildings.filter(b=>!b.dead);
 const pop={};for(const u of G.units)pop[u.o]=(pop[u.o]||0)+u.d.pop;for(const b of G.buildings)for(const q of b.queue)pop[b.o]=(pop[b.o]||0)+U[q.type].pop;for(const p of G.players.values())p.pop=pop[p.id]||0;
 // drop long-offline players
 if((G.frame&63)===0)for(const p of[...G.players.values()]){if(!p.online&&G.t-p.offT>1500){eliminate(p,'Abandoned',true);for(const q of G.players.values()){q.allies.delete(p.id);q.reqIn.delete(p.id);q.reqOut.delete(p.id)}G.players.delete(p.id)}}
}
