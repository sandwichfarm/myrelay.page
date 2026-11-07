<script lang="ts">
  import { getContext, onMount, onDestroy, tick } from 'svelte';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';
  import type { MyRelayPage } from '$lib/core/MRP';

  export let MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);
  export let key: string = ""

  const toggle = async () => {
    if(!$MRP?.loader?.config?.event) return
    $MRP.loader.config.event.toggleBlock(key)
    await tick()
    MRP.set($MRP)
  }

  $: text = $MRP?.loader?.config?.event?.isBlockEnabled(key) ?  'enabled' : 'disabled'
  $: color = $MRP?.loader?.config?.event?.isBlockEnabled(key) ? 'text-green-500' : 'text-red-500'

</script>

<button type="button" on:click={toggle} class="font-bold {color}">
  {text}
</button>
