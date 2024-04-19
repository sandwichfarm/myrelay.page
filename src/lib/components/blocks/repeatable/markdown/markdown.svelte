<script lang="ts">
  import SvelteMarkdown from 'svelte-markdown'
  import { getContext, onMount, onDestroy, tick } from'svelte';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';

  import { Button } from "$lib/components/ui/button/index.js";
  import Block from '$lib/components/wrappers/block.svelte';

  import type { MyRelayPage } from '$lib/core/MRP';

  const MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);

  export let key: string;
  export let id: string;
</script>

<Block key={key} id={id}>
  <svelte:fragment slot="content">
    <SvelteMarkdown source={$MRP.loader.config.event.blocks[key]?.options?.markdown || ""} />
  </svelte:fragment>
</Block>