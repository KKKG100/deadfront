/* ---------------- SPRITES ---------------- */
const SPR={};
function mkSpr(key,w,h,fn,sc){if(SPR[key])return SPR[key];sc=sc||2;const c=document.createElement('canvas');c.width=Math.ceil(w*sc);c.height=Math.ceil(h*sc);const x=c.getContext('2d');x.scale(sc,sc);x.translate(w/2,h/2);fn(x);c._w=w;c._h=h;SPR[key]=c;return c}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
function lg(c,x0,y0,x1,y1,st){const g=c.createLinearGradient(x0,y0,x1,y1);st.forEach(s=>g.addColorStop(s[0],s[1]));return g}
function rg(c,x,y,r0,r1,st){const g=c.createRadialGradient(x,y,r0,x,y,r1);st.forEach(s=>g.addColorStop(s[0],s[1]));return g}
function circ(c,x,y,r,f,s,lw){c.beginPath();c.arc(x,y,r,0,TAU);if(f){c.fillStyle=f;c.fill()}if(s){c.strokeStyle=s;c.lineWidth=lw||1;c.stroke()}}
function ell(c,x,y,rx,ry,f,s,lw,rot){c.beginPath();c.ellipse(x,y,rx,ry,rot||0,0,TAU);if(f){c.fillStyle=f;c.fill()}if(s){c.strokeStyle=s;c.lineWidth=lw||1;c.stroke()}}
function box(c,x,y,w,h,f,s,r){rr(c,x,y,w,h,r||1.5);if(f){c.fillStyle=f;c.fill()}if(s){c.strokeStyle=s;c.lineWidth=1;c.stroke()}}
function shadowRR(c,x,y,w,h,r,o){c.fillStyle='rgba(0,0,0,.3)';rr(c,x+(o||4),y+(o||5),w,h,r||3);c.fill()}
function roof(c,x,y,w,h,c1,c2,r,sh){if(sh!==false)shadowRR(c,x,y,w,h,r||3);rr(c,x,y,w,h,r||3);c.fillStyle=lg(c,x,y,x+w,y+h,[[0,c1],[1,c2]]);c.fill();c.strokeStyle='rgba(0,0,0,.55)';c.lineWidth=1.2;c.stroke();
 c.strokeStyle='rgba(255,255,255,.28)';c.lineWidth=1;c.beginPath();c.moveTo(x+2,y+h-2);c.lineTo(x+2,y+2);c.lineTo(x+w-2,y+2);c.stroke();c.strokeStyle='rgba(0,0,0,.3)';c.beginPath();c.moveTo(x+w-2,y+3);c.lineTo(x+w-2,y+h-2);c.lineTo(x+3,y+h-2);c.stroke()}
function slab(c,h,c1,c2){shadowRR(c,-h,-h,2*h,2*h,5);rr(c,-h,-h,2*h,2*h,5);c.fillStyle=lg(c,-h,-h,h,h,[[0,c1],[1,c2]]);c.fill();c.strokeStyle='rgba(0,0,0,.5)';c.lineWidth=1.2;c.stroke();c.strokeStyle='rgba(255,255,255,.14)';rr(c,-h+2,-h+2,2*h-4,2*h-4,4);c.stroke()}
function vent(c,x,y,w,h){box(c,x,y,w,h,'#2e3338','#111',1);c.strokeStyle='rgba(255,255,255,.2)';for(let i=1;i<4;i++){c.beginPath();c.moveTo(x+1,y+i*h/4);c.lineTo(x+w-1,y+i*h/4);c.stroke()}}
function sandbags(c,x,y,n,dx,dy){for(let i=0;i<n;i++){ell(c,x+dx*i,y+dy*i,4.2,2.8,lg(c,0,y-3,0,y+3,[[0,'#d8c48c'],[1,'#a58e58']]),'rgba(60,40,10,.6)',.8,Math.atan2(dy,dx))}}
function crate(c,x,y,s,col){box(c,x,y,s,s,col||'#9a6b3a','#2a1a0a',1);c.strokeStyle='rgba(0,0,0,.35)';c.beginPath();c.moveTo(x,y);c.lineTo(x+s,y+s);c.moveTo(x+s,y);c.lineTo(x,y+s);c.stroke()}
function star(c,x,y,r,col){c.fillStyle=col;c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rd=i%2?r*.45:r;c.lineTo(x+Math.cos(a)*rd,y+Math.sin(a)*rd)}c.closePath();c.fill()}

/* ---------- Buildings ---------- */
const BDRAW={
 hq(c){slab(c,47,'#767c83','#4d5359');
  c.strokeStyle='#e0b020';c.lineWidth=2;c.setLineDash([6,5]);rr(c,-43,-43,86,86,3);c.stroke();c.setLineDash([]);
  roof(c,-34,-34,56,46,'#8ea0b4','#566677',4);for(let i=0;i<5;i++)box(c,-30+i*10,-30,6,3,'#ffd86b','#6a5000',.5);
  vent(c,-28,-14,10,8);vent(c,-14,-14,10,8);circ(c,8,-6,6,'#3a444f','#111',1);circ(c,8,-6,3,'#6fd0ff');
  c.strokeStyle='#1a1e22';c.lineWidth=1.5;c.beginPath();c.moveTo(-6,-33);c.lineTo(-6,-46);c.stroke();circ(c,-6,-46,2,'#ff4d3d');
  circ(c,26,26,16,'#2f353b','#dadada',2);c.fillStyle='#e8e8e8';c.font='bold 17px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('H',26,27);
  box(c,-40,20,26,18,'#4a5a3a','#1d2616',2);star(c,-27,29,5,'#dcdcdc');
  sandbags(c,-8,38,4,8,0);sandbags(c,-42,-4,3,0,8);
  c.fillStyle='#333';c.fillRect(30,-40,1.5,18);c.fillStyle='#d33';c.beginPath();c.moveTo(31.5,-40);c.lineTo(42,-36);c.lineTo(31.5,-31);c.fill()},
 house(c){shadowRR(c,-12,-11,24,22,2,3);const l=lg(c,-13,-12,0,12,[[0,'#b4553f'],[1,'#7b3427']]),r=lg(c,0,-12,13,12,[[0,'#d27a56'],[1,'#98482f']]);
  c.fillStyle=l;c.fillRect(-13,-12,13,24);c.fillStyle=r;c.fillRect(0,-12,13,24);c.strokeStyle='rgba(0,0,0,.5)';c.lineWidth=1;c.strokeRect(-13,-12,26,24);
  c.strokeStyle='rgba(0,0,0,.22)';for(let i=1;i<6;i++){c.beginPath();c.moveTo(-13,-12+i*4);c.lineTo(13,-12+i*4);c.stroke()}
  c.strokeStyle='rgba(255,255,255,.3)';c.beginPath();c.moveTo(0,-12);c.lineTo(0,12);c.stroke();box(c,5,-9,5,5,'#2f2a28','#111',.5);circ(c,-6,7,1.4,'#ffd35a')},
 market(c){slab(c,30,'#c4b896','#8f8467');const cols=[['#d44','#f5f5f5'],['#3a78d0','#f5f5f5'],['#3da05a','#f5f5f5']];
  cols.forEach((cl,i)=>{const x=-26+i*18,y=-24;shadowRR(c,x,y,16,30,2,2);for(let k=0;k<6;k++){c.fillStyle=k%2?cl[1]:cl[0];c.fillRect(x,y+k*5,16,5)}c.strokeStyle='rgba(0,0,0,.5)';c.strokeRect(x,y,16,30);c.fillStyle='rgba(255,255,255,.18)';c.fillRect(x,y,16,3)});
  crate(c,-24,12,9,'#a87b42');crate(c,-13,14,8,'#7b8c4e');crate(c,6,13,10,'#a87b42');circ(c,22,18,6,'#f2c230','#6b4d00',1.2);c.fillStyle='#6b4d00';c.font='bold 8px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('$',22,18.5);
  for(let i=0;i<7;i++)circ(c,-27+i*9,-27,1.3,'#ffe28a')},
 mine(c){slab(c,30,'#6f6a62','#4a4640');ell(c,0,2,21,19,rg(c,0,2,2,21,[[0,'#0c0a08'],[.7,'#2a241c'],[1,'#5b5348']]),'#2a251f',1.5);
  c.strokeStyle='#8a847a';c.lineWidth=2;c.beginPath();c.moveTo(-6,-18);c.lineTo(0,2);c.lineTo(6,-18);c.moveTo(-6,22);c.lineTo(0,2);c.lineTo(6,22);c.stroke();
  box(c,12,-24,16,10,'#3b4046','#111',2);for(let i=0;i<4;i++){c.fillStyle='#d8962b';c.fillRect(14+i*3.5,-22,2,6)}
  for(const[x,y,r]of[[-22,20,6],[-16,24,4.5],[22,22,5],[24,-4,4]]){circ(c,x,y,r,lg(c,x-r,y-r,x+r,y+r,[[0,'#6c6a70'],[1,'#26252a']]),'#111',.8);circ(c,x-1,y-1,r*.3,'#5ad0e8')}
  box(c,-28,-26,12,8,'#d8962b','#5a3a00',2)},
 derrick(c){slab(c,30,'#6a6e72','#43484c');ell(c,-12,10,13,9,rg(c,-12,10,1,13,[[0,'#050505'],[1,'#222']]),'#000',1);ell(c,-15,7,5,2.5,'rgba(120,200,255,.35)');
  circ(c,20,-18,8,lg(c,12,-26,28,-10,[[0,'#b9c0c6'],[1,'#6b7278']]),'#222',1.2);circ(c,20,-18,5,null,'rgba(0,0,0,.4)');
  c.strokeStyle='#d8a020';c.lineWidth=2;c.beginPath();c.moveTo(-18,-20);c.lineTo(-18,6);c.moveTo(12,-18);c.lineTo(-12,10);c.stroke();
  box(c,-24,-26,14,10,'#d8962b','#5a3a00',2);c.strokeStyle='#333';c.lineWidth=1.5;c.beginPath();c.moveTo(-12,-6);c.lineTo(8,-6);c.lineTo(8,22);c.stroke()},
 derrickW(c){shadowRR(c,-29,-29,58,58,4,5);rr(c,-30,-30,60,60,4);c.fillStyle=lg(c,-30,-30,30,30,[[0,'#8a6b42'],[1,'#5a4328']]);c.fill();c.strokeStyle='#2a1c0c';c.lineWidth=1.5;c.stroke();
  c.strokeStyle='rgba(0,0,0,.35)';for(let i=-24;i<30;i+=7){c.beginPath();c.moveTo(-30,i);c.lineTo(30,i);c.stroke()}
  for(const[x,y]of[[-26,-26],[26,-26],[-26,26],[26,26]])circ(c,x,y,3,'#aab','#222',1);
  circ(c,-10,6,11,rg(c,-10,6,1,11,[[0,'#000'],[1,'#222']]));circ(c,20,-16,8,lg(c,12,-24,28,-8,[[0,'#c7ccd1'],[1,'#69707a']]),'#222',1.2);
  c.strokeStyle='#d8a020';c.lineWidth=2;c.beginPath();c.moveTo(-18,-22);c.lineTo(-18,4);c.moveTo(10,-14);c.lineTo(-10,8);c.stroke();circ(c,0,-4,2,'#ff5030')},
 barracks(c){slab(c,30,'#6b7062','#464a3f');roof(c,-26,-22,40,26,'#6f8a4a','#3f5429',3);c.strokeStyle='rgba(0,0,0,.3)';for(let i=1;i<5;i++){c.beginPath();c.moveTo(-26,-22+i*5);c.lineTo(14,-22+i*5);c.stroke()}
  c.strokeStyle='rgba(255,255,255,.25)';c.beginPath();c.moveTo(-26,-9);c.lineTo(14,-9);c.stroke();vent(c,-20,-18,8,6);vent(c,0,-18,8,6);star(c,-6,-9,6,'#e8e8d0');
  for(const[x,y]of[[18,-18],[18,0]]){shadowRR(c,x,y,10,16,2,2);c.fillStyle=lg(c,x,y,x+10,y,[[0,'#8a8d60'],[1,'#5a5d3a']]);c.fillRect(x,y,10,16);c.strokeStyle='#2a2c18';c.strokeRect(x,y,10,16);c.beginPath();c.moveTo(x+5,y);c.lineTo(x+5,y+16);c.stroke()}
  sandbags(c,-20,16,5,9,0);sandbags(c,-26,-6,0,0,0);c.fillStyle='#444';c.fillRect(24,20,1.5,-14);c.fillStyle='#3a8a3a';c.fillRect(25.5,6,9,6)},
 factory(c){slab(c,47,'#6f747a','#444a50');
  for(let i=0;i<4;i++){const y=-38+i*18;shadowRR(c,-38,y,64,15,1,2);box(c,-38,y,64,15,lg(c,0,y,0,y+15,[[0,'#9aa5b0'],[1,'#5f6a76']]),'#1e2328',1);for(let k=0;k<5;k++)box(c,-34+k*12.5,y+2,9,4,'rgba(130,220,255,.75)','#245',.5);c.strokeStyle='rgba(255,255,255,.3)';c.beginPath();c.moveTo(-38,y+1);c.lineTo(26,y+1);c.stroke()}
  circ(c,36,-30,7,lg(c,29,-37,43,-23,[[0,'#a85a3a'],[1,'#5a2a1a']]),'#1a0a05',1.5);circ(c,36,-30,3.5,'#1c1c1c');
  box(c,-38,34,64,9,'#2b2f34','#000',1);for(let i=0;i<8;i++){c.fillStyle=i%2?'#e6b800':'#222';c.fillRect(-38+i*8,34,8,3)}
  circ(c,36,10,10,'#444a50','#111',1.5);c.fillStyle='#d8d8d8';for(let i=0;i<8;i++){const a=i/8*TAU;c.fillRect(36+Math.cos(a)*8-1.5,10+Math.sin(a)*8-1.5,3,3)}circ(c,36,10,4,'#222');
  crate(c,32,28,8,'#8a8f59');crate(c,40,33,6,'#a87b42')},
 airfield(c){shadowRR(c,-47,-47,94,94,4,5);rr(c,-48,-48,96,96,4);c.fillStyle=lg(c,-48,-48,48,48,[[0,'#3a3f44'],[1,'#25292d']]);c.fill();c.strokeStyle='#111';c.lineWidth=1.5;c.stroke();
  c.fillStyle='#e8e8e8';for(let i=0;i<6;i++)c.fillRect(-6,-44+i*15,3,8);c.fillStyle='#ddd';for(let i=0;i<8;i++){c.fillRect(-44+i*4,-46,2.4,9);c.fillRect(-44+i*4,38,2.4,9)}
  c.strokeStyle='#e6b800';c.lineWidth=1.5;c.setLineDash([5,4]);c.beginPath();c.moveTo(-22,-44);c.lineTo(-22,44);c.moveTo(14,-20);c.lineTo(14,44);c.stroke();c.setLineDash([]);
  roof(c,16,-44,30,26,'#8d98a3','#56616c',12);c.strokeStyle='rgba(0,0,0,.3)';for(let i=1;i<6;i++){c.beginPath();c.moveTo(18+i*4.5,-42);c.lineTo(18+i*4.5,-20);c.stroke()}
  circ(c,31,22,12,'#2c3136','#ddd',1.5);c.fillStyle='#ddd';c.font='bold 12px sans-serif';c.textAlign='center';c.textBaseline='middle';c.fillText('H',31,23);
  circ(c,-36,-30,5,'#9ab','#222',1);circ(c,-36,-30,2.5,'#6fd0ff');c.fillStyle='#e8601c';c.beginPath();c.moveTo(-34,30);c.lineTo(-24,28);c.lineTo(-24,34);c.fill();c.strokeStyle='#ccc';c.beginPath();c.moveTo(-34,26);c.lineTo(-34,40);c.stroke()},
 harbor(c){shadowRR(c,-30,-30,60,60,3,5);rr(c,-31,-31,62,62,3);c.fillStyle=lg(c,-31,-31,31,31,[[0,'#9a7a4c'],[1,'#6a5030']]);c.fill();c.strokeStyle='#2a1c0c';c.lineWidth=1.5;c.stroke();
  c.strokeStyle='rgba(0,0,0,.3)';for(let i=-27;i<31;i+=6){c.beginPath();c.moveTo(-31,i);c.lineTo(31,i);c.stroke()}
  const cols=['#b8412c','#2f6fa8','#d29a2a','#4a8a4a'];for(let i=0;i<4;i++){const x=-27+(i%2)*15,y=-27+((i/2)|0)*13;box(c,x,y,13,10,cols[i],'#111',1);c.strokeStyle='rgba(0,0,0,.35)';for(let k=1;k<4;k++){c.beginPath();c.moveTo(x+k*3.2,y);c.lineTo(x+k*3.2,y+10);c.stroke()}}
  c.strokeStyle='#e0b020';c.lineWidth=3;c.beginPath();c.moveTo(6,26);c.lineTo(22,-18);c.stroke();c.lineWidth=1.5;c.beginPath();c.moveTo(22,-18);c.lineTo(4,-24);c.stroke();box(c,16,18,12,12,'#6a7078','#111',1);
  for(const[x,y]of[[-28,28],[28,28],[-28,-4]])circ(c,x,y,2.4,'#222','#999',1);box(c,-8,6,12,14,'#4a6a8a','#111',2)},
 lab(c){slab(c,30,'#cfd6dc','#8f98a1');roof(c,-24,-24,34,30,'#f0f4f7','#aeb8c2',4);rr(c,-20,-20,26,14,3);c.fillStyle=lg(c,-20,-20,6,-6,[[0,'#7fd8ff'],[1,'#2a6aa0']]);c.fill();c.strokeStyle='#234';c.stroke();
  c.strokeStyle='rgba(255,255,255,.5)';c.beginPath();c.moveTo(-14,-20);c.lineTo(-14,-6);c.moveTo(-6,-20);c.lineTo(-6,-6);c.stroke();
  circ(c,-9,2,3.4,'#2a3',null);c.fillStyle='#4cff6a';c.beginPath();c.moveTo(-9,-2);c.lineTo(-13,6);c.lineTo(-5,6);c.fill();c.strokeStyle='#143';c.stroke();
  for(let i=0;i<3;i++)box(c,12,-24+i*9,14,7,lg(c,12,0,26,0,[[0,'#2a52a0'],[1,'#17306a']]),'#0a1a40',1);circ(c,18,16,7,'#e6ebef','#444',1);circ(c,18,16,2,'#e44');
  circ(c,-18,14,3,rg(c,-18,14,0,5,[[0,'#8fff9a'],[1,'rgba(60,255,100,0)']]))},
 hospital(c){slab(c,30,'#d7dde2','#98a2ab');roof(c,-25,-25,50,50,'#f7f9fb','#c4ccd4',5);c.fillStyle='#d83030';c.fillRect(-4,-17,8,34);c.fillRect(-17,-4,34,8);c.strokeStyle='#6a1010';c.lineWidth=1;c.strokeRect(-4,-17,8,34);
  for(const[x,y]of[[-22,-22],[16,-22],[-22,16],[16,16]])circ(c,x+3,y+3,2.6,'#6fc0ff','#246',.8);vent(c,14,6,8,8)},
 radar(c){slab(c,30,'#70777e','#484e54');circ(c,0,0,20,lg(c,-20,-20,20,20,[[0,'#8e969e'],[1,'#50565c']]),'#1a1d20',1.5);circ(c,0,0,14,'#3a4046','#111',1);box(c,-26,18,14,8,'#d8962b','#5a3a00',2);circ(c,22,-22,3,'#ff5a4a')},
 wall(c,m,st){const PAL={steel:['#a8b2bc','#5f6a74','#cdd5dc','#707b86'],sand:['#dcc88e','#94804c','#e8d8a0','#a08a52'],conc:['#c4c4bc','#74746c','#d8d8d0','#80807a'],spike:['#8a6a4a','#4a3220','#a88058','#5a4028'],plas:['#9ae0f0','#2a6a88','#c8f4ff','#3a8aa8'],shock:['#b8b8f0','#40409a','#dcdcff','#5050b0']};const P=PAL[st]||PAL.steel;const w=14;const arm=(x,y,ww,hh)=>{box(c,x,y,ww,hh,lg(c,x,y,x+ww,y+hh,[[0,P[0]],[1,P[1]]]),'#1b1f23',1)};
  c.fillStyle='rgba(0,0,0,.28)';if(m&1)c.fillRect(-7+3,-18+4,14,18);if(m&2)c.fillRect(0+3,-7+4,18,14);if(m&4)c.fillRect(-7+3,0+4,14,18);if(m&8)c.fillRect(-18+3,-7+4,18,14);rr(c,-9+3,-9+4,18,18,3);c.fill();
  if(m&1)arm(-7,-16,14,16);if(m&2)arm(0,-7,16,14);if(m&4)arm(-7,0,14,16);if(m&8)arm(-16,-7,16,14);
  rr(c,-10,-10,20,20,4);c.fillStyle=lg(c,-10,-10,10,10,[[0,P[2]],[1,P[3]]]);c.fill();c.strokeStyle='#14181c';c.lineWidth=1.2;c.stroke();
  if(st==='sand'){c.strokeStyle='rgba(60,40,10,.5)';c.lineWidth=1;for(const y of[-4,3])c.strokeRect(-8,y,16,5)}
  if(st==='spike'){c.fillStyle='#d8d8d8';c.strokeStyle='#222';c.lineWidth=.8;for(let i=0;i<8;i++){const a=i/8*TAU;c.beginPath();c.moveTo(Math.cos(a)*13,Math.sin(a)*13);c.lineTo(Math.cos(a+.2)*8,Math.sin(a+.2)*8);c.lineTo(Math.cos(a-.2)*8,Math.sin(a-.2)*8);c.closePath();c.fill();c.stroke()}}
  if(st==='shock'){c.strokeStyle='#fff7a0';c.lineWidth=1.4;c.beginPath();c.moveTo(-7,-4);c.lineTo(-2,0);c.lineTo(-4,1);c.lineTo(3,6);c.moveTo(1,-7);c.lineTo(4,-2);c.lineTo(7,-3);c.stroke()}
  if(st==='plas'){c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=1;c.strokeRect(-7,-7,14,14)}
  if(st==='conc'){c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=1;c.beginPath();c.moveTo(-10,0);c.lineTo(10,0);c.stroke()}

  for(const[x,y]of[[-6,-6],[6,-6],[-6,6],[6,6]])circ(c,x,y,1.5,'#2b3036');c.strokeStyle='rgba(255,255,255,.35)';c.beginPath();c.moveTo(-8,-8);c.lineTo(8,-8);c.stroke()},
 mgtower(c){for(let i=0;i<10;i++){const a=i/10*TAU;ell(c,Math.cos(a)*11,Math.sin(a)*11,5,3.3,lg(c,0,-3,0,3,[[0,'#dac68e'],[1,'#a58e58']]),'rgba(60,40,10,.7)',.8,a+Math.PI/2)}circ(c,0,0,8,lg(c,-8,-8,8,8,[[0,'#8a9096'],[1,'#454b50']]),'#111',1)},
 flametower(c){circ(c,2,3,13,'rgba(0,0,0,.3)');circ(c,0,0,13,lg(c,-13,-13,13,13,[[0,'#9a8a7a'],[1,'#4a4038']]),'#111',1.2);circ(c,0,0,9,lg(c,-9,-9,9,9,[[0,'#e86a30'],[1,'#8a2a10']]),'#2a0a00',1);c.strokeStyle='rgba(0,0,0,.4)';c.beginPath();c.arc(0,0,6,0,TAU);c.stroke();c.fillStyle='#ffd040';c.fillRect(-1,-12,2,4)},
 snipertower(c){shadowRR(c,-12,-12,24,24,2,3);rr(c,-13,-13,26,26,2);c.fillStyle=lg(c,-13,-13,13,13,[[0,'#8a7050'],[1,'#4f3f2a']]);c.fill();c.strokeStyle='#111';c.stroke();c.strokeStyle='rgba(0,0,0,.35)';for(let i=-9;i<13;i+=5){c.beginPath();c.moveTo(-13,i);c.lineTo(13,i);c.stroke()}for(const[x,y]of[[-11,-11],[11,-11],[-11,11],[11,11]])circ(c,x,y,2,'#222');rr(c,-8,-8,16,16,2);c.strokeStyle='#d8c8a0';c.lineWidth=1.5;c.stroke()},
 tesla(c){slab(c,30,'#4a5260','#2a2f38');for(const[x,y]of[[-22,-22],[22,-22],[-22,22],[22,22]]){circ(c,x,y,5,lg(c,x-5,y-5,x+5,y+5,[[0,'#9aa'],[1,'#445']]),'#111',1);circ(c,x,y,2,'#7fd8ff')}
  circ(c,0,0,18,lg(c,-18,-18,18,18,[[0,'#7a828e'],[1,'#323842']]),'#0a0c10',1.5);circ(c,0,0,13,null,'#c08040',3);circ(c,0,0,8,lg(c,-8,-8,8,8,[[0,'#d99a50'],[1,'#7a4a1a']]),'#2a1500',1);circ(c,0,0,4,rg(c,0,0,0,5,[[0,'#fff'],[1,'#7fd8ff']]))},
 aasite(c){slab(c,30,'#6a6e62','#40443a');for(let i=0;i<14;i++){const a=i/14*TAU;ell(c,Math.cos(a)*22,Math.sin(a)*22,5,3.3,lg(c,0,-3,0,3,[[0,'#dac68e'],[1,'#a58e58']]),'rgba(60,40,10,.7)',.8,a+Math.PI/2)}circ(c,0,0,15,lg(c,-15,-15,15,15,[[0,'#78806a'],[1,'#3a4030']]),'#111',1.2)},
 arty(c){slab(c,30,'#7a7a74','#4a4a44');for(let i=0;i<16;i++){const a=i/16*TAU;ell(c,Math.cos(a)*24,Math.sin(a)*24,5,3.2,lg(c,0,-3,0,3,[[0,'#dac68e'],[1,'#a58e58']]),'rgba(60,40,10,.7)',.8,a+Math.PI/2)}circ(c,0,0,15,lg(c,-15,-15,15,15,[[0,'#68705c'],[1,'#30382a']]),'#111',1.2);crate(c,16,-28,6,'#7b8c4e');crate(c,-26,12,6,'#7b8c4e')}
};
const BTURRET={
 mgtower(c){box(c,-5,-4,10,8,'#3a4046','#111',2);box(c,2,-1.5,16,3,'#222','#000',1);circ(c,-3,-6,3.5,'#555','#111',1);c.fillStyle='#ffcc40';c.fillRect(17,-1,2,2)},
 flametower(c){box(c,-4,-4,8,8,'#333','#111',2);box(c,2,-2.2,13,4.4,lg(c,0,-3,0,3,[[0,'#999'],[1,'#444']]),'#111',1.5);circ(c,15,0,2.5,'#ffcc40')},
 snipertower(c){box(c,-6,-3,11,6,'#2c3036','#111',2);box(c,3,-1.2,23,2.4,'#1c1f22','#000',.8);box(c,-1,-5,8,2.4,'#6fb0e0','#123',1);circ(c,-4,0,3,'#cfa87a')},
 aasite(c){box(c,-9,-9,18,18,lg(c,-9,-9,9,9,[[0,'#8a927a'],[1,'#454c38']]),'#111',3);box(c,4,-6,22,3.4,'#222','#000',1);box(c,4,2.6,22,3.4,'#222','#000',1);box(c,22,-6.5,4,4,'#555','#000',1);box(c,22,2.2,4,4,'#555','#000',1)},
 arty(c){box(c,-10,-9,16,18,lg(c,-10,-9,6,9,[[0,'#7a8268'],[1,'#3f4630']]),'#111',3);box(c,4,-3.2,34,6.4,lg(c,0,-4,0,4,[[0,'#8a8f84'],[1,'#3a3f38']]),'#111',1.5);box(c,34,-4.5,6,9,'#333','#000',1);box(c,-14,-4,6,8,'#555','#111',1)},
 tesla(){}
};
const WALLMASK={};
function buildingSprite(type,mask){const d=B[type];const px=d.size*32+16;
 if(d.wall){mask=mask|0;return mkSpr('w'+type+mask,48,48,c=>BDRAW.wall(c,mask,d.style))}
 return mkSpr('b_'+type+(mask==='w'?'W':''),px,px,c=>BDRAW[type==='derrick'&&mask==='w'?'derrickW':type](c))}
function buildingTurret(type){if(!BTURRET[type]||type==='tesla')return null;return mkSpr('bt_'+type,60,60,c=>BTURRET[type](c))}

/* ---------- Player units (facing +x) ---------- */
function infSprite_base(type,f){return mkSpr('i_'+type+f,34,34,c=>{
 const s=f?2.6:-2.6;circ(c,s-1,-4,2.6,'#1c1c1c');circ(c,-s-1,4,2.6,'#1c1c1c');
 const body={rifleman:['#6a7d4a','#3f4d2a'],flamer:['#9a5a2c','#5a2c10'],sniper:['#5a6a44','#2f3a22'],medic:['#e8ecee','#9aa4aa'],engineer:['#c08a2c','#6a4810']}[type];
 if(type==='flamer'){ell(c,-6,0,4.5,5.5,lg(c,-10,-5,-2,5,[[0,'#ff8a3a'],[1,'#a02a08']]),'#300',1)}
 if(type==='medic'){box(c,-9,-5,6,10,'#ddd','#555',1.5);c.fillStyle='#d33';c.fillRect(-7.5,-1,3,2);c.fillRect(-6.5,-2.4,1,5)}
 if(type==='engineer'){box(c,-10,-5,7,10,'#6a4a20','#2a1a08',1.5)}
 if(type==='sniper'){ell(c,-3,0,7,8,'#4a5a30');c.fillStyle='rgba(60,90,40,.9)';for(let i=0;i<7;i++){c.beginPath();c.arc(-7+i*.8,-7+i*2.4,2,0,TAU);c.fill()}}
 ell(c,0,0,5.2,8.2,lg(c,-5,-8,5,8,[[0,body[0]],[1,body[1]]]),'rgba(0,0,0,.7)',1);
 c.strokeStyle=type==='medic'?'#cfd6da':body[0];c.lineWidth=3.4;c.lineCap='round';c.beginPath();c.moveTo(0,-6.5);c.lineTo(7,-4.5);c.moveTo(0,6.5);c.lineTo(8,3);c.stroke();c.lineCap='butt';
 if(type==='rifleman'||type==='medic'||type==='engineer'){box(c,2,1.2,15,2.6,'#222','#000',.8);box(c,5,.2,6,2,'#3a3a3a',null,.5)}
 if(type==='sniper'){box(c,1,.8,22,2.2,'#1a1a1a','#000',.6);box(c,6,-1.5,7,1.8,'#6fb0e0','#123',.5)}
 if(type==='flamer'){box(c,3,.8,12,3,'#555','#111',1);circ(c,15,2.3,2.2,'#ffb030')}
 if(type==='engineer'){box(c,3,-9,5,4,'#ddd','#444',1);c.strokeStyle='#bbb';c.lineWidth=1.5;c.beginPath();c.moveTo(4,5.5);c.lineTo(11,10);c.stroke()}
 const hc={rifleman:'#5a6a3a',flamer:'#7a3a1c',sniper:'#4a5a2a',medic:'#f2f4f5',engineer:'#f2c230'}[type];
 circ(c,1,0,4.6,rg(c,-.5,-1.5,.5,5,[[0,hc],[1,'#222']]),'#111',1);if(type==='medic'){c.fillStyle='#d33';c.fillRect(0,-.8,3,1.6);c.fillRect(.7,-1.5,1.6,3)}
 if(type==='sniper'){c.strokeStyle='rgba(255,255,255,.25)';c.beginPath();c.arc(1,0,3,-1,1);c.stroke()}
})}
function vehSprite_base(type){return mkSpr('v_'+type,64,48,c=>{
 if(type==='jeep'){for(const[x,y]of[[-9,-9],[9,-9],[-9,9],[9,9]])box(c,x-4,y-2.5,8,5,'#151515','#000',1.5);
  rr(c,-14,-8,28,16,4);c.fillStyle=lg(c,-14,-8,14,8,[[0,'#7a8a4c'],[1,'#44502a']]);c.fill();c.strokeStyle='#161c0c';c.lineWidth=1.2;c.stroke();box(c,3,-6,7,12,'rgba(150,210,230,.7)','#123',1.5);box(c,-12,-5,9,10,'#2f3a1c',null,1);c.strokeStyle='rgba(255,255,255,.25)';c.beginPath();c.moveTo(-12,-7);c.lineTo(10,-7);c.stroke();circ(c,14,-5,1.5,'#ffe9a0');circ(c,14,5,1.5,'#ffe9a0')}
 if(type==='tank'){for(const y of[-12,6]){box(c,-20,y,40,8,'#222','#000',3);c.strokeStyle='#444';for(let i=-18;i<20;i+=4){c.beginPath();c.moveTo(i,y+1);c.lineTo(i,y+7);c.stroke()}}
  rr(c,-19,-10,38,20,5);c.fillStyle=lg(c,-19,-10,19,10,[[0,'#7d8a52'],[1,'#454f2a']]);c.fill();c.strokeStyle='#14180a';c.lineWidth=1.3;c.stroke();vent(c,-16,-6,7,12);box(c,10,-6,6,12,'rgba(0,0,0,.25)',null,2);c.strokeStyle='rgba(255,255,255,.22)';c.beginPath();c.moveTo(-16,-9);c.lineTo(16,-9);c.stroke()}
 if(type==='artillery'){for(const y of[-12,6]){box(c,-20,y,40,8,'#222','#000',3);c.strokeStyle='#444';for(let i=-18;i<20;i+=4){c.beginPath();c.moveTo(i,y+1);c.lineTo(i,y+7);c.stroke()}}
  rr(c,-20,-9,36,18,4);c.fillStyle=lg(c,-20,-9,16,9,[[0,'#8a8660'],[1,'#4c4a30']]);c.fill();c.strokeStyle='#18160a';c.lineWidth=1.2;c.stroke();box(c,-18,-5,8,10,'#333','#111',1.5);box(c,-23,-3,6,6,'#555','#111',1)}
})}
function vehTurret_base(type){return mkSpr('vt_'+type,70,50,c=>{
 if(type==='jeep'){circ(c,0,0,4,'#333','#000',1);box(c,0,-1.4,13,2.8,'#1a1a1a','#000',.8);box(c,-3,-3.5,4,7,'#555','#111',1)}
 if(type==='tank'){ell(c,-1,0,13,11,lg(c,-13,-11,13,11,[[0,'#8a9660'],[1,'#4c5730']]),'#12160a',1.4);box(c,6,-2.6,26,5.2,lg(c,0,-3,0,3,[[0,'#8a8f84'],[1,'#32362e']]),'#0a0a0a',1.5);box(c,30,-3.5,5,7,'#2a2a2a','#000',1);circ(c,-4,-4,3,'#2a3020','#000',1);circ(c,-5,5,2,'#aab')}
 if(type==='artillery'){box(c,-12,-7,22,14,lg(c,-12,-7,10,7,[[0,'#8a8660'],[1,'#4c4a30']]),'#18160a',3);box(c,6,-2.8,30,5.6,lg(c,0,-3,0,3,[[0,'#92968a'],[1,'#33362e']]),'#0a0a0a',1.5);box(c,33,-4.2,6,8.4,'#333','#000',1)}
})}
function airSprite_base(type){return mkSpr('a_'+type,type==='bomber'?110:90,type==='bomber'?110:90,c=>{
 if(type==='drone'){c.strokeStyle='#222';c.lineWidth=2.4;c.beginPath();c.moveTo(-9,-9);c.lineTo(9,9);c.moveTo(9,-9);c.lineTo(-9,9);c.stroke();rr(c,-6,-4.5,12,9,3);c.fillStyle=lg(c,-6,-5,6,5,[[0,'#8a9aa8'],[1,'#3f4852']]);c.fill();c.strokeStyle='#111';c.lineWidth=1;c.stroke();circ(c,5,0,1.8,'#ff4a3a');for(const[x,y]of[[-9,-9],[9,-9],[-9,9],[9,9]])circ(c,x,y,2.6,'#2a2a2a')}
 if(type==='gunship'){c.strokeStyle='#2a2f2a';c.lineWidth=2.4;c.beginPath();c.moveTo(-8,0);c.lineTo(-30,0);c.stroke();c.fillStyle='#3a423a';c.beginPath();c.moveTo(-28,0);c.lineTo(-33,-7);c.lineTo(-30,-7);c.lineTo(-25,0);c.fill();box(c,-31,-1.5,6,3,'#3a423a','#111',1);
  ell(c,0,0,17,7.5,lg(c,-17,-7,17,7,[[0,'#5a6a52'],[1,'#2c3628']]),'#0e120c',1.3);ell(c,10,0,7,5,lg(c,0,-5,10,5,[[0,'#9ee0ff'],[1,'#2a6a8a']]),'#123',1);box(c,-6,-12,12,3,'#222','#000',1);box(c,-6,9,12,3,'#222','#000',1);box(c,-8,-10,5,3,'#444','#111',.8);box(c,-8,7,5,3,'#444','#111',.8);circ(c,0,0,3.5,'#222')}
 if(type==='fighter'){c.fillStyle=lg(c,-20,-20,20,20,[[0,'#8e9aa6'],[1,'#3f4852']]);c.beginPath();c.moveTo(24,0);c.lineTo(-4,-4);c.lineTo(-18,-22);c.lineTo(-22,-20);c.lineTo(-14,-4);c.lineTo(-24,-3);c.lineTo(-27,-8);c.lineTo(-29,-7);c.lineTo(-27,0);c.lineTo(-29,7);c.lineTo(-27,8);c.lineTo(-24,3);c.lineTo(-14,4);c.lineTo(-22,20);c.lineTo(-18,22);c.lineTo(-4,4);c.closePath();c.fill();c.strokeStyle='#0a0c10';c.lineWidth=1.3;c.stroke();ell(c,6,0,7,3,lg(c,0,-3,10,3,[[0,'#9ee0ff'],[1,'#1f5a7a']]),'#123',.8);c.fillStyle='#ff7a30';c.fillRect(-30,-1.5,3,3)}
 if(type==='bomber'){c.fillStyle=lg(c,-40,-40,40,40,[[0,'#7d8a74'],[1,'#3a4434']]);c.beginPath();c.moveTo(34,0);c.lineTo(10,-4);c.lineTo(-4,-44);c.lineTo(-14,-44);c.lineTo(-10,-5);c.lineTo(-34,-3);c.lineTo(-40,-12);c.lineTo(-44,-12);c.lineTo(-40,0);c.lineTo(-44,12);c.lineTo(-40,12);c.lineTo(-34,3);c.lineTo(-10,5);c.lineTo(-14,44);c.lineTo(-4,44);c.lineTo(10,4);c.closePath();c.fill();c.strokeStyle='#0c100a';c.lineWidth=1.4;c.stroke();
  ell(c,14,0,8,4,lg(c,0,-4,16,4,[[0,'#9ee0ff'],[1,'#1f5a7a']]),'#123',.8);for(const y of[-24,-12,12,24])box(c,-4,y-3,10,6,'#2a2f28','#000',2);star(c,-10,-26,4,'#e8e8d0');star(c,-10,26,4,'#e8e8d0')}
})}
function navSprite_base(type){const w={patrol:78,destroyer:124,battleship:178}[type];return mkSpr('n_'+type,w,52,c=>{
 const L=w/2-6;const hull=(len,wd,c1,c2)=>{c.beginPath();c.moveTo(len,0);c.quadraticCurveTo(len*.7,-wd,len*.1,-wd);c.lineTo(-len+4,-wd*.9);c.lineTo(-len,-wd*.7);c.lineTo(-len,wd*.7);c.lineTo(-len+4,wd*.9);c.lineTo(len*.1,wd);c.quadraticCurveTo(len*.7,wd,len,0);c.closePath();c.fillStyle=lg(c,0,-wd,0,wd,[[0,c1],[1,c2]]);c.fill();c.strokeStyle='#0a0d10';c.lineWidth=1.4;c.stroke()};
 if(type==='patrol'){hull(L,8,'#9aa7b0','#4a565f');box(c,-14,-5,22,10,lg(c,0,-5,0,5,[[0,'#cfd6da'],[1,'#7a858c']]),'#111',2);box(c,-4,-3.5,8,7,'rgba(140,210,230,.8)','#123',1);c.fillStyle='#d33';c.fillRect(-L+4,-1.2,4,2.4)}
 if(type==='destroyer'){hull(L,11,'#8b98a3','#3c474f');box(c,-30,-8,50,16,lg(c,0,-8,0,8,[[0,'#7a8790'],[1,'#4a555d']]),'#111',2);box(c,-10,-7,20,14,lg(c,0,-7,0,7,[[0,'#cfd6da'],[1,'#8a959c']]),'#111',2);box(c,-4,-4,8,8,'rgba(140,210,230,.8)','#123',1);circ(c,-20,0,3,'#333');c.strokeStyle='#999';c.lineWidth=1;c.beginPath();c.moveTo(-14,0);c.lineTo(10,0);c.stroke()}
 if(type==='battleship'){hull(L,15,'#7e8a94','#323c44');box(c,-60,-11,100,22,lg(c,0,-11,0,11,[[0,'#6e7a84'],[1,'#3e4850']]),'#111',3);box(c,-18,-10,34,20,lg(c,0,-10,0,10,[[0,'#bfc7cc'],[1,'#7a858c']]),'#111',3);box(c,-8,-6,14,12,'rgba(140,210,230,.8)','#123',2);circ(c,-44,0,5,'#2a3036','#111',1);c.strokeStyle='#aaa';c.beginPath();c.moveTo(-30,0);c.lineTo(34,0);c.stroke();circ(c,2,0,3,'#d33')}
})}
const NAVTUR={patrol:[],destroyer:[[34,0],[-38,0]],battleship:[[62,0],[40,0],[-62,0]]};
function navTurret_base(type){return mkSpr('nt_'+type,60,40,c=>{const big=type==='battleship';const s=big?1.25:.9;c.save();c.scale(s,s);circ(c,0,0,8,lg(c,-8,-8,8,8,[[0,'#8a949c'],[1,'#3a444c']]),'#0a0d10',1.2);box(c,3,-4.2,20,2.4,'#1c2024','#000',.7);box(c,3,1.8,20,2.4,'#1c2024','#000',.7);c.restore()})}

/* ---------- Zombies ---------- */
const CLOTH=[['#6a5a46','#3d3226'],['#3f566e','#25364a'],['#7a3f3f','#4a2020'],['#4d6040','#2c3a24']];
function eyes(c,x,y,fl){const col=fl&4?'#ff2a2a':'#ffe45a';circ(c,x,y-1.7,1.1,col);circ(c,x,y+1.7,1.1,col);if(fl&4){circ(c,x,y,4.5,rg(c,x,y,0,5,[[0,'rgba(255,40,40,.35)'],[1,'rgba(255,40,40,0)']]))}}
function bloodSpots(c,seed,n,sp){for(let i=0;i<n;i++){const a=hash2(seed,i,1)*TAU,r=hash2(seed,i,2)*sp;c.fillStyle='rgba(120,10,10,'+(.55+hash2(seed,i,3)*.3)+')';c.beginPath();c.arc(Math.cos(a)*r,Math.sin(a)*r,.9+hash2(seed,i,4)*1.6,0,TAU);c.fill()}}
function plates(c,sx,sy){c.fillStyle='#6b6458';c.strokeStyle='#2a251f';c.lineWidth=.8;for(const[x,y]of[[-3,-sy*.6],[-3,0],[-3,sy*.6]]){c.beginPath();c.moveTo(x-3,y-2.5);c.lineTo(x+3,y-1.5);c.lineTo(x+2.5,y+2.5);c.lineTo(x-3.5,y+2);c.closePath();c.fill();c.stroke()}}
function zombieSprite(type,fr,v,fl){const key='z_'+type+fr+v+'_'+fl;const big=type==='tyrant'?2.6:type==='brute'?1.7:type==='bloater'?1.5:1;
 return mkSpr(key,40*big,40*big,c=>{c.scale(big,big);const ph=fr/4*TAU,sw=Math.sin(ph);
  const skin=type==='drowned'?['#a8c0c0','#5a7a80']:type==='gargoyle'?['#8a7a96','#463a54']:type==='tyrant'?['#9a6a60','#4a2a28']:type==='bloater'?['#9aa860','#566228']:type==='spitter'?['#8aa858','#44602a']:['#9fb08c','#55664a'];
  const cl=CLOTH[v&3];
  if(type==='gargoyle'){const fl2=Math.sin(ph)*.5+.5;c.fillStyle=lg(c,-18,0,0,0,[[0,'#3a2a46'],[1,'#7a5a8a']]);for(const s of[-1,1]){c.beginPath();c.moveTo(0,s*4);c.quadraticCurveTo(-4,s*(14+fl2*8),-16,s*(18+fl2*10));c.quadraticCurveTo(-10,s*(10+fl2*4),-12,s*(6+fl2*3));c.quadraticCurveTo(-8,s*7,-6,s*5);c.quadraticCurveTo(-2,s*6,0,s*4);c.fill();c.strokeStyle='#1c1224';c.lineWidth=1;c.stroke()}}
  // legs
  if(type!=='gargoyle'){const l=sw*3;circ(c,l-1,-3.5,2.4,'#2a2420');circ(c,-l-1,3.5,2.4,'#2a2420')}
  if(type==='tyrant'){for(const s of[-1,1]){c.strokeStyle=skin[1];c.lineWidth=4;c.lineCap='round';c.beginPath();c.moveTo(-1,s*7);c.lineTo(-6,s*13);c.lineTo(-2+sw*2,s*15);c.stroke()}c.lineCap='butt'}
  // body
  const bw=type==='runner'?4.2:type==='brute'?7.5:type==='bloater'?9.5:5.6,bh=type==='runner'?7:type==='brute'?10:type==='bloater'?9.5:8;
  if(type==='bloater'){const pul=1+Math.sin(ph)*.05;ell(c,0,0,bw*pul,bh*pul,rg(c,-2,-2,1,10,[[0,'#d0e070'],[1,skin[1]]]),'#2a3010',1.2);for(const[x,y]of[[-3,-3],[2,4],[3,-4],[-4,4]])circ(c,x,y,2,'rgba(220,250,120,.55)','rgba(40,60,10,.6)',.6)}
  else{ell(c,0,0,bw,bh,lg(c,-bw,-bh,bw,bh,[[0,cl[0]],[1,cl[1]]]),'rgba(0,0,0,.7)',1)}
  if(type==='brute'){ell(c,1,0,5,8,'#a24a42');c.strokeStyle='#5a1a18';c.lineWidth=.8;for(let i=-6;i<=6;i+=3){c.beginPath();c.moveTo(-3,i);c.lineTo(5,i+1);c.stroke()}c.fillStyle='#d8d0c0';for(const y of[-9,-5,5,9]){c.beginPath();c.moveTo(-5,y);c.lineTo(-10,y*1.2);c.lineTo(-4,y*.9);c.fill()}}
  if(type==='tyrant'){c.fillStyle='#d0c8b8';for(let i=0;i<5;i++){const y=-8+i*4;c.beginPath();c.moveTo(-4,y);c.lineTo(-12,y*1.3);c.lineTo(-3,y+2);c.fill()}ell(c,1,0,5,8,'rgba(255,120,40,.5)');c.strokeStyle='#ff8a30';c.lineWidth=1;c.beginPath();c.moveTo(-3,-6);c.lineTo(1,-2);c.lineTo(-2,2);c.lineTo(3,6);c.stroke()}
  if(fl&1&&type!=='bloater'&&type!=='gargoyle')plates(c,bw,bh);
  if(fl&2){for(const[x,y]of[[2,-5],[-1,3],[3,5]])circ(c,x,y,1.6,'rgba(150,255,60,.9)')}
  bloodSpots(c,v*7+fr,type==='brute'?6:4,6);
  // arms
  const al=type==='runner'?7:type==='gargoyle'?5:type==='brute'?9:type==='screamer'?5:9;const off=type==='runner'?sw*3:sw*2.6;
  c.strokeStyle=skin[0];c.lineWidth=type==='brute'?4.4:type==='tyrant'?4.4:2.8;c.lineCap='round';
  const ay=bh-1;
  if(type==='runner'){c.beginPath();c.moveTo(0,-ay);c.lineTo(4+off,-ay-1.5);c.lineTo(1-off,-ay+2);c.moveTo(0,ay);c.lineTo(4-off,ay+1.5);c.lineTo(1+off,ay-2);c.stroke()}
  else if(type==='tyrant'){for(const s of[-1,1]){c.beginPath();c.moveTo(0,s*ay);c.lineTo(6,s*(ay+3));c.lineTo(14+off*s,s*(ay-1));c.stroke();c.beginPath();c.moveTo(-1,s*(ay-3));c.lineTo(5,s*(ay-9));c.lineTo(12-off*s,s*(ay-8));c.stroke()}c.fillStyle='#e8e0d0';for(const s of[-1,1]){c.beginPath();c.moveTo(14,s*(ay-1));c.lineTo(20,s*(ay-.5));c.lineTo(14,s*(ay-4));c.fill()}}
  else{c.beginPath();c.moveTo(0,-ay+1);c.lineTo(al+off,-ay+2);c.moveTo(0,ay-1);c.lineTo(al-off,ay-2);c.stroke();circ(c,al+off,-ay+2,1.6,skin[0]);circ(c,al-off,ay-2,1.6,skin[0])}
  c.lineCap='butt';
  if(type==='drowned'){c.strokeStyle='rgba(50,120,70,.8)';c.lineWidth=1.2;for(let i=0;i<4;i++){c.beginPath();c.moveTo(-3,-6+i*4);c.quadraticCurveTo(-8,-5+i*4,-10,-4+i*4+sw);c.stroke()}}
  // head
  const hr=type==='runner'?3.8:type==='brute'?3.6:type==='tyrant'?5:type==='bloater'?3.8:4.4;
  const hx=type==='bloater'?hr+5:type==='tyrant'?5:2;
  circ(c,hx,0,hr,rg(c,hx-1,-1,.5,hr+1,[[0,skin[0]],[1,skin[1]]]),'rgba(0,0,0,.75)',1);
  if(type==='screamer'){ell(c,hx+3,0,3,2.4,'#1a0508','#400',.8);c.fillStyle='#e8e0d0';c.fillRect(hx+4.6,-1.7,1,.9);c.fillRect(hx+4.6,.8,1,.9)}
  if(type==='spitter'){circ(c,hx-4,0,3.4,rg(c,hx-4,0,0,3.6,[[0,'#d8ff6a'],[1,'#4a7a10']]),'#2a4a08',.8);circ(c,hx+3,0,1.6,'#c8ff40')}
  if(type==='tyrant'){c.fillStyle='#d8d0c0';for(const s of[-1,1]){c.beginPath();c.moveTo(hx-1,s*3);c.lineTo(hx-8,s*7);c.lineTo(hx-3,s*1);c.fill()}}
  if(type==='gargoyle'){c.fillStyle='#d0c8d8';c.beginPath();c.moveTo(hx+4,-1);c.lineTo(hx+8,0);c.lineTo(hx+4,1);c.fill()}
  c.fillStyle='rgba(30,10,10,.75)';c.beginPath();c.arc(hx-1,-1.5,1.4,0,TAU);c.fill();
  eyes(c,hx+hr*.55,0,fl);
 })}
function nestSprite(tier){const S=[100,132,168][tier];return mkSpr('nest'+tier,S,S,c=>{
 const R=S*.42;ell(c,3,5,R*1.05,R*.95,'rgba(0,0,0,.35)');
 for(let i=0;i<14;i++){const a=i/14*TAU+hash2(i,tier,1)*.3,r=R*(.95+hash2(i,tier,2)*.3);c.strokeStyle='#3a1228';c.lineWidth=5+hash2(i,tier,3)*3;c.lineCap='round';c.beginPath();c.moveTo(Math.cos(a)*R*.5,Math.sin(a)*R*.5);c.quadraticCurveTo(Math.cos(a+.3)*r*.8,Math.sin(a+.3)*r*.8,Math.cos(a)*r*1.12,Math.sin(a)*r*1.12);c.stroke()}
 c.lineCap='butt';circ(c,0,0,R,rg(c,-R*.3,-R*.3,R*.1,R,[[0,'#8a3a58'],[.55,'#5a1e3c'],[1,'#2a0c1e']]),'#12040c',2);
 for(let i=0;i<7+tier*3;i++){const a=hash2(i,tier,5)*TAU,r=hash2(i,tier,6)*R*.8,s=R*(.1+hash2(i,tier,7)*.14);circ(c,Math.cos(a)*r,Math.sin(a)*r,s,rg(c,Math.cos(a)*r-s*.3,Math.sin(a)*r-s*.3,0,s,[[0,'#d0708a'],[1,'#5a1a34']]),'rgba(20,0,10,.7)',1)}
 c.strokeStyle='rgba(180,40,90,.7)';c.lineWidth=1.4;for(let i=0;i<9;i++){const a=i/9*TAU;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(Math.cos(a+.6)*R*.4,Math.sin(a+.6)*R*.4,Math.cos(a)*R*.9,Math.sin(a)*R*.9);c.stroke()}
 for(let i=0;i<4+tier*2;i++){const a=i/(4+tier*2)*TAU+.3;const x=Math.cos(a)*R*.9,y=Math.sin(a)*R*.9;c.fillStyle='#e0d8c0';c.beginPath();c.moveTo(x-2,y-2);c.lineTo(x+Math.cos(a)*9,y+Math.sin(a)*9);c.lineTo(x+2,y+2);c.fill()}
 })}
function nestCore(c,t,R){const p=.6+Math.sin(t*2.2)*.4;circ(c,0,0,R*.34,rg(c,0,0,0,R*.34,[[0,'rgba(255,200,230,'+(.7+p*.3)+')'],[.5,'rgba(230,60,130,.85)'],[1,'rgba(120,10,60,.9)']]),'#200010',1.5);ell(c,0,0,R*.1,R*.2,'#1a0010')}
function oreSprite(){return mkSpr('ore',70,70,c=>{ell(c,3,6,26,18,'rgba(0,0,0,.3)');for(const[x,y,r,a]of[[-12,6,13,.3],[10,8,11,1.1],[0,-10,14,2],[-14,-8,8,.7],[18,-6,7,2.5]]){c.save();c.translate(x,y);c.rotate(a);c.beginPath();for(let i=0;i<7;i++){const an=i/7*TAU,rd=r*(.8+hash2(i,x|0,y|0)*.3);c.lineTo(Math.cos(an)*rd,Math.sin(an)*rd*.85)}c.closePath();c.fillStyle=lg(c,-r,-r,r,r,[[0,'#8d8a86'],[1,'#33312f']]);c.fill();c.strokeStyle='#111';c.lineWidth=1;c.stroke();c.restore();
  c.fillStyle='#d8962b';c.fillRect(x-3,y-1,3,2);c.fillStyle='#6fe0f0';c.fillRect(x+2,y+2,2,3)}})}
function oilSprite(water){return mkSpr('oil'+(water?'W':''),70,70,c=>{ell(c,0,2,26,22,rg(c,-6,-4,2,26,[[0,'#16110c'],[.7,'#050403'],[1,'rgba(5,4,3,.2)']]),null);ell(c,-7,-6,10,5,'rgba(130,200,255,.25)',null,0,-.4);ell(c,6,6,8,3,'rgba(255,120,200,.14)',null,0,.3)})}

/* ---------- icons ---------- */
const ICON={};
function iconFor(kind,type){const key=kind+type;if(ICON[key])return ICON[key];const c=document.createElement('canvas');c.width=c.height=72;const x=c.getContext('2d');x.fillStyle=lg(x,0,0,72,72,[[0,'#2b3640'],[1,'#141a20']]);x.fillRect(0,0,72,72);
 let s,sc,ang=0,tur=null;
 if(kind==='b'){const d=B[type];s=buildingSprite(type);sc=Math.min(60/s._w,60/s._h)*(d.size===1?1.1:.95);tur=buildingTurret(type)}
 else{const d=U[type];if(d.cls==='inf'){s=infSprite(type,0);sc=1.8;ang=-Math.PI/2}else if(d.cls==='veh'){s=vehSprite(type);sc=1.05;tur=vehTurret(type)}else if(d.cls==='air'){s=airSprite(type);sc=type==='bomber'?.62:type==='fighter'?.7:.85}else{s=navSprite(type);sc=type==='battleship'?.38:type==='destroyer'?.5:.8;if(type==='patrol')sc=.82}}
 x.save();x.translate(36,36);x.rotate(ang);x.drawImage(s,-s._w/2*sc,-s._h/2*sc,s._w*sc,s._h*sc);if(tur)x.drawImage(tur,-tur._w/2*sc*(kind==='b'?.9:1),-tur._h/2*sc*(kind==='b'?.9:1),tur._w*sc*(kind==='b'?.9:1),tur._h*sc*(kind==='b'?.9:1));x.restore();
 const url=c.toDataURL();ICON[key]=url;return url}
function zIcon(type){const key='z'+type;if(ICON[key])return ICON[key];const c=document.createElement('canvas');c.width=c.height=72;const x=c.getContext('2d');x.fillStyle=lg(x,0,0,72,72,[[0,'#3a1a24'],[1,'#140a10']]);x.fillRect(0,0,72,72);const s=zombieSprite(type,0,0,0);const sc=type==='tyrant'?.6:type==='brute'?.95:type==='bloater'?1.1:1.6;x.save();x.translate(36,36);x.rotate(-Math.PI/2);x.drawImage(s,-s._w/2*sc,-s._h/2*sc,s._w*sc,s._h*sc);x.restore();ICON[key]=c.toDataURL();return ICON[key]}

/* ---------- unit variants: tinted/scaled copies of a base look ---------- */
function tintedCopy(b,col){const c=document.createElement('canvas');c.width=b.width;c.height=b.height;const x=c.getContext('2d');x.drawImage(b,0,0);x.globalCompositeOperation='source-atop';x.globalAlpha=.42;x.fillStyle=col;x.fillRect(0,0,c.width,c.height);c._w=b._w;c._h=b._h;return c}
function varSpr(pre,type,extra,baseFn){const d=U[type];const k=pre+type+extra;if(SPR[k])return SPR[k];const sc=d.sc||1;const b=baseFn(d.look,extra);const t=d.tint?tintedCopy(b,d.tint):b;const w=b._w*sc,h=b._h*sc;return mkSpr(k,w,h,c=>{c.drawImage(t,-w/2,-h/2,w,h)})}
function infSprite(type,f){return U[type].look?varSpr('iv_',type,f,infSprite_base):infSprite_base(type,f)}
function vehSprite(type){return U[type].look?varSpr('vv_',type,'',vehSprite_base):vehSprite_base(type)}
function airSprite(type){return U[type].look?varSpr('av_',type,'',airSprite_base):airSprite_base(type)}
function navSprite(type){return U[type].look?varSpr('nv_',type,'',navSprite_base):navSprite_base(type)}
function vehTurret(type){return vehTurret_base(U[type].look||type)}
function navTurret(type){return navTurret_base(U[type].look||type)}
