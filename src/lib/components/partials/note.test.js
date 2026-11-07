import { cleanup, render, waitFor } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { neventEncode } from 'nostr-tools/nip19';
import Note from './note.svelte';

afterEach(cleanup);
const note = { created_at: 1710000000, content: 'A relay note.', tags: [['t', 'nostr']], id: 'a'.repeat(64), pubkey: 'b'.repeat(64), kind: 1, sig: 'c'.repeat(128) };
const pointer = { id: note.id, author: note.pubkey, kind: 1, relays: ['wss://relay.example/'] };
describe('note', () => {
  it('renders content, time, topics and a valid NIP-19 jump link', async () => {
    const { getByText, container } = render(Note, { note, pointer });
    await waitFor(() => expect(getByText('A relay note.')).toBeTruthy());
    expect(container.querySelector('time')).not.toBeNull();
    expect(getByText('#nostr')).toBeTruthy();
    expect(container.querySelector('a')?.href).toBe(`https://nostr.at/${neventEncode(pointer)}`);
  });
  it('sanitizes untrusted relay HTML before rendering', async () => {
    const { container, getByText } = render(Note, { note: { ...note, content: '<img src=x onerror="alert(1)"><script>alert(1)</script>Safe text' }, pointer });
    await waitFor(() => expect(getByText('Safe text')).toBeTruthy());
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('[onerror]')).toBeNull();
  });
});
