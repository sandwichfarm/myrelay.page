<script lang="ts">
  import { getContext, onMount, onDestroy, tick } from 'svelte';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import { Badge } from "$lib/components/ui/badge/index.js";
  import 'nostr-zap'
  // import type { MRPMonitors } from "$lib/core/monitors";
  import type { MyRelayPage } from '$lib/core/MRP';
  import type { Writable } from 'svelte/store';

  export let key: string;
  export let mapChange: () => void

  export let setMonitor: (monitor: MRPMonitor) => void
  export let setMonitors: () => void
  export let resetMonitors: () => void
  export let updateMapData: () => void
  
  const MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);

  const hovered = (monitor: MRPMonitor | boolean): undefined => {
    if(monitorVis !== 'onhover') return 
    if(!monitor) return resetMonitors()
    resetMonitors()
    setMonitor(monitor)
    updateMapData()
  }
  $: monitorVis = $MRP.loader.config.event.blocks?.[key]?.options?.showMonitors
  $: monitors = $MRP?.nostr?.monitors
  $: hoverClass = monitorVis !== 'onhover' ? 'cursor-pointer' : ''
</script>

<div class="text-center mt-10">
{#if monitors?.monitorEvents?.size}
  <span class='text-xl mb-2 block text-center items-center'>
  Seen by <Badge class="text-lg">{monitors.countMonitors()}</Badge> monitors
  </span>
  <div class="text-center items-center">
  {#each monitors.all as monitor}
  <span on:mouseenter={() => hovered(monitor)} on:mouseleave={() => hovered(false)}>
  <Badge variant="outline" class="mr-3 mb-1 inline-block dark:border-white/10 dark:text-white/70 dark:hover:text-white/90 {hoverClass}">
    {monitor.profile?.name} 
    {#if monitor?.operator && monitors.operators[monitor.operator]?.name}
    [{monitors.operators[monitor.operator]?.name}]
    {/if}
  </Badge>
  </span>
  {/each}
  </div>
{/if}
</div>

<style>

</style>