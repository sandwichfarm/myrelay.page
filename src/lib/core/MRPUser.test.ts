import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'tseep';
import type { MRPState } from './MRP';
import { MRPUser } from './MRPUser';
const pubkey = 'a'.repeat(64);
function setup() {
  const client = { discoverRelays: vi.fn().mockResolvedValue({ read: ['wss://in.test/'], write: ['wss://out.test/'] }), queryOwner: vi.fn().mockResolvedValue([]), query: vi.fn().mockResolvedValue([]) };
  return { client, user: new MRPUser({ signal: new EventEmitter(), client } as unknown as MRPState, pubkey) };
}
describe('MRPUser', () => {
  it('initializes once and uses owner queries for profile and notes', async () => {
    const { client, user } = setup();
    client.queryOwner.mockResolvedValueOnce([{ content: JSON.stringify({ name: 'Operator', display_name: 'Relay Owner', picture: 'https://image.test' }) }]);
    await Promise.all([user.init(), user.init()]);
    expect(client.discoverRelays).toHaveBeenCalledTimes(1);
    expect(user.profile?.displayName).toBe('Relay Owner'); expect(user.photo).toBe('https://image.test');
    await user.fetchNotes();
    expect(client.queryOwner).toHaveBeenLastCalledWith(pubkey, { kinds: [1], authors: [pubkey], limit: 3 });
    expect(user.hasRelay('wss://out.test')).toBe(true); expect(user.hasRelay('garbage')).toBe(false);
  });
  it.each(['null', '[]', 'not json', '{"name":123}'])('rejects malformed profile fields: %s', async content => {
    const { client, user } = setup(); client.queryOwner.mockResolvedValue([{ content }]);
    await user.init(); expect(user.profile?.name).toBeUndefined(); expect(user.isComplete).toBe(true);
  });
  it('deduplicates valid follows and ignores invalid public keys', async () => {
    const { client, user } = setup();
    client.queryOwner.mockResolvedValue([{ tags: [['p', pubkey], ['p', pubkey], ['p', 'bad'], ['e', pubkey]] }]);
    await user.getFollows(); expect([...user.follows!].map(follow => follow.pubkey)).toEqual([pubkey]);
  });
  it('clears stale feed pointers on refresh', async () => {
    const { client, user } = setup();
    client.queryOwner.mockResolvedValueOnce([{ id: 'old', pubkey, kind: 1, created_at: 1 }]);
    await user.fetchNotes(); expect(user.feedPointers.old).toBeDefined();
    await user.fetchNotes(); expect(user.feedPointers).toEqual({});
  });
});
