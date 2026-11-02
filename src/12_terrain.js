/* ---------------- TERRAIN (client): chunked streaming renderer ---------------- */
const CH=16,CPX=CH*TILE,CHALF=CPX/2;
let WATER=null,MINIBG=null,WPAT=null,WPAT2=null;
const CHUNKS=new Map(),CQ=[],CQS=new Set();let CFRAME=0;const CHUNK_MAX=150;
const ckey=(cx,cy)=>cy*1024+cx;
function terrainReset(){CHUNKS.clear();CQ.length=0;CQS.clear();WPAT=null;WPAT2=null;if(!WATER)WATER=makeWater()}
// build the whole-world low-res colour map (minimap + placeholder while chunks stream in)
function buildMiniBG(){const c=document.createElement('canvas');c.width=MW;c.height=MH;const x=c.getContext('2d'),im=x.createImageData(MW,MH),d=im.data;
 for(let i=0;i<MW*MH;i++){const e=E[i],t=T[i];let r,g,b;
  if(T[i]===0){const k=clamp((e-(SEA-.2))/.2,0,1);r=lerp(12,70,k*k);g=lerp(56,150,k);b=lerp(100,170,k)}
  else if(e<SEA+.07){r=210;g=194;b=140}
  else if(t===2){const s=e>ROCKH+.06;r=s?232:112;g=s?236:108;b=s?242:104}
  else if(t===3){r=48;g=100;b=48}
  else{const k=hash2(i%MW,(i/MW)|0,5)*10;r=94+k;g=140+k;b=66}
  const o=i*4;d[o]=r;d[o+1]=g;d[o+2]=b;d[o+3]=255}
 x.putImageData(im,0,0);MINIBG=c}
function* renderChunkGen(cx,cy){
 const s4=WORLD.s4,W2=CHALF+2,gx0=cx*CHALF-1,gy0=cy*CHALF-1;
 const e=new Float32Array(W2*W2),fa=new Float32Array(W2*W2);
 for(let py=0;py<W2;py++){if((py&31)===0)yield;const gy=gy0+py;const v=(gy*2+1)/TILE-.5;const ty0=Math.floor(v),fy=v-ty0;const y0=clamp(ty0,0,MH-1),y1=clamp(ty0+1,0,MH-1);
  for(let px=0;px<W2;px++){const gx=gx0+px;const u=(gx*2+1)/TILE-.5;const tx0=Math.floor(u),fx=u-tx0;const x0=clamp(tx0,0,MW-1),x1=clamp(tx0+1,0,MW-1);
   const a=E[y0*MW+x0],b=E[y0*MW+x1],c=E[y1*MW+x0],dd=E[y1*MW+x1];
   const fa0=F[y0*MW+x0],fb=F[y0*MW+x1],fc=F[y1*MW+x0],fdd=F[y1*MW+x1];
   fa[py*W2+px]=fa0+(fb-fa0)*fx+(fc-fa0)*fy+(fa0-fb-fc+fdd)*fx*fy;
   e[py*W2+px]=a+(b-a)*fx+(c-a)*fy+(a-b-c+dd)*fx*fy+(vn(gx*.045,gy*.045,s4)-.5)*.05+(vn(gx*.12,gy*.12,s4+3)-.5)*.02}}
 const img=new ImageData(CHALF,CHALF),d=img.data,fimg=new ImageData(CHALF,CHALF),fd=fimg.data;
 for(let py=0;py<CHALF;py++){if((py&31)===0)yield;for(let px=0;px<CHALF;px++){
  const gx=cx*CHALF+px,gy=cy*CHALF+py;const i=(py+1)*W2+px+1,ev=e[i],o=(py*CHALF+px)*4;
  const xm=e[i-1],xp=e[i+1],ym=e[i-W2],yp=e[i+W2];
  const sh=clamp(((xm-xp)+(ym-yp))*7,-.4,.4);const nz=hash2(gx,gy,7)*10-5;
  let r,g,b,a=255;
  if(ev<SEA-.17){a=0;r=g=b=0}
  else if(ev<SEA){
   const t=(ev-(SEA-.17))/.17;a=Math.pow(t,1.5)*235;
   r=lerp(14,108,t*t);g=lerp(86,196,t);b=lerp(138,196,t);
   const bf=vn(gx*.08,gy*.08,5);if(t>.45)r+=bf*20,g+=bf*14,b-=bf*10;
   if(ev>SEA-.026){const f=(ev-(SEA-.026))/.026;const k=f*(.55+.45*vn(gx*.2,gy*.2,9));r=lerp(r,238,k);g=lerp(g,248,k);b=lerp(b,250,k);a=Math.max(a,k*240)}
   if(ev>SEA-.085&&ev<SEA-.05){const k=1-Math.abs((ev-(SEA-.0675))/.0175);const w=vn(gx*.07,gy*.07,11)>.4?1:.4;fd[o]=255;fd[o+1]=255;fd[o+2]=255;fd[o+3]=clamp(k*140*w,0,255)}
  }else{
   const patch=fbm(gx*.011,gy*.011,s4+21,3),pn=vn(gx*.06,gy*.06,s4+5);
   const ff=fa[i];const sandW=SEA+.012,sandD=SEA+.075;
   if(ev<sandW){const t=(ev-SEA)/.012;r=lerp(205,190,t);g=lerp(190,170,t);b=lerp(140,118,t)}
   else if(ev<sandD+.045){
    let t=clamp((ev-sandD)/.045,0,1);
    const sr=226+pn*10,sg=208+pn*10,sb=152+pn*12;
    let gr=lerp(78,122,patch)+pn*14,gg=lerp(132,140,patch)+pn*10,gb=lerp(58,70,patch);
    if(ev<sandD){r=sr;g=sg;b=sb;if(ev<sandW+.02){const k=(ev-sandW)/.02;r=lerp(196,sr,k);g=lerp(176,sg,k);b=lerp(124,sb,k)}}
    else{r=lerp(sr,gr,t);g=lerp(sg,gg,t);b=lerp(sb,gb,t)}
   }else{
    r=lerp(76,118,patch)+pn*14;g=lerp(128,140,patch)+pn*10;b=lerp(56,68,patch);
    const dk=clamp((ff-.5)*2.2,0,1)*(ev>SEA+.12?1:0);r*=1-dk*.32;g*=1-dk*.2;b*=1-dk*.28;
    const gp=hash2(gx>>1,gy>>1,3);if(gp>.82){g+=8;r-=2}
    if(ev>ROCKH-.16){const t=clamp((ev-(ROCKH-.16))/.16,0,1);const rk=vn(gx*.09,gy*.09,s4+40);const cr=Math.abs(vn(gx*.05,gy*.05,s4+50)-.5)<.03?-30:0;const rr=lerp(r,104+rk*30+cr,t),rg=lerp(g,100+rk*28+cr,t),rb=lerp(b,96+rk*26+cr,t);r=rr;g=rg;b=rb;
     if(ev>ROCKH+.05){const t2=clamp((ev-ROCKH-.05)/.1,0,1);r=lerp(r,236,t2*.8);g=lerp(g,240,t2*.8);b=lerp(b,246,t2*.8)}}
   }
   const k=1+sh*(ev>ROCKH-.16?1.3:.6);r*=k;g*=k;b*=k;
  }
  d[o]=clamp(r+nz*(a?1:0),0,255);d[o+1]=clamp(g+nz*(a?1:0),0,255);d[o+2]=clamp(b+nz*(a?1:0),0,255);d[o+3]=a;
 }}
 yield;
 const half=document.createElement('canvas');half.width=half.height=CHALF;half.getContext('2d').putImageData(img,0,0);
 const foam=document.createElement('canvas');foam.width=foam.height=CHALF;foam.getContext('2d').putImageData(fimg,0,0);
 const land=document.createElement('canvas');land.width=land.height=CPX;const c=land.getContext('2d');c.imageSmoothingQuality='high';c.drawImage(half,0,0,CPX,CPX);
 // decor: deterministic per tile so neighbouring chunks agree
 c.save();c.translate(-cx*CPX,-cy*CPX);
 const trees=[];const tx0=cx*CH-2,ty0=cy*CH-2,tx1=cx*CH+CH+2,ty1=cy*CH+CH+2;
 for(let ty=Math.max(0,ty0);ty<Math.min(MH,ty1);ty++)for(let tx=Math.max(0,tx0);tx<Math.min(MW,tx1);tx++){const i=ty*MW+tx;const tt=T[i];const r2=mulberry32((hash2(tx,ty,99)*4294967295)|0);
  if(tt===1&&!depGrid[i]&&E[i]>SEA+.1){if(r2()<.35){const x=(tx+r2())*TILE,y=(ty+r2())*TILE,t=r2();if(t<.55)tuft(c,x,y,r2);else if(t<.8)flowers(c,x,y,r2);else bush(c,x,y,r2)}
   if(F[i]>.5&&r2()<.18)trees.push({x:(tx+r2())*TILE,y:(ty+r2())*TILE,v:(r2()*6)|0,s:.6+r2()*.35})}
  else if(tt===3){const n=2+(r2()*2|0);for(let k=0;k<n;k++)trees.push({x:(tx+r2())*TILE,y:(ty+r2())*TILE,v:(r2()*6)|0,s:.8+r2()*.5})}
  else if(tt===2){const n=1+(r2()*2|0);for(let k=0;k<n;k++)boulder(c,(tx+r2())*TILE,(ty+r2())*TILE,.8+r2()*1.1,r2()*TAU)}}
 trees.sort((a,b)=>a.y-b.y);for(const t of trees)drawTreeTo(c,t);
 c.restore();
 return{land,foam,last:CFRAME}}
function renderChunk(cx,cy){const g=renderChunkGen(cx,cy);let r;do{r=g.next()}while(!r.done);return r.value}
function getChunk(cx,cy){const k=ckey(cx,cy);const c=CHUNKS.get(k);if(c){c.last=CFRAME;return c}if(!CQS.has(k)){CQS.add(k);CQ.push([cx,cy])}return null}
let CJOB=null;
function terrainPump(ms){const t0=performance.now();
 for(;;){if(!CJOB){if(!CQ.length)return;const mx=cam.x+VW/cam.z/2,my=cam.y+VH/cam.z/2;const cc=(a)=>{const dx=(a[0]+.5)*CPX-mx,dy=(a[1]+.5)*CPX-my;return dx*dx+dy*dy};if(CQ.length>1)CQ.sort((a,b)=>cc(b)-cc(a));
  const [cx,cy]=CQ.pop();const k=ckey(cx,cy);CQS.delete(k);if(CHUNKS.has(k))continue;const x0=cx*CPX,y0=cy*CPX;if(x0>cam.x+VW/cam.z+CPX||x0+CPX<cam.x-CPX||y0>cam.y+VH/cam.z+CPX||y0+CPX<cam.y-CPX)continue;CJOB={k,g:renderChunkGen(cx,cy)}}
  const r=CJOB.g.next();if(r.done){CHUNKS.set(CJOB.k,r.value);CJOB=null}
  if(performance.now()-t0>ms)break}
 if(CHUNKS.size>CHUNK_MAX){const arr=[...CHUNKS.entries()].sort((a,b)=>a[1].last-b[1].last);for(let i=0;i<arr.length-CHUNK_MAX+10;i++){if(arr[i][1].last>=CFRAME-2)break;CHUNKS.delete(arr[i][0])}}}
function drawTerrain(t){CFRAME++;const x0=cam.x,y0=cam.y,x1=cam.x+VW/cam.z,y1=cam.y+VH/cam.z;
 const cx0=Math.max(0,Math.floor(x0/CPX)),cx1=Math.min(Math.ceil(MW/CH)-1,Math.floor(x1/CPX)),cy0=Math.max(0,Math.floor(y0/CPX)),cy1=Math.min(Math.ceil(MH/CH)-1,Math.floor(y1/CPX));
 const vis=[];
 for(let cy=cy0;cy<=cy1;cy++)for(let cx=cx0;cx<=cx1;cx++){const c=getChunk(cx,cy);if(c){ctx.drawImage(c.land,cx*CPX,cy*CPX);vis.push([c,cx,cy])}
  else if(MINIBG){ctx.globalAlpha=.9;ctx.drawImage(MINIBG,cx*CH,cy*CH,CH,CH,cx*CPX,cy*CPX,CPX,CPX);ctx.globalAlpha=1}}
 if(QUAL<2){ctx.globalAlpha=.25+.3*(.5+.5*Math.sin(t*1.3));for(const[c,cx,cy]of vis)ctx.drawImage(c.foam,cx*CPX,cy*CPX,CPX,CPX);ctx.globalAlpha=1}}
function splat(x,y,r,col){const R=r*.7+2;const cx0=Math.floor((x-R)/CPX),cx1=Math.floor((x+R)/CPX),cy0=Math.floor((y-R)/CPX),cy1=Math.floor((y+R)/CPX);
 for(let cy=cy0;cy<=cy1;cy++)for(let cx=cx0;cx<=cx1;cx++){const c=CHUNKS.get(ckey(cx,cy));if(!c)continue;const g=c.land.getContext('2d');g.fillStyle=col;g.beginPath();g.ellipse(x-cx*CPX,y-cy*CPX,r,r*rnd(.6,1),rnd(TAU),0,TAU);g.fill()}}
function tuft(c,x,y,r){c.strokeStyle='rgba(40,90,30,.55)';c.lineWidth=1.2;for(let i=0;i<4;i++){const a=-Math.PI/2+(r()-.5)*1.4;c.beginPath();c.moveTo(x+i*1.5-3,y);c.lineTo(x+i*1.5-3+Math.cos(a)*5,y+Math.sin(a)*5);c.stroke()}}
function flowers(c,x,y,r){const cols=['#f2e46b','#f08bb0','#fff','#c9a2f0'];for(let i=0;i<4;i++){c.fillStyle=cols[(r()*4)|0];c.beginPath();c.arc(x+(r()-.5)*14,y+(r()-.5)*14,1.5,0,TAU);c.fill()}}
function bush(c,x,y,r){c.fillStyle='rgba(0,0,0,.2)';c.beginPath();c.ellipse(x+2,y+3,8,5,0,0,TAU);c.fill();const g=c.createRadialGradient(x-2,y-2,1,x,y,8);g.addColorStop(0,'#5d9a45');g.addColorStop(1,'#2f6430');c.fillStyle=g;c.beginPath();c.arc(x,y,7,0,TAU);c.fill();c.fillStyle='rgba(255,255,255,.08)';c.beginPath();c.arc(x-2,y-2,3,0,TAU);c.fill()}
function boulder(c,x,y,s,a){c.save();c.translate(x,y);c.rotate(a);c.fillStyle='rgba(0,0,0,.28)';c.beginPath();c.ellipse(4,5,13*s,9*s,0,0,TAU);c.fill();
 const pts=[];const n=7;for(let i=0;i<n;i++){const an=i/n*TAU,rr=(9+hash2(i,x|0,y|0)*6)*s;pts.push([Math.cos(an)*rr,Math.sin(an)*rr*.82])}
 c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();const g=c.createLinearGradient(-10*s,-10*s,10*s,10*s);g.addColorStop(0,'#9a9690');g.addColorStop(1,'#4d4b4a');c.fillStyle=g;c.fill();c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=1;c.stroke();
 c.strokeStyle='rgba(255,255,255,.2)';c.beginPath();c.moveTo(pts[5][0],pts[5][1]);c.lineTo(pts[6][0],pts[6][1]);c.lineTo(pts[0][0],pts[0][1]);c.stroke();c.restore()}
function drawTreeTo(c,t){const x=t.x,y=t.y,s=t.s;c.save();c.translate(x,y);
 c.fillStyle='rgba(0,0,0,.24)';c.beginPath();c.ellipse(5*s,7*s,15*s,10*s,0,0,TAU);c.fill();
 const v=t.v;
 if(v<3){const R=(13+v*1.5)*s;const g=c.createRadialGradient(-R*.3,-R*.35,R*.1,0,0,R);g.addColorStop(0,'#5fa24a');g.addColorStop(.6,'#2f6a31');g.addColorStop(1,'#1c4423');
  for(const[dx,dy,k]of[[-6,3,.7],[6,2,.72],[0,-5,.8]]){c.fillStyle=g;c.beginPath();c.arc(dx*s,dy*s,R*k,0,TAU);c.fill()}
  c.fillStyle=g;c.beginPath();c.arc(0,0,R*.85,0,TAU);c.fill();
  c.fillStyle='rgba(190,255,150,.13)';c.beginPath();c.arc(-R*.28,-R*.3,R*.42,0,TAU);c.fill();c.strokeStyle='rgba(10,40,16,.35)';c.lineWidth=1;c.beginPath();c.arc(0,0,R*.85,0,TAU);c.stroke()}
 else{const R=15*s;for(let k=0;k<3;k++){const r=R*(1-k*.28);c.fillStyle=['#1d4a2d','#2a6a3a','#3d8a4a'][k];c.beginPath();for(let i=0;i<10;i++){const an=i/10*TAU,rr=i%2?r*.6:r;c.lineTo(Math.cos(an)*rr,Math.sin(an)*rr)}c.closePath();c.fill()}
  c.fillStyle='#6ab36b';c.beginPath();c.arc(0,0,2,0,TAU);c.fill()}
 c.restore()}
function makeWater(){
 const S=256;const mk=()=>{const c=document.createElement('canvas');c.width=c.height=S;return c};
 const a=mk(),ctx=a.getContext('2d'),im=ctx.createImageData(S,S),d=im.data;
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){const u=x/S*TAU,v=y/S*TAU;
  const w=Math.sin(u*2+Math.sin(v*3)*1.4)+Math.sin(v*3+Math.sin(u*2)*1.2)+.6*Math.sin((u+v)*4+1.3)+.4*Math.sin((u-v)*6);
  const k=w/3;const o=(y*S+x)*4;d[o]=12+k*8;d[o+1]=62+k*14;d[o+2]=112+k*16;d[o+3]=255}
 ctx.putImageData(im,0,0);
 const b=mk(),c2=b.getContext('2d'),im2=c2.createImageData(S,S),d2=im2.data;
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){const u=x/S*TAU,v=y/S*TAU;
  const w=Math.sin(u*3+Math.sin(v*2+1)*1.6)*Math.sin(v*4+Math.sin(u*3)*1.3)+Math.sin((u+v)*5)*.5;const r=Math.max(0,Math.abs(w)>.0?1-Math.abs(w-.9)*3.5:0);const o=(y*S+x)*4;d2[o]=190;d2[o+1]=230;d2[o+2]=255;d2[o+3]=clamp(r*70,0,255)}
 c2.putImageData(im2,0,0);
 return{base:a,hi:b}
}

