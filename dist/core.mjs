// Character abilities share the core action validation and physical-dice ledger.
export const SKILLS=[
 {name:'初来乍到',text:'被动：每轮额外获得1颗骰子，共9颗。'},
 {name:'正义执行',text:'每轮一次，狙掉任意玩家手中、刚掷出或已放入赌场的一颗实体骰子。该骰子本轮失效，下轮恢复。'},
 {name:'主场优势',text:'每轮一次，交出自己全部筹码，强制与一名玩家交换某座赌场的实体骰子数。至少需要1枚筹码，桌内加成不交换。'},
 {name:'魅力四射',text:'每轮一次，随时从另一位玩家已获得的钞票中随机抽走一张。结算后也可发动。'}
];

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
  gate:{name:'三颗起步',short:'至少 3 颗 · 才能争奖',text:'少于3颗不参与撞数和领奖。达到3颗后，同数量全部出局；其余按骰子从多到少，每人拿一张。'},
  reverse:{name:'第二名大奖',short:'第一拿小钞 · 第二拿大钞',text:'同数量先出局。剩下骰子最多者拿小钞，第二名拿大钞。只有一名幸存者时只拿小钞，大钞回收。'},
  blackjack:{name:'骰子21点',short:'首次入桌 · 玩21点赚加成',text:'每人每轮首次在本桌下注后，独立从12点开始，可继续掷1颗骰子累加，或随时收手。16–18点赚1点桌内加成，19–21点赚2点，超过21点则无加成。加成仅参与本桌排名及撞数，不增加手中骰子；本桌按经典规则分钱。'},
  highlow:{name:'比大小',short:'首次入桌 · 连猜赢加成',text:'每人每轮首次在本桌下注后，看到一颗基准骰子，猜下一颗更大还是更小。相同算输。首猜正确可收下1点桌内加成，或再猜一次争2点；猜错则本次加成为0。加成仅参与本桌排名及撞数，本桌按经典规则分钱。'}
};
export const MINIGAMES=['blackjack','highlow'];
export const SPECIALS=['insurance','low','jackpot','seven','last','gate','reverse',...MINIGAMES];
export const isHuman=(g,i=g.turn)=>((i-g.hero+4)%4)<g.humans;
export const sum=a=>a.reduce((x,y)=>x+y,0);
export function deck(rng=Math.random){const a=[6,8,8,6,6,5,5,5,5].flatMap((n,i)=>Array(n).fill((i+1)*10000));for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function createGame(humans=1,rng=Math.random,options={}){
  const rules=['half','all','classic'].includes(options.rules)?options.rules:'half';
  const hero=Number.isInteger(options.hero)&&options.hero>=0&&options.hero<4?options.hero:0;
  const g={v:5,skills:options.skills===true,hero,round:0,humans,rules,move:0,pending:null,lastEvent:null,players:NAMES.map(name=>({name,cash:0,notes:0,wallet:[],chips:0,used:false,left:8,supply:8,lost:0,skips:0})),deck:deck(rng),tables:[],turn:0,roll:[],phase:'ready',history:[],settlements:[]};nextRound(g,rng);return g;
}
function log(g,s){g.history.unshift(s);g.history=g.history.slice(0,48);}
export function nextRound(g,rng=Math.random){
  if(g.round>=4)throw Error('Game finished');g.round++;g.turn=(g.hero+g.round-1)%4;g.roll=[];g.phase='ready';g.settlements=[];g.move=0;g.pending=null;g.lastEvent=null;
  g.players.forEach((p,i)=>{p.left=g.skills&&i===0?9:8;p.supply=p.left;p.lost=0;p.skips=0;p.used=false;p.chips+=2;});
  const purses=Array.from({length:6},()=>{if(g.deck.length<2)throw Error('Empty deck');return g.deck.splice(0,2).sort((a,b)=>b-a);}).sort((a,b)=>sum(a)-sum(b)||a[0]-b[0]);
  const effects=[...SPECIALS];
  for(let i=effects.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[effects[i],effects[j]]=[effects[j],effects[i]];}
  if(!effects.slice(0,3).some(e=>MINIGAMES.includes(e))){const j=effects.findIndex(e=>MINIGAMES.includes(e)),k=Math.floor(rng()*3);[effects[j],effects[k]]=[effects[k],effects[j]];}
  g.tables=CASINOS.map((name,i)=>({name,face:i+1,notes:purses[i],effect:g.rules==='all'||(g.rules==='half'&&i<3)?effects[i]:'classic',counts:[0,0,0,0],bonus:[0,0,0,0],played:[false,false,false,false],first:[0,0,0,0],last:[0,0,0,0]}));
  log(g,`第 ${g.round} 轮 · 每桌2张钞票${g.rules==='classic'?'':' · 特殊效果已重新抽取'} · ${g.players[g.turn].name}先手`);
}
export function rollDice(g,rng=Math.random){if(g.phase!=='ready')return false;g.roll=Array.from({length:g.players[g.turn].left},()=>1+Math.floor(rng()*6));g.phase='choose';return true;}
export function outcome(t){
  const effect=t.effect||'classic',first=t.first||[0,0,0,0],last=t.last||[0,0,0,0];
  const eligible=t.counts.map((n,i)=>({n:n+(t.bonus?.[i]||0),i})).filter(x=>t.counts[x.i]>0&&(effect!=='gate'||x.n>=3));
  const ties=effect==='insurance'?[]:eligible.filter(x=>eligible.filter(y=>y.n===x.n).length>1).map(x=>x.i);
  const rank=eligible.filter(x=>!ties.includes(x.i)).sort((a,b)=>{
    if(effect==='low')return a.n-b.n;
    if(effect==='seven')return Math.abs(a.n-7)-Math.abs(b.n-7)||first[a.i]-first[b.i]||a.i-b.i;
    if(effect==='last')return last[b.i]-last[a.i]||a.i-b.i;
    return b.n-a.n||first[a.i]-first[b.i]||a.i-b.i;
  });
  const order=effect==='reverse'?[...t.notes].reverse():t.notes;
  const awards=effect==='jackpot'&&rank.length?t.notes.map(amount=>({player:rank[0].i,amount})):rank.slice(0,order.length).map((p,j)=>({player:p.i,amount:order[j]}));
  return {ties,rank,awards,unused:order.slice(awards.length)};
}
export function previewTable(g,face){
  const t=g.tables[face-1],counts=[...t.counts],first=[...t.first],last=[...t.last],n=g.roll.filter(x=>x===face).length;
  counts[g.turn]+=n;if(n){first[g.turn] ||= g.move+1;last[g.turn]=g.move+1;}return {...t,counts,first,last};
}
function advance(g){g.roll=[];if(g.players.every(p=>p.left===0)){settle(g);return;}do{g.turn=(g.turn+1)%4;}while(g.players[g.turn].left===0);g.phase='ready';}
export function placeDice(g,face,rng=Math.random){
  if(g.phase!=='choose'||!g.roll.includes(face))return false;
  const count=g.roll.filter(x=>x===face).length,actor=g.turn,t=g.tables[face-1];
  const before=outcome(t);g.move++;t.counts[actor]+=count;t.first[actor] ||= g.move;t.last[actor]=g.move;g.players[actor].left-=count;
  feedback(g,t,actor,before);
  const o=outcome(t);log(g,`${g.players[actor].name} → ${face}号：${count}颗${o.ties.includes(actor)?' · 撞数出局':''}`);
  if(MINIGAMES.includes(t.effect)&&!t.played[actor]){t.played[actor]=true;g.roll=[];g.phase='minigame';g.pending={face,actor,kind:t.effect,total:t.effect==='blackjack'?12:1+Math.floor(rng()*6),draws:[],wins:0,stage:'choice',earned:0,message:''};return true;}
  advance(g);return true;
}
function feedback(g,t,actor,before){const after=outcome(t),value=(o,i)=>sum(o.awards.filter(a=>a.player===i).map(a=>a.amount));g.lastEvent={face:t.face,actor,kind:after.ties.some(i=>!before.ties.includes(i))?'tie':'place',changes:g.players.map((_,i)=>({player:i,delta:value(after,i)-value(before,i)})).filter(x=>x.delta!==0),ties:after.ties};}
export function miniAction(g,action,rng=Math.random){
  const p=g.pending;if(g.phase!=='minigame'||!p)return false;
  if(action==='continue'){if(p.stage!=='done')return false;g.pending=null;advance(g);return true;}
  if(p.stage!=='choice')return false;
  if(action==='bank'){
    const earned=p.kind==='blackjack'?(p.total>=19?2:p.total>=16?1:0):p.wins;
    finishMini(g,earned,'收手，保留结果');return true;
  }
  if(p.kind==='blackjack'&&action==='draw'){
    const v=1+Math.floor(rng()*6);p.draws.push(v);p.total+=v;
    if(p.total>21)finishMini(g,0,'超过21点，爆点！');else if(p.total===21)finishMini(g,2,'正好21点！');
    return true;
  }
  if(p.kind==='highlow'&&['higher','lower'].includes(action)){
    const v=1+Math.floor(rng()*6),old=p.total;p.draws.push(v);p.total=v;
    if((action==='higher'&&v>old)||(action==='lower'&&v<old)){p.wins++;if(p.wins===2)finishMini(g,2,'连续猜对两次！');else p.message=`${old} → ${v}，猜对了！收手或再赌一次。`;}
    else finishMini(g,0,v===old?'点数相同，本次未获加成':'猜错了，本次未获加成');return true;
  }
  return false;
}
function finishMini(g,earned,message){const p=g.pending,t=g.tables[p.face-1],before=outcome(t);p.earned=earned;p.stage='done';p.message=message;t.bonus[p.actor]=earned;feedback(g,t,p.actor,before);log(g,`${g.players[p.actor].name} · ${EFFECTS[p.kind].name}：${message} · 本桌加成+${earned}`);}
export function miniBotAction(g){const p=g.pending;if(!p)return null;if(p.stage==='done')return 'continue';if(p.kind==='blackjack')return p.total>=18?'bank':'draw';if(p.wins&&p.total>=3&&p.total<=4)return 'bank';return p.total<=3?'higher':'lower';}
export function canSkip(g){return g.phase==='choose'&&g.players[g.turn].left>0&&g.players[g.turn].chips>0;}
export function skipTurn(g){if(!canSkip(g))return false;const p=g.players[g.turn];p.skips++;p.chips--;g.lastEvent=null;log(g,`${p.name}支付1枚筹码跳过 · 留着${p.left}颗骰子，下次轮到时重投`);advance(g);return true;}
export function settle(g){if(['settled','finished'].includes(g.phase))return;g.settlements=g.tables.map(t=>{const o=outcome(t);o.awards.forEach(a=>{g.players[a.player].wallet.push(a.amount);syncMoney(g.players[a.player]);});g.deck.push(...o.unused);return o;});g.phase=g.round===4?'finished':'settled';}
function syncMoney(p){p.cash=sum(p.wallet);p.notes=p.wallet.length;}
export function canSkill(g,actor){return g.skills&&Number.isInteger(actor)&&actor>0&&actor<4&&!g.players[actor].used&&(actor===3||!['settled','finished'].includes(g.phase))&&(actor!==2||g.players[actor].chips>0);}
export function useSkill(g,actor,choice,rng=Math.random){
  if(!canSkill(g,actor)||!choice)return false;const {target,zone,face,index}=choice;
  if(!Number.isInteger(target)||target<0||target>3)return false;
  const p=g.players[actor],other=g.players[target];let detail='';
  if(actor===1){
    if(zone==='table'){
      if(!Number.isInteger(face)||face<1||face>6)return false;const t=g.tables[face-1];if(!t.counts[target])return false;
      const before=outcome(t);t.counts[target]--;other.lost++;feedback(g,t,actor,before);detail=`狙掉${other.name}在${face}号桌的一颗骰子`;
    }else if(zone==='roll'){
      if(g.phase!=='choose'||target!==g.turn||!Number.isInteger(index)||index<0||index>=g.roll.length)return false;
      const value=g.roll.splice(index,1)[0];other.left--;other.lost++;g.lastEvent=null;detail=`狙掉${other.name}刚掷出的${value}点骰子`;
    }else if(zone==='hand'){
      if(other.left<1||(g.phase==='choose'&&target===g.turn))return false;
      other.left--;other.lost++;g.lastEvent=null;detail=`狙掉${other.name}手中的一颗骰子`;
    }else return false;
  }else if(actor===2){
    if(target===actor||!Number.isInteger(face)||face<1||face>6)return false;
    const t=g.tables[face-1],a=t.counts[actor],b=t.counts[target];if(a===b)return false;
    const before=outcome(t);t.counts[actor]=b;t.counts[target]=a;p.supply+=b-a;other.supply+=a-b;g.move++;
    for(const i of [actor,target]){t.first[i]=t.counts[i]?(t.first[i]||g.move):0;t.last[i]=t.counts[i]?g.move:0;}
    const cost=p.chips;other.chips+=cost;p.chips=0;feedback(g,t,actor,before);detail=`交给${other.name}${cost}枚筹码，交换${face}号桌骰子（${a} ↔ ${b}）`;
  }else{
    if(target===actor||other.wallet.length===0)return false;
    const i=Math.floor(rng()*other.wallet.length),amount=other.wallet.splice(i,1)[0];p.wallet.push(amount);syncMoney(p);syncMoney(other);g.lastEvent=null;detail=`从${other.name}的钱中抽走${amount/10000}万`;
  }
  p.used=true;log(g,`${p.name}发动${['','正义执行','主场优势','魅力四射'][actor]} · ${detail}`);
  if(['ready','choose'].includes(g.phase)&&g.players[g.turn].left===0)advance(g);
  return true;
}
export function botSkill(g,actor,rng=Math.random){
  if(!canSkill(g,actor))return null;
  if(actor===3){const targets=g.players.map((p,i)=>({i,p})).filter(x=>x.i!==3&&x.p.wallet.length).sort((a,b)=>b.p.cash/b.p.notes-a.p.cash/a.p.notes);return targets.length?{target:targets[0].i}:null;}
  const own=t=>sum(outcome(t).awards.filter(a=>a.player===actor).map(a=>a.amount)),rivals=t=>sum(outcome(t).awards.filter(a=>a.player!==actor).map(a=>a.amount));
  const choices=[];
  for(const t of g.tables)for(let target=0;target<4;target++){
    const copy={...t,counts:[...t.counts]};if(actor===1){if(!copy.counts[target])continue;copy.counts[target]--;}else{if(target===actor||copy.counts[target]===copy.counts[actor])continue;[copy.counts[actor],copy.counts[target]]=[copy.counts[target],copy.counts[actor]];}
    const score=(own(copy)-own(t))+(rivals(t)-rivals(copy))*.3;
    choices.push({target,face:t.face,zone:'table',score});
  }
  choices.sort((a,b)=>b.score-a.score);if(choices[0]?.score>0&&(g.move>=6||sum(g.players.map(p=>p.left))<=5))return choices[0];
  if(actor===1&&g.move>=12){const target=g.turn;if(target!==actor&&g.players[target].left>0)return g.phase==='choose'?{target,zone:'roll',index:0}:{target,zone:'hand'};}
  return null;
}
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
  if(!g||g.v!==5||typeof g.skills!=='boolean'||!Number.isInteger(g.hero)||g.hero<0||g.hero>3||![1,2,3,4].includes(g.round)||![1,2,4].includes(g.humans)||!['half','all','classic'].includes(g.rules)||!['ready','choose','minigame','settled','finished'].includes(g.phase))return false;
  const int=(n,max)=>Number.isInteger(n)&&n>=0&&n<=max,note=n=>int(n,90000)&&n>=10000&&n%10000===0;
  if(!int(g.turn,3)||!int(g.move,100)||!Array.isArray(g.players)||g.players.length!==4||!Array.isArray(g.tables)||g.tables.length!==6)return false;
  if(!g.players.every(p=>typeof p.name==='string'&&p.name.length<30&&int(p.left,9)&&int(p.chips,32)&&typeof p.used==='boolean'&&int(p.supply,33)&&int(p.lost,1)&&Array.isArray(p.wallet)&&p.wallet.every(note)&&p.cash===sum(p.wallet)&&p.notes===p.wallet.length&&int(p.cash,3000000)&&int(p.notes,54)&&int(p.skips,Number.MAX_SAFE_INTEGER)))return false;
  if(!Array.isArray(g.deck)||!g.deck.every(note)||!Array.isArray(g.roll)||!g.roll.every(n=>int(n,6)&&n>0))return false;
  if(!g.tables.every((t,i)=>t.face===i+1&&t.name===CASINOS[i]&&Object.hasOwn(EFFECTS,t.effect)&&Array.isArray(t.notes)&&t.notes.length===2&&t.notes.every(note)&&['counts','first','last'].every(key=>Array.isArray(t[key])&&t[key].length===4&&t[key].every(n=>int(n,key==='counts'?33:100)))))return false;
  if(!g.players.every((p,i)=>sum(g.tables.map(t=>t.counts[i]))+p.left+p.lost===p.supply))return false;
  if(sum(g.players.map(p=>p.supply))!==(g.skills?33:32))return false;
  if(!g.tables.every(t=>Array.isArray(t.bonus)&&t.bonus.length===4&&t.bonus.every(n=>int(n,2))&&Array.isArray(t.played)&&t.played.length===4&&t.played.every(v=>typeof v==='boolean')))return false;
  if(g.phase==='minigame'){const p=g.pending;if(!p||!int(p.face,6)||p.face<1||p.actor!==g.turn||!MINIGAMES.includes(p.kind)||g.tables[p.face-1].effect!==p.kind||!g.tables[p.face-1].played[p.actor]||!['choice','done'].includes(p.stage)||!int(p.total,27)||!int(p.wins,2)||!int(p.earned,2)||!Array.isArray(p.draws)||p.draws.length>10||!p.draws.every(n=>int(n,6)&&n>0)||typeof p.message!=='string')return false;}
  else if(g.pending!==null)return false;
  if(g.phase==='choose'&&(g.roll.length!==g.players[g.turn].left||!g.roll.length))return false;
  if(g.phase==='ready'&&(g.roll.length||g.players[g.turn].left===0))return false;
  if(!['choose'].includes(g.phase)&&g.roll.length)return false;
  if(!Array.isArray(g.history)||!g.history.every(x=>typeof x==='string')||!Array.isArray(g.settlements))return false;
  if(['settled','finished'].includes(g.phase)&&(!g.players.every(p=>p.left===0)||g.settlements.length!==6||g.settlements.some((o,i)=>JSON.stringify(o)!==JSON.stringify(outcome(g.tables[i])))))return false;
  if((g.phase==='finished'&&g.round!==4)||(g.phase==='settled'&&g.round===4))return false;return true;
}
