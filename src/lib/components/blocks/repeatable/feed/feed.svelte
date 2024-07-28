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

  import NDK, { NDKEvent, NDKRelaySet, NDKRelay } from '@nostr-dev-kit/ndk';
  import type { NDKFilter } from '@nostr-dev-kit/ndk';
  import type { EventPointer } from 'nostr-tools/nip19';
  import { MRPStage, MRPStatus } from '$lib/core/MRPData';
  import Block from '$lib/components/wrappers/block.svelte';
  import { MRPFeed } from '$lib/core/MRPFeed';

  const MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);
  const Feed: Writable<MRPFeed> = writable(undefined)
  const initialized: Writable<boolean> = writable(false)
  const attempts: Writable<number> = writable(0)

  export let key: string = "";
  export let id: string = ""; 

  const generateFilter = (): NDKFilter => {
    const filter: NDKFilter = {}
    if(options?.filterKinds.length > 0)  filter.kinds = options.filterKinds || []
    if(options?.filterAuthors.length > 0) filter.authors = options.filterAuthors || []
    if(options?.filterTopics.length > 0) filter['#t'] = options.filterTopics || []
    filter.limit = parseInt(options.filterLimit) || 15
    return filter
  }

  const initialize = async () => {
    attempts.update(n => n + 1)
    if($initialized === true || editor) return console.warn('already initialized')
    if(attempts > 10) return console.error('Failed to initialize feed')
    if(!relay?.owner?.isComplete || !options) return setTimeout(initialize, 1000)
    
    const exclude = options?.excludeOperator? { pubkey: this.owner?.pubkey as string }: {}
    const filter: NDKFilter = generateFilter()
    const relays: NDKRelaySet = new NDKRelaySet(new Set([new NDKRelay(relay.url as string)]), ndk)
    
    const feedOptions: MRPFeedOptions = { 
      filter,
      relays, 
      exclude,
      pointerRelays: relays, 
    }

    Feed.set(new MRPFeed(state, key, feedOptions))
    await $Feed.fetch()
    Feed.set($Feed)

    initialized.set(true)
  }

  $: editor = $MRP?.editor?.enabled
  $: relay = $MRP?.nostr?.relay
  $: options = $MRP?.loader?.config?.event?.config?.blocks?.[key]?.options
  $: feedLoaded = $MRP?.nostr?.relay?.feed?.isComplete
  $: feedPopulated = $Feed?.notes?.length
  $: showBlock = $MRP?.editor?.enabled || feedLoaded
  $: showFeed = $MRP?.editor?.enabled || !$MRP?.nostr?.relay?.feed?.isComplete || notes?.length 
  $: notes = $Feed? $Feed?.notes: undefined
  $: pointers = $Feed? $Feed?.pointers: undefined
  $: state = $MRP.$
  $: ndk = state.ndk
  $: layout = options?.feedLayout || 'grid'

  onMount(initialize)
</script> 

<!-- {#if showFeed } -->
<Block headingClass="col-span-5" {key}>
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