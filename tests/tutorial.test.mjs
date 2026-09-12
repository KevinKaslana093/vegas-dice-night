import test from 'node:test';
import assert from 'node:assert/strict';
import {createLesson,advanceLesson,LESSON_STEPS} from '../dist/tutorial.mjs';
import {validSave,outcome} from '../dist/core.mjs';
test('tutorial is a legal full round and resumes deterministically at every step',()=>{
 const l=createLesson();assert.ok(l.g.tables[5].notes[0]>l.g.tables[5].notes[1],'lesson distinguishes large and small notes');
 for(let s=0;s<LESSON_STEPS.length;s++){
  assert.equal(l.step,s);assert.ok(validSave(l.g),'Invalid lesson state '+s);
  assert.deepEqual(createLesson(s),l,'Resume mismatch '+s);
  const snapshot=JSON.stringify(l);assert.equal(advanceLesson(l,'wrong'),false);assert.equal(JSON.stringify(l),snapshot);
  if(s<LESSON_STEPS.length-1)assert.equal(advanceLesson(l,LESSON_STEPS[s][0]),true);
 }
 assert.equal(l.g.phase,'settled');assert.equal(l.g.players[1].notes,2);assert.equal(l.g.players[1].chips,1);
 assert.equal(l.g.players[2].lost,1);assert.equal(l.g.players[1].used,true);assert.equal(l.g.tables[1].bonus[1],1);
 assert.equal(advanceLesson(l,'finish'),false);
});
test('lesson demonstrates tie, targeted removal, paid skip and actual payouts',()=>{
 const tie=createLesson(6);assert.deepEqual(outcome(tie.g.tables[5]).ties,[1,2]);assert.equal(outcome(tie.g.tables[5]).awards[0].player,3);
 const shot=createLesson(11);assert.deepEqual(outcome(shot.g.tables[5]).ties,[]);assert.deepEqual(outcome(shot.g.tables[5]).awards.map(a=>a.player),[1,2]);
 const before=createLesson(13),after=createLesson(14);assert.equal(after.g.players[1].left,before.g.players[1].left);assert.equal(after.g.players[1].chips,before.g.players[1].chips-1);assert.equal(after.g.turn,2);assert.deepEqual(after.g.tables,before.g.tables);
 const final=createLesson(21).g;assert.equal(final.players[1].cash,final.tables[5].notes[0]+final.tables[1].notes[0]);assert.equal(final.players[1].left,0);
});
