// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'tseep';
import { finalizeEvent, getPublicKey } from 'nostr-tools';
import { MRPNostr } from './MRPNostr';
import type { NostrClient } from './nostr';
const secret = new Uint8Array(32).fill(1);
const pubkey = getPublicKey(secret);
function setup(tags = [['r', 'wss://old.test/', 'write'], ['r', 'wss://in.test/', 'read'], ['custom', 'preserve']]) {
  const event = { id: 'old', pubkey, sig: 'signature', kind: 10002, created_at: 1, content: '', tags };
  const signer = { getPublicKey: vi.fn().mockResolvedValue(pubkey), signEvent: vi.fn().mockImplementation(async template => finalizeEvent(template, secret)) };
  const client = { signer, login: vi.fn().mockResolvedValue(pubkey), discoverRelays: vi.fn().mockResolvedValue({ event, read: ['wss://in.test/'], write: ['wss://old.test/'] }), queryOwner: vi.fn().mockResolvedValue([]), publish: vi.fn().mockResolvedValue(undefined), close: vi.fn() };
  const nostr = new MRPNostr(new EventEmitter(), new Set(), 'wss://site.test/', client as unknown as NostrClient);
  return { client, nostr, signer };
}
describe('NIP-07 authentication and NIP-65 updates', () => {
  it('coalesces login and clears signing authority on logout', async () => {
    const { client, nostr } = setup();
    await Promise.all([nostr.login(), nostr.login()]); expect(client.login).toHaveBeenCalledTimes(1); expect(nostr.authed).toBe(true);
    nostr.logout(); expect(nostr.authed).toBe(false); expect(nostr.signer).toBeUndefined();
    await expect(nostr.joinRelay('wss://new.test')).rejects.toThrow('Log in');
  });
  it('preserves tags and directions, normalizes duplicates and publishes only once for repeated joins', async () => {
    const { client, nostr, signer } = setup(); await nostr.login();
    await Promise.all([nostr.joinRelay('wss://new.test'), nostr.joinRelay('wss://new.test/')]);
    expect(signer.signEvent).toHaveBeenCalledTimes(1); expect(client.publish).toHaveBeenCalledTimes(1);
    expect(nostr.user?.relayList?.tags).toEqual([['r', 'wss://old.test/', 'write'], ['r', 'wss://in.test/', 'read'], ['custom', 'preserve'], ['r', 'wss://new.test/']]);
    expect(nostr.user?.readRelays).toEqual(['wss://in.test/', 'wss://new.test/']);
    expect(nostr.user?.writeRelays).toEqual(['wss://old.test/', 'wss://new.test/']);
  });
  it('does not mutate local state on rejected publishes and reuses the signature on retry', async () => {
    const { client, nostr, signer } = setup(); await nostr.login();
    client.publish.mockRejectedValueOnce(new Error('rejected'));
    await expect(nostr.joinRelay('wss://new.test/')).rejects.toThrow('rejected');
    expect(nostr.user?.hasRelay('wss://new.test/')).toBe(false);
    await nostr.joinRelay('wss://new.test/'); expect(signer.signEvent).toHaveBeenCalledTimes(1);
    expect(client.publish.mock.calls[0][0]).toBe(client.publish.mock.calls[1][0]);
  });
  it('uses a newer timestamp for changed intent after an ambiguous publish failure', async () => {
    const clock = vi.spyOn(Date, 'now').mockReturnValue(200000);
    try {
      const { client, nostr, signer } = setup(); await nostr.login();
      client.publish.mockRejectedValueOnce(new Error('ACK lost'));
      await expect(nostr.joinRelay('wss://first.test/')).rejects.toThrow('ACK lost');
      await nostr.joinRelay('wss://second.test/');
      const first = client.publish.mock.calls[0][0];
      const second = client.publish.mock.calls[1][0];
      expect(second.created_at).toBeGreaterThan(first.created_at);
      expect(second.tags).toContainEqual(['r', 'wss://second.test/']);
      expect(second.tags).not.toContainEqual(['r', 'wss://first.test/']);
      expect(signer.signEvent).toHaveBeenCalledTimes(2);
    } finally { clock.mockRestore(); }
  });
  it('publishes removal to the previous outbox and preserves other tags', async () => {
    const { client, nostr } = setup(); await nostr.login();
    await nostr.leaveRelay('wss://old.test');
    expect(client.publish.mock.calls[0][1]).toEqual(['wss://old.test/']);
    expect(nostr.user?.relayList?.tags).toEqual([['r', 'wss://in.test/', 'read'], ['custom', 'preserve']]);
  });
  it('rejects changed signer identity before signing', async () => {
    const { signer, nostr } = setup(); await nostr.login(); signer.getPublicKey.mockResolvedValue('b'.repeat(64));
    await expect(nostr.joinRelay('wss://new.test')).rejects.toThrow('Signer'); expect(signer.signEvent).not.toHaveBeenCalled();
  });
});

describe('authentication race guards', () => {
  it('removes signing authority restored by a login prompt after logout', async () => {
    const { client, nostr, signer } = setup(); let resolve!: (key: string) => void;
    client.login.mockImplementation(() => new Promise<string>(r => { resolve = r; }).then(key => { client.signer = signer; return key; }));
    const pending = nostr.login(); nostr.logout(); resolve(pubkey); await pending;
    expect(nostr.authed).toBe(false); expect(nostr.signer).toBeUndefined();
  });
  it('cancels an update if logout happens while the signer prompt is open', async () => {
    const { client, nostr, signer } = setup(); await nostr.login();
    let resolve!: (event: any) => void; let template: any;
    signer.signEvent.mockImplementation(value => { template = value; return new Promise(r => { resolve = r; }); });
    const pending = nostr.joinRelay('wss://new.test');
    await vi.waitFor(() => expect(signer.signEvent).toHaveBeenCalled());
    nostr.logout(); resolve(finalizeEvent(template, secret));
    await expect(pending).rejects.toThrow('Login changed'); expect(client.publish).not.toHaveBeenCalled();
  });
  it('rejects correctly signed but substituted payloads', async () => {
    const { client, nostr, signer } = setup(); await nostr.login();
    signer.signEvent.mockImplementation(async template => finalizeEvent({ ...template, tags: [] }, secret));
    await expect(nostr.joinRelay('wss://new.test')).rejects.toThrow('invalid relay list'); expect(client.publish).not.toHaveBeenCalled();
  });
  it('rejects a signer that mutates the submitted template in place', async () => {
    const { client, nostr, signer } = setup(); await nostr.login();
    signer.signEvent.mockImplementation(async template => { template.tags.splice(0); template.content = 'substituted'; return finalizeEvent(template, secret); });
    await expect(nostr.joinRelay('wss://new.test')).rejects.toThrow('invalid relay list'); expect(client.publish).not.toHaveBeenCalled();
  });

});
