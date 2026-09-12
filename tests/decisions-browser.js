async(page)=>{
 const results=[];
 for(const width of [1440,390,360]){
  const ctx=await page.context().browser().newContext({viewport:{width,height:width>600?1000:844}}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  try{
   await p.addInitScript(()=>localStorage.setItem('vegas-night-prefs-v2',JSON.stringify({sound:false,motion:false,fast:true})));
   await p.goto('http://127.0.0.1:4317');
   const original=await p.evaluate(()=>localStorage.getItem('vegas-night-save-v5'));
   await p.locator('#modal [data-action="exam"]').click();await p.locator('.exam-root').waitFor();
   if(!(await p.locator('.endgame-strip').last().innerText()).includes('只剩你还能下注'))throw Error('Solo endgame missing');
   const press=async a=>{await p.locator('.exam-root [data-exam="'+a+'"]').first().click();if(await p.locator('#cinema[open]').count())await p.evaluate(()=>document.querySelector('#cinema[open] .cinema-skip')?.click());};
   const choose=async face=>{await p.locator('.exam-root [data-exam-face="'+face+'"]').first().click();};
   await choose(6);if(await p.locator('.exam-root .bet-will-tie').count()!==2)throw Error('Preview missed tie');
   await p.screenshot({path:`output/playwright/decision-exam-${width}.png`});
   await press('exit');await p.reload();await p.locator('#modal [data-action="exam"]').click();if(await p.locator('.exam-root .bet-preview').count()!==1)throw Error('Exam selection not restored');
   await press('invest');await press('roll');await choose(6);await press('invest');await p.waitForFunction(()=>document.querySelector('.exam-root')?.dataset.result==='won');
   await p.screenshot({path:`output/playwright/decision-win-${width}.png`});
   await press('retry');await choose(2);await press('invest');await press('roll');await choose(6);await press('invest');await p.waitForFunction(()=>document.querySelector('.exam-root')?.dataset.result==='lost');
   if(!(await p.locator('.exam-coach').innerText()).includes('撞数'))throw Error('Failure has no explanation');
   await press('retry');await press('skill');await p.locator('[data-shot="table:2:6"]').click();await press('fire');await choose(2);await press('invest');await press('roll');await choose(6);await press('invest');await p.waitForFunction(()=>document.querySelector('.exam-root')?.dataset.result==='won');
   await press('finish');if(original!==await p.evaluate(()=>localStorage.getItem('vegas-night-save-v5')))throw Error('Exam overwrote main save');
   if(errors.length)throw Error(errors.join(';'));results.push({width,preview:true,solo:true,twoWinningRoutes:true,failure:true,resume:true,saveIsolated:true});
  }finally{await ctx.close();}
 }
 return results;
}
