<script lang="ts">
  import { getContext, tick } from 'svelte';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';

  const MRP = getContext(MY_RELAY_PAGE);

  MRP.subscribe(async (mrp) => {
    await tick()
    
  });
</script>

<section class="rounded-xl bg-black/70 p-4">
  
</section>