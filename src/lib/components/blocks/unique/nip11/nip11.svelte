<script lang="ts">
  import { getContext, onMount, onDestroy, tick } from 'svelte';
  import { browser } from '$app/environment';
  import type { Writable } from 'svelte/store';

  import Block from "$lib/components/wrappers/block.svelte";
  import Nips from '$lib/components/partials/nips.svelte';
  import LimitationsBoolean from '$lib/components/partials/limitations.boolean.svelte';
  import LimitationsNumber from '$lib/components/partials/limitations.number.svelte';
  import Software from '$lib/components/partials/software.svelte';
  
  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import type { MyRelayPage } from '$lib/core/MRP';

  export let key: string;

  const STATIC_ORDER = -100
  
  const MRP: Writable<MyRelayPage>  = getContext(MY_RELAY_PAGE);
  
  onMount( () => {
    $MRP.loader.config.event.blocks[key].order = STATIC_ORDER
  })

  $: options = $MRP.loader.config.event.blocks[key]?.options
  $: info = $MRP.nostr?.relay?.info

</script>
{#if browser}
<Block noClass={true} sortable={false} {key}>a
  <svelte:fragment slot="content">
    {#if info?.description && options.showDescription}
    <p class="text-lg md:text-xl text-muted-foreground mb-4">
      {#if options.descriptionAlternateText.length}
        {options.descriptionAlternateText}
      {:else}
        {info?.description}
      {/if}
    </p>
    {/if}
    {#if options.showRestrictionsBoolean}
    <LimitationsBoolean />
    {/if}
    {#if options.showRestrictionsInteger}
    <LimitationsNumber />  
    {/if}
    {#if options.showSupportedNips}
    <Nips />
    {/if}
    <Software {options} />
  </svelte:fragment>
</Block>
{/if} <!-- /browser -->


<style>

</style>