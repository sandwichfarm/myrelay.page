<script lang="ts">
  import { browser } from '$app/environment';
  import { getContext } from 'svelte';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';

  import EditorAddBlock from '$lib/components/partials/editor.add-block.svelte';
  
  import type { Writable } from 'svelte/store';
  import type { MyRelayPage } from '$lib/core/MRP';

  const MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);

  $: showComponent = (key: string) => $MRP?.editor?.enabled || $MRP.loader?.config.event.isBlockEnabled(key)
  $: componentType = (key: string) => key.split(':')[0]
  $: componentOrder = (key: string) => $MRP?.loader?.config.event.getBlock(key)?.order
  $: type  = (key: string) => key.split(':')[0]

  let order: number = 0
  let id: string;

</script>

{#if browser && $MRP?.loader?.sortedKeys?.length}
  {#each $MRP?.loader?.sortedComponents as Component}
    {#if componentOrder(Component.key) === 0}
    <EditorAddBlock {order} bind:id />
    {/if}
    {#if Component && showComponent(Component.key)}    
      <svelte:component this={Component.component} key={Component.key} id={id}  />
      {#if componentOrder(Component.key) >= 0}
      <EditorAddBlock order={componentOrder(Component.key)+1} bind:id />
      {/if}
    {/if}
  {/each}
{/if}

<!-- {#each $MRP?.loader?.sortedKeys as key}
{key}:{$MRP.loader.config.event.blocks[key].order}<br />
{/each} -->