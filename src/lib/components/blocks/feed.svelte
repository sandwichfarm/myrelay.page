<script lang="ts">
  import { browser } from '$app/environment';
  import { getContext } from 'svelte';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import { parseMP4s, parseImages } from '$lib/utils';
  import Time from 'svelte-time';

  import Badge from '$lib/components/ui/badge/badge.svelte';
  
  const mrp_context = getContext(MY_RELAY_PAGE);

  let feed: NDKEvent[] = []

  mrp_context.subscribe(async (mrp) => { 
    await mrp.ndk.relay.fetchRelayNotes()
    feed = Array.from(mrp.ndk.relay.feed)
  })

</script>
<div>feed</div>
<div class="flex-1 ml-0 m-0"> 
  {#if browser && feed?.length}
  <div class="feed w-full max-w-xs">
    {#each feed as note, index}  
        <div class="note block align-middle min-h-max bg-white/90 px-5 py-3 pb-10 rounded-lg shadow transition-opacity duration-500 relative max-h-72 overflow-hidden " in:fade={{ duration: 500 }} out:fade={{ duration: 0 }}>
          <Time relative timestamp={note.created_at*1000} class="block text-sm font-bold" />
          {@html  parseMP4s(parseImages(note.content)) } 
          {#each note.tags as tag}
            {#if tag[0] === 't'}
              <Badge class="mt-2">{tag[1]}</Badge> 
            {/if}
          {/each}

        </div>
    {/each}
  </div>
{/if}
</div>
<style>
</style>