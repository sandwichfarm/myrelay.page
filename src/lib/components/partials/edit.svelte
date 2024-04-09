<script lang="ts">
  import { browser } from '$app/environment';

  import { getContext, onMount, onDestroy, tick } from 'svelte';

  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import type { Writable } from 'svelte/store';
  import type { MyRelayPage } from '$lib/core/main';

  import { isOwnerAuthed } from "$lib/utils";

  import { Button } from "$lib/components/ui/button/index.js";

  const MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);

  let mrp: MyRelayPage | undefined;

  MRP.subscribe(async (_mrp: MyRelayPage) => { mrp = _mrp});

  $: isOwner = mrp?.ndk?.relay? isOwnerAuthed(mrp.ndk.relay): false;

  const edit = async () => {
    if(!mrp?.editor) return
    await mrp?.editor?.init()
    MRP.set(mrp)
  }

</script>
{#if browser && isOwner }
  <Button variant="outline" on:click={edit}>edit</Button>
{/if}