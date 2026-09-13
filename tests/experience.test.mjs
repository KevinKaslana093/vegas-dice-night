import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,rollDice,placeDice,nextRound,validSave,miniAction,miniBotAction,passReaction,botSkill,useSkill,outcome} from '../dist/core.mjs';
import {createExam} from '../dist/exam.mjs';
import {publicBotChoice,publicBotSkip,compactBet,diceDescription,skillPreview} from '../dist/experience.mjs';
import {createJourney,journeyStats,mastery,CONTRACTS,trackAction,readJourney} from '../dist/journey.mjs';
const memory=()=>{const data=new Map();return {getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};};
function run(c,level='standard'){
 const cast=[0,1,2,3];if(c.role>3)cast[0]=c.role;const hero=c.role>3?0:c.role;
 const g=createGame(1,Math.random,{seed:c.seed,hero,cast,bigDice:true,finalActions:true,skills:c.skills,rules:c.rules});g.contract=c.id;
 const j=createJourney({storage:memory()});let steps=0;
 while(g.phase!=='finished'){
  assert.ok(++steps<900);assert.ok(validSave(g));
  if(g.phase==='settled'){j.sync(g);nextRound(g);continue;}
  const actor=g.turn;
  const choice=c.skills?botSkill(g,actor):null;
  if(choice){const before=g.players[actor].cash+g.tables.reduce((n,t)=>n+outcome(t).awards.filter(a=>a.player===actor).reduce((s,a)=>s+a.amount,0),0);if(useSkill(g,actor,choice)){const after=g.players[actor].cash+(['settled','finished'].includes(g.phase)?0:g.tables.reduce((n,t)=>n+outcome(t).awards.filter(a=>a.player===actor).reduce((s,a)=>s+a.amount,0),0));trackAction(g,'skill',actor,{gain:after-before});}}
  else if(g.phase==='reaction')passReaction(g);
  else if(g.phase==='minigame'){const action=miniBotAction(g);miniAction(g,action);if(action==='continue')trackAction(g,'mini',actor,{ms:1000,choices:1});}
  else if(g.phase==='ready')rollDice(g);
  else if(g.phase==='choose'){const face=publicBotChoice(g,level),big=g.bigDice&&g.players[actor].bigLeft&&g.roll[0]===face;assert.ok(placeDice(g,face));trackAction(g,'bet',actor,{big});}
  j.sync(g);
 }
 assert.ok(validSave(g));j.sync(g);return {g,j};
}
test('public bot decisions never read undealt money, wallet contents or random streams',()=>{
 const g=createGame(1,()=>.5,{seed:54,bigDice:true,skills:true,hero:1});rollDice(g);
 for(const difficulty of ['relaxed','standard','expert']){
  const choice=publicBotChoice(g,difficulty),copy=structuredClone(g),before=JSON.stringify(g);delete copy.deck;delete copy.random;copy.players.forEach(p=>delete p.wallet);
  assert.equal(publicBotChoice(copy,difficulty),choice);publicBotSkip(g,difficulty);assert.equal(JSON.stringify(g),before);
 }
});
test('three difficulty policies finish all fixed contracts while conserving rules',()=>{
 for(const level of ['relaxed','standard','expert'])for(const c of CONTRACTS){const {j}=run(c,level);assert.equal(journeyStats(j.profile).games,1);}
});
test('completed game sync/reload is idempotent; same seed new match has separate progress',()=>{
 const {g}=run(CONTRACTS[0]),storage=memory(),j=createJourney({storage});j.sync(g);const expected=journeyStats(j.profile);
 for(let i=0;i<5;i++)j.sync(structuredClone(g));assert.deepEqual(journeyStats(j.profile),expected);
 const restored=createJourney({storage});restored.sync(g);assert.deepEqual(journeyStats(restored.profile),expected);
 const again=structuredClone(g);again.journey.id+='-rematch';restored.sync(again);assert.equal(journeyStats(restored.profile).games,2);assert.equal(journeyStats(restored.profile).xp,expected.xp*2);
});
test('each round counts once and unfinished matches do not award mastery',()=>{
 const g=createGame(1,()=>.5,{hero:1,skills:true}),j=createJourney({storage:memory()});j.sync(g);j.sync(g);assert.equal(journeyStats(j.profile).xp,0);assert.equal(g.journey.rounds.length,0);
 const {g:finished}=run(CONTRACTS[1]);const rounds=finished.journey.rounds.length;j.sync(finished);j.sync(finished);assert.equal(finished.journey.rounds.length,rounds);assert.equal(finished.journey.seats[1].eligible,4);
});
test('badges, title, training, local feedback and mastery survive reload without gameplay buffs',()=>{
 const storage=memory(),j=createJourney({storage});j.training('basics');j.training('basics');j.training('exam');assert.deepEqual(j.profile.training,['basics','exam']);j.title('learn');j.feedback({stuck:'不知道该点哪里',again:'想再来一局'});
 const restored=createJourney({storage});assert.equal(restored.profile.title,'learn');assert.equal(restored.profile.feedback.length,1);assert.equal(mastery(100).level,2);assert.equal(mastery(1500).level,6);assert.equal(mastery(5000).progress,1);assert.equal(readJourney({getItem:()=>'{bad'}).v,1);
});
test('physical dice and weighted count are distinct and bet preview does not mutate the game',()=>{
 assert.equal(diceDescription(3,1),'3颗骰子 · 计数4');assert.equal(diceDescription(3,1,2),'3颗骰子 · 计数6（含加成2）');const g=createExam().g,before=JSON.stringify(g),html=compactBet(g,6);assert.match(html,/撞数出局/);assert.match(html,/大钞/);assert.equal(JSON.stringify(g),before);
 const preview=skillPreview(g,1,{face:6,target:2,big:false});assert.match(preview,/发动前/);assert.match(preview,/计数3 → 2颗 \/ 计数2/);assert.equal(JSON.stringify(g),before);
});
