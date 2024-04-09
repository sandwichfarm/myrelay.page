<script lang="ts">
  import { getContext, onMount, onDestroy, tick } from 'svelte';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import type { NDKUser } from '@nostr-dev-kit/ndk';
  import type { MyRelayPage } from '$lib/core/MRP';
  import type { Writable } from 'svelte/store';
  import type NDK from '@nostr-dev-kit/ndk';

  import UserAvatar from "$lib/components/partials/avatar.svelte";
    import Badge from '$lib/components/ui/badge/badge.svelte';

  const mrp_context: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);
  const MAX_LENGTH = 72
  
  let authed: boolean;
  let followsRetrieved: boolean = false;
  let followsOnRelay: NDKUser[] | undefined;
  let ndk: NDK | undefinned 

  mrp_context.subscribe(async (_mrp) => {
    ndk = _mrp?.ndk.$
    authed = _mrp?.ndk?.authed
    followsOnRelay = _mrp?.userFollowsOnRelay
  });

  $: followsTruncated = (): [NDKUser[], number] => {
    if(!followsOnRelay) return [followsOnRelay, 0]
    const length = followsOnRelay.length
    const difference = length - MAX_LENGTH
    if(difference < 0) return [followsOnRelay as NDKUser[], 0]
    return [followsOnRelay.slice(0, MAX_LENGTH) as NDKUser[], difference]
  }

  
</script>


{#if authed && typeof followsOnRelay !== 'undefined' && followsOnRelay.length}
<div class="mt-10 p-2 bg-gradient-to-b from-gray-100 to-white py-5 px-5 rounded-lg">
  <h3 class="mb-2 text-gray-600 scroll-m-20 text-xl font-extrabold tracking-tight mb-2 block w-full">
    you follow <Badge class="text-lg">{followsOnRelay?.length}</Badge> people who hang out here
  </h3>
 {#each followsTruncated()[0] as follow}
  <span class="mr-1 inline-block">
    <UserAvatar photo={follow?.profile?.image} name={follow?.profile?.name}  />
  </span>
 {/each}
 {#if followsTruncated()[1] > 0}
    <Badge class="ml-0 h-10 w-10 py-0 px-0 text-center shrink-0 overflow-hidden rounded-full inline-block">
      <span class="text-lg mt-1 inline-block">+{followsTruncated()[1]}</span>
    </Badge>
  {/if}
</div>
{/if}


