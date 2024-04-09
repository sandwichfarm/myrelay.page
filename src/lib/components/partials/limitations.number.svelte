
<script lang="ts">
  import { writable } from 'svelte/store';
  import { getContext } from 'svelte';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';

  import type { Writable } from 'svelte/store';

  import { Badge } from "$lib/components/ui/badge";
  import type { MRPRelay } from '$lib/core/relay';
  import type { MyRelayPage } from '$lib/core/MRP';
  import Skeleton from '../ui/skeleton2/Skeleton.svelte';

  const MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);

  const relay: Writable<MRPRelay> = writable();

  MRP.subscribe((mrp) => {
    if(!mrp?.ndk?.relay) return
    relay.set(mrp.ndk.relay)
  });
  
</script>

<div class="mb-2 mt-3">
{#if Object.keys($relay?.info || {}).length}
  {#each Object.entries($relay?.info?.limitations || {}) as limitation}
    {#if typeof limitation[1] === 'number'}
      <Badge variant="outline" class="cursor-crosshair rounded-sm mr-2 mb-1">
        <span class="w-full block text-xs text-gray-400 ">{limitation[0].replace(/_/g, " ")}</span>
        <span class="text-lg w-full block text-center text-gray-600 ">{limitation[1]}</span>
      </Badge>
    {/if}
  {/each}
{:else}
  <Skeleton count={1} width={150} />
  <Skeleton count={1} width={150} />
{/if}
</div>



