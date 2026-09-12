async(page)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.evaluate(()=>sessionStorage.removeItem('tutorial-qa'));
 await page.addInitScript(()=>{if(!sessionStorage.getItem('tutorial-qa')){localStorage.removeItem('vegas-night-tutorial-v1');localStorage.setItem('vegas-night-prefs-v2',JSON.stringify({fast:true,motion:false,sound:false}));sessionStorage.setItem('tutorial-qa','1');}});
 await page.reload();
 const normal=await page.evaluate(()=>localStorage.getItem('vegas-night-save-v5'));
 for(const size of [{width:1440,height:1050},{width:390,height:844},{width:360,height:740}]){
  await page.setViewportSize(size);
  await page.locator('#modal [data-action="tutorial"]').click();
  if(await page.locator('.lesson-root').getAttribute('data-step')==='23')await page.locator('[data-lesson="replay"]').click();
  for(let step=0;step<24;step++){
   await page.waitForFunction(s=>document.querySelector('.lesson-root')?.dataset.step===String(s),step);
   if(step===6&&size.width===1440){await page.locator('[data-lesson="exit"]').click();await page.reload();await page.locator('#modal [data-action="tutorial"]').click();await page.waitForFunction(()=>document.querySelector('.lesson-root')?.dataset.step==='6');}
   const hot=page.locator('.lesson-root .lesson-hot').first();await hot.waitFor({state:'visible'});await page.waitForTimeout(65);
   const obstruction=await hot.evaluate(el=>{const r=el.getBoundingClientRect(),at=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !el.contains(at);});
   if(obstruction)throw Error(`Action obscured at ${size.width}, step ${step}`);
   if([0,6,10,13,18,21,23].includes(step))await page.screenshot({path:`output/playwright/tutorial-${size.width}-${step}.png`});
   if(step===0){await page.keyboard.press('6');if(await page.locator('.lesson-root').getAttribute('data-step')!=='0')throw Error('Keyboard bypassed guided action');}
   if(step===23)break;
   await hot.click();
   if(await page.locator('#cinema[open]').count())await page.evaluate(()=>document.querySelector('#cinema[open] .cinema-skip')?.click());
  }
  await page.locator('[data-lesson="finish"]').click();
  await page.locator('.exam-root').waitFor();
  await page.locator('.exam-root [data-exam="exit"]').click();
  if(await page.locator('#modal [data-pick="1"]').getAttribute('aria-pressed')!=='true')throw Error('Cowboy not selected on graduation');
  if(await page.evaluate(()=>localStorage.getItem('vegas-night-save-v5'))!==normal)throw Error('Normal save overwritten');
 }
 if(errors.length)throw Error(errors.join('\n'));
 console.log('Tutorial passed: 24 steps × desktop/390px/360px; exit, reload, resume, replay, graduation, normal save isolation, no covered actions or browser errors.');
}
