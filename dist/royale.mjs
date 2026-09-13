import {gameRandom,advance,settle,log,syncMoney,outcome,tableWeight,feedback} from './core.mjs';

export const ROYAL_MODULES=[
 ['lucky','A1','幸运出拳','Lucky Punch','暗藏1–3枚筹码，让下家猜。猜中无奖；猜错，藏1/2/3枚分别赢2枚筹码/3万/4万。'],
 ['royaljackpot','A2','累积大奖','Jackpot','每次入桌掷两颗黑骰；总和7或对子赢奖池。初始3万，未中加1万，上限8万；中奖后重置。'],
 ['prime','B1','黄金时段','Prime Time','派彩前，本桌第一名掷两颗黑骰，可把其中0–2颗放入对应赌场，作为自己的普通骰参与派彩。不再触发入桌效果。'],
 ['fifty','B2','五五开','Fifty Fifty','掷两颗黑骰后猜下一次总和更高或更低；相同也算输。可随时收手。连续猜中奖励依次3、4、5、6万；失手全无。'],
 ['five','C1','击掌大奖','High Five','本桌第一位达到计数5的玩家拿走唯一大奖标记，轮末额外获得10万。大骰计数2，拿到后不被夺走。'],
 ['badluck','C2','厄运税','Bad Luck','派彩前，本桌计数最少的所有玩家各交5万，包括0颗骰子的玩家，不先剔除平手。钱不够则交出所有钱和筹码，每枚筹码抵1万。'],
 ['payday','D1','发薪日','Pay Day','每次入桌按自己已占据的赌场数领奖，包含本桌。1–2座：1–2枚筹码；3–6座：3–6万。模块暂存区不算赌场。'],
 ['power','D2','强势出击','Power Play','入桌后若独占最多计数，获得控制标记。此后轮到你时可代替掷骰，把手中1颗骰子设为任意点数并入桌、触发效果。没有唯一领先者时标记归还。'],
 ['noentry','E1','禁止入内','No Entry!','每次入桌可封闭另一赌场，禁止放入或移走骰子，技能也不例外。移动封条才前进奖励轨道；保留封条不领奖。网页轨道循环：空、1筹码、空、3万、空、起点。'],
 ['knockout','E2','暂歇酒吧','Knockout','每次入桌，其他玩家各选1颗手中骰子送进酒吧（每人最多2颗，大骰算1颗）；你取回自己的所有酒吧骰。酒吧骰不参与派彩。'],
 ['block','F1','中立拦截','Block It','从剩余的1、1、2、2、3颗中立骰组中选择一组，放入任意未封闭赌场。中立骰作为第五位玩家参与撞数和排名，所得奖金回银行。'],
 ['handicap','F2','让分交易','Handicap','开局1–3桌各放1颗中立骰，4–6桌各放2颗。入桌可取走任一未封闭桌的1颗中立骰，放进空奖励格：2格各1筹码、3格各3万、4格可免费放1颗手骰或取回1颗桌骰。'],
 ['blackbox','G1','神秘黑箱','Black Box','派彩时本桌第一名的下家，把6枚奖励暗分成两堆，第一名选一堆。奖励为6万、2万、2万、0、0、0；选中总额2万时领取2枚筹码。'],
 ['double','G2','双倍下注','Double Down','每次入桌可把本桌自己的任意数量骰子移进专属边池。边池按经典撞数规则派彩：第一名6万，第二名3万。边池骰不受其他技能或效果影响。'],
 ['nice','H1','好骰好运','Nice Dice','每次入桌可将1颗刚放入或本次掷出后仍留在手中的骰子，移入对应点数格。旧骰被挤回对应赌场且不触发效果。轮末1/2格奖1/2筹码，3–6格奖3–6万。'],
 ['choice','H2','由我决定','My Choice','入桌掷两颗黑骰，选一个点数效果：1/2筹码，3万，4激活另一模块，5免费放手骰或取回桌骰，6把手骰存入独占金格赢6万（挤回原骰）。']
].map(([id,code,name,english,text])=>({id,code,name,english,text,short:code+' · '+name}));
export const ROYAL_IDS=ROYAL_MODULES.map(m=>m.id);
export const ROYAL_SOURCE='https://www.ravensburger.org/spielanleitungen/ecm/Spielanleitungen/26918%20%20anl%202362054.pdf?ossl=pds_text_Spielanleitung';
export function royalDeck(random){const a=[11,11,13,15,13,11,9,7].flatMap((n,i)=>Array(n).fill((i+3)*10000));for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function setupRoyal(g,random){
 const seen=g.royale?.seen??g.royalSeen??[],bank=g.royale?.bank??g.deck.splice(12*((g.roundLimit||4)-g.round)).reduce((a,b)=>a+b,0);
 g.royale={seen:[...seen],bank,held:[],pending:null,closed:0,extra:0,payoutStarted:false,payoutDone:false,queue:[],sequence:0};
 const n=g.rules==='classic'?0:g.practice?1:g.rules==='all'?6:3,chosen=[],boards=new Set();
 if(n&&ROYAL_IDS.includes(g.practice)){chosen.push(g.practice);boards.add(ROYAL_MODULES.find(m=>m.id===g.practice).code[0]);}
 const pool=ROYAL_MODULES.map(m=>({...m,tie:random(),unseen:!seen.includes(m.id)})).sort((a,b)=>Number(b.unseen)-Number(a.unseen)||a.tie-b.tie);
 for(const m of pool)if(chosen.length<n&&!boards.has(m.code[0])){chosen.push(m.id);boards.add(m.code[0]);}
 g.tables.forEach((t,i)=>{t.effect=chosen[i]??'classic';t.neutral=0;if(i<n)t.royal={pot:30000,progress:0,holder:null,prize:null,clusters:[1,1,2,2,3],slots:[],activations:0};});
 if(chosen.includes('handicap'))g.tables.forEach((t,i)=>t.neutral=i<3?1:2);
 for(const id of chosen)if(!g.royale.seen.includes(id))g.royale.seen.push(id);
 log(g,'皇家模块：'+chosen.map(id=>ROYAL_MODULES.find(m=>m.id===id).name).join(' / '));
}
export function royalClosed(g,face){return !!g.royale&&g.royale.closed===face;}
export function royalRefresh(g){
 if(!g.royale)return;for(const t of g.tables){if(t.effect!=='power'||t.royal.holder===null)continue;const w=t.counts.map((_,i)=>tableWeight(t,i)),max=Math.max(...w);if(w.filter(n=>n===max).length!==1||w[t.royal.holder]!==max)t.royal.holder=null;}
}
export function royalReward(g,actor,amount,asChips=false){
 if(!amount)return;const p=g.players[actor];if(asChips){p.chips+=amount/10000;log(g,`${p.name}获得${amount/10000}枚筹码`);return;}
 const paid=Math.min(amount,g.royale.bank);g.royale.bank-=paid;if(paid){p.wallet.push(paid);syncMoney(p);}log(g,`${p.name}获得模块奖金${paid/10000}万${paid<amount?'（银行余额不足）':''}`);
}
function royalTax(g,actor,amount){const p=g.players[actor],value=Math.min(amount,p.cash+p.chips*10000),cash=Math.min(p.cash,value),chips=Math.ceil((value-cash)/10000);let left=cash;
 while(left>0&&p.wallet.length){const note=p.wallet.shift();if(note<=left)left-=note;else{p.wallet.push(note-left);left=0;}}
 p.chips-=chips;g.royale.bank+=cash+chips*10000;syncMoney(p);log(g,`${p.name}缴纳厄运税${value/10000}万`);
}
const royalRoll=(g)=>{const random=gameRandom(g,'royal:'+g.round);return [1+Math.floor(random()*6),1+Math.floor(random()*6)];};
function royalPending(g,face,actor,kind,extra={}){g.roll=[];g.phase='royale';g.royale.pending={face,actor,kind,stage:'select',chain:[face],...extra};g.royale.sequence++;return true;}
function royalResult(g,q,message){q.stage='done';q.message=message;g.royale.pending=q;log(g,message);return true;}
function royalContinue(g){g.royale.pending=null;royalRefresh(g);if(g.royale.payoutStarted)royalPayoutStep(g);else advance(g);return true;}
export function activateRoyal(g,face,actor,context={}){
 if(!g.royale||!ROYAL_IDS.includes(g.tables[face-1].effect))return false;const t=g.tables[face-1],kind=t.effect;
 royalPending(g,face,actor,kind,{remaining:context.remaining??[],placed:context.placed??[],chain:context.chain??[face]});const q=g.royale.pending;t.royal.activations++;royalRefresh(g);
 if(kind==='lucky')q.stage='hide';
 if(kind==='royaljackpot'){q.dice=royalRoll(g);const win=q.dice[0]===q.dice[1]||q.dice[0]+q.dice[1]===7,amount=t.royal.pot;if(win){royalReward(g,actor,amount);t.royal.pot=30000;}else t.royal.pot=Math.min(80000,amount+10000);royalResult(g,q,`${q.dice.join(' + ')}：${win?'中奖 '+amount/10000+'万':'未中，奖池增至'+t.royal.pot/10000+'万'}`);}
 if(kind==='fifty'){q.dice=royalRoll(g);q.total=q.dice[0]+q.dice[1];q.wins=0;}
 if(kind==='five'){if(t.royal.prize===null&&tableWeight(t,actor)>=5){t.royal.prize=actor;royalResult(g,q,'获得击掌大奖标记，轮末领取10万');}else royalResult(g,q,t.royal.prize===null?'尚未达到计数5':'本轮大奖标记已被领取');}
 if(kind==='payday'){const n=g.tables.filter(x=>x.counts[actor]>0).length;royalReward(g,actor,n*10000,n<=2);royalResult(g,q,`占据${n}座赌场，发薪完成`);}
 if(kind==='power'){const w=t.counts.map((_,i)=>tableWeight(t,i));if(w[actor]>0&&w.every((n,i)=>i===actor||n<w[actor]))t.royal.holder=actor;royalResult(g,q,t.royal.holder===actor?'你获得控制标记，下次可定点放骰':'未取得独占领先');}
 if(['prime','badluck','blackbox'].includes(kind))royalResult(g,q,'本模块将在派彩前处理；本次下注已完成');
 if(kind==='knockout'){q.victims=Array.from({length:3},(_,i)=>(actor+i+1)%4).filter(i=>g.players[i].left>0&&g.royale.held.filter(d=>d.kind==='knockout'&&d.owner===i).length<2);q.at=0;if(!q.victims.length)royalReleaseBar(g,q);}
 if(kind==='choice')q.dice=royalRoll(g);
 return true;
}
function royalReleaseBar(g,q){const held=g.royale.held.filter(d=>d.kind==='knockout'&&d.owner===q.actor);for(const d of held)royalUnhold(g,d,'hand');return royalResult(g,q,`酒吧已处理，取回${held.length}颗骰子`);}
function royalTake(g,actor,zone,face,big,value=face){const p=g.players[actor];if(zone==='hand'){if(p.left<1||(big?(p.bigLeft||0)<1:p.left<=(p.bigLeft||0)))return null;p.left--;if(big)p.bigLeft--;}
 else{const t=g.tables[face-1];if(!t||royalClosed(g,face)||(big?(t.big[actor]||0)<1:t.counts[actor]<=(t.big[actor]||0)))return null;t.counts[actor]--;if(big)t.big[actor]--;}
 return {owner:actor,big:!!big,value};
}
function royalPut(g,d,face){if(royalClosed(g,face))return false;const t=g.tables[face-1];t.counts[d.owner]++;if(d.big)t.big[d.owner]++;g.move++;t.first[d.owner] ||=g.move;t.last[d.owner]=g.move;return true;}
function royalUnhold(g,d,destination){if(destination==='hand'){g.players[d.owner].left++;if(d.big)g.players[d.owner].bigLeft++;}else if(!royalPut(g,d,d.value))return false;g.royale.held.splice(g.royale.held.indexOf(d),1);return true;}
function royalHandOptions(g,actor,callback){const p=g.players[actor],a=[];if(p.left>(p.bigLeft||0))a.push(callback(false));if(p.bigLeft)a.push(callback(true));return a;}
function royalFreeOptions(g,q){const a=[];for(let face=1;face<=6;face++){if(royalClosed(g,face))continue;a.push(...royalHandOptions(g,q.actor,big=>({id:`put-${face}-${+big}`,label:`放入${face}号桌 · ${big?'大骰':'普通骰'}`,op:'put',face,big})));
  const t=g.tables[face-1];for(const big of [false,true])if(big?t.big[q.actor]>0:t.counts[q.actor]>t.big[q.actor])a.push({id:`get-${face}-${+big}`,label:`取回${face}号桌 · ${big?'大骰':'普通骰'}`,op:'get',face,big});}return a;
}
export function royalOptions(g){
 const q=g.royale?.pending;if(!q)return [];const t=g.tables[q.face-1],a=[],add=(id,label,data={})=>a.push({id,label,...data}),pass=()=>add('pass','不使用，继续');
 if(q.stage==='done'){add('continue','确认结果，继续');return a;}
 if(q.kind==='lucky'){for(let n=1;n<=3;n++)add('n'+n,(q.stage==='hide'?'暗藏':'猜')+n+'枚筹码',{n});return a;}
 if(q.kind==='fifty'){add('bank',q.wins?'收下'+[0,3,4,5,6][q.wins]+'万':'收手（尚无奖金）');add('higher','猜下一次总和更高');add('lower','猜下一次总和更低');return a;}
 if(q.kind==='noentry'){for(let face=1;face<=6;face++)if(face!==q.face)add('seal'+face,(g.royale.closed===face?'保持封闭':'封闭')+' '+face+'号桌',{face});return a;}
 if(q.kind==='knockout'){const actor=q.victims[q.at];return royalHandOptions(g,actor,big=>({id:'bar'+(+big),label:'送入酒吧：'+(big?'大骰':'普通骰'),big}));}
 if(q.kind==='block'){t.royal.clusters.forEach((n,index)=>{if(n)for(let face=1;face<=6;face++)if(!royalClosed(g,face))add(`block-${index}-${face}`,`${n}颗中立骰 → ${face}号桌`,{index,face,n});});pass();return a;}
 if(q.kind==='handicap'){if(q.stage==='free')return [...royalFreeOptions(g,q),{id:'pass',label:'放弃额外移动'}];for(const x of g.tables)if(x.neutral>0&&!royalClosed(g,x.face))for(let slot=0;slot<9;slot++)if(!t.royal.slots.includes(slot))add(`handicap-${x.face}-${slot}`,`移走${x.face}号中立骰 → ${slot<2?'1枚筹码':slot<5?'3万':'免费放入 / 取回'}（格${slot+1}）`,{face:x.face,slot});pass();return a;}
 if(q.kind==='double'){const small=t.counts[q.actor]-t.big[q.actor],large=t.big[q.actor];if(!royalClosed(g,q.face))for(let s=0;s<=small;s++)for(let b=0;b<=large;b++)if(s+b)add(`double-${s}-${b}`,`转入边池 ${s}小＋${b}大（计数${s+b*2}）`,{small:s,large:b});pass();return a;}
 if(q.kind==='nice'){for(const d of [...q.placed.map((v,i)=>({...v,zone:'table',index:i})),...q.remaining.map((v,i)=>({...v,zone:'hand',index:i}))]){const old=g.royale.held.find(h=>h.kind==='nice'&&h.value===d.value);if(old&&royalClosed(g,old.value))continue;if(d.zone==='table'&&royalClosed(g,q.face))continue;add(`nice-${d.zone}-${d.index}`,`${d.zone==='table'?'刚入桌':'手中'}${d.big?'大骰':'普通骰'} ${d.value}点 → 奖励格${old?'（替换旧骰）':''}`,{die:d});}pass();return a;}
 if(q.kind==='choice'){
  if(q.stage==='select'){for(const n of new Set(q.dice))add('choice'+n,['','1枚筹码','2枚筹码','3万','激活另一模块','免费放入 / 取回','争夺6万金格'][n],{n});}
  else if(q.stage==='module'){for(const x of g.tables)if(ROYAL_IDS.includes(x.effect)&&!q.chain.includes(x.face)&&!royalClosed(g,x.face))add('activate'+x.face,x.face+'号 · '+ROYAL_MODULES.find(m=>m.id===x.effect).name,{face:x.face});pass();}
  else if(q.stage==='free')return [...royalFreeOptions(g,q),{id:'pass',label:'不移动，继续'}];
  else if(q.stage==='gold'){a.push(...royalHandOptions(g,q.actor,big=>({id:'gold'+(+big),label:'存入金格：'+(big?'大骰':'普通骰'),big})));pass();}return a;
 }
 if(q.kind==='powerturn'){for(let face=1;face<=6;face++)if(!royalClosed(g,face))a.push(...royalHandOptions(g,q.actor,big=>({id:`power-${face}-${+big}`,label:`${big?'大骰':'普通骰'}定为${face}点并入桌`,face,big})));add('cancel','改为正常掷骰');return a;}
 if(q.kind==='primepay'){for(let mask=0;mask<4;mask++){const dice=q.dice.filter((_,i)=>mask&(1<<i));if(dice.some(face=>royalClosed(g,face)))continue;add('prime'+mask,dice.length?'放入 '+dice.join('、')+'号桌':'不放黑骰',{mask});}return a;}
 if(q.kind==='blackpay'){if(q.stage==='split'){for(let mask=1;mask<32;mask++)add('split'+mask,`左堆 ${[60000,20000,20000,0,0,0].filter((_,i)=>mask&(1<<i)).map(n=>n/10000+'万').join('＋')}；右堆剩余`,{mask});}else{add('left','选择左堆（'+q.sizes[0]+'枚）',{pile:0});add('right','选择右堆（'+q.sizes[1]+'枚）',{pile:1});}return a;}
 pass();return a;
}
export function royalActor(g){const q=g.royale?.pending;if(!q)return g.turn;if(q.kind==='lucky'&&q.stage==='guess')return (q.actor+1)%4;if(q.kind==='knockout'&&q.stage!=='done')return q.victims[q.at];if(q.kind==='blackpay'&&q.stage==='split')return (q.actor+1)%4;return q.actor;}
export function royalAction(g,id){
 const actor=g.royale?.pending?.actor,before=g.tables.map(t=>({result:outcome(t),weights:t.counts.map((_,i)=>tableWeight(t,i)),neutral:t.neutral}));
 const result=royalExecute(g,id);if(result){royalRefresh(g);g.tables.forEach((t,i)=>{if(before[i].neutral!==t.neutral||before[i].weights.some((v,j)=>v!==tableWeight(t,j)))feedback(g,t,actor,before[i].result,'皇家模块',before[i].weights);});}return result;
}
function royalExecute(g,id){
 const q=g.royale?.pending;if(!q||g.phase!=='royale')return false;const c=royalOptions(g).find(x=>x.id===id);if(!c)return false;const t=g.tables[q.face-1],kind=q.kind;
 if(id==='continue'||id==='pass')return royalContinue(g);
 if(kind==='lucky'){if(q.stage==='hide'){q.secret=c.n;q.stage='guess';g.royale.sequence++;return true;}const won=c.n!==q.secret;if(won)royalReward(g,q.actor,[0,20000,30000,40000][q.secret],q.secret===1);return royalResult(g,q,`藏了${q.secret}枚，猜${c.n}枚：${won?'猜错，出拳者获奖':'猜中，没有奖励'}`);}
 if(kind==='fifty'){if(id==='bank'){royalReward(g,q.actor,[0,30000,40000,50000,60000][q.wins]);return royalResult(g,q,'收手，奖金已领取');}const old=q.total;q.dice=royalRoll(g);q.total=q.dice[0]+q.dice[1];const win=id==='higher'?q.total>old:q.total<old;if(!win)return royalResult(g,q,`${old} → ${q.total}，猜错，本次奖金归零`);q.wins++;if(q.wins===4){royalReward(g,q.actor,60000);return royalResult(g,q,'四连胜，赢得6万！');}q.message=`${old} → ${q.total}，猜对！`;return true;}
 if(kind==='noentry'){if(g.royale.closed===c.face)return royalResult(g,q,'保持封条，轨道不前进');g.royale.closed=c.face;t.royal.progress=(t.royal.progress+1)%6;const rewards=[0,0,10000,0,30000,0],reward=rewards[t.royal.progress];royalReward(g,q.actor,reward,reward===10000);return royalResult(g,q,`封闭${c.face}号桌 · 奖励轨道${t.royal.progress+1}/6`);}
 if(kind==='knockout'){const actor=q.victims[q.at],d=royalTake(g,actor,'hand',0,c.big,1);if(!d)return false;g.royale.held.push({...d,kind:'knockout',face:q.face});q.at++;g.royale.sequence++;if(q.at>=q.victims.length)return royalReleaseBar(g,q);return true;}
 if(kind==='block'){t.royal.clusters[c.index]=0;g.tables[c.face-1].neutral+=c.n;return royalResult(g,q,`${c.face}号桌增加${c.n}颗中立骰`);}
 if(kind==='handicap'&&q.stage!=='free'){g.tables[c.face-1].neutral--;t.royal.slots.push(c.slot);if(c.slot<5){royalReward(g,q.actor,c.slot<2?10000:30000,c.slot<2);return royalResult(g,q,'中立骰已移走，奖励已领取');}q.stage='free';return true;}
 if((kind==='handicap'||kind==='choice')&&q.stage==='free'){const d=royalTake(g,q.actor,c.op==='put'?'hand':'table',c.face,c.big,c.face);if(!d)return false;if(c.op==='put')royalPut(g,d,c.face);else{g.players[q.actor].left++;if(c.big)g.players[q.actor].bigLeft++;}return royalResult(g,q,c.op==='put'?'免费放入完成，不触发目的桌效果':'已取回骰子，下次轮到时重掷');}
 if(kind==='double'){for(const [n,big] of [[c.small,false],[c.large,true]])for(let i=0;i<n;i++){const d=royalTake(g,q.actor,'table',q.face,big,q.face);g.royale.held.push({...d,kind:'double',face:q.face});}return royalResult(g,q,`转入边池${c.small+c.large}颗骰子`);}
 if(kind==='nice'){const d=c.die,old=g.royale.held.find(h=>h.kind==='nice'&&h.value===d.value),taken=royalTake(g,q.actor,d.zone,q.face,d.big,d.value);if(!taken)return false;if(old)royalUnhold(g,old,'table');g.royale.held.push({...taken,kind:'nice',face:q.face});return royalResult(g,q,`占据${d.value}点奖励格${old?'，旧骰回到'+old.value+'号赌场':''}`);}
 if(kind==='choice'){if(q.stage==='select'){if(c.n<=3){royalReward(g,q.actor,c.n*10000,c.n<3);return royalResult(g,q,'所选奖励已领取');}q.stage=c.n===4?'module':c.n===5?'free':'gold';return true;}
  if(q.stage==='module')return activateRoyal(g,c.face,q.actor,{remaining:q.remaining,placed:[],chain:[...q.chain,c.face]});
  if(q.stage==='gold'){const old=g.royale.held.find(h=>h.kind==='gold'),d=royalTake(g,q.actor,'hand',q.face,c.big,6);if(!d)return false;if(old)royalUnhold(g,old,'hand');g.royale.held.push({...d,kind:'gold',face:q.face});return royalResult(g,q,'已占据金格，轮末领取6万');}
 }
 if(kind==='powerturn'){if(id==='cancel'){g.royale.pending=null;g.phase='ready';return true;}const d=royalTake(g,q.actor,'hand',c.face,c.big,c.face);if(!d)return false;royalPut(g,d,c.face);if(activateRoyal(g,c.face,q.actor,{placed:[d]}))return true;return royalContinue(g);}
 if(kind==='primepay'){q.dice.forEach((face,i)=>{if(c.mask&(1<<i)){g.players[q.actor].supply++;g.royale.extra++;royalPut(g,{owner:q.actor,big:false},face);}});return royalContinue(g);}
 if(kind==='blackpay'){if(q.stage==='split'){const tokens=[60000,20000,20000,0,0,0];q.piles=[tokens.filter((_,i)=>c.mask&(1<<i)),tokens.filter((_,i)=>!(c.mask&(1<<i)))];q.sizes=q.piles.map(x=>x.length);q.stage='pick';g.royale.sequence++;return true;}const reward=q.piles[c.pile].reduce((a,b)=>a+b,0);royalReward(g,q.actor,reward,reward===20000);return royalResult(g,q,`所选奖励为${q.piles[c.pile].map(n=>n/10000).join('＋')}万`);}
 return false;
}
export function startPower(g){if(!g.royale||g.phase!=='ready'||g.skillPending)return false;royalRefresh(g);const t=g.tables.find(t=>t.effect==='power'&&t.royal.holder===g.turn);if(!t)return false;return royalPending(g,t.face,g.turn,'powerturn');}
export function prepareRoyalPayout(g){
 if(!g.royale||g.royale.payoutDone)return false;if(g.royale.payoutStarted)return true;
 g.reaction=null;g.roll=[];g.royale.payoutStarted=true;g.royale.queue=[...g.tables.filter(t=>t.effect==='prime').map(t=>({kind:'primepay',face:t.face})),...g.tables.filter(t=>t.effect==='badluck').map(t=>({kind:'tax',face:t.face})),...g.tables.filter(t=>t.effect==='blackbox').map(t=>({kind:'blackpay',face:t.face})),{kind:'rewards'}];royalPayoutStep(g);return true;
}
function royalPayoutStep(g){
 while(g.royale.queue.length){const step=g.royale.queue.shift(),t=step.face?g.tables[step.face-1]:null;
  if(step.kind==='primepay'||step.kind==='blackpay'){const scores=t.counts.map((_,i)=>({i,n:tableWeight(t,i)})).filter(x=>x.n>0);if(t.neutral)scores.push({i:4,n:t.neutral});const ranks=scores.filter(x=>scores.filter(y=>y.n===x.n).length===1).sort((a,b)=>b.n-a.n);const actor=ranks[0]?.i===4?undefined:ranks[0]?.i;if(actor===undefined)continue;royalPending(g,t.face,actor,step.kind,step.kind==='primepay'?{dice:royalRoll(g)}:{stage:'split'});return;}
  if(step.kind==='tax'){const weights=t.counts.map((_,i)=>tableWeight(t,i)),min=Math.min(...weights);weights.forEach((v,i)=>{if(v===min)royalTax(g,i,50000);});}
  if(step.kind==='rewards'){
   for(const table of g.tables){if(table.effect==='five'&&table.royal.prize!==null)royalReward(g,table.royal.prize,100000);}
   const held=g.royale.held;for(const d of held)if(d.kind==='nice'||d.kind==='gold')royalReward(g,d.owner,d.kind==='gold'?60000:d.value*10000,d.kind==='nice'&&d.value<3);
   const counts=[0,0,0,0],big=[0,0,0,0];for(const d of held)if(d.kind==='double'){counts[d.owner]++;if(d.big)big[d.owner]++;}
   const result=outcome({counts,big,notes:[60000,30000],effect:'classic'});for(const a of result.awards)royalReward(g,a.player,a.amount);
  }
 }
 g.royale.pending=null;g.royale.payoutDone=true;g.phase='ready';settle(g);
}
export function royalBotAction(g){
 const q=g.royale?.pending,options=royalOptions(g);if(!q||!options.length)return null;if(q.stage==='done')return 'continue';
 // Random secret guesses never inspect hidden piles or the hidden punch.
 if((q.kind==='lucky')||(q.kind==='blackpay')){const random=gameRandom(g,'royalbot:'+g.round);return options[Math.floor(random()*options.length)].id;}
 if(q.kind==='fifty'&&q.stage!=='done'){if(q.wins>=2||(q.wins&&q.total>=6&&q.total<=8))return 'bank';return q.total<=7?'higher':'lower';}
 if(q.kind==='noentry'){const rank=options.map(c=>({...c,score:g.tables[c.face-1].counts[q.actor]*3-g.players.reduce((n,p,i)=>n+(i!==q.actor?g.tables[c.face-1].counts[i]:0),0)})).sort((a,b)=>b.score-a.score);return rank[0].id;}
 if(q.kind==='primepay')return options[options.length-1].id;
 if(q.kind==='nice')return [...options].filter(c=>c.die).sort((a,b)=>b.die.value-a.die.value)[0]?.id??'pass';
 if(q.kind==='choice'&&q.stage==='select')return [...options].sort((a,b)=>b.n-a.n)[0].id;
 if(q.kind==='handicap'&&q.stage==='select')return options.find(c=>c.slot>=2&&c.slot<5)?.id??options[0].id;
 if(q.kind==='double'){const choices=options.filter(c=>c.small!==undefined&&c.small+c.large<=2);return choices[choices.length-1]?.id??'pass';}
 return options[0].id;
}
export function royalStatus(g,t){if(!g.royale)return '';const parts=[];if(royalClosed(g,t.face))parts.push('⛔ 封闭：禁止增减骰子');if(t.neutral)parts.push(`中立骰 ×${t.neutral}`);if(t.royal){if(t.effect==='royaljackpot')parts.push('奖池 '+t.royal.pot/10000+'万');if(t.effect==='power'&&t.royal.holder!==null)parts.push('控制：'+g.players[t.royal.holder].name);if(t.effect==='five'&&t.royal.prize!==null)parts.push('大奖：'+g.players[t.royal.prize].name);const held=g.royale.held.filter(d=>d.face===t.face);if(held.length)parts.push('暂存 '+held.map(d=>g.players[d.owner].name+(d.big?'大骰':'骰子')+(d.kind==='nice'?'·'+d.value+'点':'')).join(' / '));}return parts.join(' · ');}
export function validRoyal(g){
 const r=g.royale;if(g.modulePool!=='royal')return r===undefined;const integer=(n,max)=>Number.isInteger(n)&&n>=0&&n<=max;
 if(!r||!integer(r.bank,20000000)||!integer(r.closed,6)||!integer(r.extra,2)||!integer(r.sequence,2000)||!Array.isArray(r.seen)||r.seen.length>16||!r.seen.every(id=>ROYAL_IDS.includes(id))||!Array.isArray(r.held)||r.held.length>40||!Array.isArray(r.queue)||r.queue.length>8||typeof r.payoutStarted!=='boolean'||typeof r.payoutDone!=='boolean')return false;
 if(!r.held.every(d=>integer(d.owner,3)&&typeof d.big==='boolean'&&integer(d.value,6)&&d.value>0&&integer(d.face,6)&&d.face>0&&['knockout','double','nice','gold'].includes(d.kind)))return false;
 if(r.held.filter(d=>d.kind==='gold').length>1||new Set(r.held.filter(d=>d.kind==='nice').map(d=>d.value)).size!==r.held.filter(d=>d.kind==='nice').length||[0,1,2,3].some(i=>r.held.filter(d=>d.kind==='knockout'&&d.owner===i).length>2))return false;
 if(!g.tables.every(t=>integer(t.neutral,18)&&(!ROYAL_IDS.includes(t.effect)||(t.royal&&integer(t.royal.progress,5)&&integer(t.royal.pot,80000)&&Array.isArray(t.royal.clusters)&&t.royal.clusters.length===5&&t.royal.clusters.every(n=>integer(n,3))&&Array.isArray(t.royal.slots)&&new Set(t.royal.slots).size===t.royal.slots.length&&t.royal.slots.every(n=>integer(n,8))&&(t.royal.prize===null||integer(t.royal.prize,3))&&(t.royal.holder===null||integer(t.royal.holder,3))))))return false;
 if(g.phase!=='royale')return r.pending===null;const q=r.pending;if(!q||!integer(q.actor,3)||!integer(q.face,6)||q.face<1||![...ROYAL_IDS,'primepay','blackpay','powerturn'].includes(q.kind)||!['select','hide','guess','done','free','module','gold','split','pick'].includes(q.stage))return false;
 if(['fifty','royaljackpot','choice','primepay'].includes(q.kind)&&(!Array.isArray(q.dice)||q.dice.length!==2||!q.dice.every(n=>integer(n,6)&&n>0)))return false;
 if(q.kind==='lucky'&&q.stage==='guess'&&(!integer(q.secret,3)||q.secret<1))return false;
 if(q.kind==='knockout'&&q.stage!=='done'&&(!Array.isArray(q.victims)||!q.victims.length||!q.victims.every(i=>integer(i,3))||!integer(q.at,q.victims.length-1)))return false;
 if(q.kind==='blackpay'&&q.stage==='pick'&&(!Array.isArray(q.piles)||q.piles.length!==2||!q.piles.every(a=>Array.isArray(a)&&a.length>0)||JSON.stringify(q.piles.flat().sort((a,b)=>a-b))!=='[0,0,0,20000,20000,60000]'||JSON.stringify(q.sizes)!==JSON.stringify(q.piles.map(a=>a.length))))return false;
 try{return royalOptions(g).length>0;}catch{return false;}
}
