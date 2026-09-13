import {outcome,previewTable,banknoteOwners,MINIGAMES,EFFECTS,COLORS,bigCount,placedBig,roleOf} from './core.mjs';

const DECISION_NAMES=['丹宁','牛仔','老板','月兔'];
const decisionMoney=n=>`${n/10000}万`;
export function analyzeBet(g,face){
 if(g.phase!=='choose'||!Number.isInteger(face)||face<1||face>6||!g.roll.includes(face))return null;
 const before=g.tables[face-1],after=previewTable(g,face),a=outcome(before),b=outcome(after),value=(o,i)=>o.awards.filter(x=>x.player===i).reduce((n,x)=>n+x.amount,0);
 return {face,name:before.name,effect:before.effect,count:g.roll.filter(n=>n===face).length,big:placedBig(g,face),actor:g.turn,miniPending:MINIGAMES.includes(before.effect)&&!before.played[g.turn],
  players:g.players.map((_,i)=>({player:i,beforeDice:before.counts[i]+bigCount(before,i),afterDice:after.counts[i]+bigCount(after,i),bonus:before.bonus[i],beforeCash:value(a,i),afterCash:value(b,i),beforeTied:a.ties.includes(i),afterTied:b.ties.includes(i)})),
  notes:before.notes.map((amount,i)=>({amount,beforeOwner:banknoteOwners(before,a)[i],afterOwner:banknoteOwners(after,b)[i]})),ties:b.ties};
}
export function betPreviewMarkup(g,face){
 const p=analyzeBet(g,face);if(!p)return '';const who=i=>i===null?'待分配':i===g.hero?'你':g.players[i].name,rows=p.players.filter(x=>x.beforeDice||x.afterDice||x.beforeCash||x.afterCash);
 return `<section class="bet-preview" aria-label="下注前后对比"><header><div><small>下注预览 · 尚未确认</small><b>${p.face}号 ${p.name}</b></div><span>投入 ${p.count} 颗${p.big?'（含大骰，计数+'+(p.count+p.big)+'）':''} · ${EFFECTS[p.effect].name}</span></header><div class="bet-note-pair">${p.notes.map(n=>`<div><strong>${decisionMoney(n.amount)}</strong><span>${who(n.beforeOwner)} <i>→</i> <b style="color:${n.afterOwner===null?'#aa9bb8':COLORS[n.afterOwner]}">${who(n.afterOwner)}</b></span></div>`).join('')}</div><div class="bet-columns"><span>玩家</span><span>计数：当前 → 投入后</span><span>暂领：当前 → 投入后</span></div>${rows.map(x=>`<div class="bet-row ${x.afterTied?'bet-will-tie':''}"><b style="color:${COLORS[x.player]}">${who(x.player)}</b><span>${x.beforeDice}${x.bonus?'+'+x.bonus:''} → <strong>${x.afterDice}${x.bonus?'+'+x.bonus:''}</strong>${x.afterTied?'<em>撞数出局</em>':x.beforeTied?'<em class="bet-escaped">解除撞数</em>':''}</span><span>${decisionMoney(x.beforeCash)} → <strong>${decisionMoney(x.afterCash)}</strong>${x.afterCash!==x.beforeCash?`<em class="${x.afterCash>x.beforeCash?'bet-up':'bet-down'}">${x.afterCash>x.beforeCash?'+':''}${decisionMoney(x.afterCash-x.beforeCash)}</em>`:''}</span></div>`).join('')}<p>${p.miniPending?'入桌后会触发小游戏；这里仅计算实体骰子，加成可能再次改变排名和撞数。':'按当前局面计算；其他玩家之后的下注或技能仍可能改变归属。'}</p></section>`;
}
export function endgameInfo(g){
 if(['settled','finished','reaction'].includes(g.phase))return null;
 const active=g.players.map((p,i)=>({i,left:p.left})).filter(p=>p.left>0),total=active.reduce((n,p)=>n+p.left,0);
 if(active.length>2&&total>6)return null;
 return {active,total,kind:active.length===0?'mini':active.length===1?'solo':active.length===2?'duel':'last',unused:g.skills?g.players.map((p,i)=>({i,used:p.used})).filter(x=>roleOf(g,x.i)!==0&&!x.used).map(x=>x.i):[]};
}
export function endgameMarkup(g){
 const e=endgameInfo(g);if(!e)return '';const who=i=>i===g.hero?'你':g.players[i].name,title=e.kind==='solo'?`只剩${who(e.active[0].i)}还能下注`:e.kind==='duel'?`${who(e.active[0].i)}与${who(e.active[1].i)}的最后争夺`:e.kind==='mini'?'骰子已投完 · 等待小游戏结果':`终盘 · 全桌只剩${e.total}颗骰子`;
 return `<section class="endgame-strip ${e.kind==='solo'?'endgame-solo':''}" aria-label="残局局势"><header><span>ENDGAME</span><b>${title}</b><strong>${e.total} 颗未下注</strong></header><div class="endgame-players">${g.players.map((p,i)=>`<span class="${p.left?'endgame-live':'endgame-done'}" style="--pc:${COLORS[i]}"><b>${who(i)}</b><span>${p.left?`还能投 ${p.left} 颗`:'✓ 下注结束'}</span></span>`).join('')}</div><p>${e.kind==='solo'?'其余玩家已用完骰子；支付筹码跳过后，会立即再次轮到你。':e.kind==='mini'?'完成当前小游戏后才会派彩。':'留意剩余骰子：已投入赌场的骰子不会再回到手中。'}${e.unused.length?` ${e.unused.map(who).join('、')}的主动技能本轮尚未使用。`:''}</p></section>`;
}
