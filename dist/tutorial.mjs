import {createGame,rollDice,placeDice,skipTurn,useSkill,miniAction,outcome,previewTable,NAMES,COLORS,EFFECTS} from './core.mjs';
import {CINEMA_ASSETS} from './cinema.mjs';

// A separate, reproducible practice table. Every move uses the normal rules.
export const LESSON_STEPS=[
 ['next','序幕','第一次来？坐我旁边。','欢迎来到骰子之夜，牛仔。我是月兔，今晚由我带你认桌。先试一小轮，练习的钱和骰子都不会带进正式牌局。','牛仔：那就请你带路。'],
 ['next','认桌','先看奖金，再决定去哪里。','六座赌场围成一圈，从1号到6号总奖金递增，每桌恰好两张钱。看看6号皇家金库：经典规则下，第一名拿大钞，第二名拿小钞。','牛仔：盯上皇家金库了。','table6'],
 ['roll','掷骰','把手里的八颗，一起掷出去。','点数决定能去的赌场，数量决定竞争力。点亮的「掷骰子」交给你了。练习骰子是固定的，正式牌局才会随机。',null,'controls'],
 ['face6','选点','三颗6点，正好投向6号。','一次只能选一种点数，而且相同点数必须全部投入。点一下6点骰子，先看看下注预览。',null,'controls'],
 ['invest6','下注','选好了，还差一次确认。','这三颗都会留在皇家金库里；其他五颗回到你手中，等下次再投。点击「放入3颗」，完成第一次下注。',null,'controls'],
 ['next','轮转','看，奖金还只是“暂领”。','你已经占住大钞，但钱要等所有人用完骰子才发。接下来让老板、我和丹宁小姐依次行动。','牛仔：看看他们怎么跟。','table6'],
 ['next','撞数','老板跟了三颗——你们一起出局了。','你和老板都是3颗，经典桌会让同数量的玩家一起失去领奖资格。我只有1颗，反倒暂领大钞。撞数不拿走桌上的骰子，局面还可以改变。','牛仔：那就改一改局面。','table6'],
 ['skill','技能','牛仔，轮到你的拿手好戏了。','「正义执行」每轮一次，能狙掉任意玩家的一颗实体骰子。手里、刚掷出、已下注的都行。这次用它拆开皇家金库的平局。',null,'controls'],
 ['target','技能','先选一个目标：赌场老板。','让老板从3颗变2颗，你就能以3颗独自领先。请点赌场老板。',null,'controls'],
 ['zone','技能','再选骰子所在的位置。','目标是他已经放在6号赌场里的骰子。这里只少掉一颗，不会清空整堆。',null,'controls'],
 ['fire','技能','瞄准完毕。确认狙击。','这一枪之后，你的技能本轮就用过了，下轮恢复。看看骰子数量改变后，两张钱会归谁。',null,'controls'],
 ['next','破局','漂亮。三颗、两颗、一颗。','现在你暂领大钞，老板暂领小钞，我拿不到钱了。比起堆更多骰子，有时少一颗就能翻盘。','牛仔：接着掷。','table6'],
 ['roll','筹码','手里的五颗，再投一次。','桌上的三颗不会收回来；这次只投你剩下的五颗。',null,'controls'],
 ['skip','筹码','不想押这手？付一枚筹码跳过。','每轮每人获得2枚筹码，剩余可以累计。跳过会保留全部手中骰子、不下注，但要让下一位先行动；不是免费立刻重投。',null,'controls'],
 ['next','轮转','筹码2→1，五颗骰子全部保留。','你放弃的是这一次下注机会。现在让其他人走完，他们这回会用完自己的骰子，再轮到你。','牛仔：好，我等下一次。','players'],
 ['roll','重投','又到你了，重新掷这五颗。','刚才那次结果已经作废。这次是新的一掷；还剩1枚筹码，但我们先来试试特殊赌场。',null,'controls'],
 ['face2','特殊桌','五颗2点，去落日酒馆试试。','默认规则中，1–3号每轮重新抽特殊效果，4–6号保持经典。本教学固定2号为「骰子21点」：首次入桌会触发小游戏。',null,'controls'],
 ['invest2','特殊桌','确认下注，小游戏就会开始。','你的五颗实体骰子先放进2号桌。小游戏的骰子不会消耗手中的骰子，只能赢这张桌子的排名加成。',null,'controls'],
 ['draw','小游戏','从12点开始，再掷一颗。','16–18点加1，19–21点加2，超过21点加成归零。先试一次「再掷一颗」。',null,'controls'],
 ['bank','小游戏','18点。见好就收也是本事。','现在收手可以拿到+1桌内加成。继续掷可能更好，也可能超过21点。这次请收手，保住奖励。',null,'controls'],
 ['collect','小游戏','五颗实体骰子，加一点桌内加成。','2号桌会按6的数量参与排名和撞数，但你并没有多出一颗实体骰子。点击完成，就可以结算这一轮了。',null,'controls'],
 ['next','派彩','这次是真正入袋了。','所有人的手中骰子都用完，才逐桌发钱。6号的大钞属于你，小钞属于老板；2号只有你一位获奖者，所以只拿一张，另一张回收。','牛仔：这笔账，记住了。','payout'],
 ['next','下一桌','认识一下正式牌局的另外三种技能。','丹宁小姐每轮9骰；老板能用全部筹码强制换一桌骰子；我嘛，能从别人手里的钱随机抽一张。主动技能每轮一次，我在结算后也能出手。','牛仔：看来还得提防你。','players'],
 ['finish','毕业','欢迎入局，牛仔。','正式牌局打四轮，总钱数最多的人赢；同额再比钞票张数。会下注只是开始，真正的乐趣是盯着别人，改变奖金的归属。准备好了就去选角色开局吧。','完成教学 · 去选角色']
];
const lessonRoll=(g,values)=>{let i=0;return rollDice(g,()=>((values[i++%values.length]||1)-.5)/6);};
const lessonBot=(g,face,values)=>{lessonRoll(g,values);placeDice(g,face);};
export function createLesson(progress=0){
 let seed=1;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
 const g=createGame(1,rng,{hero:1,skills:true,rules:'half'});g.tables[0].effect='low';g.tables[1].effect='blackjack';g.tables[2].effect='reverse';
 const l={g,step:0,selected:0};
 for(let i=0;i<Math.min(Math.max(Number.isInteger(progress)?progress:0,0),LESSON_STEPS.length-1);i++)advanceLesson(l,LESSON_STEPS[l.step][0]);
 return l;
}
export function advanceLesson(l,action){
 const s=l.step,g=l.g;if(action!==LESSON_STEPS[s]?.[0]||action==='finish')return false;
 if(s===2)lessonRoll(g,[6,6,6,1,2,3,4,5]);
 if(s===3)l.selected=6;
 if(s===4){placeDice(g,6);l.selected=0;}
 if(s===5){lessonBot(g,6,[6,6,6,4,4,4,4,4]);lessonBot(g,6,[6,2,2,2,2,2,2,2]);lessonBot(g,1,[1]);}
 if(s===10)useSkill(g,1,{target:2,zone:'table',face:6});
 if(s===12)lessonRoll(g,[1,2,3,4,5]);
 if(s===13)skipTurn(g);
 if(s===14){lessonBot(g,4,[4]);lessonBot(g,5,[5]);}
 if(s===15)lessonRoll(g,[2]);
 if(s===16)l.selected=2;
 if(s===17){placeDice(g,2);l.selected=0;}
 if(s===18)miniAction(g,'draw',()=>.99);
 if(s===19)miniAction(g,'bank');
 if(s===20)miniAction(g,'continue');
 l.step++;return true;
}

export function createTutorial({cinema,die,onExit}){
 const key='vegas-night-tutorial-v1';let lesson,root,playing=false;
 const readProgress=()=>{try{return JSON.parse(localStorage.getItem(key))?.step||0;}catch{return 0;}};
 const save=()=>{try{localStorage.setItem(key,JSON.stringify({step:lesson.step,complete:lesson.step===23}));}catch{}};
 const fmt=n=>`${n/10000}万`;
 const actionButton=(action,label)=>`<button data-lesson="${action}" class="${LESSON_STEPS[lesson.step][0]===action?'lesson-hot primary':'quiet'}" ${LESSON_STEPS[lesson.step][0]===action?'':'disabled'}>${label}</button>`;
 function controls(){const s=lesson.step,g=lesson.g;
  if(s>=7&&s<=10)return `<div class="lesson-action-title">正义执行 <small>每轮一次</small></div>${s===7?actionButton('skill','发动 · 正义执行'):s===8?`<div class="lesson-options">${[0,1,2,3].map(i=>i===2?actionButton('target',NAMES[i]):`<button disabled>${NAMES[i]}</button>`).join('')}</div>`:s===9?actionButton('zone','6号皇家金库 · 老板的3颗骰子'):actionButton('fire','确认狙击 · 移除1颗')}`;
  if(s>=18&&s<=20)return `<div class="lesson-mini"><b>${g.pending.total}</b><span>骰子21点 · ${s===20?'已获得 +1':'当前点数'}</span>${actionButton('draw','再掷一颗')}${actionButton('bank','收手 · 保留加成+'+(g.pending.total>=16?1:0))}${s===20?actionButton('collect','完成小游戏 · 结算'):''}</div>`;
  if(s>=21)return `<div class="lesson-payout" data-focus="payout"><span>本轮实得 · 筹码牛仔</span><strong>${fmt(g.players[1].cash)}</strong><p>${g.players[1].wallet.map(fmt).join(' + ')} · ${g.players[1].notes}张钞票</p></div>`;
  return `<div class="lesson-action-title">${g.turn===1?'你的回合 · 筹码牛仔':'观察对手的回合'}<small>手中 ${g.players[1].left} 颗 · ◉ ${g.players[1].chips} 筹码</small></div><div class="dice-row">${g.roll.length?g.roll.map(n=>`<button data-lesson="face${n}" class="dicebutton ${lSelected(n)?'picked':''} ${LESSON_STEPS[s][0]==='face'+n?'lesson-hot':''}" ${LESSON_STEPS[s][0]==='face'+n?'':'disabled'} aria-label="选择${n}点">${die(n)}</button>`).join(''):Array.from({length:g.players[1].left},()=>'<span class="emptydie">·</span>').join('')}</div><div class="lesson-buttons">${actionButton('roll','掷骰子')}${actionButton(s<12?'invest6':'invest2',lesson.selected?(s<12?'放入3颗 → 6号':'放入5颗 → 2号'):'先选一种点数')}${actionButton('skip','支付1筹码 · 跳过本次')}</div>`;
 }
 function lSelected(n){return lesson.selected===n;}
 function render(){const l=lesson,g=l.g,s=LESSON_STEPS[l.step],focus=s[5];
  root.innerHTML=`<div class="lesson-header"><div><span>PROLOGUE / 00</span><h1>霓虹下的第一局</h1></div><button data-lesson="exit">退出教学</button></div><div class="lesson-progress"><span>${s[1]}</span><div><i style="width:${(l.step+1)/LESSON_STEPS.length*100}%"></i></div><small>${l.step+1} / ${LESSON_STEPS.length}</small></div><div class="lesson-scroll"><div class="lesson-players ${focus==='players'?'lesson-focus':''}" data-focus="players">${g.players.map((p,i)=>`<div style="--pc:${COLORS[i]}" class="${i===1?'lesson-you':''}"><img src="${CINEMA_ASSETS.portraits[i]}" alt=""><span>${['◆','●','■','▲'][i]} ${i===1?'你 · 牛仔':NAMES[i]}<small>${p.left}骰 · ${p.chips}筹码</small></span></div>`).join('')}</div><section class="lesson-board" aria-label="练习赌场，按1至6顺时针排列"><div class="lesson-orbit"></div><div class="lesson-center"><span>GUIDED TABLE</span><b>${l.step>=21?'本轮结算':'月兔的练习桌'}</b><small>固定骰子 · 不影响正式存档</small></div>${g.tables.map(actual=>{const t=l.selected===actual.face?previewTable(g,actual.face):actual,o=outcome(t);return `<article data-focus="table${t.face}" class="lesson-table lt-${t.face} ${focus==='table'+t.face||l.selected===t.face?'lesson-focus':''}"><header><b>${t.face}</b><span>${t.name}<small>总额 ${fmt(t.notes[0]+t.notes[1])}</small></span></header><div class="lesson-notes">${t.notes.map((n,j)=>{const award=o.awards[j];return `<span>${fmt(n)}<small style="color:${award?COLORS[award.player]:''}">${award?(award.player===1?'你':NAMES[award.player].slice(0,2))+(l.step>=21?'获得':'暂领'):'待分配'}</small></span>`;}).join('')}</div><div class="lesson-counts">${t.counts.map((n,i)=>`<span style="color:${COLORS[i]}" class="${o.ties.includes(i)?'lesson-tied':''}">${['◆','●','■','▲'][i]} ${n||'–'}${t.bonus[i]?'+'+t.bonus[i]:''}</span>`).join('')}</div><footer>${l.selected===t.face?'下注预览 · ':''}${EFFECTS[t.effect].name}${o.ties.length?' · 撞数出局':''}</footer></article>`;}).join('')}</section><section class="lesson-controls ${focus==='controls'||focus==='payout'?'lesson-focus':''}" data-focus="controls">${controls()}</section></div><section class="lesson-coach" aria-label="月兔小姐的教学提示"><div class="lesson-portrait"><img src="${CINEMA_ASSETS.portraits[3]}" alt="月兔小姐"><span>你的领桌人</span></div><div class="lesson-dialogue"><div class="lesson-speaker">月兔小姐 <small>GUIDE</small></div><h2>${s[2]}</h2><p aria-live="polite">${s[3]}</p><div class="lesson-reply">${s[4]?actionButton(s[0],s[4]):'<span class="lesson-instruction">◇ 点击上方发光的操作继续</span>'}${l.step===23?'<button class="quiet" data-lesson="replay">重新练习</button>':''}</div><span class="lesson-help" role="status"></span></div></section>`;
  root.dataset.step=String(l.step);
  const scroll=root.querySelector('.lesson-scroll'),target=root.querySelector(`[data-focus="${focus||'players'}"]`);
  requestAnimationFrame(()=>{if(!root||!target)return;if(target.offsetTop+target.offsetHeight>scroll.scrollTop+scroll.clientHeight||target.offsetTop<scroll.scrollTop)scroll.scrollTop=Math.max(0,target.offsetTop-scroll.offsetTop-(scroll.clientHeight-target.offsetHeight)/2);});
 }
 function close(){save();root.remove();root=null;document.body.classList.remove('learning');onExit(lesson.step===23);}
 function click(e){const b=e.target.closest('[data-lesson]');if(!b||playing||cinema.active)return;const a=b.dataset.lesson;
  if(a==='exit'||a==='finish'){close();return;}
  if(a==='replay'){lesson=createLesson();save();render();return;}
  if(!advanceLesson(lesson,a))return;save();
  if(a==='roll'||a==='fire'){
   playing=true;const event=a==='roll'?{actor:1,values:[...lesson.g.roll]}:{actor:1,target:2,face:6,zone:'table',value:6,before:3,after:2,human:true,label:'狙掉老板在6号赌场的一颗骰子'};
   cinema.play(a==='roll'?'roll':'skill',event,()=>{playing=false;if(root){render();root.querySelector('.lesson-hot')?.focus({preventScroll:true});}});
  }else{render();root.querySelector('.lesson-hot')?.focus({preventScroll:true});}
 }
 return {get active(){return !!root;},open(){if(root)return;lesson=createLesson(readProgress());root=document.createElement('section');root.className='lesson-root';root.setAttribute('aria-label','新手引导关');document.body.append(root);document.body.classList.add('learning');root.addEventListener('click',click);root.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();if(!playing)close();}});render();root.querySelector('.lesson-hot')?.focus({preventScroll:true});}};
}
