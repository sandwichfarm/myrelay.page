
<script lang="ts">

  import { browser } from '$app/environment';

  import Button from '../ui/button/button.svelte';

  import { writable } from 'svelte/store';
  import { getContext, tick } from 'svelte';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';

  import type { Writable } from 'svelte/store';
  import type { MRPNostr } from '$lib/core/MRPNostr';

  const MRP = getContext<import("svelte/store").Writable<import("$lib/core/MRP").MyRelayPage>>(MY_RELAY_PAGE);

  const nostrState: Writable<MRPNostr> = writable();

  let url:string

  MRP.subscribe(async (mrp) => {
    await tick()
    url = mrp?.url || ''
    nostrState.set(mrp?.nostr)
    await tick()
  });

  let pending = false;
  let relayError = '';
  const toggle = async () => {
    if (pending) return;
    pending = true;
    relayError = '';
    try {
      await $nostrState.toggleRelay(url);
      nostrState.set($nostrState);
    } catch (error) {
      relayError = error instanceof Error ? error.message : String(error);
    } finally { pending = false; }
  }

  $: hasJoined = $nostrState?.user?.hasRelay(url)
  $: showButton = browser && window?.nostr && $nostrState?.authed && !$nostrState?.relay?.info?.isPaymentRequired

</script>

{#if relayError}<span role="alert">{relayError}</span>{/if}
{#if showButton}
  {#if hasJoined}
    <Button class="relative bg-red-700 hover:bg-red-800" disabled={pending} on:click={toggle}>Leave Relay</Button>
  {:else}
    <Button class="relative" disabled={pending} on:click={toggle}>Join Relay</Button>
  {/if}
{/if}