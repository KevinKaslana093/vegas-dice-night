// Exploratory simulation of current bot policies, not an estimate of human win rates.
import fs from 'node:fs';
import {createGame,nextRound,rollDice,placeDice,skipTurn,botShouldSkip,botChoice,botSkill,useSkill,miniAction,miniBotAction,passReaction,outcome,sum,winners,NAMES} from '../dist/core.mjs';
const count=Number(process.argv[2]||150),minimum=Number(process.argv[3]||1),out=process.argv[4],hold=process.argv[5]==='hold';
const rng=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
const rows=NAMES.slice(0,4).map(name=>({name,wins:0,cash:0,uses:0,immediateGain:0,lateLeaderChanges:0,oneChipUses:0}));let games=0;
const position=g=>{const money=g.players.map(p=>p.cash);if(!['settled','finished'].includes(g.phase))g.tables.forEach(t=>outcome(t).awards.forEach(a=>money[a.player]+=a.amount));return money;};
function skill(g,actor,r){if(hold&&actor<3&&sum(g.players.map(p=>p.left))>0)return false;if(actor===2&&g.players[actor].chips<minimum)return false;const c=botSkill(g,actor,r);if(!c)return false;const before=position(g),oldLeader=before.indexOf(Math.max(...before)),chips=g.players[actor].chips,late=sum(g.players.map(p=>p.left))<=5;
 if(!useSkill(g,actor,c,r))return false;const after=position(g),row=rows[actor];row.uses++;row.immediateGain+=after[actor]-before[actor];if(actor===2&&chips===1)row.oneChipUses++;if(late&&after.indexOf(Math.max(...after))!==oldLeader)row.lateLeaderChanges++;return true;
}
for(const rules of ['classic','half','all'])for(let seed=1;seed<=count;seed++)for(let hero=0;hero<4;hero++){
 const r=rng(seed),g=createGame(1,r,{hero,skills:true,bigDice:true,finalActions:true,rules});games++;
 for(let round=1;round<=4;round++){
  let guard=0;while(!['settled','finished'].includes(g.phase)){
   if(++guard>600)throw Error('Non-terminating simulation');
   if(g.phase==='reaction'){if(!skill(g,g.turn,r))passReaction(g);continue;}
   if([1,2,3].some(i=>skill(g,i,r)))continue;
   if(g.phase==='minigame')miniAction(g,miniBotAction(g),r);else if(g.phase==='ready')rollDice(g,r);else if(botShouldSkip(g,r))skipTurn(g);else placeDice(g,botChoice(g,r),r);
  }
  skill(g,3,r);if(round<4)nextRound(g,r);
 }
 const win=winners(g);win.forEach(i=>rows[i].wins+=1/win.length);rows.forEach((row,i)=>row.cash+=g.players[i].cash);
}
const report={games,seedsPerMode:count,startingSeats:'all four',modes:['classic','half','all'],tradeMinimum:minimum,limitation:'Current bot policies only; not human skill balance. Skill gain is immediate wallet + provisional casino change, not causal final value.',roles:rows.map(x=>({...x,winRate:+(x.wins/games*100).toFixed(2),averageCash:Math.round(x.cash/games),usesPerGame:+(x.uses/games).toFixed(2),gainPerUse:x.uses?Math.round(x.immediateGain/x.uses):null}))};
if(out)fs.writeFileSync(out,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
