import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,rematch,roleOf,initialSupply,rollDice,placeDice,skipTurn,useSkill,botSkill,botChoice,miniAction,miniBotAction,passReaction,nextRound,validSave,isBigRoll,gameRandom} from '../dist/core.mjs';
import {forecastStanding,finalRoundInfo} from '../dist/finale.mjs';
const create=(options={})=>createGame(4,Math.random,{seed:1234,skills:true,bigDice:true,finalActions:true,cast:[4,5,1,3],...options});
function play(g){let steps=0;while(g.phase!=='finished'){
 assert(++steps<1500,'game terminates');assert(validSave(g),'valid '+g.phase+' '+JSON.stringify(g.players));
 if(g.phase==='settled'){for(let i=0;i<4;i++){const c=botSkill(g,i);if(c)useSkill(g,i,c);}nextRound(g);continue;}
 if(g.phase==='reaction'){const c=botSkill(g,g.turn);if(c)assert(useSkill(g,g.turn,c));else passReaction(g);continue;}
 if([0,1,2,3].some(i=>{const c=botSkill(g,i);return c&&useSkill(g,i,c);}))continue;
 if(g.phase==='ready')rollDice(g);else if(g.phase==='minigame')miniAction(g,miniBotAction(g));else placeDice(g,botChoice(g));
 }assert(validSave(g));return g;
}
test('all seven roles work in rotated seats; passive and big dice follow actual roles',()=>{
 for(let role=0;role<7;role++)for(let seat=0;seat<4;seat++){const cast=[0,1,2,3,4,5,6].filter(x=>x!==role).slice(0,3);cast.splice(seat,0,role);const g=create({cast,hero:seat});assert.equal(roleOf(g,seat),role);assert.equal(g.players[seat].left,role===0?9:8);assert.equal(g.players.reduce((n,p)=>n+p.left,0),initialSupply(g));assert(validSave(g));}
});
test('dealer sets a big die without splitting it; invalid choices preserve the entire state',()=>{
 const g=create();rollDice(g);const old=g.roll[0],before=JSON.stringify(g);for(const c of [{target:0,index:0,value:old},{target:1,index:0,value:1},{target:0,index:99,value:6}]){assert.equal(useSkill(g,0,c),false);assert.equal(JSON.stringify(g),before);}
 assert(useSkill(g,0,{target:0,index:0,value:old%6+1}));assert(isBigRoll(g,0));assert.equal(g.players[0].left,8);assert.equal(g.players[0].chips,2);assert.equal(g.turn,0);assert(validSave(g));
 const used=JSON.stringify(g);assert.equal(useSkill(g,0,{target:0,index:1,value:6}),false);assert.equal(JSON.stringify(g),used);
});
test('magician rerolls only selected dice, once, preserving chips, turn and big identity',()=>{
 const g=create({hero:1});rollDice(g);const before=JSON.stringify(g),roll=[...g.roll];for(const indices of [[],[0,0],[0,1,2],[-1]]){assert.equal(useSkill(g,1,{target:1,indices}),false);assert.equal(JSON.stringify(g),before);}
 const copy=JSON.parse(before);assert(useSkill(g,1,{target:1,indices:[0,2]}));assert(useSkill(copy,1,{target:1,indices:[0,2]}));assert.deepEqual(g,copy);assert.equal(g.turn,1);assert.equal(g.phase,'choose');assert.equal(g.players[1].chips,2);assert(isBigRoll(g,0));roll.forEach((v,i)=>{if(i!==0&&i!==2)assert.equal(g.roll[i],v);});assert(validSave(g));
});
test('cowboy in seat zero snipes a big die and keeps save valid',()=>{const g=create({cast:[1,4,5,2]});assert(useSkill(g,0,{target:1,zone:'hand',big:true}));assert.equal(g.players[1].bigLost,1);assert(validSave(g));});
test('rematch reproduces complete four-round outcomes and JSON restore preserves randomness',()=>{
 const start=create(),end=play(start),again=play(rematch(end));assert.deepEqual(again,end);
 const g=create();rollDice(g);const copy=JSON.parse(JSON.stringify(g));assert.deepEqual(play(g),play(copy));assert.equal(rematch(createGame()),null);
});
test('dice streams are independent of other actors, skill streams and read-only previews',()=>{
 const a=create(),b=create();gameRandom(a,'dice:1:1')();gameRandom(a,'magic:1:1')();rollDice(a);rollDice(b);assert.deepEqual(a.roll,b.roll);
 const before=JSON.stringify(a);forecastStanding(a,a.roll[0]);finalRoundInfo(a,a.roll[0]);assert.equal(JSON.stringify(a),before);const copy=JSON.parse(before);copy.random.seed=-1;assert.equal(validSave(copy),false);
});
test('fourth-round forecast never reports a shared first place as an overtake',()=>{
 const g=create({rules:'classic'});g.round=4;g.players[1].cash=10000;g.players[1].notes=1;g.tables.forEach(t=>{t.notes=[10000,10000];t.counts=[0,0,0,0];});g.phase='choose';g.roll=[1];g.players[0].bigLeft=0;assert.equal(finalRoundInfo(g,1).overtake,false);g.tables[0].notes=[20000,10000];assert.equal(finalRoundInfo(g,1).overtake,true);
});
test('180 full games across mixed rosters and all casino modes conserve money, dice and saves',()=>{
 for(const rules of ['classic','half','all'])for(let seed=0;seed<60;seed++){const cast=[0,1,2,3,4,5].filter(x=>x!==seed%6&&x!==(seed+1)%6);play(create({rules,seed,cast,hero:seed%4}));}
});
