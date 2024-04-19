<script lang="ts">
  import { getContext, onMount, onDestroy, tick } from'svelte';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';

  import { Button } from "$lib/components/ui/button/index.js";

  const MRP: Writable<any> = getContext(MY_RELAY_PAGE);
  export const loading: Writable<boolean> = writable(false);

  const addRepeatableComponent = async (type: string, order: number): undefined => {
    loading.set(true)
    toggle()
    id = await $MRP.loader.addComponent(type, order)
    loading.set(false)
  }

  export let order: number = 0; 
  export let toggle: () => void = () => undefined;  
  export let id: string;
</script>
{#if $MRP.editor.enabled}
<div class="grid grid-cols-4 gap-4">
  <span class="editor-add-block" tabindex="-10" on:click={addRepeatableComponent('html', order)}>
    <pre>{`<html />`}</pre>
  </span>
  <span class="editor-add-block" tabindex="-10" on:click={addRepeatableComponent('image', order)}>
    <pre>{`<img />`}</pre>
  </span>
  <span class="editor-add-block" tabindex="-10" on:click={addRepeatableComponent('markdown', order)}>
    <pre>{`markdown`}</pre>
  </span>
  <span class="editor-add-block" tabindex="-10" on:click={addRepeatableComponent('feed', order)}>
    feed
  </span>
  <!-- <span href="#html" class="col-span-1" tabindex="-10">
    component
  </span> -->
</div>
{/if}

<style>
  .editor-add-block {
    @apply bg-black/10 hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/15 col-span-1 py-5 text-center cursor-pointer
  }
</style>