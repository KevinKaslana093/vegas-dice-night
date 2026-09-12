import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,nextRound,rollDice,placeDice,skipTurn,outcome,previewTable,botChoice,botShouldSkip,validSave,deck,sum,SPECIALS} from '../dist/core.mjs';
const rng=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const t=(effect,counts,first=[1,2,3,4],last=[1,2,3,4])=>({effect,counts,first,last,notes:[80000,30000,10000]});
test('special casino effects vary between seeded rounds but remain fixed during turns',()=>{
 const seen=new Set();
 for(let seed=1;seed<=30;seed++){const r=rng(seed),g=createGame(4,r);const initial=g.tables.map(t=>t.effect);seen.add(initial.slice(0,3).join(','));rollDice(g,r);skipTurn(g);rollDice(g,r);placeDice(g,g.roll[0]);assert.deepEqual(g.tables.map(t=>t.effect),initial);}
 assert(seen.size>10);
 const g=createGame(4,rng(41));const first=g.tables.map(t=>t.effect);nextRound(g,rng(82));assert.notDeepEqual(g.tables.map(t=>t.effect),first);assert(g.tables.every(t=>t.notes.length===2));
});
test('insurance ranks equal counts by first arrival, no eliminated ties',()=>{const o=outcome(t('insurance',[2,2,1,0],[2,1,3,0]));assert.deepEqual(o.ties,[]);assert.deepEqual(o.awards.map(a=>a.player),[1,0,2]);});
test('low favors smallest distinct investment, ties still eliminated',()=>{assert.deepEqual(outcome(t('low',[4,2,1,0])).awards.map(a=>a.player),[2,1,0]);assert.deepEqual(outcome(t('low',[1,1,3,4])).awards.map(a=>a.player),[2,3]);});
test('jackpot gives actual individual banknotes to one eligible winner',()=>{const o=outcome(t('jackpot',[4,4,2,0]));assert.deepEqual(o.awards.map(a=>a.player),[2,2,2]);assert.equal(sum(o.awards.map(a=>a.amount)),120000);assert.equal(o.unused.length,0);});
test('seven uses distance to seven then first arrival after removing raw ties',()=>{assert.deepEqual(outcome(t('seven',[8,6,7,4])).awards.map(a=>a.player),[2,0,1]);assert.deepEqual(outcome(t('seven',[7,7,6,2])).awards.map(a=>a.player),[2,3]);});
test('last uses most recent placement, not number of dice or first arrival',()=>{assert.deepEqual(outcome(t('last',[5,2,1,0],[1,2,3,0],[8,9,3,0])).awards.map(a=>a.player),[1,0,2]);});
test('gate excludes counts below three before resolving ties',()=>{assert.deepEqual(outcome(t('gate',[2,2,4,3])).ties,[]);assert.deepEqual(outcome(t('gate',[2,2,4,3])).awards.map(a=>a.player),[2,3]);});
test('free unlimited skip preserves dice, all investments, cash and round; rotates normally',()=>{
 const g=createGame(4,rng(8));const tables=JSON.stringify(g.tables),deckBefore=JSON.stringify(g.deck);
 assert.equal(skipTurn(g),false);
 for(let i=0;i<40;i++){assert.equal(g.turn,i%4);rollDice(g,rng(i));assert(skipTurn(g));assert.equal(g.phase,'ready');assert.equal(g.roll.length,0);assert.equal(g.round,1);assert.equal(JSON.stringify(g.tables),tables);assert.equal(JSON.stringify(g.deck),deckBefore);assert(g.players.every(p=>p.left===8&&p.cash===0));assert(validSave(g));}
 assert(g.players.every(p=>p.skips===10));
});
test('skip bypasses exhausted players and sole remaining player immediately rolls again',()=>{const g=createGame(4);for(let i=0;i<3;i++){rollDice(g,()=>.1);placeDice(g,1);}assert.equal(g.turn,3);rollDice(g,()=>.6);skipTurn(g);assert.equal(g.turn,3);assert.equal(g.players[3].left,8);assert.equal(g.phase,'ready');rollDice(g,()=>.9);assert(g.roll.every(v=>v===6));});
test('preview preserves state and agrees with committed first/last arrival',()=>{const g=createGame();rollDice(g,()=>0);const before=JSON.stringify(g),expected=outcome(previewTable(g,1));assert.equal(JSON.stringify(g),before);placeDice(g,1);assert.deepEqual(outcome(g.tables[0]),expected);});
test('three modes, sorted prizes each round, randomized skips: 300 complete games',()=>{
 for(const rules of ['half','all','classic'])for(let seed=1;seed<=100;seed++){
  const r=rng(seed),g=createGame(1,r,{rules});let moves=0;
  for(let round=1;round<=4;round++){
   assert(g.tables.every((t,i)=>i===0||sum(g.tables[i-1].notes)<=sum(t.notes)));
   assert(g.tables.every(t=>t.notes.length===2));
   const effects=g.tables.map(t=>t.effect);
   if(rules==='all')assert.deepEqual([...effects].sort(),[...SPECIALS].sort());
   else if(rules==='half'){assert.equal(new Set(effects.slice(0,3)).size,3);assert(effects.slice(0,3).every(e=>SPECIALS.includes(e)));assert.deepEqual(effects.slice(3),['classic','classic','classic']);}
   else assert.deepEqual(effects,Array(6).fill('classic'));
   while(['ready','choose'].includes(g.phase)){if(g.phase==='ready')rollDice(g,r);if(botShouldSkip(g,r))skipTurn(g);else placeDice(g,botChoice(g,r));assert(validSave(g));assert(++moves<=160);}
   assert.equal(sum(g.players.map(p=>p.cash))+sum(g.deck),sum(deck()));assert.equal(g.deck.length+sum(g.players.map(p=>p.notes)),54);
   if(round<4)nextRound(g,r);
  }
 }
});
