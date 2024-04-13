<script lang="ts">
  import { getContext } from 'svelte';
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';

  import { Badge } from "$lib/components/ui/badge";
  
  import type { MyRelayPage } from '$lib/core/MRP';
  import type { MRPRelay } from '$lib/core/relay';

  import { MY_RELAY_PAGE } from '$lib/contextKeys';
    import Skeleton from '../ui/skeleton2/Skeleton.svelte';
  
  const MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);

  const relay: Writable<MRPRelay> = writable();

    MRP.subscribe((mrp) => {
    if(!mrp?.nostr?.relay) return
    relay.set(mrp?.nostr?.relay)
  });
</script>

<div class="mb-4">
  {#if $relay?.info}
    {#if $relay?.info?.isPaymentRequired }
      <Badge class="border-transparent bg-orange-600 text-destructive-foreground hover:bg-orange-600/80">Payment Required</Badge>
    {:else}
      <Badge class="border-transparent bg-green-600 text-destructive-foreground hover:bg-green-600/80">Public</Badge>
    {/if}

    {#if $relay?.info?.isAuthRequired }
      <Badge class="border-transparent bg-purple-500 text-destructive-foreground hover:bg-purple-500/80">Auth Challenge</Badge>
    {:else}
      <Badge class="border-transparent bg-green-600 text-destructive-foreground hover:bg-green-600/80">No Auth Challenge</Badge>
    {/if}
  {:else}
    <Skeleton count={1} width={300} />
  {/if}
</div>

