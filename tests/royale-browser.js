async(page)=>{
 const results=[];
 for(const width of [1440,390,360]){
  const ctx=await page.context().browser().newContext({viewport:{width,height:width>600?1050:844}}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  try{
   await p.addInitScript(()=>localStorage.setItem('vegas-night-prefs-v2',JSON.stringify({sound:false,motion:false,fast:true,cutins:false})));
   await p.goto('http://127.0.0.1:4317');await p.locator('[data-pick="1"]').click();await p.locator('#mode').selectOption('4');await p.locator('#ruleset').selectOption('classic');await p.locator('[data-action="start"]').click();await p.locator('#modal [data-action="close"]').click();
   await p.locator('#app [data-action="roll"]').click();await p.waitForFunction(()=>!document.querySelector('#cinema[open]'));
   const large=p.locator('#app .dicebutton.big-die');if(await large.count()!==1)throw Error('Must render exactly one big die');await large.click();
   if(!(await p.locator('.bet-preview').innerText()).includes('含大骰'))throw Error('Missing weighted preview');await p.screenshot({path:`output/playwright/royale-big-${width}.png`});
   await p.locator('#app [data-skill="1"]').click();await p.locator('[data-target="1"]').click();await p.locator('[data-skillzone="roll"][data-skillindex="0"]').click();await p.locator('[data-action="skill-confirm"]').click();await p.locator('[data-action="skill-close"]').click();if(await p.locator('#app .big-die').count())throw Error('Shot big die still visible');
   const state=await p.evaluate(()=>JSON.parse(localStorage.getItem('vegas-night-save-v5')));if(state.players[1].bigLost!==1||state.players[1].left!==7)throw Error('Wrong physical loss');
   const fixture=await p.evaluate(async()=>{const c=await import('./core.mjs');const g=c.createGame(4,()=>.4,{skills:true,hero:0,rules:'classic',bigDice:true,finalActions:true});for(let i=0;i<4;i++){c.rollDice(g,()=>.99);c.placeDice(g,6);}if(!c.validSave(g))throw Error('Bad reaction fixture');return g;});
   await p.addInitScript(g=>{if(!sessionStorage.getItem('royale-fixture')){localStorage.setItem('vegas-night-save-v5',JSON.stringify(g));sessionStorage.setItem('royale-fixture','1');}},fixture);
   await p.reload();await p.locator('[data-action="resume"]').click();await p.locator('.final-action').waitFor();await p.waitForTimeout(800);
   if(await p.evaluate(()=>JSON.parse(localStorage.getItem('vegas-night-save-v5')).players.some(p=>p.cash)))throw Error('Premature payout');
   await p.reload();await p.locator('[data-action="resume"]').click();await p.locator('.reaction-controls [data-skill="1"]').click();await p.locator('[data-target="2"]').click();await p.locator('[data-skillzone="table"][data-skillface="6"][data-big="true"]').click();await p.locator('[data-action="skill-confirm"]').click();await p.locator('[data-action="skill-close"]').click();
   if(!(await p.locator('.final-action').innerText()).includes('赌场老板'))throw Error('Wrong next reactor');await p.screenshot({path:`output/playwright/royale-final-${width}.png`});
   await p.locator('[data-action="pass-reaction"]').click();await p.locator('#modal.summary').waitFor();await p.locator('[data-action="replay-turn"]').click();await p.locator('.turning-replay').waitFor();await p.screenshot({path:`output/playwright/royale-replay-${width}.png`});
   const before=await p.evaluate(()=>localStorage.getItem('vegas-night-save-v5'));await p.locator('#modal [data-action="summary"]').click();if(before!==await p.evaluate(()=>localStorage.getItem('vegas-night-save-v5')))throw Error('Replay mutated state');
   if(errors.length)throw Error(errors.join(';'));results.push({width,bigPreview:true,shotBig:true,lastAction:true,resume:true,replayReadOnly:true});
  }finally{await ctx.close();}
 }
 for(const actor of [0,1,2,3]){
  const ctx=await page.context().browser().newContext({viewport:{width:390,height:844}}),p=await ctx.newPage();
  try{
   await p.goto('http://127.0.0.1:4317');const fixture=await p.evaluate(async actor=>{const c=await import('./core.mjs');const g=c.createGame(1,()=>.4,{hero:(actor+1)%4,skills:true,bigDice:true,finalActions:true});g.turn=actor;g.players.forEach(p=>p.used=true);c.rollDice(g,()=>.99);return g;},actor);
   await p.addInitScript(g=>{if(!sessionStorage.getItem('bot-fixture')){localStorage.setItem('vegas-night-save-v5',JSON.stringify(g));localStorage.setItem('vegas-night-prefs-v2',JSON.stringify({sound:false,motion:true,fast:false,cutins:false}));sessionStorage.setItem('bot-fixture','1');}},fixture);
   await p.reload();await p.locator('[data-action="resume"]').click();await p.locator('.rival-beat').waitFor();await p.screenshot({path:`output/playwright/royale-rival-${actor}.png`});results.push({actor,animatedDecision:true});
  }finally{await ctx.close();}
 }
 return results;
}
