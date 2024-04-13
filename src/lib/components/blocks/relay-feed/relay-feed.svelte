<script lang="ts">
  import FeedGrid from '$lib/components/blocks/relay-feed/feed-grid.svelte'
  import FeedGridSkeleton from '$lib/components/blocks/relay-feed/feed-grid.skeleton.svelte'

  import { get } from 'svelte/store';

  import { getContext, onMount, onDestroy, tick } from 'svelte';

  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';
  import type { MyRelayPage } from '$lib/core/MRP';

  import NDK, { NDKEvent } from '@nostr-dev-kit/ndk';
  import type { EventPointer } from 'nostr-tools/nip19';
  import { MRPStage, MRPStatus } from '$lib/core/MRPData';
  import Block from '$lib/components/wrappers/block.svelte';

  const MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);

  const notes: Writable<NDKEvent[]> = writable([]);
  const pointers: Writable<Record<string, EventPointer>> = writable({});
  let feed: NDKEvent[] = []

  export let key: string = "";

  onMount(async () => {
    MRP.subscribe((mrp) => {
      let relay = mrp?.nostr?.relay
      if (!relay) {
        notes.set([]); 
      } else {
        let $feed = relay?.feed 
        feed = $feed?.notes || []
        notes.set(feed || [])
        pointers.set($feed?.pointers)
      }   
    });
  });

  $: showFeed = $MRP?.editor?.enabled || !$MRP?.nostr?.relay?.feed?.isComplete || $notes?.length 
</script> 

{#if showFeed }
<Block innerClass="" headingClass="col-span-5" {key}>
  <svelte:fragment slot="title">
    relay feed
  </svelte:fragment>
  <svelte:fragment slot="content">
    {#if $notes?.length}
      <FeedGrid notes={$notes} pointers={$pointers} /> 
    {:else}
      <FeedGridSkeleton />
    {/if}
  </svelte:fragment>
</Block>
{/if}