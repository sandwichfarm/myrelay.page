<script lang="ts">
  import { getContext, onMount, onDestroy, tick } from 'svelte';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import { Badge } from "$lib/components/ui/badge/index.js";
  import 'nostr-zap'
  import type { MRPMonitors } from "$lib/core/monitors";

  const mrp_context = getContext(MY_RELAY_PAGE);

  let monitors: MRPMonitors

  mrp_context.subscribe((_mrp) => {
    monitors = _mrp?.nostr?.monitors
  });

  onMount(async (): Promise<void>=>{

  })

  onDestroy(() => {

  });

  let activateLink = (): undefined => {

  }

</script>

<div class="text-center mt-10">
{#if monitors?.monitorEvents?.size}
  <span class='text-xl mb-2 block text-center items-center'>
  Seen by <Badge class="text-lg">{monitors.countMonitors()}</Badge> monitors
  </span>
  <div class="text-center items-center">
  {#each monitors.all as monitor}
  <Badge variant="outline" class="mr-3 mb-1 inline-block dark:border-white/10 dark:text-white/70 dark:hover:text-white/90" on:hover={activateLink()}>
    {monitor.profile?.name} 
    {#if monitor?.operator}
    [{monitors.operators[monitor.operator]?.name}]
    {/if}
  </Badge>
  {/each}
  </div>
{/if}
</div>

<style>

</style>