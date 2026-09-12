async(page)=>{
 const fixture=await page.evaluate(async()=>{const c=await import('/core.mjs');const g=c.createGame(1,Math.random,{hero:3,rules:'classic'});g.tables[0].effect='blackjack';c.rollDice(g,()=>0);c.placeDice(g,1);return g;});
 await page.addInitScript(g=>{if(!sessionStorage.getItem('mini-fixture-used')){localStorage.setItem('vegas-night-save-v4',JSON.stringify(g));sessionStorage.setItem('mini-fixture-used','1');}},fixture);
 await page.reload();await page.setViewportSize({width:390,height:844});
 await page.screenshot({path:'output/playwright/v4-characters.png',fullPage:true});
 await page.getByRole('button',{name:'继续上次牌局'}).click();
 await page.locator('[data-mini="draw"]').click();
 await page.reload();await page.getByRole('button',{name:'继续上次牌局'}).click();
 const total=await page.locator('.mini-total').innerText();if(!/1[3-8]/.test(total))throw Error('Mini progress lost');
 await page.screenshot({path:'output/playwright/v4-minigame.png',fullPage:true});
 await page.locator('[data-action="mini-pause"]').click();await page.getByRole('button',{name:'继续牌局',exact:true}).click();
 await page.locator('[data-mini="bank"]').click();await page.locator('[data-mini="continue"]').click();
 return {miniRestore:true,pauseResume:true,selectedBunny:true};
}
