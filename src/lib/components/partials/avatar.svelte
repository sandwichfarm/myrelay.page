<script lang="ts">
  import type { NDKUser, NDKUserProfile } from "@nostr-dev-kit/ndk";
  import * as Avatar from "$lib/components/ui/avatar";
  export let photo: string | undefined;
  export let name: string | undefined;
</script>

{#if photo}
  <Avatar.Root class="inline-block">
    <Avatar.Image src="{photo}" alt="@{name || 'anonymous'}" />
    <Avatar.Fallback>@{name || 'anonymous'}</Avatar.Fallback>
  </Avatar.Root>
{/if}