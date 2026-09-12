async(page)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.locator('#mode').selectOption('4');await page.locator('#ruleset').selectOption('classic');await page.locator('[data-pick="1"]').click();
 await page.getByRole('button',{name:'入座，开一局'}).click();await page.getByRole('button',{name:'明白了，回到牌桌'}).click();
 const skip=async()=>{if(await page.locator('#cinema[open]').count())await page.locator('.cinema-skip').click();};
 await skip();await page.getByRole('button',{name:'声音 · 开'}).click();
 await page.locator('[data-pref="motion"]').check();await page.locator('[data-pref="cutins"]').check();await page.locator('[data-pref="fast"]').uncheck();
 const before=await page.evaluate(()=>localStorage.getItem('vegas-night-save-v5'));
 for(const actor of [0,1,2,3]){
  await page.setViewportSize({width:actor===3?390:1400,height:900});await page.locator('[data-preview="'+actor+'"]').click();
  await page.waitForTimeout(750);await page.screenshot({path:'output/playwright/v6-cutin-'+actor+'.png'});
  if(!await page.locator('.cutin-face').evaluate(e=>e.complete&&e.naturalWidth>0))throw Error('Missing portrait '+actor);
  await page.waitForTimeout(1200);await page.screenshot({path:'output/playwright/v6-result-'+actor+'.png'});await skip();
 }
 if(await page.evaluate(()=>localStorage.getItem('vegas-night-save-v5'))!==before)throw Error('Demo mutated game');
 await page.getByRole('button',{name:'回到牌桌',exact:true}).click();
 await page.getByRole('button',{name:'掷骰子',exact:true}).click();
 const g=await page.evaluate(()=>JSON.parse(localStorage.getItem('vegas-night-save-v5'))),visible=await page.locator('.cube').evaluateAll(es=>es.map(e=>Number(e.dataset.result)));
 if(JSON.stringify(g.roll)!==JSON.stringify(visible))throw Error('Animation differs from rolled dice');
 await page.waitForTimeout(750);await page.screenshot({path:'output/playwright/v6-dice-mobile.png'});await skip();
 await page.locator('.ability-bar [data-skill="1"]').click();await page.locator('[data-target="1"]').click();await page.locator('[data-skillzone="roll"]').first().click();await page.getByRole('button',{name:'确认狙击'}).click();
 const shot=await page.evaluate(()=>localStorage.getItem('vegas-night-save-v5'));await page.keyboard.press('Escape');await page.waitForTimeout(100);if(shot!==await page.evaluate(()=>localStorage.getItem('vegas-night-save-v5')))throw Error('Skip repeated skill');
 await page.getByRole('button',{name:'继续牌局',exact:true}).click();
 await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'声音 · 开'}).click();await page.locator('[data-preview="2"]').click();await page.waitForTimeout(500);if(await page.locator('#cinema[open]').count())throw Error('Reduced motion stuck');
 if(errors.length)throw Error(errors.join(';'));return {portraits:4,demoNoMutation:true,diceExact:true,skipExactlyOnce:true,reducedMotion:true,errors};
}
