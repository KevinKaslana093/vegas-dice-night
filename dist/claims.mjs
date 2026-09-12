import {NAMES,COLORS,CASINOS} from './core.mjs';
import {CINEMA_ASSETS} from './cinema.mjs';

const CLAIM_NAMES=['丹宁','牛仔','老板','月兔'];
const claimMoney=n=>`${Math.abs(n)/10000}万`;
export function claimMarkup(event,hero,{settled=false,compact=false}={}){
 if(!event||(!event.notes?.length&&!event.changes?.length&&event.kind!=='tie'))return '';
 const who=i=>i===null?'待分配':i===hero?'你':CLAIM_NAMES[i];
 const owner=i=>i===null?'<span class="claim-owner unclaimed">待分配</span>':`<span class="claim-owner" style="--claim-color:${COLORS[i]}"><img src="${CINEMA_ASSETS.portraits[i]}" alt="">${who(i)}</span>`;
 const title=event.kind==='tie'?'撞数！奖金重新排位':event.beforeTies?.some(i=>!event.ties.includes(i))?'平局打破 · 奖金易主':event.notes?.some(n=>n.from!==null)?'奖金易主':'占住奖金';
 return `<section class="claim-report ${compact?'claim-compact':''}" aria-label="本次奖金归属变化"><header><span>${event.face}号 · ${CASINOS[event.face-1]}</span><b>${title}</b></header>${event.notes?.length?`<div class="claim-transfers">${event.notes.map(n=>`<div class="claim-transfer"><strong>${claimMoney(n.amount)}</strong>${owner(n.from)}<span class="claim-arrow" aria-label="转为">→</span>${owner(n.to)}</div>`).join('')}</div>`:''}<div class="claim-deltas">${event.changes.map(c=>`<span class="${c.delta<0?'claim-loss':'claim-gain'}">${who(c.player)} <b>${c.delta<0?'暂失':'暂领'} ${claimMoney(c.delta)}</b></span>`).join('')}${event.kind==='tie'&&!event.changes.length?'<span class="claim-loss">同数量出局 · 本桌暂领金额未变</span>':''}</div><small>${settled?'下注结束 · 最终派彩见结算':'以上为暂领变化 · 所有人用完骰子才发钱'}</small></section>`;
}

export function createClaimFeedback({prefs,hero}){
 let panel=null,hideTimer=0,holdUntil=0,last=null;
 const reduced=()=>!prefs().motion||matchMedia('(prefers-reduced-motion: reduce)').matches;
 function clear(){clearTimeout(hideTimer);panel?.remove();panel=null;holdUntil=0;last=null;}
 function play(event,{root=document,settled=false,toast=true}={}){
  if(!event||event===last)return;const html=claimMarkup(event,hero(),{settled});if(!html)return;
  clear();last=event;holdUntil=Date.now()+(prefs().fast?180:1450);
  const table=root.querySelector(`.casino-${event.face},.lt-${event.face}`);
  if(table){
   table.classList.add('claim-table-impact');
   event.notes?.forEach(n=>{const note=table.querySelector(`[data-note="${n.index}"]`);if(!note)return;note.classList.add('claim-note-changed');if(!reduced())note.animate([{transform:'rotateY(-75deg) scale(.88)',opacity:.35},{transform:'rotateY(0) scale(1.08)',opacity:1},{transform:'rotateY(0) scale(1)'}],{duration:650,easing:'cubic-bezier(.2,.8,.2,1)'});});
   if(!reduced())for(const i of event.ties){const pile=table.querySelector(`[data-player="${i}"]`);pile?.animate([{background:'#5c1827',boxShadow:'0 0 0 1px #ff687a'},{background:'#b7354b',boxShadow:'0 0 18px #ff526daa'},{background:'#5c1827',boxShadow:'0 0 0 1px #ff687a'}],{duration:1000,iterations:2});}
  }
  if(toast){panel=document.createElement('aside');panel.className='claim-toast';panel.setAttribute('aria-live','polite');panel.innerHTML=html+'<button class="claim-dismiss" aria-label="收起奖金变化提示">×</button>';document.body.append(panel);panel.querySelector('button').onclick=()=>{panel?.remove();panel=null;holdUntil=0;};if(!reduced())panel.animate([{opacity:0,transform:'translateY(-12px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:'ease-out'});hideTimer=setTimeout(()=>{panel?.remove();panel=null;},prefs().fast?2600:4200);}
 }
 return {play,clear,get remaining(){return Math.max(0,holdUntil-Date.now());}};
}
