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

<span class="block text-white mt-2 text-sm mb-32">
  powered by myrelay.page 
  <button
      id="mrp-support"
      data-npub="npub1uac67zc9er54ln0kl6e4qp2y6ta3enfcg7ywnayshvlw9r5w6ehsqq99rx"
      class="px-1 rounded-xl">
    ⚡️
    </button>
</span>