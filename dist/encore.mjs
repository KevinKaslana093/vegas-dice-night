import {NAMES,COLORS,SKILLS,placedBig} from './core.mjs';
import {CINEMA_ASSETS} from './cinema.mjs';
import {claimMarkup} from './claims.mjs';

export function rivalLine(g,face,kind='invest'){
 const i=g.turn,t=g.tables[face-1],hasBig=placedBig(g,face),contested=t?.counts.some((n,j)=>j!==i&&n>0);
 if(kind==='pass')return ['先看看你们。','这一轮，我收枪。','这笔交易不划算。','今晚先放你一马。'][i];
 if(kind==='skip')return ['换一手，再铺开。','这手不值。等下一次。','花一枚筹码，换个机会。','这次我先不跟。'][i];
 if(hasBig)return ['大骰也来了，一起押。','这一颗，算两颗。','加重这一桌的分量。','小心，我这一颗顶两颗。'][i];
 return [t?.counts[i]?'继续加注，守住这桌。':'先占一桌，还有骰子慢慢来。',contested?'看清局面，再落骰。':g.players[i].used?'这一手，靠骰子说话。':'先落子，枪还在我手里。',contested?'这桌的账，该重新算了。':'先留个位置。',contested?'这桌的奖金，我也想要。':'这张钱，我先占着。'][i];
}
export function createRivalBeat({prefs}){
 let root,timer;
 function clear(){clearTimeout(timer);root?.remove();root=null;}
 function play(g,face,kind='invest'){
  clear();const i=g.turn;root=document.createElement('aside');root.className=`rival-beat rival-${i}`;root.setAttribute('aria-live','polite');root.style.setProperty('--pc',COLORS[i]);
  root.innerHTML=`<img src="${CINEMA_ASSETS.portraits[i]}" alt=""><div><small>${NAMES[i]} · ${kind==='pass'?'收手':kind==='skip'?'拨出筹码':face+'号赌场'}</small><p>「${rivalLine(g,face,kind)}」</p></div><span class="rival-prop" aria-hidden="true">${['◆','⌖','◉','♥'][i]}</span>`;
  if(!prefs().motion)root.classList.add('still');document.body.append(root);timer=setTimeout(clear,prefs().fast?750:2200);
 }
 return {play,clear};
}
export function turningPointMarkup(g,{replay=false}={}){
 const e=g.turningPoint;if(!e||!Array.isArray(e.notes)||!e.notes.length)return '';
 const who=i=>i===null?'待分配':NAMES[i],m=n=>n/10000+'万';
 return `<section class="turning-point ${replay?'turning-replay':''}" aria-label="本轮关键转折"><div class="turning-kicker">${replay?'REPLAY / 当时的局面':'ROUND HIGHLIGHT'}</div><h3>${NAMES[e.actor]} · ${e.action}</h3><p>${e.face}号 ${g.tables[e.face-1].name}，${e.notes.map(n=>`${m(n.amount)}：${who(n.from)} → ${who(n.to)}`).join('；')}。</p>${e.beforeCounts?`<div class="turning-counts">${e.afterCounts.map((n,i)=>`<span style="--pc:${COLORS[i]}"><small>${NAMES[i]}</small><b><i class="turning-before">${e.beforeCounts[i]}</i> <i>→</i> <strong class="turning-after">${n}</strong></b><em>${e.ties.includes(i)?'撞数出局':e.beforeTies.includes(i)?'解除撞数':'计数'}</em></span>`).join('')}</div>`:''}${replay?claimMarkup(e,g.hero,{compact:true}):'<button class="quiet" data-action="replay-turn">回看这一手 ↗</button>'}<small class="turning-footnote">记录奖金暂领权变化；本轮最终派彩以结算表为准。</small></section>`;
}
export function reactionMarkup(g){
 if(g.phase!=='reaction')return '';const r=g.reaction,i=g.turn;
 return `<section class="final-action" aria-label="最后行动"><small>LAST CALL · 奖金尚未发放</small><h2>${NAMES[i]}，最后一次选择</h2><p>发动「${SKILLS[i].name}」，或放弃本轮最后行动。没有倒计时，确认后才轮到下一位。</p><div>${r.order.map((j,k)=>`<span class="${k===r.index?'current':''}">${k<r.index?'✓ ':''}${NAMES[j]}</span>`).join(' → ')}</div></section>`;
}
