<script lang="ts">
  import { getContext, onMount, onDestroy, tick } from'svelte';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  
  import Block from '$lib/components/wrappers/block.svelte';
  
  import type { Writable } from 'svelte/store';
  import type { MyRelayPage } from '$lib/core/MRP';

  const MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);

  export let key: string;
  export let id: string;
</script>
<Block key={key} id={id}>
  <svelte:fragment slot="content">
    <img 
      src={$MRP.loader?.getOptions(key)?.imageUrl}
      alt={$MRP.loader?.getOptions(key)?.imageUrl}
      width={$MRP.loader?.getOptions(key)?.width || "100%"}
      height={$MRP.loader?.getOptions(key)?.height || "auto"}
      />
  </svelte:fragment>
</Block>