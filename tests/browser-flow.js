async (page) => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.getByRole('button',{name:'声音 · 开',exact:true}).click();
  await page.getByLabel('加快电脑出手').check();
  await page.getByLabel('掷骰动画').uncheck();
  await page.getByRole('button',{name:'回到牌桌',exact:true}).click();
  let steps=0;
  while(steps++<400){
    const g=await page.evaluate(()=>JSON.parse(localStorage.getItem('vegas-night-save-v1')));
    if(g.phase==='finished'){await page.getByRole('button',{name:'再来一局',exact:true}).waitFor();break;}
    if(g.phase==='settled'){
      await page.getByRole('button',{name:`进入第 ${g.round+1} 轮`,exact:true}).click();
    }else if(g.turn<g.humans&&g.phase==='ready'){
      await page.getByRole('button',{name:'掷骰子',exact:true}).click();
    }else if(g.turn<g.humans&&g.phase==='choose'){
      const choice=page.locator('.casino.available').first();
      if(await choice.count()){await choice.click();await page.locator('[data-action=confirm]').click();}
    }
    await page.waitForTimeout(90);
  }
  if(steps>=400)throw Error('Game did not finish');
  const result=await page.evaluate(()=>JSON.parse(localStorage.getItem('vegas-night-save-v1')));
  if(errors.length)throw Error(errors.join(';'));
  console.log(JSON.stringify({round:result.round,phase:result.phase,players:result.players,steps,errors}));
}
