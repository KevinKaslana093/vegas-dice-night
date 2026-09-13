import {ROYAL_MODULES,ROYAL_IDS,ROYAL_SOURCE,royalActor,royalOptions,royalAction,royalBotAction,royalStatus} from './royale.mjs';
import {BALANCED_SKILLS,tradeGroups,resolveBalanced,balancedBot} from './balance.mjs';
import {roleOf,isHuman,canSkill,useSkill,isBigRoll} from './core.mjs';

export function createRoyalUI({getGame,open,persist,render,resume,die,esc,skillEvent,practice,exitPractice,seen,pause}){
 let privateKey='',skillActorV2=0;
 const buttons=options=>`<div class="royal-options">${options.map(c=>`<button data-royal-option="${c.id}">${esc(c.label)}</button>`).join('')}</div>`;
 function encyclopedia(){const allSeen=seen();open('royal-book',`<button class="royal-book-back quiet" data-royal-close>← 返回</button><div class="eyebrow">ROYAL COLLECTION · 16 MODULES</div><h2>皇家赌场图鉴 <small>${allSeen.length}/16 已见</small></h2><p>每轮优先抽取未见效果。A–H各是一块双面板，同一块板的两面不会同时出现。点“练这一桌”即可进入独立的一轮练习。</p><div class="royal-book-grid">${ROYAL_MODULES.map(m=>`<article class="royal-card ${allSeen.includes(m.id)?'seen':''}"><small>${m.code} / ${m.english} · ${allSeen.includes(m.id)?'已见':'待发现'}</small><h3>${m.name}</h3><p>${m.text}</p><button class="primary" data-royal-practice="${m.id}">练这一桌 →</button></article>`).join('')}</div><details><summary>与实体皇家版的差异</summary><p>本作保留4轮、七人技能与数字筹码；实体皇家版标准局为3轮。本作封条奖励轨道采用说明中列出的网页循环。仅掷出封闭赌场点数时免费等待；连锁激活不能再次选择本次连锁已访问的模块。练习首掷保证含1点，其他骰子照常随机。</p><p>封闭赌场禁止包括技能在内的骰子增减。酒吧、边池与奖励格属于模块暂存区，其他技能不能针对其中的骰子。结算顺序：最后技能 → 黄金时段补骰 → 厄运税 → 黑箱和模块奖金 → 六桌派彩。剩余筹码每枚按1万计入最终总额。</p><a href="${ROYAL_SOURCE}" target="_blank" rel="noreferrer">查看出版方英文规则书</a></details><button class="primary" data-royal-close>回到游戏</button>`);}
 function handoff(actor,key){const g=getGame();if(!isHuman(g,actor)||g.humans===1||privateKey===key)return false;open('royal-handoff',`<div class="eyebrow">PRIVATE DECISION</div><h2>请交给${esc(g.players[actor].name)}</h2><p>接下来有一项私人选择。其他玩家请暂时移开视线，确认后才会展示内容。</p><button class="primary" data-royal-private="${key}">我是${esc(g.players[actor].name)}，开始选择</button><button class="quiet" data-royal-pause>暂停</button>`);return true;}
 function pending(){const g=getGame();if(g.skillPending)return pendingSkill();const q=g.royale?.pending;if(!q)return false;const actor=royalActor(g),human=isHuman(g,actor),key=[g.random?.seed,g.round,g.royale.sequence,q.stage,actor].join('-');if(handoff(actor,key))return true;
  const m=ROYAL_MODULES.find(m=>m.id===g.tables[q.face-1].effect),options=royalOptions(g),secret=q.kind==='blackpay'&&q.stage==='split'||q.kind==='lucky'&&q.stage==='hide';
  let content='';if(q.dice)content=`<div class="royal-black-dice">${q.dice.map(die).join('')}<b>总和 ${q.dice[0]+q.dice[1]}</b></div>`;
  if(q.kind==='fifty')content+=`<div class="royal-track">${[0,3,4,5,6].map((v,i)=>`<span class="${q.wins===i?'current':''}">${v}万</span>`).join('')}</div>`;
  if(q.kind==='noentry')content+=`<div class="royal-track">${['起点','空','1筹码','空','3万','空'].map((v,i)=>`<span class="${g.tables[q.face-1].royal.progress===i?'current':''}">${v}</span>`).join('')}</div>`;
  if(q.kind==='blackpay'&&q.stage==='pick')content+='<div class="royal-boxes" aria-hidden="true">▰ ? <span>OR</span> ? ▰</div>';
  if(q.message)content+=`<p class="royal-result" role="status">${esc(q.message)}</p>`;
  open('royal-play',`<div class="eyebrow">${m?.code??'ROYAL'} · CASINO ${q.face}</div><h2>${q.kind==='powerturn'?'控制标记 · 定点出击':m?.name??'皇家派彩'}</h2><p>${esc(g.players[actor].name)} · ${human?'由你决定':'正在决定'}</p><p class="royal-help">${m?.text??''}</p>${content}${human?buttons(options):`<p class="royal-wait">${secret?'对手正在做秘密选择…':'等待电脑完成这一步…'}</p>`}<p class="fineprint">${esc(royalStatus(g,g.tables[q.face-1]))}</p><button class="quiet" data-royal-pause>暂停 / 稍后继续</button>${g.practice?'<button class="quiet" data-action="exit-practice">结束练习</button>':''}`);
  if(!human)setTimeout(()=>{if(getGame()===g&&g.royale.pending===q&&document.querySelector('#modal')?.className==='royal-play'&&!document.hidden){royalAction(g,royalBotAction(g));persist();render();pendingOrResume();}},q.stage==='done'?1000:750);
  return true;
 }
 function pendingOrResume(){const g=getGame();if(g.skillPending||g.royale?.pending)pending();else resume();}
 function showSkill(actor){const g=getGame(),r=roleOf(g,actor);skillActorV2=actor;const skill=BALANCED_SKILLS[r],allowed=isHuman(g,actor)&&canSkill(g,actor);let html='';
  if(allowed&&r===2){const choices=tradeGroups(g,actor);html=`<label>选择交易组合<select id="v2-trade">${choices.map((c,i)=>`<option value="${i}">${c.face}号桌 · ${g.players[c.target].name} · ${c.small}小＋${c.large}大（计数${c.small+c.large*2}）</option>`).join('')}</select></label><p>你交出1颗普通骰及全部${g.players[actor].chips}枚筹码。对方获得这些骰子与筹码。</p>`;}
  if(allowed&&r===3)html=`<label>选择交换对象<select id="v2-target">${g.players.map((p,i)=>i!==actor&&p.wallet.length?`<option value="${i}">${esc(p.name)} · ${p.wallet.length}张钞票</option>`:'').join('')}</select></label><p>下一步随机展示最多两张；再决定拿哪张、交出自己哪张。抽取后不能取消重抽。</p>`;
  if(allowed&&r===4)html=`<p>勾选1–2颗，再分别指定点数。</p><div class="v2-dice-list">${g.roll.map((v,i)=>`<label><input type="checkbox" name="v2-die" value="${i}">${die(v)}<span>${isBigRoll(g,i)?'大骰 ×2':'普通骰'} ${i+1}</span><select data-v2-value="${i}">${Array.from({length:6},(_,n)=>`<option value="${n+1}" ${v===n+1?'selected':''}>${n+1}点</option>`).join('')}</select></label>`).join('')}</div>`;
  if(allowed&&r===5)html=`<p>选择要重掷的骰子，下一步逐颗比较新旧点数。</p><div class="v2-dice-list">${g.roll.map((v,i)=>`<label><input type="checkbox" name="v2-die" value="${i}">${die(v)}<span>${isBigRoll(g,i)?'大骰 ×2':'普通骰'} ${i+1}</span></label>`).join('')}</div>`;
  if(allowed&&r===6)html=`<div class="v2-form"><label>整组原点数<select id="v2-from">${[...new Set(g.roll)].map(v=>`<option value="${g.roll.indexOf(v)}">${v}点 · ${g.roll.filter(n=>n===v).length}颗</option>`).join('')}</select></label><label>改为<select id="v2-value">${[1,2,3,4,5,6].map(v=>`<option>${v}</option>`).join('')}</select></label><label>弃置代价<select id="v2-discard">${g.roll.map((v,i)=>`<option value="${i}">第${i+1}颗 · 原${v}点 · ${isBigRoll(g,i)?'大骰 ×2':'普通骰'}</option>`).join('')}</select></label></div>`;
  open('skill-v2',`<div class="eyebrow">SKILL REBALANCE · ${esc(g.players[actor].name)}</div><h2>${skill.name}</h2><p>${skill.text}</p>${allowed?html+'<p id="v2-error" role="alert"></p><button class="primary" data-v2-confirm>确认发动 →</button>':`<p>${g.players[actor].used?'本轮已经使用，下轮恢复。':r===0?'被动已经计入每轮骰子。':'当前条件不满足。请先准备技能所需的骰子、筹码或钞票。'}</p>`}<button class="quiet" data-royal-close>返回牌桌</button>`);
 }
 function pendingSkill(){const g=getGame(),q=g.skillPending,actor=q.actor,human=isHuman(g,actor);if(handoff(actor,['skill',g.random?.seed,g.round,actor,q.kind].join('-')))return true;let html='';
  if(human&&q.kind==='exchange')html=`<div class="v2-form"><label>拿走对手哪张<select id="v2-take">${q.candidates.map((v,i)=>`<option value="${i}">${v/10000}万</option>`).join('')}</select></label><label>交出自己哪张<select id="v2-give">${q.offered.map((v,i)=>`<option value="${i}">${v/10000}万</option>`).join('')}</select></label></div>`;
  if(human&&q.kind==='reroll')html=`<div class="v2-dice-list">${q.indices.map((index,j)=>`<label><span>第${index+1}颗${isBigRoll(g,index)?' · 大骰':''}</span><select data-v2-keep="${j}"><option value="old">保留原点数 ${q.old[j]}</option><option value="new">采用新点数 ${q.fresh[j]}</option></select></label>`).join('')}</div>`;
  open('skill-v2-pending',`<div class="eyebrow">${esc(g.players[actor].name)}</div><h2>${BALANCED_SKILLS[roleOf(g,actor)].name} · 选择结果</h2><p>本次随机结果已保存，请完成选择。</p>${html}${human?'<button class="primary" data-v2-resolve>确认结果 →</button>':'<p>对手正在选择…</p>'}<button class="quiet" data-royal-pause>暂停</button>`);
  if(!human)setTimeout(()=>{if(getGame()===g&&g.skillPending===q&&document.querySelector('#modal')?.className==='skill-v2-pending'&&!document.hidden){finishPending(balancedBot(g,actor));}},750);return true;
 }
 function finishPending(c){const g=getGame(),q=g.skillPending,event=q.event??{actor:q.actor,role:roleOf(g,q.actor),target:q.target??q.actor,human:isHuman(g,q.actor),ownBefore:g.players[q.actor].cash,cash:g.players[q.actor].cash};if(!resolveBalanced(g,c))return;event.label=g.history[0];event.amount=g.players[event.actor].cash-event.cash;persist();skillEvent(event);}
 function click(e){const b=e.target.closest('button');if(!b)return false;const g=getGame();
  if(b.hasAttribute('data-royal-private')){privateKey=b.dataset.royalPrivate;pending();}
  else if(b.hasAttribute('data-royal-pause'))pause();
  else if(b.hasAttribute('data-royal-close'))resume();
  else if(b.hasAttribute('data-royal-practice'))practice(b.dataset.royalPractice);
  else if(b.hasAttribute('data-royal-option')){if(!isHuman(g,royalActor(g)))return true;if(royalAction(g,b.dataset.royalOption)){persist();render();pendingOrResume();}}
  else if(b.hasAttribute('data-v2-confirm')){const actor=skillActorV2,r=roleOf(g,actor),number=id=>Number(document.getElementById(id).value),indices=[...document.querySelectorAll('input[name="v2-die"]:checked')].map(x=>Number(x.value));let c={target:actor};
   if(r===2)c=tradeGroups(g,actor)[number('v2-trade')];if(r===3)c={target:number('v2-target')};if(r===4)c={target:actor,changes:indices.map(index=>({index,value:Number(document.querySelector(`[data-v2-value="${index}"]`).value)}))};if(r===5)c={target:actor,indices};if(r===6)c={target:actor,index:number('v2-from'),value:number('v2-value'),discard:number('v2-discard')};
   const event={actor,role:r,target:c?.target??actor,face:c?.face,human:true,ownBefore:g.players[actor].cash,cash:g.players[actor].cash};if(!useSkill(g,actor,c)){document.getElementById('v2-error').textContent='请检查选择：荷官最多改两颗，改点必须与原点数不同。';return true;}if(g.skillPending){g.skillPending.event=event;persist();pending();}else{event.label=g.history[0];persist();skillEvent(event);}
  }else if(b.hasAttribute('data-v2-resolve')){const q=g.skillPending;if(!q||!isHuman(g,q.actor))return true;finishPending(q.kind==='exchange'?{take:Number(document.getElementById('v2-take').value),give:Number(document.getElementById('v2-give').value)}:{keepNew:[...document.querySelectorAll('[data-v2-keep]')].map(s=>s.value==='new')});}
  else if(b.dataset.action==='royal-book')encyclopedia();
  else if(b.dataset.action==='exit-practice')exitPractice();
  else return false;return true;
 }
 return {pending,showSkill,encyclopedia,click};
}
