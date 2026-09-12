async(page)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.reload();
 await page.locator('[data-pick="0"]').click();await page.locator('#mode').selectOption('4');await page.locator('#edition').selectOption('skills');await page.locator('#ruleset').selectOption('classic');
 await page.getByRole('button',{name:'入座，开一局'}).click();await page.getByRole('button',{name:'明白了，回到牌桌'}).click();
 const state=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('vegas-night-save-v5')));
 let g=await state();if(g.players[0].left!==9||!g.skills)throw Error('Skill start invalid');
 await page.getByRole('button',{name:'掷骰子',exact:true}).click();await page.locator('.ability-bar [data-skill="1"]').click();await page.locator('[data-target="0"]').click();await page.locator('[data-skillzone="roll"]').first().click();
 await page.getByRole('button',{name:'确认狙击'}).click();await page.getByRole('button',{name:'继续牌局',exact:true}).click();
 g=await state();if(g.roll.length!==8||g.players[0].left!==8||!g.players[1].used)throw Error('Roll shot invalid');
 await page.locator('.table-target:not(:disabled)').first().click();await page.locator('[data-action="confirm"]').click();
 const before=await state(),face=before.tables.find(t=>t.counts[0]>0).face;
 await page.locator('.ability-bar [data-skill="2"]').click();await page.locator('[data-target="0"]').click();await page.locator('[data-skillface="'+face+'"]').click();await page.getByRole('button',{name:'交出全部筹码，强制交易'}).click();await page.getByRole('button',{name:'继续牌局',exact:true}).click();
 g=await state();if(g.players[2].chips!==0||g.players[0].chips!==4||!g.players[2].used||!g.tables[face-1].counts[2])throw Error('Trade invalid');
 await page.getByRole('button',{name:'掷骰子',exact:true}).click();await page.getByRole('button',{name:'支付1筹码 · 跳过本次'}).click();
 g=await state();if(g.players[1].chips!==1||g.turn!==2)throw Error('Chip skip invalid');
 await page.getByRole('button',{name:'掷骰子',exact:true}).click();if(!await page.getByRole('button',{name:'筹码不足 · 无法跳过'}).isDisabled())throw Error('Free skip exists');
 for(const width of [360,390,768,1500]){await page.setViewportSize({width,height:1000});if(await page.evaluate(()=>document.documentElement.scrollWidth)>width)throw Error('Overflow '+width);if(width===390)await page.screenshot({path:'output/playwright/v5-mobile.png',fullPage:true});}
 for(let steps=0;steps<100;steps++){
  g=await state();if(g.phase==='settled')break;
  if(g.phase==='ready')await page.getByRole('button',{name:'掷骰子',exact:true}).click();
  else if(g.phase==='choose'){await page.locator('.table-target:not(:disabled)').first().click();await page.locator('[data-action="confirm"]').click();}
 }
 await page.getByRole('button',{name:'发动 · 魅力四射',exact:true}).waitFor();
 await page.getByRole('button',{name:'发动 · 魅力四射',exact:true}).click();await page.locator('[data-target]:not(:disabled)').first().click();await page.getByRole('button',{name:'随机抽走一张'}).click();
 const drawn=await state();if(!drawn.players[3].used)throw Error('Bunny not used');await page.getByRole('button',{name:'继续牌局',exact:true}).click();
 await page.getByRole('button',{name:'进入第 2 轮',exact:true}).click();g=await state();if(g.players.some(p=>p.used)||g.players[0].left!==9)throw Error('Round reset failed');
 await page.reload();await page.getByRole('button',{name:'继续上次牌局'}).click();g=await state();if(g.round!==2||!g.skills)throw Error('Skill save lost');
 if(errors.length)throw Error(errors.join(';'));return {rolledSnipe:true,forcedTrade:true,paidSkip:true,bunnyAfterPayout:true,roundReset:true,responsive:true,errors};
}
