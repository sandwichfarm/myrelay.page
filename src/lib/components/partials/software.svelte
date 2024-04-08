<script lang="ts">
  import { writable } from 'svelte/store';
  import { getContext } from 'svelte';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';

  import type { Writable } from 'svelte/store';

  import { Badge } from "$lib/components/ui/badge";
  import type { MRPRelay } from '$lib/core/relay';
  import type { MyRelayPage } from '$lib/core/main';

  const MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);

  const relay: Writable<MRPRelay> = writable();

  MRP.subscribe((mrp) => {
    if(!mrp?.ndk?.relay) return
    relay.set(mrp.ndk.relay)
  });

</script>
{#if $relay?.info?.software || $relay?.info?.version}
  <div class="mt-3 italic text-xs font-bold text-gray-400">
    {#if $relay?.info?.software}
      <span class="inline-block mr-1">Software: 
        <span class="border-black/10 border-b-2 border-dotted text-gray-600">{$relay?.info?.software}</span>
      </span>
    {/if}

    {#if $relay?.info?.version}
      <span class="">Version: 
        <span class="border-black/10 border-b-2 border-dotted text-gray-600">{$relay?.info?.version}</span>
      </span>
    {/if}

    <!-- {#if $relay?.info?.software}
    <Badge variant="outline" class="bg-gray-200 rounded-sm mr-2 mb-1">
      <span class="inline-block mr-1">{$relay?.info?.software}</span>
    </Badge>
    {/if}

    {#if $relay?.info?.version}
    <Badge variant="outline" class="bg-gray-200 rounded-sm mr-2 mb-1">
      <span class="">{$relay?.info?.version}</span>
    </Badge>
    {/if} -->
  </div>
{/if}