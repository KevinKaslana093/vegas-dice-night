export const NAMES=['丹宁小姐','筹码牛仔','赌场老板','月兔小姐'];
export const COLORS=['#f5b7cb','#f2c477','#7bdcc4','#bda2fb'];
export const CASINOS=['霓虹街','落日酒馆','月兔会馆','翡翠厅','星光宫','皇家金库'];
export const EFFECTS={
  classic:{name:'经典赌场',short:'同数出局 · 多者先拿',text:'同数量全部出局；其余玩家按骰子从多到少，每人拿一张钞票。'},
  insurance:{name:'先到先得',short:'撞数不出局 · 先来优先',text:'骰子多者先拿钱；同数量不出局，较早首次进入本桌的人优先。每人拿一张。'},
  low:{name:'以少胜多',short:'同数出局 · 少者先拿',text:'同数量全部出局；其余玩家按骰子从少到多，每人拿一张钞票。'},
  jackpot:{name:'赢家通吃',short:'同数出局 · 第一独享',text:'同数量全部出局；剩下骰子最多的一人拿走本桌全部钞票。'},
  seven:{name:'幸运七',short:'越接近 7 颗 · 越先拿',text:'同数量全部出局；剩下的人按骰子数量与7的距离排序，越近越先拿一张。距离相同，首次入桌更早者优先。'},
  last:{name:'末班车',short:'同数出局 · 晚来先拿',text:'同数量全部出局；剩下的人按最后一次往本桌放骰子的时间排序，越晚越先拿一张。'},
  gate:{name:'三颗起步',short:'至少 3 颗 · 才能争奖',text:'少于3颗不参与撞数和领奖。达到3颗后，同数量全部出局；其余按骰子从多到少，每人拿一张。'}
};
export const SPECIALS=['insurance','low','jackpot','seven','last','gate'];
export const sum=a=>a.reduce((x,y)=>x+y,0);
export function deck(rng=Math.random){const a=[6,8,8,6,6,5,5,5,5].flatMap((n,i)=>Array(n).fill((i+1)*10000));for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function createGame(humans=1,rng=Math.random,options={}){
  const rules=['half','all','classic'].includes(options.rules)?options.rules:'half';
  const g={v:2,round:0,humans,rules,move:0,players:NAMES.map(name=>({name,cash:0,notes:0,left:8,skips:0})),deck:deck(rng),tables:[],turn:0,roll:[],phase:'ready',history:[],settlements:[]};nextRound(g);return g;
}
function log(g,s){g.history.unshift(s);g.history=g.history.slice(0,48);}
export function nextRound(g){
  if(g.round>=4)throw Error('Game finished');g.round++;g.turn=(g.round-1)%4;g.roll=[];g.phase='ready';g.settlements=[];g.move=0;
  g.players.forEach(p=>{p.left=8;p.skips=0;});
  const purses=Array.from({length:6},()=>{const notes=[];while(sum(notes)<50000){if(!g.deck.length)throw Error('Empty deck');notes.push(g.deck.shift());}return notes.sort((a,b)=>b-a);}).sort((a,b)=>sum(a)-sum(b)||a[0]-b[0]);
  g.tables=CASINOS.map((name,i)=>({name,face:i+1,notes:purses[i],effect:g.rules==='all'||(g.rules==='half'&&i<3)?SPECIALS[i]:'classic',counts:[0,0,0,0],first:[0,0,0,0],last:[0,0,0,0]}));
  log(g,`第 ${g.round} 轮 · 奖金已排序 · ${g.players[g.turn].name}先手`);
}
export function rollDice(g,rng=Math.random){if(g.phase!=='ready')return false;g.roll=Array.from({length:g.players[g.turn].left},()=>1+Math.floor(rng()*6));g.phase='choose';return true;}
export function outcome(t){
  const effect=t.effect||'classic',first=t.first||[0,0,0,0],last=t.last||[0,0,0,0];
  const eligible=t.counts.map((n,i)=>({n,i})).filter(x=>x.n>0&&(effect!=='gate'||x.n>=3));
  const ties=effect==='insurance'?[]:eligible.filter(x=>eligible.filter(y=>y.n===x.n).length>1).map(x=>x.i);
  const rank=eligible.filter(x=>!ties.includes(x.i)).sort((a,b)=>{
    if(effect==='low')return a.n-b.n;
    if(effect==='seven')return Math.abs(a.n-7)-Math.abs(b.n-7)||first[a.i]-first[b.i]||a.i-b.i;
    if(effect==='last')return last[b.i]-last[a.i]||a.i-b.i;
    return b.n-a.n||first[a.i]-first[b.i]||a.i-b.i;
  });
  const awards=effect==='jackpot'&&rank.length?t.notes.map(amount=>({player:rank[0].i,amount})):rank.slice(0,t.notes.length).map((p,j)=>({player:p.i,amount:t.notes[j]}));
  return {ties,rank,awards,unused:t.notes.slice(awards.length)};
}
export function previewTable(g,face){
  const t=g.tables[face-1],counts=[...t.counts],first=[...t.first],last=[...t.last],n=g.roll.filter(x=>x===face).length;
  counts[g.turn]+=n;if(n){first[g.turn] ||= g.move+1;last[g.turn]=g.move+1;}return {...t,counts,first,last};
}
function advance(g){g.roll=[];if(g.players.every(p=>p.left===0)){settle(g);return;}do{g.turn=(g.turn+1)%4;}while(g.players[g.turn].left===0);g.phase='ready';}
export function placeDice(g,face){
  if(g.phase!=='choose'||!g.roll.includes(face))return false;
  const count=g.roll.filter(x=>x===face).length,actor=g.turn,t=g.tables[face-1];
  g.move++;t.counts[actor]+=count;t.first[actor] ||= g.move;t.last[actor]=g.move;g.players[actor].left-=count;
  const o=outcome(t);log(g,`${g.players[actor].name} → ${face}号：${count}颗${o.ties.includes(actor)?' · 撞数出局':''}`);advance(g);return true;
}
export function canSkip(g){return g.phase==='choose'&&g.players[g.turn].left>0;}
export function skipTurn(g){if(!canSkip(g))return false;const p=g.players[g.turn];p.skips++;log(g,`${p.name}跳过 · 留着${p.left}颗骰子，下次轮到时重投`);advance(g);return true;}
export function settle(g){if(['settled','finished'].includes(g.phase))return;g.settlements=g.tables.map(t=>{const o=outcome(t);o.awards.forEach(a=>{g.players[a.player].cash+=a.amount;g.players[a.player].notes++;});g.deck.push(...o.unused);return o;});g.phase=g.round===4?'finished':'settled';}
export function winners(g){const rank=g.players.map((p,i)=>({...p,i})).sort((a,b)=>b.cash-a.cash||b.notes-a.notes);return rank.filter(p=>p.cash===rank[0].cash&&p.notes===rank[0].notes).map(p=>p.i);}
export function botChoice(g,rng=Math.random){
  const me=g.turn,own=o=>sum(o.awards.filter(a=>a.player===me).map(a=>a.amount)),rivals=o=>sum(o.awards.filter(a=>a.player!==me).map(a=>a.amount));
  const choices=[...new Set(g.roll)].map(face=>{const n=g.roll.filter(x=>x===face).length,before=outcome(g.tables[face-1]),after=outcome(previewTable(g,face));return {face,score:(own(after)-own(before))/10000+(rivals(before)-rivals(after))/50000-n*.15+rng()*.8};}).sort((a,b)=>b.score-a.score);
  return choices[0]?.face;
}
export function botShouldSkip(g,rng=Math.random){
  if(!canSkip(g)||g.players[g.turn].skips>=2)return false;
  const face=botChoice(g,()=>.5),before=outcome(g.tables[face-1]),after=outcome(previewTable(g,face));
  const own=o=>sum(o.awards.filter(a=>a.player===g.turn).map(a=>a.amount));return own(after)<=own(before)&&rng()<.45;
}
export function validSave(g){
  if(!g||g.v!==2||![1,2,3,4].includes(g.round)||![1,2,4].includes(g.humans)||!['half','all','classic'].includes(g.rules)||!['ready','choose','settled','finished'].includes(g.phase))return false;
  const int=(n,max)=>Number.isInteger(n)&&n>=0&&n<=max,note=n=>int(n,90000)&&n>=10000&&n%10000===0;
  if(!int(g.turn,3)||!int(g.move,32)||!Array.isArray(g.players)||g.players.length!==4||!Array.isArray(g.tables)||g.tables.length!==6)return false;
  if(!g.players.every(p=>typeof p.name==='string'&&p.name.length<30&&int(p.left,8)&&int(p.cash,3000000)&&int(p.notes,54)&&int(p.skips,Number.MAX_SAFE_INTEGER)))return false;
  if(!Array.isArray(g.deck)||!g.deck.every(note)||!Array.isArray(g.roll)||!g.roll.every(n=>int(n,6)&&n>0))return false;
  if(!g.tables.every((t,i)=>t.face===i+1&&t.name===CASINOS[i]&&Object.hasOwn(EFFECTS,t.effect)&&Array.isArray(t.notes)&&t.notes.length>0&&t.notes.every(note)&&['counts','first','last'].every(key=>Array.isArray(t[key])&&t[key].length===4&&t[key].every(n=>int(n,key==='counts'?8:32)))))return false;
  if(!g.players.every((p,i)=>sum(g.tables.map(t=>t.counts[i]))+p.left===8))return false;
  if(g.phase==='choose'&&(g.roll.length!==g.players[g.turn].left||!g.roll.length))return false;
  if(g.phase==='ready'&&(g.roll.length||g.players[g.turn].left===0))return false;
  if(!Array.isArray(g.history)||!g.history.every(x=>typeof x==='string')||!Array.isArray(g.settlements))return false;
  if(['settled','finished'].includes(g.phase)&&(!g.players.every(p=>p.left===0)||g.settlements.length!==6||g.settlements.some((o,i)=>JSON.stringify(o)!==JSON.stringify(outcome(g.tables[i])))))return false;
  if((g.phase==='finished'&&g.round!==4)||(g.phase==='settled'&&g.round===4))return false;return true;
}
