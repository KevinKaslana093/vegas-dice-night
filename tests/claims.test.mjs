import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,rollDice,placeDice,useSkill,miniAction,banknoteOwners,validSave} from '../dist/core.mjs';
import {claimMarkup} from '../dist/claims.mjs';
function fixture(face=6,counts=[0,3,2,1]){const g=createGame(4,()=>.4,{hero:1,skills:true,rules:'classic'}),t=g.tables[face-1];t.notes=[80000,50000];t.counts=[...counts];g.players.forEach((p,i)=>p.left-=counts[i]);return g;}
test('tie reports displaced notes and exact potential changes without moving real cash',()=>{
 const g=fixture();g.turn=2;let n=0;rollDice(g,()=>n++===0?.99:.2);placeDice(g,6);
 assert.ok(validSave(g));assert.deepEqual(g.lastEvent.notes,[{index:0,amount:80000,from:1,to:3},{index:1,amount:50000,from:2,to:null}]);
 assert.deepEqual(g.lastEvent.changes,[{player:1,delta:-80000},{player:2,delta:-50000},{player:3,delta:80000}]);assert.deepEqual(g.lastEvent.ties,[1,2]);assert.ok(g.players.every(p=>p.cash===0));
 const before=JSON.stringify(g),html=claimMarkup(g.lastEvent,1);assert.ok(html.includes('你 <b>暂失 8万'));assert.ok(html.includes('月兔 <b>暂领 8万'));assert.equal(JSON.stringify(g),before);
 useSkill(g,1,{target:2,zone:'table',face:6});assert.deepEqual(g.lastEvent.notes,[{index:0,amount:80000,from:3,to:1},{index:1,amount:50000,from:null,to:2}]);assert.ok(claimMarkup(g.lastEvent,1).includes('平局打破'));
});
test('equal denomination notes stay separate when a swap has zero net change',()=>{
 const g=fixture(6,[0,3,2,0]);g.tables[5].notes=[50000,50000];assert.deepEqual(banknoteOwners(g.tables[5]),[1,2]);
 useSkill(g,2,{target:1,face:6});assert.deepEqual(g.lastEvent.changes,[]);assert.equal(g.lastEvent.notes.length,2);assert.ok(claimMarkup(g.lastEvent,1).includes('奖金易主'));
});
test('ownership follows reverse, jackpot and insurance rules',()=>{
 const g=fixture(),t=g.tables[5];t.effect='reverse';assert.deepEqual(banknoteOwners(t),[2,1]);t.effect='jackpot';assert.deepEqual(banknoteOwners(t),[1,1]);
 t.counts=[0,3,3,1];t.effect='insurance';t.first=[0,1,2,3];assert.deepEqual(banknoteOwners(t),[1,2]);t.effect='classic';assert.deepEqual(banknoteOwners(t),[3,null]);
});
test('minigame bonus updates ownership using effective counts',()=>{
 const g=fixture(2,[0,0,3,1]);g.tables[1].effect='blackjack';let n=0;rollDice(g,()=>n++<2?.2:.8);placeDice(g,2);assert.equal(g.phase,'minigame');miniAction(g,'draw',()=>.99);miniAction(g,'bank');
 assert.deepEqual(g.lastEvent.ties,[1,2]);assert.deepEqual(banknoteOwners(g.tables[1]),[3,null]);assert.ok(g.lastEvent.notes.length);assert.ok(validSave(g));
});
