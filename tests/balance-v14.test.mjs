import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,rollDice,placeDice,canSkill,useSkill,skipTurn,validSave,nextRound,rematch} from '../dist/core.mjs';
import {resolveBalanced,tradeGroups} from '../dist/balance.mjs';
const make=(cast=[4,5,6,3])=>createGame(4,Math.random,{seed:44,hero:0,skills:true,balance:2,bigDice:true,chipScore:true,rules:'classic',cast});
test('dealer sets two independent dice including big; invalid third selection is atomic',()=>{
 const g=make();rollDice(g);const before=JSON.stringify(g);assert.equal(useSkill(g,0,{changes:[{index:0,value:2},{index:1,value:3},{index:2,value:4}]}),false);assert.equal(JSON.stringify(g),before);
 const a=g.roll[0]%6+1,b=g.roll[1]%6+1;assert.ok(useSkill(g,0,{changes:[{index:0,value:a},{index:1,value:b}]}));assert.equal(g.roll[0],a);assert.equal(g.roll[1],b);assert.equal(g.players[0].bigLeft,1);assert.ok(validSave(g));
});
test('magician saves the draw, blocks other actions and accepts old/new per die exactly once',()=>{
 let g=make([5,4,6,3]);rollDice(g);const old=[...g.roll];assert.ok(useSkill(g,0,{indices:[0,1,2,3]}));assert.ok(validSave(g));g=JSON.parse(JSON.stringify(g));const fresh=g.skillPending.fresh;
 const state=JSON.stringify(g);assert.equal(placeDice(g,g.roll[0]),false);assert.equal(skipTurn(g),false);assert.equal(useSkill(g,0,{indices:[0]}),false);assert.equal(JSON.stringify(g),state);
 assert.ok(resolveBalanced(g,{keepNew:[true,false,true,false]}));assert.deepEqual(g.roll.slice(0,4),[fresh[0],old[1],fresh[2],old[3]]);assert.equal(resolveBalanced(g,{keepNew:[true]}),false);assert.ok(validSave(g));
});
test('bunny chooses from random two and must give an original banknote; wallets conserve money',()=>{
 const g=make([3,4,5,6]);for(const [i,wallet] of [[0,[10000,40000]],[1,[20000,50000,80000]]])Object.assign(g.players[i],{wallet,cash:wallet.reduce((a,b)=>a+b),notes:wallet.length});
 assert.ok(useSkill(g,0,{target:1}));assert.equal(g.skillPending.draw.length,2);const receive=g.skillPending.candidates[1],before=JSON.stringify(g);assert.equal(resolveBalanced(g,{take:1,give:2}),false);assert.equal(JSON.stringify(g),before);assert.ok(resolveBalanced(g,{take:1,give:0}));assert.equal(g.players[0].cash,40000+receive);assert.equal(g.players[0].cash+g.players[1].cash,200000);assert.ok(g.players[1].wallet.includes(10000));assert.ok(validSave(g));
});
test('salaryman chooses the physical cost and may preserve or discard the big die',()=>{
 for(const discard of [0,3]){const g=make([6,4,5,3]);rollDice(g);g.roll=[2,2,5,6,1,3,4,6];assert.ok(useSkill(g,0,{index:0,value:6,discard}));assert.equal(g.players[0].left,7);assert.equal(g.players[0].bigLeft,discard===0?0:1);assert.equal(g.players[0].bigLost,discard===0?1:0);assert.ok(!g.roll.includes(2));assert.ok(validSave(g));}
});
test('boss can buy a big die plus small but never raid an empty stake; total physical ownership conserved',()=>{
 const g=make([2,1,4,3]),t=g.tables[4];t.counts[0]=1;g.players[0].left--;t.counts[1]=2;t.big[1]=1;g.players[1].left-=2;g.players[1].bigLeft=0;assert.ok(tradeGroups(g,0).some(c=>c.large===1&&c.small===1));assert.ok(useSkill(g,0,{target:1,face:5,small:1,large:1}));assert.equal(t.counts[0],2);assert.equal(t.big[0],1);assert.equal(g.players[0].chips,0);assert.equal(g.players[1].chips,4);assert.ok(validSave(g));
});
test('same-seed rematch keeps the initial unseen pool instead of redrawing with end-of-game seen list',()=>{
 const g=createGame(1,Math.random,{seed:908,modulePool:'royal',balance:2,royalSeen:['lucky','prime'],bigDice:true});const initial=g.tables.map(t=>t.effect);g.royale.seen.push('fifty','choice');assert.deepEqual(rematch(g).tables.map(t=>t.effect),initial);
});
