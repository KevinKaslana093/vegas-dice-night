import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,rollDice,placeDice,skipTurn,useSkill,botSkill,botChoice,passReaction,settle,nextRound,validSave,outcome,tableWeight,isBigRoll,miniAction,miniBotAction,sum,deck} from '../dist/core.mjs';
import {analyzeBet} from '../dist/decisions.mjs';
import {createLesson} from '../dist/tutorial.mjs';
const rng=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const game=(options={})=>createGame(4,rng(1),{skills:true,bigDice:true,finalActions:true,rules:'classic',...options});
function allAtSix(g){for(let i=0;i<4;i++){rollDice(g,()=>.99);assert(placeDice(g,6));}return g;}
test('seven small and one big: physical supply, weighted preview and non-splittable placement',()=>{
 const g=game();assert.equal(g.players[0].left,9);assert(g.players.every(p=>p.bigLeft===1));
 rollDice(g,()=>.99);assert(isBigRoll(g,0));assert(!isBigRoll(g,1));const before=JSON.stringify(g),p=analyzeBet(g,6);assert.equal(p.count,9);assert.equal(p.big,1);assert.equal(p.players[0].afterDice,10);assert.equal(JSON.stringify(g),before);
 placeDice(g,6);assert.equal(g.tables[5].counts[0],9);assert.equal(tableWeight(g.tables[5],0),10);assert.equal(g.players[0].left,0);assert(validSave(g));
});
test('big die survives skipped turn and ordinary placements, only its own face consumes it',()=>{
 const g=game({hero:1});let n=0;rollDice(g,()=>n++===0?.99:.1);assert(skipTurn(g));assert.equal(g.players[1].bigLeft,1);assert.equal(g.players[1].left,8);
 g.turn=1;let j=0;rollDice(g,()=>j++===0?.99:.1);placeDice(g,1);assert.equal(g.players[1].left,1);assert.equal(g.players[1].bigLeft,1);assert(validSave(g));
});
test('one big plus one small ties three small; tutorial demonstrates it through legal actions',()=>{
 const g=createLesson(6).g,t=g.tables[5];assert.equal(t.counts[1],2);assert.equal(t.big[1],1);assert.equal(t.counts[2],3);assert.equal(t.big[2],0);assert.deepEqual(outcome(t).ties,[1,2]);
 for(const effect of ['classic','low','jackpot','seven','last','reverse','gate','blackjack','highlow'])assert.deepEqual(outcome({...t,effect}).ties,[1,2]);
});
test('cowboy can target big die in hand, roll and table with one physical loss',()=>{
 for(const zone of ['hand','roll','table']){
  const g=game({hero:2});if(zone!=='hand'){rollDice(g,()=>.99);if(zone==='table')placeDice(g,6);}
  assert(useSkill(g,1,{target:2,zone,index:0,face:6,big:true}));assert.equal(g.players[2].lost,1);assert.equal(g.players[2].bigLost,1);assert.equal(g.players[2].bigLeft,0);assert(validSave(g),zone);
  if(zone==='table')assert.equal(tableWeight(g.tables[5],2),7);else assert.equal(g.players[2].left,7);
 }
});
test('cowboy removing a small rolled die preserves big identity and rejects missing target kind',()=>{
 const g=game({hero:2});rollDice(g,()=>.99);assert(useSkill(g,1,{target:2,zone:'roll',index:2}));assert(isBigRoll(g,0));assert.equal(g.players[2].bigLost,0);assert(validSave(g));
 const h=game({hero:2});let n=0;rollDice(h,()=>n++===0?.99:.1);placeDice(h,6);const before=JSON.stringify(h);assert.equal(useSkill(h,1,{target:2,zone:'table',face:6,big:false}),false);assert.equal(JSON.stringify(h),before);
});
test('boss swaps big dice even when physical counts match; chips and all dice conserved',()=>{
 const g=game({hero:2});let n=0;rollDice(g,()=>n++===0?.99:.1);placeDice(g,6);let m=0;rollDice(g,()=>m++===1?.99:.1);placeDice(g,6);
 assert.equal(g.tables[5].counts[2],1);assert.equal(g.tables[5].counts[3],1);assert(useSkill(g,2,{target:3,face:6}));assert.equal(g.tables[5].big[2],0);assert.equal(g.tables[5].big[3],1);assert.equal(g.players[3].chips,4);assert(validSave(g));
});
test('last action waits for explicit human decision, survives JSON restore and cannot be settled early',()=>{
 let g=allAtSix(game());assert.equal(g.phase,'reaction');assert.equal(g.turn,1);assert(g.players.every(p=>p.cash===0));assert(validSave(g));const before=JSON.stringify(g);settle(g);assert.equal(JSON.stringify(g),before);
 assert.equal(passReaction(g,2),false);assert.equal(useSkill(g,2,{target:0,face:6}),false);assert.equal(JSON.stringify(g),before);
 g=JSON.parse(before);assert(passReaction(g));assert.equal(g.turn,2);assert.equal(g.phase,'reaction');assert(validSave(g));assert(passReaction(g));assert.equal(g.phase,'settled');assert(validSave(g));const paid=JSON.stringify(g);assert.equal(passReaction(g),false);settle(g);assert.equal(JSON.stringify(g),paid);
});
test('last action skill changes actual payout, consumes action and next round restores big dice',()=>{
 const g=allAtSix(game());assert(useSkill(g,1,{target:2,zone:'table',face:6,big:true}));assert.equal(g.turn,2);assert.equal(g.phase,'reaction');assert.equal(tableWeight(g.tables[5],2),7);assert(passReaction(g));assert.equal(g.phase,'settled');assert(g.settlements[5].awards.some(a=>a.player===2));assert(validSave(g));
 nextRound(g,rng(2));assert(g.players.every(p=>p.bigLeft===1&&p.bigLost===0));assert.equal(g.reaction,null);assert.equal(g.turningPoint,null);assert(validSave(g));
});
test('turning point snapshots preserve the causal snipe, original weights and changed banknote owners',()=>{
 const g=createLesson(11).g,e=g.turningPoint;assert.equal(e.action,'狙击');assert.equal(e.beforeCounts[2],3);assert.equal(e.afterCounts[2],2);assert(e.notes.some(n=>n.from===3&&n.to===1));const snapshot=JSON.stringify(e);g.tables[5].counts[2]++;assert.equal(JSON.stringify(e),snapshot);
});
test('pending last-die minigame finishes before last action and bunny can act after payout',()=>{
 const g=game();g.tables[5].effect='blackjack';for(let i=0;i<4;i++){rollDice(g,()=>.99);placeDice(g,6);assert.equal(g.phase,'minigame');miniAction(g,'bank');if(i===3)assert(g.players.every(p=>p.cash===0));miniAction(g,'continue');}
 assert.equal(g.phase,'reaction');while(g.phase==='reaction')passReaction(g);assert.equal(g.phase,'settled');const target=g.players.findIndex(p=>p.wallet.length);assert(useSkill(g,3,{target},()=>0));assert(validSave(g));
});
test('large die conservation rejects corrupt saves while old plain-dice saves stay valid',()=>{
 const g=game();g.players[0].bigLeft=0;assert(!validSave(g));const h=game();h.tables[0].big[0]=1;assert(!validSave(h));const broken=allAtSix(game());broken.settlements=null;assert(!validSave(broken));const old=createGame();delete old.bigDice;delete old.finalActions;delete old.reaction;delete old.turningPoint;old.tables.forEach(t=>delete t.big);assert(validSave(old));
});
test('different personalities break equal-value decisions differently and bunny targets average note value',()=>{
 const g=game();g.roll=[1,2];g.phase='choose';g.tables[0].counts[0]=1;g.tables[0].notes=[50000,20000];g.tables[1].notes=[50000,20000];
 assert.equal(botChoice(g,()=>.5),2);
 g.turn=3;g.players[0].wallet=[10000,10000,10000];g.players[0].notes=3;g.players[0].cash=30000;g.players[2].wallet=[20000];g.players[2].notes=1;g.players[2].cash=20000;assert.equal(botSkill(g,3).target,2);
});
test('240 seeded full big-die games: every phase, skill, currency and save invariant',()=>{
 for(let seed=1;seed<=240;seed++){
  const r=rng(seed),g=game({rules:['classic','half','all'][seed%3]}),bank=sum(deck());let turns=0;
  for(let round=1;round<=4;round++){
   while(!['settled','finished'].includes(g.phase)){
    assert(validSave(g),'seed '+seed+' phase '+g.phase);assert(++turns<800);
    if(g.phase==='reaction'){const c=botSkill(g,g.turn,r);if(c)assert(useSkill(g,g.turn,c,r));else passReaction(g);continue;}
    for(const actor of [1,2,3]){const c=botSkill(g,actor,r);if(c)assert(useSkill(g,actor,c,r));}
    if(g.phase==='reaction'||['settled','finished'].includes(g.phase))continue;
    if(g.phase==='minigame')miniAction(g,miniBotAction(g),r);else if(g.phase==='ready')rollDice(g,r);else placeDice(g,botChoice(g,r),r);
   }
   assert(validSave(g));assert.equal(sum(g.players.map(p=>p.cash))+sum(g.deck),bank);if(round<4)nextRound(g,r);
  }
 }
});
