<script lang="ts">
  import FeedGrid from '$lib/components/partials/feed-grid.svelte'
  import FeedGridSkeleton from '$lib/components/partials/feed-grid.skeleton.svelte'

  import { get } from 'svelte/store';

  import { getContext, onMount, onDestroy, tick } from 'svelte';

  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';
  import type { MyRelayPage } from '$lib/core/MRP';

  import NDK, { NDKEvent } from '@nostr-dev-kit/ndk';
  import type { EventPointer } from 'nostr-tools/nip19';
    import { MRPStage, MRPStatus } from '$lib/core/MRPData';

  const MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);

  const notes: Writable<NDKEvent[]> = writable([]);
  const pointers: Writable<Record<string, EventPointer>> = writable({});
  let feed: NDKEvent[] = []
  onMount(async () => {
    MRP.subscribe((mrp) => {
      if (!mrp?.ndk?.relay) {
        notes.set([]); 
      } else {
        let relay = mrp?.ndk?.relay
        let $feed = relay?.feed 
        feed = $feed?.notes || []
        notes.set(feed || [])
        pointers.set($feed?.pointers)
      }
    });
  });
</script> 

{#if !$MRP?.ndk?.relay?.feed?.isComplete || $notes?.length}
<div class="block-container">
  <h3 class="title block w-full">
    relay feed
  </h3>
  {#if $notes?.length}
    <FeedGrid notes={$notes} pointers={$pointers} /> 
  {:else}
    <FeedGridSkeleton />
  {/if}
</div>
{/if}