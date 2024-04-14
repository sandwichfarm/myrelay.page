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

  MRP.subscribe(async (_mrp: MyRelayPage) => { mrp = _mrp });

  const toggleEdit = async () => {
    if(!mrp?.editor) return
    mrp?.editor?.toggle()
    if($MRP?.loader?.config?.event?.changed) $MRP.loader.config.event.discardChanges()
    MRP.set(mrp)
  }

  const publish = async () => {
    mrp?.editor?.toggle()
    await mrp?.loader?.config?.publish()
    
  }
  
  $: text = $MRP?.editor?.enabled 
    ? $MRP?.loader?.config?.event?.changed 
      ? 'discard edits'
      : 'leave editor' 
    : 'edit'

  
</script>
{#if browser }
  {#if $MRP?.loader?.config?.event.changed } 
  <Button variant="outline" on:click={publish}>
    publish edits
  </Button>
  {/if}
  <Button variant="outline" on:click={toggleEdit}>
    {text}
  </Button> 
{/if}