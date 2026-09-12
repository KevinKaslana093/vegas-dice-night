import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,rollDice,outcome,previewTable,MINIGAMES,SPECIALS} from '../dist/core.mjs';
import {analyzeBet,betPreviewMarkup,endgameInfo,endgameMarkup} from '../dist/decisions.mjs';
test('preview shows everyone’s dice, money and tie changes without mutation',()=>{
 const g=createGame(4,()=>.5,{hero:1,rules:'classic'}),t=g.tables[5];t.notes=[80000,50000];t.counts=[0,3,4,0];g.players[1].left=5;let i=0;rollDice(g,()=>i++<2?.99:.2);
 const snapshot=JSON.stringify(g),p=analyzeBet(g,6);assert.equal(p.count,2);assert.equal(p.players[1].beforeDice,3);assert.equal(p.players[1].afterDice,5);assert.equal(p.players[1].beforeCash,50000);assert.equal(p.players[1].afterCash,80000);assert.equal(p.players[2].afterCash-p.players[2].beforeCash,-30000);
 assert.ok(betPreviewMarkup(g,6).includes('下注预览 · 尚未确认'));assert.equal(JSON.stringify(g),snapshot);
 g.roll=[6,2,2,2,2];assert.deepEqual(analyzeBet(g,6).ties,[1,2]);assert.equal(analyzeBet(g,6).players[1].afterCash,0);assert.equal(analyzeBet(g,4),null);
});
test('all casino variants preview actual ranking; new minigame bonus is explicitly uncertain',()=>{
 const g=createGame(4,()=>.5,{hero:1,rules:'all'});g.phase='choose';g.roll=[2,2];const t=g.tables[1];t.counts=[1,2,4,3];t.bonus=[0,1,0,0];
 for(const effect of ['classic',...SPECIALS]){t.effect=effect;const p=analyzeBet(g,2),expected=outcome(previewTable(g,2));assert.deepEqual(p.ties,expected.ties);for(const row of p.players)assert.equal(row.afterCash,expected.awards.filter(a=>a.player===row.player).reduce((s,a)=>s+a.amount,0));assert.equal(p.miniPending,MINIGAMES.includes(effect));}
 t.effect='blackjack';assert.ok(betPreviewMarkup(g,2).includes('加成可能再次改变'));t.played[1]=true;assert.equal(analyzeBet(g,2).miniPending,false);
});
test('endgame distinguishes one player, two players, remaining skills and pending minigame',()=>{
 const g=createGame(1,()=>.5,{hero:1,skills:true});assert.equal(endgameInfo(g),null);
 g.players.forEach((p,i)=>p.left=i===1?2:0);assert.equal(endgameInfo(g).kind,'solo');assert.ok(endgameMarkup(g).includes('只剩你还能下注'));assert.ok(endgameMarkup(g).includes('主动技能本轮尚未使用'));
 g.players[2].left=1;assert.equal(endgameInfo(g).kind,'duel');g.players[3].left=1;assert.equal(endgameInfo(g).kind,'last');
 g.players.forEach(p=>p.left=0);g.phase='minigame';assert.equal(endgameInfo(g).kind,'mini');g.phase='settled';assert.equal(endgameInfo(g),null);
});
