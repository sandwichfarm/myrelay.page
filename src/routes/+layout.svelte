

<script lang="ts">
  import "../app.pcss";

  import { setContext, onMount } from 'svelte';
	import { fade } from 'svelte/transition';
  import { writable, type Writable } from 'svelte/store'

  import { browser } from '$app/environment';
  import { theme, loadTheme } from '$lib/stores/themeStore';

  import Header from '$lib/components/layout/Header.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';

  import LoadingAnimation from '$lib/components/animations/RelayLoading.svelte';

  import { MY_RELAY_PAGE, THEME_CSS } from '$lib/contextKeys';
  import { MyRelayPage } from '$lib/core/MRP';

  export const ssr = false;
  export const prerender = true;
  export const trailingSlash = 'always';

  let MRP: Writable<MyRelayPage> = writable()

  setContext(MY_RELAY_PAGE, MRP);
  setContext(THEME_CSS, theme);

  let startupError = '';
  let reducedMotion = false;
  let loadingStage: 'info' | 'config' | 'content';
  $: loadingStage = !$MRP?.nostr?.relay?.info?.isComplete ? 'info' : !$MRP?.config?.isComplete ? 'config' : 'content';
  onMount(() => {
    let disposed = false;
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => { reducedMotion = motionPreference.matches; };
    updateMotion();
    motionPreference.addEventListener('change', updateMotion);
    let app: MyRelayPage | undefined;
    const stopTheme = theme.subscribe(value => { void loadTheme(value).catch(console.error); });
    const start = async () => {
      // Optional decoration must not prevent the relay page from loading.
      void import('nostr-zap').catch(console.error);
      const params = new URLSearchParams(window.location.search);
      const previewHost = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
        || window.location.hostname === 'myrelay.page'
        || window.location.hostname.endsWith('.netlify.app');
      const url = params.get('url') || (previewHost ? 'wss://relay.damus.io' : undefined);
      app = new MyRelayPage(url);
      MRP.set(app);
      const update = () => { if (!disposed && app) MRP.set(app); };
      app.$.signal.on('state:changed', update);
      await app.init();
      if (!disposed) {
        document.body.classList.remove('loading');
        document.body.classList.add('loaded');
        update();
      }
    };
    void start().catch(error => {
      if (!disposed) startupError = error instanceof Error ? error.message : String(error);
    });
    return () => {
      disposed = true;
      stopTheme();
      motionPreference.removeEventListener('change', updateMotion);
      app?.close();
    };
  });

</script>

<svelte:head>
  <link id="theme" rel="stylesheet" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="manifest" href="/site.webmanifest">
  <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#603cba">
  <meta name="msapplication-TileColor" content="#603cba">
  <meta name="theme-color" content="#ffffff">
</svelte:head>

<div id="mrp-bg-tint" class="flex flex-col min-h-screen relative overflow-hidden">
  <div class="flex-grow">
    <div class="flex flex-col items-center justify-center">
      <div id="mrp-wrapper" class="w-full md:w-auto mrp-wrapper-bg mrp-wrapper-content transition-colors duration-200 ease-in-out">
        <Header></Header>
        <div class="page-stage">
        {#if startupError}
          <p role="alert" class="p-6">Unable to load this relay: {startupError}</p>
        {:else if !$MRP?.loader?.isComplete}
          <div out:fade={{ duration: reducedMotion ? 0 : 140 }} class="loading-layer">
            <LoadingAnimation stage={loadingStage} />
          </div>
        {:else}
        <div>
          {#if !$MRP?.nostr?.relay?.info?.loaded}
            <p role="status" class="p-4 text-muted-foreground">Relay information is unavailable. The relay may be offline or may not allow browser requests.</p>
          {/if}
          <slot></slot>
        </div>
        {/if}
        </div>
      </div>
      <Footer></Footer>
    </div>
  </div>
</div>

<style>
  .page-stage { display: grid; }
  .page-stage > :global(*) { grid-area: 1 / 1; min-width: 0; }
  .loading-layer { background: inherit; pointer-events: none; }
</style>