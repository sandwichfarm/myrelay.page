// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { finalizeEvent, getPublicKey } from 'nostr-tools';
import { EventEmitter } from 'tseep';
import jsonpack from 'jsonpack';
import { MRPConfig } from './MRPConfig';
import type { MRPState } from './MRP';

const key = new Uint8Array(32).fill(1);
const pubkey = getPublicKey(key);
const relay = 'wss://relay.example/';
const address = `myrelay.page/${relay}operator@${pubkey}`;
const outbox = ['wss://owner.example/'];
const signedConfig = (created_at = 1, content = jsonpack.pack({ general: { login: { enabled: false } } }), tags = [['d', address]]) => finalizeEvent({ kind: 30078, created_at, tags, content }, key);

function setup(events = [] as ReturnType<typeof signedConfig>[]) {
  const client = {
    queryOwner: vi.fn().mockResolvedValue(events),
    discoverRelays: vi.fn().mockResolvedValue({ read: [], write: outbox }),
    signer: { getPublicKey: vi.fn().mockResolvedValue(pubkey), signEvent: vi.fn(async template => finalizeEvent(template, key)) },
    publish: vi.fn().mockResolvedValue(undefined),
  };
  const signal = new EventEmitter();
  const config = new MRPConfig({ client, signal } as unknown as MRPState, relay, pubkey);
  return { config, client, signal };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

describe('operator configuration discovery', () => {
  it('queries the owner outbox using the historical kind and address', async () => {
    const { config, client } = setup([signedConfig()]);
    await config.init();
    expect(config.configKey()).toBe(address);
    expect(client.queryOwner).toHaveBeenCalledWith(pubkey, { kinds: [30078], authors: [pubkey], '#d': [address] }, [relay]);
    expect(config.event.isLoginEnabled()).toBe(false);
  });

  it('initializes once even for concurrent or repeated calls', async () => {
    const { config, client, signal } = setup();
    const completed = vi.fn();
    signal.on('config:completed', completed);
    await Promise.all([config.init(), config.init()]);
    await config.init();
    expect(client.queryOwner).toHaveBeenCalledTimes(1);
    expect(completed).toHaveBeenCalledTimes(1);
    expect(config.event.d).toBe(address);
  });

  it('chooses the newest matching event deterministically', async () => {
    const a = signedConfig(3);
    const b = signedConfig(3, jsonpack.pack({ general: { login: { enabled: true } } }));
    const expected = [a, b].sort((x, y) => x.id.localeCompare(y.id))[0];
    const { config } = setup([signedConfig(100, '', [['d', 'wrong']]), signedConfig(1), b, a]);
    await config.init();
    expect(config.event.id).toBe(expected.id);
  });

  it('loads defaults on discovery failure', async () => {
    const { config, client } = setup();
    client.queryOwner.mockRejectedValue(new Error('offline'));
    await config.init();
    expect(config.isComplete).toBe(true);
    expect(config.event.isLoginEnabled()).toBe(true);
  });

  it('does not issue an unbounded query when the NIP-11 operator is absent', async () => {
    const { client, signal } = setup();
    const config = new MRPConfig({ client, signal } as unknown as MRPState, relay);
    await config.init();
    expect(client.queryOwner).not.toHaveBeenCalled();
    expect(config.isComplete).toBe(true);
  });
});

describe('operator configuration publishing', () => {
  it('publishes only to the operator write relays and acknowledges edits', async () => {
    const { config, client } = setup();
    await config.init();
    config.event.setJoinEnabled(false);
    await config.publish();
    expect(client.publish).toHaveBeenCalledWith(expect.objectContaining({ kind: 30078, pubkey, tags: [['d', address]] }), outbox);
    expect(config.event.changed).toBe(false);
    expect(config.event.id).not.toBe('');
    await config.publish();
    expect(client.publish).toHaveBeenCalledTimes(1);
  });

  it('does not republish an unchanged loaded configuration', async () => {
    const { config, client } = setup([signedConfig()]);
    await config.init();
    await config.publish();
    expect(client.signer.signEvent).not.toHaveBeenCalled();
    expect(client.publish).not.toHaveBeenCalled();
  });

  it('rejects a different signer before signing or publishing', async () => {
    const { config, client } = setup();
    await config.init();
    client.signer.getPublicKey.mockResolvedValue('0'.repeat(64));
    await expect(config.publish()).rejects.toThrow('Only the relay operator');
    expect(client.signer.signEvent).not.toHaveBeenCalled();
    expect(client.publish).not.toHaveBeenCalled();
  });

  it('requires an actual write outbox', async () => {
    const { config, client } = setup();
    await config.init();
    client.discoverRelays.mockResolvedValue({ read: ['wss://read.example/'], write: [] });
    await expect(config.publish()).rejects.toThrow('No writable relays');
    expect(client.signer.signEvent).not.toHaveBeenCalled();
  });

  it('coalesces concurrent saves', async () => {
    const { config, client } = setup();
    await config.init();
    await Promise.all([config.publish(), config.publish(), config.publish()]);
    expect(client.signer.signEvent).toHaveBeenCalledTimes(1);
    expect(client.publish).toHaveBeenCalledTimes(1);
  });

  it('keeps the identical signed event for retry after failed acknowledgements', async () => {
    const { config, client } = setup();
    await config.init();
    config.event.setJoinEnabled(false);
    client.publish.mockRejectedValueOnce(new Error('rejected'));
    await expect(config.publish()).rejects.toThrow('rejected');
    expect(config.event.changed).toBe(true);
    await config.publish();
    expect(client.signer.signEvent).toHaveBeenCalledTimes(1);
    expect(client.publish.mock.calls[0][0]).toBe(client.publish.mock.calls[1][0]);
    expect(config.event.changed).toBe(false);
  });

  it('signs a new event if the operator changes a failed save', async () => {
    const { config, client } = setup();
    await config.init();
    config.event.setJoinEnabled(false);
    client.publish.mockRejectedValueOnce(new Error('offline'));
    await expect(config.publish()).rejects.toThrow();
    config.event.setLoginEnabled(false);
    await config.publish();
    expect(client.signer.signEvent).toHaveBeenCalledTimes(2);
    expect(client.publish.mock.calls[0][0].id).not.toBe(client.publish.mock.calls[1][0].id);
    expect(client.publish.mock.calls[1][0].created_at).toBeGreaterThan(client.publish.mock.calls[0][0].created_at);
  });

  it('keeps edits made during relay lookup dirty after acknowledgment', async () => {
    const { config, client } = setup();
    await config.init();
    config.event.setJoinEnabled(false);
    const lookup = deferred<{ read: string[]; write: string[] }>();
    client.discoverRelays.mockReturnValue(lookup.promise);
    const publishing = config.publish();
    await vi.waitFor(() => expect(client.discoverRelays).toHaveBeenCalled());
    config.event.setLoginEnabled(false);
    lookup.resolve({ read: [], write: outbox });
    await publishing;
    expect(config.event.changed).toBe(true);
    expect(jsonpack.unpack(client.publish.mock.calls[0][0].content).general.login.enabled).toBe(true);
    config.event.discardChanges();
    expect(config.event.isLoginEnabled()).toBe(true);
    expect(config.event.isJoinEnabled()).toBe(false);
  });

  it('keeps edits made during publishing dirty', async () => {
    const { config, client } = setup();
    await config.init();
    config.event.setJoinEnabled(false);
    const ack = deferred<void>();
    client.publish.mockReturnValue(ack.promise);
    const publishing = config.publish();
    await vi.waitFor(() => expect(client.publish).toHaveBeenCalled());
    config.event.setLoginEnabled(false);
    ack.resolve();
    await publishing;
    expect(config.event.changed).toBe(true);
    config.event.discardChanges();
    expect(config.event.isLoginEnabled()).toBe(true);
  });

  it('rejects altered signer responses', async () => {
    const { config, client } = setup();
    await config.init();
    client.signer.signEvent.mockImplementation(async template => finalizeEvent({ ...template, content: 'altered' }, key));
    await expect(config.publish()).rejects.toThrow('invalid configuration event');
    expect(client.publish).not.toHaveBeenCalled();
  });

  it('cancels before signing when the session changes during discovery', async () => {
    const { config, client } = setup();
    await config.init();
    const lookup = deferred<{ read: string[]; write: string[] }>();
    client.discoverRelays.mockReturnValue(lookup.promise);
    const publishing = config.publish();
    const rejected = expect(publishing).rejects.toThrow('Signing session changed');
    await vi.waitFor(() => expect(client.discoverRelays).toHaveBeenCalled());
    client.signer = { ...client.signer };
    lookup.resolve({ read: [], write: outbox });
    await rejected;
    expect(client.signer.signEvent).not.toHaveBeenCalled();
    expect(client.publish).not.toHaveBeenCalled();
  });

  it('cancels before submission when the session changes during signing', async () => {
    const { config, client } = setup();
    await config.init();
    const signing = deferred<ReturnType<typeof signedConfig>>();
    client.signer.signEvent.mockReturnValue(signing.promise);
    const publishing = config.publish();
    const rejected = expect(publishing).rejects.toThrow('Signing session changed');
    await vi.waitFor(() => expect(client.signer.signEvent).toHaveBeenCalled());
    const template = client.signer.signEvent.mock.calls[0][0];
    client.signer = { ...client.signer };
    signing.resolve(finalizeEvent(template, key));
    await rejected;
    expect(client.publish).not.toHaveBeenCalled();
  });

  it('uses a replacement timestamp newer than the loaded event', async () => {
    const future = Math.floor(Date.now() / 1000) + 10;
    const { config, client } = setup([signedConfig(future)]);
    await config.init();
    config.event.setJoinEnabled(false);
    await config.publish();
    expect(client.publish.mock.calls[0][0].created_at).toBe(future + 1);
  });
});
