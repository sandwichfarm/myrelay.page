import { afterEach, describe, it, expect, vi } from 'vitest';
import { MyRelayPage } from './MRP';
import { BlockLoader } from './MRPBlockLoader';
import type { NostrClient } from './nostr';
import { MRPUser } from './MRPUser';
vi.mock('$lib/utils', () => ({ currentOriginMatchesRelayOrigin: () => false }));
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
function setup(json: Record<string, unknown> = {}) {
  const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => json }); vi.stubGlobal('fetch', fetch);
  const client = { query: vi.fn().mockResolvedValue([]), queryOwner: vi.fn().mockResolvedValue([]), discoverRelays: vi.fn().mockResolvedValue({ read: [], write: [] }), close: vi.fn(), signer: undefined };
  vi.spyOn(BlockLoader.prototype, 'loadAllComponents').mockResolvedValue(undefined);
  const app = new MyRelayPage('https://relay.test/?ignored=1#hash', client as unknown as NostrClient);
  return { app, client, fetch };
}
describe('relay page lifecycle', () => {
  it('completes one initialization with defaults when the operator is missing', async () => {
    const { app, fetch } = setup(); const complete = vi.fn(); app.$.signal.on('root:completed', complete);
    await Promise.all([app.init(), app.init()]);
    expect(fetch).toHaveBeenCalledTimes(1); expect(complete).toHaveBeenCalledTimes(1);
    expect(app.url).toBe('wss://relay.test/'); expect(app.config?.event.isBlockEnabled('nip11')).toBe(true);
    expect(app.loader?.isComplete).toBe(true); expect(app.owner).toBeUndefined(); expect(app.isComplete).toBe(true);
    app.close(); expect(app.$.signal.eventNames()).toEqual([]);
  });
  it('settles the page even when NIP-11 cannot be fetched', async () => {
    const { app, fetch } = setup(); fetch.mockRejectedValue(new Error('CORS or offline'));
    await app.init(); expect(app.config?.isComplete).toBe(true); expect(app.isComplete).toBe(true); app.close();
  });
  it('initializes owner metadata even if its profile block is disabled and closes shared transport', async () => {
    const { app, client } = setup({ pubkey: 'a'.repeat(64) });
    await app.init(); expect(app.owner?.pubkey).toBe('a'.repeat(64));
    expect(client.discoverRelays).toHaveBeenCalledWith('a'.repeat(64));
    app.close(); expect(client.close).toHaveBeenCalledTimes(1);
  });
  it('rejects unsupported relay schemes', () => {
    expect(() => new MyRelayPage('file:///tmp/relay')).toThrow('Invalid relay URL');
  });
  it('clears account-specific follows and discards delayed work from the previous account', async () => {
    const { app } = setup();
    const first = new MRPUser(app.$, 'a'.repeat(64));
    const second = new MRPUser(app.$, 'b'.repeat(64));
    const firstFollow = new MRPUser(app.$, 'c'.repeat(64));
    const secondFollow = new MRPUser(app.$, 'd'.repeat(64));
    for (const [user, follow] of [[first, firstFollow], [second, secondFollow]]) {
      user.follows = new Set([follow]);
      vi.spyOn(user, 'getFollows').mockResolvedValue(undefined);
      vi.spyOn(follow, 'fetchRelayList').mockResolvedValue(undefined);
      vi.spyOn(follow, 'hasRelay').mockReturnValue(true);
      vi.spyOn(follow, 'fetchProfile').mockResolvedValue(undefined);
    }
    const account = vi.spyOn(app.nostr, 'user', 'get').mockReturnValue(first);
    await app.getUserFollowsOnRelay(); expect(app.userFollowsOnRelay).toEqual([firstFollow]);
    let release!: () => void;
    vi.mocked(firstFollow.fetchProfile).mockImplementation(() => new Promise(resolve => { release = () => resolve(undefined); }));
    const stale = app.getUserFollowsOnRelay();
    await vi.waitFor(() => expect(release).toBeDefined());
    account.mockReturnValue(undefined); app.$.signal.emit('mrp:logout');
    expect(app.userFollowsOnRelay).toEqual([]);
    account.mockReturnValue(second); app.$.signal.emit('mrp:login');
    await app.getUserFollowsOnRelay(); expect(app.userFollowsOnRelay).toEqual([secondFollow]);
    release(); await stale; expect(app.userFollowsOnRelay).toEqual([secondFollow]);
    app.$.signal.emit('mrp:login'); expect(app.userFollowsOnRelay).toEqual([]);
    app.close();
  });
  it('does not apply follows after the page closes', async () => {
    const { app } = setup(); const user = new MRPUser(app.$, 'a'.repeat(64));
    let release!: () => void;
    vi.spyOn(user, 'getFollows').mockImplementation(() => new Promise(resolve => { release = resolve; }));
    vi.spyOn(app.nostr, 'user', 'get').mockReturnValue(user);
    const pending = app.getUserFollowsOnRelay(); app.close(); release(); await pending;
    expect(app.userFollowsOnRelay).toEqual([]);
  });

});
