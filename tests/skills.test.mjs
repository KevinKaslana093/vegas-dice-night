import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,rollDice,placeDice,skipTurn,nextRound,miniAction,miniBotAction,botChoice,botSkill,useSkill,canSkill,validSave,sum,deck,winners} from '../dist/core.mjs';
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const game=(hero=0)=>createGame(4,Math.random,{hero,skills:true,rules:'classic'});
test('skill edition grants ninth die only to denim; two chips accumulate every round',()=>{const g=game();assert.deepEqual(g.players.map(p=>p.left),[9,8,8,8]);assert(g.players.every(p=>p.chips===2));nextRound(g);assert(g.players.every(p=>p.chips===4));const plain=createGame();assert(plain.players.every(p=>p.left===8));assert(!canSkill(plain,1));});
test('cowboy snipes chosen rolled die out of turn without affecting other dice',()=>{const g=game();rollDice(g,()=>0);g.roll[3]=6;assert(useSkill(g,1,{target:0,zone:'roll',index:3}));assert.equal(g.roll.length,8);assert(!g.roll.includes(6));assert.equal(g.players[0].left,8);assert.equal(g.players[0].lost,1);assert.equal(g.turn,0);assert(validSave(g));const before=JSON.stringify(g);assert(!useSkill(g,1,{target:0,zone:'hand'}));assert.equal(JSON.stringify(g),before);});
test('cowboy hits hand or casino; lost die returns and ability resets next round',()=>{const g=game();assert(useSkill(g,1,{target:2,zone:'hand'}));assert.equal(g.players[2].left,7);assert(validSave(g));nextRound(g);assert.equal(g.players[2].left,8);assert(!g.players[1].used);const h=game();rollDice(h,()=>0);placeDice(h,1);assert(useSkill(h,1,{target:0,zone:'table',face:1}));assert.equal(h.tables[0].counts[0],8);assert.equal(h.players[0].lost,1);assert(validSave(h));});
test('sniping sole remaining rolled die resolves round exactly once',()=>{const g=game();for(let i=0;i<3;i++){rollDice(g,()=>0);placeDice(g,1);}rollDice(g,()=>.2);g.roll=[2,2,2,2,2,2,2,3];placeDice(g,2);rollDice(g,()=>.4);assert(useSkill(g,1,{target:3,zone:'roll',index:0}));assert.equal(g.phase,'settled');assert.equal(g.players[3].lost,1);assert(validSave(g));});
test('boss force-swaps physical counts and transfers ALL chips, preserving hand',()=>{const g=game();rollDice(g,()=>0);placeDice(g,1);const hand=g.players.map(p=>p.left);assert(useSkill(g,2,{target:0,face:1}));assert.deepEqual(g.tables[0].counts,[0,0,9,0]);assert.deepEqual(g.players.map(p=>p.left),hand);assert.equal(g.players[2].chips,0);assert.equal(g.players[0].chips,4);assert(validSave(g));});
test('boss rejects zero chips, self, or identical counts without spending ability',()=>{const g=game();const before=JSON.stringify(g);assert(!useSkill(g,2,{target:0,face:1}));assert(!useSkill(g,2,{target:2,face:1}));assert.equal(JSON.stringify(g),before);g.players[2].chips=0;assert(!canSkill(g,2));});
test('bunny steals one actual random banknote, including after final payout',()=>{const g=game();g.players[0].wallet=[10000,90000];g.players[0].cash=100000;g.players[0].notes=2;assert(useSkill(g,3,{target:0},()=>.99));assert.deepEqual(g.players[0].wallet,[10000]);assert.deepEqual(g.players[3].wallet,[90000]);assert.equal(g.players[3].cash,90000);assert.equal(g.players[0].notes,1);assert(validSave(g));const h=game();h.round=4;for(let i=0;i<4;i++){rollDice(h,()=>i/6);placeDice(h,i+1);}assert.equal(h.phase,'finished');const target=h.players.findIndex((p,i)=>i!==3&&p.wallet.length);const total=sum(h.players.map(p=>p.cash));assert(useSkill(h,3,{target},()=>0));assert.equal(sum(h.players.map(p=>p.cash)),total);assert(winners(h).length);assert(validSave(h));});
test('no-money target and invalid dice choices leave ability available',()=>{const g=game(),before=JSON.stringify(g);assert(!useSkill(g,3,{target:0}));assert(!useSkill(g,1,{target:0,zone:'roll',index:0}));assert(!useSkill(g,1,{target:0,zone:'table',face:8}));assert.equal(JSON.stringify(g),before);});
test('300 complete skill games preserve all dice, bills, chips and saved state',()=>{
 for(let seed=1;seed<=300;seed++){const r=rng(seed),g=createGame(1,r,{hero:seed%4,skills:true,rules:seed%2?'all':'half'});let spent=0,steps=0;
 for(let round=1;round<=4;round++){
  while(['ready','choose','minigame'].includes(g.phase)){
   for(const actor of [1,2,3]){const choice=botSkill(g,actor,r);if(choice){assert(useSkill(g,actor,choice,r));assert(validSave(g));}}
   if(g.phase==='minigame')miniAction(g,miniBotAction(g),r);
   else if(g.phase==='ready')rollDice(g,r);
   else if(g.phase==='choose'){if(r()<.1&&g.players[g.turn].chips){assert(skipTurn(g));spent++;}else assert(placeDice(g,botChoice(g,r),r));}
   assert(validSave(g));assert(++steps<1500);assert.equal(sum(g.players.map(p=>p.chips)),round*8-spent);
  }
  const choice=botSkill(g,3,r);if(choice)assert(useSkill(g,3,choice,r));
  assert.equal(sum(g.players.map(p=>p.cash))+sum(g.deck),sum(deck()));assert.equal(g.deck.length+sum(g.players.map(p=>p.notes)),54);
  if(round<4)nextRound(g,r);
 }
 assert.equal(g.phase,'finished');
 }
});
