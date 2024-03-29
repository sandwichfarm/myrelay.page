<script lang="ts">
    import Time from "svelte-time";
    // import { browser } from '$app/environment';
    import { NDKEvent } from '@nostr-dev-kit/ndk';
    import type { EventPointer } from 'nostr-tools/nip19';
    import { Badge } from "$lib/components/ui/badge/index.js";
    import * as nip19 from 'nostr-tools/nip19'
    import { parseImages, parseMP4s } from '$lib/utils'

    export let note: NDKEvent;
    export let pointer: EventPointer;
</script>

<div class="note block min-h-max bg-white/90 px-5 py-3 pb-10 rounded-lg shadow transition-opacity duration-500 relative max-h-72 overflow-hidden ">
  <Time relative timestamp={note.created_at*1000} class="block text-sm font-bold" />
  {@html  parseMP4s(parseImages(note.content)) } 
  {#each note.tags as tag}
    {#if tag[0] === 't'}
      <Badge class="mt-2" variant="outline">#{tag[1]}</Badge> 
    {/if}
  {/each}
  {#if note?.id}
    <a href="https://nostr.at/{ nip19.neventEncode( pointer ) }" 
       target="_blank" 
      class="absolute bottom-0 text-xs font-bold left-0 right-0 py-3 px-5 bg-gradient-to-t from-white/90 via-white/90 via-white/90 to-white/0">
      jump ►
    </a>
  {/if}
</div>