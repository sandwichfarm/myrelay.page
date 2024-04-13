<script lang="ts">
    import Time from "svelte-time";
    // import { browser } from '$app/environment';
    import { NDKEvent } from '@nostr-dev-kit/ndk';
    import type { EventPointer } from 'nostr-tools/nip19';
    import { Badge } from "$lib/components/ui/badge/index.js";
    import * as nip19 from 'nostr-tools/nip19'
    import { parseImages, parseMP4s } from '$lib/core/utils/note-parser'

    export let note: NDKEvent;
    export let pointer: EventPointer;
</script>

<div class="mrp-note mrp-note-bg mrp-note-content block transition-colors ease-in-out">
  <Time relative timestamp={note.created_at*1000} class="block text-sm font-bold" />
  {@html parseMP4s(parseImages(note.content)) } 
  {#each note.tags as tag}
    {#if tag[0] === 't'}
      <Badge class="mt-2" variant="outline">#{tag[1]}</Badge> 
    {/if}
  {/each}
  {#if note?.id}
    <a href="https://nostr.at/{ nip19.neventEncode( pointer ) }" 
       target="_blank" 
       class="mrp-note-jump mrp-note-jump-bg mrp-note-jump-text duration-100">
      jump ►
    </a>
  {/if}
</div>