<script lang="ts">
    import Skeleton from '$lib/components/ui/skeleton2';
    import SkeletonTheme from '$lib/components/ui/skeleton2/SkeletonTheme.svelte';
    
    import Block from '$lib/components/wrappers/block.svelte';

    export let key: string;
</script>
<Block headingClass="col-span-5" {key}>
  <svelte:fragment slot="title">
    relay operator
  </svelte:fragment>
  <svelte:fragment slot="content">
  <div class="grid grid-cols-5 grid-flow-col">
    <div class="items-center col-span-2">
      <div class="mrp-profile-card mrp-profile-card-content mrp-profile-card-bg">
        <div class="flex items-center space-x-4">
          
          <Skeleton circle={true} height={40} width={40} />

          <span class="inline-block truncate text-ellipsis overflow-hidden max-w-40">
            <Skeleton width={100} count={1} />
          </span>
        </div>

        <Skeleton width={100} count={1} class="items-center border rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none select-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-primary hover:bg-primary/80 border-transparent text-primary-foreground mt-2 text-ellipsis overflow-hidden max-w-40 block" />
      
        <div class="my-3">
          <Skeleton count={3} />
        </div>

        <div>
          <a class="hover:text-black hover:opacity-80 text-black opacity-50 mt-2 truncate text-ellipsis overflow-hidden max-w-full block" href="#" target="_blank">
            <Skeleton count={1} />
          </a>
        </div>
      </div>
    </div>
    <div id="notes" class="col-span-3 flex flex-col justify-center"> 
      <div class="feed w-full">
        <div class="mrp-note block min-h-max bg-white/90 dark:bg-black/90 px-5 py-3 pb-10 rounded-lg shadow transition-opacity duration-200 relative max-h-72 overflow-hidden ">
          <Skeleton count={7} class="inline-block dark:hidden min-w-full" />
          <Skeleton count={7} color="rgba(10,10,10,0.9)" highlightColor="rgba(20,20,20,0.2)" class="hidden dark:inline-block" />
        </div>
      </div>
    </div>
  </div>
  </svelte:fragment>
</Block>
