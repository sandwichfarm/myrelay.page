<script lang="ts">
  import { browser } from '$app/environment';
  import { getContext } from 'svelte';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import { parseMP4s, parseImages } from '$lib/utils';
  import Time from 'svelte-time';

  import Badge from './ui/badge/badge.svelte';
  
  const mrp_context = getContext(MY_RELAY_PAGE);

  let feed: NDKEvent[] = []

  mrp_context.subscribe(async (mrp) => { 
    await mrp.ndk.relay.fetchRelayNotes()
    feed = Array.from(mrp.ndk.relay.feed)
  })

</script>
<div>feed</div>
{ feed?.length }
<div class="flex-1 ml-0 m-0"> 
  {#if browser && feed?.length}
  <div class="feed w-full max-w-xs">
    <!-- <h3 class="scroll-m-20 text-1xl font-extrabold  mt-3 lg:text-2xl mb-6">Owner Notes</h3> -->
    {#each feed as note, index}  
        <div class="note block align-middle min-h-max bg-white/90 px-5 py-3 pb-10 rounded-lg shadow transition-opacity duration-500 relative max-h-72 overflow-hidden " in:fade={{ duration: 500 }} out:fade={{ duration: 0 }}>
          <Time relative timestamp={note.created_at*1000} class="block text-sm font-bold" />
          {@html  parseMP4s(parseImages(note.content)) } 
          {#each note.tags as tag}
            {#if tag[0] === 't'}
              <Badge class="mt-2">{tag[1]}</Badge> 
            {/if}
          {/each}
          <!-- {#if note?.id && owner?.feedPointers?.[note.id]}
            <a href="https://nostr.at/{ nip19.neventEncode( owner?.feedPointers?.[note.id] ) }" target="_blank" class="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-white/90 via-white/90 via-white/90 to-white/0">view</a>
          {/if} -->
        </div>
    {/each}
  </div>
{/if}
</div>
<style>
</style>