// Run against the built app. All relay traffic is intercepted; no public events are sent.
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, copyFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { finalizeEvent, getPublicKey, matchFilter } from 'nostr-tools';
import jsonpack from 'jsonpack';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BROWSER_BASE_URL || 'http://127.0.0.1:5193';
const output = process.env.LOADING_PROOF_DIR || 'docs/proofs/loading';
await mkdir(output, { recursive: true });
const secret = new Uint8Array(32); secret[31] = 2; // Deterministic fixture identity only.
const pubkey = getPublicKey(secret);
const relay = 'wss://relay.example/';
const outbox = 'wss://outbox.example/';
const sign = (kind, content = '', tags = []) => finalizeEvent({ kind, content, tags, created_at: 1700000000 }, secret);
const relayList = sign(10002, '', [['r', outbox, 'write']]);
const config = sign(30078, jsonpack.pack({ blocks: {
  nip11: { enabled: true, order: -100 },
  'operator-profile': { enabled: false, order: 0 },
  'follows-present': { enabled: false, order: 1 },
  map: { enabled: false, order: 2 },
  'markdown:0': { enabled: true, order: 3, options: { markdown: 'Your relay is ready.', blockHeading: 'Connected' } },
} }), [['d', `myrelay.page/${relay}operator@${pubkey}`]]);
const recordingDirectory = await mkdtemp(join(tmpdir(), 'myrelay-loading-video-'));
const browser = await chromium.launch({ headless: true });
const summaries = [];

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

// Test-side instrumentation of browser APIs. Production code has no testing globals.
function instrument({ unavailable }) {
  const probe = window.__loadingProbe = {
    draws: 0, frames: 0, times: [], submitMs: [], pendingFrames: 0,
    created: { program: 0, buffer: 0, shader: 0, texture: 0, vertexArray: 0 },
    deleted: { program: 0, buffer: 0, shader: 0, texture: 0, vertexArray: 0 },
    contexts: [],
  };
  const request = window.requestAnimationFrame.bind(window);
  const cancel = window.cancelAnimationFrame.bind(window);
  const pending = new Set();
  window.requestAnimationFrame = callback => {
    const id = request(time => { pending.delete(id); probe.pendingFrames = pending.size; callback(time); });
    pending.add(id); probe.pendingFrames = pending.size; return id;
  };
  window.cancelAnimationFrame = id => { pending.delete(id); probe.pendingFrames = pending.size; cancel(id); };
  const getContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function(type, ...args) {
    if (unavailable && /^webgl|experimental-webgl/.test(type)) return null;
    const context = getContext.call(this, type, ...args);
    if (context && /^webgl|experimental-webgl/.test(type) && !probe.contexts.includes(context)) probe.contexts.push(context);
    return context;
  };
  const tracked = new WeakSet();
  const owned = context => {
    if (context.canvas?.closest('[data-testid="relay-loading"]')) tracked.add(context);
    return tracked.has(context);
  };
  for (const Context of [window.WebGLRenderingContext, window.WebGL2RenderingContext].filter(Boolean)) {
    const clear = Context.prototype.clear;
    Context.prototype.clear = function(...args) {
      if (owned(this)) probe.frames++;
      return clear.apply(this, args);
    };
    for (const name of ['drawArrays', 'drawElements']) {
      const original = Context.prototype[name];
      Context.prototype[name] = function(...args) {
        if (!owned(this)) return original.apply(this, args);
        const before = performance.now();
        const value = original.apply(this, args);
        probe.draws++; probe.times.push(before); probe.submitMs.push(performance.now() - before);
        return value;
      };
    }
    for (const [name, key] of [['Program', 'program'], ['Buffer', 'buffer'], ['Shader', 'shader'], ['Texture', 'texture'], ['VertexArray', 'vertexArray']]) {
      for (const action of ['create', 'delete']) {
        const method = `${action}${name}`;
        if (!Context.prototype[method]) continue;
        const original = Context.prototype[method];
        Context.prototype[method] = function(...args) {
          const value = original.apply(this, args);
          if (owned(this) && (action === 'create' ? value : args[0])) probe[action === 'create' ? 'created' : 'deleted'][key]++;
          return value;
        };
      }
    }
  }
  let visibility = 'visible';
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility });
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => visibility === 'hidden' });
  probe.setVisibility = value => { visibility = value; document.dispatchEvent(new Event('visibilitychange')); };
}

// Composite computed ancestor background colors; this scene uses solid surfaces.
function textContrast(element) {
  const rgba = value => {
    const values = value.match(/[\d.]+/g)?.map(Number) || [];
    if (values.length < 3) throw new Error(`Unexpected computed color: ${value}`);
    return [values[0], values[1], values[2], values[3] ?? 1];
  };
  const composite = (front, back) => front.slice(0, 3).map((channel, index) => channel * front[3] + back[index] * (1 - front[3]));
  const layers = [];
  for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) layers.push(rgba(getComputedStyle(ancestor).backgroundColor));
  const background = layers.reverse().reduce((back, front) => composite(front, back), [255, 255, 255]);
  const foreground = composite(rgba(getComputedStyle(element).color), background);
  const luminance = color => color.map(channel => {
    const value = channel / 255;
    return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4;
  }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
  const a = luminance(foreground), b = luminance(background);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}

async function setup({ name, mobile = false, compact = false, dark = false, reduced = false, unavailable = false, record = false, offline = false }) {
  const info = deferred(), discovery = deferred();
  const requests = [];
  const context = await browser.newContext({
    viewport: mobile ? { width: compact ? 320 : 390, height: 844 } : { width: 1440, height: 1100 },
    colorScheme: dark ? 'dark' : 'light', reducedMotion: reduced ? 'reduce' : 'no-preference',
    deviceScaleFactor: mobile ? 3 : 1,
    ...(record ? { recordVideo: { dir: recordingDirectory, size: { width: 1440, height: 1100 } } } : {}),
  });
  await context.addInitScript(instrument, { unavailable });
  await context.addInitScript(({ dark }) => localStorage.setItem('theme', dark ? 'dark' : 'light'), { dark });
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin === new URL(base).origin) return route.continue();
    if (url.hostname === 'relay.example') {
      await info.promise;
      return route.fulfill({ status: offline ? 503 : 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify({ pubkey, name: 'Community Relay', description: 'A welcoming home for your notes.', supported_nips: [1, 11, 65] }) }).catch(() => {});
    }
    return route.abort();
  });
  await context.routeWebSocket(/.*/, socket => {
    socket.onMessage(async raw => {
      const [type, id, ...filters] = JSON.parse(String(raw));
      if (type !== 'REQ') return;
      requests.push({ url: socket.url(), filters });
      if (filters.some(filter => filter.kinds?.includes(10002))) await discovery.promise;
      for (const filter of filters) {
        const events = filter.kinds?.includes(10002) ? [relayList] : socket.url() === outbox ? [config] : [];
        for (const event of events.filter(event => matchFilter(filter, event))) socket.send(JSON.stringify(['EVENT', id, event]));
      }
      socket.send(JSON.stringify(['EOSE', id]));
    });
  });
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.stack || error.message));
  await page.goto(`${base}/?url=${encodeURIComponent(relay)}`);
  const loader = page.getByTestId('relay-loading');
  await loader.waitFor();
  await page.waitForFunction(() => !!document.getElementById('theme')?.sheet);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250); // Settle the existing page/theme color transition before visual proof.
  assert(await loader.locator('.eyebrow').evaluate(textContrast) >= 4.5, `${name}: small caption text meets 4.5:1 contrast`);
  const status = loader.getByRole('status');
  assert.equal(await status.evaluate(element => !!element.closest('[aria-busy="true"]')), false, 'live loading status must not be deferred by a busy ancestor');
  assert.match(await status.innerText(), /relay|page|connect/i, 'loading explains the work in plain language');
  assert(!/\d+\s*%/.test(await loader.innerText()), 'indeterminate loading must not invent percentage progress');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${name}: no horizontal overflow`);
  return { name, page, context, loader, info, discovery, errors, offline, requests };
}

const draws = page => page.evaluate(() => window.__loadingProbe.draws);
async function stableDraws(page, reason) {
  await page.waitForTimeout(150);
  const before = await draws(page);
  await page.waitForTimeout(250);
  assert.equal(await draws(page), before, reason);
}
async function rendererMode(loader) {
  return loader.evaluate(element => element.dataset.renderer || element.querySelector('canvas')?.dataset.renderer);
}
async function capture(run, suffix = '') {
  await run.page.screenshot({ path: `${output}/${run.name}${suffix}.png`, fullPage: true });
}
async function finish(run) {
  run.info.resolve(); run.discovery.resolve();
  const ready = run.offline ? run.page.getByText(/Relay information is unavailable/) : run.page.getByText('Your relay is ready.', { exact: true });
  try { await ready.waitFor(); } catch (error) {
    await capture(run, '-failure');
    console.error('FAILURE', run.name, await run.page.locator('body').innerText(), run.errors, JSON.stringify(run.requests));
    throw error;
  }
  await run.loader.waitFor({ state: 'detached', timeout: 3000 });
  await run.page.waitForTimeout(400);
  await stableDraws(run.page, `${run.name}: renderer stops when page content replaces loading`);
  assert.deepEqual(run.errors, [], `${run.name}: no uncaught browser errors`);
  const summary = await run.page.evaluate(() => {
    const p = window.__loadingProbe;
    return { draws: p.draws, frames: p.frames, drawCallsPerFrame: p.frames ? p.draws / p.frames : 0, pendingFrames: p.pendingFrames, created: p.created, deleted: p.deleted };
  });
  assert(summary.drawCallsPerFrame <= 12, `${run.name}: bounded draw-call budget`);
  for (const type of Object.keys(summary.created)) assert.equal(summary.deleted[type], summary.created[type], `${run.name}: releases ${type} resources`);
  assert.equal(summary.pendingFrames, 0, `${run.name}: no animation frame remains scheduled after teardown`);
  summaries.push({ name: run.name, ...summary });
  if (run.offline) await capture(run);
  const video = run.page.video();
  await run.context.close();
  if (video) await copyFile(await video.path(), `${output}/motion.webm`);
}

try {
  const desktop = await setup({ name: 'desktop', record: true });
  await desktop.page.waitForFunction(() => window.__loadingProbe.draws >= 3);
  assert.equal(await rendererMode(desktop.loader), 'webgl', 'desktop uses real WebGL');
  const first = await desktop.loader.locator('canvas').screenshot();
  await capture(desktop, '-frame-1');
  await desktop.page.waitForTimeout(300);
  const second = await desktop.loader.locator('canvas').screenshot();
  assert(!first.equals(second), 'the rendered artwork evolves over time');
  await capture(desktop, '-frame-2');
  await desktop.page.waitForTimeout(300);
  await capture(desktop, '-frame-3');
  desktop.info.resolve();
  await desktop.loader.getByRole('status').filter({ hasText: /finding|page/i }).waitFor();
  await capture(desktop, '-discovery');
  await finish(desktop);

  for (const options of [{ name: 'mobile', mobile: true }, { name: 'compact', mobile: true, compact: true }, { name: 'dark', dark: true }]) {
    const run = await setup(options);
    await run.page.waitForFunction(() => window.__loadingProbe.draws >= 3);
    const buffer = await run.loader.locator('canvas').evaluate(canvas => ({ width: canvas.width, cssWidth: canvas.clientWidth, height: canvas.height, cssHeight: canvas.clientHeight }));
    assert(buffer.width <= buffer.cssWidth * 1.5 + 1 && buffer.height <= buffer.cssHeight * 1.5 + 1, 'high-DPI fill rate is capped');
    await capture(run);
    await finish(run);
  }

  const reduced = await setup({ name: 'reduced-motion', reduced: true });
  await reduced.page.waitForTimeout(300); // Allow the initial ResizeObserver delivery after stylesheet layout.
  await stableDraws(reduced.page, 'reduced motion renders a still composition');
  assert.equal(await reduced.loader.evaluate(element => element.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running' && animation.effect?.getTiming().iterations === Infinity).length), 0, 'no looping CSS motion under reduced motion');
  assert.equal(await reduced.page.evaluate(() => window.__loadingProbe.pendingFrames), 0, 'reduced motion leaves no requestAnimationFrame loop');
  await capture(reduced);
  await finish(reduced);

  const unavailable = await setup({ name: 'fallback', unavailable: true });
  assert.equal(await rendererMode(unavailable.loader), 'fallback', 'WebGL failure retains a fallback composition');
  assert.equal(await draws(unavailable.page), 0);
  await capture(unavailable);
  await finish(unavailable);

  const loss = await setup({ name: 'context-loss' });
  await loss.page.waitForFunction(() => window.__loadingProbe.draws >= 3);
  await loss.page.evaluate(() => window.__loadingProbe.contexts[0].getExtension('WEBGL_lose_context').loseContext());
  await loss.page.waitForFunction(() => {
    const loader = document.querySelector('[data-testid="relay-loading"]');
    return (loader?.dataset.renderer || loader?.querySelector('canvas')?.dataset.renderer) === 'fallback';
  });
  await stableDraws(loss.page, 'context loss stops rendering and retains readable fallback');
  await capture(loss);
  await finish(loss);

  const visibility = await setup({ name: 'visibility' });
  await visibility.page.waitForFunction(() => window.__loadingProbe.draws >= 3);
  await visibility.page.evaluate(() => window.__loadingProbe.setVisibility('hidden'));
  await stableDraws(visibility.page, 'hidden documents pause GPU work');
  const paused = await draws(visibility.page);
  await visibility.page.evaluate(() => window.__loadingProbe.setVisibility('visible'));
  await visibility.page.waitForFunction(before => window.__loadingProbe.draws > before, paused);
  await visibility.loader.evaluate(element => { element.style.transform = 'translateY(3000px)'; });
  await stableDraws(visibility.page, 'offscreen loading pauses GPU work');
  const offscreen = await draws(visibility.page);
  await visibility.loader.evaluate(element => { element.style.transform = ''; });
  await visibility.page.waitForFunction(before => window.__loadingProbe.draws > before, offscreen);
  await finish(visibility);

  const failure = await setup({ name: 'network-error', offline: true });
  await capture(failure);
  await finish(failure);
  await writeFile(`${output}/verification.json`, JSON.stringify({ scenarios: summaries, notes: 'WebGL call instrumentation runs only in the browser test. Rendering is real; relay responses are signed deterministic fixtures. No claim of hardware GPU throughput.' }, null, 2) + '\n');
  console.log(`${summaries.length} loading browser scenarios passed; frame progression, light/dark/mobile, reduced motion, fallback/context loss, visibility, transition and GPU resource cleanup verified.`);
} finally {
  await browser.close();
  await rm(recordingDirectory, { recursive: true, force: true });
}
