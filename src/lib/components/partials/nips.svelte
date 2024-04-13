
<script lang="ts">
  import { writable, type Writable } from 'svelte/store';
  import { getContext } from 'svelte';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import type { MRPRelay } from '$lib/core/relay';
  import type { MyRelayPage } from '$lib/core/MRP';
    import Skeleton from '../ui/skeleton2/Skeleton.svelte';

  const MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);
  const relay: Writable<MRPRelay> = writable();

  MRP.subscribe((mrp) => {
    relay.set(mrp?.nostr?.relay)
  });
  $: hasNips = $relay?.info?.nips instanceof Array

</script>

{#if hasNips }
<span class="inline-flex items-center border rounded-full px-2.5 py-0.5 text-italic font-semibold transition-colors focus:outline-none select-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-slate-500 border-transparent text-primary-foreground text-sm mr-1">
  nips
</span>
  {#each $relay?.info?.nips as nip}
    <a 
      href="https://github.com/nostr-protocol/nips/blob/master/{ nip }.md" 
      target="_blank" 
      class="inline-flex items-center border rounded-full px-2.5 py-0.5 font-semibold transition-colors focus:outline-none select-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-primary text-white/85 dark:text-black/85 hover:bg-primary/80 hover:text-white/100 border-transparent text-primary-foreground text-sm mr-1"
      >
      { nip }
    </a>
  {/each} 
{:else}
{#each Array.from({ length: 10 }) as _, i}
  <Skeleton class="mr-2 inline-block dark:hidden" count={1} width={40} />
  <Skeleton class="mr-2 hidden dark:inline-block rounded-lg" count={1} width={40} height={30} color="rgba(10,10,10,0.9)" highlightColor="rgba(20,20,20,0.4)" />
{/each}
{/if}


