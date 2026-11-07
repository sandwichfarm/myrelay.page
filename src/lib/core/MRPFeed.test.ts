import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'tseep';
import type { MRPState } from './MRP';
import type { NostrEvent } from 'nostr-tools';
import { MRPFeed } from './MRPFeed';

const event = (id: string, created_at: number, pubkey = 'author') => ({ id, created_at, pubkey, kind: 1, content: '', tags: [], sig: '' } as NostrEvent);
function setup(events: NostrEvent[]) {
  const query = vi.fn().mockResolvedValue(events);
  const signal = new EventEmitter();
  const state = { signal, client: { query } } as unknown as MRPState;
  return { query, signal, feed: new MRPFeed(state, 'feed', { filter: { kinds: [1], limit: 3 }, relays: ['wss://relay.test/'], exclude: { pubkey: 'operator' } }) };
}
describe('MRPFeed', () => {
  it('sorts, excludes the operator and never pads a short feed with undefined', async () => {
    const { feed, query } = setup([event('old', 1), event('operator', 8, 'operator'), event('new', 5)]);
    await feed.fetch();
    expect(feed.notes.map(note => note.id)).toEqual(['new', 'old']);
    expect(Object.keys(feed.pointers)).toEqual(['new', 'old']);
    expect(feed.pointers.new).toEqual({ id: 'new', kind: 1, pubkey: 'author', relays: ['wss://relay.test/'] });
    expect(query).toHaveBeenCalledWith({ kinds: [1], limit: 3 }, ['wss://relay.test/']);
  });
  it('settles empty feeds and coalesces concurrent loads', async () => {
    const { feed, query, signal } = setup([]);
    const complete = vi.fn(); signal.on('feed:completed', complete);
    await Promise.all([feed.fetch(), feed.fetch()]);
    expect(query).toHaveBeenCalledTimes(1); expect(complete).toHaveBeenCalledTimes(1);
    expect(feed.isComplete).toBe(true); expect(feed.notes).toEqual([]);
  });
  it('settles transport failures and supports retry', async () => {
    const { feed, query } = setup([]);
    query.mockRejectedValueOnce(new Error('offline'));
    await feed.fetch(); expect(feed.isComplete).toBe(true);
    query.mockResolvedValueOnce([event('retry', 1)]);
    await feed.fetch(); expect(feed.notes[0].id).toBe('retry');
  });
});
