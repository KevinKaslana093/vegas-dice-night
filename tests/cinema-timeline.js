async(page)=>{
 await page.emulateMedia({reducedMotion:'no-preference'});await page.reload();await page.getByRole('button',{name:'继续上次牌局'}).click();await page.getByRole('button',{name:'声音 · 开'}).click();
 await page.clock.install();await page.clock.pauseAt(new Date());
 for(const actor of [1,2,3]){
  await page.setViewportSize({width:actor===3?390:1400,height:900});await page.locator('[data-preview="'+actor+'"]').click();
  await page.clock.runFor(2550);await page.screenshot({path:'output/playwright/v6-impact-'+actor+'.png'});
  const result=await page.locator('.cinema-result').innerText();if(!result.includes(actor===1?'出局':actor===2?'强制交易':'归我'))throw Error('Missing skill payoff');
  const paused=await page.locator('#cinema').getAttribute('data-phase');if(paused!=='result')throw Error('Wrong phase '+paused);await page.locator('.cinema-skip').click();
 }
 await page.clock.resume();return {sniperPayoff:true,tradePayoff:true,charmPayoff:true};
}
