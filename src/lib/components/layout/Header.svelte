
<script lang="ts">
  import { writable } from 'svelte/store';
  import { getContext } from 'svelte';
  import type { Writable } from 'svelte/store';

  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import type { MRPRelay } from '$lib/core/relay';
  import type { NDKService } from '$lib/core/services/ndk';

  import Login from '$lib/components/partials/login.svelte';
  import ToggleRelay from '$lib/components/partials/toggle-relay.svelte';
  import Nips from '$lib/components/partials/nips.svelte';
  import LimitationsBoolean from '$lib/components/partials/limitations.boolean.svelte';
  import LimitationsNumber from '$lib/components/partials/limitations.number.svelte';
  import PayRelay from '$lib/components/partials/pay-relay.svelte';

  const MRP = getContext(MY_RELAY_PAGE);
  const ndk: Writable<NDKService> = writable();
  const relay: Writeable<MRPRelay> = writable();

  let url:string

  MRP.subscribe((mrp) => {
    url = mrp?.url
    ndk.set(mrp?.ndk)
    relay.set($ndk?.relay)
  });

</script>

<div class="relative">
  {#if url}
    <h1 class="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-6">
      <span class="flex items-center space-x-4">
        {#if $relay?.info?.icon}
          <img src={ $relay?.info.icon } class="max-w-20 max-h-20"/>
        {/if}
        <span class="truncate text-ellipsis overflow-hidden max-w-full inline-block pb-3">{ url }</span>
        <ToggleRelay />
        <PayRelay />
      </span>
    </h1>
  {/if}

  {#if $relay?.info?.description}
    <p class="text-xl text-muted-foreground mb-4">
      { $relay?.info?.description }
    </p>
  {/if}

  <LimitationsBoolean />
  <LimitationsNumber />

  <Nips />
  <Login />
  
</div>




