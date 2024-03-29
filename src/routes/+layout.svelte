

<script lang="ts">
  import "../app.pcss";
  import { browser } from '$app/environment';

  import Header from '$lib/components/layout/Header.svelte';
  import Footer from '$lib/components/layout/Footer.svelte';

  import { setContext, onMount } from 'svelte';
  import { writable } from 'svelte/store'

  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import { MyRelayPage } from '$lib/core/main.ts';

  export const ssr = false;
  export const prerender = true;
  export const trailingSlash = 'always';

  let _mrp = writable(null)

  setContext(MY_RELAY_PAGE, _mrp);

  const mount = async () => {
    if(browser){
      await import('nostr-zap')
      let url: string | undefined;
      if(window.location.host.includes('localhost') || window.location.host.includes('myrelay.page')){
        const params = new URLSearchParams(window.location.search);
        url = params.get('url') || "wss://monitorpag.es"
      }
      const mrp = new MyRelayPage(url)
      _mrp.set(mrp)
      await mrp.init()
      _mrp.set(mrp)
    }
  }

  onMount(mount);

</script>

<div class="flex flex-col min-h-screen min-w-3.5 relative">
  <div class="flex-grow">
    <div class="flex flex-col items-center justify-center">
      <div class="max-w-screen-lg mt-10 bg-white rounded-xl shadow-2xl p-20">
        <Header></Header>
        <slot></slot>
      </div>
      <Footer></Footer>
    </div>
  </div>
</div>

<style>

</style>