async(parent)=>{
 const ctx=await parent.context().browser().newContext({viewport:{width:390,height:844}}),p=await ctx.newPage(),errors=[],failed=[];p.on('pageerror',e=>errors.push(e.message));p.on('requestfailed',r=>failed.push(r.url()));
 try{
  await p.addInitScript(()=>localStorage.setItem('vegas-night-prefs-v2',JSON.stringify({sound:false,music:false,motion:false,fast:true,cutins:false,handoff:false})));
  await p.goto('file:///C:/Users/34228/Documents/Codex/2026-09-11/w/outputs/拉斯维加斯-骰子之夜.html');await p.locator('.lobby-journey[data-action="journey"]').waitFor();await p.locator('.lobby-journey[data-action="journey"]').click();await p.locator('[data-contract="break"]').click();await p.locator('#app [data-action="roll"]').click();await p.waitForFunction(()=>!document.querySelector('#cinema[open]'));await p.locator('#app .dicebutton').first().click();await p.locator('.bet-quick').waitFor();await p.locator('#app [data-action="settings"]').click();await p.locator('[data-pref="music"]').check();await p.waitForFunction(()=>{const a=document.getElementById('game-music');return a.src.startsWith('blob:')&&!a.paused&&a.currentTime>.1&&!a.error;});
  await p.locator('#modal [data-action="close"]').click();await p.screenshot({path:'output/playwright/offline-v14-mobile.png'});
  const bad=await p.locator('img').evaluateAll(imgs=>imgs.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.alt));if(bad.length||errors.length||failed.length)throw Error(JSON.stringify({bad,errors,failed}));return {offline:true,version:await p.locator('[name="game-version"]').getAttribute('content'),journey:true,contract:true,dice:true,embeddedMusic:true,errors};
 }finally{await ctx.close();}
}
