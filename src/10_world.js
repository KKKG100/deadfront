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
