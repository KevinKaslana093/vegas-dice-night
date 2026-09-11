import test from 'node:test';
import assert from 'node:assert/strict';
import {deck,sum,createGame,nextRound,rollDice,placeDice,outcome,botChoice,winners,validSave} from '../dist/core.mjs';
const rng = seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
test('classic 54-note deck and exact denominations',()=>{const d=deck(rng(1));assert.equal(d.length,54);assert.deepEqual(Array.from({length:9},(_,i)=>d.filter(n=>n===(i+1)*10000).length),[6,8,8,6,6,5,5,5,5]);});
test('all tied counts eliminated, even below first place',()=>{
  assert.deepEqual(outcome({counts:[4,4,1,0],notes:[90000,20000]}).awards,[{player:2,amount:90000}]);
  assert.deepEqual(outcome({counts:[5,3,3,1],notes:[80000,30000,10000]}).awards,[{player:0,amount:80000},{player:3,amount:30000}]);
  assert.deepEqual(outcome({counts:[2,2,1,1],notes:[90000]}).awards,[]);
  assert.deepEqual(outcome({counts:[2,2,2,1],notes:[90000]}).ties,[0,1,2]);
});
test('one note per winner, leftovers recycled',()=>{const o=outcome({counts:[3,2,1,0],notes:[80000,20000]});assert.equal(o.awards.length,2);assert.equal(o.awards[1].player,1);assert.deepEqual(o.unused,[]);assert.equal(outcome({counts:[0,0,0,0],notes:[60000]}).unused[0],60000);});
test('placement consumes every matching die; illegal actions do not mutate',()=>{const g=createGame();rollDice(g,()=>.4);const before=JSON.stringify(g);assert.equal(placeDice(g,6),false);assert.equal(JSON.stringify(g),before);assert.equal(rollDice(g),false);assert.equal(placeDice(g,3),true);assert.equal(g.tables[2].counts[0],8);assert.equal(g.players[0].left,0);assert.equal(g.turn,1);});
test('same money resolves by note count then shared winners',()=>{const g=createGame();g.players.forEach(p=>p.cash=50000);g.players[1].notes=3;assert.deepEqual(winners(g),[1]);g.players[3].notes=3;assert.deepEqual(winners(g),[1,3]);});
test('1000 seeded complete games: dice, currency, persistence and turn invariants',()=>{
  for(let seed=1;seed<=1000;seed++){
    const r=rng(seed),g=createGame(1,r),bank=sum(deck());let moves=0;
    for(let round=1;round<=4;round++){
      assert.equal(g.turn,round-1);assert(g.tables.every(t=>sum(t.notes)>=50000));
      while(['ready','choose'].includes(g.phase)){
        assert(g.players[g.turn].left>0);if(g.phase==='ready')rollDice(g,r);
        assert(validSave(g));assert(placeDice(g,botChoice(g,r)));assert(validSave(g));assert(++moves<=128);
      }
      assert.equal(sum(g.players.map(p=>p.cash))+sum(g.deck),bank);
      assert.equal(g.deck.length+sum(g.players.map(p=>p.notes)),54);
      if(round<4)nextRound(g);
    }
    assert.equal(g.phase,'finished');assert(winners(g).length>0);
  }
});
test('corrupt saves rejected',()=>{assert(!validSave(null));const g=createGame();g.players[0].left=99;assert(!validSave(g));assert(!validSave({v:1,round:1,humans:1,phase:'ready'}));});
