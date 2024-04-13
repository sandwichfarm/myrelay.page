<script lang="ts">
  import { getContext, onMount, onDestroy, tick } from 'svelte';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';
  import type { MyRelayPage } from '$lib/core/MRP';

  export let MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);
  export let key: string = ""

  const up = () => {
    $MRP.loader.config.event.shiftBlockUp(key)
    console.log('block order after', $MRP?.loader?.sortedKeys)
    MRP.set($MRP)
  }
  const down = () => {
    $MRP.loader.config.event.shiftBlockDown(key)
    MRP.set($MRP)
  }
</script>

{#if !$MRP?.loader?.config?.event?.blockIsFirst(key)}
<a href="#" on:click={up}>
  ▲
</a>
{/if}


{#if !$MRP?.loader?.config?.event?.blockIsLast(key)}
<a href="#" on:click={down}>
  ▼
</a>
{/if}

