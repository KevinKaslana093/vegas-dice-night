import {COLORS,CASINOS,sum,createGame,nextRound,rollDice,placeDice,outcome,botChoice,winners,validSave} from './core.mjs';
const $=s=>document.querySelector(s), app=$('#app'), modal=$('#modal');
const SAVE='vegas-night-save-v1', PREF='vegas-night-prefs-v1';
const read=k=>{try{return JSON.parse(localStorage.getItem(k))}catch{return null}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
let prefs={sound:true,fast:false,motion:true,...read(PREF)}, saved=read(SAVE);
let game=validSave(saved)?saved:null, selected=0, busy=false,timer=0,generation=0, audio,dialogType='',preview=false;
const money=n=>`${n/10000}万`;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const dots={1:[4],2:[0,8],3:[0,4,8],4:[0,2,6,8],5:[0,2,4,6,8],6:[0,2,3,5,6,8]};
function die(n){return `<span class="die" aria-hidden="true">${Array.from({length:9},(_,i)=>`<i class="${dots[n].includes(i)?'':'off'}"></i>`).join('')}</span>`;}
function sound(kind){
  if(!prefs.sound)return;
  try{audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();
    const freqs=kind==='roll'?[150,240,190,310]:kind==='win'?[523,659,784]:kind==='tie'?[220,185]:[460,640];
    freqs.forEach((f,i)=>{const o=audio.createOscillator(),v=audio.createGain(),t=audio.currentTime+i*.075;o.type=kind==='roll'?'triangle':'sine';o.frequency.setValueAtTime(f,t);v.gain.setValueAtTime(.001,t);v.gain.linearRampToValueAtTime(.07,t+.007);v.gain.exponentialRampToValueAtTime(.001,t+.13);o.connect(v);v.connect(audio.destination);o.start(t);o.stop(t+.15);});
  }catch{}
}
function persist(){if(game&&!preview)write(SAVE,game);}
function canAct(){return game&&!preview&&!busy&&!modal.open&&game.turn<game.humans;}
function human(){return game.turn<game.humans;}
function announce(s){$('#announce').textContent=s;}
function render(){
  document.documentElement.classList.toggle('no-motion',!prefs.motion);
  const g=game, done=['settled','finished'].includes(g.phase), choosing=g.phase==='choose'&&human()&&!busy&&!preview;
  const total=sum(g.tables.flatMap(t=>t.notes));
  app.innerHTML=`<main class="shell">
    <header class="top"><div class="brand"><span class="brand-icon">✦</span><div><div class="eyebrow">LAS VEGAS · DICE NIGHT</div><h1>拉斯维加斯</h1></div></div><nav class="tools" aria-label="游戏菜单"><button class="quiet" data-action="rules">玩法</button><button class="quiet" data-action="settings">${prefs.sound?'声音 · 开':'声音 · 关'}</button><button class="quiet" data-action="pause">暂停</button></nav></header>
    <div class="roundbar"><div class="rounds"><span class="roundlabel">第 <strong>${g.round}</strong> / 4 轮</span>${[1,2,3,4].map(n=>`<span class="rounddot ${n===g.round?'on':n<g.round?'done':''}"></span>`).join('')}</div><div class="rulehint">同桌骰子数量相同，<strong>一起出局</strong></div></div>
    <section class="players" aria-label="玩家筹码">${g.players.map((p,i)=>`<div class="player ${i===g.turn&&!done?'active':''}" style="--pc:${COLORS[i]}"><span class="avatar">${['金','橙','蓝','紫'][i]}</span><div><div class="pname">${esc(p.name)}${i>=g.humans?' · 电脑':''}</div><div class="pcash">${money(p.cash)} <small>奖金</small></div></div><div class="pleft"><strong>${p.left}</strong>剩余骰子</div></div>`).join('')}</section>
    <div class="layout"><section class="board" aria-label="六张赌场桌">${g.tables.map((t,i)=>{
      const n=g.roll.filter(x=>x===i+1).length,active=choosing&&n>0,counts=[...t.counts];
      if(selected===i+1&&choosing)counts[g.turn]+=n;
      const o=outcome({...t,counts});
      const forecast=selected===i+1&&choosing?`放入 <b>${n}</b> 颗后：${o.ties.includes(g.turn)?'你撞数，暂时出局':o.awards.some(a=>a.player===g.turn)?`你暂获 ${money(o.awards.find(a=>a.player===g.turn).amount)}`:'你暂未分到奖金'}`:o.ties.length?`${o.ties.map(j=>esc(g.players[j].name)).join('、')}撞数${o.awards.length?' · 有人可捡漏':''}`:o.awards.length?`${esc(g.players[o.awards[0].player].name)}${done?'获得':'暂领'} ${money(o.awards[0].amount)}`:active?`可放入 ${n} 颗 · 点击预览`:'尚无人入桌';
      return `<button class="casino ${active?'available':''} ${selected===i+1?'selected':''}" data-face="${i+1}" ${active?'':'disabled'} aria-label="${i+1}点 ${t.name}桌，奖金${t.notes.map(money).join('、')}，${active?`可放${n}颗`:'当前不可放置'}"><div class="casinohead"><div><div class="casinoname">${t.name}</div><div class="casinosub">${['GOLDEN SANDS','SUNSET CLUB','THE MIRAGE','OASIS ROOM','MOON PALACE','STARDUST'][i]}</div></div>${die(i+1)}</div><div class="money">${t.notes.map(v=>`<span class="note">${v/10000}<small>万</small></span>`).join('')}</div><div class="counts">${counts.map((c,j)=>`<span class="pile ${c?'':'empty'} ${o.ties.includes(j)?'tied':''}" style="--pc:${COLORS[j]}" title="${esc(g.players[j].name)}：${c}颗${o.ties.includes(j)?'，同数出局':''}"><span class="pilesymbol">${['◆','●','■','▲'][j]}</span>${c||'–'}</span>`).join('')}</div><div class="forecast">${forecast}</div></button>`;
    }).join('')}</section><aside class="sidebar"><div class="sidebox"><h2>本轮桌面奖金</h2><div class="leadamount">${money(total)}</div><p>每张钞票只给一人。<br>领先未必安全，撞数就会出局。</p></div><div class="sidebox"><h2>牌桌动态</h2><div class="log">${g.history.slice(0,9).map(s=>`<div class="logitem">${esc(s)}</div>`).join('')}</div></div></aside></div>
    <section class="control" aria-label="当前回合"><div><div class="turntitle">${done?'本轮筹码已落定':busy?`${esc(g.players[g.turn].name)}正在掷骰…`:human()?`轮到<span>${esc(g.players[g.turn].name)}</span>`:`${esc(g.players[g.turn].name)}正在考虑…`}</div><div class="turnhint">${done?'看看哪些人成功拿钱，哪些人撞数出局。':busy?'骰子即将落定。':g.phase==='choose'?human()?(selected?`已选 ${selected} 点，共 ${g.roll.filter(x=>x===selected).length} 颗。确认后一起放入${CASINOS[selected-1]}。`:'选一种点数，或点击亮起的赌场桌。相同点数必须一起放。'):`掷出 ${g.roll.join('、')}，即将选择一张桌。`:`掷出剩余 ${g.players[g.turn].left} 颗骰子，再决定争哪桌奖金。`}</div>${g.roll.length?`<div class="dice-row ${busy?'rolling':''}" aria-label="本次骰子">${[...g.roll].sort((a,b)=>a-b).map(n=>`<button class="dicebutton ${selected===n?'picked':''}" data-face="${n}" ${choosing?'':'disabled'} aria-label="选择${n}点">${die(n)}</button>`).join('')}</div>`:`<div class="emptydice" aria-hidden="true">${Array.from({length:Math.min(g.players[g.turn].left,8)},()=>'<span class="emptydie"></span>').join('')}</div>`}</div><div class="actionarea"><button class="primary" data-action="${done?'summary':g.phase==='choose'?'confirm':'roll'}" ${done?'':!human()||busy||preview||(g.phase==='choose'&&!selected)?'disabled':''}>${done?'查看结算':busy?'掷骰中…':!human()?'等待对手':g.phase==='choose'?selected?`放入 ${g.roll.filter(x=>x===selected).length} 颗 →`:'先选一种点数':`掷骰子`}</button><div class="keyhint">空格掷骰 · 1–6 选点 · Enter 确认</div></div></section>
    <footer class="footer"><span>四人桌 · ${g.humans===1?'你与三位电脑对手':g.humans===4?'四人同屏轮流':'两人同屏 + 两位电脑'} · 自动保存</span><span>非官方玩法原型 · 无真实金钱交易</span></footer>
  </main>`;
}
function stopTimer(){clearTimeout(timer);generation++;}
function scheduleBot(){
  clearTimeout(timer);
  if(!game||preview||human()||modal.open||document.hidden||busy||!['ready','choose'].includes(game.phase))return;
  timer=setTimeout(()=>{if(modal.open||document.hidden)return;if(game.phase==='ready')doRoll();else{selected=botChoice(game);render();timer=setTimeout(()=>{if(modal.open||document.hidden)return;commit();},prefs.fast?130:650);}},prefs.fast?150:650);
}
function doRoll(){
  if(busy||modal.open||game.phase!=='ready')return;
  stopTimer();const gen=generation;rollDice(game);selected=0;busy=true;sound('roll');render();persist();
  timer=setTimeout(()=>{if(gen!==generation)return;busy=false;render();announce(`${game.players[game.turn].name}掷出${game.roll.join('、')}`);scheduleBot();},prefs.motion?(prefs.fast?180:520):30);
}
function commit(){
  if(!selected||game.phase!=='choose'||busy||modal.open)return;
  const actor=game.turn,face=selected;
  if(!placeDice(game,face))return;
  selected=0;persist();sound(outcome(game.tables[face-1]).ties.includes(actor)?'tie':'place');render();
  announce(game.history[0]);
  if(['settled','finished'].includes(game.phase)){timer=setTimeout(()=>showSummary(),prefs.fast?100:650);}else scheduleBot();
}
function openDialog(type,html){stopTimer();busy=false;dialogType=type;modal.innerHTML=html;if(!modal.open)modal.showModal();render();}
function closeDialog(){modal.close();dialogType='';scheduleBot();}
function welcome(){
  if(!game){game=createGame();preview=true;}render();
  openDialog('welcome',`<div class="welcome"><div class="modalmark">${die(3)}${die(5)}${die(2)}</div><div class="eyebrow">ONE MORE ROLL</div><h2>骰子之夜</h2><p>掷出好运，抢走奖金。<br>小心撞数，让旁边的人捡了漏。</p><label class="mode-label" for="mode">今晚和谁玩？</label><select id="mode"><option value="1">独自练手 · 你 + 3 位电脑</option><option value="2">两人同屏 · 2 位玩家 + 2 位电脑</option><option value="4">朋友聚会 · 4 位玩家同屏轮流</option></select><button class="primary" data-action="start">开一桌</button>${!preview?'<button class="quiet" data-action="resume">继续上次牌局</button>':''}<p style="font-size:12px;margin-bottom:0">4 轮定胜负 · 约 8–12 分钟<br>支持同一设备轮流操作，暂不支持远程联机</p></div>`);
}
function showRules(){openDialog('rules',`<div class="eyebrow">HOW TO PLAY</div><h2>一把骰子，四轮较量。</h2><div class="steps"><div class="step"><span class="stepnum">01</span><div><b>掷出手里所有骰子。</b><br>每轮每人 8 颗。选一种点数，把该点数的所有骰子放进对应桌，再轮到下一人。</div></div><div class="step"><span class="stepnum">02</span><div><b>同数量，一起出局。</b><br>大家放完才结算。同一桌，只要两人或更多人的骰子数量相同，这些人都拿不到奖金；之后还可加骰改变局面。</div></div><div class="step"><span class="stepnum">03</span><div><b>剩下的人，依次拿钞票。</b><br>骰子最多的人拿最大的一张，第二名拿下一张。四轮后总奖金最高者获胜；同额比钞票张数，再同则共享胜利。</div></div></div><div class="example">例如：金色 4 颗、橙色 4 颗、蓝色 1 颗。<br>金色和橙色出局，蓝色用 1 颗拿走最大钞票。</div><p style="font-size:12px">采用经典基础规则，不含中立骰扩展。练习版公开累计奖金，方便观察局势。玩法设计：Rüdiger Dorn；本页面为非官方独立界面原型。<a href="https://www.ravensburger.org/spielanleitungen/ecm/Spielanleitungen/26938_Vegas_EN.pdf" target="_blank" rel="noreferrer">原版规则 ↗</a></p><button class="primary" data-action="close">明白了，回到牌桌</button>`);}
function showSettings(){openDialog('settings',`<div class="eyebrow">TABLE SETTINGS</div><h2>按你的节奏来</h2><label class="settingsrow">骰子与结算音效<input type="checkbox" data-pref="sound" ${prefs.sound?'checked':''}></label><label class="settingsrow">加快电脑出手<input type="checkbox" data-pref="fast" ${prefs.fast?'checked':''}></label><label class="settingsrow">掷骰动画<input type="checkbox" data-pref="motion" ${prefs.motion?'checked':''}></label><button class="primary" data-action="close">回到牌桌</button>`);}
function showPause(){openDialog('pause',`<div class="eyebrow">TAKE YOUR TIME</div><h2>牌桌暂停了</h2><p>当前进度已保存在这台设备。回来后，可以接着这一手继续。</p><button class="primary" data-action="close">继续牌局</button><button class="quiet" data-action="restart-prompt">重新开一桌</button>`);}
function showSummary(){
  if(!['settled','finished'].includes(game.phase))return;
  const gains=[0,0,0,0];game.settlements.forEach(o=>o.awards.forEach(a=>gains[a.player]+=a.amount));
  const final=game.phase==='finished',win=final?winners(game):[];sound('win');
  openDialog('summary',`<div class="eyebrow">${final?'THE FINAL COUNT':`ROUND ${game.round} · PAYOUT`}</div><h2>${final?`${win.map(i=>esc(game.players[i].name)).join('、')}${win.length>1?'并列获胜':'赢下牌局'}`:`第 ${game.round} 轮结算`}</h2><p>${final?'四轮结束。奖金相同按钞票张数排名。':'撞数的玩家先出局，剩下的人按骰子数量分奖金。'}</p><div class="resultrows">${game.players.map((p,i)=>({p,i})).sort((a,b)=>final?b.p.cash-a.p.cash||b.p.notes-a.p.notes:gains[b.i]-gains[a.i]).map(({p,i})=>`<div class="resultrow"><span style="color:${COLORS[i]}">${win.includes(i)?'✦ ':''}${esc(p.name)}${final?` <small>· ${p.notes} 张钞票</small>`:''}</span><strong>${final?money(p.cash):'+'+money(gains[i])}</strong></div>`).join('')}</div><div class="summarytable">${game.tables.map((t,i)=>{const o=game.settlements[i];return `<div class="summaryline"><b>${i+1} · ${t.name}</b>${o.awards.length?o.awards.map(a=>`${esc(game.players[a.player].name)} +${money(a.amount)}`).join(' / '):'无人获得奖金'}${o.ties.length?`<small>撞数出局：${o.ties.map(j=>esc(game.players[j].name)).join('、')}</small>`:''}</div>`}).join('')}</div><button class="primary" data-action="${final?'again':'next'}">${final?'再来一局':`进入第 ${game.round+1} 轮`}</button><button class="quiet" data-action="close">查看牌桌</button>`);
}
app.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;
  if(b.dataset.face){if(!canAct()||game.phase!=='choose')return;selected=Number(b.dataset.face);render();return;}
  const a=b.dataset.action;
  if(a==='rules')showRules();if(a==='settings')showSettings();if(a==='pause')showPause();if(a==='summary')showSummary();
  if(a==='roll'&&canAct())doRoll();if(a==='confirm'&&canAct())commit();
});
modal.addEventListener('click',e=>{
  const a=e.target.closest('button')?.dataset.action;if(!a)return;
  if(a==='start'){const humans=Number($('#mode').value);preview=false;game=createGame(humans);selected=0;closeDialog();persist();render();showRules();}
  if(a==='resume'){preview=false;closeDialog();render();}
  if(a==='close'){if(preview){welcome();return;}closeDialog();render();}
  if(a==='next'){nextRound(game);selected=0;closeDialog();persist();render();scheduleBot();}
  if(a==='again'){closeDialog();welcome();}
  if(a==='restart-prompt')openDialog('restart',`<h2>重新开一桌？</h2><p>开始新牌局会替换当前进度。</p><button class="primary" data-action="again">选择新牌局</button><button class="quiet" data-action="close">继续当前牌局</button>`);
});
modal.addEventListener('change',e=>{const k=e.target.dataset.pref;if(k){prefs[k]=e.target.checked;write(PREF,prefs);render();}});
modal.addEventListener('cancel',e=>{e.preventDefault();if(dialogType==='welcome')return;closeDialog();render();});
document.addEventListener('keydown',e=>{
  if(modal.open||e.repeat)return;
  if(e.key==='Escape'){showPause();return;}
  if(!canAct())return;
  if(e.code==='Space'&&game.phase==='ready'){e.preventDefault();doRoll();}
  if(/^[1-6]$/.test(e.key)&&game.phase==='choose'&&game.roll.includes(Number(e.key))){selected=Number(e.key);render();}
  if(e.key==='Enter'&&game.phase==='choose'&&selected){e.preventDefault();commit();}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){stopTimer();busy=false;persist();if(!modal.open&&!preview)showPause();}});
window.addEventListener('pagehide',persist);
welcome();
if(document.modelContext?.registerTool){
  const life=new AbortController();
  try{Promise.resolve(document.modelContext.registerTool({name:'read_vegas_table',description:'Read the visible dice game, current player, rolled dice and table counts. Does not reveal the undealt banknote deck.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(input){if(input&&Object.keys(input).length)throw Error('No arguments accepted');return {round:game.round,phase:game.phase,turn:game.turn,players:game.players,roll:game.roll,tables:game.tables,paused:modal.open};}},{signal:life.signal})).catch(()=>{});}catch{}
  window.addEventListener('pagehide',()=>life.abort(),{once:true});
}
