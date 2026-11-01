/* ---------------- UI ---------------- */
const $=id=>document.getElementById(id);
let NOW=0;
const UI={rosterKey:'',aidTo:0,chatOpen:false,state:'title',tab:'eco',forceBuild:false,key:'',infoKey:'',alertIdx:0,modal:null,menuOpen:false,keys:{},edge:{x:0,y:0},sellConf:0,lastTop:0,bannerId:0,endShown:false,panning:null,dragPlace:false,pickedMini:false};
const CATS=[['eco','Economy'],['mil','Military'],['def','Defense'],['sup','Support']];
function costHtml(c,check){let s='';for(const k of['c','m','f']){if(c[k])s+='<span class="'+k+(check&&G.res[k]<c[k]-1e-6?' bad':'')+'">'+(k==='c'?'$':k==='m'?'▣':'⛽')+c[k]+'</span>'}return s||'<span class="c">Free</span>'}
function techName(id){return TECH_BY[id].name}
function statsHtml(d,isB){let s='';if(d.weapon){const w=d.weapon;s+='<div class="st">Damage '+w.dmg+(w.w==='flame'?'/tick':'')+' · Range '+Math.round(w.range/TILE*10)/10+' tiles'+(w.aaOnly?' · Air only':w.aa?' · Hits air':'')+'</div>'}
 if(!isB){s+='<div class="st">HP '+d.hp+(d.armor?' · Armor '+d.armor:'')+' · Speed '+Math.round(d.speed/TILE*10)/10+' t/s · Pop '+d.pop+'</div>';if(d.w)s+='<div class="st">Damage '+d.dmg+' · Range '+Math.round(d.range/TILE*10)/10+' tiles'+(d.splash?' · Splash':'')+(d.aa?' · Hits air':'')+'</div>'}
 else s+='<div class="st">HP '+d.hp+' · Build '+d.time+'s'+(d.size>1?' · '+d.size+'×'+d.size:'')+'</div>';return s}
function tipFor(kind,type){const d=kind==='b'?B[type]:U[type];let locked='';const t=d.tech;if(t&&!has(t))locked='<div class="bad st">Requires research: '+techName(t)+'</div>';
 return '<h4>'+d.name+'</h4>'+d.desc+'<div class="cs" style="display:flex;gap:8px;margin-top:5px;font-family:var(--disp);font-weight:700">'+costHtml(kind==='b'?d.cost:ucost(type),true)+'</div>'+statsHtml(d,kind==='b')+locked}
function makeCard(o){const e=document.createElement('div');e.className='card'+(o.lock?' lock':'')+(o.poor?' poor':'');e.dataset.slot=o.slot||'';
 e.innerHTML=(o.slot?'<span class="hk">'+o.slot+'</span>':'')+(o.q?'<span class="q">'+o.q+'</span>':'')+'<img src="'+o.icon+'" alt=""><div class="nm">'+o.name+'</div><div class="cs">'+o.cost+'</div>';e._tip=o.tip;e.addEventListener('click',o.click);return e}
function toast(msg,type){const f=$('feed');const e=document.createElement('div');e.className='toast '+(type||'');e.textContent=msg;f.appendChild(e);while(f.children.length>6)f.firstChild.remove();setTimeout(()=>{e.classList.add('out');setTimeout(()=>e.remove(),400)},4500);return e}
function selBuilding(){return G.sel.length===1&&G.sel[0].k==='b'?G.sel[0]:null}
function setBuildMode(type){if(!type){UIs.build=null;return}UIs.build={type,tx:undefined,ty:undefined,err:null};UIs.amove=false;sfx('click')}
function refreshCmd(){
 const sb=selBuilding();const trainMode=sb&&sb.done&&sb.d.train&&!UI.forceBuild;
 const aff=[...Object.keys(B),...Object.keys(U)].map(k=>'').join('');
 let bits='';for(const k of['c','m','f'])bits+=Math.floor(G.res[k]/10)+',';
 const key=[trainMode?'T'+sb.id:UI.tab,G.done.size,bits,sb?sb.queue.length:0,G.popCap-G.pop,UIs.build?UIs.build.type:''].join('|');
 if(key===UI.key)return;UI.key=key;
 const tabs=$('tabs');tabs.innerHTML='';
 if(sb&&sb.d.train&&sb.done){const b=document.createElement('button');b.textContent='PRODUCTION';b.className=trainMode?'on':'';b.onclick=()=>{UI.forceBuild=false;UI.key='';};tabs.appendChild(b)}
 for(const[id,nm]of CATS){const b=document.createElement('button');b.textContent=nm.toUpperCase();b.className=(!trainMode&&UI.tab===id)?'on':'';b.onclick=()=>{UI.tab=id;UI.forceBuild=true;UI.key='';sfx('click')};tabs.appendChild(b)}
 const g=$('grid');g.innerHTML='';const q=$('queue');q.innerHTML='';let slot=1;
 if(trainMode){
  for(const t of sb.d.train){const d=U[t];const c=ucost(t);const lock=d.tech&&!has(d.tech);const poor=!afford(c);const cnt=sb.queue.filter(x=>x.type===t).length;
   g.appendChild(makeCard({slot:slot++,icon:iconFor('u',t),name:d.name,cost:costHtml(c,true),lock,poor,q:cnt||'',tip:()=>tipFor('u',t),click:()=>{if(lock){toast('Requires research: '+techName(d.tech),'warn');return}const r=enqueue(sb,t);if(r){toast(r,'warn')}else{sfx('click');UI.key=''}}}))}
  sb.queue.forEach((it,i)=>{const e=document.createElement('div');e.className='qi';e.innerHTML='<img src="'+iconFor('u',it.type)+'"><i style="width:'+(i===0?it.prog*100:0)+'%"></i>';e.title='Click to cancel';e.onclick=()=>{dequeue(sb,i);UI.key=''};q.appendChild(e)});
  if(!sb.queue.length)q.innerHTML='<span class="small">Queue is empty. Right-click the map to set a rally point.</span>';
 }else{
  for(const type of Object.keys(B)){const d=B[type];if(d.cat!==UI.tab)continue;const lock=d.tech&&!has(d.tech);const poor=!afford(d.cost);
   g.appendChild(makeCard({slot:slot++,icon:iconFor('b',type),name:d.name,cost:costHtml(d.cost,true),lock,poor,tip:()=>tipFor('b',type),click:()=>{if(lock){toast('Requires research: '+techName(d.tech),'warn');return}setBuildMode(type)}}))}
  q.innerHTML='<span class="small">'+({eco:'Income and population. Mines and derricks need deposits.',mil:'Production structures. Each trains its own units.',def:'Towers and barricades. Place them where hordes arrive.',sup:'Research, healing and radar.'})[UI.tab]+' Must be inside supply range (green glow).</span>'}
}
function updateQueueBars(){const sb=selBuilding();if(!sb)return;const bars=$('queue').querySelectorAll('.qi i');if(bars[0]&&sb.queue[0])bars[0].style.width=(sb.queue[0].prog*100)+'%'}
function unitIcon(u){return iconFor('u',u.type)}
function refreshInfo(){const el=$('info');const sel=G.sel;let key;
 if(!sel.length)key='none|'+Math.floor(G.age)+'|'+(G.stats.kills||0);
 else key=sel.map(e=>e.id+':'+Math.ceil(e.hp/e.maxhp*20)+(e.k==='b'?(e.done?'d':Math.floor(e.prog*20)):'')+(e.queue?e.queue.length:'')).join(',')+UI.sellConf;
 if(key===UI.infoKey)return;UI.infoKey=key;
 if(!sel.length){el.innerHTML='<h3>'+(ME?ME.name.toUpperCase():'')+'</h3><div class="stats"><span>Day <b>'+Math.floor(G.age)+'</b> of your base · Kills <b>'+fmt(G.stats.kills||0)+'</b> · Best <b>'+(ME.best||0)+'</b></span></div><div class="small">Nests cannot be destroyed. Hold your ground, ally with other survivors, and send aid to those in trouble. Press <b>P</b> for players.</div><div class="row"><button data-act="army">Select army</button><button data-act="home">Go to HQ</button><button data-act="players">Players (P)</button></div>';return}
 if(sel.length===1){const e=sel[0];
  if(e.k==='u'){const d=e.d;el.innerHTML='<div class="row" style="align-items:center"><img src="'+unitIcon(e)+'" width="56" height="56" style="border-radius:3px;border:1px solid var(--edge2)"><div style="flex:1"><h3>'+d.name.toUpperCase()+ownerTag(e)+'</h3><div class="hbar"><i style="width:'+e.hp/e.maxhp*100+'%"></i></div><div class="small">'+Math.ceil(e.hp)+' / '+Math.ceil(e.maxhp)+' HP</div></div></div><div class="stats">'+(d.dmg?'<span>DMG <b>'+d.dmg+'</b></span><span>RNG <b>'+Math.round(d.range/TILE*10)/10+'</b></span>':'')+'<span>SPD <b>'+Math.round(d.speed/TILE*10)/10+'</b></span>'+(d.armor||uArmor(e)?'<span>ARM <b>'+uArmor(e)+'</b></span>':'')+'</div><div class="small">'+d.desc+'</div><div class="row"><button data-act="stop">Stop (S)</button>'+(d.w?'<button data-act="amove">Attack-move (A)</button>':'')+'</div>';return}
  if(e.k==='b'){const d=e.d;let st=e.done?'':'<div class="small" style="color:var(--amber)">Under construction '+Math.floor(e.prog*100)+'%</div>';
   let inc='';if(d.inc&&e.done){for(const k in d.inc)inc+='<span>+<b>'+d.inc[k]+'</b> '+RES[k].toLowerCase()+'/s</span>'}
   el.innerHTML='<div class="row" style="align-items:center"><img src="'+iconFor('b',e.type)+'" width="56" height="56" style="border-radius:3px;border:1px solid var(--edge2)"><div style="flex:1"><h3>'+d.name.toUpperCase()+ownerTag(e)+'</h3><div class="hbar"><i style="width:'+e.hp/e.maxhp*100+'%"></i></div><div class="small">'+Math.ceil(e.hp)+' / '+Math.ceil(e.maxhp)+' HP</div></div></div>'+st+'<div class="stats">'+inc+(d.weapon?'<span>DMG <b>'+d.weapon.dmg+'</b></span><span>RNG <b>'+Math.round(d.weapon.range/TILE*10)/10+'</b></span>':'')+(d.pop?'<span>POP <b>+'+d.pop+'</b></span>':'')+'</div><div class="small">'+d.desc+'</div><div class="row">'+(e.type!=='hq'&&e.o===ME.id?'<button data-act="sell" class="'+(UI.sellConf===e.id?'on':'')+'">'+(UI.sellConf===e.id?'Confirm sell':'Sell')+'</button>':'')+(d.train&&e.o===ME.id?'<span class="small">Right-click ground: rally point</span>':'')+'</div>';return}
  if(e.k==='n'){el.innerHTML='<h3 style="color:var(--mag)">OUTBREAK NEST · LV '+e.lvl+'</h3><div class="small">Nests cannot be destroyed. They evolve every few days and send hordes toward the nearest base while a survivor lives nearby. Build walls, turrets and kill zones — and band together.</div>';return}}
 // multi
 const units=sel.filter(e=>e.k==='u');const counts={};for(const u of units)counts[u.d.name]=(counts[u.d.name]||0)+1;
 el.innerHTML='<h3>'+sel.length+' SELECTED</h3><div class="sg">'+units.slice(0,40).map((u,i)=>'<div class="u" data-pick="'+u.id+'"><img src="'+unitIcon(u)+'"><i style="width:'+u.hp/u.maxhp*100+'%"></i></div>').join('')+'</div><div class="small">'+Object.entries(counts).map(([k,v])=>v+'× '+k).join(', ')+'</div><div class="row"><button data-act="stop">Stop</button><button data-act="amove">Attack-move (A)</button></div>'}
function ownerTag(e){if(!e.o||e.o===ME.id)return'';const p=G.players.get(e.o);return p?' <span style="color:'+p.color+';font-size:12px">· '+p.name+'</span>':''}
function doAct(a){const units=G.sel.filter(e=>e.k==='u'&&e.o===ME.id);
 if(a==='stop')orderStop(units);else if(a==='amove'){if(units.length){UIs.amove=true;UIs.build=null;toast('Attack-move: click a destination','')}}
 else if(a==='sell'){const b=selBuilding();if(!b||b.o!==ME.id)return;if(UI.sellConf===b.id){sellBuilding(b);G.sel=[];UI.sellConf=0;sfx('build')}else UI.sellConf=b.id}
 else if(a==='army'){G.sel=G.units.filter(u=>u.o===ME.id&&(u.d.w||u.d.heal||u.d.repair))}else if(a==='home'){const h=myHQ();if(h)centerOn(h.x,h.y)}else if(a==='players')toggleModal('players');
 UI.infoKey='';UI.key=''}
function refreshTop(){const r=G.res;$('vc').textContent=fmt(r.c);$('vm').textContent=fmt(r.m);$('vf').textContent=fmt(r.f);$('vp').textContent=G.pop+'/'+G.popCap;
 for(const k of['c','m','f'])$('rt'+k).textContent='+'+G.rate[k].toFixed(1);
 $('dayn').textContent='DAY '+G.day;const h=gameHour();const hh=Math.floor(h),mm=Math.floor((h-hh)*60);const nt=nightAmt(h);$('timeS').textContent=(hh<10?'0':'')+hh+':'+(mm<10?'0':'')+mm+(nt>.5?'  ☾ NIGHT':h<7?'  ☀ DAWN':'  ☀');
 $('thTxt').textContent=G.zc+' zombies · '+G.nn+' nests';$('thBar').style.width=clamp((G.zc+G.nn*14+G.muts.length*10)/16,2,100)+'%';
 $('mutBadge').textContent=G.muts.length;$('mutBadge').style.display=G.muts.length?'':'none';
const inv=(G.reqIn||[]).length;$('plBadge').textContent=inv;$('plBadge').style.display=inv?'':'none';
 $('resbar').style.width=G.cur?(G.cur.prog/G.cur.total*100)+'%':'0';$('bRes').firstChild.textContent=G.cur?'Research · '+techName(G.cur.id):'Research';
 $('mmN').textContent=G.nn+' NESTS';$('mmZ').textContent=(G.hasRadar?'RADAR ONLINE':'NO RADAR');
}
function refreshAlerts(){while(UI.alertIdx<G.alerts.length){const a=G.alerts[UI.alertIdx++];const e=toast(a.msg,a.type);if(a.x!==undefined)e.onclick=()=>centerOn(a.x,a.y)}
 if(G.banner&&NOW-G.banner.t>5)G.banner=null;if(G.banner&&G.banner.id!==UI.bannerId){UI.bannerId=G.banner.id;const b=$('banner');b.className=G.banner.kind;b.innerHTML='<div class="in"><h2>'+G.banner.text+'</h2><p>'+G.banner.sub+'</p></div>'}
 if(!G.banner&&$('banner').innerHTML)$('banner').innerHTML=''}
function renderResearch(){const g=$('techGrid');g.innerHTML='';const lab=G.labs>0;
 $('resSub').innerHTML=lab?(G.cur?'Researching <b>'+techName(G.cur.id)+'</b> · '+Math.floor(G.cur.total-G.cur.prog)+'s left · '+G.labs+' lab'+(G.labs>1?'s (faster)':'')+' <button id="cancR" style="margin-left:10px">Cancel (60% refund)</button>':'One project at a time. More labs research faster.'):'<span style="color:var(--amber)">Build a Research Lab (Support tab) to begin research.</span>';
 const cb=$('cancR');if(cb)cb.onclick=()=>{cancelResearch();renderResearch()};
 BRANCH.forEach((bn,bi)=>{const col=document.createElement('div');col.className='col';col.innerHTML='<h5>'+bn+'</h5>';
  TECHS.filter(t=>t.b===bi&&!t.cure).forEach(t=>{const st=techState(t.id);const e=document.createElement('div');e.className='tech '+st+(t.cure?' cure':'');const pg=st==='active'?'<div class="pg" style="width:'+(G.cur.prog/G.cur.total*100)+'%"></div>':'';
   const req=st==='locked'?'<div class="small" style="color:var(--amber)">Needs: '+t.req.filter(r=>!G.done.has(r)).map(techName).join(', ')+'</div>':'';
   e.innerHTML='<div class="ic">'+t.icon+'</div><div class="tn">'+t.name+'</div><div class="td">'+t.desc+'</div>'+req+'<div class="tc">'+(st==='done'?'':costHtml(t.cost,true)+'<span style="color:var(--mut)">'+t.time+'s</span>')+'</div>'+pg;
   e.onclick=()=>{if(st!=='ready'){return}const r=startResearch(t.id);if(r)toast(r,'warn');else{sfx('click');renderResearch()}};col.appendChild(e)});g.appendChild(col)})}
function renderIntel(){const m=$('mutList');m.innerHTML='';
 let sub='The virus mutates every few days. ';if(has('sequencing')&&G.pendingMut){const pm=MUTS.find(x=>x.id===G.pendingMut);sub+='Next (Day '+G.nextMutDay+'): <b style="color:var(--mag)">'+pm.name+'</b>.'}else sub+='Next mutation: Day '+G.nextMutDay+(has('sequencing')?'':'. Research Genome Sequencing to preview it.');$('intelSub').innerHTML=sub;
 if(!G.muts.length)m.innerHTML='<div class="small">No mutations yet. The virus is still stable.</div>';
 for(const id of G.muts){const x=MUTS.find(q=>q.id===id);m.insertAdjacentHTML('beforeend','<div class="mc bad"><div class="ic">'+x.icon+'</div><div><b>'+x.name+'</b><span class="small">'+x.desc+'</span></div></div>')}
 const z=$('zooList');z.innerHTML='';for(const t in Z){const d=Z[t],seen=G.seen.has(t);z.insertAdjacentHTML('beforeend','<div class="zc'+(seen?'':' unk')+'"><img src="'+zIcon(t)+'"><div><b style="font-family:var(--disp)">'+(seen?d.name:'Unknown')+'</b><div class="small">'+(seen?d.desc+' HP '+d.hp+' · Speed '+Math.round(d.speed/TILE*10)/10+(d.dmg?' · DMG '+d.dmg:'')+(d.fly?' · Flies':'')+(d.swim?' · Swims':''):'Not yet encountered.')+'</div></div></div>')}}
function openModal(id){closeModals();$(id).classList.remove('hidden');UI.modal=id;if(id==='research')renderResearch();if(id==='intel')renderIntel();if(id==='players')refreshRoster(true);sfx('click')}
function closeModals(){for(const m of['research','intel','help','players'])$(m).classList.add('hidden');UI.modal=null}
function toggleModal(id){if(UI.modal===id)closeModals();else openModal(id)}
function showMenu(v){UI.menuOpen=v;$('menu').classList.toggle('hidden',!v);$('mSound').textContent='Sound: '+(AU.on?'on':'off')}
const KEYS=[['P','Players: alliances and aid'],['Enter','Chat (start with /a for allies only)'],['WASD / Arrows / screen edge','Scroll the map'],['Mouse wheel','Zoom'],['Left click / drag','Select units, buildings, nests'],['Right click ground','Move selection (units fire while moving) · set rally point on production buildings'],['Right click enemy','Focus-fire a zombie or nest'],['A then click','Attack-move: stop and fight anything on the way'],['S','Stop'],['1-9','Pick the nth card in the command panel'],['Ctrl+1-9 · Shift+1-9','Assign · recall control group'],['R · I','Research · Viral Intel'],['H','Jump to Command Center'],['Ctrl+A','Select all army'],['Esc','Cancel placement, close panels, menu'],['Drag with a wall or house selected','Place a whole line at once'],['Shift while placing','Keep placing the same building']];
function initUI(){
 $('keys').innerHTML=KEYS.map(k=>'<kbd>'+k[0]+'</kbd><span>'+k[1]+'</span>').join('');
 $('bRes').onclick=()=>toggleModal('research');$('bIntel').onclick=()=>toggleModal('intel');$('bPlayers').onclick=()=>toggleModal('players');$('bMenu').onclick=()=>showMenu(!UI.menuOpen);
 $('bSnd').onclick=()=>{AU.on=!AU.on;auVol();$('bSnd').style.opacity=AU.on?1:.4};
 document.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModals);
 $('mResume').onclick=()=>showMenu(false);$('mHelp').onclick=()=>{showMenu(false);openModal('help')};$('mSound').onclick=()=>{AU.on=!AU.on;auVol();$('mSound').textContent='Sound: '+(AU.on?'on':'off')};
 $('mRestart').onclick=()=>{location.reload()};
 $('info').addEventListener('click',e=>{const a=e.target.closest('[data-act]');if(a){doAct(a.dataset.act);return}const p=e.target.closest('[data-pick]');if(p){const u=G.uM.get(+p.dataset.pick);if(u){G.sel=e.shiftKey?G.sel.filter(x=>x!==u):[u];UI.infoKey=''}}});
 document.body.addEventListener('mousemove',e=>{const t=e.target.closest('.card,[data-tip]');const tip=$('tip');if(t&&(t._tip||t.dataset.tip)){tip.innerHTML=t._tip?t._tip():t.dataset.tip;tip.classList.remove('hidden');const r=t.getBoundingClientRect();let x=r.left,y=r.top-tip.offsetHeight-8;if(y<50)y=r.bottom+8;tip.style.left=clamp(x,6,VW-tip.offsetWidth-6)+'px';tip.style.top=y+'px'}else tip.classList.add('hidden')});
 // title screen
 const cO=$('colorOpts');PCOLORS.forEach((c,i)=>{const b=document.createElement('button');b.className='sw'+(i===UI.colorIdx?' on':'');b.style.background=c;b.dataset.c=c;b.onclick=()=>{UI.colorIdx=i;[...cO.children].forEach(x=>x.classList.remove('on'));b.classList.add('on')};cO.appendChild(b)});
 try{$('pname').value=localStorage.getItem('deadfront_name')||''}catch(e){}
 $('bStart').onclick=()=>{auInit();const n=$('pname').value.trim()||'Survivor';try{localStorage.setItem('deadfront_name',n)}catch(e){}$('titleMsg').classList.add('hidden');netConnect(n,PCOLORS[UI.colorIdx||0])};
 $('pname').addEventListener('keydown',e=>{if(e.key==='Enter')$('bStart').click()});
 $('bHelpT').onclick=()=>openModal('help');
 const pollStatus=()=>{fetch(httpBase()+'/api/status').then(r=>r.json()).then(j=>{$('srvInfo').textContent=j.online+' / '+j.max+' survivors online · day '+j.day}).catch(()=>{$('srvInfo').textContent='server offline'})};pollStatus();setInterval(()=>{if(UI.state!=='play')pollStatus()},6000);
 // chat
 $('chatIn').addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter'){let t=$('chatIn').value.trim();let ally=0;if(/^\/a\s/i.test(t)){ally=1;t=t.slice(3)}if(t)netSend({t:'ch',text:t,ally});$('chatIn').value='';chatFocus(false)}else if(e.key==='Escape'){chatFocus(false)}});
 $('chatIn').addEventListener('keyup',e=>e.stopPropagation());
 $('players').addEventListener('click',onRosterClick);
}
UI.colorIdx=Math.floor(Math.random()*PCOLORS.length);
function chatFocus(on){UI.chatOpen=on;$('chat').classList.toggle('open',on);if(on){$('chatIn').focus()}else $('chatIn').blur();UI.chatLog()}
UI.chatLog=function(){if(!G)return;const el=$('chatLog');const now=NOW;const last=G.chat.slice(-(UI.chatOpen?30:7));el.innerHTML=last.map(c=>{const nm=c.from?'<b style="color:'+(c.color||'#fff')+'">'+esc(c.name||'?')+(c.ally?' (ally)':'')+'</b>: ':'<i style="color:var(--amber)">';return '<div class="cl">'+nm+esc(c.text)+(c.from?'':'</i>')+'</div>'}).join('');el.scrollTop=el.scrollHeight;UI.chatT=performance.now();$('chat').classList.add('show')};
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}

/* ---------------- PLAYERS / ALLIANCES / AID ---------------- */
function refreshRoster(force){if(!G||UI.modal!=='players')return;const list=[...G.players.values()].sort((a,b)=>(b.alive-a.alive)||(b.age-a.age)||a.id-b.id);
 const key=list.map(p=>[p.id,p.alive,p.online,p.age,[...p.allies].join('.')].join(':')).join('|')+'|'+(G.reqIn||[]).join(',')+'|'+(G.reqOut||[]).join(',')+UI.aidTo;if(!force&&key===UI.rosterKey)return;UI.rosterKey=key;
 const row=p=>{const me=p.id===ME.id,ally=ME.allies.has(p.id),inReq=(G.reqIn||[]).includes(p.id),outReq=(G.reqOut||[]).includes(p.id);
  let btns='';if(!me){if(ally)btns+='<button data-a="ab" data-id="'+p.id+'">Break alliance</button>';else if(inReq)btns+='<button class="pri" data-a="ac" data-id="'+p.id+'">Accept</button><button data-a="ad" data-id="'+p.id+'">Decline</button>';else if(outReq)btns+='<span class="small">Request sent</span>';else if(p.alive)btns+='<button data-a="al" data-id="'+p.id+'">Propose alliance</button>';
   if(p.alive&&ME.alive)btns+='<button data-a="aid" data-id="'+p.id+'">Send aid</button>';if(p.alive&&p.hqPos)btns+='<button data-a="go" data-id="'+p.id+'">Locate</button>'}
  return '<div class="pr'+(me?' me':'')+(p.alive?'':' dead')+'"><i class="dot" style="background:'+p.color+'"></i><div class="pn"><b>'+esc(p.name)+(me?' (you)':'')+'</b><span class="small">'+(p.alive?'Day '+p.age+' · '+(p.kills||0)+' kills':'Fallen · best day '+(p.best||0))+(p.online?'':' · offline')+(ally?' · <span style="color:#6dff9a">ALLY</span>':'')+'</span></div><div class="pb">'+btns+'</div></div>'+(UI.aidTo===p.id?aidForm(p):'')};
 $('plList').innerHTML=list.map(row).join('')||'<div class="small">No one here yet.</div>'}
function aidForm(p){return '<div class="aid"><b>Send aid to '+esc(p.name)+'</b><div class="aidrow"><label>$<input id="aidC" type="number" min="0" value="0"></label><label>▣<input id="aidM" type="number" min="0" value="0"></label><label>⛽<input id="aidF" type="number" min="0" value="0"></label></div><div class="aidrow"><button data-a="aidq" data-q="100">100 each</button><button data-a="aidq" data-q="500">500 each</button><button data-a="aidq" data-q="max">Everything</button><button class="pri" data-a="aidsend" data-id="'+p.id+'">Send</button><button data-a="aidx">Cancel</button></div></div>'}
function onRosterClick(e){const b=e.target.closest('button[data-a]');if(!b)return;const a=b.dataset.a,id=+b.dataset.id;sfx('click');
 if(a==='al')netSend({t:'al',to:id});else if(a==='ac')netSend({t:'ac',from:id});else if(a==='ad')netSend({t:'ad',from:id});else if(a==='ab')netSend({t:'ab',to:id});
 else if(a==='go'){const p=G.players.get(id);if(p&&p.hqPos){closeModals();centerOn(p.hqPos[0],p.hqPos[1])}return}
 else if(a==='aid'){UI.aidTo=UI.aidTo===id?0:id;refreshRoster(true);return}
 else if(a==='aidx'){UI.aidTo=0;refreshRoster(true);return}
 else if(a==='aidq'){const q=b.dataset.q;const set=(i,k)=>{$(i).value=q==='max'?Math.floor(G.res[k]):Math.min(+q,Math.floor(G.res[k]))};set('aidC','c');set('aidM','m');set('aidF','f');return}
 else if(a==='aidsend'){const v=k=>Math.max(0,Math.floor(+$(k).value||0));netSend({t:'aid',to:id,a:{c:v('aidC'),m:v('aidM'),f:v('aidF')}});UI.aidTo=0;refreshRoster(true);return}
 setTimeout(()=>refreshRoster(true),250)}

/* ---------------- INPUT ---------------- */
function pickAt(wx,wy){let best=null,bd=1e9;for(const u of G.units){const d=Math.hypot(u.x-wx,u.y-wy);if(d<u.r+8&&d<bd){bd=d;best=u}}if(best)return best;
 for(const b of G.buildings)if(wx>=b.x-b.w/2&&wx<=b.x+b.w/2&&wy>=b.y-b.h/2&&wy<=b.y+b.h/2)return b;
 for(const n of G.nests)if(Math.hypot(n.x-wx,n.y-wy)<n.r+8)return n;return null}
function enemyAt(wx,wy){let b=null,bd=1e9;for(const z of G.zombies){const d=Math.hypot(z.x-wx,z.y-wy);if(d<z.r+10&&d<bd){bd=d;b=z}}return b}
function updateGhost(wx,wy){const bd=UIs.build;if(!bd)return;const d=B[bd.type];let tx=Math.floor(wx/TILE-d.size/2+.5),ty=Math.floor(wy/TILE-d.size/2+.5);
 if(d.dep){let bestD=4.5,bdp=null;for(const dp of WORLD.deposits){if(!dp||dp.type!==d.dep||dp.used)continue;const dd=Math.hypot(dp.tx+1-wx/TILE,dp.ty+1-wy/TILE);if(dd<bestD){bestD=dd;bdp=dp}}if(bdp){tx=bdp.tx;ty=bdp.ty;bd.water=bdp.water}}
 bd.tx=tx;bd.ty=ty;bd.err=!ME.alive?'You are not deployed':canPlace(bd.type,tx,ty)||(afford(d.cost)?null:'Not enough resources')}
function tryPlace(shift){const bd=UIs.build;if(!bd||bd.tx===undefined)return false;updateGhost((bd.tx+B[bd.type].size/2)*TILE,(bd.ty+B[bd.type].size/2)*TILE);if(bd.err){if(!UI.dragPlace)toast(bd.err,'warn');return false}
 const r=placeBuilding(bd.type,bd.tx,bd.ty);if(r){toast(r,'warn');return false}UI.key='';
 if(!(shift||B[bd.type].wall||bd.type==='house'))UIs.build=null;return true}
function giveRightClick(wx,wy){if(!ME.alive)return;const units=G.sel.filter(e=>e.k==='u'&&e.o===ME.id);
 if(units.length){const en=enemyAt(wx,wy);if(en){orderAttack(units,en);UIs.markers.push({x:en.x,y:en.y,t:NOW,c:'#ff5a4a'})}else{orderMove(units,wx,wy,false);UIs.markers.push({x:wx,y:wy,t:NOW,c:'#6dff9a'})}sfx('click');return}
 const b=selBuilding();if(b&&b.d.train&&b.o===ME.id){setRally(b,wx,wy);UIs.markers.push({x:wx,y:wy,t:NOW,c:'#ffd24a'});sfx('click')}}
function selectBox(x0,y0,x1,y1,shift){const a=s2w(Math.min(x0,x1),Math.min(y0,y1)),b=s2w(Math.max(x0,x1),Math.max(y0,y1));const list=G.units.filter(u=>u.o===ME.id&&u.x>=a.x&&u.x<=b.x&&u.y>=a.y&&u.y<=b.y);
 if(shift){for(const u of list)if(!G.sel.includes(u))G.sel.push(u)}else G.sel=list}
function initInput(){
 const c=cv;let down=null;
 c.addEventListener('contextmenu',e=>e.preventDefault());
 c.addEventListener('mousedown',e=>{if(!G||UI.state!=='play')return;auInit();const w=s2w(e.clientX,e.clientY);UI.forceBuildCheck=1;
  if(e.button===1){UI.panning={x:e.clientX,y:e.clientY,cx:cam.x,cy:cam.y};e.preventDefault();return}
  if(e.button===2){if(UIs.build){UIs.build=null;UI.key=''}else if(UIs.amove)UIs.amove=false;else giveRightClick(w.x,w.y);return}
  if(e.button===0){
   if(UIs.build){UI.dragPlace=false;if(tryPlace(e.shiftKey)){UI.dragPlace=true}return}
   if(UIs.amove){const u=G.sel.filter(x=>x.k==='u'&&x.o===ME.id);orderMove(u,w.x,w.y,true);UIs.markers.push({x:w.x,y:w.y,t:NOW,c:'#ffb020'});UIs.amove=false;return}
   down={x:e.clientX,y:e.clientY,shift:e.shiftKey,t:performance.now()}}});
 window.addEventListener('mousemove',e=>{if(!G||UI.state!=='play')return;UIs.mouse={x:e.clientX,y:e.clientY};
  UI.edge.x=e.clientX<5?-1:e.clientX>VW-5?1:0;UI.edge.y=e.clientY<5?-1:0;if(e.target!==cv&&!UI.panning&&!down)UI.edge.x=UI.edge.y=0;
  if(UI.panning){cam.x=UI.panning.cx-(e.clientX-UI.panning.x)/cam.z;cam.y=UI.panning.cy-(e.clientY-UI.panning.y)/cam.z;clampCam();return}
  const w=s2w(e.clientX,e.clientY);if(UIs.build){updateGhost(w.x,w.y);if(UI.dragPlace&&(e.buttons&1)&&(B[UIs.build.type].wall||UIs.build.type==='house'))tryPlace(true)}
  if(down){const dx=e.clientX-down.x,dy=e.clientY-down.y;if(Math.hypot(dx,dy)>6)UIs.box={x0:down.x,y0:down.y,x1:e.clientX,y1:e.clientY}}
  UIs.hover=enemyAt(w.x,w.y)});
 window.addEventListener('mouseup',e=>{if(!G||UI.state!=='play')return;if(e.button===1){UI.panning=null;return}if(e.button!==0)return;UI.dragPlace=false;
  if(down){const w=s2w(e.clientX,e.clientY);if(UIs.box){selectBox(UIs.box.x0,UIs.box.y0,UIs.box.x1,UIs.box.y1,down.shift);UIs.box=null}
   else{const p=pickAt(w.x,w.y);if(p){if(down.shift){const i=G.sel.indexOf(p);if(i>=0)G.sel.splice(i,1);else G.sel.push(p)}else{const now=performance.now();if(p.k==='u'&&UI.lastClick&&UI.lastClick.type===p.type&&now-UI.lastClick.t<350){G.sel=G.units.filter(u=>u.o===ME.id&&u.type===p.type&&onScr(u.x,u.y,0))}else G.sel=[p];UI.lastClick={type:p.type,t:now}}}else if(!down.shift)G.sel=[]}
   UI.forceBuild=false;UI.key='';UI.infoKey='';UI.sellConf=0;down=null}});
 c.addEventListener('wheel',e=>{e.preventDefault();if(!G)return;const b=s2w(e.clientX,e.clientY);cam.z*=Math.exp(-e.deltaY*.0011);clampCam();cam.x=b.x-e.clientX/cam.z;cam.y=b.y-e.clientY/cam.z;clampCam()},{passive:false});
 document.addEventListener('mouseleave',()=>{UI.edge.x=UI.edge.y=0});
 // minimap
 const mini=$('mini');const mmTo=e=>{const r=mini.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*WW,y:(e.clientY-r.top)/r.height*WH}};
 mini.addEventListener('contextmenu',e=>e.preventDefault());
 mini.addEventListener('mousedown',e=>{if(!G)return;const p=mmTo(e);if(e.button===2){giveRightClick(p.x,p.y);return}UI.pickedMini=true;centerOn(p.x,p.y)});
 window.addEventListener('mousemove',e=>{if(UI.pickedMini&&e.buttons&1){const p=mmTo(e);centerOn(p.x,p.y)}});window.addEventListener('mouseup',()=>UI.pickedMini=false);
 window.addEventListener('blur',()=>{UI.keys={}});
 window.addEventListener('keyup',e=>{UI.keys[e.code]=false});
 window.addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;UI.keys[e.code]=true;if(!G||UI.state!=='play')return;auInit();
  const code=e.code;
  if(code==='Escape'){if(UIs.build){UIs.build=null;UI.key=''}else if(UIs.amove)UIs.amove=false;else if(UI.modal)closeModals();else if(G.sel.length){G.sel=[]}else showMenu(!UI.menuOpen);return}
  if(code==='Enter'){e.preventDefault();chatFocus(true);return}
  if(code==='KeyP'){toggleModal('players');return}
  if(code==='KeyR'){toggleModal('research');return}if(code==='KeyI'){toggleModal('intel');return}if(code==='KeyH'){const h=myHQ();if(h)centerOn(h.x,h.y);return}
  if(code==='KeyS'&&!e.ctrlKey){doAct('stop');return}if(code==='KeyA'){if(e.ctrlKey){e.preventDefault();doAct('army')}else doAct('amove');return}
  if(code==='Delete'){return}
  const m=/^Digit(\d)$/.exec(code);if(m){const n=+m[1];
   if(e.ctrlKey){G.groups[n]=G.sel.filter(x=>x.k==='u'&&x.o===ME.id);toast('Group '+n+' assigned ('+G.groups[n].length+')');e.preventDefault();return}
   if(e.shiftKey){const g=(G.groups[n]||[]).filter(u=>G.uM.get(u.id)===u);if(g.length){G.sel=g;UI.infoKey=''}return}
   const card=$('grid').querySelector('.card[data-slot="'+n+'"]');if(card)card.click()}});
}
function camKeys(dt){const k=UI.keys;let dx=0,dy=0;if(k.KeyA&&!UIs.amove&&0)dx--;if(k.ArrowLeft)dx--;if(k.ArrowRight)dx++;if(k.ArrowUp)dy--;if(k.ArrowDown)dy++;
 if(k.KeyW)dy--;if(k.KeyD)dx++;if(k.KeyA&&!k.ControlLeft)dx--;if(k.KeyS&&!k.ControlLeft&&0)dy++;
 dx+=UI.edge.x;dy+=UI.edge.y;if(dx||dy){const s=900*dt/cam.z;cam.x+=dx*s;cam.y+=dy*s;clampCam()}}
/* ---------------- MINIMAP ---------------- */
function drawMini(){const m=$('mini'),x=m.getContext('2d'),W=m.width,H=m.height,sx=W/WW,sy=H/WH;x.imageSmoothingEnabled=true;if(MINIBG)x.drawImage(MINIBG,0,0,W,H);
 if(G.crates)for(const c of G.crates){x.fillStyle='#ffd24a';x.fillRect(c.x*sx-3,c.y*sy-3,6,6)}
 for(const d of WORLD.deposits){if(!d||d.used)continue;x.fillStyle=d.type==='ore'?'#e8a63a':'#111';x.fillRect((d.tx+1)*TILE*sx-1,(d.ty+1)*TILE*sy-1,2,2)}
 for(const n of G.nests){if(!(n.disc||G.hasRadar))continue;const p=.5+.5*Math.sin(NOW*3+n.id);x.fillStyle='rgba(217,70,239,'+(.5+.4*p)+')';x.beginPath();x.arc(n.x*sx,n.y*sy,2+Math.min(n.lvl,10)*.35,0,TAU);x.fill();x.strokeStyle='#fff';x.lineWidth=.6;x.stroke()}
 const mm=G.mini;if(mm){const zl=mm.z;for(let i=0;i<zl.length;i+=3){x.fillStyle=zl[i+2]?'#ff4b3e':'#a02a2a';x.fillRect(zl[i]*16*sx-.5,zl[i+1]*16*sy-.5,1.5,1.5)}
  for(const f of mm.f){const col=ownerColor(f[0]);x.fillStyle=col;const bs=f[1];for(let i=0;i<bs.length;i+=3){const s=bs[i+2];x.fillRect(bs[i]*16*sx-s/2,bs[i+1]*16*sy-s/2,s,s)}x.globalAlpha=.8;const us=f[2];for(let i=0;i<us.length;i+=2)x.fillRect(us[i]*16*sx-.5,us[i+1]*16*sy-.5,1.2,1.2);x.globalAlpha=1}}
 const h=myHQ();if(h){x.strokeStyle='#fff';x.lineWidth=1;x.beginPath();x.arc(h.x*sx,h.y*sy,5+Math.sin(NOW*4),0,TAU);x.stroke()}
 x.strokeStyle='rgba(255,255,255,.85)';x.lineWidth=1;x.strokeRect(cam.x*sx,cam.y*sy,VW/cam.z*sx,(VH-190)/cam.z*sy)}
/* ---------------- TICK ---------------- */
function uiTick(){if(!G||!ME)return;refreshTop();refreshAlerts();refreshCmd();updateQueueBars();refreshInfo();drawMini();refreshRoster();
 if(UI.modal==='research'&&G.cur)renderResearch.t=(renderResearch.t||0)+1,(renderResearch.t%5===0&&renderResearch());
 if(UI.modal==='intel'&&UI.bestiaryDirty){UI.bestiaryDirty=0;renderIntel()}
 if(UI.chatT&&!UI.chatOpen&&performance.now()-UI.chatT>9000){$('chat').classList.remove('show');UI.chatT=0}}
function showDead(m){const s=m.stats||{};const e=$('end');e.className='lose';const t=m.time||0;
 e.innerHTML='<div class="box"><h1>BASE LOST</h1><p style="color:var(--mut);margin:6px 0">'+esc(m.msg||'')+'</p><table><tr><td>Zombies destroyed</td><td>'+fmt(s.kills||0)+'</td></tr><tr><td>Structures built</td><td>'+(s.built||0)+'</td></tr><tr><td>Units trained</td><td>'+(s.trained||0)+'</td></tr><tr><td>Losses</td><td>'+(s.lost||0)+'</td></tr><tr><td>Best run (days)</td><td>'+(ME.best||m.day||0)+'</td></tr></table><div class="row" style="justify-content:center"><button class="pri" id="eAgain">Start over in a new location</button><button id="eSpec">Keep watching</button></div></div>';
 e.classList.remove('hidden');$('eAgain').onclick=()=>{netSend({t:'rsp'});};$('eSpec').onclick=()=>{e.classList.add('hidden')}}

/* ---------- doctrines, missions, world info ---------- */
(function(){const st=document.createElement('style');st.textContent=`
#offer{position:fixed;left:50%;top:64px;transform:translateX(-50%);z-index:30;background:rgba(10,14,18,.94);border:1px solid #c9a227;border-radius:8px;padding:10px 14px;display:none;box-shadow:0 6px 30px #000a;max-width:96vw}
#offer h4{margin:0 0 8px;font:700 13px system-ui;letter-spacing:.12em;color:#f2c230;text-transform:uppercase;text-align:center}
#offer .oc{display:flex;gap:10px;flex-wrap:wrap;justify-content:center}
#offer .ocard{width:170px;background:linear-gradient(180deg,#1d262d,#12181d);border:1px solid #3a4a56;border-radius:6px;padding:8px;cursor:pointer;text-align:center;color:#d6dee4;font:12px/1.35 system-ui}
#offer .ocard:hover{border-color:#f2c230;background:#222c34}#offer .ocard b{display:block;font-size:13px;margin:3px 0}#offer .ocard i{font-size:26px;font-style:normal}
#mission{position:fixed;right:8px;top:56px;z-index:20;background:rgba(10,14,18,.8);border:1px solid #2d3a44;border-radius:6px;padding:6px 10px;color:#cfd8de;font:12px/1.4 system-ui;max-width:250px;display:none;pointer-events:none}
#mission .mt{color:#f2c230;font-weight:700;letter-spacing:.08em;font-size:11px;text-transform:uppercase}#mission .mb{height:5px;background:#26323b;border-radius:3px;margin:3px 0}#mission .mb div{height:100%;background:#58c36a;border-radius:3px}
#mission .bm{color:#ff5a5a;font-weight:700;margin-top:3px}#mission .pk{font-size:16px;margin-top:3px}
`;document.head.appendChild(st);
const o=document.createElement('div');o.id='offer';document.body.appendChild(o);
const m=document.createElement('div');m.id='mission';document.body.appendChild(m);
o.addEventListener('click',e=>{const c=e.target.closest('.ocard');if(c){netSend({t:'pk',id:c.dataset.id});o.style.display='none';o.dataset.k=''}})})();
function showOffer(of){const o=document.getElementById('offer');if(!o)return;if(!of||!of.length){o.style.display='none';o.dataset.k='';return}const k=of.join();if(o.dataset.k!==k){o.dataset.k=k;o.innerHTML='<h4>Choose a Doctrine</h4><div class="oc">'+of.map(id=>{const p=PERK_BY[id];return p?`<div class="ocard" data-id="${id}"><i>${p.icon}</i><b>${p.name}</b>${p.desc}</div>`:''}).join('')+'</div>'}o.style.display='block'}
function setMission(mi,bm,pk){const m=document.getElementById('mission');if(!m)return;if(!mi&&!(pk&&pk.length)){m.style.display='none';return}
 const wm=G&&G.wm?'<div style="color:#8fa3b0;font-size:11px">'+G.wm.n+'</div>':'';
 m.innerHTML=wm+(mi?`<div class="mt">Mission</div>${mi[0]} <span style="color:#8fa3b0">(${mi[1]}/${mi[2]})</span><div class="mb"><div style="width:${Math.min(100,mi[1]/mi[2]*100)}%"></div></div><span style="color:#7fd48a">Reward ${mi[3]}</span>`:'')+(bm?'<div class="bm">🌕 BLOOD MOON</div>':'')+(pk&&pk.length?'<div class="pk" title="Your doctrines">'+pk.map(id=>PERK_BY[id]?`<span title="${PERK_BY[id].name}: ${PERK_BY[id].desc}">${PERK_BY[id].icon}</span>`:'').join(' ')+'</div>':'');m.style.display='block'}
