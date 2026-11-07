import { cleanup, fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { writable } from 'svelte/store';
import { MY_RELAY_PAGE } from '$lib/contextKeys';
import AddBlockType from './editor.add-block-type.svelte';
import Block from '../wrappers/block.svelte';
import { AppConfig } from '$lib/core/kinds/app-config';

afterEach(cleanup);

describe('editor lifecycle', () => {
  it('adds a block only after clicking the selected type', async () => {
    const addComponent = vi.fn().mockResolvedValue('markdown:0');
    const toggle = vi.fn();
    const mrp = writable({ editor: { enabled: true }, loader: { addComponent } });
    const { getByRole } = render(AddBlockType, {
      props: { order: 2, toggle }, context: new Map([[MY_RELAY_PAGE, mrp]]),
    });
    expect(addComponent).not.toHaveBeenCalled();
    await fireEvent.click(getByRole('button', { name: 'markdown' }));
    expect(addComponent).toHaveBeenCalledTimes(1);
    expect(addComponent).toHaveBeenCalledWith('markdown', 2);
    expect(toggle).toHaveBeenCalledTimes(1);
  });

  it('renders a non-sortable block without mutating signed configuration', () => {
    const event = new AppConfig();
    const mrp = writable({
      editor: { enabled: false }, nostr: { authed: false },
      loader: { config: { event }, getOptions: () => ({ blockHeading: 'Relay information' }) },
    });
    const { getByText } = render(Block, {
      props: { key: 'map', sortable: false }, context: new Map([[MY_RELAY_PAGE, mrp]]),
    });
    expect(getByText('Relay information')).toBeTruthy();
    expect(event.getBlock('map').order).toBe(1);
    expect(event.changed).toBe(false);
  });
});
