import {roleOf,tableWeight,bigCount,outcome,feedback,log,syncMoney,passReaction,advance,gameRandom} from './core.mjs';
import {royalRefresh} from './royale.mjs';

export const BALANCED_SKILLS=[
 {name:'初来乍到',text:'被动：每轮额外获得2颗普通骰，共9小＋1大（普通版为10颗普通骰）。'},
 {name:'正义执行',text:'每轮一次，狙掉任意玩家手中、刚掷出或赌场里的一颗实体骰子，含大骰。封闭赌场与模块暂存骰不能选。下轮恢复。'},
 {name:'主场优势',text:'每轮一次，用自己在同桌的1颗普通骰，换取对手计数为2或3的骰子组合；将自己全部筹码交给对手，至少2枚。不能空桌换走整桌。'},
 {name:'魅力四射',text:'每轮一次，从一位对手的钱中随机展示两张，选一张；交给对方一张发动前自己已有的钞票。只有一张时展示一张。结算后也可发动。'},
 {name:'精准发牌',text:'每轮一次，掷骰后选择最多2颗骰子，分别改成你指定的点数。大骰也能改。'},
 {name:'袖中乾坤',text:'每轮一次，选择任意数量刚掷出的骰子重掷，再逐颗决定保留原点数或新点数。不消耗筹码、不跳过回合。'},
 {name:'准点下班',text:'每轮一次，将刚掷出的一种点数全部改为另一种点数，然后自行选择其中1颗实体骰子弃置，本轮失效。至少需要2颗骰子。'}
];
export function tradeGroups(g,actor){
 const choices=[];if(g.players[actor].chips<2)return choices;
 for(const t of g.tables){if(g.royale?.closed===t.face||t.counts[actor]<=bigCount(t,actor))continue;
  for(let target=0;target<4;target++){if(target===actor)continue;for(let large=0;large<=bigCount(t,target);large++)for(let small=0;small<=t.counts[target]-bigCount(t,target);small++){const weight=small+large*2;if(weight>=2&&weight<=3)choices.push({target,face:t.face,small,large});}}
 }return choices;
}
export function balancedCan(g,actor){
 if(!g.skills||!Number.isInteger(actor)||actor<0||actor>3||g.players[actor].used||g.skillPending||g.phase==='royale'||g.phase==='minigame'||(g.phase==='reaction'&&g.turn!==actor))return false;
 const r=roleOf(g,actor),p=g.players[actor];
 if(r===0)return false;
 if(r===3)return p.wallet.length>0&&g.players.some((o,i)=>i!==actor&&o.wallet.length);
 if(['settled','finished'].includes(g.phase))return false;
 if(r===2)return tradeGroups(g,actor).length>0;
 if(r>=4)return g.phase==='choose'&&g.turn===actor&&g.roll.length>=(r===6?2:1);
 return g.players.some(p=>p.left>0)||g.tables.some(t=>g.royale?.closed!==t.face&&t.counts.some(n=>n>0));
}
export function balancedFinish(g,actor,detail){
 royalRefresh(g);
 g.players[actor].used=true;log(g,`${g.players[actor].name}发动${BALANCED_SKILLS[roleOf(g,actor)].name} · ${detail}`);
 if(g.phase==='reaction')passReaction(g,actor);else if(['ready','choose'].includes(g.phase)&&g.players[g.turn].left===0)advance(g);
 return true;
}
export function balancedUse(g,actor,c,rng=Math.random){
 if(!balancedCan(g,actor)||!c)return false;const r=roleOf(g,actor),p=g.players[actor],okIndex=i=>Number.isInteger(i)&&i>=0&&i<g.roll.length,okFace=v=>Number.isInteger(v)&&v>=1&&v<=6;
 if(r===2){const match=tradeGroups(g,actor).find(x=>['target','face','small','large'].every(k=>x[k]===c[k]));if(!match)return false;
  const {target,face,small,large}=match,t=g.tables[face-1],o=g.players[target],before=outcome(t),weights=t.counts.map((_,i)=>tableWeight(t,i)),n=small+large;
  t.counts[actor]+=n-1;t.counts[target]-=n-1;t.big[actor]+=large;t.big[target]-=large;p.supply+=n-1;o.supply-=n-1;
  const cost=p.chips;o.chips+=cost;p.chips=0;g.move++;t.last[actor]=t.last[target]=g.move;feedback(g,t,actor,before,'强制交易',weights);
  return balancedFinish(g,actor,`支付${cost}枚筹码，以1颗普通骰换取${face}号桌${o.name}的${small}小＋${large}大`);
 }
 if(r===3){const target=c.target,o=g.players[target];if(!o||target===actor||!o.wallet.length||!p.wallet.length)return false;
  const random=gameRandom(g,'steal:'+g.round+':'+actor,rng),indices=o.wallet.map((_,i)=>i),draw=[];
  while(draw.length<2&&indices.length){const j=Math.floor(random()*indices.length);draw.push(indices.splice(j,1)[0]);}
  p.used=true;g.skillPending={kind:'exchange',actor,target,draw,offered:p.wallet.slice(),candidates:draw.map(i=>o.wallet[i])};return true;
 }
 if(r===4){const changes=c.changes??[{index:c.index,value:c.value}];if(!Array.isArray(changes)||changes.length<1||changes.length>2||new Set(changes.map(x=>x.index)).size!==changes.length||!changes.every(x=>okIndex(x.index)&&okFace(x.value))||changes.every(x=>g.roll[x.index]===x.value))return false;
  changes.forEach(x=>g.roll[x.index]=x.value);g.lastEvent=null;return balancedFinish(g,actor,`为${changes.length}颗骰子指定点数`);
 }
 if(r===5){const picks=c.indices;if(!Array.isArray(picks)||!picks.length||new Set(picks).size!==picks.length||!picks.every(okIndex))return false;
  const random=gameRandom(g,'magic:'+g.round+':'+actor,rng);p.used=true;g.skillPending={kind:'reroll',actor,indices:[...picks],old:picks.map(i=>g.roll[i]),fresh:picks.map(()=>1+Math.floor(random()*6))};return true;
 }
 if(r===6){if(!okIndex(c.index)||!okFace(c.value)||g.roll[c.index]===c.value||!okIndex(c.discard))return false;
  const from=g.roll[c.index],n=g.roll.filter(v=>v===from).length;g.roll=g.roll.map(v=>v===from?c.value:v);const large=c.discard<(p.bigLeft||0);g.roll.splice(c.discard,1);p.left--;p.lost++;if(large){p.bigLeft--;p.bigLost++;}g.lastEvent=null;
  return balancedFinish(g,actor,`将${n}颗${from}点改成${c.value}点，弃置1颗${large?'大骰':'普通骰'}`);
 }return false;
}
export function resolveBalanced(g,c){
 const q=g.skillPending;if(!q||!c)return false;const p=g.players[q.actor];
 if(q.kind==='reroll'){if(!Array.isArray(c.keepNew)||c.keepNew.length!==q.indices.length||!c.keepNew.every(v=>typeof v==='boolean'))return false;
  q.indices.forEach((index,j)=>g.roll[index]=c.keepNew[j]?q.fresh[j]:q.old[j]);g.skillPending=null;g.lastEvent=null;return balancedFinish(g,q.actor,'逐颗选定重掷结果');
 }
 if(q.kind==='exchange'){if(!Number.isInteger(c.take)||c.take<0||c.take>=q.draw.length||!Number.isInteger(c.give)||c.give<0||c.give>=q.offered.length)return false;
  const o=g.players[q.target],receive=o.wallet.splice(q.draw[c.take],1)[0],give=p.wallet.splice(c.give,1)[0];o.wallet.push(give);p.wallet.push(receive);syncMoney(p);syncMoney(o);g.skillPending=null;g.lastEvent=null;return balancedFinish(g,q.actor,`用${give/10000}万交换${o.name}的${receive/10000}万`);
 }return false;
}
export function balancedBot(g,actor){
 const r=roleOf(g,actor),p=g.players[actor];if(g.skillPending){const q=g.skillPending;if(q.actor!==actor)return null;if(q.kind==='exchange')return {take:q.candidates.indexOf(Math.max(...q.candidates)),give:q.offered.indexOf(Math.min(...q.offered))};
  const counts=Array.from({length:7},(_,face)=>g.roll.filter(x=>x===face).length);return {keepNew:q.fresh.map((v,j)=>counts[v]>counts[q.old[j]])};
 }if(!balancedCan(g,actor))return null;
 if(r===2){let best=null;for(const c of tradeGroups(g,actor)){const t=g.tables[c.face-1],copy={...t,counts:[...t.counts],big:[...t.big]};copy.counts[actor]+=c.small+c.large-1;copy.counts[c.target]-=c.small+c.large-1;copy.big[actor]+=c.large;copy.big[c.target]-=c.large;const value=x=>outcome(x).awards.reduce((s,a)=>s+(a.player===actor?a.amount:a.player===c.target?-a.amount*.5:0),0),score=value(copy)-value(t)-p.chips*10000;if(score>0&&(!best||score>best.score))best={...c,score};}return best;}
 if(r===3){const targets=g.players.map((o,i)=>({o,i})).filter(x=>x.i!==actor&&x.o.wallet.length&&x.o.cash/x.o.notes>Math.min(...p.wallet)).sort((a,b)=>b.o.cash/b.o.notes-a.o.cash/a.o.notes);return targets.length?{target:targets[0].i}:null;}
 if(r>=4){const frequencies=Array.from({length:6},(_,i)=>({value:i+1,n:g.roll.filter(v=>v===i+1).length})).filter(x=>g.royale?.closed!==x.value).sort((a,b)=>b.n-a.n||b.value-a.value),value=frequencies[0]?.value??1,indices=g.roll.map((n,i)=>n!==value?i:-1).filter(i=>i>=0);if(!indices.length)return null;
  if(r===4)return {target:actor,changes:indices.slice(0,2).map(index=>({index,value}))};
  if(r===5)return {target:actor,indices};
  const index=indices[0],discard=g.roll.length-1;return {target:actor,index,value,discard};
 }return null;
}
export function validBalanced(g){
 if(g.balance!==undefined&&g.balance!==2)return false;const q=g.skillPending;if(!q)return true;
 const a=q.actor;if(!Number.isInteger(a)||a<0||a>3||!g.players[a].used||g.balance!==2)return false;
 const face=n=>Number.isInteger(n)&&n>=1&&n<=6;
 if(q.kind==='reroll')return roleOf(g,a)===5&&g.phase==='choose'&&g.turn===a&&Array.isArray(q.indices)&&q.indices.length>0&&new Set(q.indices).size===q.indices.length&&q.indices.every(i=>Number.isInteger(i)&&i>=0&&i<g.roll.length)&&[q.old,q.fresh].every(v=>Array.isArray(v)&&v.length===q.indices.length&&v.every(face))&&q.old.every((v,j)=>v===g.roll[q.indices[j]]);
 if(q.kind==='exchange')return roleOf(g,a)===3&&Number.isInteger(q.target)&&q.target>=0&&q.target<4&&q.target!==a&&Array.isArray(q.draw)&&q.draw.length===Math.min(2,g.players[q.target].wallet.length)&&new Set(q.draw).size===q.draw.length&&Array.isArray(q.candidates)&&q.candidates.length===q.draw.length&&q.draw.every((i,j)=>Number.isInteger(i)&&i>=0&&g.players[q.target].wallet[i]===q.candidates[j])&&JSON.stringify(q.offered)===JSON.stringify(g.players[a].wallet)&&q.offered.length>0;
 return false;
}
