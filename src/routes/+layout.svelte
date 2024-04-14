

<script lang="ts">
  import "../app.pcss";
  import { browser } from '$app/environment';
  import { theme, loadTheme } from '$lib/stores/themeStore';

  import Header from '$lib/components/layout/Header.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';

  import { setContext, onMount, tick } from 'svelte';
  import { writable, type Writable } from 'svelte/store'

  import { MY_RELAY_PAGE, THEME_CSS } from '$lib/contextKeys';
  import { MyRelayPage } from '$lib/core/MRP.ts';

  export const ssr = false;
  export const prerender = true;
  export const trailingSlash = 'always';

  let mrp: Writable<MyRelayPage> = writable()
  let start: Writable<number> = writable(Date.now())

  setContext(MY_RELAY_PAGE, mrp);
  setContext(THEME_CSS, theme);

  const mount = async () => {

    await loadTheme();
    await tick()
    theme.subscribe((value) => {
      loadTheme(value);
    });

    await import('nostr-zap')
    let url: string | undefined;
    if(window.location.host.includes('localhost') || window.location.host.includes('myrelay.page')){
      const params = new URLSearchParams(window.location.search);
      url = params.get('url') || "wss://relaypag.es"
    };

    const _mrp = new MyRelayPage(url);

    _mrp.$.signal.on('state:changed', function(){ 
      // console.log('state:changed', ...arguments)
      mrp.set(_mrp);
    });

    _mrp.$.signal.on('root:pending', function(timestamp: number){ 
      document.body.classList.add('loading')
    })

    _mrp.$.signal.on('root:completed', function(timestamp: number){ 
      document.body.classList.remove('loading')
      document.body.classList.add('loaded')
      console.log(`loaded in ${Date.now()-$start}ms`)
    })

    mrp.set(_mrp);
    await _mrp.init();
    // mrp.set(_mrp);  
  }
  onMount(async () => {
    if(browser) {
      await mount().catch(console.error)
    }
  });

</script>

<svelte:head>
  <link id="theme" rel="stylesheet" />
</svelte:head>

<div id="mrp-bg-tint" class="flex flex-col min-h-screen relative">
  <div class="flex-grow">
    <div class="flex flex-col items-center justify-center">
      <div id="mrp-wrapper" class="mrp-wrapper-bg mrp-wrapper-content transition-colors duration-200 ease-in-out">
        <Header></Header>
        
        <slot></slot>
        {#if !$mrp?.nostr?.relay?.config?.isComplete}
          <span class="mt-5 text-center block text-black/20 dark:text-white/20 italic text-lg"> 
            loading operator config...  
          </span>
        {/if}
      </div>
      <Footer></Footer>
    </div>
  </div>
</div>

<style>

</style>