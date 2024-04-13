<script lang="ts">
  import { writable } from 'svelte/store';
  import { getContext } from 'svelte';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';

  import type { Writable } from 'svelte/store';

  import { Badge } from "$lib/components/ui/badge";
  import type { MRPRelay } from '$lib/core/relay';
  import type { MyRelayPage } from '$lib/core/MRP';

  const MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);

</script>
{#if $MRP?.nostr?.relay?.info?.software || $MRP?.nostr?.relay?.info?.version}
  <div class="mt-4 italic text-xs font-bold text-gray-400">
    {#if $MRP?.nostr?.relay?.info?.software}
      <span class="inline-block mr-1">Software: 
        <span class="border-black/10 border-b-2 border-dotted text-gray-600">{$MRP?.nostr?.relay?.info?.software}</span>
      </span>
    {/if}

    {#if $MRP?.nostr?.relay?.info?.version}
      <span class="">Version: 
        <span class="border-black/10 border-b-2 border-dotted text-gray-600">{$MRP?.nostr?.relay?.info?.version}</span>
      </span>
    {/if}

    <!-- {#if $MRP?.nostr?.relay?.info?.software}
    <Badge variant="outline" class="bg-gray-200 rounded-sm mr-2 mb-1">
      <span class="inline-block mr-1">{$MRP?.nostr?.relay?.info?.software}</span>
    </Badge>
    {/if}

    {#if $MRP?.nostr?.relay?.info?.version}
    <Badge variant="outline" class="bg-gray-200 rounded-sm mr-2 mb-1">
      <span class="">{$MRP?.nostr?.relay?.info?.version}</span>
    </Badge>
    {/if} -->
  </div>
{/if}