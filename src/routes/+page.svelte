<script lang="ts">
  import { browser } from '$app/environment';
  import { getContext } from 'svelte';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import FollowsPresent from '$lib/components/blocks/follows-present/follows-present.svelte';
    import type { Writable } from 'svelte/store';
    import type { MyRelayPage } from '$lib/core/MRP';
  const MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);

  $: showComponent = (key: string) => $MRP?.editor?.enabled || $MRP.loader?.config.event.isBlockEnabled(key)

</script>

<FollowsPresent />

{#if browser && $MRP?.loader?.sortedKeys?.length}
  {#each $MRP?.loader?.sortedComponents as Component}
    {#if Component && showComponent(Component.key)}
      <svelte:component this={Component.component} key={Component.key} />
    {/if}
  {/each}
{/if}