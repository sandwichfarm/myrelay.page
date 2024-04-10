<script lang="ts">
  import { browser } from '$app/environment';
  import { getContext } from 'svelte';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import FollowsPresent from '$lib/components/blocks/follows-present.svelte';
  const mrp_context = getContext(MY_RELAY_PAGE);

  let mrp 

  mrp_context.subscribe((_mrp) => {
    mrp = _mrp
  });

</script>

<FollowsPresent />

{#if browser}
  {#each Object.values( mrp?.loader?.components || {} ) as Component}
    {#if Component}
      <svelte:component this={Component} />
    {/if}
  {/each}
{/if}