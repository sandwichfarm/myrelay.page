
<script lang="ts">

  import { browser } from '$app/environment';

  import { writable } from 'svelte/store';
  import { getContext } from 'svelte';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';

  import type { Writable } from 'svelte/store';
  import type { MRPUser } from '$lib/core/user';

  import Button from '../ui/button/button.svelte';

  const MRP = getContext(MY_RELAY_PAGE);

  const relay: Writable<MRPRelay> = writable();

  MRP.subscribe((mrp) => {
    if(!mrp?.ndk?.relay) return
    relay.set(mrp?.ndk?.relay)
  });

  $: showButton = browser && $relay?.info?.isPaymentRequired 
  $: paymentsGo = () => {
    if(!$relay?.info?.payments_url) return console.error('no payments url', $relay?.info?.payments_url)
    document.location = $relay?.info?.payments_url
  }


</script>
{#if showButton }
  <Button class="relative bg-orange-600 hover:bg-orange-800" on:click={paymentsGo()}>Join Relay</Button>
{/if}


