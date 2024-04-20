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
  //grid settings
  export let minColWidth: number = 200;
  export let maxColWidth: number = 800;
  export let gap: number = 20;
  export let animate: boolean = true;

</script>

<Masonry
  items={notes}
  {minColWidth}
  {maxColWidth}
  {gap}
  {animate}
  let:item >
  <Note 
    note={item} 
    pointer={pointers[item.id]}

    timeAgoClass="text-gray-800 dark:text-purple-50/70 font-normal tracking-widest text-xs uppercase"

    headingClass="mb-4 
              text-2xl font-bold uppercase tracking-tighter
              text-black/95 dark:text-purple-200/70"

    contentClass="tracing-wide leading-loose
                  text-black/80 hover:text-black/90
                  dark:text-white/80 hover:dark:text-white/90"
 />
</Masonry>