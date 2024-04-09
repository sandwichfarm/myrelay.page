

<script lang="ts">
  import "../app.pcss";
  import { browser } from '$app/environment';
  import { theme, loadTheme } from '$lib/stores/themeStore';

  import Header from '$lib/components/layout/Header.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';

  import { setContext, onMount } from 'svelte';
  import { writable, type Writable } from 'svelte/store'

  import { MY_RELAY_PAGE, THEME_CSS } from '$lib/contextKeys';
  import { MyRelayPage } from '$lib/core/MRP.ts';

  export const ssr = false;
  export const prerender = true;
  export const trailingSlash = 'always';

  let _mrp: Writable<MyRelayPage | null> = writable(null)

  setContext(MY_RELAY_PAGE, _mrp);
  setContext(THEME_CSS, theme);

  const mount = async () => {
    if(browser) {
      theme.subscribe((value) => {
        loadTheme(value);
      });
      loadTheme();
      await import('nostr-zap')
      let url: string | undefined;
      if(window.location.host.includes('localhost') || window.location.host.includes('myrelay.page')){
        const params = new URLSearchParams(window.location.search);
        url = params.get('url') || "wss://monitorpag.es"
      }
      const mrp = new MyRelayPage(url)
      _mrp.set(mrp)
      mrp.signal.on('mrp:changed', () => { _mrp.set(mrp) })
      await mrp.init()     
    }
  }

  onMount(mount);

</script>

<svelte:head>
  <link id="theme" rel="stylesheet" href={`/themes/${$theme}.css`} />
</svelte:head>

<div class="flex flex-col min-h-screen relative">
  <div class="flex-grow">
    <div class="flex flex-col items-center justify-center">
      <div class="max-w-screen-lg mt-10 bg-white rounded-xl shadow-2xl p-20 pt-16">
        <Header></Header>
        <slot></slot>
      </div>
      <Footer></Footer>
    </div>
  </div>
</div>

<style>

</style>