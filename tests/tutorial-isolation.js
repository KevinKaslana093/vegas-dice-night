async(page)=>{
 const browser=page.context().browser(),ctx=await browser.newContext({viewport:{width:390,height:844}}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto('http://127.0.0.1:4317');
  const fixture=await p.evaluate(async()=>{const c=await import('/core.mjs');const g=c.createGame(1,()=>.34,{hero:2,skills:true});c.rollDice(g,()=>.7);return JSON.stringify(g);});
  await p.addInitScript(v=>{if(!sessionStorage.getItem('isolation')){localStorage.setItem('vegas-night-save-v5',v);localStorage.setItem('vegas-night-prefs-v2',JSON.stringify({sound:false,motion:false}));sessionStorage.setItem('isolation','1');}},fixture);
  await p.reload();await p.locator('#modal [data-action="tutorial"]').click();
  for(let i=0;i<5;i++){await p.locator('.lesson-root .lesson-hot').first().click();if(await p.locator('#cinema[open]').count())await p.evaluate(()=>document.querySelector('#cinema[open] .cinema-skip')?.click());}
  await p.locator('[data-lesson="exit"]').click();await p.locator('#modal [data-action="resume"]').click();
  if(await p.evaluate(()=>localStorage.getItem('vegas-night-save-v5'))!==fixture)throw Error('Existing chosen dice/save changed');
  await p.locator('#app [data-action="tutorial"]').click();if(await p.locator('.lesson-root').getAttribute('data-step')!=='5')throw Error('Resume lost progress');
  await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});await p.waitForTimeout(700);
  await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
  if(await p.locator('#modal[open]').count())throw Error('Normal pause dialog intruded into tutorial');
  if(await p.evaluate(()=>localStorage.getItem('vegas-night-save-v5'))!==fixture)throw Error('Hidden tutorial overwrote normal save');
  await p.goto('file:///C:/Users/34228/Documents/Codex/2026-09-11/w/outputs/%E6%8B%89%E6%96%AF%E7%BB%B4%E5%8A%A0%E6%96%AF-%E9%AA%B0%E5%AD%90%E4%B9%8B%E5%A4%9C.html');
  await p.locator('#modal [data-action="tutorial"]').click();
  for(let i=0;i<24;i++){
   await p.waitForFunction(s=>document.querySelector('.lesson-root')?.dataset.step===String(s),i);
   if(i===10||i===23)await p.screenshot({path:`output/playwright/tutorial-offline-${i}.png`});
   await p.locator('.lesson-root .lesson-hot').first().click();if(await p.locator('#cinema[open]').count())await p.evaluate(()=>document.querySelector('#cinema[open] .cinema-skip')?.click());
  }
  await p.waitForFunction(()=>[...document.querySelectorAll('#modal img')].every(img=>img.complete&&img.naturalWidth));
  if(errors.length)throw Error(errors.join(';'));
  return {existingSaveUnchanged:true,visibilitySafe:true,offlineFullTutorial:true,assetsLoaded:true};
 }finally{await ctx.close();}
}
