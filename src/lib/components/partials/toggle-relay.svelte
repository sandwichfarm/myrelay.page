
<script lang="ts">

  import { browser } from '$app/environment';

  import Button from '../ui/button/button.svelte';

  import { writable } from 'svelte/store';
  import { getContext, tick } from 'svelte';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';

  import type { Writable } from 'svelte/store';
  import type { MRPNDKWrapper } from '$lib/core/services/ndk';

  const MRP = getContext(MY_RELAY_PAGE);

  const ndkw: Writable<MRPNDKWrapper> = writable();

  let url:string

  MRP.subscribe(async (mrp) => {
    await tick()
    url = mrp?.url
    ndkw.set(mrp?.ndk)
    await tick()
    //console.log(`signer user`, await $ndkw?.signer?.user())
  });

  const toggle = async () => {
    //console.log(hasJoined ? `leaving ${url}` : `joining ${url}`  );
    //console.log(`signer`, await $ndkw?.signer)
    //console.log(`signer user`, await $ndkw?.signer?.user())
    await $ndkw.toggleRelay(url)
    ndkw.set($ndkw);
  }

  $: hasJoined = $ndkw?.user?.hasRelay(url)
  $: showButton = browser && window?.nostr && $ndkw?.authed && !$ndkw?.relay?.info?.isPaymentRequired

</script>

{#if showButton}
  {#if hasJoined}
    <Button class="relative bg-red-700 hover:bg-red-800" on:click={toggle}>Leave Relay</Button>
  {:else}
    <Button class="relative" on:click={toggle}>Join Relay</Button>
  {/if}
{/if}