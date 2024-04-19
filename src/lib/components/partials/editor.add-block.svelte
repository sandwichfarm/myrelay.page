<script lang="ts">
  import { getContext, onMount, onDestroy, tick } from'svelte';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';
  import { writable } from 'svelte/store';
  import type { Writable } from 'svelte/store';

  import EditorAddBlockType from '$lib/components/partials/editor.add-block-type.svelte';

  import { Button } from "$lib/components/ui/button/index.js";
  import type { MyRelayPage } from '$lib/core/MRP';

  const MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);

  const showEditorAddBlockType: Writable<boolean> = writable(false);

  const toggleVisibility = () => {
    showEditorAddBlockType.update(value => !value);
  }

  export let order: number = 0;
  let loading: Writable<boolean>;
  export let id: string;
</script>

{#if $MRP?.editor?.enabled}
  <a href="#showeditor" class="text-center mb-5 mt-5 text-3xl py-2 block w-full text-black/20 dark:text-white/20 bg-gray-200 dark:bg-gray-900 cursor-pointer hover:bg-gray-300 hover:dark:bg-gray-800"
      tabindex="-10"
      on:click={toggleVisibility}>
    +
  </a>
  {#if $loading}
    <span class="text-yellow-50">
      loading...
    </span>
  {/if}
  {#if $showEditorAddBlockType}
    <EditorAddBlockType {order} toggle="{toggleVisibility}" bind:loading bind:id />
  {/if}
{/if}
