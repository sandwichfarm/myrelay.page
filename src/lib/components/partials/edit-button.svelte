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
    if($MRP?.loader?.config?.event?.changed) $MRP.loader?.config.event.discardChanges()
    MRP.set($MRP)
  }

  let publishing = false;
  let publishError = '';
  const publish = async () => {
    if (publishing) return;
    publishing = true;
    publishError = '';
    try {
      await $MRP?.loader?.config?.publish();
      if (!$MRP?.config?.event.changed) $MRP?.editor.toggle();
      MRP.set($MRP);
    } catch (error) {
      publishError = error instanceof Error ? error.message : String(error);
    } finally { publishing = false; }
  }

  const resetConfig = async () => {
    $MRP?.loader?.config?.event?.reset()
    MRP.set($MRP)

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
  {#if publishError}<span role="alert">{publishError}</span>{/if}
  {#if showReset}
  <Button variant="outline" class="bg-red-700" on:click={resetConfig}>
    reset config
  </Button>
  {/if}
  {#if $MRP?.loader?.config?.event.changed } 
  <Button variant="outline" class="bg-green-600" disabled={publishing} on:click={publish}>
    publish edits
  </Button>
  {/if}
  <Button variant="outline" class={toggleClass} on:click={toggleEdit}>
    {text}
  </Button> 
{/if}