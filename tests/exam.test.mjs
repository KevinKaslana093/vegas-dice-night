import test from 'node:test';
import assert from 'node:assert/strict';
import {createExam,examAction,examResult,validExam,examAdvice} from '../dist/exam.mjs';
import {validSave} from '../dist/core.mjs';
function action(s,type,extra={}){assert.equal(examAction(s,{type,...extra}),true,type);assert.ok(validSave(s.g));assert.ok(validExam(s));assert.deepEqual(JSON.parse(JSON.stringify(s)),s);}
function invest(s,face){action(s,'select',{face});action(s,'invest');}
test('graduation can be won through investments without using a skill',()=>{
 const s=createExam();assert.ok(validExam(s));assert.equal(examResult(s),'playing');invest(s,6);assert.equal(examResult(s),'playing');action(s,'roll');invest(s,6);assert.equal(examResult(s),'won');assert.equal(s.g.players[1].used,false);assert.ok(s.g.players[1].wallet.includes(80000));
 const snapshot=JSON.stringify(s);assert.equal(examAction(s,{type:'invest'}),false);assert.equal(JSON.stringify(s),snapshot);
});
test('a different winning route uses a snipe and places dice on different tables',()=>{
 const s=createExam();action(s,'skill',{choice:{target:2,zone:'table',face:6}});invest(s,2);action(s,'roll');invest(s,6);assert.equal(examResult(s),'won');assert.equal(s.g.players[2].lost,1);assert.equal(s.g.players[1].used,true);
});
test('bad decisions genuinely fail, explain the tie, and permit a fresh retry',()=>{
 const s=createExam();invest(s,2);action(s,'roll');invest(s,6);assert.equal(examResult(s),'lost');assert.ok(examAdvice(s).includes('撞数'));assert.ok(!s.g.players[1].wallet.includes(80000));assert.equal(examResult(createExam()),'playing');
});
test('reroll pays a chip, preserves remaining dice and returns the solo turn immediately',()=>{
 const s=createExam();action(s,'skip');assert.equal(s.g.players[1].chips,1);assert.equal(s.g.players[1].left,2);assert.equal(s.g.turn,1);assert.equal(s.g.phase,'ready');action(s,'roll');invest(s,6);assert.equal(examResult(s),'won');
});
test('hints do not spend resources; invalid shots and corrupt saves are rejected',()=>{
 const s=createExam(),snapshot=JSON.stringify(s.g);for(let i=0;i<4;i++)action(s,'hint');assert.equal(s.hints,3);assert.equal(JSON.stringify(s.g),snapshot);
 assert.equal(examAction(s,{type:'skill',choice:{target:2,zone:'hand'}}),false);assert.equal(JSON.stringify(s.g),snapshot);assert.equal(validExam({...s,rolls:-1}),false);assert.equal(validExam({...s,selected:5}),false);
});
