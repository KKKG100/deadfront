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
