<script lang="ts">
  import Masonry from 'svelte-bricks';
  import type { NDKEvent } from '@nostr-dev-kit/ndk';
  import type { EventPointer } from 'nostr-tools/nip19';
  //
  import Note from '$lib/components/partials/note.svelte';
  //
  //content settings
  export let notes: NDKEvent[] = []; // Initialize to an empty array
  export let pointers: Record<string, EventPointer> = {}; // Initialize to an empty array
  //list settings

  $: notes = notes.filter(note => typeof note !== 'undefined')
  $: image = (note: NDKEvent) => note.tags.find(t => t[0] === 'image')?.[1]
</script>

<!-- {JSON.stringify(notes)} -->

{#each notes as note}
  <Note 
    note={note} 
    pointer={pointers[note.id]} 
    
    noClass={true} 
    showJump={false}
    showSummary={true}
    summaryTruncate={true}
    summaryWordsLength={50}

    class=" w-full mb-5 pb-5 
            border-b last:border-b-0 border-b-black/10 dark:border-b-white/10 
            text-black/70 dark:text-white/70"

    headingClass="mb-4 
                  text-2xl font-bold uppercase tracking-tighter
                  text-gray-800 dark:text-purple-200/70"

    timeAgoClass="text-gray-700 dark:text-purple-50/70 font-normal tracking-widest text-xs uppercase"
    
    contentClass="leading-loose tracking-wide text-black/80 dark:text-white/80"
  >
  <svelte:fragment slot="belowTitle">
    {#if image(note)}
      <div class="overflow-hidden rounded-lg max-h-32 shadow-inner mb-4">
        <img src="{ image(note) }" />
      </div>
    {/if}
  </svelte:fragment>
  </Note>
{/each}