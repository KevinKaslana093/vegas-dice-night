import {BALANCED_SKILLS} from './balance.mjs';
import {chipMark,pipMark,suitMark} from './identity.mjs';
import {NAMES,SKILLS,scoreFor,roleOf,outcome,previewTable,sum,winners} from './core.mjs';
import {CINEMA_ASSETS} from './cinema.mjs';
export const HERO_LABELS=['短裤女士','筹码牛仔','赌场老板','兔女郎','冷面女荷官','潇洒魔术师','社畜大叔'];
const HERO_LINES=['初次入局，也要多赢一手。','骰子落定之前，胜负未定。','欢迎来到我的主场。','别只盯着牌，也看看我。','偶然，需要一点精确。','看清了吗？再看一次。','今天的加班，到此为止。'];
export function heroSelection(role,art){
 const prev=(role+NAMES.length-1)%NAMES.length,next=(role+1)%NAMES.length;
 return `<div class="hero-stage" data-hero-stage="${role}" aria-label="左右滑动选择英雄"><div class="hero-sweep"></div><div class="hero-poster-word" aria-hidden="true">${["NEW BLOOD","DEAD EYE","THE HOUSE","MOON RABBIT","COLD DEAL","ILLUSION","CLOCK OUT"][role]}</div><div class="hero-orbit" aria-hidden="true">${chipMark(String(role+1).padStart(2,"0"))}</div><div class="hero-suit">${suitMark(role)}</div><div class="hero-face-inset" aria-hidden="true"><img src="${CINEMA_ASSETS.portraits[role]}" alt=""><span>AFTER DARK / 0${role+1}</span></div><div class="hero-ghost left" style="background-image:url('${art[prev]}')"></div><div class="hero-ghost right" style="background-image:url('${art[next]}')"></div><img draggable="false" class="hero-main" src="${art[role]}" alt="${HERO_LABELS[role]}全身立绘"><div class="hero-title"><small>${pipMark(role%6+1)} PLAYER FILE / 0${role+1}</small><em class="hero-realname">${NAMES[role]}</em><h2>${HERO_LABELS[role]}</h2><p>「${HERO_LINES[role]}」</p><b>${BALANCED_SKILLS[role].name}</b><span>${BALANCED_SKILLS[role].text}</span></div><button class="hero-arrow hero-prev" data-hero-step="-1" aria-label="上一位英雄">‹</button><button class="hero-arrow hero-next" data-hero-step="1" aria-label="下一位英雄">›</button><small class="hero-nav-hint">← → 切换 · 手机左右滑动</small></div><div class="hero-roster" aria-label="七位可选英雄">${HERO_LABELS.map((name,i)=>`<button data-pick="${i}" aria-pressed="${role===i}" aria-label="选择${name}"><img draggable="false" src="${art[i]}" alt=""><small>${name}</small>${suitMark(i,"roster-suit")}</button>`).join('')}</div>`;
}
export function forecastStanding(g,face=0){
 const cash=g.players.map((p,i)=>scoreFor(g,i)),notes=g.players.map(p=>p.notes),done=['settled','finished'].includes(g.phase);
 if(!done)g.tables.forEach(t=>outcome(face===t.face&&g.phase==='choose'?previewTable(g,face):t).awards.forEach(a=>{cash[a.player]+=a.amount;notes[a.player]++;}));
 const order=[0,1,2,3].sort((a,b)=>cash[b]-cash[a]||notes[b]-notes[a]);return {cash,notes,order};
}
export function finalRoundInfo(g,face=0){
 if(g.round!==4)return null;const before=forecastStanding(g),after=forecastStanding(g,face),hero=g.hero,leader=before.order[0],cashLeader=g.players.reduce((best,p,i)=>p.cash>g.players[best].cash?i:best,0),gap=Math.max(0,g.players[cashLeader].cash-g.players[hero].cash),ahead=after.cash[hero]>after.cash[leader]||(after.cash[hero]===after.cash[leader]&&after.notes[hero]>after.notes[leader]);
 return {gap,cashLeader,leader,projected:before.cash[hero],gain:after.cash[hero]-before.cash[hero],overtake:face&&leader!==hero&&ahead,afterLeader:after.order[0],finished:['settled','finished'].includes(g.phase)};
}
export function finalRoundMarkup(g,face=0){
 const f=finalRoundInfo(g,face);if(!f)return '';const fmt=n=>n/10000+'万',name=i=>i===g.hero?'你':g.players[i].name;
 const line=f.overtake?`按当前暂领结果，这次下注会让你超过${name(f.leader)}${f.afterLeader===g.hero?'，升至第一':''}。`:f.gain>0?`按当前暂领结果，这次下注会让你的预计总额增加${fmt(f.gain)}。`:f.finished?'四轮落幕，胜负以最终结算为准。':`按当前暂领结果，${name(f.leader)}预计领先；每一手仍能改变排名。`;
 return `<section class="final-round-banner ${f.overtake?'final-overtake':''}" aria-label="末轮胜负提示"><div><small>THE LAST ROUND</small><b>第四轮 · 最后争夺</b></div><span>${f.gap?'距已入袋奖金第一名 '+fmt(f.gap):'你的已入袋奖金并列或独占第一'}</span><p>${line}</p><small>预计总额含全部赌场暂领奖金；后续下注、小游戏和技能仍会改变结果。</small></section>`;
}
export function rematchMarkup(g){return g.random?'<button class="quiet rematch-button" data-action="rematch">同局再战 · 换一种打法 ↻</button><p class="fineprint">保留角色、每轮奖金与特殊桌，以及各玩家的骰子随机序列。操作不同会改变消耗和结果。</p>':'<p class="fineprint">这份旧牌局未记录随机序列。新开牌局结束后可选择同局再战。</p>';}
export function createFinalMood({prefs}){
 let context,master,interval,active=false,unlocked=false,beat=0;
 function stop(){clearInterval(interval);interval=null;if(master&&context)master.gain.setTargetAtTime(0,context.currentTime,.08);}
 function pulse(){if(!active||!unlocked||!prefs().sound||document.hidden)return;try{context??=new(window.AudioContext||window.webkitAudioContext)();if(context.state==='suspended')context.resume();if(!master){master=context.createGain();master.connect(context.destination);}master.gain.setTargetAtTime(.025,context.currentTime,.08);const notes=[110,130.81,146.83,123.47],base=notes[beat++%4],now=context.currentTime;for(const [i,f]of [base,base*1.5,base*2].entries()){const o=context.createOscillator(),v=context.createGain();o.type='sine';o.frequency.value=f;v.gain.setValueAtTime(0,now+i*.13);v.gain.linearRampToValueAtTime(.45,now+i*.13+.08);v.gain.exponentialRampToValueAtTime(.001,now+1.6);o.connect(v);v.connect(master);o.start(now+i*.13);o.stop(now+1.65);}}catch{stop();}}
 function update(on){active=!!on;if(!active||!prefs().sound||document.hidden){stop();return;}if(!interval&&unlocked){pulse();interval=setInterval(pulse,1900);}}
 document.addEventListener('pointerdown',()=>{unlocked=true;update(active);},{passive:true});document.addEventListener('keydown',()=>{unlocked=true;update(active);});document.addEventListener('visibilitychange',()=>update(active));return {update,stop};
}
