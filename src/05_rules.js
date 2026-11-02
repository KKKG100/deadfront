/* ---------------- SHARED RULES (server + client) ---------------- */
// A "player" here is any object with: id, res{c,m,f}, done:Set, allies:Set
const PL=o=>G&&G.players?G.players.get(o):null;
const isFriend=(a,b)=>{if(a===b)return true;const p=PL(a);return !!(p&&p.allies&&p.allies.has(b))};
/* ---- Doctrines (roguelike perks) ---- */
const PERKS=[
 {id:'industry',name:'Industrialist',icon:'🏭',desc:'+30% credit and material income.',fx:f=>{f.icr*=1.3;f.imt*=1.3}},
 {id:'oilbaron',name:'Oil Baron',icon:'🛢️',desc:'+70% fuel income.',fx:f=>{f.ifl*=1.7}},
 {id:'blitz',name:'Blitz Builders',icon:'🏗️',desc:'Construct buildings 45% faster.',fx:f=>{f.build*=1.45}},
 {id:'mass',name:'Mass Production',icon:'⚙️',desc:'Train units 35% faster.',fx:f=>{f.train*=1.35}},
 {id:'fortress',name:'Fortress Doctrine',icon:'🏰',desc:'Walls +60% health, towers +30% health.',fx:f=>{f.wallhp*=1.6;f.towerhp*=1.3}},
 {id:'scavenger',name:'Scavengers',icon:'💰',desc:'+60% kill bounties and every kill yields 1 material.',fx:f=>{f.bounty*=1.6;f.killm+=1}},
 {id:'shock',name:'Shock Troops',icon:'🪖',desc:'Infantry cost 30% less.',fx:f=>{f.infc*=.7}},
 {id:'armored',name:'Armored Fist',icon:'🛡️',desc:'Vehicles cost 25% less and have +20% health.',fx:f=>{f.vehc*=.75;f.vehhp*=1.2}},
 {id:'skylords',name:'Sky Lords',icon:'✈️',desc:'Aircraft cost 25% less and have +20% health.',fx:f=>{f.airc*=.75;f.airhp*=1.2}},
 {id:'seawolf',name:'Sea Wolves',icon:'⚓',desc:'Ships cost 25% less and have +25% health.',fx:f=>{f.navc*=.75;f.navhp*=1.25}},
 {id:'medcorps',name:'Field Surgeons',icon:'⚕️',desc:'All your units slowly regenerate health.',fx:f=>{f.regen+=1.2}},
 {id:'scholar',name:'Research Prodigies',icon:'🔬',desc:'Research 50% faster.',fx:f=>{f.res*=1.5}},
 {id:'glass',name:'Glass Cannon',icon:'💥',desc:'+30% damage dealt, but +15% damage taken.',fx:f=>{f.dmg*=1.3;f.taken*=1.15}},
 {id:'babyboom',name:'Baby Boom',icon:'🏘️',desc:'Houses give +4 population.',fx:f=>{f.house+=4}},
 {id:'ironwill',name:'Iron Will',icon:'🧱',desc:'Your units take 20% less damage.',fx:f=>{f.taken*=.8}},
 {id:'bank',name:'War Chest',icon:'💎',desc:'Instantly gain 600 credits, 250 materials and 60 fuel.',fx:f=>{},once:{c:600,m:250,f:60}}
];
const PERK_BY={};PERKS.forEach(p=>PERK_BY[p.id]=p);
function computeFx(ids){const f={icr:1,imt:1,ifl:1,build:1,train:1,wallhp:1,towerhp:1,bounty:1,killm:0,infc:1,vehc:1,airc:1,navc:1,vehhp:1,airhp:1,navhp:1,regen:0,res:1,dmg:1,taken:1,house:0};for(const id of ids){const p=PERK_BY[id];if(p)p.fx(f)}return f}
function fxOf(p){return p.fx||(p.fx=computeFx([]))}
function ucostP(p,t){const d=U[t],c=d.cost,f=fxOf(p),k=(p.done.has('logistics')?.85:1)*(d.cls==='inf'?f.infc:d.cls==='veh'?f.vehc:d.cls==='air'?f.airc:d.cls==='nav'?f.navc:1),o={};for(const a in c)o[a]=Math.ceil(c[a]*k);return o}
function affordP(p,c){for(const k in c)if(p.res[k]<c[k]-1e-6)return false;return true}
function spendP(p,c){for(const k in c)p.res[k]-=c[k]}
function refundP(p,c,f){for(const k in c)p.res[k]+=c[k]*(f||1)}
function uMaxHpP(p,t){const d=U[t],f=fxOf(p);let h=d.hp*(d.cls==='veh'?f.vehhp:d.cls==='air'?f.airhp:d.cls==='nav'?f.navhp:1);if(d.cls==='inf'&&p.done.has('kevlar'))h*=1.25;if(d.cls==='veh'&&p.done.has('composite'))h*=1.2;return h}
function uArmorP(p,u){const d=u.d;let a=d.armor||0;if(d.cls==='inf'&&p.done.has('kevlar'))a+=1;if(d.cls==='veh'&&p.done.has('composite'))a+=1;return a}
function bMaxHpP(p,t){const d=B[t],f=fxOf(p);let h=d.hp*(d.wall?f.wallhp:d.weapon?f.towerhp:1);if(p.done.has('fortify')){h*=d.wall?1.5:d.weapon?1.25:1}return h}
function unitAvailP(p,t){const d=U[t];return !d.tech||p.done.has(d.tech)}
const SUPPLY_R=16, NEST_BUF=8;
function canPlaceP(p,type,tx,ty){const d=B[type],s=d.size;
 if(d.tech&&!p.done.has(d.tech))return'Requires research';
 for(let y=0;y<s;y++)for(let x=0;x<s;x++){const X=tx+x,Y=ty+y;if(!inMap(X,Y))return'Out of bounds';const i=Y*MW+X;if(occ[i])return'Tile occupied';const t=T[i];
  if(d.dep){const dp=depGrid[i];if(!dp)return'Needs a '+(d.dep==='ore'?'ore':'oil')+' deposit';const dep=WORLD.deposits[dp-1];if(dep.type!==d.dep)return'Wrong deposit type';if(dep.used)return'Deposit in use';if(dep.tx!==tx||dep.ty!==ty)return'Align with deposit'}
  else{if(depGrid[i])return'Resource deposit';if(t!==1)return t===0?'Cannot build on water':t===2?'Mountain':'Dense forest'}}
 const cx=(tx+s/2)*TILE,cy=(ty+s/2)*TILE;
 for(const n of G.nests)if(Math.abs(n.x-cx)<NEST_BUF*TILE+40&&Math.abs(n.y-cy)<NEST_BUF*TILE+40&&Math.hypot(n.x-cx,n.y-cy)<NEST_BUF*TILE)return'Too close to a nest';
 let sup=false;for(const b of G.buildings){if(!b.done||b.dead)continue;if(Math.abs(b.x-cx)>SUPPLY_R*TILE||Math.abs(b.y-cy)>SUPPLY_R*TILE)continue;if(!isFriend(p.id,b.o))continue;if(Math.hypot(b.x-cx,b.y-cy)<=SUPPLY_R*TILE){sup=true;break}}if(!sup)return'Outside supply range';
 if(d.coastal){let ok=false;for(let y=-1;y<=s;y++)for(let x=-1;x<=s;x++){if(x>=0&&x<s&&y>=0&&y<s)continue;const X=tx+x,Y=ty+y;if(inMap(X,Y)&&T[Y*MW+X]===0&&!occ[Y*MW+X])ok=true}if(!ok)return'Must be on the coast'}
 return null}
const compass=(a)=>['E','SE','S','SW','W','NW','N','NE'][Math.round(((a%TAU+TAU)%TAU)/(TAU/8))%8];
function nightAmt(h){if(h>=20||h<5)return 1;if(h>=18)return(h-18)/2;if(h<7)return(7-h)/2;return 0}
function gameHour(){return(6+(G.t%DAY_LEN)/DAY_LEN*24)%24}
function rectDist(b,x,y){const dx=Math.max(b.x-b.w/2-x,0,x-(b.x+b.w/2)),dy=Math.max(b.y-b.h/2-y,0,y-(b.y+b.h/2));return Math.hypot(dx,dy)}
const nestHp=l=>700+450*l;
