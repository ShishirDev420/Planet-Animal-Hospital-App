const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'../../.local-tools/node_modules/playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:3107';const out=process.env.TEST_OUTPUT||'../evidence/refinement-qa';
const local=origin.includes('127.0.0.1');
(async()=>{
 fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const query=`?preview_frame=true&demo_mode=true${width>1000?'&preview_view=desktop':''}`;
  const ready=async route=>{await page.waitForURL(u=>u.pathname===route);await page.locator('.ai-chat').waitFor();await page.waitForTimeout(650);return page.locator('.ai-chat').evaluate(el=>({display:getComputedStyle(el).display,padding:getComputedStyle(el.querySelector('.ai-chat-body')).padding}));};
  for(const route of ['/roadmap','/ai']){
   await page.goto(origin+route+query,{waitUntil:'networkidle'});const direct=await ready(route);assert.equal(direct.display,'grid');assert.notEqual(direct.padding,'0px');
   await page.reload({waitUntil:'networkidle'});assert.deepEqual(await ready(route),direct);
   const next=route==='/roadmap'?'/ai':'/roadmap';await page.locator(`a[href^="${next}?"]`).first().click();await ready(next);await page.goBack();assert.deepEqual(await ready(route),direct);await page.goForward();await ready(next);
  }
  await page.goto(origin+'/agents'+query,{waitUntil:'networkidle'});await page.getByRole('heading',{name:'Choose your care agent.'}).waitFor();await page.waitForTimeout(400);
  assert.notEqual(await page.locator('.agents-ambience').evaluate(el=>getComputedStyle(el).maskImage),'none');
  await page.screenshot({path:`${out}/agents-${width}.png`});
  for(const [name,path] of [['Pawlina','/agents/pawlina'],['Pritpawl','/agents/pritpawl'],['Pawl','/agents/pawl']]){await page.getByRole('button',{name:new RegExp('^'+name+' ')}).click();await page.waitForURL(u=>u.pathname===path);await page.getByRole('heading',{name,exact:true}).waitFor();}
  await page.locator('.agents-disclosure summary').first().click();await page.locator('.ai-chat').waitFor();assert.equal(await page.locator('.ai-chat').evaluate(e=>getComputedStyle(e).display),'grid');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);results.push(`Direct/reload/both route orders/back/forward and all agent choices passed at ${width}px`);await context.close();
 }
 if(local){
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});await context.route('https://**/*',r=>r.abort());const page=await context.newPage();
  const fixture=mode=>page.goto(origin+'/tests/visual-refinement.html?mode='+mode,{waitUntil:'networkidle'});
  await fixture('recorded');await page.getByRole('progressbar').waitFor();assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuenow'),'1');assert.equal(await page.getByRole('progressbar').getAttribute('aria-valuemax'),'2');
  await page.getByRole('button',{name:'Questions for my vet',exact:true}).click();assert.match(await page.locator('textarea').inputValue(),/veterinarian/);assert.equal(await page.locator('.ai-send').isDisabled(),true);
  await page.locator('.ai-consent input').check();assert.equal(await page.locator('.ai-send').isEnabled(),true);await page.locator('.ai-send').click();await page.getByRole('alert').waitFor();await page.getByRole('button',{name:/Start a new request/}).click();await page.locator('.ai-answer').waitFor();assert.equal(await page.evaluate(()=>window.fixtureRequests.length),2);assert.equal(await page.evaluate(()=>new Set(window.fixtureRequests).size),2);
  await page.locator('.ai-pet-select select').selectOption('second');assert.equal(await page.locator('.ai-answer').count(),0);assert.equal(await page.locator('textarea').inputValue(),'');assert.equal(await page.getByRole('progressbar').count(),0);
  for(const mode of ['empty','error','loading','quota']){await fixture(mode);await page.locator('.ai-chat').waitFor();if(mode!=='quota')assert.equal(await page.getByRole('progressbar').count(),0);if(mode==='error'){await page.getByRole('button',{name:'Try again',exact:true}).click();assert.equal(await page.getByLabel('Retries').textContent(),'1');}if(mode==='quota'){await page.locator('textarea').fill('Synthetic question');await page.locator('.ai-consent input').check();assert.equal(await page.locator('.ai-send').isDisabled(),true);}}
  for(const width of [320,390,768,1440]){await page.setViewportSize({width,height:900});await fixture('recorded');await page.locator('.ai-chat').waitFor();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.locator('textarea').focus();assert.notEqual(await page.locator('textarea').evaluate(e=>getComputedStyle(e).outlineStyle),'none');await page.screenshot({path:`${out}/fixture-${width}.png`,fullPage:true});}
  results.push('Synthetic recorded/empty/error/loading/quota, retry, consent, answer, pet isolation, keyboard focus and 320–1440px overflow passed');
  for(const reducedMotion of ['no-preference','reduce']){
   await page.emulateMedia({reducedMotion});await page.goto(origin+'/motion-review.html',{waitUntil:'networkidle'});await page.locator('.orbit-arm-earth').waitFor();const arm=page.locator('.orbit-arm-earth');const before=await arm.getAttribute('style');await page.waitForTimeout(700);const after=await arm.getAttribute('style');if(reducedMotion==='reduce')assert.equal(before,after);else{assert.notEqual(before,after);await page.getByRole('button',{name:'Pause animation'}).click();const paused=await arm.getAttribute('style');await page.waitForTimeout(350);assert.equal(await arm.getAttribute('style'),paused);await page.getByRole('button',{name:'Play animation'}).click();await page.waitForTimeout(350);assert.notEqual(await arm.getAttribute('style'),paused);}
   assert.equal(await page.locator('.care-symbol').count(),6);await page.screenshot({path:`${out}/motion-${reducedMotion}.png`});
  }
  await page.emulateMedia({reducedMotion:'no-preference'});await page.setViewportSize({width:390,height:844});await page.goto(origin+'/motion-review.html',{waitUntil:'networkidle'});await page.waitForTimeout(1500);await page.screenshot({path:`${out}/motion-phone.png`});results.push('Vector artwork, active orbit/energy, pause/resume and reduced-motion static alternative passed');await context.close();
 }
 fs.writeFileSync(out+'/results.json',JSON.stringify({browser:await browser.version(),origin,results},null,2));console.log(JSON.stringify(results));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
