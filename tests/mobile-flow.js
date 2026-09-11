async (page) => {
  await page.reload();
  await page.getByRole('button',{name:'继续上次牌局'}).waitFor();
  await page.getByRole('button',{name:'继续上次牌局'}).click();
  const restored=await page.evaluate(()=>JSON.parse(localStorage.getItem('vegas-night-save-v1')));
  if(restored.phase!=='finished')throw Error('Finished game not restored');
  await page.getByRole('button',{name:'查看结算'}).click();
  await page.getByRole('button',{name:'再来一局',exact:true}).click();
  await page.getByLabel('今晚和谁玩？').selectOption('4');
  await page.getByRole('button',{name:'开一桌',exact:true}).click();
  await page.getByRole('button',{name:'明白了，回到牌桌'}).click();
  await page.setViewportSize({width:390,height:844});
  await page.getByRole('button',{name:'掷骰子',exact:true}).click();
  await page.locator('.casino.available').first().waitFor();
  await page.locator('.casino.available').first().click();
  await page.screenshot({path:'output/playwright/mobile.png',fullPage:true});
  await page.locator('[data-action=confirm]').click();
  const g=await page.evaluate(()=>JSON.parse(localStorage.getItem('vegas-night-save-v1')));
  if(g.humans!==4||g.turn!==1)throw Error('Hotseat turn failed');
  await page.getByRole('button',{name:'暂停',exact:true}).click();
  const before=await page.evaluate(()=>localStorage.getItem('vegas-night-save-v1'));
  await page.waitForTimeout(900);
  if(before!==await page.evaluate(()=>localStorage.getItem('vegas-night-save-v1')))throw Error('Pause changed state');
  await page.getByRole('button',{name:'继续牌局'}).click();
  const widths=[];
  for(const width of [360,390,768,1440]){
    await page.setViewportSize({width,height:900});
    const content=await page.evaluate(()=>document.documentElement.scrollWidth);
    if(content>width)throw Error(`Horizontal overflow ${width}: ${content}`);
    widths.push(width);
  }
  await page.getByRole('button',{name:'掷骰子',exact:true}).click();
  await page.locator('.casino.available').first().waitFor();
  await page.locator('.casino.available').first().click();
  await page.screenshot({path:'output/playwright/desktop.png',fullPage:true});
  console.log(JSON.stringify({restore:true,hotseat:true,pause:true,widths}));
}
