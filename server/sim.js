'use strict';

const TILE=32, DAY_LEN=90, TAU=Math.PI*2;
let MW=560, MH=400, WW=MW*TILE, WH=MH*TILE;
let G=null;
class SHash{constructor(){this.cs=64;this.cols=Math.ceil(WW/64);this.rows=Math.ceil(WH/64);this.c=[];for(let i=0;i<this.cols*this.rows;i++)this.c.push([])}
 clear(){for(const a of this.c)if(a.length)a.length=0}
 add(e){const cx=clamp((e.x/64)|0,0,this.cols-1),cy=clamp((e.y/64)|0,0,this.rows-1);this.c[cy*this.cols+cx].push(e)}
 each(x,y,r,fn){const x0=clamp(((x-r)/64)|0,0,this.cols-1),x1=clamp(((x+r)/64)|0,0,this.cols-1),y0=clamp(((y-r)/64)|0,0,this.rows-1),y1=clamp(((y+r)/64)|0,0,this.rows-1);for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++){const a=this.c[cy*this.cols+cx];for(let i=0;i<a.length;i++){const e=a[i];if(!e.dead)fn(e)}}}
 rect(xa,ya,xb,yb,fn){const x0=clamp((xa/64)|0,0,this.cols-1),x1=clamp((xb/64)|0,0,this.cols-1),y0=clamp((ya/64)|0,0,this.rows-1),y1=clamp((yb/64)|0,0,this.rows-1);for(let cy=y0;cy<=y1;cy++)for(let cx=x0;cx<=x1;cx++){const a=this.c[cy*this.cols+cx];for(let i=0;i<a.length;i++){const e=a[i];if(!e.dead&&e.x>=xa&&e.x<=xb&&e.y>=ya&&e.y<=yb)fn(e)}}}
}
const PCOLORS=['#ff5a4a','#4aa8ff','#5be37d','#ffd24a','#c06bff','#ff8a2a','#2fe0d0','#ff6fb5','#a6e22e','#9aa8ff','#e8e8e8','#c98a4a'];
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const rnd=(a,b)=>b===undefined?Math.random()*a:a+Math.random()*(b-a);
const rndi=(a,b)=>Math.floor(rnd(a,b+1));
const pick=a=>a[Math.floor(Math.random()*a.length)];
const dist=(x1,y1,x2,y2)=>Math.hypot(x2-x1,y2-y1);
const angDiff=(a,b)=>{let d=(b-a)%TAU;if(d>Math.PI)d-=TAU;if(d<-Math.PI)d+=TAU;return d;};
const turnTo=(a,b,r)=>{const d=angDiff(a,b);return Math.abs(d)<=r?b:a+Math.sign(d)*r;};
const fmt=n=>Math.floor(n).toLocaleString('en-US');
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hash2(x,y,s){let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(s|0,1442695041);h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return(h>>>0)/4294967295}
function vn(x,y,s){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);const a=hash2(xi,yi,s),b=hash2(xi+1,yi,s),c=hash2(xi,yi+1,s),d=hash2(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
function fbm(x,y,s,o){let a=.5,f=1,t=0,n=0;for(let i=0;i<o;i++){t+=a*vn(x*f,y*f,s+i*17);n+=a;a*=.5;f*=2.03}return t/n}
class Heap{constructor(){this.k=[];this.v=[]}get size(){return this.k.length}
push(key,val){const k=this.k,v=this.v;let i=k.length;k.push(key);v.push(val);while(i>0){const p=(i-1)>>1;if(k[p]<=key)break;k[i]=k[p];v[i]=v[p];i=p}k[i]=key;v[i]=val}
pop(){const k=this.k,v=this.v;const rv=v[0];const lk=k.pop(),lv=v.pop();const n=k.length;if(n>0){let i=0;for(;;){let c=2*i+1;if(c>=n)break;if(c+1<n&&k[c+1]<k[c])c++;if(k[c]>=lk)break;k[i]=k[c];v[i]=v[c];i=c}k[i]=lk;v[i]=lv}return rv}
clear(){this.k.length=0;this.v.length=0}}

/* ---------------- DATA ---------------- */
const RES={c:'Credits',m:'Materials',f:'Fuel'};
const B={
 hq:{name:'Command Center',size:3,hp:2600,cost:{},time:0,pop:12,inc:{c:3.5,m:.6},cat:null,light:210,desc:'Your headquarters. If it falls, the operation is lost. Trains engineers and riflemen.',train:['engineer','rifleman']},
 house:{name:'Housing Block',size:1,hp:170,cost:{c:45,m:5},time:4,pop:5,inc:{c:1},cat:'eco',desc:'Shelters civilians: +5 population cap and a small tax income.'},
 market:{name:'Trade Depot',size:2,hp:340,cost:{c:110,m:25},time:7,inc:{c:5},cat:'eco',desc:'Survivor trade hub. Steady credit income.'},
 mine:{name:'Ore Mine',size:2,hp:360,cost:{c:90,m:10},time:6,inc:{m:3.6},cat:'eco',dep:'ore',desc:'Extracts materials. Must be built on an ore deposit.'},
 derrick:{name:'Oil Derrick',size:2,hp:320,cost:{c:110,m:40},time:8,inc:{f:2.2},cat:'eco',dep:'oil',desc:'Pumps fuel. Build on oil deposits, on land or offshore.'},
 barracks:{name:'Barracks',size:2,hp:650,cost:{c:200,m:60},time:12,cat:'mil',light:90,train:['rifleman','grenadier','minigunner','flamer','sniper','exotrooper','medic','engineer'],desc:'Trains infantry, medics and engineers.'},
 factory:{name:'Motor Pool',size:3,hp:950,cost:{c:350,m:180},time:18,cat:'mil',light:100,train:['jeep','apc','tank','inferno','rocketer','artillery','heavytank'],desc:'Builds buggies, carriers, tanks, rocket and heavy armor.'},
 airfield:{name:'Airfield',size:3,hp:820,cost:{c:450,m:250,f:50},time:22,cat:'mil',tech:'aviation',light:120,train:['drone','gunship','fighter','ace','hellfire','bomber','heavybomber'],desc:'Launches drones, gunships, fighters and bombers.'},
 harbor:{name:'Naval Harbor',size:2,hp:720,cost:{c:300,m:150},time:16,cat:'mil',tech:'maritime',coastal:true,light:90,train:['patrol','destroyer','cruiser','battleship','dread'],desc:'Builds warships. Must touch open water.'},
 wall:{name:'Steel Barricade',size:1,hp:340,cost:{c:8,m:12},time:2,cat:'def',wall:true,desc:'Cheap barrier. Zombies must chew through it. Drag to place a line.'},
 sandbag:{name:'Sandbag Wall',size:1,hp:170,cost:{c:3,m:5},time:1,cat:'def',wall:true,style:'sand',desc:'Very cheap, low health. A fast first line of defense.'},
 concrete:{name:'Concrete Barrier',size:1,hp:820,cost:{c:10,m:32},time:3,cat:'def',wall:true,style:'conc',tech:'fortify',desc:'Heavy poured barrier. Takes a long time to chew through.'},
 spikes:{name:'Spike Barricade',size:1,hp:400,cost:{c:14,m:24},time:3,cat:'def',wall:true,style:'spike',tech:'barbs',thorns:14,desc:'Zombies that attack it are impaled for damage on every hit.'},
 plasteel:{name:'Plasteel Wall',size:1,hp:1900,cost:{c:20,m:60,f:5},time:5,cat:'def',wall:true,style:'plas',tech:'plasteel',desc:'Advanced alloy wall. Extremely durable.'},
 shockfence:{name:'Shock Fence',size:1,hp:460,cost:{c:30,m:36,f:6},time:4,cat:'def',wall:true,style:'shock',tech:'fences',thorns:34,desc:'Electrified barrier. Shocks anything that attacks it.'},
 mgtower:{name:'Gun Nest',size:1,hp:250,cost:{c:90,m:30},time:5,cat:'def',light:110,weapon:{w:'bullet',dmg:7,cd:.2,range:215,aa:true},desc:'Machine gun emplacement. Hits ground and air.'},
 flametower:{name:'Flame Tower',size:1,hp:270,cost:{c:140,m:40,f:10},time:6,cat:'def',tech:'incendiary',light:120,weapon:{w:'flame',dmg:6,cd:.1,range:112},desc:'Short range fire cone that melts hordes.'},
 snipertower:{name:'Marksman Post',size:1,hp:230,cost:{c:180,m:60},time:7,cat:'def',tech:'marksman',light:100,weapon:{w:'bullet',dmg:62,cd:2,range:390,aa:true},desc:'Long range, high damage single shots.'},
 tesla:{name:'Tesla Coil',size:2,hp:420,cost:{c:350,m:200,f:20},time:12,cat:'def',tech:'electrics',light:160,weapon:{w:'tesla',dmg:30,cd:1.1,range:175,aa:true,chain:5},desc:'Chain lightning arcs through packs of zombies.'},
 aasite:{name:'Flak Battery',size:2,hp:380,cost:{c:280,m:120},time:10,cat:'def',tech:'antiair',light:90,weapon:{w:'flak',dmg:26,cd:.65,range:340,aaOnly:true,splash:46},desc:'Shreds flying mutants. Cannot hit ground targets.'},
 arty:{name:'Artillery Battery',size:2,hp:480,cost:{c:400,m:250,f:40},time:14,cat:'def',tech:'ordnance',light:90,weapon:{w:'shell',dmg:80,cd:3.4,range:600,minRange:110,splash:90},desc:'Huge range explosive shells. Ground targets only.'},
 lab:{name:'Research Lab',size:2,hp:520,cost:{c:250,m:100},time:14,cat:'sup',light:110,desc:'Unlocks research. Extra labs speed up research.'},
 hospital:{name:'Field Hospital',size:2,hp:470,cost:{c:220,m:80},time:12,cat:'sup',light:100,heal:{r:175,hps:9},desc:'Heals nearby friendly units over time.'},
 radar:{name:'Radar Station',size:2,hp:400,cost:{c:200,m:100,f:20},time:12,cat:'sup',light:80,desc:'Reveals all zombies and nests on the minimap.'}
};
const U={
 rifleman:{name:'Rifleman',dom:'land',cost:{c:50},pop:1,time:5,hp:70,speed:64,r:6,range:160,dmg:8,cd:.55,w:'bullet',aa:true,cls:'inf',desc:'Cheap, reliable infantry. Can shoot flyers.'},
 flamer:{name:'Flame Trooper',dom:'land',cost:{c:85,f:10},pop:1,time:7,hp:95,speed:56,r:6,range:84,dmg:6,cd:.1,w:'flame',tech:'incendiary',cls:'inf',desc:'Burns whole packs at short range.'},
 sniper:{name:'Marksman',dom:'land',cost:{c:110,m:20},pop:1,time:8,hp:50,speed:58,r:6,range:350,dmg:62,cd:2.1,w:'bullet',aa:true,tech:'marksman',cls:'inf',desc:'Long range, kills specials fast.'},
 medic:{name:'Medic',dom:'land',cost:{c:70},pop:1,time:6,hp:55,speed:66,r:6,heal:14,healR:100,cls:'inf',desc:'Heals nearby infantry and vehicles.'},
 engineer:{name:'Engineer',dom:'land',cost:{c:60},pop:1,time:6,hp:60,speed:60,r:6,repair:30,cls:'inf',desc:'Repairs damaged structures automatically.'},
 jeep:{name:'Scout Buggy',dom:'land',cost:{c:130,m:30,f:10},pop:2,time:8,hp:155,speed:155,r:11,range:185,dmg:6,cd:.14,w:'bullet',aa:true,cls:'veh',desc:'Fast mobile machine gun.'},
 tank:{name:'Main Battle Tank',dom:'land',cost:{c:260,m:150,f:35},pop:4,time:14,hp:480,armor:3,speed:74,r:14,range:245,dmg:48,cd:1.35,w:'shell',splash:50,tech:'armor1',cls:'veh',desc:'Armored, explosive cannon.'},
 artillery:{name:'Howitzer',dom:'land',cost:{c:230,m:170,f:45},pop:4,time:16,hp:180,speed:52,r:14,range:560,minRange:115,dmg:78,cd:3.1,w:'shell',splash:88,tech:'ordnance',cls:'veh',desc:'Long range area bombardment.'},
 drone:{name:'Recon Drone',dom:'air',cost:{c:60,f:15},pop:1,time:5,hp:55,speed:205,r:10,range:170,dmg:4,cd:.18,w:'bullet',aa:true,cls:'air',desc:'Cheap flying scout with a light gun.'},
 gunship:{name:'Gunship',dom:'air',cost:{c:310,m:120,f:55},pop:4,time:16,hp:330,armor:2,speed:135,r:18,range:220,dmg:7,cd:.12,w:'bullet',aa:true,rocket:{dmg:36,splash:58,cd:3.4},tech:'rotor',cls:'air',desc:'Rotary gunship with rockets.'},
 fighter:{name:'Strike Fighter',dom:'air',cost:{c:290,m:140,f:80},pop:3,time:14,hp:200,speed:275,r:15,range:275,dmg:15,cd:.28,w:'bullet',aa:true,tech:'jet',cls:'air',desc:'Very fast. Excellent against winged mutants.'},
 bomber:{name:'Bomber',dom:'air',cost:{c:400,m:220,f:110},pop:5,time:20,hp:290,armor:1,speed:205,r:22,dmg:95,splash:80,w:'bomb',tech:'strategic',cls:'air',bomber:true,desc:'Carpet bombing runs on hordes. Right-click to target.'},
 patrol:{name:'Patrol Boat',dom:'water',cost:{c:150,m:40,f:20},pop:2,time:10,hp:210,speed:118,r:14,range:200,dmg:7,cd:.15,w:'bullet',aa:true,cls:'nav',desc:'Fast coastal gunboat.'},
 destroyer:{name:'Destroyer',dom:'water',cost:{c:330,m:210,f:70},pop:4,time:16,hp:580,armor:2,speed:88,r:20,range:320,dmg:42,cd:1.25,w:'shell',splash:52,aa:true,tech:'gunnery',cls:'nav',desc:'Naval gun, dual purpose AA.'},
 battleship:{name:'Battleship',dom:'water',cost:{c:720,m:460,f:150},pop:8,time:30,hp:1550,armor:4,speed:62,r:26,range:650,minRange:140,dmg:125,cd:3.3,w:'shell',splash:108,tech:'capital',cls:'nav',desc:'Colossal shells devastate nests and hordes from the sea.'},
 grenadier:{name:'Grenadier',dom:'land',cost:{c:120,m:30},pop:1,time:8,hp:80,speed:58,r:6,range:200,dmg:34,cd:1.6,w:'shell',splash:48,tech:'grenades',cls:'inf',look:'rifleman',tint:'#d28a2a',desc:'Lobs grenades that hurt whole groups. Cannot hit air.'},
 minigunner:{name:'Minigunner',dom:'land',cost:{c:170,m:40,f:10},pop:2,time:9,hp:160,armor:1,speed:48,r:7,range:175,dmg:5,cd:.07,w:'bullet',aa:true,tech:'heavyweapons',cls:'inf',look:'rifleman',tint:'#3a3a40',sc:1.2,desc:'Huge rate of fire. Slow and tough.'},
 exotrooper:{name:'Exo-Trooper',dom:'land',cost:{c:260,m:110,f:30},pop:3,time:12,hp:340,armor:3,speed:64,r:8,range:205,dmg:16,cd:.28,w:'bullet',aa:true,tech:'exosuit',cls:'inf',look:'sniper',tint:'#58a0d8',sc:1.3,desc:'Powered armor infantry with a heavy rifle.'},
 apc:{name:'Armored Carrier',dom:'land',cost:{c:230,m:90,f:20},pop:3,time:11,hp:400,armor:2,speed:112,r:13,range:215,dmg:8,cd:.1,w:'bullet',aa:true,tech:'mechanized',cls:'veh',look:'jeep',tint:'#4a6a8a',sc:1.35,desc:'Fast armored vehicle with a heavy machine gun.'},
 inferno:{name:'Inferno Tank',dom:'land',cost:{c:340,m:190,f:70},pop:5,time:15,hp:580,armor:3,speed:70,r:14,range:108,dmg:7,cd:.1,w:'flame',tech:'inferno',cls:'veh',look:'tank',tint:'#d0601c',sc:1.05,desc:'Flame tank that scorches hordes at close range.'},
 rocketer:{name:'Rocket Launcher',dom:'land',cost:{c:280,m:160,f:45},pop:4,time:15,hp:170,speed:62,r:14,range:520,minRange:120,dmg:42,cd:1.1,splash:70,w:'shell',tech:'rocketry',cls:'veh',look:'artillery',tint:'#a04040',desc:'Rapid rocket barrages from far away.'},
 heavytank:{name:'Heavy Tank',dom:'land',cost:{c:520,m:340,f:90},pop:8,time:22,hp:1200,armor:6,speed:58,r:17,range:275,dmg:95,cd:1.6,splash:70,w:'shell',tech:'heavyarmor',cls:'veh',look:'tank',tint:'#3a4a6a',sc:1.3,desc:'Super-heavy armor with a huge cannon.'},
 ace:{name:'Air Superiority Fighter',dom:'air',cost:{c:420,m:220,f:120},pop:5,time:18,hp:330,armor:1,speed:330,r:16,range:300,dmg:24,cd:.2,w:'bullet',aa:true,tech:'airsup',cls:'air',look:'fighter',tint:'#4a7ac0',sc:1.1,desc:'Elite jet. Faster and deadlier than the Strike Fighter.'},
 hellfire:{name:'Hellfire Gunship',dom:'air',cost:{c:560,m:260,f:110},pop:7,time:22,hp:680,armor:4,speed:125,r:20,range:240,dmg:10,cd:.1,w:'bullet',aa:true,rocket:{dmg:70,splash:70,cd:2.6},tech:'hellfire',cls:'air',look:'gunship',tint:'#8a3a2a',sc:1.2,desc:'Armored gunship with heavy rocket pods.'},
 heavybomber:{name:'Heavy Bomber',dom:'air',cost:{c:720,m:420,f:220},pop:9,time:28,hp:650,armor:2,speed:190,r:26,dmg:170,splash:105,w:'bomb',bomber:true,tech:'heavybombing',cls:'air',look:'bomber',tint:'#2a3040',sc:1.2,desc:'Devastating carpet bombing. Right-click to target.'},
 cruiser:{name:'Missile Cruiser',dom:'water',cost:{c:520,m:330,f:110},pop:6,time:20,hp:1050,armor:3,speed:80,r:22,range:480,minRange:100,dmg:70,cd:1.5,splash:70,w:'shell',aa:true,tech:'cruiser',cls:'nav',look:'destroyer',tint:'#4a7a9a',sc:1.1,desc:'Long range guided missiles.'},
 dread:{name:'Dreadnought',dom:'water',cost:{c:1300,m:850,f:300},pop:14,time:40,hp:2900,armor:6,speed:54,r:30,range:780,minRange:160,dmg:230,cd:3.4,splash:130,w:'shell',tech:'dread',cls:'nav',look:'battleship',tint:'#3a3a52',sc:1.2,desc:'The ultimate warship. Obliterates anything in range.'}
};
const Z={
 walker:{name:'Walker',hp:45,speed:32,dmg:8,cd:1,reach:13,r:7,bounty:2,desc:'The standard infected. Slow but endless.'},
 runner:{name:'Runner',hp:30,speed:76,dmg:6,cd:.55,reach:12,r:6,bounty:3,desc:'Fast and fragile. Overwhelms thin lines.'},
 brute:{name:'Brute',hp:340,speed:27,dmg:34,cd:1.5,reach:21,r:12,armor:2,bounty:12,desc:'Armored mass of muscle. Smashes walls.'},
 spitter:{name:'Spitter',hp:55,speed:34,dmg:11,cd:2.3,range:170,r:7,bounty:5,desc:'Lobs acid from range. Double damage on buildings.'},
 bloater:{name:'Bloater',hp:150,speed:24,dmg:0,cd:1,reach:16,r:11,bounty:8,desc:'Bursts violently on death. Kill it far from your walls.'},
 screamer:{name:'Screamer',hp:80,speed:44,dmg:7,cd:1,reach:12,r:7,aura:175,bounty:10,desc:'Its shriek makes nearby zombies faster and angrier.'},
 gargoyle:{name:'Gargoyle',hp:95,speed:96,dmg:13,cd:.9,reach:14,r:8,fly:true,bounty:6,desc:'Winged mutant that flies over walls. Needs anti-air.'},
 drowned:{name:'Drowned',hp:90,speed:42,dmg:12,cd:1,reach:13,r:7,swim:true,bounty:5,desc:'Swims. Attacks harbors, derricks and ships.'},
 tyrant:{name:'Tyrant',hp:3600,speed:23,dmg:95,cd:2.1,reach:36,r:22,armor:5,bounty:250,boss:true,desc:'A walking siege engine. Appears every 10 days.'}
};
const NEST_MAXLVL=25;
const baseMods=()=>({hpMul:1,spdMul:1,dmgMul:1,armor:0,regen:0,acid:false,spores:false,swim:false,fireRes:1,ballRes:1,elite:0,spawnMul:1,aggro:1,cysts:false});
const MUTS=[
 {id:'hide',name:'Thickened Hide',icon:'🛡️',desc:'+25% health and +1 armor on every zombie.',fx:m=>{m.hpMul*=1.25;m.armor+=1}},
 {id:'meta',name:'Rapid Metabolism',icon:'⚡',desc:'+25% movement speed.',fx:m=>{m.spdMul*=1.25}},
 {id:'regen',name:'Cellular Regeneration',icon:'🧬',desc:'Zombies regenerate 3 HP per second when not recently hurt.',fx:m=>{m.regen+=3}},
 {id:'frenzy',name:'Necrotic Frenzy',icon:'🩸',desc:'+30% damage. Eyes glow red.',fx:m=>{m.dmgMul*=1.3}},
 {id:'acid',name:'Corrosive Blood',icon:'☣️',desc:'Dying zombies burst into acid, hurting nearby units.',fx:m=>{m.acid=true}},
 {id:'spores',name:'Airborne Spores',icon:'🦇',desc:'Winged Gargoyles now emerge from nests. Build anti-air.',fx:m=>{m.spores=true}},
 {id:'aqua',name:'Aquatic Adaptation',icon:'🌊',desc:'All zombies can now swim. Islands are no longer safe.',fx:m=>{m.swim=true}},
 {id:'fireres',name:'Pyro-Resistant Tissue',icon:'🔥',desc:'Take 60% less fire damage.',fx:m=>{m.fireRes=.4}},
 {id:'chitin',name:'Chitin Plating',icon:'🪲',desc:'Take 35% less damage from bullets.',fx:m=>{m.ballRes*=.65}},
 {id:'cysts',name:'Explosive Cysts',icon:'💥',desc:'More Bloaters, with larger blasts.',fx:m=>{m.cysts=true}},
 {id:'hyst',name:'Mass Hysteria',icon:'📈',desc:'Nests spawn zombies 35% faster.',fx:m=>{m.spawnMul*=1.35}},
 {id:'elite',name:'Alpha Strain',icon:'👁️',desc:'10% of zombies are Elites: 3x health, +50% damage.',fx:m=>{m.elite=.1}},
 {id:'sense',name:'Heightened Senses',icon:'👃',desc:'Zombies notice your units from twice as far.',fx:m=>{m.aggro=2}}
];
const WMODS=[
 {id:'swarm',name:'Swarm Outbreak',desc:'Many more zombies, but each one is weaker.',spawn:1.45,hp:.72,dmg:.9},
 {id:'titan',name:'Titan Outbreak',desc:'Fewer zombies, but they are tough and hit hard.',spawn:.6,hp:1.55,dmg:1.25},
 {id:'plague',name:'Fast Plague',desc:'The virus mutates every 2 to 3 days.',mut:[2,3]},
 {id:'boom',name:'Boom Times',desc:'Rich economy: +35% income and +30% starting resources.',inc:1.35,start:1.3},
 {id:'scarce',name:'Scarcity',desc:'Income -25%, but kill bounties are +50%.',inc:.75,bounty:1.5},
 {id:'blood',name:'Age of Blood',desc:'Random world events happen twice as often.',events:2},
 {id:'classic',name:'Classic Outbreak',desc:'The standard experience.'}
];
const BRANCH=['Infantry','Armor','Air','Naval','Defense','Economy','Medical'];
const TECHS=[
 {id:'marksman',b:0,name:'Marksmanship',icon:'🎯',desc:'Unlocks Marksman and Marksman Post.',cost:{c:150},time:25,req:[]},
 {id:'incendiary',b:0,name:'Incendiary Weaponry',icon:'🔥',desc:'Unlocks Flame Trooper and Flame Tower.',cost:{c:180},time:25,req:[]},
 {id:'kevlar',b:0,name:'Kevlar Vests',icon:'🦺',desc:'Infantry +25% health, +1 armor.',cost:{c:200,m:40},time:30,req:[]},
 {id:'fmj',b:0,name:'Hardened Ammunition',icon:'🔩',desc:'+20% bullet damage for units and towers.',cost:{c:260,m:80},time:35,req:['kevlar']},
 {id:'armor1',b:1,name:'Armored Doctrine',icon:'🛞',desc:'Unlocks Main Battle Tank.',cost:{c:250,m:50},time:30,req:[]},
 {id:'ordnance',b:1,name:'Heavy Ordnance',icon:'💣',desc:'Unlocks Howitzer and Artillery Battery.',cost:{c:300,m:100},time:35,req:['armor1']},
 {id:'composite',b:1,name:'Composite Armor',icon:'🧱',desc:'Vehicles +20% health, +1 armor.',cost:{c:320,m:140},time:40,req:['armor1']},
 {id:'aviation',b:2,name:'Aviation Corps',icon:'🛩️',desc:'Unlocks Airfield and Recon Drones.',cost:{c:250,m:60},time:30,req:[]},
 {id:'rotor',b:2,name:'Rotorcraft',icon:'🚁',desc:'Unlocks Gunship.',cost:{c:300,m:100},time:35,req:['aviation']},
 {id:'jet',b:2,name:'Jet Propulsion',icon:'✈️',desc:'Unlocks Strike Fighter.',cost:{c:350,m:140},time:40,req:['aviation']},
 {id:'strategic',b:2,name:'Strategic Bombing',icon:'☁️',desc:'Unlocks Bomber.',cost:{c:420,m:200},time:45,req:['rotor']},
 {id:'maritime',b:3,name:'Maritime Command',icon:'⚓',desc:'Unlocks Naval Harbor and Patrol Boat.',cost:{c:200,m:50},time:28,req:[]},
 {id:'gunnery',b:3,name:'Naval Gunnery',icon:'🚢',desc:'Unlocks Destroyer.',cost:{c:300,m:120},time:35,req:['maritime']},
 {id:'capital',b:3,name:'Capital Ships',icon:'🛳️',desc:'Unlocks Battleship.',cost:{c:500,m:250},time:50,req:['gunnery','ordnance']},
 {id:'grenades',b:0,name:'Grenadier Training',icon:'💥',desc:'Unlocks Grenadier.',cost:{c:180,m:40},time:28,req:[]},
 {id:'heavyweapons',b:0,name:'Heavy Weapons',icon:'🔫',desc:'Unlocks Minigunner.',cost:{c:300,m:100},time:38,req:['fmj']},
 {id:'exosuit',b:0,name:'Exo-Suits',icon:'🦾',desc:'Unlocks Exo-Trooper.',cost:{c:420,m:200,f:40},time:50,req:['heavyweapons','kevlar']},
 {id:'mechanized',b:1,name:'Mechanized Infantry',icon:'🚙',desc:'Unlocks Armored Carrier.',cost:{c:260,m:80},time:32,req:['armor1']},
 {id:'rocketry',b:1,name:'Rocketry',icon:'🚀',desc:'Unlocks Rocket Launcher.',cost:{c:380,m:140,f:20},time:40,req:['ordnance']},
 {id:'inferno',b:1,name:'Inferno Systems',icon:'🌋',desc:'Unlocks Inferno Tank.',cost:{c:360,m:140,f:20},time:40,req:['incendiary','armor1']},
 {id:'heavyarmor',b:1,name:'Heavy Armor',icon:'🏗️',desc:'Unlocks Heavy Tank.',cost:{c:520,m:240,f:40},time:55,req:['composite']},
 {id:'airsup',b:2,name:'Air Superiority',icon:'🛫',desc:'Unlocks Air Superiority Fighter.',cost:{c:480,m:220,f:50},time:50,req:['jet']},
 {id:'hellfire',b:2,name:'Hellfire Pods',icon:'🔥',desc:'Unlocks Hellfire Gunship.',cost:{c:520,m:240,f:50},time:52,req:['rotor','composite']},
 {id:'heavybombing',b:2,name:'Heavy Bombardment',icon:'🛬',desc:'Unlocks Heavy Bomber.',cost:{c:680,m:320,f:80},time:60,req:['strategic']},
 {id:'cruiser',b:3,name:'Guided Missiles',icon:'🎯',desc:'Unlocks Missile Cruiser.',cost:{c:420,m:200,f:40},time:45,req:['gunnery']},
 {id:'dread',b:3,name:'Dreadnought Program',icon:'🛡️',desc:'Unlocks Dreadnought.',cost:{c:900,m:500,f:120},time:75,req:['capital','cruiser']},
 {id:'barbs',b:4,name:'Spiked Defenses',icon:'🪤',desc:'Unlocks Spike Barricade.',cost:{c:160,m:60},time:26,req:[]},
 {id:'plasteel',b:4,name:'Plasteel Alloy',icon:'🧱',desc:'Unlocks Plasteel Wall.',cost:{c:340,m:160,f:20},time:42,req:['fortify']},
 {id:'fences',b:4,name:'Shock Fences',icon:'⚡',desc:'Unlocks Shock Fence.',cost:{c:380,m:140,f:30},time:44,req:['electrics','barbs']},
 {id:'drilling',b:5,name:'Advanced Drilling',icon:'🔩',desc:'+30% material income (stacks with Deep Mining).',cost:{c:320,m:80},time:40,req:['mining']},
 {id:'offshore',b:5,name:'Offshore Rigs',icon:'🛢️',desc:'+30% fuel income (stacks with Oil Refining).',cost:{c:320,m:80},time:40,req:['refining']},
 {id:'commerce',b:5,name:'Trade Networks',icon:'💱',desc:'Trade Depots +40% income.',cost:{c:300,m:60},time:36,req:['urban']},
 {id:'fortify',b:4,name:'Fortification',icon:'🏰',desc:'Walls +50% health, towers +25% health.',cost:{c:200,m:80},time:30,req:[]},
 {id:'antiair',b:4,name:'Flak Doctrine',icon:'🎆',desc:'Unlocks Flak Battery.',cost:{c:220,m:60},time:28,req:[]},
 {id:'electrics',b:4,name:'Electrification',icon:'⚡',desc:'Unlocks Tesla Coil.',cost:{c:340,m:120,f:30},time:42,req:['fortify']},
 {id:'mining',b:5,name:'Deep Mining',icon:'⛏️',desc:'+35% material income.',cost:{c:180},time:28,req:[]},
 {id:'refining',b:5,name:'Oil Refining',icon:'🛢️',desc:'+35% fuel income.',cost:{c:180},time:28,req:[]},
 {id:'urban',b:5,name:'Urban Planning',icon:'🏘️',desc:'Houses +2 population, taxes +40%.',cost:{c:220,m:40},time:32,req:[]},
 {id:'logistics',b:5,name:'Logistics',icon:'📦',desc:'Units cost 15% less.',cost:{c:300,m:100},time:38,req:['urban']},
 {id:'triage',b:6,name:'Field Triage',icon:'🩹',desc:'Medics and hospitals heal 50% faster.',cost:{c:160},time:25,req:[]},
 {id:'sequencing',b:6,name:'Genome Sequencing',icon:'🧫',desc:'Reveals upcoming mutations a full day ahead.',cost:{c:240,m:40},time:35,req:['triage']},
 {id:'counter',b:6,name:'Counter-Agent',icon:'💉',desc:'Removes the oldest mutation. Future mutations have a 35% chance to fizzle.',cost:{c:420,m:120},time:50,req:['sequencing']},
 {id:'cure1',b:6,name:'Vaccine Trials I',icon:'🧪',desc:'First stage of the cure.',cost:{c:400,m:100},time:60,req:['sequencing'],cure:1},
 {id:'cure2',b:6,name:'Vaccine Trials II',icon:'🧪',desc:'Second stage. The virus senses the threat.',cost:{c:650,m:200,f:40},time:80,req:['cure1'],cure:2},
 {id:'cure3',b:6,name:'Cure Deployment',icon:'🌍',desc:'Final stage. Hold the line while it deploys: the outbreak surges. Victory when complete.',cost:{c:950,m:300,f:100},time:100,req:['cure2','counter'],cure:3}
];
const TECH_BY={};TECHS.forEach(t=>TECH_BY[t.id]=t);
const DIFF={
 recruit:{name:'Recruit',spawn:.75,nests:5,grow:.8,res:1.35,hp:.85,desc:'Gentler outbreak, extra starting resources.'},
 veteran:{name:'Veteran',spawn:1,nests:7,grow:1,res:1,hp:1,desc:'The intended experience.'},
 nightmare:{name:'Nightmare',spawn:1.4,nests:9,grow:1.3,res:.85,hp:1.2,desc:'Relentless. Faster growth, tougher zombies.'}
};
const ZK=Object.keys(Z),UK=Object.keys(U),BK=Object.keys(B);
const ZI={},UI_={},BI={};ZK.forEach((k,i)=>ZI[k]=i);UK.forEach((k,i)=>UI_[k]=i);BK.forEach((k,i)=>BI[k]=i);

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

/* ---------------- WORLD ---------------- */
const SEA=.43, ROCKH=.86, LANDMIN=.05;
let T=new Uint8Array(1), E=new Float32Array(1), F=new Float32Array(1), occ=new Int32Array(1), depGrid=new Int16Array(1);
let WORLD=null;
const NB8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const tIdx=(tx,ty)=>ty*MW+tx;
const inMap=(tx,ty)=>tx>=0&&ty>=0&&tx<MW&&ty<MH;
function passL(i){const t=T[i];return(t===1||t===3)&&occ[i]===0}
function passW(i){return T[i]===0&&occ[i]===0}
function passA(i){return T[i]!==2&&occ[i]===0}
function passTile(dom,tx,ty){if(tx<0||ty<0||tx>=MW||ty>=MH)return false;const i=ty*MW+tx;return dom==='water'?passW(i):passL(i)}

function setMapSize(w,h){MW=w;MH=h;WW=MW*TILE;WH=MH*TILE;T=new Uint8Array(MW*MH);E=new Float32Array(MW*MH);F=new Float32Array(MW*MH);occ=new Int32Array(MW*MH);depGrid=new Int16Array(MW*MH);
 PF.g=new Float32Array(MW*MH);PF.from=new Int32Array(MW*MH);PF.stamp=new Int32Array(MW*MH);PF.done=new Int32Array(MW*MH);PF.vis=new Int32Array(MW*MH);PF.cur=0;PF.vc=0;if(typeof onMapResize==='function')onMapResize()}
/* ---------- pathfinding ---------- */
let PF={g:null,from:null,stamp:null,done:null,vis:null,cur:0,vc:0,heap:new Heap()};
function nearestPass(i,pass,maxR){const cx=i%MW,cy=(i/MW)|0;if(pass(i))return i;let best=-1,bd=1e9;for(let r=1;r<=maxR;r++){for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const nx=cx+dx,ny=cy+dy;if(!inMap(nx,ny))continue;const ni=ny*MW+nx;if(pass(ni)){const d=dx*dx+dy*dy;if(d<bd){bd=d;best=ni}}}if(best>=0)return best}return -1}
function losClear(x1,y1,x2,y2,pass){const d=Math.hypot(x2-x1,y2-y1);const n=Math.ceil(d/10);for(let i=1;i<n;i++){const t=i/n;const x=x1+(x2-x1)*t,y=y1+(y2-y1)*t;const tx=(x/TILE)|0,ty=(y/TILE)|0;if(!inMap(tx,ty)||!pass(ty*MW+tx))return false}return true}
function findPath(sx,sy,gx,gy,dom){
 const pass=dom==='water'?passW:passL;
 let s=clamp((sy/TILE)|0,0,MH-1)*MW+clamp((sx/TILE)|0,0,MW-1),g=clamp((gy/TILE)|0,0,MH-1)*MW+clamp((gx/TILE)|0,0,MW-1);
 const gOrig=g;g=nearestPass(g,pass,14);if(g<0)return null;
 const sOrig=s;s=nearestPass(s,pass,6);if(s<0)return null;
 const gtx=g%MW,gty=(g/MW)|0;
 if(s===g){return[{x:g===gOrig?gx:(gtx+.5)*TILE,y:g===gOrig?gy:(gty+.5)*TILE}]}
 const P=PF;P.cur++;const cur=P.cur,H=P.heap;H.clear();P.g[s]=0;P.stamp[s]=cur;P.from[s]=-1;H.push(0,s);
 let found=false;const done=PF.done;
 while(H.size){const c=H.pop();if(done[c]===cur)continue;done[c]=cur;if(c===g){found=true;break}
  const cx=c%MW,cy=(c/MW)|0;
  for(let k=0;k<8;k++){const dx=NB8[k][0],dy=NB8[k][1];const nx=cx+dx,ny=cy+dy;if(!inMap(nx,ny))continue;const ni=ny*MW+nx;if(!pass(ni))continue;
   if(k>=4&&(!pass(cy*MW+nx)||!pass(ny*MW+cx)))continue;
   const ng=P.g[c]+(k<4?1:1.414);if(P.stamp[ni]!==cur||ng<P.g[ni]){P.stamp[ni]=cur;P.g[ni]=ng;P.from[ni]=c;const hh=Math.hypot(nx-gtx,ny-gty);H.push(ng+hh*1.02,ni)}}}
 if(!found)return null;
 const tiles=[];let c=g;while(c!==-1&&c!==undefined){tiles.push(c);c=P.from[c]}tiles.reverse();
 let pts=tiles.map(t=>({x:(t%MW+.5)*TILE,y:((t/MW)|0)*TILE+TILE/2}));
 if(g===gOrig)pts[pts.length-1]={x:gx,y:gy};
 pts[0]={x:sx,y:sy};
 const out=[];let i=0;while(i<pts.length-1){let j=pts.length-1;while(j>i+1&&!losClear(pts[i].x,pts[i].y,pts[j].x,pts[j].y,pass))j--;out.push(pts[j]);i=j}
 return out;
}
function computeField(out,pass,sources,maxC){
 out.fill(1e9);const H=PF.heap;H.clear();const vis=PF.vis;const vc=++PF.vc;maxC=maxC||1e8;
 for(const s of sources){out[s]=0;H.push(0,s)}
 while(H.size){const c=H.pop();if(vis[c]===vc)continue;vis[c]=vc;const cx=c%MW,cy=(c/MW)|0;const cd=out[c];
  for(let k=0;k<8;k++){const nx=cx+NB8[k][0],ny=cy+NB8[k][1];if(nx<0||ny<0||nx>=MW||ny>=MH)continue;const ni=ny*MW+nx;if(vis[ni]===vc||!pass(ni))continue;
   if(k>=4&&(!pass(cy*MW+nx)||!pass(ny*MW+cx)))continue;
   const nd=cd+(k<4?1:1.414);if(nd<out[ni]&&nd<=maxC){out[ni]=nd;H.push(nd,ni)}}}
}
function flowNext(field,tx,ty,pass){const ci=ty*MW+tx;let bv=field[ci],bi=-1;
 for(let k=0;k<8;k++){const nx=tx+NB8[k][0],ny=ty+NB8[k][1];if(!inMap(nx,ny))continue;const ni=ny*MW+nx;const v=field[ni];if(v>=bv)continue;
  if(v>0&&k>=4&&(!pass(ty*MW+nx)||!pass(ny*MW+tx)))continue;bv=v;bi=ni}
 return bi}

/* ---------------- WORLD GENERATION (server only) ---------------- */
function genWorld(seed){
 const N=MW*MH;const rng=mulberry32(seed);const s1=(rng()*1e6)|0,s2=(rng()*1e6)|0,s3=(rng()*1e6)|0,s4=(rng()*1e6)|0;
 // continent / island blobs on a jittered grid, with ocean gaps
 const blobs=[];const cols=11,rows=8,cw=MW/cols,ch=MH/rows;
 for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){if(rng()<.25)continue;const big=rng()<.4;const k=big?(.55+rng()*.3):(.25+rng()*.22);
  blobs.push({x:(i+.15+rng()*.7)*cw,y:(j+.15+rng()*.7)*ch,rx:cw*k*(.85+rng()*.4),ry:ch*k*(.85+rng()*.4)})}
 for(let k=0;k<70;k++)blobs.push({x:rng()*MW,y:rng()*MH,rx:4+rng()*11,ry:3+rng()*9});
 occ.fill(0);depGrid.fill(0);
 const nb=blobs.length;const bx=new Float32Array(nb),by=new Float32Array(nb),brx=new Float32Array(nb),bry=new Float32Array(nb);blobs.forEach((b,i)=>{bx[i]=b.x;by[i]=b.y;brx[i]=1/b.rx;bry[i]=1/b.ry});
 for(let ty=0;ty<MH;ty++)for(let tx=0;tx<MW;tx++){
  const x=tx+.5,y=ty+.5;const wx=x+(vn(x*.07,y*.07,s1)-.5)*14,wy=y+(vn(x*.07+9.1,y*.07+3.3,s1)-.5)*14;
  const n=fbm(wx*.055,wy*.055,s2,5);let m=-1;
  for(let b=0;b<nb;b++){const dx=(wx-bx[b])*brx[b];if(dx>1.2||dx<-1.2)continue;const dy=(wy-by[b])*bry[b];const v=1-(dx*dx+dy*dy);if(v>m)m=v}
  E[ty*MW+tx]=n*.7+clamp(m,-.3,1)*.42;
  F[ty*MW+tx]=fbm(x*.085,y*.085,s3,3);
 }
 for(let i=0;i<N;i++){const e=E[i];T[i]=e<SEA+LANDMIN?0:e>=ROCKH?2:(F[i]>.67&&e>SEA+.09?3:1)}
 // walkable components
 const comp=new Int32Array(N).fill(-1),sizes=[];const q=new Int32Array(N);
 for(let i=0;i<N;i++){if(comp[i]>=0||!(T[i]===1||T[i]===3))continue;const id=sizes.length;let n=0,h=0,t=0;q[t++]=i;comp[i]=id;
  while(h<t){const c=q[h++];n++;const cx=c%MW,cy=(c/MW)|0;for(let k=0;k<8;k++){const nx=cx+NB8[k][0],ny=cy+NB8[k][1];if(nx<0||ny<0||nx>=MW||ny>=MH)continue;const ni=ny*MW+nx;if(comp[ni]<0&&(T[ni]===1||T[ni]===3)){comp[ni]=id;q[t++]=ni}}}sizes.push(n)}
 // distance to water
 const dw=new Float32Array(N).fill(1e9);{let h=0,t=0;for(let i=0;i<N;i++)if(T[i]===0){dw[i]=0;q[t++]=i}
  while(h<t){const c=q[h++];const cx=c%MW,cy=(c/MW)|0;for(let k=0;k<4;k++){const nx=cx+NB8[k][0],ny=cy+NB8[k][1];if(nx<0||ny<0||nx>=MW||ny>=MH)continue;const ni=ny*MW+nx;if(dw[ni]>dw[c]+1){dw[ni]=dw[c]+1;q[t++]=ni}}}}
 let land=0;for(let i=0;i<N;i++)if(T[i]===1)land++;
 const BIG=1500;
 // nests
 const nests=[];const nestCount=Math.max(8,Math.round(land/2300));const minND=24;
 const cand=[];for(let ty=4;ty<MH-4;ty+=1)for(let tx=4;tx<MW-4;tx+=1){const i=ty*MW+tx;if(T[i]===1&&dw[i]>=2&&sizes[comp[i]]>=BIG)cand.push(i)}
 const best=new Map();for(let i=0;i<N;i++){if(T[i]!==1)continue;const c=comp[i];if(sizes[c]>=BIG||sizes[c]<22)continue;const b=best.get(c);if(b===undefined||dw[i]>dw[b])best.set(c,i)}
 const ex=[];
 const farPick=(minD)=>{let b=-1,bsc=-1;for(let k=0;k<80&&cand.length;k++){const c=cand[(rng()*cand.length)|0];const cx=c%MW,cy=(c/MW)|0;let md=1e9;for(const e of ex)md=Math.min(md,Math.hypot(cx-e[0],cy-e[1]));if(md<minD)continue;if(md>bsc){bsc=md;b=c}}return b};
 for(let k=0;k<nestCount;k++){const c=farPick(minND);if(c<0)continue;const tx=c%MW,ty=(c/MW)|0;ex.push([tx,ty]);nests.push({tx,ty,island:false})}
 let isl=0;for(const[c,i]of best){if(isl>=30)break;const tx=i%MW,ty=(i/MW)|0;nests.push({tx,ty,island:true});ex.push([tx,ty]);isl++}
 // deposits
 const deposits=[];
 const freeSpot=(tx,ty,water)=>{for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){if(!inMap(tx+dx,ty+dy))return false;const i=(ty+dy)*MW+tx+dx;if(water?T[i]!==0:T[i]!==1)return false;if(depGrid[i])return false}
  for(const n of nests)if(Math.abs(tx-n.tx)<9&&Math.abs(ty-n.ty)<9)return false;return true};
 const addDep=(type,tx,ty,water)=>{const id=deposits.length+1;deposits.push({id,type,tx,ty,water,used:false});for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++)depGrid[(ty+dy)*MW+tx+dx]=id;return deposits[deposits.length-1]};
 const place=(type,count,water)=>{let tries=0,n=0;while(n<count&&tries++<count*80){const tx=(rng()*(MW-4)|0)+2,ty=(rng()*(MH-4)|0)+2;if(!freeSpot(tx,ty,water))continue;const i=ty*MW+tx;if(!water&&sizes[comp[i]]<BIG)continue;if(water&&(dw[i]>5||E[i]>SEA-.03))continue;
  let near=false;for(let k=Math.max(0,deposits.length-60);k<deposits.length;k++){const d=deposits[k];if(Math.abs(d.tx-tx)<5&&Math.abs(d.ty-ty)<5)near=true}if(near)continue;addDep(type,tx,ty,water);n++}};
 place('ore',Math.round(land/420));place('oil',Math.round(land/1000));place('oil',Math.round(land/1300),true);
 WORLD={seed,s4,nests,deposits,comp,sizes,dw,land,BIG,addDep,startCands:null,rng};
 return WORLD;
}
// deposits next to a new base so nobody spawns starved
function ensureDeposits(st){const W=WORLD;const have=(type)=>W.deposits.filter(d=>d.type===type&&!d.used&&Math.abs(d.tx-st.tx)<22&&Math.abs(d.ty-st.ty)<22).length;const added=[];
 const tryAdd=(type,water,need)=>{let n=have(type);let tries=0;while(n<need&&tries++<600){const a=Math.random()*TAU,d=7+Math.random()*10;const tx=Math.round(st.tx+Math.cos(a)*d),ty=Math.round(st.ty+Math.sin(a)*d);if(!inMap(tx,ty)||!inMap(tx+1,ty+1))continue;
   let ok=true;for(let dy=0;dy<2&&ok;dy++)for(let dx=0;dx<2;dx++){const i=(ty+dy)*MW+tx+dx;if(water?(T[i]!==0||E[i]>SEA-.03):(T[i]!==1||occ[i]||depGrid[i]||E[i]<SEA+.07)){ok=false;break}}if(!ok)continue;if(Math.hypot(tx+1-st.tx,ty+1-st.ty)<5)continue;
   for(const d of W.deposits)if(Math.abs(d.tx-tx)<4&&Math.abs(d.ty-ty)<4){ok=false;break}if(!ok)continue;added.push(W.addDep(type,tx,ty,water));n++}};
 tryAdd('ore',false,3);tryAdd('oil',false,1);
 let coast=false;for(let dy=-14;dy<=14&&!coast;dy+=2)for(let dx=-14;dx<=14;dx+=2){const x=st.tx+dx,y=st.ty+dy;if(inMap(x,y)&&WORLD.dw[y*MW+x]<=3&&T[y*MW+x]===0){coast=true;break}}
 if(coast){let n=0,tries=0;while(n<1&&tries++<400){const a=Math.random()*TAU,d=8+Math.random()*14;const tx=Math.round(st.tx+Math.cos(a)*d),ty=Math.round(st.ty+Math.sin(a)*d);if(!inMap(tx,ty)||!inMap(tx+1,ty+1))continue;let ok=true;for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){const i=(ty+dy)*MW+tx+dx;if(T[i]!==0||depGrid[i]||E[i]>SEA-.03)ok=false}if(ok&&WORLD.dw[ty*MW+tx]<=5){added.push(W.addDep('oil',tx,ty,true));n++}}}
 else tryAdd('oil',false,2);
 return added}
// find a start position for a new base
function findStart(avoid){const W=WORLD;
 if(!W.startCands){const c=[];for(let ty=8;ty<MH-8;ty+=3)for(let tx=8;tx<MW-8;tx+=3){const i=ty*MW+tx;if(T[i]!==1||W.sizes[W.comp[i]]<W.BIG)continue;
   let good=0;for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){if(T[(ty+dy)*MW+tx+dx]===1)good++}if(good<110)continue;
   let core=true;for(let dy=-4;dy<=4&&core;dy++)for(let dx=-4;dx<=4;dx++){const j=(ty+dy)*MW+tx+dx;if(T[j]!==1||depGrid[j]||E[j]<SEA+.1){core=false;break}}if(core)c.push([tx,ty])}W.startCands=c}
 const c=W.startCands;if(!c.length)return null;let best=null,bs=-1e9;
 const alive=[...G.players.values()].filter(p=>p.alive&&p.hq);const anchor=alive.length?alive[(Math.random()*alive.length)|0]:null;
 for(const rad of(anchor?[48,70,100,1e9]:[1e9])){let pool=c;if(anchor){const ax=anchor.hq.tx,ay=anchor.hq.ty;pool=c.filter(q=>{const d=Math.hypot(q[0]-ax,q[1]-ay);return d>=22&&d<=rad});if(!pool.length)continue}
 for(let k=0;k<900;k++){const [tx,ty]=pool[(Math.random()*pool.length)|0];if(depGrid[ty*MW+tx])continue;let ok=true;for(let dy=-3;dy<=3&&ok;dy++)for(let dx=-3;dx<=3;dx++){const j=(ty+dy)*MW+tx+dx;if(occ[j]||depGrid[j]){ok=false;break}}if(!ok)continue;
  let nd=1e9;for(const n of G.nests)nd=Math.min(nd,Math.hypot(n.tx-tx,n.ty-ty));if(nd<(anchor?28:34))continue;
  let pd=1e9;for(const p of alive)pd=Math.min(pd,Math.hypot(p.hq.tx-tx,p.hq.ty-ty));if(pd<20)continue;
  let ad=1e9;for(const a of avoid||[])ad=Math.min(ad,Math.hypot(a.x/TILE-tx,a.y/TILE-ty));if(ad<22)continue;
  let sc;if(anchor){const d=Math.hypot(anchor.hq.tx-tx,anchor.hq.ty-ty);sc=-Math.abs(d-28)*2-Math.max(0,pd<24?24-pd:0)*3+Math.min(nd,60)*.3-Math.abs(W.dw[ty*MW+tx]-9)*.3+Math.random()*4}
  else sc=Math.min(nd,70)*.8-Math.abs(W.dw[ty*MW+tx]-9)*1.2+Math.random()*12;
  if(sc>bs){bs=sc;best={tx,ty}}}
 if(best)break}
 return best}

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

module.exports={EVENTS,WMODS,choosePerk,missionProg,strengthDay,get depGrid(){return depGrid},get occ(){return occ},killZombie,removeBuilding,ev,nearestPass,passL,passW,passA,inMap,mkFor,pick,mutPool,triggerMutation,recomputeMods,SHash,CFG,get G(){return G},get WORLD(){return WORLD},get T(){return T},get E(){return E},get F(){return F},get MW(){return MW},get MH(){return MH},get hZ(){return hZ},get hP(){return hP},
 TILE,DAY_LEN,Z,U,B,ZK,UK,BK,ZI,UI_,BI,TECHS,TECH_BY,MUTS,RES,PCOLORS,
 newWorld,newPlayer,spawnPlayer,respawn,eliminate,stepSim,placeBuilding,sellBuilding,enqueue,dequeue,orderMove,orderAttack,orderStop,startResearch,cancelResearch,
 reqAlly,acceptAlly,declineAlly,breakAlly,sendAid,sysChat,toP,toAll,notifyP,recalcEcon,canPlaceP,gameHour,nightAmt,isFriend,addUnit,addBuilding,spawnZombie,PL,clamp};

