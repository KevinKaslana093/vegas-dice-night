import {createGame,rollDice,placeDice,outcome,tableWeight,isBigRoll,banknoteOwners,NAMES,COLORS} from './core.mjs';
import {CINEMA_ASSETS} from './cinema.mjs';
export const BASIC_STEPS=[
 ['roll','先掷一手。','点「掷骰子」，看看你能去哪一桌。'],
 ['face6','三个6，一起选。','点一颗6点骰子，同点数会一起选中。'],
 ['invest','把这三颗放进6号桌。','点「确认下注」。其他骰子留到下次。'],
 ['next','你暂时领先。','手里少了3颗，6号桌多了3颗。8万先由你暂领，还没入袋。'],
 ['roll','老板和你撞数了。','你们都是3，一起出局；月兔只有1，反而暂领8万。再掷一次，试着超过老板。'],
 ['face6','再加一个6。','点6点，准备把你在这桌的数量加到4。'],
 ['invest','4比3多，奖金会换主人。','点「确认下注」，看看两张钱分别归谁。'],
 ['next','大钞回来了。','你4颗暂领8万，老板3颗暂领5万。等大家用完骰子才发钱。'],
 ['roll','最后四颗，去另一桌。','对手已用完骰子。掷出你的最后四颗。'],
 ['face2','这次去2号桌。','点2点。金色大骰是一颗骰子，争奖金时算2。'],
 ['invest','确认这一手，就能拿钱。','四颗一起放入2号桌；这一桌没有对手，你拿较大的那张。'],
 ['done','这次，钱真的入袋了。','所有骰子都放完才发钱。正式牌局共4轮，总钱数最多的人获胜。']
];
const toss=(g,values)=>{let i=0;return rollDice(g,()=>((values[i++%values.length]||1)-.5)/6);};
const bot=(g,face,values)=>{toss(g,values);placeDice(g,face);};
const basicMoney=n=>n/10000+'万';
export function createBasicsState(progress=0){let seed=1;const rng=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);const s={g:createGame(1,rng,{hero:1,skills:false,bigDice:true,rules:'classic'}),step:0,selected:0,changes:[]};for(let i=0;i<Math.min(Math.max(Number.isInteger(progress)?progress:0,0),11);i++)advanceBasics(s,BASIC_STEPS[s.step][0]);return s;}
export function advanceBasics(s,action){const n=s.step,g=s.g;if(action!==BASIC_STEPS[n]?.[0]||action==='done')return false;s.changes=[];
 if(n===0){toss(g,[2,6,6,6,2,3,4,5]);s.changes=['掷出8颗','其中3颗是6点'];}
 if(n===1){s.selected=6;s.changes=['选中全部3颗6点','尚未下注'];}
 if(n===2){placeDice(g,6);s.selected=0;s.changes=['手中 8 → 5颗','6号桌 0 → 3颗',basicMoney(g.tables[5].notes[0])+' 暂领：你'];}
 if(n===3){bot(g,6,[4,6,6,6,4,4,4,4]);bot(g,6,[5,6,5,5,5,5,5,5]);bot(g,1,[1]);s.changes=['老板投入3颗','你和老板撞数','8万暂领：你 → 月兔'];}
 if(n===4){toss(g,[2,6,2,2,2]);s.changes=['只掷剩余5颗','其中1颗是6点'];}
 if(n===5){s.selected=6;s.changes=['选中1颗6点','确认后：3 → 4颗'];}
 if(n===6){placeDice(g,6);s.selected=0;s.changes=['手中 5 → 4颗','6号桌 3 → 4颗','8万暂领：月兔 → 你'];}
 if(n===7){bot(g,4,[4]);bot(g,5,[5]);s.changes=['对手已用完骰子','你还剩4颗'];}
 if(n===8){toss(g,[2]);s.changes=['掷出最后4颗','金色大骰计数×2'];}
 if(n===9){s.selected=2;s.changes=['选中4颗2点，含1大骰','投入后计数5，去2号桌'];}
 if(n===10){placeDice(g,2);s.selected=0;s.changes=['手中 4 → 0颗','两桌奖金已发放','本轮实得 '+basicMoney(g.players[1].cash)];}
 s.step++;return true;
}
export function createBasics({cinema,die,prefs,onExit}){
 const key='vegas-night-basics-v1';let state,root,busy=false,assistTimer=0;
 const save=()=>{try{localStorage.setItem(key,JSON.stringify({step:state.step}));}catch{}};
 function close(mode){clearTimeout(assistTimer);save();root.remove();root=null;document.body.classList.remove('learning');onExit(mode);}
 const button=(a,label)=>`<button class="primary basic-hot" data-basic="${a}">${label}</button>`;
 function assist(){if(!root||busy||document.hidden||state.step===11)return;const p=root.querySelector('.lesson-dialogue p');p.classList.add('basic-assist');p.textContent=BASIC_STEPS[state.step][2]+' 亮起的地方就是下一步，不用先读完整说明。';root.querySelector('.basic-hot')?.focus({preventScroll:true});}
 function render(){clearTimeout(assistTimer);const s=state,g=s.g,step=s.step,face=step>=9?2:6,t=g.tables[face-1],o=outcome(t),owners=banknoteOwners(t,o),done=step===11,current=BASIC_STEPS[step];
 const dice=g.roll.length?g.roll.map((n,i)=>`<button data-basic="face${n}" class="dicebutton ${isBigRoll(g,i)?'big-die':''} ${s.selected===n?'picked':''} ${current[0]==='face'+n?'basic-hot':''}" ${current[0]==='face'+n?'':'disabled'} aria-label="选择${n}点${isBigRoll(g,i)?'大骰':''}">${die(n)}${isBigRoll(g,i)?'<small class="big-label">×2</small>':''}</button>`).join(''):`<span class="basic-hand-count">${g.players[1].left}<small>颗骰子还在你手中</small></span>`;
 const controls=done?`<div class="basic-earned"><small>本轮到账</small><strong>${basicMoney(g.players[1].cash)}</strong><p>6号 ${basicMoney(g.tables[5].notes[0])} ＋ 2号 ${basicMoney(g.tables[1].notes[0])}</p></div>`:`<div class="basic-hand"><small>你的手中 · 牛仔</small><div class="dice-row">${dice}</div>${current[0]==='roll'?button('roll','掷骰子'):current[0]==='invest'?button('invest','确认下注 · 放入'+g.roll.filter(n=>n===s.selected).length+'颗'):current[0]==='next'?button('next','看看对手怎么下'):''}</div>`;
 root.innerHTML=`<header class="lesson-header"><div><span>LEARN BY PLAYING</span><h1>第一局 · 跟着下三手</h1></div><button class="quiet" data-basic="exit">退出教学</button></header><div class="basic-progress"><span>${done?'学会了，去玩一局':step<4?'第1手 · 先占一桌':step<8?'第2手 · 打破撞数':'第3手 · 收下奖金'}</span><div>${[0,1,2].map(i=>`<i class="${step>=i*4?'on':''}"></i>`).join('')}</div></div><div class="basic-change" aria-live="polite"><small>${s.changes.length?'刚刚发生了什么':'先玩起来，规则边玩边学'}</small><div>${s.changes.map(x=>`<span>${x}</span>`).join('')}</div></div><div class="basic-scroll"><div class="basic-play"><section class="basic-casino lesson-table lt-${face}" aria-label="${face}号赌场"><header><b>${die(face)}</b><div><h2>${t.name}</h2><small>现在只看这一桌</small></div></header><div class="lesson-notes">${t.notes.map((amount,i)=>`<span class="${[3,4,7,11].includes(step)?'basic-changed':''}">${basicMoney(amount)}<small>${owners[i]===null?'待分配':(owners[i]===1?'你':NAMES[owners[i]])+(done?'获得':'暂领')}</small></span>`).join('')}</div><div class="basic-players">${g.players.map((p,i)=>`<div class="${o.ties.includes(i)?'basic-tied':''} ${i===1&&[3,7,11].includes(step)?'basic-changed':''}" style="--pc:${COLORS[i]}"><img src="${CINEMA_ASSETS.portraits[i]}" alt=""><span>${i===1?'你 · 牛仔':NAMES[i]}</span><b>${t.counts[i]?tableWeight(t,i):'—'}</b><small>${o.ties.includes(i)?'撞数出局':t.counts[i]?'计数':'没下注'}</small></div>`).join('')}</div><p class="basic-table-note">同数一起出局，剩下的人按数量拿钱。</p></section><section class="basic-controls">${controls}</section></div></div><section class="lesson-coach basic-coach"><div class="lesson-portrait"><img src="${CINEMA_ASSETS.portraits[3]}" alt="月兔"><span>月兔</span></div><div class="lesson-dialogue"><div class="lesson-speaker">月兔小姐</div><h2>${current[1]}</h2><p>${current[2]}</p>${done?`<div class="basic-finish">${button('play','开一局基础版')}<button class="quiet" data-basic="advanced">下一课 · 技能与特殊桌</button><button class="text-button" data-basic="replay">再练一次</button></div>`:''}</div></section>`;
 root.dataset.step=String(step);if(done)document.dispatchEvent(new CustomEvent('vegas-training-complete',{detail:'basics'}));else assistTimer=setTimeout(assist,10000);if(!prefs().motion)root.classList.add('basic-still');
 requestAnimationFrame(()=>{const hot=root?.querySelector('.basic-hot');hot?.scrollIntoView({block:'nearest'});hot?.focus({preventScroll:true});});
 }
 function click(e){const b=e.target.closest('[data-basic]');if(busy||cinema.active)return;if(!b||b.disabled){assist();return;}const a=b.dataset.basic;if(['exit','play','advanced'].includes(a)){close(a);return;}if(a==='replay'){state=createBasicsState();save();render();return;}if(!advanceBasics(state,a))return;save();if(a==='roll'){busy=true;const values=[...state.g.roll];cinema.play('roll',{actor:1,role:1,name:NAMES[1],values,bigIndex:state.g.players[1].bigLeft?0:-1},()=>{busy=false;if(root)render();});}else render();}
 return {get active(){return !!root;},open(){if(root)return;let progress=0;try{progress=JSON.parse(localStorage.getItem(key))?.step||0;}catch{}state=createBasicsState(progress);root=document.createElement('section');root.className='lesson-root basic-root';root.setAttribute('aria-label','基础实操教学');document.body.append(root);document.body.classList.add('learning');root.addEventListener('click',click);root.addEventListener('keydown',e=>{if(e.key==='Escape'&&!busy&&!cinema.active){e.preventDefault();close('exit');}});render();}};
}
