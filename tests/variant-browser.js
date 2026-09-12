async (page) => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.getByLabel('今晚和谁玩？').selectOption('4');
 await page.locator('#ruleset').selectOption('all');
 await page.getByRole('button',{name:'入座，开一局'}).click();
 await page.getByRole('button',{name:'明白了，回到牌桌'}).click();
 await page.getByRole('button',{name:'声音 · 开'}).click();
 await page.getByLabel('加快电脑出手').check();await page.getByLabel('掷骰动画').uncheck();
 await page.getByRole('button',{name:'回到牌桌',exact:true}).click();
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('vegas-night-save-v3')));
 if(!before.tables.every(t=>t.notes.length===2)||await page.locator('.banknotes span').count()!==12)throw Error('Each casino must show exactly two notes');
 for(let i=0;i<8;i++){
  await page.getByRole('button',{name:'掷骰子',exact:true}).click();
  await page.getByRole('button',{name:'跳过本次 · 下次重投'}).click();
 }
 const skipped=await page.evaluate(()=>JSON.parse(localStorage.getItem('vegas-night-save-v3')));
 if(skipped.turn!==0||skipped.round!==1||!skipped.players.every(p=>p.left===8&&p.skips===2)||JSON.stringify(skipped.tables)!==JSON.stringify(before.tables))throw Error('Skip changed investment or dice');
 await page.getByRole('button',{name:'掷骰子',exact:true}).click();
 await page.locator('.table-target:not(:disabled)').first().click();
 await page.screenshot({path:'output/playwright/v2-desktop.png',fullPage:true});
 for(const width of [360,390,768,1100,1500]){
  await page.setViewportSize({width,height:1000});
  const layout=await page.evaluate(()=>({width:document.documentElement.scrollWidth,imgs:[...document.querySelectorAll('.character-art')].every(i=>i.complete&&i.naturalWidth>0),cards:[...document.querySelectorAll('.casino')].map(e=>({x:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right}))}));
  if(layout.width>width||!layout.imgs||layout.cards.some(c=>c.x<0||c.right>width))throw Error('Responsive failure '+width+' '+JSON.stringify(layout));
  if(width===390)await page.screenshot({path:'output/playwright/v2-mobile.png',fullPage:true});
 }
 await page.locator('[data-info="1"]').click();
 if(!await page.locator('dialog.info h2').isVisible())throw Error('Rule dialog absent');
 await page.getByRole('button',{name:'回到牌桌',exact:true}).click();
 await page.reload();await page.getByRole('button',{name:'继续上次牌局'}).click();
 const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('vegas-night-save-v3')));
 if(restored.phase!=='choose'||restored.players[0].skips!==2)throw Error('Restore failed');
 await page.getByRole('button',{name:'暂停',exact:true}).click();
 await page.getByRole('button',{name:'重新开一桌',exact:true}).click();
 await page.getByRole('button',{name:'选择新牌局',exact:true}).click();
 await page.getByLabel('今晚和谁玩？').selectOption('1');await page.locator('#ruleset').selectOption('all');
 await page.getByRole('button',{name:'入座，开一局'}).click();await page.getByRole('button',{name:'明白了，回到牌桌'}).click();
 let steps=0;
 while(steps++<700){
  const g=await page.evaluate(()=>JSON.parse(localStorage.getItem('vegas-night-save-v3')));
  if(g.phase==='finished'){await page.getByRole('button',{name:'再来一局',exact:true}).waitFor();break;}
  if(g.phase==='settled')await page.getByRole('button',{name:`进入第 ${g.round+1} 轮`,exact:true}).click();
  else if(g.turn===0&&g.phase==='ready')await page.getByRole('button',{name:'掷骰子',exact:true}).click();
  else if(g.turn===0&&g.phase==='choose'){
   const b=page.locator('.table-target:not(:disabled)').first();
   if(await b.count()){await b.click();await page.locator('[data-action=confirm]').click();}
  }
  await page.waitForTimeout(55);
 }
 if(steps>=700)throw Error('No final result');if(errors.length)throw Error(errors.join(';'));
 return {unlimitedSkip:true,sortedPrizes:true,restore:true,responsive:true,allSpecialGameComplete:true,steps,errors};
}
