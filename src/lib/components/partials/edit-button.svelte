<script lang="ts">
  import { browser } from '$app/environment';

  import { getContext, onMount, onDestroy, tick } from 'svelte';

  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import type { Writable } from 'svelte/store';
  import { MyRelayPage } from '$lib/core/MRP';

  import { Button } from "$lib/components/ui/button/index.js";

  const MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);

  let userIsOperator: boolean = false

  const toggleEdit = async () => {
    if(!$MRP?.editor) return
    $MRP?.editor?.toggle()
    if($MRP?.loader?.config?.event?.changed) $MRP.loader.config.event.discardChanges()
    MRP.set($MRP)
  }

  const publish = async () => {
    $MRP?.editor.toggle()
    await $MRP?.loader?.config?.publish()
    setTimeout(location.reload(), 1000)
  }

  const resetConfig = async () => {
    $MRP?.loader?.config?.event?.reset()
    MRP.set($MRP)
    toggleEdit()
  }
  
  $: text = $MRP?.editor?.enabled 
    ? $MRP?.loader?.config?.event?.changed 
      ? 'discard edits'
      : 'leave editor' 
    : 'edit'

  $: toggleClass = $MRP?.editor?.enabled 
    ? $MRP?.loader?.config?.event?.changed 
        ? 'bg-red-500'
        : '' 
      : ''
  
  $: showReset = $MRP?.loader?.config?.event?.configDiffersFromDefault()

  
</script>
{#if browser }
  {#if showReset}
  <Button variant="outline" class="bg-red-700" on:click={resetConfig}>
    reset config
  </Button>
  {/if}
  {#if $MRP?.loader?.config?.event.changed } 
  <Button variant="outline" class="bg-green-600" on:click={publish}>
    publish edits
  </Button>
  {/if}
  <Button variant="outline" class={toggleClass} on:click={toggleEdit}>
    {text}
  </Button> 
{/if}