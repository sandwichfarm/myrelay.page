<script lang="ts">
    import { getContext, onMount, onDestroy, tick } from 'svelte';
    import Time from "svelte-time";
    import { browser } from '$app/environment';
    
    import { Badge } from "$lib/components/ui/badge/index.js";
    // import * as Avatar from "$lib/components/ui/avatar";

    import UserAvatar from "$lib/components/partials/avatar.svelte";
    import ProfileSkeleton from "$lib/components/blocks/profile.skeleton.svelte";

    import * as nip19 from 'nostr-tools/nip19'
    
    import { parseImages, parseMP4s } from '$lib/utils'
    import { MY_RELAY_PAGE } from '$lib/contextKeys';

    import type { Writable } from 'svelte/store';
    import type { MRPRelay } from "$lib/core/relay";
    import type { MRPUser } from '$lib/core/user';
    import type { NDKUserProfile } from '@nostr-dev-kit/ndk';

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
      if(_mrp.ndk?.relay) owner = _mrp.ndk?.relay?.owner;
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
  <div class="grid grid-cols-5 grid-flow-col block-container">
      <div class="items-center col-span-2 ">
        <h3 class="title">
          relay operator
        </h3>
        <div class="profile-card  p-5 text-white max-w-xs block bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 rounded-lg ">
            <div class="flex items-center space-x-4">
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

      <div id="notes" class="col-span-3 flex flex-col justify-center"> 
          {#if browser && relays && feedArray.length}
          <div class="feed w-full">
            {#each feedArray as note, index}  
              {#if index === activeIndex}
                <div class="note block min-h-max bg-white/90 px-5 py-3 pb-10 rounded-lg shadow transition-opacity duration-500 relative max-h-72 overflow-hidden ">
                  <Time relative timestamp={note.created_at*1000} class="block text-sm font-bold" />
                  {@html  parseMP4s(parseImages(note.content)) } 
                  {#each note.tags as tag}
                    {#if tag[0] === 't'}
                      <Badge class="mt-2" variant="outline">#{tag[1]}</Badge> 
                    {/if}
                  {/each}
                  {#if note?.id && owner?.feedPointers?.[note.id]}
                    <a href="https://nostr.at/{ nip19.neventEncode( owner?.feedPointers?.[note.id] ) }" 
                      target="_blank" 
                      class="absolute bottom-0 text-xs font-bold left-0 right-0 py-3 px-5 bg-gradient-to-t from-white/90 via-white/90 via-white/90 to-white/0">
                      jump ►
                    </a>
                  {/if}
                </div>
              {/if}
            {/each}
          </div>
          {:else}
          <div class="note block min-h-max bg-white/90 px-5 py-3 pb-10 rounded-lg shadow transition-opacity duration-500 relative max-h-72 overflow-hidden text-3xl h-full mt-9 text-gray-300 italic flex items-center space-x-4 text-center">
              seems the operator is quiet, no notes
          </div>
          {/if}
      </div>

  </div>
  {:else}
    <ProfileSkeleton />
  {/if} <!-- /!profile -->
{/if} <!-- /browser -->


<style>

</style>