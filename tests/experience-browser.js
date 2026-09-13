async(parent)=>{
 const reports=[];
 for(const width of [1440,390,360,844]){
  const height=width===844?390:width>700?1000:844,ctx=await parent.context().browser().newContext({viewport:{width,height},acceptDownloads:true}),p=await ctx.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  try{
   await p.addInitScript(()=>{if(!localStorage.getItem('vegas-night-prefs-v2'))localStorage.setItem('vegas-night-prefs-v2',JSON.stringify({fast:true,pace:'quick',sound:false,music:false,motion:false,cutins:false,handoff:false}));});
   await p.goto('http://127.0.0.1:4317');await p.locator('.lobby-journey').click();await p.locator('#modal.journey').waitFor();
   if(await p.locator('.badge-grid article').count()!==12)throw Error('Missing badges');if(await p.locator('[data-contract]').count()!==3)throw Error('Missing contracts');
   await p.screenshot({path:'output/playwright/journey-'+width+'.png'});
   await p.locator('[data-contract="break"]').click();await p.locator('#app [data-action="roll"]').waitFor();
   const start=await p.evaluate(()=>JSON.parse(localStorage.getItem('vegas-night-save-v5')));if(start.contract!=='break'||start.random.seed!==13002)throw Error('Fixed game mismatch');
   await p.locator('#app [data-action="roll"]').click();await p.waitForFunction(()=>!document.querySelector('#cinema[open]'));const first=p.locator('#app .dicebutton').first();await first.click();
   if(!await p.locator('.bet-quick').isVisible())throw Error('No compact preview');const save=await p.evaluate(()=>JSON.parse(localStorage.getItem('vegas-night-save-v5')));
   await p.screenshot({path:'output/playwright/experience-table-'+width+'.png'});
   await p.locator('#app [data-action="bet-detail"]').click();if(!await p.locator('#modal .bet-preview').isVisible())throw Error('Missing detailed preview');await p.locator('#modal [data-action="close"]').click();
   await p.locator('#app [data-action="pause"]').click();await p.locator('#modal [data-action="feedback"]').click();await p.locator('[name="unclear"]').fill('测试：大骰计数已看懂');await p.locator('[data-action="save-feedback"]').click();
   const download=p.waitForEvent('download');await p.locator('[data-action="export-feedback"]').click();if(!(await download).suggestedFilename().endsWith('.json'))throw Error('Export failed');await p.locator('#modal [data-action="close"]').click();
   await p.locator('#app [data-action="settings"]').click();await p.locator('[data-pace="full"]').click();if(!await p.locator('[data-pace="full"][aria-pressed="true"]').count())throw Error('Pace not saved');await p.locator('[data-pace="quick"]').click();await p.locator('#modal [data-action="close"]').click();
   await p.reload();await p.locator('#modal [data-action="resume"]').click();const after=await p.evaluate(()=>JSON.parse(localStorage.getItem('vegas-night-save-v5')));if(JSON.stringify(after.roll)!==JSON.stringify(save.roll)||after.journey.id!==save.journey.id)throw Error('Resume changed roll or match identity');
   const feedback=await p.evaluate(()=>JSON.parse(localStorage.getItem('vegas-night-journey-v1')).feedback);if(feedback.length!==1)throw Error('Feedback persistence');
   const overflow=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);if(overflow)throw Error('Horizontal overflow '+width);
   if(errors.length)throw Error(errors.join(';'));reports.push({width,height,journey:true,contract:true,compactPreview:true,feedbackExport:true,pace:true,resume:true,errors});
  }finally{await ctx.close();}
 }
 return reports;
}
