<script lang="ts">
  import { onMount, getContext } from "svelte";
  import { writable, type Writable } from "svelte/store";
  import type { MyRelayPage } from '$lib/core/MRP';
  import { MY_RELAY_PAGE } from '$lib/contextKeys';

  import * as Sheet from "$lib/components/ui/sheet";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Checkbox } from "$lib/components/ui/checkbox";
  import { Label } from "$lib/components/ui/label/index.js";
  import { Textarea } from "$lib/components/ui/textarea";
  import { Switch } from "$lib/components/ui/switch";

  import FormInput from "$lib/components/wrappers/form-input.svelte";

  export let change: (key: string, value: any) => void;
  export let key: string;

  const _change = (optionKey: string, optionValue: any) => {
    if($optionsConfig[optionKey]?.setter)
      optionValue = $optionsConfig[optionKey].setter(optionValue)
    options.set({...$options, [optionKey]: optionValue });
    change(optionKey, optionValue);
  }

  const MRP: Writable<MyRelayPage> = getContext(MY_RELAY_PAGE);
  const options: Writable<{ [key: string]: any }> = writable({});
  const optionsConfig: Writable<{ [key: string]: any }> = writable({});
  const loaded: Writable<boolean> = writable(false);

  const inputName = (optionKey: string) => optionKey;
  const inputLabel = (optionKey: string) => $optionsConfig[optionKey]?.label ?? optionKey;
  const inputValue = (optionKey: string): any => $options[optionKey];
  const inputType = (optionKey: string) => $optionsConfig[optionKey]?.type;

  const loadBlockOptions = async (key: string) => {
    const result = await $MRP?.loader?.loadComponentOptions(key);
    if (!result) return;
    options.set(result.options);
    optionsConfig.set(result.optionsConfig);
  };

  const changeFromInput = (event: Event) => {
    const input = event.target;
    if (input instanceof HTMLInputElement) {
      if (input.type === 'number' && !Number.isFinite(input.valueAsNumber)) return;
      _change(input.name, input.type === 'checkbox' ? input.checked : input.type === 'number' ? input.valueAsNumber : input.value);
    } else if (input instanceof HTMLTextAreaElement) {
      _change(input.name, input.value);
    }
  };

  const changeOnEnter = (event: KeyboardEvent) => {
    if (event.key === 'Enter') changeFromInput(event);
  };

  const stringArrAdd = (optionKey: string, value: string) => {
    const values: string[] = inputValue(optionKey) ?? [];
    if (!value || values.includes(value)) return;
    _change(optionKey, [...values, value]);
  };

  const stringArrRm = (optionKey: string, value: string) => {
    _change(optionKey, (inputValue(optionKey) as string[]).filter(v => v !== value));
  };

  const handleStringArrKeydown = (event: KeyboardEvent) => {
    if (event.key !== 'Enter' || !(event.target instanceof HTMLInputElement)) return;
    stringArrAdd(event.target.name, event.target.value);
    event.target.value = '';
  };

  onMount( async () => {
    await loadBlockOptions(key);
    loaded.set(true);
  })

  let checked: boolean = false;

</script>
<Sheet.Root>
  <Sheet.Trigger class="hover:bg-none bg-none">
    <span class="font-bold text-blue-900 dark:text-blue-300">
      settings
    </span>
  </Sheet.Trigger>
  <Sheet.Content side="right" class="block-options-panel">
    <Sheet.Header>
      <Sheet.Title>{key} settings</Sheet.Title>
      <Sheet.Description>
        {#if $loaded}
          <ul>
          {#each Object.keys($optionsConfig || {}) as optionKey}
            {#if inputType(optionKey) === 'text'}
            <FormInput>
              <svelte:fragment slot="label">
                <Label for={inputName(optionKey)} class="inline-block">{inputLabel(optionKey)}</Label>
              </svelte:fragment>
              <svelte:fragment slot="input">
                <Input type="text" name={inputName(optionKey)} value={inputValue(optionKey)} on:keyup={changeOnEnter} on:blur={changeFromInput} />
              </svelte:fragment>
            </FormInput>
            {/if}
            {#if inputType(optionKey) === 'text[]'}
            <FormInput>
              <svelte:fragment slot="label">
                <Label for={inputName(optionKey)} class="inline-block">{inputLabel(optionKey)}</Label>
              </svelte:fragment>
              <svelte:fragment slot="input">
                <Input type="text" name={inputName(optionKey)} on:keydown={handleStringArrKeydown} />
                <div class="block">
                  {#each inputValue(optionKey) as value}
                    <span class="inline-block text-sm font-bold">
                      {value}
                      <Button variant="outline" class="text-sm" on:click={event => stringArrRm(optionKey, value)}>x</Button>
                    </span>
                  {/each}
                </div>
              </svelte:fragment>
            </FormInput>
            {/if}
            {#if inputType(optionKey) === 'textarea'}
            <FormInput>
              <svelte:fragment slot="label">
                <Label for={inputName(optionKey)} class="inline-block">{inputLabel(optionKey)}</Label>
              </svelte:fragment>
              <svelte:fragment slot="input">
                <Textarea name={inputName(optionKey)} value={inputValue(optionKey)} on:change={changeFromInput} on:blur={changeFromInput} ></Textarea>
              </svelte:fragment>
            </FormInput>
            {/if}
            {#if inputType(optionKey) === 'checkbox'}
            <FormInput>
              <svelte:fragment slot="label">
                <Label for={inputName(optionKey)} class="inline-block">{inputLabel(optionKey)}</Label>
              </svelte:fragment>
              <svelte:fragment slot="input">
                <input type="checkbox" name={inputName(optionKey)} checked={$options?.[optionKey]} on:change={changeFromInput} />
              </svelte:fragment>
            </FormInput>
            {/if}
            {#if inputType(optionKey) === 'radio'}
            <li>
              <FormInput>
                <svelte:fragment slot="label">
                  <Label for={inputName(optionKey)} class="inline-block">{inputLabel(optionKey)}</Label>
                </svelte:fragment>
                <svelte:fragment slot="input">
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild let:builder>
                      <Button variant="outline" class="py-1 h-auto" builders={[builder]}>{$options[optionKey]}</Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content class="w-56">
                      <DropdownMenu.Label>{inputLabel(optionKey)}</DropdownMenu.Label>
                      <DropdownMenu.Separator />
                      <DropdownMenu.RadioGroup bind:value={$options[optionKey]} >
                        {#each $optionsConfig[optionKey].values as option}
                          <DropdownMenu.RadioItem value={option.value} on:click={event => _change(optionKey, option.value)}>{option.label}</DropdownMenu.RadioItem>
                        {/each}
                      </DropdownMenu.RadioGroup>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </svelte:fragment>
              </FormInput>
            </li>
            {/if}
            {#if inputType(optionKey) === 'email'}
            <li class="grid grid-cols-2">
              <span class="col-span-1">
              <Label for={inputName(optionKey)} class="inline-block">{inputLabel(optionKey)}</Label>
              </span>
              <span class="col-span-1">
              <Input type="email" name={inputName(optionKey)} value={inputValue(optionKey)} on:keyup={changeFromInput} />
              </span>
            </li>
            {/if}
            {#if inputType(optionKey) === 'url'}
            <li>
              <Label for={inputName(optionKey)} class="inline-block">{inputLabel(optionKey)}</Label>
              <Input type="url" name={inputName(optionKey)} value={inputValue(optionKey)} on:keyup={changeFromInput} />
            </li>
            {/if}
            {#if inputType(optionKey) === 'number'}
            <FormInput>
              <svelte:fragment slot="label">
                <Label for={inputName(optionKey)} class="inline-block">{inputLabel(optionKey)}</Label>
              </svelte:fragment>
              <svelte:fragment slot="input">
                <!-- <Switch checked={checked} on:change={handleToggle} /> -->
                <Input type="number" name={inputName(optionKey)} value={inputValue(optionKey)} on:keyup={changeOnEnter} on:blur={changeFromInput} />
              </svelte:fragment>
            </FormInput>
            {/if}
            <!-- {#if inputType(optionKey) === 'dropdown'}
              <Label for={inputName(optionKey)} >{inputLabel(optionKey)}</Label>
              <Input type="number" name={inputName(optionKey)} value={inputValue(optionKey)} on:change={event => _change(optionKey, event?.target?.value)} />
            {/if} -->
          {/each}
          </ul>
        {/if}
      </Sheet.Description>
    </Sheet.Header>
  </Sheet.Content>
</Sheet.Root>

<style>
  :global(.block-options-panel) {
    width: min(100vw, 28rem);
    min-width: 0;
    overflow-y: auto;
  }
</style>
