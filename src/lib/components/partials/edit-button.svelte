<script lang="ts">
  import { browser } from '$app/environment';

  import { getContext, onMount, onDestroy, tick } from 'svelte';

  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import type { Writable } from 'svelte/store';
  import type { MyRelayPage } from '$lib/core/MRP';

  import { Button } from "$lib/components/ui/button/index.js";

  const MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);

  let mrp: MyRelayPage | undefined;
  let userIsOperator: boolean = false

  MRP.subscribe(async (_mrp: MyRelayPage) => { mrp = _mrp});

  const edit = async () => {
    if(!mrp?.editor) return
    await mrp?.editor?.init()
    MRP.set(mrp)
  }

</script>
{#if browser }
  <Button variant="outline" on:click={edit}>edit</Button>
{/if}