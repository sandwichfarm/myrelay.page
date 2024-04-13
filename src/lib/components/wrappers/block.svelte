<script lang="ts">
  import { getContext, onMount, onDestroy, tick } from 'svelte';

  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';
  import type { MyRelayPage } from '$lib/core/MRP';

  import EditorReorder from '$lib/components/partials/editor.reorder.svelte';
  import EditorEnabled from '$lib/components/partials/editor.enabled.svelte';

  const MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);

  export let innerClass: string = "";
  export let headingClass: string = "";
  export let key: string = ""
</script>

<section class="mrp-block duration-200 {$$props.class}">
  {#if $MRP.editor.enabled && $MRP.nostr.authed}
    <EditorReorder {key} />
    <EditorEnabled {key} />
  {/if}
  <div class="inner {innerClass}">
  <slot name="top" />
  <h3 class="mrp-block-title block w-full {headingClass}">
    <slot name="title">block title</slot>
  </h3>
  <slot name="content" />
  <slot name="bottom" />
  </div>
</section>