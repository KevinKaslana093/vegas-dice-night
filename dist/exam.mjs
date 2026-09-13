import {createGame,rollDice,placeDice,skipTurn,canSkip,useSkill,canSkill,outcome,previewTable,banknoteOwners,validSave,NAMES,COLORS,EFFECTS,bigCount,tableWeight} from './core.mjs';
import {CINEMA_ASSETS} from './cinema.mjs';
import {createClaimFeedback,claimMarkup} from './claims.mjs';
import {betPreviewMarkup,endgameMarkup} from './decisions.mjs';

export function createExam(){
 let seed=1;const g=createGame(1,()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296),{hero:1,skills:true,rules:'classic',bigDice:true});
 const counts=[[9,0,0,0],[0,0,0,0],[0,4,0,0],[0,0,5,0],[0,0,0,7],[0,2,3,1]];
 g.tables.forEach((t,j)=>{t.counts=counts[j];t.first=t.counts.map((n,i)=>n?i+1:0);t.last=[...t.first];});
 g.players.forEach((p,i)=>{p.left=p.supply-g.tables.reduce((n,t)=>n+t.counts[i],0);p.used=i>1;});
 g.players.forEach(p=>p.bigLeft=0);[[0,0],[2,1],[3,2],[4,3]].forEach(([j,i])=>g.tables[j].big[i]=1);g.move=6;g.turn=1;g.roll=[6,2];g.phase='choose';g.history=['毕业挑战 · 固定残局：牛仔还有2颗骰子，其他玩家已完成下注并用过主动技能。'];
 return {v:1,g,selected:0,rolls:0,hints:0,last:'intro'};
}
export function examResult(s){if(!['settled','finished'].includes(s.g.phase))return 'playing';return s.g.settlements[5].awards.some(a=>a.player===1&&a.amount===s.g.tables[5].notes[0])?'won':'lost';}
export function validExam(s){return !!s&&s.v===1&&validSave(s.g)&&s.g.hero===1&&s.g.humans===1&&s.g.skills&&s.g.rules==='classic'&&s.g.round===1&&s.g.players.every((p,i)=>i===1||p.left===0)&&['choose','ready','settled'].includes(s.g.phase)&&Number.isInteger(s.rolls)&&s.rolls>=0&&s.rolls<30&&Number.isInteger(s.hints)&&s.hints>=0&&s.hints<=3&&Number.isInteger(s.selected)&&s.selected>=0&&s.selected<=6&&(!s.selected||s.g.roll.includes(s.selected))&&['intro','select','roll','invest','skip','skill','hint'].includes(s.last);}
export function examAction(s,a){
 if(examResult(s)!=='playing')return false;const g=s.g;let ok=false;
 if(a.type==='select'&&g.phase==='choose'&&g.roll.includes(a.face)){s.selected=a.face;ok=true;}
 if(a.type==='roll'&&g.phase==='ready'){const sequence=[[6,6],[2,6],[6,2]][s.rolls%3];let i=0;ok=rollDice(g,()=>((sequence[i++%sequence.length]||6)-.5)/6);if(ok)s.rolls++;}
 if(a.type==='invest'&&s.selected)ok=placeDice(g,s.selected);
 if(a.type==='skip')ok=skipTurn(g);
 if(a.type==='skill')ok=useSkill(g,1,a.choice);
 if(a.type==='hint'){s.hints=Math.min(3,s.hints+1);ok=true;}
 if(ok){s.last=a.type;if(!['select','hint'].includes(a.type))s.selected=0;}return ok;
}
export function examAdvice(s){
 const g=s.g,t=g.tables[5],o=outcome(t),result=examResult(s),short=['丹宁','你','老板','月兔'];
 if(result==='won')return '8万大钞已经真正入袋了。漂亮，牛仔！你自己决定了投注和技能的顺序。这道残局还有别的赢法，也可以直接去正式牌桌。';
 if(result==='lost')return o.ties.includes(1)?`你和${o.ties.filter(i=>i!==1).map(i=>short[i]).join('、')}撞数了，所以失去领奖资格。骰子多不一定能拿钱；重试时想想，怎样在最后一次下注前拆开平局。`:`你在6号有${t.counts[1]}颗，老板有${t.counts[2]}颗。大钞没有归你。这关看的是6号大钞，其他桌赚到的钱不计入挑战目标。可以重试，或让我给一点提示。`;
 if(s.last==='hint')return ['','先盯住6号桌：相同数量会一起出局。目标是让你在剩下的玩家里独自领先。','不用一手结束。没投入的骰子可以等下次再掷；狙击也能改变你与老板的数量关系。','参考初始局面的一种打法：先押6，再掷剩余骰子继续争6号。另一种是先狙掉老板在6号的一颗，再用6点超过他。顺序由你决定。'][s.hints];
 if(s.last==='intro')return '最后一桌，交给你了。目标是6号的8万大钞：桌上你2颗、老板3颗、月兔1颗。大骰已留在其他桌。你手中还有两颗普通骰、一次狙击和两枚筹码；其他人已经完成下注并用过技能。练习骰子固定，打法由你选择。';
 if(s.last==='select')return '先看下注预览：谁会撞数，哪张钱会换主人？确认后才会投入。你也可以改选骰子、使用技能或花筹码重投。';
 if(s.last==='skip')return '这一枚筹码已经扣掉。因为只剩你还有骰子，现在立刻又轮到你；点击掷骰，看看新结果。';
 if(s.last==='roll')return '新一掷已经落定。把它和桌上的数量一起考虑；所有同点数骰子必须一起投入。';
 if(s.last==='skill')return `狙击已生效。6号现在是：你${t.counts[1]}颗、老板${t.counts[2]}颗、月兔${t.counts[3]}颗。技能本轮已用过，接下来靠剩余骰子决定结果。`;
 const lead=o.awards.find(a=>a.amount===t.notes[0]);return `这手已经落桌。现在${lead?short[lead.player]+'暂领大钞':'大钞暂时无人领取'}，你还有${g.players[1].left}颗骰子。钱还没发，局面仍能改变。`;
}

export function createFinalExam({cinema,die,prefs,onExit}){
 const key='vegas-night-final-exam-v1',feedback=createClaimFeedback({prefs,hero:()=>1});let state,root,busy=false,skillOpen=false,shot=null;
 const fmt=n=>`${n/10000}万`,save=()=>{try{localStorage.setItem(key,JSON.stringify(state));}catch{}};
 const who=i=>i===null?'待分配':['丹宁','你','老板','月兔'][i];
 function button(action,label,enabled=true,primary=false){return `<button data-exam="${action}" class="${primary?'primary':'quiet'}" ${enabled?'':'disabled'}>${label}</button>`;}
 function board(){const g=state.g;return `<section class="lesson-board exam-board" aria-label="毕业挑战赌场"><div class="lesson-orbit"></div><div class="lesson-center"><span>FINAL CHALLENGE</span><b>抢下6号大钞</b><small>固定残局 · 多种解法</small></div>${g.tables.map(t=>{const shown=state.selected===t.face?previewTable(g,t.face):t,o=outcome(shown),owners=banknoteOwners(shown,o);return `<article class="lesson-table lt-${t.face} ${t.face===6?'lesson-focus':''}"><header><b>${t.face}</b><span>${t.name}<small>总额 ${fmt(t.notes[0]+t.notes[1])}</small></span></header><div class="lesson-notes">${t.notes.map((n,j)=>`<span data-note="${j}">${fmt(n)}<small style="color:${owners[j]===null?'#a99db6':COLORS[owners[j]]}">${who(owners[j])}${owners[j]===null?'':examResult(state)==='playing'?'暂领':'获得'}</small></span>`).join('')}</div><div class="lesson-counts">${shown.counts.map((n,i)=>`<span data-player="${i}" style="color:${COLORS[i]}" class="${o.ties.includes(i)?'lesson-tied':''}">${['◆','●','■','▲'][i]} ${n?tableWeight(shown,i):'–'}${bigCount(shown,i)?' ◈':''}</span>`).join('')}</div><footer>${state.selected===t.face?'下注预览 · ':''}${EFFECTS[t.effect].name}</footer></article>`;}).join('')}</section>`;}
 function skillChoices(){const g=state.g;return `<section class="exam-skill"><h3>正义执行 · 选择要狙掉的一颗</h3><p>可以选择任何玩家的实体骰子，确认后才发动。</p>${g.players.map((p,i)=>{let options=[];if(p.left){if(g.phase==='choose'&&g.turn===i)g.roll.forEach((v,k)=>options.push({id:`roll:${i}:${k}`,label:`刚掷出的 ${v} 点`}));else options.push({id:`hand:${i}:0`,label:'手中未掷的骰子'});}g.tables.forEach(t=>{if(t.counts[i]>bigCount(t,i))options.push({id:`table:${i}:${t.face}`,label:`${t.face}号桌 · 普通骰（计数−1）`});if(bigCount(t,i))options.push({id:`table:${i}:${t.face}:big`,label:`${t.face}号桌 · 大骰（计数−2）`});});return options.length?`<div class="exam-shot-group"><b style="color:${COLORS[i]}">${who(i)}</b>${options.map(o=>`<button data-shot="${o.id}" aria-pressed="${shot===o.id}">${o.label}</button>`).join('')}</div>`:'';}).join('')}<div class="exam-buttons">${button('fire','确认狙击',!!shot,true)}${button('skill-close','返回，暂不发动')}</div></section>`;}
 function controls(){const g=state.g,result=examResult(state);if(result!=='playing')return `<section class="exam-result"><small>${result==='won'?'CHALLENGE COMPLETE':'TRY ANOTHER MOVE'}</small><h2>${result==='won'?'毕业了，牛仔。':'这一局，差一点。'}</h2><p>6号大钞：<b>${who(banknoteOwners(g.tables[5])[0])}</b> · 你本轮实际收入 ${fmt(g.players[1].cash)}</p><div class="exam-buttons">${result==='won'?button('finish','毕业 · 去选角色',true,true):button('retry','再试一次',true,true)}${result==='won'?button('retry','再换个打法'):button('review','复盘一下')}</div></section>`;
 if(skillOpen)return skillChoices();
 return `<div class="lesson-action-title">你的回合 · 筹码牛仔<small>${g.players[1].left}颗骰子 · ${g.players[1].chips}枚筹码</small></div><div class="dice-row">${g.roll.length?g.roll.map(n=>`<button class="dicebutton ${state.selected===n?'picked':''}" data-exam-face="${n}" aria-label="选择${n}点">${die(n)}</button>`).join(''):Array.from({length:g.players[1].left},()=>'<span class="emptydie">·</span>').join('')}</div>${betPreviewMarkup(g,state.selected)}<div class="exam-buttons">${button('roll','掷骰子',g.phase==='ready',g.phase==='ready')}${button('invest',state.selected?`放入${g.roll.filter(n=>n===state.selected).length}颗 → ${state.selected}号`:'先选一种点数',!!state.selected,true)}${button('skip','支付1筹码 · 跳过',canSkip(g))}${button('skill',g.players[1].used?'正义执行 · 已用':'发动 · 正义执行',canSkill(g,1))}</div>`;
 }
 function render(scroll=false){const g=state.g,result=examResult(state),oldScroll=root?.querySelector('.lesson-scroll')?.scrollTop||0;
 root.innerHTML=`<div class="lesson-header"><div><span>GRADUATION / FREE PLAY</span><h1>最后一桌，你来赢</h1></div>${button('exit','退出挑战')}</div><div class="exam-goal"><b>目标：结算时拿到6号的8万大钞</b><span>${result==='won'?'✓ 已拿到':result==='lost'?'本次未完成':'进行中 · 非指定解法'}</span></div><div class="lesson-scroll"><div class="exam-stage">${endgameMarkup(g)}${board()}<section class="lesson-controls exam-controls">${controls()}</section><div class="lesson-claims">${claimMarkup(g.lastEvent,1,{settled:result!=='playing',compact:true})}</div></div></div><section class="lesson-coach exam-coach"><div class="lesson-portrait"><img src="${CINEMA_ASSETS.portraits[3]}" alt="月兔小姐"><span>你的领桌人</span></div><div class="lesson-dialogue"><div class="lesson-speaker">月兔小姐 <small>${result==='playing'?'YOUR CALL':'DEBRIEF'}</small></div><p aria-live="polite">${examAdvice(state)}</p><div class="lesson-reply">${result==='playing'?button('hint',state.hints?'再给一点提示':'给我一点提示'):button(result==='won'?'finish':'retry',result==='won'?'去正式牌桌':'重开这个残局',true,true)}</div></div></section>`;
 root.dataset.result=result;const scroller=root.querySelector('.lesson-scroll');scroller.scrollTop=oldScroll;
 if(scroll)requestAnimationFrame(()=>{if(!root)return;const target=root.querySelector('.exam-controls');scroller.scrollTop+=target.getBoundingClientRect().top-scroller.getBoundingClientRect().top-12;});
 }
 function close(){feedback.clear();save();root.remove();root=null;document.body.classList.remove('learning');onExit();}
 function act(a){if(busy||cinema.active)return;const g=state.g,previous=g.lastEvent,choice=a.choice,event=a.type==='skill'?{actor:1,target:choice.target,face:choice.face,zone:choice.zone,value:choice.zone==='roll'?g.roll[choice.index]:choice.face,big:choice.big,before:choice.zone==='table'?tableWeight(g.tables[choice.face-1],choice.target):g.players[choice.target].left,human:true}:null;
 if(!examAction(state,a))return;save();skillOpen=false;shot=null;
 const done=()=>{busy=false;if(!root)return;render(true);if(g.lastEvent!==previous)feedback.play(g.lastEvent,{root,settled:examResult(state)!=='playing'});};
 if(a.type==='roll'||a.type==='skill'){busy=true;if(event){event.after=event.before-(event.big&&event.zone==='table'?2:1);event.label=g.history[0];Object.assign(event,{role:1,name:NAMES[1],skillName:'正义执行',targetName:NAMES[event.target]});}cinema.play(a.type==='roll'?'roll':'skill',event||{actor:1,role:1,name:NAMES[1],values:[...g.roll],bigIndex:g.players[1].bigLeft?0:-1},done);}else done();
 }
 function click(e){const b=e.target.closest('button');if(!b||b.disabled||busy||cinema.active)return;if(b.dataset.examFace){act({type:'select',face:Number(b.dataset.examFace)});return;}if(b.dataset.shot){shot=b.dataset.shot;render(true);return;}const a=b.dataset.exam;
 if(a==='exit'||a==='finish'){close();return;}if(a==='retry'){feedback.clear();state=createExam();skillOpen=false;shot=null;save();render(true);return;}
 if(a==='review'){root.querySelector('.lesson-scroll').scrollTop=0;return;}
 if(a==='skill'){skillOpen=true;render(true);return;}if(a==='skill-close'){skillOpen=false;shot=null;render(true);return;}
 if(a==='fire'&&shot){const [zone,target,index,kind]=shot.split(':');act({type:'skill',choice:{zone,big:kind==='big',target:Number(target),face:zone==='table'?Number(index):undefined,index:zone==='roll'?Number(index):undefined}});return;}
 if(['roll','invest','skip','hint'].includes(a))act({type:a});
 }
 return {get active(){return !!root;},open(){if(root)return;let saved;try{saved=JSON.parse(localStorage.getItem(key));}catch{}state=validExam(saved)?saved:createExam();skillOpen=false;shot=null;root=document.createElement('section');root.className='lesson-root exam-root';root.setAttribute('aria-label','自由毕业挑战');document.body.append(root);document.body.classList.add('learning');root.addEventListener('click',click);root.addEventListener('keydown',e=>{if(busy||cinema.active)return;if(e.key==='Escape'){e.preventDefault();close();return;}if(/^[1-6]$/.test(e.key)&&!skillOpen){e.preventDefault();act({type:'select',face:Number(e.key)});}if(e.target.closest('button'))return;if(e.code==='Space'&&state.g.phase==='ready'){e.preventDefault();act({type:'roll'});}if(e.key==='Enter'&&state.selected&&!skillOpen){e.preventDefault();act({type:'invest'});}});render(true);root.querySelector('[data-exam="exit"]').focus({preventScroll:true});}};
}
