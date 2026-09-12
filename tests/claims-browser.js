async(page)=>{
 const browser=page.context().browser(),results=[];
 for(const width of [1440,390,360]){
  const ctx=await browser.newContext({viewport:{width,height:width>600?1000:844}}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  try{
   await p.goto('http://127.0.0.1:4317');
   const fixture=await p.evaluate(async()=>{const c=await import('/core.mjs'),g=c.createGame(4,()=>.4,{hero:1,skills:true,rules:'classic'});g.tables[5].notes=[80000,50000];g.tables[5].counts=[0,3,2,1];g.players.forEach((p,i)=>p.left-=g.tables[5].counts[i]);g.turn=2;let n=0;c.rollDice(g,()=>n++===0?.99:.2);return g;});
   await p.addInitScript(g=>{if(!sessionStorage.getItem('claim-fixture')){localStorage.setItem('vegas-night-save-v5',JSON.stringify(g));localStorage.setItem('vegas-night-prefs-v2',JSON.stringify({sound:false,motion:true,fast:false}));sessionStorage.setItem('claim-fixture','1');}},fixture);
   await p.reload();await p.locator('#modal [data-action="resume"]').click();await p.locator('.dicebutton[data-face="6"]').click();
   if(await p.locator('.claim-toast').count())throw Error('Preview triggered committed feedback');
   await p.locator('#app [data-action="confirm"]').click();await p.locator('.claim-toast').waitFor();
   const message=await p.locator('.claim-toast').innerText();if(!message.includes('你 暂失 8万')||!message.includes('月兔 暂领 8万'))throw Error('Wrong amount message '+message);
   if(await p.locator('.casino-6 .pile.tied').count()!==2)throw Error('Both tied piles not marked');
   if(await p.locator('.casino-6 [data-note="0"]').getAttribute('data-owner')!=='3')throw Error('Wrong banknote owner');
   const committed=await p.evaluate(()=>localStorage.getItem('vegas-night-save-v5'));await p.locator('.casino-6').scrollIntoViewIfNeeded();await p.waitForTimeout(350);
   const size=await p.locator('.claim-toast').boundingBox();if(size.x<0||size.x+size.width>width+1)throw Error('Toast overflows');
   await p.screenshot({path:`output/playwright/claims-${width}.png`});await p.locator('.claim-dismiss').click();
   if(committed!==await p.evaluate(()=>localStorage.getItem('vegas-night-save-v5')))throw Error('Dismiss changed game');
   await p.locator('#app [data-skill="1"]').click();await p.locator('[data-target="2"]').click();await p.locator('[data-skillzone="table"][data-skillface="6"]').click();await p.locator('[data-action="skill-confirm"]').click();
   await p.waitForFunction(()=>!!document.querySelector('#cinema[open]'));await p.evaluate(()=>document.querySelector('#cinema .cinema-skip').click());
   await p.locator('#modal.skill-result').waitFor();if(!(await p.locator('#modal .claim-report').innerText()).includes('平局打破'))throw Error('Skill impact missing');
   await p.screenshot({path:`output/playwright/claims-skill-${width}.png`});
   await p.locator('[data-action="skill-close"]').click();
   const g=await p.evaluate(()=>JSON.parse(localStorage.getItem('vegas-night-save-v5')));if(g.players[2].lost!==1||g.players.some(x=>x.cash!==0))throw Error('Feedback altered rules');
   await p.reload();await p.locator('#modal [data-action="resume"]').click();if(await p.locator('.claim-toast').count())throw Error('Reload replayed effect');
   if(errors.length)throw Error(errors.join(';'));results.push({width,tie:true,skill:true,reloadSafe:true});
  }finally{await ctx.close();}
 }
 return results;
}
