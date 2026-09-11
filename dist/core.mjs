export const NAMES = ['你', '阿橙', '小蓝', '紫仔'];
export const COLORS = ['#e9c879', '#ee936e', '#84c6dc', '#b7a1e8'];
export const CASINOS = ['金砂', '日落', '海市', '绿洲', '月宫', '星尘'];
export const sum = a => a.reduce((x,y)=>x+y,0);
export function deck(rng=Math.random) {
  const a = [6,8,8,6,6,5,5,5,5].flatMap((n,i)=>Array(n).fill((i+1)*10000));
  for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}
export function createGame(humans=1,rng=Math.random){
  const g={v:1,round:0,humans,players:NAMES.map((name,i)=>({name:humans===1?name:['金色玩家','橙色玩家','蓝色玩家','紫色玩家'][i],cash:0,notes:0,left:8})),deck:deck(rng),tables:[],turn:0,roll:[],phase:'ready',history:[],settlements:[]};
  nextRound(g);return g;
}
export function nextRound(g){
  if(g.round>=4)throw Error('Game finished');
  g.round++;g.turn=(g.round-1)%4;g.roll=[];g.phase='ready';g.settlements=[];
  g.players.forEach(p=>p.left=8);
  g.tables=CASINOS.map((name,i)=>{
    const notes=[];while(sum(notes)<50000){if(!g.deck.length)throw Error('Empty deck');notes.push(g.deck.shift());}
    return {name,face:i+1,notes:notes.sort((a,b)=>b-a),counts:[0,0,0,0]};
  });
  g.history.unshift(`第 ${g.round} 轮开始 · ${g.players[g.turn].name}先手`);
}
export function rollDice(g,rng=Math.random){
  if(g.phase!=='ready')return false;
  g.roll=Array.from({length:g.players[g.turn].left},()=>1+Math.floor(rng()*6));g.phase='choose';return true;
}
export function outcome(table){
  const ties=table.counts.map((n,i)=>n>0&&table.counts.filter(x=>x===n).length>1?i:-1).filter(i=>i>=0);
  const rank=table.counts.map((n,i)=>({n,i})).filter(x=>x.n>0&&!ties.includes(x.i)).sort((a,b)=>b.n-a.n);
  const awards=rank.slice(0,table.notes.length).map((p,j)=>({player:p.i,amount:table.notes[j]}));
  return {ties,rank,awards,unused:table.notes.slice(awards.length)};
}
export function placeDice(g,face){
  if(g.phase!=='choose'||!g.roll.includes(face))return false;
  const count=g.roll.filter(x=>x===face).length,actor=g.turn,t=g.tables[face-1];
  t.counts[actor]+=count;g.players[actor].left-=count;g.roll=[];
  const o=outcome(t),tied=o.ties.includes(actor);
  g.history.unshift(`${g.players[actor].name} → ${t.name}：放入 ${count} 颗${tied?' · 撞数，暂时出局！':''}`);
  g.history=g.history.slice(0,48);
  if(g.players.every(p=>p.left===0)){settle(g);return true;}
  do{g.turn=(g.turn+1)%4;}while(g.players[g.turn].left===0);
  g.phase='ready';return true;
}
export function settle(g){
  if(g.phase==='settled'||g.phase==='finished')return;
  g.settlements=g.tables.map(t=>{
    const o=outcome(t);
    o.awards.forEach(a=>{g.players[a.player].cash+=a.amount;g.players[a.player].notes++;});
    g.deck.push(...o.unused);return o;
  });
  g.phase=g.round===4?'finished':'settled';
}
export function winners(g){
  const ranking=g.players.map((p,i)=>({...p,i})).sort((a,b)=>b.cash-a.cash||b.notes-a.notes);
  return ranking.filter(p=>p.cash===ranking[0].cash&&p.notes===ranking[0].notes).map(p=>p.i);
}
export function botChoice(g,rng=Math.random){
  const me=g.turn;
  const choices=[...new Set(g.roll)].map(face=>{
    const t=g.tables[face-1],n=g.roll.filter(x=>x===face).length,before=outcome(t);
    const counts=[...t.counts];counts[me]+=n;
    const after=outcome({...t,counts});
    const own=o=>o.awards.find(a=>a.player===me)?.amount??0;
    const rivals=o=>sum(o.awards.filter(a=>a.player!==me).map(a=>a.amount));
    const competition=Math.max(0,...counts.filter((_,i)=>i!==me));
    const score=(own(after)-own(before))/10000+(rivals(before)-rivals(after))/45000 + (counts[me]>competition?0.6:0)-n*0.16 + rng()*1.5;
    return {face,score};
  });
  return choices.sort((a,b)=>b.score-a.score)[0].face;
}
export function validSave(g){
  if(!g||g.v!==1||![1,2,3,4].includes(g.round)||![1,2,4].includes(g.humans)||!['ready','choose','settled','finished'].includes(g.phase))return false;
  if(!Number.isInteger(g.turn)||g.turn<0||g.turn>3||!Array.isArray(g.players)||g.players.length!==4||!Array.isArray(g.tables)||g.tables.length!==6)return false;
  const int=(n,max)=>Number.isInteger(n)&&n>=0&&n<=max;
  const note=n=>Number.isInteger(n)&&n>=10000&&n<=90000&&n%10000===0;
  if(!g.players.every(p=>typeof p.name==='string'&&p.name.length<30&&int(p.left,8)&&int(p.cash,3000000)&&int(p.notes,54)))return false;
  if(!Array.isArray(g.deck)||!g.deck.every(note)||!Array.isArray(g.roll)||!g.roll.every(n=>int(n,6)&&n>0))return false;
  if(!g.tables.every((t,i)=>t.face===i+1&&t.name===CASINOS[i]&&Array.isArray(t.notes)&&t.notes.length>0&&t.notes.every(note)&&Array.isArray(t.counts)&&t.counts.length===4&&t.counts.every(n=>int(n,8))))return false;
  if(!g.players.every((p,i)=>sum(g.tables.map(t=>t.counts[i]))+p.left===8))return false;
  if(g.phase==='choose'&&g.roll.length!==g.players[g.turn].left)return false;
  if(g.phase==='ready'&&(g.roll.length||g.players[g.turn].left===0))return false;
  if(!Array.isArray(g.history)||!g.history.every(x=>typeof x==='string')||!Array.isArray(g.settlements))return false;
  if(['finished','settled'].includes(g.phase)&&(!g.players.every(p=>p.left===0)||g.settlements.length!==6))return false;
  if(['finished','settled'].includes(g.phase)&&g.settlements.some((o,i)=>JSON.stringify(o)!==JSON.stringify(outcome(g.tables[i]))))return false;
  if((g.phase==='finished'&&g.round!==4)||(g.phase==='settled'&&g.round===4))return false;
  return true;
}
