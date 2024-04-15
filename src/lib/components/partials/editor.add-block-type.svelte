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
  <a href="#html" class="col-span-1" tabindex="-10" on:click={addRepeatableComponent('html', order)}>
    <pre>{`<html />`}</pre>
  </a>
  <a href="#img" class="col-span-1" tabindex="-10" on:click={addRepeatableComponent('image', order)}>
    <pre>{`<img />`}</pre>
  </a>
  <a href="#md" class="col-span-1" tabindex="-10" on:click={addRepeatableComponent('markdown', order)}>
    <pre>{`markdown`}</pre>
  </a>
  <a href="#feed" class="col-span-1" tabindex="-10" on:click={addRepeatableComponent('feed', order)}>
    feed
  </a>
  <a href="#html" class="col-span-1" tabindex="-10">
    component
  </a>
</div>
{/if}