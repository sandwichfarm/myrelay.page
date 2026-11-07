<script lang="ts">
  import { onMount } from 'svelte';
  import { createRelayScene, type RelayScene } from './relay-scene';

  export let stage: 'info' | 'config' | 'content' = 'info';
  const messages = {
    info: 'Reading relay information',
    config: 'Finding your relay page',
    content: 'Bringing it all together',
  };
  let canvas: HTMLCanvasElement;
  let renderer: 'fallback' | 'webgl' = 'fallback';
  let motion: 'still' | 'running' | 'paused' = 'still';

  onMount(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let scene: RelayScene | null = null;
    let frame = 0;
    let last = 0;
    let seconds = 0;
    let inView = true;
    let disposed = false;
    let dark = false;
    const stop = () => { cancelAnimationFrame(frame); frame = 0; last = 0; };
    const tick = (now: number) => {
      if (disposed || !scene) return;
      if (!last || now - last >= 1000 / 60 - .5) {
        seconds += last ? Math.min((now - last) / 1000, .05) : 0;
        last = now;
        scene.draw(seconds, dark);
      }
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      stop();
      const active = !reduced.matches && !document.hidden && inView;
      motion = reduced.matches ? 'still' : active && scene ? 'running' : 'paused';
      if (active && scene) frame = requestAnimationFrame(tick);
    };
    const resize = () => {
      if (!scene || disposed) return;
      const { width, height } = canvas.getBoundingClientRect();
      scene.resize(width, height, window.devicePixelRatio || 1);
      scene.draw(seconds, dark);
    };
    const palette = () => {
      dark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');
      if (!document.hidden) scene?.draw(seconds, dark);
    };
    const lost = (event: Event) => {
      event.preventDefault();
      stop();
      scene?.dispose();
      scene = null;
      renderer = 'fallback';
      motion = 'still';
    };
    // The vector artwork is visible immediately, including when GPU access is denied.
    try { scene = createRelayScene(canvas); } catch { scene = null; }
    if (scene) {
      palette();
      resize();
      renderer = 'webgl';
    }
    canvas.addEventListener('webglcontextlost', lost);
    const sizeObserver = new ResizeObserver(resize);
    sizeObserver.observe(canvas);
    const visibilityObserver = new IntersectionObserver(entries => { inView = entries[0]?.isIntersecting ?? true; sync(); });
    visibilityObserver.observe(canvas);
    const themeObserver = new MutationObserver(palette);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    reduced.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => {
      disposed = true;
      stop();
      scene?.dispose();
      canvas.removeEventListener('webglcontextlost', lost);
      reduced.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
      sizeObserver.disconnect();
      visibilityObserver.disconnect();
      themeObserver.disconnect();
    };
  });
</script>

<section class="relay-loading" data-testid="relay-loading" data-stage={stage} data-renderer={renderer} data-motion={motion} aria-label="Loading relay page">
  <div class="observatory" aria-hidden="true">
    <div class="field"></div>
    <div class="ground"></div>
    <svg class:concealed={renderer === 'webgl'} class="fallback" viewBox="0 0 560 360" fill="none">
      <ellipse cx="280" cy="170" rx="133" ry="45" transform="rotate(-25 280 170)" stroke="currentColor" stroke-width="1.5" />
      <ellipse cx="280" cy="170" rx="105" ry="70" transform="rotate(46 280 170)" stroke="currentColor" stroke-width="1.5" />
      <ellipse cx="280" cy="170" rx="77" ry="123" transform="rotate(36 280 170)" stroke="currentColor" stroke-width="1" />
      <circle cx="280" cy="170" r="48" class="fallback-core" />
      <path d="M232 170h96m-88-24h80m-80 48h80m-40-72c-33 27-33 69 0 96m0-96c33 27 33 69 0 96" stroke="currentColor" stroke-width=".6" opacity=".5" />
      <g class="fallback-signal"><circle cx="159" cy="212" r="4"/><circle cx="359" cy="218" r="4"/><circle cx="335" cy="69" r="3"/></g>
    </svg>
    <canvas bind:this={canvas} class:concealed={renderer !== 'webgl'} data-renderer={renderer}></canvas>
    <div class="axis-mark axis-top"></div>
    <div class="axis-mark axis-bottom"></div>
  </div>
  <div class="caption">
    <p class="eyebrow"><span class="status-light"></span> A CONNECTION IN THE MAKING</p>
    <h2>Your relay. <span>Coming into view.</span></h2>
    <p class="loading-status" role="status" aria-live="polite" aria-atomic="true">{messages[stage]}<span aria-hidden="true">…</span></p>
  </div>
  <div class="stage-track" aria-hidden="true">
    <span class:current={stage === 'info'} class:done={stage !== 'info'}></span>
    <span class:current={stage === 'config'} class:done={stage === 'content'}></span>
    <span class:current={stage === 'content'}></span>
  </div>
</section>

<style>
  .relay-loading { --ink: #292d35; --quiet: #69717f; --line: #c8cdd3; --gold: #99651e; position: relative; padding: 0 0 38px; color: var(--ink); text-align: center; isolation: isolate; }
  :global(.dark) .relay-loading { --ink: #edf0f5; --quiet: #9ca4b3; --line: #3b4350; --gold: #e9ba70; }
  .observatory { position: relative; width: min(100%, 560px); height: clamp(240px, 34vw, 340px); margin: 0 auto; }
  canvas, .fallback { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  .concealed { visibility: hidden; }
  .fallback { color: var(--gold); }
  .fallback-core { fill: #c5c9d2; }
  :global(.dark) .fallback-core { fill: #353e4e; }
  .fallback-signal { fill: var(--gold); }
  .field { position: absolute; inset: 12% 4%; background-image: radial-gradient(var(--line) .65px, transparent .65px); background-size: 19px 19px; opacity: .47; mask-image: radial-gradient(ellipse, black 10%, transparent 70%); }
  .ground { position: absolute; width: 40%; height: 16px; left: 30%; bottom: 11%; background: radial-gradient(ellipse, #34364b20, transparent 68%); filter: blur(5px); }
  :global(.dark) .ground { background: radial-gradient(ellipse, #d1b99018, transparent 68%); }
  .axis-mark { position: absolute; left: 50%; width: 1px; height: 10px; background: var(--line); }
  .axis-top { top: 6%; }
  .axis-bottom { bottom: 6%; }
  .caption { position: relative; margin-top: 2px; }
  .eyebrow { display: flex; justify-content: center; align-items: center; gap: 8px; font: 9px/1.5 ui-monospace, SFMono-Regular, Consolas, monospace; letter-spacing: 2px; color: var(--gold); }
  .status-light { width: 4px; height: 4px; background: currentColor; border-radius: 50%; box-shadow: 0 0 0 3px #b9822810; }
  h2 { margin: 14px 0 12px; font-size: clamp(20px, 3vw, 27px); font-weight: 450; letter-spacing: -.9px; line-height: 1.35; text-wrap: balance; }
  h2 span { color: var(--quiet); }
  .loading-status { color: var(--quiet); font-size: 12px; line-height: 1.5; min-height: 18px; }
  .stage-track { display: flex; justify-content: center; gap: 5px; margin: 24px auto 0; }
  .stage-track span { height: 2px; width: 24px; background: var(--line); border-radius: 2px; transition: background-color 160ms ease; }
  .stage-track .current { background: var(--gold); }
  .stage-track .done { background: var(--quiet); }
  @media (max-width: 480px) { .eyebrow { font-size: 8px; letter-spacing: 1.5px; } .relay-loading { padding-bottom: 26px; } }
  @media (prefers-reduced-motion: reduce) { .stage-track span { transition: none; } }
</style>
