// Browser integration suite. Supply PLAYWRIGHT_MODULE if Playwright is installed outside this checkout.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { finalizeEvent, getPublicKey, matchFilter, verifyEvent } from 'nostr-tools';
import jsonpack from 'jsonpack';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BROWSER_BASE_URL || 'http://127.0.0.1:5193';
const output = process.env.PROOF_DIR || 'docs/proofs';
await mkdir(output, { recursive: true });
// Public, deterministic test identity. Never use a real operator key in fixtures.
const secret = new Uint8Array(32); secret[31] = 1;
const pubkey = getPublicKey(secret);
const relay = 'wss://relay.example/';
const outbox = 'wss://outbox.example/';
const address = `myrelay.page/${relay}operator@${pubkey}`;
const sign = (kind, content = '', tags = [], created_at = 1700000000) => finalizeEvent({kind,content,tags,created_at}, secret);
const config = sign(30078, jsonpack.pack({blocks:{
  nip11:{enabled:true,order:-100},
  'operator-profile':{enabled:true,order:0},
  map:{enabled:false,order:1},
  'markdown:0':{enabled:true,order:2,options:{markdown:'# Welcome to the relay\nConfiguration recovered from the operator outbox.',blockHeading:'Community'}},
}}), [['d',address]]);
const list = sign(10002, '', [['r',outbox,'write'],['r','wss://inbox.example/','read']]);
const profile = sign(0, JSON.stringify({name:'Relay Operator',about:'An independent community relay. Configuration lives in my outbox.'}));
const note = sign(1, 'The relay is back online. Welcome, nostriches!');
const browser = await chromium.launch({ headless: true });
let count = 0;
async function scenario({mobile=false,offline=false,rejectPublish=false,noConfig=false}={}) {
  const context = await browser.newContext({viewport: mobile ? {width:390,height:844} : {width:1440,height:1000}});
  const errors=[]; const requests=[]; const publishes=[];
  const page=await context.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', error=>errors.push(error.message));
  await context.route('**/*', route=> {
    const url=new URL(route.request().url());
    if(url.origin===new URL(base).origin) return route.continue();
    if(url.hostname==='relay.example') return route.fulfill({status:offline?503:200,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify({name:'Community Relay',description:'A welcoming home for your notes.',pubkey,supported_nips:[1,11,65],software:'https://github.com/hoytech/strfry',version:'1.0',limitation:{payment_required:false}})});
    return route.abort();
  });
  await page.exposeFunction('fixtureSign', template=>finalizeEvent(template,secret));
  await page.addInitScript(({pubkey})=>{window.nostr={getPublicKey:async()=>pubkey,signEvent:template=>window.fixtureSign(template)};},{pubkey});
  await context.routeWebSocket(/.*/, socket=>{
    socket.onMessage(raw=>{
      const [type,id,...filters]=JSON.parse(String(raw));
      if(type==='REQ') {
        for(const filter of filters) {
          requests.push({url:socket.url(),filter});
          let events=[];
          if(filter.kinds?.includes(10002)) events=[list];
          if(socket.url()===outbox && !offline) events=[...events,profile,note,...(noConfig?[]:[config])];
          for(const event of events.filter(event=>matchFilter(filter,event))) socket.send(JSON.stringify(['EVENT',id,event]));
        }
        socket.send(JSON.stringify(['EOSE',id]));
      } else if(type==='EVENT') {
        publishes.push({url:socket.url(),event:id});
        socket.send(JSON.stringify(['OK',id.id,!rejectPublish,rejectPublish?'error: fixture rejection':'saved']));
      }
    });
  });
  await page.goto(`${base}/?url=${encodeURIComponent(relay)}`);
  await page.waitForFunction(()=>document.body.classList.contains('loaded'),{},{timeout:20000});
  await page.locator('.loader').waitFor({state:'detached'});
  await page.evaluate(()=>document.fonts.ready);
  const loginContrast = await page.getByRole('button',{name:'login',exact:true}).evaluate(e=>({text:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor}));
  assert.notEqual(loginContrast.text,loginContrast.background,'login text must remain visible in production');
  if(offline) {
    assert.match(await page.locator('body').innerText(),/Relay information is unavailable/);
    assert.equal(await page.locator('.svelte-loader-skeleton').count(),0);
  } else {
    assert(!((await page.locator('body').innerText()).includes('Relay information is unavailable')));
    assert(!((await page.locator('body').innerText()).includes('undefined')));
    await page.getByText('Relay Operator',{exact:true}).waitFor();
    await page.getByText('The relay is back online. Welcome, nostriches!',{exact:true}).waitFor();
    assert(requests.some(r=>r.url===outbox && r.filter.kinds?.includes(30078)),'config queried in owner outbox');
    assert(!requests.some(r=>r.url.includes('appdata.kindpag.es') || r.url.includes('inbox.example')),'no retired relay or read-only inbox');
    if(!noConfig) await page.getByText('Configuration recovered from the operator outbox.',{exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'publish edits',exact:true}).count(),0,'loading must not dirty config');
  }
  await page.screenshot({path:`${output}/${offline?'offline':noConfig?'defaults':mobile?'mobile':'desktop'}.png`,fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'no horizontal overflow');
  if(!offline && !mobile && !noConfig) {
    await page.getByRole('button',{name:'login',exact:true}).click();
    await page.getByRole('button',{name:'edit',exact:true}).waitFor();
    assert.equal(await page.getByRole('button',{name:'publish edits',exact:true}).count(),0,'login must not dirty config');
    await page.getByRole('button',{name:'edit',exact:true}).click();
    await page.getByRole('button',{name:'reset config',exact:true}).click();
    await page.getByRole('button',{name:'publish edits',exact:true}).click();
    await page.getByRole('alert').filter({hasText:'No relay acknowledged'}).waitFor();
    assert(publishes.length>0 && publishes.every(p=>p.url===outbox));
    const failed=publishes[0].event;
    assert(verifyEvent(failed)); assert.equal(failed.kind,30078); assert.equal(failed.tags.find(t=>t[0]==='d')[1],address);
    rejectPublish=false;
    await page.getByRole('button',{name:'publish edits',exact:true}).click();
    await page.getByRole('button',{name:'edit',exact:true}).waitFor();
    assert(publishes.every(p=>p.event.id===failed.id),'retry reuses exact signed event');
    await page.screenshot({path:`${output}/published.png`,fullPage:true});
  }
  assert.deepEqual(errors,[],'no uncaught browser errors');
  await context.close(); count++;
}
try {
  await scenario({rejectPublish:true});
  await scenario({mobile:true});
  await scenario({offline:true});
  await scenario({noConfig:true});
  console.log(`${count} browser scenarios passed: outbox recovery, mobile, offline, defaults; owner publish/retry verified.`);
} finally { await browser.close(); }
