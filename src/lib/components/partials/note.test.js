import { render } from '@testing-library/svelte';
import { expect } from 'vitest';
import YourComponent from './note.svelte'; // Adjust the path to your Svelte component

describe('YourComponent', () => {
  it('renders content, time, and badge correctly', async () => {
    const note = {
      created_at: Math.floor(Date.now() / 1000),
      content: 'This is a test note content.',
      tags: [['t', 'testTag']],
      id: 'testNoteId'
    };

    const pointer = { r: 'testR', s: 'testS', k: 'testK' };

    const { getByText, container } = render(YourComponent, { note, pointer });

    // Check if the timestamp is rendered
    expect(container.querySelector('time')).not.toBeNull();

    // Check if the content is rendered
    expect(container.innerHTML).toContain('This is a test note content.');

    // Check if the badge for the tag is rendered
    expect(getByText('#testTag')).toBeInTheDocument();

    // Check if the link is correctly formed
    const encodedPointer = encodeURIComponent(JSON.stringify(pointer));
    const expectedHref = `https://nostr.at/${encodedPointer}`;
    expect(container.querySelector(`a[href="${expectedHref}"]`)).not.toBeNull();
  });
});