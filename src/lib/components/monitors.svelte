<script lang="ts">
  import { getContext, onMount, onDestroy, tick } from 'svelte';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import { Badge } from "$lib/components/ui/badge/index.js";
  import 'nostr-zap'
  import type { MRPMonitors } from "$lib/core/monitors";

  const mrp_context = getContext(MY_RELAY_PAGE);

  let monitors: MRPMonitors

  mrp_context.subscribe((_mrp) => {
    ////console.log('inside profile')
    monitors = _mrp.ndk?.monitors
    ////console.log(monitors)
    ////console.log(monitors.operators)
  });

  onMount(async (): Promise<void>=>{
  })

  onDestroy(() => {

  });

</script>

<div class="text-center mt-10">
{#if monitors.monitorEvents.size}
  <span class='text-xl mb-2 block'>
  Seen by <Badge class="text-lg">{monitors.countMonitors()}</Badge> monitors
  </span>
  <ul>
    {#each monitors.all as monitor}
    <Badge variant="outline">
      {monitor.profile?.name} 
      {#if monitor?.operator}
      [{monitors.operators[monitor.operator]?.name}]
      {/if}
    </Badge>
    {/each}
  </ul>
{/if}
</div>

<style>

</style>