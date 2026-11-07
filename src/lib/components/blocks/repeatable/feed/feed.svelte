<script lang="ts">
  import FeedGrid from '$lib/components/blocks/repeatable/feed/layouts/feed-grid.svelte'
  import FeedGridSkeleton from '$lib/components/blocks/repeatable/feed/layouts/feed-grid.skeleton.svelte'
  import FeedList from '$lib/components/blocks/repeatable/feed/layouts/feed-list.svelte'

  import { get } from 'svelte/store';

  import { getContext, onMount, onDestroy, tick } from 'svelte';

  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';
  import type { MyRelayPage } from '$lib/core/MRP';

  import type { Filter } from 'nostr-tools';
  import type { EventPointer } from 'nostr-tools/nip19';
  import { MRPStage, MRPStatus } from '$lib/core/MRPData';
  import Block from '$lib/components/wrappers/block.svelte';
  import { MRPFeed, type MRPFeedOptions } from '$lib/core/MRPFeed';

  const MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);
  const Feed: Writable<MRPFeed | undefined> = writable(undefined)
  const initialized: Writable<boolean> = writable(false)
  const attempts: Writable<number> = writable(0)

  export let key: string = "";
  export let id: string = ""; 

  const generateFilter = (): Filter => {
    const filter: Filter = {}
    if(options?.filterKinds?.length > 0)  filter.kinds = options?.filterKinds || []
    if(options?.filterAuthors?.length > 0) filter.authors = options?.filterAuthors || []
    if(options?.filterTopics?.length > 0) filter['#t'] = options?.filterTopics || []
    filter.limit = parseInt(options?.filterLimit) || 15
    return filter
  }

  let loading = false;
  const initialize = async () => {
    if ($initialized || loading || editor || !relay || !options) return;
    loading = true;
    try {
      const relays = [relay.url];
      const exclude = options.excludeOperator && relay.owner?.pubkey
        ? { pubkey: relay.owner.pubkey } : {};
      Feed.set(new MRPFeed(state, key, { filter: generateFilter(), relays, exclude, pointerRelays: relays }));
      await $Feed?.fetch();
      Feed.set($Feed);
      initialized.set(true);
    } finally { loading = false; }
  }

  $: editor = $MRP?.editor?.enabled
  $: relay = $MRP?.nostr?.relay
  $: options = $MRP?.loader?.getOptions(key)
  $: feedLoaded = $MRP?.nostr?.relay?.feed?.isComplete
  $: feedPopulated = $Feed?.notes?.length
  $: showBlock = $MRP?.editor?.enabled || feedLoaded
  $: showFeed = $MRP?.editor?.enabled || !$MRP?.nostr?.relay?.feed?.isComplete || notes?.length 
  $: notes = $Feed? $Feed?.notes: undefined
  $: pointers = $Feed? $Feed?.pointers: undefined
  $: state = $MRP.$
  $: layout = options?.feedLayout || 'grid'

  $: if (options && relay && !editor) initialize();
</script> 

<!-- {#if showFeed } -->
<Block headingClass="col-span-5" {key} {id}>
  <svelte:fragment slot="content">
    {#if layout === 'grid'  }
      {#if $initialized}
        <FeedGrid 
          {notes} 
          {pointers}
          maxColWidth={options?.gridMaxColWidth}
          minColWidth={options?.gridMinColWidth}
          gap={options?.gridGap}
          animate={options?.gridAnimate}
          /> 
      {:else}
        <FeedGridSkeleton />
      {/if}
    {/if}

    {#if layout === 'list' }
      <FeedList 
        {notes} 
        {pointers}
        />
    {/if}
    
  </svelte:fragment>
</Block>
<!-- {/if} -->