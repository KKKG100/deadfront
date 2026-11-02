/* ---------------- MAIN ---------------- */
let last=performance.now(),fpsAcc=0,fpsN=0,FPS=60,lowT=0,hiT=0,pingT=0;
function frame(ts){requestAnimationFrame(frame);const raw=(ts-last)/1000,dt=Math.min(.1,raw);last=ts;NOW=ts/1000;
 fpsAcc+=raw;fpsN++;if(fpsAcc>=1){FPS=Math.round(fpsN/fpsAcc);fpsAcc=0;fpsN=0;if(UI.state==='play'){if(FPS<46){lowT++;hiT=0;if(lowT>=2&&QUAL<3){setQual(QUAL+1);lowT=0}}else{lowT=0}const el=$('online');if(el&&G)el.textContent=G.online+' online · '+FPS+' fps · '+NET.rtt+'ms'+(NET.sv?' · srv '+NET.sv[0]+'/'+NET.sv[1]+'ms':'')+(QUAL?' · Q'+(3-QUAL):'')}}
 if(NOW-pingT>2){pingT=NOW;netSend({t:'ping',ts:performance.now()})}
 if(UI.state==='play'&&G&&WORLD&&ME&&NET.state==='play'){camKeys(dt);clientUpdate(dt,ts);sendView();
  tickT+=dt;if(tickT>.1){tickT=0;uiTick()}terrainPump(3);render(NOW)}
 else{ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#0a0e11';ctx.fillRect(0,0,cv.width,cv.height)}}
let tickT=0;
function boot(){cv=$('cv');initRender();initUI();initInput();$('loading').classList.add('hidden');requestAnimationFrame(frame)}
window.__dbg={get G(){return G},get cam(){return cam},get ME(){return ME},UI,NET,netSend};
window.addEventListener('load',boot);
