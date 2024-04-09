<script lang="ts">
  import { browser } from '$app/environment';
  import { getContext } from 'svelte';

  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import type { Writable } from 'svelte/store';
  import type { MyRelayPage } from '$lib/core/MRP';

  import * as Avatar from "$lib/components/ui/avatar";
  import { Button } from "$lib/components/ui/button/index.js";

  import EditButton from '$lib/components/partials/edit-button.svelte';

  const MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);

  let mrp: MyRelayPage | undefined;
  let userIsOperator: boolean = false

  MRP.subscribe(async (_mrp: MyRelayPage) => { mrp = _mrp});

  const _isOperator = () => {
    return mrp?.ndk?.relay?.owner && mrp?.ndk?.authed
      ? mrp?.ndk?.relay?.owner?.pubkey === mrp?.ndk?.user?.pubkey
      : false;
  }

  const login = async () => {
    if(!mrp?.ndk) return 
    await mrp?.ndk.login()
    MRP.set(mrp)
    await mrp?.getUserFollowsOnRelay()
    console.log('follows set:', mrp.userFollowsOnRelay)
    userIsOperator = _isOperator()
    MRP.set(mrp)
  }

  const logout = async () => {
    if(!mrp?.ndk) return 
    mrp?.ndk.logout()
    userIsOperator = false
    MRP.set(mrp)
  }
</script>
{#if browser && window?.nostr}
  <div class="absolute -top-12 -right-10">
    {#if mrp?.ndk && (typeof mrp?.ndk?.user === 'undefined' || mrp?.ndk?.user === null)}
      <Button variant="outline" on:click={login}>login</Button>
    {:else if mrp?.ndk?.user?.profile}
      <div class="flex items-center space-x-4">
        {#if userIsOperator}
        <EditButton />
        <span class="inline-block text-xs bold text-gray-500">
          operator
        </span>
        {/if}
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