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
 hq:{name:'Command Center',size:3,hp:2600,cost:{},time:0,pop:12,inc:{c:3.5,m:.6,a:1.2},cat:null,light:210,desc:'Your headquarters. If it falls, the operation is lost. Trains engineers and riflemen.',train:['engineer','rifleman']},
 house:{name:'Housing Block',size:1,hp:170,cost:{c:45,m:5},time:4,pop:5,inc:{c:1},cat:'eco',desc:'Shelters civilians: +5 population cap and a small tax income.'},
 market:{name:'Trade Depot',size:2,hp:340,cost:{c:110,m:25},time:7,inc:{c:5},cat:'eco',desc:'Survivor trade hub. Steady credit income.'},
 mine:{name:'Ore Mine',size:2,hp:360,cost:{c:90,m:10},time:6,inc:{m:3.6},cat:'eco',dep:'ore',desc:'Extracts materials. Must be built on an ore deposit.'},
 derrick:{name:'Oil Derrick',size:2,hp:320,cost:{c:110,m:40},time:8,inc:{f:2.2},cat:'eco',dep:'oil',desc:'Pumps fuel. Build on oil deposits, on land or offshore.'},
 ammofactory:{name:'Ammo Factory',size:2,hp:520,cost:{c:260,m:110},time:10,cat:'mil',inc:{a:4.2},light:90,desc:'Produces ammunition. Units can only fire while you have ammo, and each factory raises your storage cap.'},
 barracks:{name:'Barracks',size:2,hp:650,cost:{c:200,m:60},time:12,cat:'mil',light:90,train:['rifleman','grenadier','minigunner','flamer','sniper','exotrooper','commando','medic','engineer'],desc:'Trains infantry, medics and engineers.'},
 factory:{name:'Motor Pool',size:3,hp:950,cost:{c:350,m:180},time:18,cat:'mil',light:100,train:['jeep','apc','tank','inferno','rocketer','artillery','heavytank','siegewalker'],desc:'Builds buggies, carriers, tanks, rocket and heavy armor.'},
 airfield:{name:'Airfield',size:3,hp:820,cost:{c:450,m:250,f:50},time:22,cat:'mil',tech:'aviation',light:120,train:['drone','gunship','fighter','ace','hellfire','bomber','heavybomber','combatdrone'],desc:'Launches drones, gunships, fighters and bombers.'},
 harbor:{name:'Naval Harbor',size:2,hp:720,cost:{c:300,m:150},time:16,cat:'mil',tech:'maritime',coastal:true,light:90,train:['patrol','destroyer','cruiser','battleship','dread'],desc:'Builds warships. Must touch open water.'},
 wall:{name:'Steel Barricade',size:1,hp:340,cost:{c:8,m:12},time:2,cat:'def',wall:true,desc:'Cheap barrier. Zombies must chew through it. Drag to place a line.'},
 sandbag:{name:'Sandbag Wall',size:1,hp:170,cost:{c:3,m:5},time:1,cat:'def',wall:true,style:'sand',desc:'Very cheap, low health. A fast first line of defense.'},
 concrete:{name:'Concrete Barrier',size:1,hp:820,cost:{c:10,m:32},time:3,cat:'def',wall:true,style:'conc',tech:'fortify',desc:'Heavy poured barrier. Takes a long time to chew through.'},
 spikes:{name:'Spike Barricade',size:1,hp:400,cost:{c:14,m:24},time:3,cat:'def',wall:true,style:'spike',tech:'barbs',thorns:14,desc:'Zombies that attack it are impaled for damage on every hit.'},
 plasteel:{name:'Plasteel Wall',size:1,hp:1900,cost:{c:20,m:60,f:5},time:5,cat:'def',wall:true,style:'plas',tech:'plasteel',desc:'Advanced alloy wall. Extremely durable.'},
 shockfence:{name:'Shock Fence',size:1,hp:460,cost:{c:30,m:36,f:6},time:4,cat:'def',wall:true,style:'shock',tech:'fences',thorns:34,desc:'Electrified barrier. Shocks anything that attacks it.'},
 moat:{name:'Moat',size:1,hp:420,cost:{c:6,m:10},time:2,cat:'def',wall:true,style:'moat',moat:true,desc:'Flooded trench. Underground zombies cannot tunnel across or near it: they are forced to the surface. Drag to place a line.'},
 pulsewall:{name:'Pulse Wall',size:1,hp:1250,cost:{c:24,m:50,f:4},time:4,cat:'def',wall:true,style:'pulse',tech:'wd_pulse',thorns:65,desc:'Warden wall. Massive health and heavy retaliation damage.'},
 laser:{name:'Laser Turret',size:1,hp:340,cost:{c:380,m:220,f:30},time:10,cat:'def',tech:'wd_laser',light:150,weapon:{w:'bullet',dmg:16,cd:.12,range:270,aa:true},desc:'Warden turret. Extremely fast beam fire against ground and air.'},
 bunker:{name:'Bunker',size:2,hp:1500,cost:{c:420,m:300},time:14,cat:'def',tech:'wd_bunker',light:90,weapon:{w:'bullet',dmg:10,cd:.14,range:215,aa:true},desc:'Warden fortification. Very tough gun position.'},
 arc:{name:'Arc Tower',size:2,hp:520,cost:{c:420,m:240,f:40},time:12,cat:'def',tech:'en_arc',light:170,weapon:{w:'tesla',dmg:20,cd:.55,range:210,aa:true,chain:8},desc:'Engineer tower. Rapid chain lightning.'},
 warbanner:{name:'War Banner',size:2,hp:430,cost:{c:260,m:120},time:9,cat:'sup',tech:'wl_banner',aura:{r:320,dmg:1.2},light:100,desc:'Warlord rally point. Your units within 320 range deal +20% damage.'},
 windmill:{name:'Windmill',size:2,hp:230,cost:{c:90,m:40},time:6,cat:'eco',pow:4.5,desc:'Clean power that swings with the wind (30%-130%). No fuel needed, but fragile.'},
 solar:{name:'Solar Array',size:2,hp:260,cost:{c:150,m:90},time:8,cat:'eco',tech:'solar',pow:6,desc:'Reliable by day, produces nothing at night.'},
 fossil:{name:'Fossil Generator',size:2,hp:380,cost:{c:180,m:70},time:8,cat:'eco',pow:15,fuel:.6,boom:1,light:70,desc:'Large steady output, but burns 0.6 fuel per second, shuts off when fuel runs out and explodes when destroyed.'},
 tidal:{name:'Tidal Generator',size:2,hp:300,cost:{c:200,m:100},time:9,cat:'eco',tech:'tidal',coastal:true,pow:7,desc:'Steady power from ocean currents. Must touch open water. Sea monsters will attack it.'},
 nuclear:{name:'Nuclear Reactor',size:3,hp:900,cost:{c:900,m:520,f:120},time:26,cat:'eco',tech:'nuclear',pow:45,boom:2,light:160,desc:'Enormous power output. If destroyed it suffers a devastating meltdown.'},
 fusion:{name:'Fusion Reactor',size:3,hp:800,cost:{c:1100,m:600,f:200},time:28,cat:'eco',tech:'en_fusion',pow:90,light:200,desc:'Engineer reactor. Huge, safe power output.'},
 mgtower:{name:'Gun Nest',size:1,hp:250,cost:{c:90,m:30},time:5,cat:'def',light:110,weapon:{w:'bullet',dmg:7,cd:.2,range:215,aa:true},desc:'Machine gun emplacement. Hits ground and air.'},
 flametower:{name:'Flame Tower',size:1,hp:270,cost:{c:140,m:40,f:10},time:6,cat:'def',tech:'incendiary',light:120,weapon:{w:'flame',dmg:6,cd:.1,range:112},desc:'Short range fire cone that melts hordes.'},
 snipertower:{name:'Marksman Post',size:1,hp:230,cost:{c:180,m:60},time:7,cat:'def',tech:'marksman',light:100,weapon:{w:'bullet',dmg:62,cd:2,range:390,aa:true},desc:'Long range, high damage single shots.'},
 tesla:{name:'Tesla Coil',size:2,hp:420,cost:{c:350,m:200,f:20},time:12,cat:'def',tech:'electrics',light:160,weapon:{w:'tesla',dmg:30,cd:1.1,range:175,aa:true,chain:5},desc:'Chain lightning arcs through packs of zombies.'},
 aasite:{name:'Flak Battery',size:2,hp:380,cost:{c:280,m:120},time:10,cat:'def',tech:'antiair',light:90,weapon:{w:'flak',dmg:26,cd:.65,range:340,aaOnly:true,splash:46},desc:'Shreds flying mutants. Cannot hit ground targets.'},
 arty:{name:'Artillery Battery',size:2,hp:480,cost:{c:400,m:250,f:40},time:14,cat:'def',tech:'ordnance',light:90,weapon:{w:'shell',dmg:80,cd:3.4,range:600,minRange:110,splash:90},desc:'Huge range explosive shells. Ground targets only.'},
 lab:{name:'Skill Lab',size:2,hp:520,cost:{c:250,m:100},time:14,cat:'sup',light:110,desc:'Unlocks Skill Tree nodes. Extra labs unlock skills faster.'},
 hospital:{name:'Field Hospital',size:2,hp:470,cost:{c:220,m:80},time:12,cat:'sup',light:100,heal:{r:175,hps:9},desc:'Heals nearby friendly units over time.'},
 radar:{name:'Radar Station',size:2,hp:400,cost:{c:200,m:100,f:20},time:12,cat:'sup',light:80,desc:'Reveals all zombies and nests on the minimap.'}
};
const USE={barracks:3,factory:6,airfield:8,harbor:4,ammofactory:5,lab:4,hospital:3,radar:3,tesla:10,aasite:3,arty:5,snipertower:1,mine:1.5,derrick:1.5,market:1,laser:9,bunker:2,arc:10,flametower:1,warbanner:2};
for(const k in USE)B[k].use=USE[k];
for(const k in B){const d=B[k];if(d.use)d.desc+=' ⚡ Uses '+d.use+' power.';if(d.pow)d.desc+=' ⚡ Produces '+d.pow+' power.'}
const U={
 rifleman:{name:'Rifleman',dom:'land',cost:{c:50},pop:1,time:5,hp:70,speed:64,r:6,range:160,dmg:8,cd:.55,w:'bullet',aa:true,cls:'inf',desc:'Cheap, reliable infantry. Can shoot flyers.'},
 flamer:{name:'Flame Trooper',dom:'land',cost:{c:85,f:10},pop:1,time:7,hp:95,speed:56,r:6,range:84,dmg:6,cd:.1,w:'flame',tech:'incendiary',cls:'inf',desc:'Burns whole packs at short range.'},
 sniper:{name:'Marksman',dom:'land',cost:{c:110,m:20},pop:1,time:8,hp:50,speed:58,r:6,range:350,dmg:62,cd:2.1,w:'bullet',aa:true,tech:'marksman',cls:'inf',desc:'Long range, kills specials fast.'},
 medic:{name:'Medic',dom:'land',cost:{c:70},pop:1,time:6,hp:55,speed:66,r:6,heal:14,healR:100,cls:'inf',desc:'Heals nearby infantry and vehicles.'},
 engineer:{name:'Engineer',dom:'land',cost:{c:60},pop:1,time:6,hp:60,speed:60,r:6,repair:30,cls:'inf',desc:'Repairs damaged structures automatically.'},
 jeep:{name:'Scout Buggy',dom:'land',cost:{c:130,m:30,f:10},pop:2,time:8,hp:155,speed:155,r:11,range:185,dmg:6,cd:.14,w:'bullet',aa:true,cls:'veh',desc:'Fast mobile machine gun.'},
 tank:{name:'Main Battle Tank',dom:'land',cost:{c:260,m:150,f:35},pop:4,time:14,hp:480,armor:3,speed:74,r:14,range:245,dmg:48,cd:1.35,w:'shell',splash:50,tech:'armor1',cls:'veh',desc:'Armored, explosive cannon.'},
 artillery:{name:'Howitzer',dom:'land',cost:{c:230,m:170,f:45},pop:4,time:16,hp:180,speed:52,r:14,range:560,minRange:115,dmg:78,cd:3.1,w:'shell',splash:88,tech:'ordnance',cls:'veh',desc:'Long range area bombardment.'},
 commando:{name:'Commando',dom:'land',cost:{c:240,m:80,f:20},pop:2,time:9,hp:190,armor:1,speed:80,r:7,range:195,dmg:20,cd:.22,w:'bullet',aa:true,tech:'wl_commando',cls:'inf',look:'sniper',tint:'#d04040',sc:1.15,desc:'Warlord elite. Fast, tough and fires rapidly.'},
 siegewalker:{name:'Siege Walker',dom:'land',cost:{c:620,m:380,f:100},pop:8,time:24,hp:1550,armor:5,speed:56,r:19,range:315,dmg:70,cd:1.2,splash:60,w:'shell',tech:'wl_walker',cls:'veh',look:'tank',tint:'#c05a30',sc:1.55,desc:'Warlord war machine. Armored, long range, explosive shells.'},
 combatdrone:{name:'Combat Drone',dom:'air',cost:{c:90,m:30,f:10},pop:1,time:4,hp:80,speed:230,r:9,range:175,dmg:6,cd:.1,w:'bullet',aa:true,tech:'en_drone',cls:'air',look:'drone',tint:'#40d8c8',desc:'Engineer swarm unit. Cheap, fast and shoots rapidly.'},
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
const SPECS=[
 {id:'warlord',name:'Warlord',icon:'⚔️',color:'#ff6a4a',desc:'Offense. Faster, deadlier armies, elite shock units, a rally banner and the Orbital Barrage ability.',abil:'Orbital Barrage'},
 {id:'warden',name:'Warden',icon:'🛡️',color:'#4aa8ff',desc:'Defense. Tougher self-repairing bases, Laser Turrets, Bunkers, Pulse Walls and the Bulwark ability.',abil:'Bulwark'},
 {id:'engineer',name:'Engineer',icon:'⚙️',color:'#4aff9a',desc:'Industry. Stronger grid and economy, Fusion Reactors, Arc Towers, Combat Drones and the Overcharge ability.',abil:'Overcharge'}
];
const Z={
 walker:{name:'Walker',hp:45,speed:32,dmg:8,cd:1,reach:13,r:7,bounty:2,desc:'The standard infected. Slow but endless.'},
 runner:{name:'Runner',hp:30,speed:76,dmg:6,cd:.55,reach:12,r:6,bounty:3,desc:'Fast and fragile. Overwhelms thin lines.'},
 brute:{name:'Brute',hp:340,speed:27,dmg:34,cd:1.5,reach:21,r:12,armor:2,bounty:12,desc:'Armored mass of muscle. Smashes walls.'},
 spitter:{name:'Spitter',hp:55,speed:34,dmg:11,cd:2.3,range:170,r:7,bounty:5,desc:'Lobs acid from range. Double damage on buildings.'},
 bloater:{name:'Bloater',hp:150,speed:24,dmg:0,cd:1,reach:16,r:11,bounty:8,desc:'Bursts violently on death. Kill it far from your walls.'},
 screamer:{name:'Screamer',hp:80,speed:44,dmg:7,cd:1,reach:12,r:7,aura:175,bounty:10,desc:'Its shriek makes nearby zombies faster and angrier.'},
 gargoyle:{name:'Gargoyle',hp:95,speed:96,dmg:13,cd:.9,reach:14,r:8,fly:true,bounty:6,desc:'Winged mutant that flies over walls. Needs anti-air.'},
 drowned:{name:'Drowned',hp:90,speed:42,dmg:12,cd:1,reach:13,r:7,swim:true,bounty:5,desc:'Swims. Attacks harbors, derricks and ships.'},
 plated:{name:'Plated Brute',hp:430,speed:30,dmg:30,cd:1.4,reach:21,r:12,armor:4,bounty:14,look:'brute',tint:'#8a98a6',res:{bullet:.4,blast:1.4,fire:1.3},desc:'Steel-plated hide shrugs off bullets. Counter: explosives and flame. Hunts infantry.'},
 rustjaw:{name:'Rustjaw',hp:220,speed:80,dmg:20,cd:.8,reach:16,r:9,bounty:11,look:'runner',tint:'#d0743a',sc:1.25,prefer:'veh',vs:{veh:3.2,nav:2.4},desc:'Vehicle hunter. Fast, and deals triple damage to tanks and trucks.'},
 skyhunter:{name:'Skyhunter',hp:150,speed:122,dmg:18,cd:.8,reach:14,r:8,fly:true,bounty:12,look:'gargoyle',tint:'#e04a2a',prefer:'air',vs:{air:3.2},desc:'Hunts aircraft and tears them apart. Counter: flak and fighters.'},
 kraken:{name:'Kraken',hp:950,speed:44,dmg:55,cd:1.2,reach:30,r:16,swim:true,armor:2,bounty:30,look:'drowned',tint:'#3a86b0',sc:2,prefer:'nav',vs:{nav:3},desc:'Sea monster that wrecks ships. Counter: air power and shore batteries.'},
 swarmling:{name:'Swarmling',hp:26,speed:108,dmg:6,cd:.5,reach:12,r:5,bounty:3,look:'runner',tint:'#a8c860',sc:.75,res:{blast:1.6,fire:1.5},desc:'Tiny, fast and numerous. Wastes single-shot weapons. Counter: splash and flame.'},
 siphon:{name:'Siphon',hp:270,speed:58,dmg:10,cd:1,reach:14,r:10,bounty:16,look:'screamer',tint:'#7a52d0',sc:1.15,drain:3.5,desc:'Drains your ammunition stockpile while near your units. Kill it fast.'},
 burrower:{name:'Burrower',hp:190,speed:46,dmg:14,cd:.9,reach:14,r:8,bounty:14,burrow:true,look:'runner',tint:'#9a7440',sc:1.1,desc:'Tunnels underground where it cannot be hurt, then erupts beneath your troops. Counter: Moats flood the tunnels and force it to the surface.'},
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
const BRANCH=['Infantry','Armor','Air','Naval','Defense','Economy','Medical','Warlord','Warden','Engineer'];
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
 {id:'solar',b:5,name:'Solar Power',icon:'☀️',desc:'Unlocks Solar Array.',cost:{c:200,m:60},time:28,req:[]},
 {id:'tidal',b:5,name:'Tidal Power',icon:'🌊',desc:'Unlocks Tidal Generator.',cost:{c:260,m:80},time:32,req:['maritime']},
 {id:'smartgrid',b:5,name:'Smart Grid',icon:'🔌',desc:'All buildings use 15% less power.',cost:{c:280,m:100},time:34,req:['solar']},
 {id:'nuclear',b:5,name:'Nuclear Power',icon:'☢️',desc:'Unlocks Nuclear Reactor.',cost:{c:650,m:320,f:60},time:55,req:['smartgrid','electrics']},
 {id:'wl_blitz',b:7,spec:'warlord',name:'Blitz Doctrine',icon:'💨',desc:'All units +15% speed and +10% damage.',cost:{c:300,m:80},time:30,req:[]},
 {id:'wl_spoils',b:7,spec:'warlord',name:'War Spoils',icon:'🏴',desc:'Kill bounties +40%.',cost:{c:260,m:60},time:28,req:[]},
 {id:'wl_commando',b:7,spec:'warlord',name:'Commando Training',icon:'🥷',desc:'Unlocks Commando at the Barracks.',cost:{c:360,m:120},time:34,req:['wl_blitz']},
 {id:'wl_walker',b:7,spec:'warlord',name:'Siege Walkers',icon:'🦿',desc:'Unlocks Siege Walker at the Motor Pool.',cost:{c:520,m:260,f:40},time:44,req:['wl_blitz','armor1']},
 {id:'wl_banner',b:7,spec:'warlord',name:'War Banner',icon:'🚩',desc:'Unlocks the War Banner: nearby units deal +20% damage.',cost:{c:340,m:140},time:36,req:['wl_spoils']},
 {id:'wl_serum',b:7,spec:'warlord',name:'Berserker Serum',icon:'💉',desc:'Infantry +25% health.',cost:{c:420,m:160},time:40,req:['wl_commando']},
 {id:'wl_barrage',b:7,spec:'warlord',name:'Orbital Barrage',icon:'🌠',desc:'ABILITY (Q): call down a 4 second shell barrage on your cursor. 150s cooldown.',cost:{c:700,m:340,f:80},time:60,req:['wl_walker','wl_banner']},
 {id:'wd_bastion',b:8,spec:'warden',name:'Bastion Doctrine',icon:'🏯',desc:'All buildings +40% health and slowly self-repair.',cost:{c:300,m:120},time:30,req:[]},
 {id:'wd_laser',b:8,spec:'warden',name:'Laser Optics',icon:'🔴',desc:'Unlocks Laser Turret.',cost:{c:420,m:180,f:30},time:38,req:['wd_bastion']},
 {id:'wd_bunker',b:8,spec:'warden',name:'Bunkers',icon:'🏚️',desc:'Unlocks Bunker.',cost:{c:380,m:200},time:36,req:['wd_bastion']},
 {id:'wd_pulse',b:8,spec:'warden',name:'Pulse Walls',icon:'🟣',desc:'Unlocks Pulse Wall.',cost:{c:360,m:160,f:20},time:36,req:['wd_bastion']},
 {id:'wd_tdmg',b:8,spec:'warden',name:'Overdriven Turrets',icon:'🔧',desc:'Your towers deal +25% damage.',cost:{c:420,m:180},time:40,req:['wd_laser']},
 {id:'wd_deepmoat',b:8,spec:'warden',name:'Deep Moats',icon:'🌀',desc:'Moats have double health.',cost:{c:260,m:120},time:30,req:['wd_pulse']},
 {id:'wd_bulwark',b:8,spec:'warden',name:'Bulwark',icon:'🧱',desc:'ABILITY (Q): instantly repair half of all building health and take 65% less building damage for 15s. 150s cooldown.',cost:{c:680,m:320,f:60},time:58,req:['wd_bunker','wd_tdmg']},
 {id:'en_grid',b:9,spec:'engineer',name:'Power Grid',icon:'🔋',desc:'Generators +25% output and buildings use 20% less power.',cost:{c:300,m:120},time:30,req:[]},
 {id:'en_fusion',b:9,spec:'engineer',name:'Fusion Power',icon:'⚛️',desc:'Unlocks Fusion Reactor.',cost:{c:700,m:340,f:90},time:55,req:['en_grid']},
 {id:'en_drone',b:9,spec:'engineer',name:'Drone Hive',icon:'🐝',desc:'Unlocks Combat Drone at the Airfield.',cost:{c:380,m:150,f:30},time:36,req:['en_grid']},
 {id:'en_arc',b:9,spec:'engineer',name:'Arc Weaponry',icon:'⚡',desc:'Unlocks Arc Tower.',cost:{c:420,m:200,f:40},time:40,req:['en_grid']},
 {id:'en_auto',b:9,spec:'engineer',name:'Automation',icon:'🤖',desc:'+25% credit and material income, skills unlock 30% faster.',cost:{c:520,m:240},time:44,req:['en_fusion']},
 {id:'en_overcharge',b:9,spec:'engineer',name:'Overcharge',icon:'🔆',desc:'ABILITY (Q): for 20s generators give +50% power, production runs 40% faster and towers fire faster. 150s cooldown.',cost:{c:700,m:340,f:80},time:58,req:['en_fusion','en_arc']},
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
