async(page)=>{
 const ctx=await page.context().browser().newContext({viewport:{width:390,height:844}}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.addInitScript(()=>localStorage.setItem('vegas-night-prefs-v2',JSON.stringify({sound:false,fast:true,motion:false,cutins:false})));
  await p.goto('http://127.0.0.1:4317');await p.locator('[data-pick="1"]').click();await p.locator('[data-action="start"]').click();await p.locator('#modal [data-action="close"]').click();
  const phases=new Set();let complete=false;
  for(let n=0;n<1000;n++){
   const r=await p.evaluate(async()=>{
    const g=JSON.parse(localStorage.getItem('vegas-night-save-v5')),c=await import('./core.mjs');if(!c.validSave(g))throw Error('Invalid UI save: '+g.phase);
    const press=s=>document.querySelector(s)?.click();
    if(document.querySelector('#cinema[open]')){press('.cinema-skip');return {phase:g.phase};}
    if(document.querySelector('#modal[open]')){
     if(document.querySelector('#modal.summary')){if(g.phase==='finished')return {phase:g.phase,complete:true};press('#modal [data-action="next"]');}
     else if(document.querySelector('#modal.minigame'))press('[data-mini="'+c.miniBotAction(g)+'"]');
     else press('#modal [data-action="close"]');return {phase:g.phase};
    }
    if(c.isHuman(g)){
     if(g.phase==='ready')press('#app [data-action="roll"]');
     if(g.phase==='choose'){press('#app .dicebutton[data-face="'+c.botChoice(g,()=>.5)+'"]');press('#app [data-action="confirm"]');}
     if(g.phase==='reaction')press('[data-action="pass-reaction"]');
    }
    return {phase:g.phase};
   });phases.add(r.phase);if(r.complete){complete=true;break;}await p.waitForTimeout(75);
  }
  if(!complete)throw Error('UI game failed to finish');if(errors.length)throw Error(errors.join(';'));await p.screenshot({path:'output/playwright/royale-full-game.png'});return {fourRounds:true,phases:[...phases],noErrors:true};
 }finally{await ctx.close();}
}
