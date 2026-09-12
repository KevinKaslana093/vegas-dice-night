async(page)=>{
 const fixture=await page.evaluate(async()=>{const c=await import('/core.mjs');const g=c.createGame(1,Math.random,{hero:0,skills:true,rules:'classic'});g.turn=1;for(let i=0;i<4;i++){c.rollDice(g,()=>0);if(i===3)g.roll=[1,1,1,1,1,1,1,1,2];c.placeDice(g,1);}g.move=12;g.tables[0].effect='insurance';return g;});
 await page.addInitScript(g=>{if(!sessionStorage.getItem('v5-edge-used-2')){localStorage.setItem('vegas-night-save-v5',JSON.stringify(g));sessionStorage.setItem('v5-edge-used-2','1');}},fixture);
 await page.reload();await page.getByRole('button',{name:'继续上次牌局'}).click();
 await page.getByRole('button',{name:'进入第 2 轮',exact:true}).waitFor();
 await page.getByRole('button',{name:'进入第 2 轮',exact:true}).click();
 await page.getByRole('button',{name:'暂停',exact:true}).click();await page.getByRole('button',{name:'重新开一桌',exact:true}).click();await page.getByRole('button',{name:'选择新牌局',exact:true}).click();
 await page.locator('[data-pick="0"]').click();await page.locator('#mode').selectOption('4');await page.locator('#edition').selectOption('skills');
 await page.setViewportSize({width:360,height:900});await page.screenshot({path:'output/playwright/v5-role-select.png',fullPage:true});
 await page.getByRole('button',{name:'入座，开一局'}).click();await page.getByRole('button',{name:'明白了，回到牌桌'}).click();
 await page.getByRole('button',{name:'掷骰子',exact:true}).click();
 if(await page.locator('.dice-row .dicebutton').count()!==9)throw Error('Missing ninth die');
 if(await page.evaluate(()=>document.documentElement.scrollWidth)>360)throw Error('Nine dice overflow');
 return {botLastDieSummary:true,nineDiceMobile:true};
}
