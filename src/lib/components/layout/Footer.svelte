<script lang="ts">
    import { onMount } from 'svelte';
    import { browser } from '$app/environment';

    onMount(async ()=>{
      if(browser) {
        const el = document?.querySelector('#mrp-support')
        window?.nostrZap?.initTarget(el)
      }
    })
</script>

<span id="ohai" class="mt-5 mb-32 text-purple-950 dark:text-purple-50 font-bold text-sm transition-opacity duration-100">
  powered by <a href="https://github.com/sandwichfarm/myrelay.page" target="_blank">myrelay.page</a> 
  <button
      id="mrp-support"
      data-npub="npub1uac67zc9er54ln0kl6e4qp2y6ta3enfcg7ywnayshvlw9r5w6ehsqq99rx"
      class="px-1 rounded-xl">
    ⚡️
    </button>
</span>

<style>
  :global(body #ohai) {
    opacity: 0;
  }

  :global(body.loaded #ohai) {
    opacity: 1;
  }
</style>