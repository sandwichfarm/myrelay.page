<script lang="ts">
  import { getContext } from'svelte';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';


  const MRP: Writable<any> = getContext(MY_RELAY_PAGE);
  export const loading: Writable<boolean> = writable(false);

  const addRepeatableComponent = async (type: string, order: number): Promise<void> => {
    loading.set(true)
    toggle()
    try { id = await $MRP.loader.addComponent(type, order); }
    finally { loading.set(false); }
  }

  export let order: number = 0;
  export let toggle: () => void = () => undefined;
  export let id: string = '';
</script>
{#if $MRP.editor.enabled}
<div class="grid grid-cols-4 gap-4">
  <button type="button" class="editor-add-block" on:click={() => addRepeatableComponent('html', order)}>
    <pre>{`<html />`}</pre>
  </button>
  <button type="button" class="editor-add-block" on:click={() => addRepeatableComponent('image', order)}>
    <pre>{`<img />`}</pre>
  </button>
  <button type="button" class="editor-add-block" on:click={() => addRepeatableComponent('markdown', order)}>
    <pre>{`markdown`}</pre>
  </button>
  <button type="button" class="editor-add-block" on:click={() => addRepeatableComponent('feed', order)}>
    feed
  </button>

</div>
{/if}

<style lang="postcss">
  .editor-add-block {
    @apply bg-black/10 hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/15 col-span-1 py-5 text-center cursor-pointer
  }
</style>
