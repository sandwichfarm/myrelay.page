<script lang="ts">
  import { getContext, onMount, onDestroy, tick } from 'svelte';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';
  import type { MyRelayPage } from '$lib/core/MRP';

  export let MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);
  export let key: string = ""

  $: isRepeatable = key.includes(':')

  const remove = async () => {
    $MRP.loader?.config.event.removeBlock(key)
    MRP.set($MRP)
  }

</script>

{#if isRepeatable }
  <button type="button" class="font-bold text-red-500" on:click={remove}>
    remove
  </button>
{/if}
