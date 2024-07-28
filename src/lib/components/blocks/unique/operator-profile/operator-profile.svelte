<script lang="ts">
    import { getContext, onMount, onDestroy, tick } from 'svelte';
    import Time from "svelte-time";
    import { browser } from '$app/environment';
    
    import { Badge } from "$lib/components/ui/badge/index.js";
    // import * as Avatar from "$lib/components/ui/avatar";

    import Block from "$lib/components/wrappers/block.svelte";
    import UserAvatar from "$lib/components/partials/avatar.svelte";
    import ProfileSkeleton from "$lib/components/blocks/unique/operator-profile/operator-profile.skeleton.svelte";

    import * as nip19 from 'nostr-tools/nip19'
    
    import { MY_RELAY_PAGE } from '$lib/contextKeys';

    import type { Writable } from 'svelte/store';
    import type { MRPRelay } from "$lib/core/MRPRelay";
    import { MRPUser } from '$lib/core/MRPUser';
    import type { NDKUserProfile } from '@nostr-dev-kit/ndk';
    import Note from '$lib/components/partials/note.svelte';
    import Skeleton from '$lib/components/ui/skeleton2/Skeleton.svelte';

    export let key: string;
    export let id: string | undefined


    const mrp_context: Writable<MRPRelay>  = getContext(MY_RELAY_PAGE);

    let url: string,
        owner: MRPUser | undefined,
        profile: NDKUserProfile | undefined, 
        pubkey: string | undefined,
        relays: string[] | undefined,
        picture: string | undefined,
        feedUpdated: boolean = false,
        feedArray: any[] = [];

    let activeIndex = 0; 
    const CYCLE_DURATION = 10000;
    let interval: ReturnType<typeof setInterval>;
    let ownerZapInitialized: boolean = false;
    let ownerNotesInitialized: boolean = false;

    const cycleChildren = () => {
      if(!owner?.feed?.length) return
      activeIndex = (activeIndex + 1) % owner.feed.length;
    }

    mrp_context.subscribe(async (_mrp) => {
      url = _mrp?.url;
      if(_mrp.nostr?.relay) owner = _mrp.nostr?.relay?.owner;
      if(owner?.pubkey) pubkey = owner?.pubkey;
      if(owner?.profile) profile = owner?.profile;
      if(owner?.relays) relays = owner?.relays;
      if(owner?.hasPhoto()) picture = owner?.photo;
      await tick()
      if(browser && (owner?.lud16 || owner?.lud06) && !ownerZapInitialized) {
        const el = document?.querySelector('#relay-operator-zap')
        window?.nostrZap?.initTarget(el)
        ownerZapInitialized = true;
      }
      if(!owner?.feed?.length || ownerNotesInitialized) return
      interval = setInterval(cycleChildren, CYCLE_DURATION);
      feedUpdated = !feedUpdated;
      feedArray = owner.feed as any[]; 
      ownerNotesInitialized = true

    });

    onMount(async (): Promise<void>=>{
    })

    onDestroy(() => {
      if(interval) clearInterval(interval);
    });

    $: if (feedUpdated) feedArray = (owner?.feed || []) as any[];

</script>
{#if browser}
  
  {#if profile}
  <Block headingClass="col-span-5" {key}>
    <svelte:fragment slot="title">
      relay operator
    </svelte:fragment>
    <svelte:fragment slot="content">
    <div class="w-full md:grid md:grid-cols-5 md:grid-flow-col">
      <div class="items-center w-full md:col-span-2">
        <div class="mrp-profile-card mrp-profile-card-content mrp-profile-card-bg sm:w-full mb-2 md:mb-0">
          <div class="flex items-center space-x-2">
            <UserAvatar photo={owner?.photo} name={profile?.name} showTooltip={false} />
            <span class="inline-block truncate text-ellipsis overflow-hidden max-w-40">
              {#if profile?.name}
                { profile.name }
              {:else}
                anonymous
              {/if }
            </span>

            {#if profile?.lud16 || profile?.lud06}
              <button
                id="relay-operator-zap"
                data-npub="{ nip19.npubEncode(pubkey) }"
                data-relays="{ relays }"
                class="px-1 py-0.5 rounded-xl text-xs bg-black/50 hover:bg-black text-purple-700">
              ⚡️
              </button>
            {/if}
          </div>
        
          <Badge class="mt-2 truncate text-ellipsis overflow-hidden max-w-40 block">
            { pubkey }
          </Badge>
      
          <div class="my-3">
            { profile?.about }
          </div>

          <div>
            <a class="hover:text-black hover:opacity-80 text-black opacity-50 mt-2 truncate text-ellipsis overflow-hidden max-w-full block" href="{ profile?.website }" target="_blank">
              { profile?.website }
            </a>
          </div>
        </div>
      </div>

      <div id="notes" class="md:col-span-3 md:flex md:flex-col justify-center"> 
          {#if browser && relays && feedArray.length}
          <div class="feed w-full">
            {#each feedArray as note, index}  
              {#if index === activeIndex}
                <Note note={note} pointer={owner?.feedPointers?.[note.id]} />
              {/if}
            {/each}
          </div>
          {:else}
          {#if owner?.isComplete }
          <div class="note min-h-max bg-white/90 dark:bg-black/90 px-5 py-3 pb-10 rounded-lg shadow transition-opacity duration-200 relative max-h-72 overflow-hidden text-3xl h-full mt-9 text-gray-300 italic flex items-center space-x-4 text-center">
              seems the operator is quiet, no notes
          </div>
          {:else}
            <Skeleton count={7} class="inline-block dark:hidden min-w-full" />
          {/if}
          {/if}
      </div>
    </div>
    </svelte:fragment>
  </Block>
  {:else}
    <ProfileSkeleton {key} />
  {/if} <!-- /!profile -->
{/if} <!-- /browser -->


<style>

</style>