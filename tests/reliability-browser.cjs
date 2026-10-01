const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const origin='http://127.0.0.1:3107';
const config={apiKey:'fake-key',authDomain:'demo-planet-care.firebaseapp.com',projectId:'demo-planet-care',firestoreDatabaseId:'(default)',storageBucket:'demo-planet-care.appspot.com',appId:'local-fixture'};
const results=[];
let diagnosticPage;
async function check(name,fn){try {await fn();results.push(name);console.log('PASS '+name);} catch(e) {console.log('FAILED '+name+' '+await diagnosticPage.locator('body').innerText());await diagnosticPage.screenshot({path:'../evidence/browser-failure.png',fullPage:true});throw e;}}
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await context.route('**/firebase-applet-config.json*',r=>r.fulfill({contentType:'application/javascript',body:'export default '+JSON.stringify(config)}));
 await context.route('https://**/*',r=>r.abort()); // No external service calls from emulator tests.
 await context.route('**/api/**',r=>r.fulfill({status:503,json:{error:'Synthetic service offline'}}));
 const page=await context.newPage();
 diagnosticPage=page;
 page.on('dialog',d=>d.dismiss());
 await page.goto(origin+'/tests/reliability-review.html',{waitUntil:'networkidle'});
 await page.getByRole('button',{name:'Continue with Google'}).waitFor();
 const email='parent-'+Date.now()+'@example.test', password='Synthetic-only-123!';
 await check('Registration and two-step profile persistence',async()=>{
  await page.getByRole('button',{name:'Create account',exact:true}).click();
  await page.getByLabel('Email',{exact:true}).fill(email);
  await page.getByLabel('Password',{exact:true}).fill(password);
  await page.getByRole('button',{name:'Create account',exact:true}).last().click();
  await page.getByLabel('Your name',{exact:true}).fill('Synthetic Parent');
  await page.locator('input[name=petName]').fill('Synthetic Pet');
  await page.getByLabel('Breed',{exact:true}).fill('Indie');
  await page.getByRole('button',{name:'Continue',exact:true}).click();
  await page.getByLabel('Age',{exact:true}).fill('3 years');
  await page.getByLabel('Weight',{exact:true}).fill('12 kg');
  await page.getByRole('button',{name:'Save & enter clinic'}).click();
  await page.waitForFunction(()=>/request a visit/i.test(document.body.innerText));
  const saved=await page.evaluate(async()=>{const f=window.fixture;return (await f.getDoc(f.doc(f.db,'users',f.auth.currentUser.uid))).data()});
  assert.equal(saved.petName,'Synthetic Pet'); assert.equal(saved.parentName,'Synthetic Parent');
 });
 await check('Persisted sign-in survives reloading the emulator entry',async()=>{
  await page.goto(origin+'/tests/reliability-review.html',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>/request a visit/i.test(document.body.innerText));
  assert.equal(await page.evaluate(()=>window.fixture.auth.currentUser.email),email);
 });
 await check('Password reset trims email and prevents duplicate requests',async()=>{
  await page.evaluate(()=>window.fixture.signOut(window.fixture.auth));
  await page.getByRole('button',{name:'Continue with Google'}).waitFor();
  await page.getByLabel('Email',{exact:true}).fill('  '+email+'  ');
  let calls=0,release;
  await page.route('**/accounts:sendOobCode*',async r=>{calls++;assert.equal(r.request().postDataJSON().email,email);await new Promise(resolve=>release=resolve);await r.continue()});
  await page.getByRole('button',{name:'Forgot password?'}).click();
  await page.waitForFunction(()=>document.querySelector('.onboarding-text-button').disabled);
  assert.equal(calls,1);release();
  await page.waitForFunction(()=>!document.querySelector('.onboarding-text-button').disabled);
  await page.unroute('**/accounts:sendOobCode*');
 });
 await check('Invalid password reports an actionable error',async()=>{
  await page.getByLabel('Email',{exact:true}).fill(email);
  await page.getByLabel('Password',{exact:true}).fill('wrong-password');
  await page.getByRole('button',{name:'Sign in',exact:true}).last().click();
  await page.getByRole('alert').waitFor();
  assert.match(await page.getByRole('alert').innerText(),/password|match/i);
 });
 await page.goto(origin+'/tests/reliability-review.html?probe=true',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>Boolean(window.fixture&&window.careProbe));
 const state={ownerUid:'fixture',pets:[{id:'primary',name:'Synthetic Pet'}],preferences:{inApp:false},milestones:[],queues:[],updates:[],prescriptions:[]};
 await page.route('**/api/care',r=>r.fulfill({json:{state,role:'parent',config:null}}));
 await page.evaluate(({email,password})=>window.fixture.signInWithEmailAndPassword(window.fixture.auth,email,password),{email,password});
 await page.waitForFunction(()=>window.careProbe.state!==null&&!window.careProbe.loading);
 await check('Save supersedes stale refresh and clears loading',async()=>{
  let release; const stale=structuredClone(state);stale.pets[0].name='Stale';
  await page.route('**/api/care',async r=>{if(r.request().method()==='GET'){await new Promise(resolve=>release=resolve);await r.fulfill({json:{state:stale,role:'parent',config:null}})}else await r.fulfill({json:{state,role:'parent',config:null}})});
  await page.evaluate(()=>{void window.careProbe.refresh()});
  await page.waitForFunction(()=>window.careProbe.loading);
  await page.evaluate(()=>window.careProbe.command({type:'preferences',inApp:true}));
  await page.waitForFunction(()=>!window.careProbe.loading);
  const refreshed=page.waitForResponse(r=>r.url().endsWith('/api/care')&&r.request().method()==='GET');
  release(); await (await refreshed).finished();
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  assert.equal(await page.evaluate(()=>window.careProbe.state.pets[0].name),'Synthetic Pet');
 });
 await check('Sign-out clears the former account profile',async()=>{
  await page.waitForFunction(()=>window.profileProbe.profile?.petName==='Synthetic Pet');
  await page.evaluate(()=>window.fixture.signOut(window.fixture.auth));
  await page.waitForFunction(()=>window.profileProbe.profile===null&&window.careProbe.state===null);
 });
 await check('Demo API clients reject access before network activity',async()=>{
  const errors=await page.evaluate(async()=>{
    history.replaceState(null,'','/records?preview_frame=true&demo_mode=true');
    const c=await import('/src/lib/care/client.tsx');const p=await import('/src/lib/care/prescription-client.ts');const a=await import('/src/components/CareAssistant.tsx');const k=await import('/src/components/ClinicalCare.tsx');
    return Promise.all([()=>c.careRequest(),()=>p.prescriptionRequest(),()=>p.prescriptionSource('x','y'),()=>a.assistantRequest(),()=>k.clinicalRequest('x','y')].map(async fn=>{try{await fn();return 'unexpected success'}catch(e){return e.message}}));
  });
  assert.equal(errors.length,5);for(const error of errors)assert.match(error,/Visual previews cannot/);
 });
 fs.mkdirSync('../evidence',{recursive:true});fs.writeFileSync('../evidence/browser-regressions.json',JSON.stringify({passed:results},null,2));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
