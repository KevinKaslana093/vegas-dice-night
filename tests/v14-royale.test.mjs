import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,nextRound,rollDice,placeDice,skipTurn,canSkip,canSkill,useSkill,botSkill,passReaction,validSave,initialSupply,winners,scoreFor} from '../dist/core.mjs';
import {ROYAL_IDS,ROYAL_MODULES,royalAction,royalBotAction,royalOptions,royalClosed} from '../dist/royale.mjs';
import {balancedBot,resolveBalanced,tradeGroups} from '../dist/balance.mjs';
const fresh=(seed=1,extra={})=>createGame(1,Math.random,{seed,skills:true,balance:2,modulePool:'royal',bigDice:true,finalActions:true,...extra});
test('royal pool contains all 16 sides and never draws both sides of one board; unseen first',()=>{
 const g=fresh(1,{rules:'all'});assert.equal(ROYAL_IDS.length,16);assert.equal(new Set(g.tables.map(t=>ROYAL_MODULES.find(m=>m.id===t.effect).code[0])).size,6);assert.equal(g.players[0].left,10);assert.equal(initialSupply(g),34);assert.ok(validSave(g));
 for(const id of ROYAL_IDS){const p=fresh(12,{practice:id});assert.equal(p.tables[0].effect,id);assert.ok(validSave(p));}
});
test('all 16 modules complete seeded games, including every decision saved and reloaded',()=>{
 const visited=new Set();for(let seed=0;seed<64;seed++){
  let g=fresh(seed,{practice:ROYAL_IDS[seed%16],rules:seed%2?'all':'half',cast:seed%3===0?[4,5,6,3]:seed%3===1?[0,1,2,3]:[2,4,5,6]});let turns=0;
  while(g.phase!=='finished'){
   assert.ok(++turns<1500,`stalled ${seed} ${g.phase}`);
   assert.ok(validSave(g),`invalid seed=${seed} turn=${turns} phase=${g.phase} pending=${JSON.stringify(g.royale.pending)} players=${JSON.stringify(g.players)}`);g=JSON.parse(JSON.stringify(g));
   if(g.skillPending){assert.ok(resolveBalanced(g,balancedBot(g,g.skillPending.actor)));continue;}
   if(g.phase==='royale'){visited.add(g.royale.pending.kind);assert.ok(royalAction(g,royalBotAction(g)));continue;}
   if(g.phase==='reaction'){const c=botSkill(g,g.turn);if(c)assert.ok(useSkill(g,g.turn,c));else passReaction(g);continue;}
   if(g.phase==='settled'){nextRound(g);continue;}
   const c=botSkill(g,g.turn);if(c&&useSkill(g,g.turn,c))continue;
   if(g.phase==='ready')rollDice(g);else if(g.phase==='choose'){const faces=[...new Set(g.roll)].filter(f=>!royalClosed(g,f));if(faces.length)assert.ok(placeDice(g,faces[seed%faces.length]));else assert.ok(skipTurn(g));}
  }assert.ok(validSave(g));assert.ok(winners(g).length);
 }for(const id of ROYAL_IDS)assert.ok(visited.has(id)||['prime','badluck','blackbox'].includes(id),'not activated '+id);
});
test('boss requires a stake and at least two chips; groups have bounded weight',()=>{const g=fresh(4,{rules:'classic'});assert.deepEqual(tradeGroups(g,2),[]);const t=g.tables[0];t.counts[2]=1;g.players[2].left--;t.counts[1]=4;g.players[1].left-=4;const choices=tradeGroups(g,2);assert.ok(choices.length);assert.ok(choices.every(c=>c.small+c.large*2<=3));g.players[2].chips=1;assert.equal(canSkill(g,2),false);});
test('chips count in final scores',()=>{const g=fresh();g.players[1].chips=20;assert.equal(scoreFor(g,1),200000);assert.deepEqual(winners(g),[1]);});
test('160 four-round royal games conserve physical dice across all module combinations and skills',()=>{
 for(let seed=100;seed<260;seed++){
  let g=fresh(seed,{rules:'all',cast:seed%2?[0,1,2,3]:[4,5,6,2]});let guard=0;
  while(g.phase!=='finished'){
   assert.ok(++guard<3000,'infinite game '+seed);assert.ok(validSave(g),`seed ${seed} step ${guard} ${g.phase} ${g.royale.pending?.kind}`);
   if(g.skillPending){resolveBalanced(g,balancedBot(g,g.skillPending.actor));continue;}
   if(g.phase==='royale'){assert.ok(royalAction(g,royalBotAction(g)));continue;}
   if(g.phase==='settled'){nextRound(g);continue;}
   if(g.phase==='reaction'){const c=botSkill(g,g.turn);if(c)useSkill(g,g.turn,c);else passReaction(g);continue;}
   const c=botSkill(g,g.turn);if(c&&useSkill(g,g.turn,c))continue;
   if(g.phase==='ready')rollDice(g);else{const faces=[...new Set(g.roll)].filter(f=>!royalClosed(g,f));if(faces.length)placeDice(g,faces[(guard+seed)%faces.length]);else skipTurn(g);}
  }assert.ok(validSave(g));
 }
});
