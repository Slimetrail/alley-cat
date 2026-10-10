"use strict";
// ===== Cat configs: add a new cat by adding an entry =====
// Names live here only; rename freely.
const CAT_NAMES={tux:"Trouble",tiger:"Hobs",fluffy:"Fancy"};
// Drawing params: fur, pattern (solid|tabby|tiger|tuxedo|calico|spots), pat, eyes, belly, paws, ear (inner ear), muzzle, chest, fluff (0-1), plush (toy proportions)
const CATS=[
 {id:"tux",fur:"#18181b",pattern:"tuxedo",pat:"#ffffff",eyes:"#a3e635",belly:"#ffffff",paws:"#ffffff",ear:"#f9a8d4",muzzle:"#ffffff",chest:"#ffffff",fluff:0,plush:0,slim:1},
 {id:"tiger",fur:"#e8a33a",pattern:"tiger",pat:"#1c1917",eyes:"#78350f",belly:"#ffffff",paws:"#f5deb3",ear:"#d6d0c4",muzzle:"#f3e3c3",chest:"#ffffff",fluff:0,plush:1,tailStripes:1},
 {id:"fluffy",fur:"#231a15",pattern:"solid",pat:"#4a3426",eyes:"#d9f99d",belly:"#231a15",paws:"#ffffff",ear:"#3f2e24",muzzle:"#2e221b",chest:"#ffffff",chestSpot:1,fluff:1,plush:0,whiskers:"#ffffff"},
].map(c=>({...c,name:CAT_NAMES[c.id]}));
const LS={get:(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:v}catch(e){return d}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(e){}}};
let catIdx=Math.max(0,CATS.findIndex(c=>c.id===LS.get("ac_cat","tux")));
const cv=document.getElementById("c"),g=cv.getContext("2d");
let W,H,DPR;function resize(){DPR=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*DPR;cv.height=H*DPR;g.setTransform(DPR,0,0,DPR,0,0)}addEventListener("resize",resize);resize();
const TEST=/[?&]test=1/.test(location.search);
// ===== Sound =====
let muted=LS.get("ac_mute","0")==="1",AC=null;const muteB=document.getElementById("mute");
function updMute(){muteB.textContent=muted?"🔇":"🔊"}updMute();
muteB.onclick=e=>{e.stopPropagation();muted=!muted;LS.set("ac_mute",muted?"1":"0");updMute()};
function beep(f,d=.1,type="square",f2){if(muted)return;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),v=AC.createGain(),t=AC.currentTime;o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);v.gain.setValueAtTime(.08,t);v.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(v).connect(AC.destination);o.start(t);o.stop(t+d)}catch(e){}}
// Synthesized meows (source-filter: sawtooth + glottal vibrato through gliding formant filters). Throttled, respects mute.
let lastMeow=0,meowNode=null;
function meow(kind){if(muted)return;const now=performance.now();if(now-lastMeow<220)return;lastMeow=now;
 try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();if(AC.state==="suspended")AC.resume();
  if(meowNode){try{meowNode.stop()}catch(e){}}
  const t=AC.currentTime,up=kind==="jump",d=up?.32:.5,o=AC.createOscillator(),v=AC.createOscillator(),vg=AC.createGain(),out=AC.createGain(),mix=AC.createGain();
  o.type="sawtooth";const p=up?[520,900,780]:[330,420,250];o.frequency.setValueAtTime(p[0],t);o.frequency.linearRampToValueAtTime(p[1],t+d*.45);o.frequency.exponentialRampToValueAtTime(p[2],t+d);
  v.frequency.value=up?7:5.5;vg.gain.value=up?12:9;v.connect(vg).connect(o.frequency);
  const F=up?[[900,2400],[1700,3000],[1100,2600]]:[[600,1300],[900,1900],[550,1000]];// m -> e/a -> w/u formants
  [0,1].forEach(i=>{const f=AC.createBiquadFilter();f.type="bandpass";f.Q.value=i?9:6;f.frequency.setValueAtTime(F[0][i],t);f.frequency.linearRampToValueAtTime(F[1][i],t+d*.4);f.frequency.linearRampToValueAtTime(F[2][i],t+d);
   const g2=AC.createGain();g2.gain.value=i?.6:1;o.connect(f).connect(g2).connect(mix)});
  mix.connect(out).connect(AC.destination);out.gain.setValueAtTime(.0001,t);out.gain.exponentialRampToValueAtTime(up?.5:.55,t+.04);out.gain.setValueAtTime(up?.5:.55,t+d*.6);out.gain.exponentialRampToValueAtTime(.0001,t+d);
  o.start(t);v.start(t);o.stop(t+d+.02);v.stop(t+d+.02);meowNode=o;window.__meows=(window.__meows||0)+1}catch(e){}}
window.__meow=meow;
// Synthesized basset "ROOF" bark and "aroooo" howl
function voice(t,d,pts,form,vol,vib){const o=AC.createOscillator(),out=AC.createGain();o.type="sawtooth";o.frequency.setValueAtTime(pts[0],t);pts.slice(1).forEach(([f,k])=>o.frequency.linearRampToValueAtTime(f,t+d*k));
 if(vib){const v=AC.createOscillator(),vg=AC.createGain();v.frequency.value=vib[0];vg.gain.value=vib[1];v.connect(vg).connect(o.frequency);v.start(t);v.stop(t+d+.05)}
 form.forEach(([a,b,q,g])=>{const f=AC.createBiquadFilter();f.type="bandpass";f.Q.value=q;f.frequency.setValueAtTime(a,t);f.frequency.linearRampToValueAtTime(b,t+d);const gg=AC.createGain();gg.gain.value=g;o.connect(f).connect(gg).connect(out)});
 out.connect(AC.destination);out.gain.setValueAtTime(.0001,t);out.gain.exponentialRampToValueAtTime(vol,t+.025);out.gain.setValueAtTime(vol,t+d*.5);out.gain.exponentialRampToValueAtTime(.0001,t+d);o.start(t);o.stop(t+d+.05)}
function bark(n,loud){if(muted)return;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();const t=AC.currentTime;
 for(let i=0;i<n;i++)voice(t+i*.26,.22,[150,[230,.25],[120,1]],[[500,350,4,1.4],[1100,800,6,.7],[2400,1800,8,.25]],loud?1.1:.75,null);window.__barks=(window.__barks||0)+n}catch(e){}}
function howl(){if(muted)return;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();const t=AC.currentTime;
 voice(t,1.8,[240,[420,.25],[460,.6],[300,1]],[[500,900,5,1.2],[900,1200,7,.6],[2300,2600,9,.2]],.6,[5,10]);window.__howls=(window.__howls||0)+1}catch(e){}}
// ===== State =====
const S={mode:"start",t:0,speed:0,dist:0,fish:0,lane:0,x:0,y:0,vy:0,slide:0,stumble:0,gap:3,objs:[],deco:[],nextRow:20,caughtT:0,best:+LS.get("ac_best","0")||0,flash:0,lives:3,inv:0,hits:0,hitT:0,appT:0,hankY:0};
window.__ac=S;
function reset(){Object.assign(S,{mode:"run",t:0,speed:9,dist:0,fish:0,lane:0,x:0,y:0,vy:0,slide:0,stumble:0,gap:3,objs:[],nextRow:25,caughtT:0,lives:3,inv:0,hits:0,hitT:0,appT:0,hankY:0});S.deco=[];updLives();for(let z=0;z<80;z+=6)addDeco(z)}
function addDeco(z){const side=Math.random()<.5?-1:1;S.deco.push({z,side,k:["door","escape","puddle","door","door"][Math.random()*5|0],col:Math.random()*5|0,light:Math.random()<.5,metal:Math.random()<.4})}
const spawn=(type,lane,z)=>S.objs.push({type,lane,z});window.__spawn=spawn;
// Row generator: cans in random lanes (1 or 2 blocked, never 3); long brooms/mops span 1-3 lanes (jumpable);
// free lane of a 2-can row is never more than 1 lane from the previous row's free lane (no impossible double switches).
let lastFree=0;
function genRow(z){const r=Math.random(),L=[-1,0,1];let free;
 if(r<.45){const two=Math.random()<.4;const opts=two?L.filter(l=>Math.abs(l-lastFree)<=1):L;free=opts[Math.random()*opts.length|0];
  const block=L.filter(l=>l!==free);if(two)block.forEach(l=>spawn("can",l,z));else spawn("can",block[Math.random()*2|0],z)}
 else if(r<.75){const w=1+(Math.random()*3|0),c=w===3?0:w===2?(Math.random()<.5?-.5:.5):L[Math.random()*3|0];S.objs.push({type:"broom",lane:c,w,z,mop:Math.random()<.5});free=w===3?L[Math.random()*3|0]:L.find(l=>Math.abs(l-c)>=w/2+.01)??lastFree}
 else{const l=L[Math.random()*3|0];spawn("boy",l,z);free=L.find(l2=>l2!==l)}
 lastFree=free;for(let i=0;i<5;i++)spawn("fish",free,z+3+i*2.2);return free}
window.__genRow=genRow;
// ===== Input =====
function act(a){if(S.mode!=="run")return;
 if(a==="L"&&S.lane>-1){S.lane--;beep(500,.06)}if(a==="R"&&S.lane<1){S.lane++;beep(500,.06)}
 if(a==="U"&&S.y<=0){S.vy=9.5;S.slide=0;meow("jump")}if(a==="D"){S.slide=.75;if(S.y>0)S.vy=-14;meow("duck")}}
window.__act=act;
addEventListener("keydown",e=>{const m={ArrowLeft:"L",a:"L",A:"L",ArrowRight:"R",d:"R",D:"R",ArrowUp:"U",w:"U",W:"U"," ":"U",ArrowDown:"D",s:"D",S:"D"}[e.key];if(m){e.preventDefault();act(m)}});
let ts=null;cv.addEventListener("touchstart",e=>{const t=e.touches[0];ts={x:t.clientX,y:t.clientY,done:0}},{passive:true});
cv.addEventListener("touchmove",e=>{if(!ts||ts.done)return;const t=e.touches[0],dx=t.clientX-ts.x,dy=t.clientY-ts.y;if(Math.max(Math.abs(dx),Math.abs(dy))>30){ts.done=1;act(Math.abs(dx)>Math.abs(dy)?(dx<0?"L":"R"):(dy<0?"U":"D"))}},{passive:true});
cv.addEventListener("touchend",()=>ts=null);
// ===== UI =====
const $=id=>document.getElementById(id);
function buildPicker(){const p=document.createElement("div");p.id="picker";p.style.cssText="display:flex;gap:10px";
 CATS.forEach((c,i)=>{const b=document.createElement("button");b.className="catpick";b.dataset.id=c.id;b.style.cssText="border:4px solid "+(i===catIdx?"#ffd84a":"transparent")+";background:#ffffff18;border-radius:16px;padding:6px;color:#fff;font-weight:800;font-size:14px";
  const k=document.createElement("canvas");k.width=k.height=160;k.style.width=k.style.height="80px";const kg=k.getContext("2d");kg.scale(2,2);kg.translate(40,52);drawCat(kg,c,0,1,0,0,true);
  b.append(k,document.createElement("br"),c.name);b.onclick=()=>{catIdx=i;LS.set("ac_cat",c.id);buildPicker()};p.append(b)});
 const old=$("picker");old?old.replaceWith(p):$("play").before(p)}
function showStart(){$("bestS").textContent="Best: "+S.best+" m";buildPicker()}
$("play").onclick=()=>{$("start").classList.add("hidden");reset()};
$("again").onclick=()=>{$("over").classList.add("hidden");reset()};
// ===== Score + Top 10 =====
const TOPK="ac_top10";
function loadTop(){let a;try{a=JSON.parse(LS.get(TOPK,"[]"))}catch(e){a=[]}if(!Array.isArray(a))a=[];
 const n=v=>Number.isFinite(v)&&v>=0&&v<1e7;
 return a.filter(e=>e&&typeof e.i==="string"&&/^[A-Z]{3}$/.test(e.i)&&n(e.s)&&n(e.d)&&n(e.f)).map(e=>({i:e.i,s:Math.round(e.s),d:Math.round(e.d),f:Math.round(e.f),t:+e.t||0})).sort((x,y)=>y.s-x.s||x.t-y.t).slice(0,10)}
function qualifies(s){const t=loadTop();return s>0&&(t.length<10||s>t[t.length-1].s)}
function insertTop(e){e.t=e.t||Date.now();const t=loadTop();t.push(e);t.sort((x,y)=>y.s-x.s||x.t-y.t);const r=t.slice(0,10);LS.set(TOPK,JSON.stringify(r));return r.indexOf(e)}
const score=(d,f)=>Math.round(d)+5*f;window.__top={loadTop,insertTop,qualifies,score};
function boardHTML(hi){const t=loadTop();if(!t.length)return"<p>No scores yet. Go run!</p>";
 return"<table><tr><th>#</th><th>Name</th><th>Score</th><th>m</th><th>🐟</th></tr>"+t.map((e,k)=>`<tr class="${k===hi?"new":""}"><td>${k+1}</td><td>${e.i}</td><td>${e.s}</td><td>${e.d}</td><td>${e.f}</td></tr>`).join("")+"</table>"}
let ini=[0,0,0],pending=null;
function buildIni(){const w=$("iniCols");w.innerHTML="";ini.forEach((v,k)=>{const c=document.createElement("div");c.className="col";
 const up=document.createElement("button");up.textContent="▲";up.className="up";up.onclick=()=>{ini[k]=(ini[k]+1)%26;buildIni()};
 const L=document.createElement("div");L.className="L";L.textContent=String.fromCharCode(65+v);
 const dn=document.createElement("button");dn.textContent="▼";dn.className="dn";dn.onclick=()=>{ini[k]=(ini[k]+25)%26;buildIni()};c.append(up,L,dn);w.append(c)})}
$("iniSave").onclick=()=>{if(!pending)return;pending.i=ini.map(v=>String.fromCharCode(65+v)).join("");LS.set("ac_ini",pending.i);const r=insertTop(pending);pending=null;
 $("ini").classList.add("hidden");$("overBoard").innerHTML=boardHTML(r);$("again").classList.remove("hidden");$("home").classList.remove("hidden")};
function gameOver(){S.mode="over";$("overT").textContent="SLURP! 💦";$("overSub").textContent="Hank gave "+CATS[catIdx].name+" a bath!";const d=Math.round(S.dist),sc=score(S.dist,S.fish);if(d>S.best){S.best=d;LS.set("ac_best",d)}
 $("res").innerHTML=`Distance: <b>${d}</b> m<br>🐟 Fish: <b>${S.fish}</b> × 5 = <b>${S.fish*5}</b><br><span style="font-size:24px">⭐ Score: <b>${sc}</b></span>`;
 $("overBoard").innerHTML="";$("over").classList.remove("hidden");
 if(qualifies(sc)){pending={s:sc,d,f:S.fish};const p=LS.get("ac_ini","AAA");ini=[0,1,2].map(k=>Math.max(0,p.charCodeAt(k)-65)%26);buildIni();$("ini").classList.remove("hidden");$("again").classList.add("hidden");$("home").classList.add("hidden")}
 else{$("ini").classList.add("hidden");$("overBoard").innerHTML=boardHTML(-1);$("again").classList.remove("hidden");$("home").classList.remove("hidden")}}
$("topBtn").onclick=()=>{$("boardList").innerHTML=boardHTML(-1);$("start").classList.add("hidden");$("board").classList.remove("hidden")};
$("boardBack").onclick=()=>{$("board").classList.add("hidden");showStart();$("start").classList.remove("hidden")};
$("home").onclick=()=>{$("over").classList.add("hidden");S.mode="start";showStart();$("start").classList.remove("hidden")};
function updLives(){$("lives").textContent="❤️".repeat(S.lives)+"🤍".repeat(3-S.lives)}
// Hits ARE the lives (3 hearts). Hit 1: Hank's head peeks in. Hit 2: half his body. Hit 3: full-screen lick scene, then game over.
function hit(){if(S.inv>0||S.mode!=="run")return;if(S.hits===0)S.appT=0;S.hits++;S.lives=3-S.hits;updLives();S.flash=.6;if(S.hits>=3){S.mode="caught";S.caughtT=0;howl();return}S.inv=1.2;S.hits===1?bark(1,false):bark(2,true)}
// ===== Update =====
function update(dt){S.t+=dt;if(S.mode==="caught"){S.caughtT+=dt;if(S.caughtT>2.6)gameOver();return}if(S.mode!=="run")return;
 S.speed=Math.min(26,9+S.t*.25);const dz=S.speed*dt;S.dist+=dz;
 S.x+=(S.lane-S.x)*Math.min(1,dt*14);S.vy-=28*dt;S.y=Math.max(0,S.y+S.vy*dt);if(S.y===0)S.vy=Math.max(0,S.vy);S.slide=Math.max(0,S.slide-dt);
 S.appT+=dt;S.stumble=S.hits;S.flash=Math.max(0,S.flash-dt);S.inv=Math.max(0,S.inv-dt);S.gap+=((S.stumble>0?1.1:3)-S.gap)*Math.min(1,dt*3);
 for(const o of S.objs)o.z-=dz;for(const d of S.deco)d.z-=dz;
 if(!TEST){S.nextRow-=dz;if(S.nextRow<=0){genRow(60);S.nextRow=Math.max(11,18-S.t*.08)+Math.random()*8}}
 S.deco=S.deco.filter(d=>d.z>-3);while(S.deco.length<14)addDeco(Math.max(...S.deco.map(d=>d.z),0)+6);
 for(const o of S.objs){if(o.done||Math.abs(o.z)>.6||Math.abs(o.lane-S.x)>(o.w||1)/2)continue;
  if(o.type==="fish"){if(S.y<1.6){o.done=1;S.fish++;beep(1200,.08,"sine",1800)}}
  else if(o.type==="broom"){o.done=1;if(S.y<.45)hit()}else if(o.type==="boy"){o.done=1;if(S.slide<=0)hit()}else if(o.type==="can"){o.done=1;hit()}}
 S.objs=S.objs.filter(o=>o.z>-3&&!(o.done&&o.type==="fish"));
 $("fish").textContent="🐟 "+S.fish;$("dist").textContent=Math.floor(S.dist)+" m"}
// ===== Projection =====
const D=5;function P(x,z,y=0){const s=D/(D+z),hz=H*.34,gy=H*.76;return{x:W/2+x*W*.3*s,y:hz+(gy-hz)*s-y*W*.3*s,s}}
// ===== Drawing =====
function drawCat(c,cat,run,sc,slide,jump,still){c.save();c.scale(sc,sc);const leg=still?0:Math.sin(run*18)*6,F=cat.fluff||0,pl=cat.plush?1.15:1,sl=cat.slim?.88:1;
 if(slide){c.scale(1.25,.6);c.translate(0,14)}
 const bw=18*sl*(1+F*.25),bh=20*(1+F*.1),hr=16*pl*(1+F*.15);
 // tail (fluffy = thick, tiger = striped)
 c.lineCap="round";const tail=()=>{c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(24,-8+leg,15,-32);};
 c.strokeStyle=cat.fur;c.lineWidth=7+F*9+(cat.plush?3:0);tail();c.stroke();
 if(cat.tailStripes){c.strokeStyle=cat.pat;c.lineWidth=c.lineWidth+1;c.setLineDash([3,5]);tail();c.stroke();c.setLineDash([])}
 // legs + paws
 [[-11,leg],[11,-leg]].forEach(([x,l])=>{c.fillStyle=cat.pattern==="tuxedo"?cat.belly:cat.fur;c.beginPath();c.ellipse(x*sl,12+l*.4,6*pl,8,0,0,7);c.fill();c.fillStyle=cat.paws;c.beginPath();c.ellipse(x*sl,18+l*.4,6*pl,4,0,0,7);c.fill()});
 // body
 c.fillStyle=cat.fur;c.beginPath();c.ellipse(0,0,bw,bh,0,0,7);c.fill();
 if(F){c.fillStyle=cat.pat;for(let i=0;i<9;i++){const a=i/9*6.28;c.beginPath();c.arc(Math.cos(a)*bw*.9,Math.sin(a)*bh*.9,4,0,7);c.fill()}c.fillStyle=cat.fur;c.beginPath();c.ellipse(0,0,bw*.9,bh*.9,0,0,7);c.fill()}
 if(cat.pattern==="tabby"||cat.pattern==="tiger"){c.strokeStyle=cat.pat;c.lineWidth=cat.pattern==="tiger"?4:3;for(let i=-1;i<=1;i++){c.beginPath();c.arc(0,i*8+4,bw-3,3.7,5.7);c.stroke()}}
 if(cat.pattern==="tuxedo"){c.fillStyle=cat.belly;c.beginPath();c.ellipse(0,12,bw*.7,8,0,0,7);c.fill()}
 if(cat.pattern==="calico"){c.fillStyle=cat.pat;c.beginPath();c.ellipse(-7,-4,7,8,0,0,7);c.fill()}
 if(cat.pattern==="spots"){c.fillStyle=cat.pat;[[-8,-6],[7,2],[-3,9]].forEach(([x,y])=>{c.beginPath();c.arc(x,y,3.5,0,7);c.fill()})}
 if(still){// front view: chest bib/spot
  c.fillStyle=cat.chest;c.beginPath();cat.chestSpot?c.arc(0,-6,4,0,7):c.ellipse(0,-2,bw*.55,bh*.6,0,0,7);c.fill()}
 // head
 const hy=-26;c.fillStyle=cat.fur;c.beginPath();c.ellipse(0,hy,hr,hr*.88,0,0,7);c.fill();
 if(F){c.beginPath();c.ellipse(0,hy+4,hr+3,hr*.7,0,0,7);c.fill()}
 [-1,1].forEach(s=>{c.fillStyle=cat.fur;c.beginPath();c.moveTo(s*hr*.88,hy-4);c.lineTo(s*hr*.7,hy-hr*1.4+ (cat.plush?5:0));c.lineTo(s*3,hy-11);c.fill();c.fillStyle=cat.ear;c.beginPath();c.moveTo(s*hr*.72,hy-8);c.lineTo(s*hr*.68,hy-hr*1.25+(cat.plush?5:0));c.lineTo(s*5,hy-11);c.fill()});
 if(cat.pattern==="tabby"||cat.pattern==="tiger"){c.strokeStyle=cat.pat;c.lineWidth=2.5;[-5,0,5].forEach(x=>{c.beginPath();c.moveTo(x,hy-13);c.lineTo(x,hy-6);c.stroke()});if(still)[-1,1].forEach(s=>{c.beginPath();c.moveTo(s*hr,hy);c.lineTo(s*hr*.6,hy+1);c.stroke()})}
 if(still){c.fillStyle=cat.muzzle;c.beginPath();c.ellipse(0,hy+5,8*pl,6,0,0,7);c.fill();
  [-6,6].forEach(x=>{c.fillStyle=cat.eyes;c.beginPath();c.ellipse(x*pl,hy-2,3.5,4,0,0,7);c.fill();c.fillStyle="#000";c.beginPath();c.ellipse(x*pl,hy-2,1.3,3,0,0,7);c.fill()});
  c.fillStyle="#ec4899";c.beginPath();c.moveTo(-2,hy+3);c.lineTo(2,hy+3);c.lineTo(0,hy+5);c.fill();
  c.strokeStyle=cat.whiskers||"#ffffffaa";c.lineWidth=.8;[-1,1].forEach(s=>[-2,1,4].forEach(d=>{c.beginPath();c.moveTo(s*5,hy+5);c.lineTo(s*(cat.whiskers?24:17),hy+3+d);c.stroke()}))}
 c.restore()}
function drawHank(c,sc,run){c.save();c.scale(sc,sc);const b=Math.abs(Math.sin(run*12))*-6,ef=Math.sin(run*12)*.5;c.translate(0,b);
 const W_="#fafaf9",T="#b8692e",K="#1c1917";
 // tail wagging up behind, white tip
 c.strokeStyle=K;c.lineWidth=7;c.lineCap="round";const tw=Math.sin(run*14)*12;c.beginPath();c.moveTo(0,-10);c.quadraticCurveTo(tw,-40,tw*1.5,-58);c.stroke();c.fillStyle=W_;c.beginPath();c.arc(tw*1.5,-58,5,0,7);c.fill();
 // body with black saddle
 c.fillStyle=W_;c.beginPath();c.ellipse(0,4,28,20,0,0,7);c.fill();c.fillStyle=K;c.beginPath();c.ellipse(0,-6,26,11,0,3.14,6.29);c.fill();c.fillStyle=T;c.beginPath();c.ellipse(-22,-2,8,10,0,0,7);c.ellipse(22,-2,8,10,0,0,7);c.fill();c.fillStyle=W_;c.beginPath();c.ellipse(0,-6,18,6,0,0,7);c.fill();
 // legs (white)
 c.fillStyle=W_;const l=Math.sin(run*16)*5;[[-14,l],[14,-l]].forEach(([x,y])=>{c.beginPath();c.ellipse(x,22+y,7,7,0,0,7);c.fill()});
 // head (tan), white chest
 c.fillStyle=W_;c.beginPath();c.ellipse(0,8,14,12,0,0,7);c.fill();
 const hy=-18;c.fillStyle=T;c.beginPath();c.ellipse(0,hy,20,18,0,0,7);c.fill();
 // long droopy ears flopping
 [-1,1].forEach(s=>{c.save();c.translate(s*17,hy-8);c.rotate(s*(.15+ef*s*.5));c.fillStyle="#8a4b1f";c.beginPath();c.ellipse(s*4,18,8,20,0,0,7);c.fill();c.restore()});
 // white blaze + muzzle
 c.fillStyle=W_;c.beginPath();c.moveTo(-3,hy-17);c.lineTo(3,hy-17);c.lineTo(8,hy+4);c.lineTo(-8,hy+4);c.fill();c.beginPath();c.ellipse(0,hy+9,12,9,0,0,7);c.fill();
 // sad puppy eyes
 [-8,8].forEach(x=>{c.fillStyle="#fff";c.beginPath();c.ellipse(x,hy-3,5,5.5,0,0,7);c.fill();c.fillStyle="#5b3412";c.beginPath();c.arc(x,hy-2,3.6,0,7);c.fill();c.fillStyle="#fff";c.beginPath();c.arc(x+1.2,hy-3.5,1.2,0,7);c.fill();
  c.strokeStyle="#5b3412";c.lineWidth=2;c.beginPath();c.moveTo(x-5,hy-9+(x<0?0:-3));c.lineTo(x+5,hy-9+(x<0?-3:0));c.stroke()});
 c.fillStyle=K;c.beginPath();c.ellipse(0,hy+5,6,4.5,0,0,7);c.fill();c.fillStyle="#fff";c.beginPath();c.arc(-2,hy+4,1.3,0,7);c.fill();
 c.fillStyle="#f472b6";c.beginPath();c.ellipse(0,hy+15,4,5+b*-.3,0,0,7);c.fill();c.restore()}
// Back view (running away from camera toward the cat): basset proportions, long low body, short legs
function drawHankBack(c,sc,run){c.save();c.scale(sc,sc);const b=Math.abs(Math.sin(run*12))*-4,ef=Math.sin(run*12)*.6;c.translate(0,b);
 const W_="#fafaf9",T="#b8692e",K="#1c1917",l=Math.sin(run*16)*4;
 // short white legs, white feet
 c.fillStyle=W_;[[-17,l],[17,-l]].forEach(([x,y])=>{c.beginPath();c.ellipse(x,26+y,7,7,0,0,7);c.fill()});
 // head + droopy ears (farthest)
 const hy=-34;c.fillStyle=T;c.beginPath();c.ellipse(0,hy,15,13,0,0,7);c.fill();
 [-1,1].forEach(s=>{c.save();c.translate(s*12,hy-2);c.rotate(s*(.3+ef*s*.6));c.fillStyle="#7a3f17";c.beginPath();c.ellipse(s*3,13,7,17,0,0,7);c.fill();c.restore()});
 // white collar ring
 c.fillStyle=W_;c.beginPath();c.ellipse(0,-21,16,6,0,0,7);c.fill();
 // long low body: white belly, big black saddle, tan shoulders and rump
 c.fillStyle=W_;c.beginPath();c.ellipse(0,6,27,22,0,0,7);c.fill();
 c.fillStyle=T;c.beginPath();c.ellipse(-14,-12,9,7,0,0,7);c.ellipse(14,-12,9,7,0,0,7);c.fill();
 c.fillStyle=K;c.beginPath();c.ellipse(0,-2,25,17,0,0,7);c.fill();
 c.fillStyle=T;c.beginPath();c.ellipse(0,15,23,11,0,0,7);c.fill();c.fillStyle=W_;c.beginPath();c.ellipse(0,9,4,2.5,0,0,7);c.fill();// tan rump + small white mark
 // long black tail with tan base and white tip, wagging
 const tw=Math.sin(run*14)*16;c.lineCap="round";c.strokeStyle=K;c.lineWidth=6;c.beginPath();c.moveTo(0,14);c.quadraticCurveTo(tw*.6,-6,tw*1.4,-34);c.stroke();
 c.strokeStyle=T;c.lineWidth=7;c.beginPath();c.moveTo(0,14);c.lineTo(tw*.15,6);c.stroke();c.fillStyle=W_;c.beginPath();c.ellipse(tw*1.4,-36,4,6,0,0,7);c.fill();
 c.restore()}
function drawLickScene(c,cat,t){const k=Math.min(W,H*.6)/390*.74,cx=W*.65,cy=H*.62,lk=(Math.sin(t*8)+1)/2,fade=Math.min(1,t*4);
 c.save();c.globalAlpha=fade;const bg=c.createRadialGradient(W/2,H/2,50,W/2,H/2,H*.7);bg.addColorStop(0,"#fde68a");bg.addColorStop(1,"#f59e0b");c.fillStyle=bg;c.fillRect(0,0,W,H);
 c.fillStyle="#ffffff30";for(let i=0;i<12;i++){c.beginPath();c.moveTo(W/2,H/2);c.arc(W/2,H/2,H,i*.52+t*.3,i*.52+.26+t*.3);c.fill()}
 c.translate(cx,cy);c.scale(k,k);
 // --- cat (big head + shoulders) ---
 const F=cat.fluff||0,fur=cat.fur;
 c.fillStyle=fur;c.beginPath();c.ellipse(0,150,150,90,0,Math.PI,0);c.fill();c.fillRect(-150,150,300,300);
 c.fillStyle=cat.chest;c.beginPath();cat.chestSpot?c.ellipse(0,170,22,26,0,0,7):c.ellipse(0,190,70,70,0,0,7);c.fill();
 if(F){c.fillStyle=fur;for(let i=0;i<14;i++){const a=Math.PI+i/13*Math.PI;c.beginPath();c.arc(Math.cos(a)*112,40+Math.sin(a)*96,22,0,7);c.fill()}}
 // ears (flattened, grumpy)
 [-1,1].forEach(s=>{c.fillStyle=fur;c.beginPath();c.moveTo(s*40,-70);c.lineTo(s*135,-75);c.lineTo(s*90,-10);c.fill();c.fillStyle=cat.ear;c.beginPath();c.moveTo(s*55,-60);c.lineTo(s*118,-68);c.lineTo(s*88,-25);c.fill()});
 c.fillStyle=fur;c.beginPath();c.ellipse(0,20,115,(cat.plush?105:98),0,0,7);c.fill();
 if(F){for(let i=0;i<10;i++){const a=.3+i/9*2.5;c.beginPath();c.arc(Math.cos(a)*112,20+Math.sin(a)*92,18,0,7);c.fill()}}
 if(cat.pattern==="tabby"||cat.pattern==="tiger"){c.strokeStyle=cat.pat;c.lineWidth=11;c.lineCap="round";[-30,0,30].forEach(x=>{c.beginPath();c.moveTo(x,-72);c.lineTo(x*.8,-30);c.stroke()});
  [-1,1].forEach(s=>[0,26,52].forEach(y=>{c.beginPath();c.moveTo(s*112,y);c.lineTo(s*72,y+8);c.stroke()}))}
 if(cat.pattern==="tuxedo"){c.fillStyle=cat.muzzle;c.beginPath();c.moveTo(0,-5);c.quadraticCurveTo(-65,70,-55,90);c.lineTo(55,90);c.quadraticCurveTo(65,70,0,-5);c.fill()}
 // muzzle
 c.fillStyle=cat.muzzle;c.beginPath();c.ellipse(-24,62,30,24,0,0,7);c.ellipse(24,62,30,24,0,0,7);c.fill();
 c.fillStyle="#ec4899";c.beginPath();c.moveTo(-12,42);c.lineTo(12,42);c.lineTo(0,56);c.fill();
 c.strokeStyle="#000";c.lineWidth=3.5;c.beginPath();c.moveTo(-26,92);c.quadraticCurveTo(0,76,26,92);c.stroke();// frown
 // grumpy half-closed eyes
 [-1,1].forEach(s=>{const ex=s*45,ey=8;c.fillStyle=cat.eyes;c.beginPath();c.ellipse(ex,ey,22,17,0,0,7);c.fill();c.fillStyle="#000";c.beginPath();c.ellipse(ex,ey+3,6,12,0,0,7);c.fill();
  c.fillStyle=fur;c.beginPath();c.ellipse(ex,ey-12,27,17,s*.25,0,7);c.fill();c.strokeStyle="#000";c.lineWidth=5;c.beginPath();c.moveTo(ex-24,ey-4+s*-4*0);c.lineTo(ex+24,ey-2+(s<0?-6:6)*-1);c.stroke();
  c.fillStyle="#fff";c.beginPath();c.arc(ex+8,ey+6,3.5,0,7);c.fill()});
 c.strokeStyle=cat.whiskers||"#ffffffcc";c.lineWidth=2;[-1,1].forEach(s=>[-6,4,14].forEach(d=>{c.beginPath();c.moveTo(s*40,64);c.lineTo(s*(cat.whiskers?160:130),56+d*1.6);c.stroke()}));
 // wet shine
 c.fillStyle="#ffffff55";[[-50,-40,24,9,-.5],[30,-55,18,7,.4],[80,20,12,5,1]].forEach(([x,y,a,b,r])=>{c.beginPath();c.ellipse(x,y,a,b,r,0,7);c.fill()});
 // slobber puddle on head
 c.fillStyle="#bae6fdcc";c.strokeStyle="#38bdf8";c.lineWidth=3;c.beginPath();c.ellipse(-40,-80,60,18,-.15,0,7);c.fill();c.stroke();
 // drips running down & falling off
 for(let i=0;i<8;i++){const ph=(t*.9+i*.37)%1,x=[-118,-104,-92,92,106,120,-62,-20][i],y0=x>-70&&x<0?-88:-40,y=y0+ph*(x>-70&&x<0?40:240);c.globalAlpha=fade*(1-ph*.5);
  c.fillStyle="#bae6fd";c.beginPath();c.moveTo(x-4,y0);c.lineTo(x+4,y0);c.lineTo(x+3,y-10);c.quadraticCurveTo(x+12,y+6,x,y+10);c.quadraticCurveTo(x-12,y+6,x-3,y-10);c.fill();c.stroke()}
 c.globalAlpha=fade;
 // --- Hank from the left, licking the cat's head ---
 c.save();c.translate(-175,-175);c.rotate(.35);const W_="#fafaf9",T="#b8692e";
 c.fillStyle=W_;c.beginPath();c.ellipse(-120,190,150,70,0,0,7);c.fill();c.fillStyle="#1c1917";c.beginPath();c.ellipse(-150,150,140,55,0,0,7);c.fill();c.fillStyle=T;c.beginPath();c.ellipse(-30,150,45,40,0,0,7);c.fill();c.fillStyle=W_;c.beginPath();c.ellipse(5,95,40,55,.4,0,7);c.fill();
 c.fillStyle=T;c.beginPath();c.ellipse(0,0,95,85,0,0,7);c.fill();c.beginPath();c.ellipse(85,30,80,48,.1,0,7);c.fill();// snout to the right
 c.fillStyle=W_;c.beginPath();c.ellipse(100,40,70,38,.1,0,7);c.fill();c.beginPath();c.moveTo(-10,-82);c.lineTo(20,-82);c.lineTo(70,10);c.lineTo(20,20);c.fill();// blaze
 c.fillStyle="#111";c.beginPath();c.ellipse(165,22,22,17,0,0,7);c.fill();c.fillStyle="#fff";c.beginPath();c.arc(158,15,5,0,7);c.fill();
 c.fillStyle="#fff";c.beginPath();c.ellipse(20,-12,15,13,0,0,7);c.fill();c.fillStyle="#5b3412";c.beginPath();c.arc(24,-10,9,0,7);c.fill();c.fillStyle="#fff";c.beginPath();c.arc(27,-14,3,0,7);c.fill();
 c.strokeStyle="#5b3412";c.lineWidth=5;c.beginPath();c.moveTo(5,-32);c.quadraticCurveTo(22,-40,38,-28);c.stroke();
 c.fillStyle="#8a4b1f";c.save();c.translate(-50,-20);c.rotate(.2+Math.sin(t*6)*.12);c.beginPath();c.ellipse(0,70,34,80,0,0,7);c.fill();c.restore();
 c.restore();
 // big tongue licking the top of the cat's head
 c.save();c.translate(-40,-100+lk*14);c.rotate(.35);c.fillStyle="#f472b6";c.strokeStyle="#db2777";c.lineWidth=4;c.beginPath();c.ellipse(0,0,58,24,0,0,7);c.fill();c.stroke();c.beginPath();c.moveTo(-40,0);c.lineTo(40,0);c.stroke();c.restore();
 c.restore();
 // caption
 c.save();c.globalAlpha=fade;c.textAlign="center";c.font="900 34px system-ui,sans-serif";c.lineWidth=7;c.strokeStyle="#7c2d12";c.fillStyle="#fff";
 const cap="SLUUURP! 💦";c.strokeText(cap,W/2,H*.16);c.fillText(cap,W/2,H*.16);c.font="800 20px system-ui,sans-serif";c.lineWidth=5;
 const c2=cat.name+" got a Hank bath!";c.strokeText(c2,W/2,H*.16+34);c.fillText(c2,W/2,H*.16+34);c.restore()}
// Back-alley door set into the side wall, drawn on the wall plane in perspective
const DOORC=["#7c2d12","#1e3a8a","#166534","#4b5563","#7e22ce"];
function drawDoor(c,o){const X=o.side*1.6,z0=o.z,z1=o.z+1.1,q=(z,h)=>P(X,z,h);
 const quad=(za,zb,ha,hb,fill,stroke)=>{const a=q(za,ha),b=q(zb,ha),d=q(zb,hb),e=q(za,hb);c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.lineTo(d.x,d.y);c.lineTo(e.x,e.y);c.closePath();c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=Math.max(1,2*a.s);c.stroke()}};
 // step (concrete slab on the ground in front of the door)
 const st=[P(X,z0-.1),P(X,z1+.1),P(X-o.side*.22,z1+.1),P(X-o.side*.22,z0-.1)];c.beginPath();st.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fillStyle="#a8a29e";c.fill();c.strokeStyle="#78716c";c.lineWidth=1;c.stroke();
 quad(z0-.12,z1+.12,0,2.25,"#3f3f46");// frame
 quad(z0,z1,0,2.1,o.metal?"#64748b":DOORC[o.col],"#00000055");// door
 if(o.metal){for(let h=.4;h<2;h+=.45)quad(z0+.05,z1-.05,h,h+.04,"#94a3b8")}else{quad(z0+.15,z1-.15,1.15,1.9,"#00000022");quad(z0+.15,z1-.15,.25,1,"#00000022")}
 const kz=o.side>0?z0+.18:z0+.18,k=q(kz,1.0);c.fillStyle="#facc15";c.beginPath();c.arc(k.x,k.y,Math.max(1.5,5*k.s),0,7);c.fill();
 if(o.light){const l=q((z0+z1)/2,2.45);c.fillStyle="#fde68a44";c.beginPath();c.arc(l.x,l.y+6*l.s,40*l.s,0,7);c.fill();c.fillStyle="#1f2937";c.fillRect(l.x-8*l.s,l.y-4*l.s,16*l.s,5*l.s);c.fillStyle="#fef08a";c.beginPath();c.arc(l.x,l.y+3*l.s,6*l.s,0,Math.PI);c.fill()}}
function drawBoy(c,sc,t){c.save();c.scale(sc,sc);const w=Math.sin(t*5)*2;
 // toy stick spanning the whole lane at cat head height (red/white candy stripes)
 const sy=-62+w;c.fillStyle="#fff";c.strokeStyle="#7c2d12";c.lineWidth=2;c.beginPath();c.roundRect(-62,sy-6,124,12,6);c.fill();c.stroke();
 c.fillStyle="#ef4444";for(let x=-56;x<56;x+=14){c.beginPath();c.moveTo(x,sy-6);c.lineTo(x+7,sy-6);c.lineTo(x+3,sy+6);c.lineTo(x-4,sy+6);c.fill()}
 c.fillStyle="#facc15";c.beginPath();c.arc(-62,sy,8,0,7);c.fill();c.stroke();
 const bx=78;// boy at lane edge
 c.fillStyle="#1e3a8a";c.fillRect(bx-12,-4,10,26);c.fillRect(bx+2,-4,10,26);c.fillStyle="#111";c.fillRect(bx-14,20,13,5);c.fillRect(bx+1,20,13,5);
 c.fillStyle="#22c55e";c.beginPath();c.roundRect(bx-16,-46,32,44,8);c.fill();c.fillStyle="#fff";c.fillRect(bx-16,-30,32,5);
 // arms reaching to hold stick
 c.strokeStyle="#fcd9a8";c.lineWidth=7;c.lineCap="round";c.beginPath();c.moveTo(bx-12,-40);c.lineTo(bx-30,sy+2);c.moveTo(bx+12,-40);c.lineTo(bx-18,sy+4);c.stroke();
 c.fillStyle="#fcd9a8";c.beginPath();c.arc(bx-30,sy,6,0,7);c.arc(bx-18,sy+2,6,0,7);c.fill();
 // head
 const hy=-64;c.beginPath();c.arc(bx,hy,17,0,7);c.fill();c.beginPath();c.arc(bx-17,hy+2,4,0,7);c.arc(bx+17,hy+2,4,0,7);c.fill();
 c.fillStyle="#f97316";[-6,6].forEach(d=>{c.beginPath();c.arc(bx+d*1.6,hy+6,3.5,0,7);c.fill()});// freckle cheeks
 c.fillStyle="#fff";[-6,6].forEach(d=>{c.beginPath();c.ellipse(bx+d,hy-1,4,5,0,0,7);c.fill()});c.fillStyle="#3b2a1a";[-6,6].forEach(d=>{c.beginPath();c.arc(bx+d-1,hy,2.4,0,7);c.fill()});
 c.strokeStyle="#7c2d12";c.lineWidth=2;c.beginPath();c.arc(bx,hy+5,6,.2,2.9);c.stroke();c.fillStyle="#fff";c.fillRect(bx-3,hy+8,6,3);
 // cap (red, brim to the side)
 c.fillStyle="#dc2626";c.beginPath();c.arc(bx,hy-5,17,Math.PI,0);c.fill();c.fillRect(bx-26,hy-7,22,5);c.fillStyle="#fff";c.beginPath();c.arc(bx,hy-21,3,0,7);c.fill();
 c.restore()}
function drawBroom(c,sc,mop,w){c.save();c.scale(sc,sc);const half=w*45-6;
 c.fillStyle="#00000040";c.beginPath();c.ellipse(0,3,half+10,6,0,0,7);c.fill();
 c.fillStyle="#a16207";c.strokeStyle="#713f12";c.lineWidth=1.5;c.beginPath();c.roundRect(-half,-8,half*2-22,8,4);c.fill();c.stroke();
 if(mop){c.fillStyle="#e5e7eb";for(let i=0;i<9;i++){c.beginPath();c.ellipse(half-18+i*2.5,-4,4,14,i*.3-1.2,0,7);c.fill()}}
 else{c.fillStyle="#facc15";c.strokeStyle="#a16207";c.beginPath();c.moveTo(half-24,-14);c.lineTo(half+8,-20);c.lineTo(half+8,12);c.lineTo(half-24,6);c.fill();c.stroke()}c.restore()}
function drawCan(c,sc){c.save();c.scale(sc,sc);c.fillStyle="#64748b";c.fillRect(-32,-70,64,70);c.fillStyle="#94a3b8";for(let i=-24;i<30;i+=14)c.fillRect(i,-66,5,62);
 c.fillStyle="#475569";c.beginPath();c.ellipse(0,-72,38,9,0,0,7);c.fill();c.fillRect(-6,-84,12,8);c.fillStyle="#84cc16";c.beginPath();c.arc(14,-80,6,0,7);c.fill();c.restore()}
function drawFish(c,sc,t){c.save();c.scale(sc,sc);c.translate(0,-30+Math.sin(t*6)*4);c.fillStyle="#38bdf8";c.beginPath();c.ellipse(0,0,16,9,0,0,7);c.fill();
 c.beginPath();c.moveTo(12,0);c.lineTo(26,-10);c.lineTo(26,10);c.fill();c.fillStyle="#fff";c.beginPath();c.arc(-8,-2,3,0,7);c.fill();c.fillStyle="#000";c.beginPath();c.arc(-8,-2,1.4,0,7);c.fill();c.restore()}
function render(){const t=S.t,hz=H*.36;
 const sky=g.createLinearGradient(0,0,0,hz);sky.addColorStop(0,"#3b2a63");sky.addColorStop(1,"#f9a8d4");g.fillStyle=sky;g.fillRect(0,0,W,hz+1);
 g.fillStyle="#fde68a";g.beginPath();g.arc(W*.7,hz*.4,20,0,7);g.fill();
 // ground
 const fl=P(-1.6,60),fr=P(1.6,60),nl=P(-1.6,-2),nr=P(1.6,-2);g.fillStyle="#57534e";g.beginPath();g.moveTo(fl.x,fl.y);g.lineTo(fr.x,fr.y);g.lineTo(nr.x,nr.y);g.lineTo(nl.x,nl.y);g.fill();
 g.strokeStyle="#78716c";g.lineWidth=2;[-.5,.5].forEach(x=>{const a=P(x,60),b=P(x,-2);g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke()});
 const off=S.dist%4;for(let z=60-off;z>-2;z-=4){const a=P(-1.6,z),b=P(1.6,z);g.strokeStyle="#44403c";g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke()}
 // walls
 [-1,1].forEach(s=>{const a=P(s*1.6,60),b=P(s*1.6,-2),a2=P(s*1.6,60,3.4),b2=P(s*1.6,-2,3.4);g.fillStyle=s<0?"#9a3412":"#b45309";g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.lineTo(b2.x,b2.y);g.lineTo(a2.x,a2.y);g.fill();
  g.strokeStyle="#7c2d12";g.lineWidth=1;for(let h=.4;h<3.4;h+=.4){const p=P(s*1.6,60,h),q=P(s*1.6,-2,h);g.beginPath();g.moveTo(p.x,p.y);g.lineTo(q.x,q.y);g.stroke()}
  for(let z=60-(S.dist%2);z>-2;z-=2){const p=P(s*1.6,z),q=P(s*1.6,z,3.4);g.beginPath();g.moveTo(p.x,p.y);g.lineTo(q.x,q.y);g.stroke()}});
 // deco + objects, far to near
 const items=[...S.deco.map(d=>({d:1,o:d,z:d.z})),...S.objs.filter(o=>!o.done||o.type!=="fish").map(o=>({o,z:o.z}))].sort((a,b)=>b.z-a.z);
 for(const it of items){const o=it.o;if(o.z>60)continue;
  if(it.d){const p=P(o.side*1.45,o.z),sc=p.s*W/450;g.save();g.translate(p.x,p.y);
   if(o.k==="puddle"){g.fillStyle="#60a5fa88";g.beginPath();g.ellipse(-o.side*20*sc,0,40*sc,9*sc,0,0,7);g.fill()}
   else if(o.k==="escape"){const q=P(o.side*1.6,o.z,2.2);g.restore();g.save();g.strokeStyle="#1f2937";g.lineWidth=Math.max(1,3*p.s);g.strokeRect(q.x-(o.side>0?30:0)*p.s,q.y,30*p.s,25*p.s);for(let i=0;i<4;i++){g.beginPath();g.moveTo(q.x-(o.side>0?30:0)*p.s,q.y+i*7*p.s);g.lineTo(q.x+(o.side>0?0:30)*p.s,q.y+i*7*p.s);g.stroke()}}
   else{g.restore();g.save();drawDoor(g,o)}g.restore();continue}
  const p=P(o.lane,o.z),sc=p.s*W/300;g.save();g.translate(p.x,p.y);
  if(o.type==="fish")drawFish(g,sc,t);else if(o.type==="can")drawCan(g,sc);else if(o.type==="boy")drawBoy(g,sc,t);else drawBroom(g,sc,o.mop,o.w||1);g.restore()}
 // cat
 const cat=CATS[catIdx],cp=P(S.x,0,S.y*.12),cs=W/390*1.4;
 if(S.mode!=="caught"){g.save();g.translate(cp.x,cp.y-20*cs);if((S.flash>0||S.inv>0)&&(t*20|0)%2)g.globalAlpha=.4;drawCat(g,cat,t,cs,S.slide>0&&S.y<=0,S.y);g.restore()}
 // Hank: hidden at 0 hits, head peeks at 1, half body at 2 (centered at the bottom, gap below the cat)
 const hs=cs*1.7,tgt=S.hits>=2?H-20*hs:S.hits===1?H+12*hs:H+60*hs;if(!S.hankY)S.hankY=H+60*hs;
 S.hankY+=(tgt-S.hankY)*Math.min(1,(1/60)*6);
 if(S.mode!=="caught"&&S.hankY<H+45*hs){const a=S.appT;g.save();g.translate(W/2,S.hankY);
  // appears facing the viewer, then flips around to chase the cat
  let front=a<.7,sx=1;if(a>=.7&&a<1){const k=(a-.7)/.3;sx=Math.abs(Math.cos(k*Math.PI));front=k<.5}g.scale(Math.max(.05,sx),1);
  front?drawHank(g,hs,t):drawHankBack(g,hs,t);g.restore()}
 if(S.mode==="caught")drawLickScene(g,cat,S.caughtT);
 if(S.mode==="run"&&S.hits>0){g.fillStyle="#fff";g.font="bold 20px sans-serif";g.textAlign="center";g.fillText(S.hits===1?"Woof! Hank's sniffing you out!":"Hank's catching up! Last heart!",W/2,H*.2);g.textAlign="left"}}
let last=performance.now();function loop(n){const dt=Math.min(.05,(n-last)/1000);last=n;update(dt);render();requestAnimationFrame(loop)}
showStart();requestAnimationFrame(loop);
