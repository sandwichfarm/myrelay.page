<script lang="ts">
  import Masonry from 'svelte-bricks';
  import Skeleton, { SkeletonTheme } from '$lib/components/ui/skeleton2';
  // import Skeleton, { SkeletonTheme } from 'svelte-skeleton-loader';

  let nItems = 12
  $: items = [...Array(nItems).keys()]

  let [minColWidth, maxColWidth, gap] = [200, 800, 20];

  $: height = (): number => Math.round(100+200 * Math.random())

</script>


<Masonry
  {items}
  {minColWidth}
  {maxColWidth}
  {gap}
  let:item 
  > 
  <Skeleton count={1} height={height()} class="inline-block dark:hidden min-w-full" />
  <Skeleton count={1} height={height()} color="rgba(0,0,0,0.9)" highlightColor="rgba(10,10,10,0.2)" class="hidden dark:inline-block" />
</Masonry>
<!-- 
bind:masonryWidth={width}
bind:masonryHeight={height} -->