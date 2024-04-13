<script lang="ts">
  import type { NDKUser, NDKUserProfile } from "@nostr-dev-kit/ndk";

  import * as Tooltip from "$lib/components/ui/tooltip";
  import * as Avatar from "$lib/components/ui/avatar";

  export let photo: string | undefined;
  export let name: string | undefined;
  export let showTooltip: boolean = true;
</script>

{#if photo}
  <Tooltip.Root>
    <Tooltip.Trigger class="hover:bg-transparent">
      <Avatar.Root class="inline-block">
        <Avatar.Image src="{photo}" alt="@{name || 'anonymous'}" />
        <Avatar.Fallback>@{name || 'a'}</Avatar.Fallback>
      </Avatar.Root>
    </Tooltip.Trigger>
    {#if showTooltip}
    <Tooltip.Content>
      {name || 'anonymous'}
    </Tooltip.Content>
    {/if}
  </Tooltip.Root>

{/if}

 
