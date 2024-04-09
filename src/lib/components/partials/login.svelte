<script lang="ts">
  import { browser } from '$app/environment';
  import { getContext } from 'svelte';

  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import type { Writable } from 'svelte/store';
  import type { MyRelayPage } from '$lib/core/main';
  import * as Avatar from "$lib/components/ui/avatar";

  import { Button } from "$lib/components/ui/button/index.js";
  import { isOwnerAuthed } from '$lib/utils';

  const MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);

  let mrp: MyRelayPage | undefined;

  const login = async () => {
    if(!mrp?.ndk) return 
    await mrp?.ndk.login()
    MRP.set(mrp)
    await mrp?.getUserFollowsOnRelay()
    console.log('follows set:', mrp.userFollowsOnRelay)
    MRP.set(mrp)
  }

  const logout = async () => {
    if(!mrp?.ndk) return 
    mrp?.ndk.logout()
    MRP.set(mrp)
  }

  MRP.subscribe(async (_mrp: MyRelayPage) => { mrp = _mrp});
  $: isOwner = mrp?.ndk?.relay? isOwnerAuthed(mrp.ndk.relay): false;
</script>
{#if browser && window?.nostr}
  <div class="absolute -top-12 -right-10">
    {#if mrp?.ndk && (typeof mrp?.ndk?.user === 'undefined' || mrp?.ndk?.user === null)}
      <Button variant="outline" on:click={login}>login</Button>
    {:else if mrp?.ndk?.user?.profile}
      {#if isOwner}
      <span class="text-xs bold text-gray-500">
        operator
      </span>
      {/if}
      <div class="flex items-center space-x-4">
        <Avatar.Root class="inline-block border-slate-500 border-2">
          <Avatar.Image src="{mrp?.ndk?.user?.profile?.image}" alt="@{mrp?.ndk?.user?.profile?.name || 'anonymous'}" />
          <Avatar.Fallback>@{mrp?.ndk?.user?.profile?.name || 'anonymous'}</Avatar.Fallback>
        </Avatar.Root>
        <span>
          <span class="block">{ mrp?.ndk?.user?.profile?.name }</span>
          <span class="block cursor-pointer text-xs" on:click={logout}>logout</span>
        </span>
      </div>
    {/if}
  </div>
{/if}