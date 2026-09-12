async(page)=>{
 const ctx=await page.context().browser().newContext({viewport:{width:390,height:844}}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.goto('file:///C:/Users/34228/Documents/Codex/2026-09-11/w/outputs/%E6%8B%89%E6%96%AF%E7%BB%B4%E5%8A%A0%E6%96%AF-%E9%AA%B0%E5%AD%90%E4%B9%8B%E5%A4%9C.html');
  await p.locator('#mode').selectOption('4');await p.getByRole('button',{name:'入座，开一局'}).click();await p.getByRole('button',{name:'明白了，回到牌桌'}).click();await p.locator('.cinema-skip').click();
  await p.getByRole('button',{name:'声音 · 开'}).click();await p.locator('[data-preview="3"]').click();
  await p.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
  const phase=await p.locator('#cinema').getAttribute('data-phase');await p.waitForTimeout(3200);if(await p.locator('#cinema').getAttribute('data-phase')!==phase)throw Error('Hidden scene advanced');
  await p.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});await p.locator('.cinema-skip').click();
  await p.getByRole('button',{name:'回到牌桌',exact:true}).click();await p.getByRole('button',{name:'掷骰子',exact:true}).click();
  const before=await p.evaluate(()=>localStorage.getItem('vegas-night-save-v5'));await p.reload();await p.getByRole('button',{name:'继续上次牌局'}).click();if(before!==await p.evaluate(()=>localStorage.getItem('vegas-night-save-v5')))throw Error('Reload altered dice');
  const all=await p.locator('.character-art').evaluateAll(es=>es.every(e=>e.complete&&e.naturalWidth));if(!all||errors.length)throw Error('Offline assets or code failed '+errors.join(';'));
  return {offline:true,hiddenPaused:true,reloadSameDice:true,errors};
 }finally{await ctx.close();}
}
