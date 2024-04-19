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
    export let noClass: boolean = false;
    export let showJump: boolean = true;
    export let showSummary: boolean = true;
    export let summaryTruncate: boolean = false;
    export let summaryWordsLength: number = 200;
    export let headingClass: string = '';

    const truncate = (str, max = 10) => {
      const array = str.trim().split(' ');
      const ellipsis = array.length > max ? '...' : '';
      return array.slice(0, max).join(' ') + ellipsis;
    };

    $: noteClass = noClass? '': 'mrp-note mrp-note-bg mrp-note-content block'
    $: noteTitle = () => note?.tags?.find(t => t[0] === 'title')?.[1]
    $: content = summaryTruncate 
      ? parseMP4s(parseImages(truncate(note.content, summaryWordsLength))) 
      : parseMP4s(parseImages(note.content))
</script>

<div class="{noteClass} {$$props.class} transition-colors ease-in-out">
  {#if noteTitle()}
  <h2 class="text-xl mb-4 font-bold {headingClass}">
    <a 
      href="https://nostr.at/{ nip19.neventEncode( pointer ) }" 
      target="_blank" 
      class="duration-100">
      {noteTitle()}
    </a>
  </h2>
  {/if}

  <Time relative timestamp={note.created_at*1000} class="block text-sm font-bold" />

  {#if showSummary}
    <p class="mt-2">
      {@html content }
    </p>
  {/if}

  <span class="topics">
  {#each note.tags as tag}
    {#if tag[0] === 't'}
      <Badge class="mt-2" variant="outline">#{tag[1]}</Badge> 
    {/if}
  {/each}
  </span>

  {#if note?.id && showJump}
    <a href="https://nostr.at/{ nip19.neventEncode( pointer ) }" 
       target="_blank" 
       class="mrp-note-jump mrp-note-jump-bg mrp-note-jump-text duration-100">
      jump ►
    </a>
  {/if}

</div>