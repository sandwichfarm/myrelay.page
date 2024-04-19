<script lang="ts">
  import { getContext, onMount, onDestroy, tick } from 'svelte';

  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';
  import type { MyRelayPage } from '$lib/core/MRP';

  import EditorReorder from '$lib/components/partials/editor.reorder.svelte';
  import EditorEnabled from '$lib/components/partials/editor.enabled.svelte';
  import EditorRemove from '$lib/components/partials/editor.remove.svelte';
  import EditorBlockOptions from '$lib/components/partials/editor.block-options.svelte';

  const MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);
  const STATIC_ORDER = -100

  $: isRepeatable = key.includes(':')
  $: blockChangeFn = (optionKey: string, optionValue: any): undefined => {
    console.log('change', key, optionKey, optionValue)
    $MRP.loader.config.event.setBlockOption(key, optionKey, optionValue)
    MRP.set($MRP)
  }

  onMount( () => {
    if(!sortable){
      $MRP.loader.config.event.blocks[key].order = STATIC_ORDER
    }
  })

  let defaultOptions, optionsConfig;

  export let innerClass: string = "";
  export let headingClass: string = "";
  export let key: string = ""

  export let noClass: boolean = false;
  export let sortable: boolean = true;

  $: blockClass = noClass? '': 'mrp-block'
</script>

<section class="{blockClass} duration-200 {$$props.class}">
  {#if $MRP.editor.enabled && $MRP.nostr.authed}
    <pre class="inline-block bg-gray-100 dark:bg-black/50 p-1">{key}</pre>
    {#if sortable}
    <EditorReorder {key} />
    {/if}
    <EditorEnabled {key} />
    <EditorRemove {key} />
    <EditorBlockOptions {key} change={blockChangeFn} />
  {/if}
  <div class="inner {innerClass}">
  <slot name="top" />
  <h3 class="mrp-block-title block w-full {headingClass}">
    <slot name="title">{$MRP.loader.config.event.blocks[key]?.options?.blockHeading || ""}</slot>
  </h3>
  <slot name="content"></slot>
  <slot name="bottom" />
  </div>
</section>