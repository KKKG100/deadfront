/* ---------------- AUDIO ---------------- */
const AU={ctx:null,on:true,master:null,noise:null,last:{},drone:null};
function auInit(){if(AU.ctx)return;try{const C=window.AudioContext||window.webkitAudioContext;AU.ctx=new C();AU.master=AU.ctx.createGain();AU.master.gain.value=.5;AU.master.connect(AU.ctx.destination);
 const n=AU.ctx.createBuffer(1,AU.ctx.sampleRate*1.5,AU.ctx.sampleRate),d=n.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;AU.noise=n;
 const o1=AU.ctx.createOscillator(),o2=AU.ctx.createOscillator(),f=AU.ctx.createBiquadFilter(),g=AU.ctx.createGain(),lfo=AU.ctx.createOscillator(),lg=AU.ctx.createGain();
 o1.type='sawtooth';o2.type='sawtooth';o1.frequency.value=48;o2.frequency.value=48.7;f.type='lowpass';f.frequency.value=180;g.gain.value=.05;lfo.frequency.value=.07;lg.gain.value=90;lfo.connect(lg);lg.connect(f.frequency);o1.connect(f);o2.connect(f);f.connect(g);g.connect(AU.master);o1.start();o2.start();lfo.start();AU.drone=g}catch(e){AU.ctx=null}}
function auVol(){if(AU.master)AU.master.gain.value=AU.on?.5:0}
function nz(dur,type,f0,f1,vol,at){const a=AU.ctx,t=a.currentTime+(at||0);const s=a.createBufferSource();s.buffer=AU.noise;const f=a.createBiquadFilter();f.type=type;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(Math.max(30,f1),t+dur);const g=a.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(f);f.connect(g);g.connect(AU.master);s.start(t,Math.random());s.stop(t+dur+.05)}
function tone(type,f0,f1,dur,vol,at){const a=AU.ctx,t=a.currentTime+(at||0);const o=a.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);const g=a.createGain();g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);o.connect(g);g.connect(AU.master);o.start(t);o.stop(t+dur+.05)}
const SFXGAP={rifle:.05,mg:.04,cannon:.08,boom:.06,flame:.09,zdie:.06,growl:.5,build:.15,click:.03,alert:.5,zap:.12,spit:.15,heal:.3,bomb:.05};
function sfx(name,x,y){if(!AU.ctx||!AU.on||!AU.noise)return;const now=performance.now()/1000;if(AU.last[name]&&now-AU.last[name]<(SFXGAP[name]||.05))return;
 let v=1;if(x!==undefined&&typeof cam!=='undefined'){const cx=cam.x+VW/cam.z/2,cy=cam.y+VH/cam.z/2;const d=Math.hypot(x-cx,y-cy)/(Math.max(VW,VH)/cam.z);v=clamp(1.15-d*.9,0,1);if(v<.06)return}
 AU.last[name]=now;
 switch(name){
  case 'rifle':nz(.09,'bandpass',2600,900,.22*v);tone('square',180,60,.05,.04*v);break;
  case 'mg':nz(.06,'bandpass',2200,1100,.14*v);break;
  case 'cannon':nz(.35,'lowpass',900,80,.5*v);tone('sine',120,40,.3,.35*v);break;
  case 'boom':nz(.7,'lowpass',1200,60,.7*v);tone('sine',90,28,.5,.45*v);break;
  case 'flame':nz(.14,'bandpass',900,500,.11*v);break;
  case 'zdie':nz(.18,'lowpass',500,120,.12*v);break;
  case 'growl':tone('sawtooth',90,45,.5,.07*v);break;
  case 'build':nz(.05,'highpass',3000,3000,.2);nz(.05,'highpass',2000,2000,.2,.08);break;
  case 'click':tone('square',900,700,.04,.05);break;
  case 'alert':tone('square',520,520,.12,.07);tone('square',390,390,.2,.07,.14);break;
  case 'zap':nz(.18,'highpass',3500,1500,.22*v);tone('sawtooth',900,200,.15,.06*v);break;
  case 'spit':nz(.12,'bandpass',1200,400,.1*v);break;
  case 'heal':tone('sine',600,900,.2,.03*v);break;
  case 'bomb':tone('sine',500,120,.5,.12*v);break;
  case 'mutate':tone('sawtooth',300,40,1.6,.16);nz(1.4,'lowpass',500,50,.25);break;
  case 'win':[0,.18,.36,.6].forEach((t,i)=>tone('triangle',[392,494,587,784][i],[392,494,587,784][i],.4,.12,t));break;
  case 'lose':tone('sawtooth',200,30,2,.2);break;
  case 'done':tone('triangle',660,990,.25,.08);break;
  case 'horn':tone('sawtooth',110,100,.9,.14);tone('sawtooth',165,150,.9,.08);break;
 }}
