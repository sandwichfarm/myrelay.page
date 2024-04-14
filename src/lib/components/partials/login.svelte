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

  let userIsOperator: boolean = false

  const _isOperator = () => {
    const operator = $MRP?.nostr?.relay?.info?.pubkey || $MRP?.nostr?.relay?.owner?.pubkey
    const currentUser = $MRP?.nostr?.user?.pubkey
    return operator && $MRP?.nostr?.authed
      ? operator === currentUser
      : false;
  }

  const login = async () => {
    if(!$MRP?.nostr) return 
    await $MRP?.nostr.login()
    userIsOperator = _isOperator()
    MRP.set($MRP)
    await $MRP?.getUserFollowsOnRelay()
    MRP.set($MRP)
  }

  const logout = async () => {
    if(!$MRP?.nostr) return 
    $MRP?.nostr.logout()
    userIsOperator = false
    MRP.set($MRP)
  }
</script>
{#if browser && window?.nostr}
  <!-- <div class="inline-block"> -->
    {#if $MRP?.nostr && (typeof $MRP?.nostr?.user === 'undefined' || $MRP?.nostr?.user == null)}
      <Button variant="outline" class="relative" on:click={login}>login</Button>
    {:else if $MRP?.nostr?.user?.profile}
      <!-- <div class="flex items-center space-x-4"> -->
        {#if userIsOperator}
        <EditButton />
        <span class="inline-block text-xs bold text-gray-500">
          operator
        </span>
        {/if}
        <Avatar.Root class="inline-block border-slate-500 border-2">
          <Avatar.Image src="{$MRP?.nostr?.user?.profile?.image}" alt="@{$MRP?.nostr?.user?.profile?.name || 'anonymous'}" />
          <Avatar.Fallback>@{$MRP?.nostr?.user?.profile?.name || 'anonymous'}</Avatar.Fallback>
        </Avatar.Root>
        <span>
          <span class="block">{ $MRP?.nostr?.user?.profile?.name }</span>
          <span class="block cursor-pointer text-xs" on:click={logout}>logout</span>
        </span>
      <!-- </div> -->
    {/if}
  <!-- </div> -->
{/if}