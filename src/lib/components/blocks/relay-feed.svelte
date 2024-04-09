<script lang="ts">
  import FeedGrid from '$lib/components/partials/feed-grid.svelte'
  import FeedGridSkeleton from '$lib/components/partials/feed-grid.skeleton.svelte'

  import { get } from 'svelte/store';

  import { getContext, onMount, onDestroy, tick } from 'svelte';

  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';
  import type { MyRelayPage } from '$lib/core/main';

  import NDK, { NDKEvent } from '@nostr-dev-kit/ndk';
  import type { EventPointer } from 'nostr-tools/nip19';

  const MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);

  const notes: Writable<NDKEvent[]> = writable([]);
  const pointers: Writable<Record<string, EventPointer>> = writable({});
  let feed: NDKEvent[] = []

  MRP.subscribe((mrp) => {
    if (!mrp?.ndk?.relay) {
      notes.set([]); 
    } else {
      let relay = mrp?.ndk?.relay
      let $feed = relay?.feed 
      feed = $feed?.notes || []
      notes.set(feed || [])
      pointers.set($feed?.pointers)
      //console.log(Array.from(feed)[0])
    }
  });
</script> 
<div class="mt-10 p-2h-80 bg-gradient-to-b from-gray-100 to-white py-5 px-5 rounded-lg">
  <h3 class="mb-2 text-gray-600 scroll-m-20 text-xl font-extrabold tracking-tight block w-full">
    relay feed
  </h3>
  {#if $notes?.length}
    <FeedGrid notes={$notes} pointers={$pointers} /> 
  {:else}
    <FeedGridSkeleton />
  {/if}
</div>