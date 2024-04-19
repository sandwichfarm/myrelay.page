<script lang="ts">
  import Masonry from 'svelte-bricks';
  import Note from '$lib/components/partials/note.svelte';
  import { NDKEvent } from '@nostr-dev-kit/ndk';
  import type { EventPointer } from 'nostr-tools/nip19';

  export let notes: NDKEvent[] = []; // Initialize to an empty array
  export let pointers: Record<string, EventPointer> = {}; // Initialize to an empty array

  let [minColWidth, maxColWidth, gap] = [200, 800, 20];
</script>

<Masonry
  items={notes}
  {minColWidth}
  {maxColWidth}
  {gap}
  animate={true}
  let:item 
  >
  <Note note={item} pointer={pointers[item.id]} />
</Masonry>