import {roleOf,winners,NAMES,outcome,tableWeight} from './core.mjs';

export const JOURNEY_KEY='vegas-night-journey-v1';
export const ROLE_GUIDES=[
 ['铺开再收网','多一颗骰子，多一个占桌的机会；别让多出来的计数撞上对手。'],
 ['把枪留给关键一颗','先看狙击后的排名：减少一颗，也可能把对手从撞数中救出来。'],
 ['小投入，换大位置','提前留一颗在目标桌；交易交出全部筹码，交换后仍可能撞数。'],
 ['挑钱包，等派彩','抽取按钞票张数等概率进行；比较人均票面，派彩后也能发动。'],
 ['一颗改点，整组改变','把大骰改到合适的一桌，先查看会不会多算一点而撞数。'],
 ['留下好骰，再变坏骰','保留已经合用的点数，只重掷一至两颗；结果仍然随机。'],
 ['算上加班的代价','整组改点前留出余量：随机损失可能恰好落在大骰上。']
];
export const CONTRACTS=[
 {id:'classic',name:'稳稳入袋',seed:13001,role:0,rules:'classic',skills:false,goal:'固定基础牌局，四轮后获胜。',test:r=>r.win},
 {id:'break',name:'最后一枪',seed:13002,role:1,rules:'half',skills:true,goal:'固定牛仔牌局，用技能改善自己的暂领金额至少一次，并完成四轮。',test:r=>r.skillGains>0},
 {id:'precision',name:'四桌巡礼',seed:13003,role:4,rules:'all',skills:true,goal:'固定荷官牌局，累计从至少四个不同编号的赌场领到钱。',test:r=>r.faces.length>=4}
];
export const BADGES=[
 {id:'learn',name:'初次入座',text:'完成三手基础教学',test:(s,p)=>p.training.includes('basics')},
 {id:'exam',name:'独立破局',text:'通过毕业挑战',test:(s,p)=>p.training.includes('exam')},
 {id:'finish',name:'一夜到底',text:'完成一场正式四轮牌局',test:s=>s.games>=1},
 {id:'win',name:'今夜赢家',text:'赢下一场正式牌局',test:s=>s.wins>=1},
 {id:'escape',name:'拆局人',text:'下注或技能使自己解除撞数',test:s=>s.escapes>=1},
 {id:'steal',name:'后来居上',text:'三次把对手暂领的钱转到自己名下',test:s=>s.takeovers>=3},
 {id:'big',name:'一颗抵两颗',text:'累计十次投入大骰',test:s=>s.bigBets>=10},
 {id:'skill',name:'关键一手',text:'用技能提高自己的暂领金额或现金',test:s=>s.skillGains>0},
 {id:'tour',name:'六桌熟客',text:'累计从六种编号的赌场拿到派彩',test:s=>s.faces.length===6},
 {id:'cast',name:'百变玩家',text:'用三位不同角色完成正式牌局',test:s=>s.roles.length>=3},
 {id:'ten',name:'常驻席位',text:'完成十场正式牌局',test:s=>s.games>=10},
 {id:'trial',name:'挑战收藏家',text:'完成全部三张固定牌局委托',test:s=>s.contracts.length===3}
];
const blankJourney=()=>({v:1,records:{},training:[],feedback:[],title:'',unlocks:[]});
export function readJourney(storage){try{const p=JSON.parse(storage.getItem(JOURNEY_KEY));if(p?.v!==1||!p.records||typeof p.records!=='object'||Array.isArray(p.records)||!Array.isArray(p.training)||!Array.isArray(p.feedback)||!Array.isArray(p.unlocks))return blankJourney();for(const [id,r] of Object.entries(p.records))if(!r||!Number.isFinite(r.cash)||!Number.isInteger(r.role)||r.role<0||r.role>=NAMES.length||!Array.isArray(r.faces))delete p.records[id];p.training=p.training.filter(x=>['basics','exam'].includes(x));p.unlocks=p.unlocks.filter(x=>BADGES.some(b=>b.id===x));p.title=p.unlocks.includes(p.title)?p.title:'';return p;}catch{return blankJourney();}}
export function journeyStats(p,role=null){
 const rows=Object.values(p.records).filter(r=>r&&Number.isFinite(r.cash)&&(role===null||r.role===role));
 const s={games:rows.length,wins:0,xp:0,cash:0,bets:0,skills:0,eligible:0,skillGains:0,takeovers:0,escapes:0,bigBets:0,minis:0,miniMs:0,miniChoices:0,roles:[],faces:[],contracts:[]};
 for(const r of rows){for(const k of ['cash','bets','skills','eligible','skillGains','takeovers','escapes','bigBets','minis','miniMs','miniChoices'])s[k]+=Number(r[k])||0;s.wins+=r.win?1:0;s.xp+=50+(r.win?25:0)+Math.min(25,r.bets||0);s.roles.push(r.role);s.faces.push(...(r.faces||[]));if(r.contractDone)s.contracts.push(r.contract);}
 for(const k of ['roles','faces','contracts'])s[k]=[...new Set(s[k])];return s;
}
export function mastery(xp){const levels=[0,100,250,500,900,1500],names=['新客','熟客','观察者','布局者','王牌','传奇'];let level=0;while(level<5&&xp>=levels[level+1])level++;return {level:level+1,name:names[level],xp,next:levels[level+1]||null,progress:level===5?1:(xp-levels[level])/(levels[level+1]-levels[level])};}
export function trackAction(g,kind,actor,detail={}){
 if(!g.journey||typeof g.journey.id!=='string'||!Array.isArray(g.journey.rounds)||!Array.isArray(g.journey.seats)||g.journey.seats.length!==4||!g.journey.seats.every(s=>s&&Array.isArray(s.faces)&&['bets','skills','eligible','skillGains','takeovers','escapes','bigBets','minis','miniMs','miniChoices'].every(k=>Number.isFinite(s[k])&&s[k]>=0))){g.journey={id:globalThis.crypto?.randomUUID?.()||Date.now()+'-'+Math.random(),rounds:[],seats:g.players.map(()=>({bets:0,skills:0,eligible:0,skillGains:0,takeovers:0,escapes:0,bigBets:0,minis:0,miniMs:0,miniChoices:0,faces:[]})),highlight:null};}
 const j=g.journey,s=j.seats[actor];if(!s)return;
 if(kind==='bet'){s.bets++;if(detail.big)s.bigBets++;}
 if(kind==='skill'){s.skills++;s.skillGains+=Math.max(0,detail.gain||0);}
 if(kind==='mini'){s.minis++;s.miniMs+=Math.max(0,detail.ms||0);s.miniChoices+=detail.choices||0;}
 if(['bet','skill'].includes(kind)){
  const e=g.lastEvent;if(e?.actor===actor){s.takeovers+=e.notes.filter(n=>n.to===actor&&n.from!==null&&n.from!==actor).length;if(e.beforeTies.includes(actor)&&!e.ties.includes(actor))s.escapes++;}
 }
}
export function recordRound(g){
 trackAction(g,'observe',g.hero);const j=g.journey;
 if(!['settled','finished'].includes(g.phase)||j.rounds.includes(g.round))return;
 j.rounds.push(g.round);
 g.players.forEach((p,i)=>{const s=j.seats[i];if(g.skills&&roleOf(g,i)!==0)s.eligible++;g.settlements.forEach((o,n)=>{if(o.awards.some(a=>a.player===i))s.faces.push(n+1);});s.faces=[...new Set(s.faces)];});
 if(g.turningPoint&&(!j.highlight||g.turningPoint.score>j.highlight.score))j.highlight={...g.turningPoint,round:g.round};
}
export function commitJourney(p,g){
 recordRound(g);if(g.phase!=='finished')return [];
 const old=new Set(p.unlocks),j=g.journey,s=j.seats[g.hero],r={...s,faces:[...s.faces],role:roleOf(g,g.hero),cash:g.players[g.hero].cash,win:winners(g).includes(g.hero),contract:g.contract||null,date:p.records[j.id]?.date||new Date().toISOString()};
 const c=CONTRACTS.find(c=>c.id===r.contract);r.contractDone=!!c&&c.test(r);p.records[j.id]=r;
 const stats=journeyStats(p);for(const b of BADGES)if(b.test(stats,p)&&!p.unlocks.includes(b.id))p.unlocks.push(b.id);
 const unlocked=p.unlocks.filter(id=>!old.has(id));j.unlocked=[...new Set([...(j.unlocked||[]),...unlocked])];return j.unlocked;
}
export function createJourney({storage=localStorage}={}){
 let profile=readJourney(storage),saved=true;
 const save=()=>{try{storage.setItem(JOURNEY_KEY,JSON.stringify(profile));saved=true;}catch{saved=false;}};
 return {get profile(){return profile;},get saved(){return saved;},sync(g){const unlocked=commitJourney(profile,g);if(g.phase==='finished')save();return unlocked;},training(which){if(!['basics','exam'].includes(which))return;if(!profile.training.includes(which))profile.training.push(which);const s=journeyStats(profile);for(const b of BADGES)if(b.test(s,profile)&&!profile.unlocks.includes(b.id))profile.unlocks.push(b.id);save();},title(id){if(profile.unlocks.includes(id)){profile.title=id;save();}},feedback(data){profile.feedback.push({...data,date:new Date().toISOString()});profile.feedback=profile.feedback.slice(-100);save();},export(){return JSON.stringify({version:'13.0.0',...profile},null,2);}};
}
export function journeyMarkup(p,role=0){
 const total=journeyStats(p),r=journeyStats(p,role),m=mastery(r.xp),title=BADGES.find(b=>b.id===p.title)?.name||'今晚，由你入座';
 return `<div class="eyebrow">PLAYER JOURNEY / 本机档案</div><h2>你的赌场旅程</h2><p class="journey-title">${title}</p><div class="journey-totals"><b>${total.games}<small>完成牌局</small></b><b>${total.wins}<small>获胜</small></b><b>${p.unlocks.length} / ${BADGES.length}<small>策略成就</small></b></div><h3>${NAMES[role]} · Lv.${m.level} ${m.name}</h3><progress max="1" value="${m.progress}"></progress><p>${r.xp} 熟练度${m.next?' / 下一阶 '+m.next:' · 已达最高阶'}。完成四轮 +50，获胜 +25，每次下注 +1（每局最多25）。</p><div class="journey-roster">${NAMES.map((n,i)=>`<button data-journey-role="${i}" aria-pressed="${i===role}">${n}<small>Lv.${mastery(journeyStats(p,i).xp).level}</small></button>`).join('')}</div><p class="fineprint">熟练度与称号不增加骰子、不改变概率。完成牌局后结算；刷新不会重复领奖。</p><h3>固定牌局委托</h3><div class="contract-grid">${CONTRACTS.map(c=>`<article><small>${total.contracts.includes(c.id)?'✓ 已完成':'可反复挑战'} · 固定随机序列</small><h3>${c.name}</h3><p>${c.goal}</p><button class="quiet" data-contract="${c.id}">${total.contracts.includes(c.id)?'再挑战':'接下委托'}</button></article>`).join('')}</div><h3>成就与展示称号</h3><div class="badge-grid">${BADGES.map(b=>`<article class="${p.unlocks.includes(b.id)?'unlocked':''}"><b>${p.unlocks.includes(b.id)?'✦':'◇'} ${b.name}</b><p>${b.text}</p>${p.unlocks.includes(b.id)?`<button class="text-button" data-title="${b.id}" ${p.title===b.id?'disabled':''}>${p.title===b.id?'正在展示':'设为称号'}</button>`:'<small>完成后解锁</small>'}</article>`).join('')}</div><button class="quiet" data-action="stats">查看对局统计</button><button class="primary" data-action="journey-back">返回</button>`;
}
