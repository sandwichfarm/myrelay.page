<script lang="ts">
    import { writable } from 'svelte/store';
    import { onMount } from 'svelte';
    import type { Writable } from 'svelte/store'

    import Time from "svelte-time";

    // import { browser } from '$app/environment';
    import { NDKEvent } from '@nostr-dev-kit/ndk';
    import type { EventPointer } from 'nostr-tools/nip19';
    import * as nip19 from 'nostr-tools/nip19'
    import { parseNote } from '$lib/core/utils/note-parser'

    import { Badge } from "$lib/components/ui/badge/index.js";
    import Skeleton from '$lib/components/ui/skeleton2';

    export let note: NDKEvent;
    export let pointer: EventPointer;
    export let noClass: boolean = false;
    export let showJump: boolean = true;
    export let showSummary: boolean = true;
    export let summaryTruncate: boolean = false;
    export let summaryWordsLength: number = 200;
    export let headingClass: string = '';
    export let contentClass: string = '';
    export let timeAgoClass: string = '';

    const content: Writable<string> = writable('')
    
    $: parseOptions = {
      nip19: true,
      markdown: true,
      markdownOptions: { breaks: true },
      images: true,
      videos: true,
      truncate: summaryTruncate,
      truncateLength: summaryWordsLength,
      sanitize: false
    }

    $: wrapperClass = noClass? '': 'mrp-note mrp-note-bg mrp-note-content block'
    $: noteTitle = () => note?.tags?.find(t => t[0] === 'title')?.[1]

    $: parse = async (): Promise<string> => parseNote(note.content, parseOptions)  

    onMount(async () => {
      content.set(await parse())
    })

    // $: content = summaryTruncate 
    //   ? parseMP4s(parseImages(truncate(note.content, summaryWordsLength))) 
    //   : parseMP4s(parseImages(note.content))
</script>

<div class="{wrapperClass} {$$props.class} transition-colors ease-in-out">

  <slot name="header" />
  
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

  <slot name="belowTitle" />

  <Time relative timestamp={note.created_at*1000} class="block text-sm font-bold {timeAgoClass}" />

  {#if showSummary}
    <p class="mt-2 { contentClass }">
      {#if !$content}
        <Skeleton count={4} />
      {:else}
        {@html $content }
      {/if}
    </p>
  {/if}

  <slot name="belowSummary" />

  <span class="topics">
  {#each note.tags as tag}
    {#if tag[0] === 't'}
      <Badge class="mt-2 mr-2 text-black/40 dark:text-white/40" variant="outline">#{tag[1]}</Badge> 
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

<style>
  :global code {
    @apply bg-gray-100 dark:bg-gray-950 font-mono border border-gray-200 dark:border-gray-800 rounded px-1;
  }
</style>