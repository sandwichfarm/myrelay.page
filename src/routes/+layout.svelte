

<script lang="ts">
  import "../app.pcss";

  import { setContext, onMount, tick } from 'svelte';
	import { slide, fade } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
  import { writable, type Writable } from 'svelte/store'

  import { browser } from '$app/environment';
  import { theme, loadTheme } from '$lib/stores/themeStore';

  import Header from '$lib/components/layout/Header.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';

  // import LoadingAnimation from '$lib/components/animations/char-chaos.svelte';
  import LoadingAnimation from '$lib/components/animations/squares.svelte';

  import { MY_RELAY_PAGE, THEME_CSS } from '$lib/contextKeys';
  import { MyRelayPage } from '$lib/core/MRP.ts';

  export const ssr = false;
  export const prerender = true;
  export const trailingSlash = 'always';

  let MRP: Writable<MyRelayPage> = writable()
  let start: Writable<number> = writable(Date.now())

  setContext(MY_RELAY_PAGE, MRP);
  setContext(THEME_CSS, theme);

  // const [send, receive] = crossfade({
	// 	duration: 1500,
	// 	easing: quintOut
	// });

  // const key = 'LOADER'

  const mount = async () => {

    await loadTheme();
    await tick()
    theme.subscribe((value) => {
      loadTheme(value);
    });

    await import('nostr-zap')
    let url: string | undefined;
    if(window.location.host.includes('localhost') || window.location.host.includes('myrelay.page') || window.location.host.includes('netlify')){
      const params = new URLSearchParams(window.location.search);
      // url = params.get('url') || "wss://lunchbox.sandwich.farm"
      url = params.get('url') || "wss://appdata.kindpag.es"
    };

    MRP.set(new MyRelayPage(url))

    $MRP.$.signal.on('state:changed', function(){ 
      // console.log('state:changed', ...arguments)
      MRP.set($MRP);
    });

    $MRP.$.signal.on('root:pending', function(timestamp: number){ 
      document.body.classList.add('loading')
    })

    $MRP.$.signal.on('root:completed', function(timestamp: number){ 
      document.body.classList.remove('loading')
      document.body.classList.add('loaded')
      console.log(`loaded in ${Date.now()-$start}ms`)
    })

    MRP.set($MRP);
    await $MRP.init();
  }
  onMount(async () => {
    if(browser) {
      await mount().catch(console.error)
    }
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
        <!-- <div transition:slide={{ delay: 0, duration: 300, easing: quintOut, axis: 'y' }}>
          <LoadingAnimation />
        </div> -->
        <!-- {#if !$MRP?.nostr?.relay?.config?.isComplete}
          <div transition:slide={{ delay: 0, duration: 300, easing: quintOut, axis: 'y' }}>
            <LoadingAnimation />
          </div>
        {:else}
        <div transition:fade>
          <slot></slot>
        </div>
        {/if} -->

        {#if !$MRP?.nostr?.relay?.config?.isComplete}
          <div transition:slide={{ delay: 0, duration: 1000, easing: quintOut, axis: 'y' }}>
            <LoadingAnimation />
          </div>
        {:else}
        <div>
          <slot></slot>
        </div>
        {/if}
      </div>
      <Footer></Footer>
    </div>
  </div>
</div>

<style>

</style>