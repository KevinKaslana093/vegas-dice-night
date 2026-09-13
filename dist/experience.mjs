import {royalClosed} from './royale.mjs';
import {BALANCED_SKILLS} from './balance.mjs';
import {outcome,previewTable,tableWeight,bigCount,placedBig,roleOf,isHuman,EFFECTS,MINIGAMES,COLORS} from './core.mjs';
import {analyzeBet} from './decisions.mjs';
import {ROLE_GUIDES} from './journey.mjs';
export const BOT_STYLES=['广铺型','拆局型','交易型','逐利型','精算型','冒险型','节制型'];
export function actionPrompt(g,selected=0,busy=false){
 const p=g.players[g.turn];if(['settled','finished'].includes(g.phase))return '本轮已派彩 · 查看结算，然后继续。';
 if(busy)return `${p.name}的骰子正在落定…`;
 if(!isHuman(g))return `${p.name}正在行动 · 你可以查看桌面和规则。`;
 if(g.phase==='reaction')return '最后行动：发动技能，或确认放弃。';
 if(g.phase==='royale')return '完成皇家赌场的选择，结果会自动保存。';
 if(g.phase==='minigame')return '完成当前入桌小游戏，决定是否继续冒险。';
 if(g.phase==='ready')return `轮到你：掷出手中 ${p.left} 颗骰子。`;
 return selected?`已选 ${selected} 点：确认下注，或改选其他点数。`:'点一种骰子点数，看清预览后确认下注。';
}
export function diceDescription(count,big=0,bonus=0){return `${count}颗骰子 · 计数${count+big+bonus}${bonus?'（含加成'+bonus+'）':''}`;}
export function compactBet(g,face){const p=analyzeBet(g,face);if(!p)return '';const me=p.players[g.turn],who=i=>i===null?'待分配':i===g.hero?'你':g.players[i].name;return `<div class="bet-quick" aria-label="下注三个关键变化"><b>${diceDescription(p.count,p.big)} → ${face}号</b><span>本桌计数 ${me.beforeDice+me.bonus} → ${me.afterDice+me.bonus}${me.afterTied?' · 撞数出局':me.beforeTied?' · 解除撞数':''}</span><span>大钞：${who(p.notes[0].beforeOwner)} → ${who(p.notes[0].afterOwner)} · ${p.miniPending?'小游戏结果待定':'当前暂领'}</span></div>`;}
export function skillCost(g,actor){const role=roleOf(g,actor),p=g.players[actor];if(g.balance===2)return BALANCED_SKILLS[role].text;return role===0?'被动生效，不需要确认。':`本轮限一次 · ${role===2?'代价：交出全部 '+p.chips+' 枚筹码。':role===6?'代价：随机失去一颗刚掷出的骰子，大骰也可能失去。':'不消耗筹码。'}${role===1?' 狙掉大骰减少2计数；也可能替对手解除撞数。':role===3?' 随机抽一张，不能指定票面。':role===5?' 重掷仍可能得到原来的点数。':''}`;}
export function skillPreview(g,actor,choice){
 if(!choice.face||!Number.isInteger(choice.target))return '';const t=g.tables[choice.face-1],copy={...t,counts:[...t.counts],big:[...t.big]},role=roleOf(g,actor),j=choice.target;
 if(role===1){copy.counts[j]--;if(choice.big)copy.big[j]--;}
 else if(role===2){[copy.counts[actor],copy.counts[j]]=[copy.counts[j],copy.counts[actor]];[copy.big[actor],copy.big[j]]=[copy.big[j],copy.big[actor]];}else return '';
 const a=outcome(t),b=outcome(copy),cash=(o,i)=>o.awards.filter(x=>x.player===i).reduce((n,x)=>n+x.amount,0)/10000;
 return `<div class="skill-forecast"><b>${choice.face}号 · 发动前 → 发动后</b>${[...new Set([actor,j])].map(i=>`<span>${g.players[i].name}：${t.counts[i]}颗 / 计数${tableWeight(t,i)} → ${copy.counts[i]}颗 / 计数${tableWeight(copy,i)}；暂领 ${cash(a,i)}万 → ${cash(b,i)}万${b.ties.includes(i)?' · 撞数':''}</span>`).join('')}</div>`;
}
// Only public board, current roll and remaining counts are evaluated; no deck or future random stream.
export function publicBotChoice(g,difficulty='standard'){
 const me=g.turn,role=roleOf(g,me),cash=(o,i)=>o.awards.filter(a=>a.player===i).reduce((n,a)=>n+a.amount/10000,0),choices=[...new Set(g.roll)].filter(face=>!royalClosed(g,face)).map(face=>{
  const t=g.tables[face-1],o=outcome(t),v=previewTable(g,face),after=outcome(v),n=g.roll.filter(x=>x===face).length,gain=cash(after,me)-cash(o,me),denial=g.players.reduce((s,_,i)=>s+(i===me?0:cash(o,i)-cash(after,i)),0),newTable=!t.counts[me],tied=after.ties.includes(me),lead=tableWeight(v,me)-Math.max(0,...v.counts.map((_,i)=>i===me?0:tableWeight(v,i)));
  let score=difficulty==='relaxed'?n+gain*.2:gain+denial*.22-n*.18;
  const style=[newTable?1:0,denial*.22,(newTable&&!g.players[me].used?.8:0),gain*.15,!tied?.6:-.8,MINIGAMES.includes(t.effect)&&!t.played[me]?1.2:0,-n*.12][role];
  if(difficulty!=='relaxed')score+=style;
  if(difficulty==='expert'){const remaining=g.players.reduce((s,p,i)=>s+(i===me?0:p.left),0);score+=(gain>0&&lead>0?Math.min(lead,3)*.25:0)-(tied?.75:0)+(remaining===0?gain*.5:0);}
  return {face,score};
 }).sort((a,b)=>b.score-a.score||a.face-b.face);return choices[0]?.face;
}
export function publicBotSkip(g,difficulty='standard'){
 const p=g.players[g.turn];if(g.phase==='choose'&&g.roll.every(f=>royalClosed(g,f)))return true;if(g.phase!=='choose'||p.chips<1||p.skips>=2||difficulty==='relaxed')return false;
 const face=publicBotChoice(g,difficulty),t=g.tables[face-1],o=outcome(t),after=outcome(previewTable(g,face)),own=o=>o.awards.filter(a=>a.player===g.turn).reduce((n,a)=>n+a.amount,0);
 return own(after)<own(o)||(own(after)===0&&p.left<=2&&p.chips>1);
}
export function turnGuide(g){return `<details class="role-guide"><summary>${ROLE_GUIDES[roleOf(g,g.hero)][0]} · 角色打法</summary><p>${ROLE_GUIDES[roleOf(g,g.hero)][1]}</p></details>`;}
export function eventLine(g){const e=g.lastEvent;if(!e)return '';const lines=[['钱先替我保管。','这次站对边了。'],['这一手，记住了。','收枪，拿钱。'],['账还没算完。','账面不错。'],['别急，夜还很长。','谢谢款待。'],['重新计算。','在预期之内。'],['下一幕见。','好戏刚刚开始。'],['这笔损失，记账。','准点收工。']];const loss=e.changes.find(c=>c.delta<0),gain=e.changes.find(c=>c.delta>0),c=loss||gain;if(!c)return e.ties.length?'撞数了，换个角度再看。':'';return `${g.players[c.player].name}：「${lines[roleOf(g,c.player)][loss?0:1]}」`;}
