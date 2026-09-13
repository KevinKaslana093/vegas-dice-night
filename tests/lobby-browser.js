async(page)=>{
 const errors=[],results=[];const base='http://127.0.0.1:4317';
 for(const width of [1440,390,360]){
  const ctx=await page.context().browser().newContext({viewport:{width,height:width>700?960:844}}),p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>localStorage.setItem('vegas-night-prefs-v2',JSON.stringify({sound:false,motion:false,fast:true,cutins:false})));
  await p.goto(base);await p.locator('#modal.lobby').waitFor();await p.screenshot({path:'output/playwright/lobby-'+width+'.png'});
  await p.locator('.lobby-start').click();await p.locator('.hero-stage').waitFor();
  for(let i=1;i<=6;i++){await p.locator('.hero-next').click();if(await p.locator('.hero-stage').getAttribute('data-hero-stage')!==String(i%6))throw Error('hero carousel');}
  await p.locator('[data-pick="4"]').click();await p.screenshot({path:'output/playwright/dealer-'+width+'.png'});
  await p.locator('summary').click();await p.locator('#mode').selectOption('4');await p.locator('#ruleset').selectOption('classic');await p.locator('[data-action="start"]').click();await p.locator('#modal [data-action="close"]').click();
  await p.waitForTimeout(400);await p.locator('#app [data-action="roll"]').click();await p.waitForTimeout(400);
  await p.locator('#app [data-skill="0"]:visible').last().click();await p.locator('[data-rig-index="0"]').click();
  const old=await p.evaluate(()=>JSON.parse(localStorage.getItem('vegas-night-save-v5')).roll[0]);await p.locator('[data-rig-value="'+(old%6+1)+'"]').click();await p.locator('[data-action="skill-confirm"]').click();await p.locator('[data-action="skill-close"]').click();
  const saved=await p.evaluate(()=>JSON.parse(localStorage.getItem('vegas-night-save-v5')));if(saved.players[0].role!==4||!saved.players[0].used||saved.roll[0]!==old%6+1)throw Error('dealer UI failed');
  await p.locator('.dicebutton').first().click();await p.waitForTimeout(150);
  if(width<700){await p.locator('[data-action="bet-detail"]').click();await p.locator('#modal.bet-detail').waitFor();await p.screenshot({path:'output/playwright/drawer-'+width+'.png'});await p.locator('[data-action="confirm-bet"]').click();}
  else await p.locator('#app [data-action="confirm"]').click();
  await p.screenshot({path:'output/playwright/table-'+width+'.png'});
  const state=await p.evaluate(()=>({g:JSON.parse(localStorage.getItem('vegas-night-save-v5')),overflow:document.documentElement.scrollWidth>innerWidth+1,control:document.querySelector('.control').getBoundingClientRect().toJSON(),height:innerHeight}));
  if(state.g.players[0].left>=8||state.overflow)throw Error('bet or horizontal overflow '+width);if(width<700&&state.control.bottom>state.height+1)throw Error('dock below viewport');
  await p.reload();await p.locator('.lobby-continue').click();if(await p.locator('#modal').evaluate(e=>e.open))throw Error('resume stayed in lobby');
  const broken=await p.locator('img').evaluateAll(imgs=>imgs.filter(i=>i.complete&&!i.naturalWidth).map(i=>i.src));if(broken.length)throw Error('broken images '+broken);
  results.push({width,hero:state.g.players[0].name,remaining:state.g.players[0].left,overflow:state.overflow});await ctx.close();
 }
 if(errors.length)throw Error(errors.join('\n'));console.log(JSON.stringify({results,errors}));
}

