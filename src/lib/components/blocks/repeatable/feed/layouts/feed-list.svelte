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
    headingClass="text-xl mb-4 font-bold text-black/95 dark:text-white/95"
    class="w-full mb-5 text-black/70 dark:text-white/70" />
{/each}