async(page)=>{
 const results=[];
 for(const width of [1440,390]){
  const ctx=await page.context().browser().newContext({viewport:{width,height:width>600?1000:844}}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  try{
   await p.goto('http://127.0.0.1:4317');const fixture=await p.evaluate(async()=>{const {createExam}=await import('./exam.mjs'),g=createExam().g;g.humans=4;g.players[2].used=false;return g;});
   await p.addInitScript(g=>{if(!sessionStorage.getItem('regular-decisions')){localStorage.setItem('vegas-night-save-v5',JSON.stringify(g));localStorage.setItem('vegas-night-prefs-v2',JSON.stringify({sound:false,motion:false,fast:true}));sessionStorage.setItem('regular-decisions','1');}},fixture);
   await p.reload();await p.locator('#modal [data-action="resume"]').click();const before=await p.evaluate(()=>localStorage.getItem('vegas-night-save-v5'));
   if(!(await p.locator('#app .endgame-strip').innerText()).includes('主动技能本轮尚未使用'))throw Error('Endgame hides unused skills');
   await p.locator('#app .dicebutton[data-face="6"]').click();if(await p.locator('#app .bet-preview .bet-will-tie').count()!==2)throw Error('Regular preview misses both tied players');
   if(before!==await p.evaluate(()=>localStorage.getItem('vegas-night-save-v5')))throw Error('Preview mutated saved game');
   await p.screenshot({path:`output/playwright/regular-preview-${width}.png`});await p.locator('#app [data-action="confirm"]').click();
   if(!(await p.locator('#app .endgame-strip').innerText()).includes('还能投 1 颗'))throw Error('Endgame did not update');
   await p.locator('#app [data-action="tutorial"]').click();await p.locator('[data-lesson="exit"]').click();await p.locator('#modal [data-action="exam"]').click();
   const saved=await p.evaluate(()=>localStorage.getItem('vegas-night-save-v5'));
   await p.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
   await p.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
   if(await p.locator('#modal[open]').count())throw Error('Normal pause intruded into exam');
   await p.locator('[data-exam-face="6"]').click();await p.locator('[data-exam="invest"]').click();await p.locator('[data-exam="exit"]').click();
   if(saved!==await p.evaluate(()=>localStorage.getItem('vegas-night-save-v5')))throw Error('Exam overwrote existing regular game');
   if(errors.length)throw Error(errors.join(';'));results.push({width,regularPreview:true,remainingDice:true,unusedSkillWarning:true,examIsolation:true});
  }finally{await ctx.close();}
 }
 return results;
}
