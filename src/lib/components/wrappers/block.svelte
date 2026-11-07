<script lang="ts">
  import { getContext } from 'svelte';

  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import type { Writable } from 'svelte/store';
  import type { MyRelayPage } from '$lib/core/MRP';

  import EditorReorder from '$lib/components/partials/editor.reorder.svelte';
  import EditorEnabled from '$lib/components/partials/editor.enabled.svelte';
  import EditorRemove from '$lib/components/partials/editor.remove.svelte';
  import EditorBlockOptions from '$lib/components/partials/editor.block-options.svelte';

  const MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);
  const blockChangeFn = (optionKey: string, optionValue: unknown): void => {
    $MRP.loader?.config.event.setBlockOption(key, optionKey, optionValue);
    MRP.set($MRP);
  };

  export let innerClass: string = "";
  export let headingClass: string = "";
  export let key: string = ""

  export let noClass: boolean = false;
  export let sortable: boolean = true;

  $: blockClass = noClass? '': 'mrp-block'
</script>

<section class="{blockClass} {$$props.class} duration-200">
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
  <h3 class="mrp-block-title block w-full truncate text-ellipsis overflow-hidden {headingClass}">
    <slot name="title">{$MRP.loader?.getOptions(key)?.blockHeading || ""}</slot>
  </h3>
  <slot name="content"></slot>
  <slot name="bottom" />
  </div>
</section>
