import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,rollDice,useSkill,validSave,isBigRoll,placeDice,botSkill,botChoice,miniAction,miniBotAction,passReaction,nextRound,rematch,roleOf} from '../dist/core.mjs';
const make=(seed=42)=>createGame(4,Math.random,{seed,skills:true,bigDice:true,finalActions:true,cast:[6,1,4,3]});
test('clock out converts whole group and uniformly selects physical cost, including big die',()=>{
 for(let loss=0;loss<8;loss++){const g=make();rollDice(g);g.roll=[2,2,2,4,4,5,6,6];assert(useSkill(g,0,{target:0,index:1,value:3},()=> (loss+.5)/8));assert.deepEqual(g.roll,[3,3,3,4,4,5,6,6].filter((_,i)=>i!==loss));assert.equal(g.players[0].left,7);assert.equal(g.players[0].lost,1);assert.equal(g.players[0].bigLeft,loss===0?0:1);assert.equal(g.players[0].bigLost,loss===0?1:0);assert.equal(g.turn,0);assert.equal(g.players[0].chips,2);assert(validSave(g));}
});
test('invalid and repeated activations do not mutate dice or consume random stream',()=>{
 const g=make();rollDice(g);const before=JSON.stringify(g);for(const c of [{target:1,index:0,value:6},{target:0,index:99,value:6},{target:0,index:0,value:g.roll[0]},{target:0,index:0,value:7}]){assert.equal(useSkill(g,0,c),false);assert.equal(JSON.stringify(g),before);}
 const choice={target:0,index:0,value:g.roll[0]%6+1},copy=JSON.parse(before);assert(useSkill(g,0,choice));assert(useSkill(copy,0,choice));assert.deepEqual(g,copy);const used=JSON.stringify(g);assert.equal(useSkill(g,0,choice),false);assert.equal(JSON.stringify(g),used);
});
test('clock out plus cowboy snipe retain a valid save and reset next round',()=>{
 const g=make();rollDice(g);assert(useSkill(g,0,{target:0,index:0,value:g.roll[0]%6+1},()=>0));assert(useSkill(g,1,{target:0,zone:'roll',index:0}));assert.equal(g.players[0].lost,2);assert(validSave(g));assert.equal(isBigRoll(g,0),false);nextRound(g);assert.equal(g.players[0].left,8);assert.equal(g.players[0].lost,0);assert.equal(g.players[0].bigLeft,1);assert.equal(g.players[0].used,false);assert(validSave(g));
});
test('spending the final die advances safely without a stuck empty choice phase',()=>{
 const g=make();g.tables[1].effect='classic';rollDice(g);g.roll=Array(8).fill(2);g.roll[7]=3;placeDice(g,2);g.turn=0;g.phase='ready';rollDice(g);assert.equal(g.roll.length,1);assert(useSkill(g,0,{target:0,index:0,value:g.roll[0]%6+1}));assert.notEqual(g.phase,'choose');assert.equal(g.players[0].left,0);assert(validSave(g));
});
test('losing own big die then a traded big die to a snipe preserves global conservation',()=>{
 const g=createGame(4,Math.random,{seed:4,cast:[6,1,2,3],skills:true,bigDice:true,rules:'classic'});rollDice(g);assert(useSkill(g,0,{target:0,index:0,value:g.roll[0]%6+1},()=>0));placeDice(g,g.roll[0]);g.turn=2;g.phase='ready';rollDice(g);g.roll=Array(g.roll.length).fill(2);placeDice(g,2);assert(useSkill(g,2,{target:0,face:2}));assert(useSkill(g,1,{target:0,zone:'table',face:2,big:true}));assert.equal(g.players[0].bigLost,2);assert(validSave(g));
});
function finish(g){let n=0;while(g.phase!=='finished'){assert(++n<1500);assert(validSave(g),g.phase);if(g.phase==='settled'){nextRound(g);continue;}if(g.phase==='reaction'){const c=botSkill(g,g.turn);if(c)assert(useSkill(g,g.turn,c));else passReaction(g);continue;}if([0,1,2,3].some(i=>{const c=botSkill(g,i);return c&&useSkill(g,i,c);}))continue;if(g.phase==='ready')rollDice(g);else if(g.phase==='minigame')miniAction(g,miniBotAction(g));else placeDice(g,botChoice(g));}assert(validSave(g));return g;}
test('new role works in every seat and 90 complete games preserve ledgers and deterministic rematches',()=>{
 for(let seat=0;seat<4;seat++){const cast=[1,4,3];cast.splice(seat,0,6);const g=createGame(4,Math.random,{cast,hero:seat,skills:true,bigDice:true});assert.equal(roleOf(g,seat),6);assert(validSave(g));}
 for(const rules of ['classic','half','all'])for(let seed=0;seed<30;seed++){const g=createGame(4,Math.random,{seed,rules,skills:true,bigDice:true,finalActions:true,cast:[6,1,4,3]});const end=finish(g);if(seed===0){const a=finish(rematch(end)),b=finish(rematch(end));assert.deepEqual(a,b);}}
});
