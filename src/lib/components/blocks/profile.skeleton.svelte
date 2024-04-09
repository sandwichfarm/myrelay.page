<script lang="ts">
    import Skeleton from '$lib/components/ui/skeleton2';
</script>
<div class="grid grid-cols-5 grid-flow-col mt-10 p-2h-80  py-5 px-5 rounded-lg bg-gradient-to-b from-gray-100 to-white">
    <div class="items-center col-span-2 ">
      
        <h3 class="mb-2 text-gray-600 scroll-m-20 text-xl font-extrabold tracking-tight">
          relay operator
        </h3>
        <div class="profile-card  p-5 text-white max-w-xs block bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 rounded-lg ">
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
      <div class="note block min-h-max bg-white/90 px-5 py-3 pb-10 rounded-lg shadow transition-opacity duration-500 relative max-h-72 overflow-hidden ">
        <Skeleton count={4} width={300} />
      </div>
    </div>
  </div>
</div>

<style>

</style>