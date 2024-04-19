
<script lang="ts">
  import { writable } from 'svelte/store';
  import { getContext } from 'svelte';
  import type { Writable } from 'svelte/store';

  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import type { MRPRelay } from '$lib/core/relay';
  import type { MRPNostr } from '$lib/core/services/ndk';

  import Login from '$lib/components/partials/login.svelte';
  import ThemeMode from '$lib/components/partials/theme-mode.svelte';
  import ToggleRelay from '$lib/components/partials/toggle-relay.svelte';
  import PayRelay from '$lib/components/partials/pay-relay.svelte';

  const MRP = getContext(MY_RELAY_PAGE);
  const nostr: Writable<MRPNostr> = writable();
  const relay: Writeable<MRPRelay> = writable();

  let url:string

  MRP.subscribe((mrp) => {
    url = mrp?.url
    nostr.set(mrp?.nostr)
    relay.set($nostr?.relay)
  });

</script>

<div class="relative my-2">
  {#if url}
    <h1 class="scroll-m-20 text-3xl md:text-4xl font-extrabold tracking-tight lg:text-5xl mb-6 my-2">
      <span class="flex items-center space-x-4">
        {#if $relay?.info?.icon}
          <img src={ $relay?.info.icon } class="max-w-20 max-h-20"/>
        {/if}
        <span class="truncate text-ellipsis overflow-hidden max-w-full inline-block pb-3">
          { url }
        </span>
        <ToggleRelay />
        <PayRelay />
      </span>
    </h1>
  {/if}
  <div class="absolute -top-16 -right-7 sm:-right-3 sm:mb-3 flex items-center space-x-4 text-right min-w-40">
    <Login />
    <ThemeMode class="inline-block" />
  </div>
</div>