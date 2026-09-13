// Presentation has no access to the rules or random dice generator.
// Every event is an already-committed snapshot; skip/visibility cannot repeat it.
export const CINEMA_ASSETS={
 portraits:['./assets/denim-cutin.png','./assets/cowboy-cutin.png','./assets/owner-cutin.png','./assets/bunny-cutin.png','./assets/dealer-cutin.webp','./assets/magician-cutin.webp','./assets/salaryman-cutin.webp'],
 star:'./assets/fx/star_04.png',spark:'./assets/fx/spark_01.png',smoke:'./assets/fx/smoke_03.png',
 shake:'./assets/audio/dice-shake-1.ogg',roll:'./assets/audio/dice-throw-1.ogg',place:'./assets/audio/chip-lay-1.ogg',
 chips:'./assets/audio/chips-collide-1.ogg',fan:'./assets/audio/card-fan-1.ogg',card:'./assets/audio/card-slide-1.ogg'
};
export function createCinema({names,colors,skills,die,prefs}){
 const stage=document.createElement('dialog');stage.id='cinema';stage.setAttribute('aria-label','牌桌演出');document.body.append(stage);
 const textures={};for(const key of ['star','spark','smoke']){textures[key]=new Image();textures[key].src=CINEMA_ASSETS[key];}
 for(const src of CINEMA_ASSETS.portraits){const img=new Image();img.src=src;}
 let current=null,raf=0,audioContext=null;const playing=new Set();
 const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const lowMotion=()=>!prefs().motion||matchMedia('(prefers-reduced-motion: reduce)').matches;
 function sample(key){if(!prefs().sound||document.hidden)return;const src=CINEMA_ASSETS[key];if(!src)return;
  const a=new Audio(src);a.volume=key==='shake'?.28:.5;playing.add(a);a.addEventListener('ended',()=>playing.delete(a),{once:true});a.play().catch(()=>playing.delete(a));
 }
 function sting(actor){if(!prefs().sound||document.hidden)return;try{audioContext??=new AudioContext();audioContext.resume();
  const now=audioContext.currentTime,notes=[[440,660,880],[130,98,65],[196,247,294],[587,740,880],[330,495,660],[392,494,784],[220,330,440]][actor];
  notes.forEach((f,i)=>{const o=audioContext.createOscillator(),g=audioContext.createGain();o.type=actor===1?'triangle':'sine';o.frequency.setValueAtTime(f,now+i*.075);g.gain.setValueAtTime(0,now+i*.075);g.gain.linearRampToValueAtTime(.085,now+i*.075+.025);g.gain.exponentialRampToValueAtTime(.001,now+i*.075+.35);o.connect(g);g.connect(audioContext.destination);o.start(now+i*.075);o.stop(now+i*.075+.38);});
 }catch{}}
 function stopAudio(){for(const a of playing){a.pause();a.currentTime=0;}playing.clear();}
 const quotes=['新手？那就多赢一次。','这一颗，出局。','我的地盘，我来定价。','看着我——这张归我。'];
 const english=['BEGINNER’S LUCK','JUSTICE SERVED','HOUSE ADVANTAGE','ALL EYES ON ME'];
 const money=n=>`${n/10000}万`;
 function resultMarkup(e){const role=e.role??e.actor;if(role===6){const lost=e.label?.match(/随机失去([1-6])点(大骰|普通骰)/);return `<div class="clockout-prop"><span>18:00</span><b>CLOCK OUT</b></div><h3>准点下班</h3>${lost?`<div class="clockout-cost">${die(Number(lost[1]))}<strong>−1 ${lost[2]}${lost[2]==='大骰'?' ×2':''}</strong><small>本轮离场 · 下轮恢复</small></div>`:''}<p>${safe(e.label||'整组改点 · 随机失去一颗骰子')}</p>`;}if(role>=4)return `<div class="new-skill-prop">${role===4?'♠':'✦'}</div><h3>${role===4?'精准发牌':'袖中乾坤'}</h3><p>${safe(e.label||'已改变自己的掷骰结果')}</p>`;
  if(role===0)return `<div class="bonus-die">${die(6)}<strong>+1</strong></div><h3>本轮 9 颗骰子</h3><p>初来乍到 · 额外骰子已入手</p>`;
  if(role===1)return `<div class="snipe-prop"><div class="crosshair"></div><div class="shot-die">${die(e.value||e.face||1)}</div><b class="shot-word">OUT</b></div><h3>一颗${e.big?'大骰 ×2':'骰子'} · 出局</h3><p>${safe(e.targetName??names[e.target])} · ${e.zone==='table'?e.face+'号赌场':e.zone==='roll'?'刚掷出的骰子':'手中骰子'} ${e.before} → ${e.after}</p>`;
  if(role===2)return `<div class="trade-prop"><div class="trade-a"><span class="trade-num">${e.a}</span><small>${safe(names[e.actor])}</small></div><b>⇄</b><div class="trade-b"><span class="trade-num">${e.b}</span><small>${safe(e.targetName??names[e.target])}</small></div><i class="deal-stamp">DEAL</i></div><h3>${e.face}号赌场 · 强制交易</h3><p>骰子 ${e.a} ⇄ ${e.b} · ${e.chips}枚筹码交给${safe(e.targetName??names[e.target])}</p>`;
  return `<div class="charm-prop"><i class="fanned-card fanned-a">♠</i><i class="fanned-card fanned-b">♣</i><div class="stolen-note"><small>VEGAS BANK</small><strong>${money(e.amount)}</strong><span>♥</span></div></div><h3>这张，归我了。</h3><p>从${safe(e.targetName??names[e.target])}抽走一张 ${money(e.amount)} 钞票</p>`;
 }
 function cubes(values,bigIndex=-1){const angles=[[0,0],[90,0],[0,-90],[0,90],[-90,0],[0,180]];return values.map((v,i)=>{const [x,y]=angles[v-1];return `<div class="cube-holder ${i===bigIndex?'big-cube':''}" style="--i:${i}"><div class="cube" data-result="${v}" style="--rx:${x}deg;--ry:${y}deg;--spin:${720+i*90}deg">${[1,2,3,4,5,6].map(n=>`<div class="cube-face cf-${n}">${die(n)}</div>`).join('')}</div></div>`;}).join('');}
 function play(type,event,done){
  if(current)return false;
  const reduced=lowMotion(),fast=prefs().fast;
  if(type==='skill'&&prefs().cutins===false&&!event.demo){sting(event.role??event.actor);queueMicrotask(done);return true;}
  const duration=reduced?220:type==='roll'?(fast?330:1050):fast?850:2900;
  const actor=event.actor??0,visual=event.role??actor;
  stage.className=`cinema cinema-${type} actor-${visual} ${reduced?'cinema-reduced':''}`;
  stage.style.setProperty('--accent',colors[actor]);stage.style.setProperty('--duration',duration+'ms');stage.style.setProperty('--speed',duration/2900);
  if(type==='skill')stage.innerHTML=`<div class="cinema-wash"></div><div class="cinema-grid"></div><div class="portrait-ghost" style="background-image:url('${CINEMA_ASSETS.portraits[visual]}')"></div><div class="cutin-slice"><img class="cutin-face" src="${CINEMA_ASSETS.portraits[visual]}" alt="${safe(event.name??names[actor])}的技能表情特写"></div><div class="cutin-type"><div class="cutin-kicker">${event.demo?'演出预览':event.human?'YOUR MOVE':'RIVAL MOVE'} / ${safe(event.name??names[actor])}</div><div class="cutin-en">${visual===6?'CLOCK OUT':(event.role??actor)===4?'PRECISE DEAL':(event.role??actor)===5?'SLEIGHT OF HAND':english[visual]}</div><h2>${safe(event.skillName??skills[actor].name)}</h2><p>「${visual===6?'今天的加班，到此为止。':visual===4?'偶然，需要一点精确。':visual===5?'看清了吗？再看一次。':quotes[visual]}」</p><div class="cutin-rule">${visual===0?'被动生效':safe(event.label||'每轮一次 · 技能发动')}</div></div><div class="cinema-result">${resultMarkup(event)}</div><canvas class="cinema-particles" aria-hidden="true"></canvas><div class="cinema-stripe stripe-top"></div><div class="cinema-stripe stripe-bottom"></div><button class="cinema-skip">跳过演出 <small>Space / Esc</small></button><div class="cinema-progress"><i></i></div>`;
  else stage.innerHTML=`<div class="roll-stage"><header><img src="${CINEMA_ASSETS.portraits[visual]}" alt="${safe(event.name??names[actor])}"><div><small>LET THE DICE TALK</small><h2>${safe(event.name??names[actor])} · 掷骰</h2><p>${event.values.length}颗骰子，即将落定</p></div></header><div class="dice-pit">${cubes(event.values,event.bigIndex)}</div><div class="roll-result-label">${event.values.join(' · ')}</div></div><button class="cinema-skip">立即落骰 <small>Space / Esc</small></button>`;
  stage.showModal();stage.querySelector('button').focus({preventScroll:true});
  current={type,event,done,duration,elapsed:0,last:0,impact:false,reduced,particles:null};
  stage.dataset.phase=reduced?'result':'intro';if(type==='roll')sample('shake');else sting(visual);
  raf=requestAnimationFrame(frame);return true;
 }
 function frame(now){const c=current;if(!c)return;c.elapsed+=c.last?Math.min(now-c.last,50):0;c.last=now;const t=c.elapsed/c.duration;
  if(c.type==='skill'){
   stage.dataset.phase=c.reduced?'result':t<.13?'intro':t<.60?'portrait':'result';
   if(t>=.60&&!c.impact){c.impact=true;sample((c.event.role??c.event.actor)===2?'chips':(c.event.role??c.event.actor)===3?'card':'place');sting(c.event.role??c.event.actor);}
   if(!c.reduced)drawParticles(c,t);
  }else{stage.dataset.phase=t<.65&&!c.reduced?'tumble':'result';if(t>=.58&&!c.impact){c.impact=true;sample('roll');}}
  if(t>=1){finish();return;}raf=requestAnimationFrame(frame);
 }
 function drawParticles(c,t){const canvas=stage.querySelector('canvas');if(!canvas)return;const w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,1.5);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.globalCompositeOperation='screen';
  const actor=c.event.role??c.event.actor,n=w<600?32:60;
  for(let i=0;i<n;i++){const seed=(i*137.508)%360,ang=seed*Math.PI/180,progress=(t+i/n)%1,burst=Math.max(0,(t-.6)*2.5),x=w*.5+Math.cos(ang)*(actor===1?burst:progress)*w*.7,y=h*.48+Math.sin(ang)*(actor===1?burst:progress)*h*.6;
   const tex=textures[actor===1?'spark':actor===2?'smoke':'star'];const size=actor===2?70+progress*150:8+(i%5)*5;ctx.globalAlpha=(1-progress)* (actor===2?.12:.65);if(tex.complete&&tex.naturalWidth)ctx.drawImage(tex,x-size/2,y-size/2,size,size);
  }ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';
 }
 function finish(){if(!current)return;const c=current;current=null;cancelAnimationFrame(raf);stopAudio();stage.close();stage.innerHTML='';stage.removeAttribute('data-phase');c.done();}
 stage.addEventListener('click',e=>{if(e.target.closest('.cinema-skip'))finish();});
 stage.addEventListener('cancel',e=>{e.preventDefault();finish();});
 stage.addEventListener('keydown',e=>{if(['Space','Enter','Escape'].includes(e.code)){e.preventDefault();e.stopPropagation();finish();}});
 document.addEventListener('visibilitychange',()=>{if(!current)return;if(document.hidden){cancelAnimationFrame(raf);stopAudio();stage.getAnimations({subtree:true}).forEach(a=>a.pause());}else{current.last=0;stage.getAnimations({subtree:true}).forEach(a=>a.play());raf=requestAnimationFrame(frame);}});
 function tablePulse(event){
  if(lowMotion())return;
  const selector=event.face?'.casino-'+event.face:event.target!=null?'.seat-'+event.target:'.seat-'+event.actor;
  const el=document.querySelector(selector);if(!el)return;
  const base=getComputedStyle(el).transform.replace('none','');el.animate([{filter:'brightness(1)',transform:base+' scale(1)'},{filter:'brightness(1.65)',transform:base+' scale(1.025)'},{filter:'brightness(1)',transform:base+' scale(1)'}],{duration:500,easing:'ease-out'});
 }
 function flyDice(face,count,actor){sample('place');if(lowMotion())return;
  const to=document.querySelector('.casino-'+face),from=document.querySelector('.dice-row');if(!to||!from)return;
  const a=from.getBoundingClientRect(),b=to.getBoundingClientRect();const layer=document.createElement('div');layer.className='flight-layer';document.body.append(layer);
  for(let i=0;i<Math.min(count,9);i++){const d=document.createElement('div');d.className='flying-die';d.innerHTML=die(face);layer.append(d);d.style.left=(a.left+a.width*.5)+'px';d.style.top=(a.top+a.height*.5)+'px';d.style.color=colors[actor];d.animate([{transform:`translate(-50%,-50%) scale(1) rotate(0deg)`,opacity:1},{transform:`translate(${b.left+b.width*.5-a.left-a.width*.5-15+(i%3)*10}px,${b.top+b.height*.6-a.top-a.height*.5}px) scale(.5) rotate(${90+i*60}deg)`,opacity:.2}],{duration:440,delay:i*30,fill:'forwards',easing:'cubic-bezier(.2,.7,.2,1)'});}
  setTimeout(()=>{layer.remove();tablePulse({face});},750);
 }
 return {get active(){return !!current;},play,finish,sample,tablePulse,flyDice};
}
