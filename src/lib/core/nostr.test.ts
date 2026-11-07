// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EMPTY, NEVER, Observable, Subject, concat, of, throwError } from 'rxjs';
import { finalizeEvent, getPublicKey } from 'nostr-tools/pure';
import type { EventTemplate, NostrEvent } from 'nostr-tools/pure';
import type { Filter } from 'applesauce-core/helpers/filter';
import type { PublishResponse } from 'applesauce-relay';
import { DEFAULT_RELAYS, NostrClient, latestEvent, normalizeRelays, type NostrPool } from './nostr';

const secret = new Uint8Array(32).fill(1);
const otherSecret = new Uint8Array(32).fill(2);
const pubkey = getPublicKey(secret);
const clients: NostrClient[] = [];
const event = (overrides: Partial<EventTemplate> = {}, key = secret): NostrEvent => finalizeEvent({
  kind: 1, created_at: 100, tags: [], content: 'hello', ...overrides,
}, key);

function setup(options: { request?: (url: string, filter: Filter) => Observable<NostrEvent>; publish?: (url: string) => Observable<PublishResponse>; requestTimeout?: number } = {}) {
  const requests = vi.fn((url: string, filter: Filter) => options.request?.(url, filter) ?? EMPTY);
  const publishes = vi.fn((url: string) => options.publish?.(url) ?? of({ ok: true, from: url }));
  const close = vi.fn();
  const pool: NostrPool = {
    relay: url => ({ request: filter => requests(url, filter as Filter), event: () => publishes(url) }),
    close,
  };
  const client = new NostrClient({ pool, requestTimeout: options.requestTimeout ?? 50, publishTimeout: 50,
    discoveryRelays: ['wss://discovery.example'], fallbackRelays: ['wss://super.example'], discoveryCacheMs: 100 });
  clients.push(client);
  return { client, requests, publishes, close };
}

afterEach(() => {
  clients.splice(0).forEach(client => client.close());
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('relay addressing and replacement order', () => {
  it('normalizes and deduplicates websocket URLs, rejecting invalid schemes and credentials', () => {
    expect(normalizeRelays(['wss://RELAY.example', 'wss://relay.example/', 'ws://local.test/path#ignored',
      'https://example.com', 'bad', 'wss://user:pass@relay.example'])).toEqual(['wss://relay.example/', 'ws://local.test/path']);
    expect(DEFAULT_RELAYS.length).toBeGreaterThan(1);
  });

  it('chooses the newest event and smallest ID for timestamp ties, regardless of arrival order', () => {
    const a = event({ created_at: 2, content: 'a' });
    const b = event({ created_at: 2, content: 'b' });
    const old = event({ created_at: 1 });
    const expected = [a, b].sort((x, y) => x.id.localeCompare(y.id))[0];
    expect(latestEvent([a, old, b])).toBe(expected);
    expect(latestEvent([b, old, a])).toBe(expected);
    expect(latestEvent([])).toBeUndefined();
  });
});

describe('bounded, validated queries', () => {
  it('retains good relay results when another relay fails, and deduplicates IDs', async () => {
    const note = event();
    const { client } = setup({ request: url => url.includes('bad') ? throwError(() => new Error('offline')) : of(note, note) });
    const results = await client.query({ kinds: [1] }, ['wss://good.example', 'wss://bad.example']);
    expect(results.map(value => value.id)).toEqual([note.id]);
    expect(client.store.getEvent(note.id)?.content).toBe('hello');
  });

  it('retains partial results emitted before a transport error', async () => {
    const note = event();
    const { client } = setup({ request: () => concat(of(note), throwError(() => new Error('disconnected'))) });
    expect((await client.query({ kinds: [1] })).map(value => value.id)).toEqual([note.id]);
  });

  it('rejects invalid signatures, modified signed events, wrong authors, kinds and d-tags', async () => {
    const valid = event({ kind: 30078, tags: [['d', 'config']] });
    const { client } = setup({ request: () => of(
      { ...valid, sig: '0'.repeat(128) }, { ...valid, content: 'tampered' },
      event({ kind: 30078, tags: [['d', 'config']] }, otherSecret), event(),
      event({ kind: 30078, tags: [['d', 'other']] }), valid,
    ) });
    const results = await client.query({ kinds: [30078], authors: [pubkey], '#d': ['config'] });
    expect(results.map(value => value.id)).toEqual([valid.id]);
  });

  it('keeps only the newest version of each replaceable address and limits after sorting', async () => {
    const old = event({ kind: 30078, tags: [['d', 'one']], created_at: 1 });
    const replacement = event({ kind: 30078, tags: [['d', 'one']], created_at: 3 });
    const other = event({ kind: 30078, tags: [['d', 'two']], created_at: 2 });
    const { client } = setup({ request: () => of(old, replacement, other) });
    expect((await client.query({ kinds: [30078] })).map(value => value.id)).toEqual([replacement.id, other.id]);
    expect((await client.query({ kinds: [30078], limit: 1 })).map(value => value.id)).toEqual([replacement.id]);
  });

  it('coalesces concurrent identical queries and makes subsequent requests fresh', async () => {
    const source = new Subject<NostrEvent>();
    const { client, requests } = setup({ request: () => source });
    const first = client.query({ kinds: [1] });
    const second = client.query({ kinds: [1] });
    expect(first).toBe(second);
    expect(requests).toHaveBeenCalledTimes(1);
    source.next(event()); source.complete();
    await first;
    await client.query({ kinds: [1] });
    expect(requests).toHaveBeenCalledTimes(2);
  });

  it('uses a fixed deadline even when a relay streams endlessly, and unsubscribes', async () => {
    vi.useFakeTimers();
    const teardown = vi.fn();
    const { client } = setup({ request: () => new Observable(subscriber => {
      const interval = setInterval(() => subscriber.next(event()), 10);
      return () => { clearInterval(interval); teardown(); };
    }) });
    const result = client.query({ kinds: [1] });
    await vi.advanceTimersByTimeAsync(50);
    expect(await result).toHaveLength(1);
    expect(teardown).toHaveBeenCalledTimes(1);
  });

  it('does not make a connection for empty or invalid relay sets', async () => {
    const { client, requests } = setup();
    expect(await client.query({ kinds: [1] }, ['https://invalid.example'])).toEqual([]);
    expect(requests).not.toHaveBeenCalled();
  });

  it('takes a snapshot of caller filters', async () => {
    const subject = new Subject<NostrEvent>();
    const { client, requests } = setup({ request: () => subject });
    const filter = { kinds: [1] };
    const result = client.query(filter);
    filter.kinds[0] = 2;
    subject.next(event()); subject.complete();
    expect(await result).toHaveLength(1);
    expect(requests.mock.calls[0][1]).toEqual({ kinds: [1] });
  });
});

describe('owner outbox discovery', () => {
  it('uses the newest NIP-65 and respects read/write markers and normalization', async () => {
    const old = event({ kind: 10002, created_at: 1, tags: [['r', 'wss://obsolete.example']] });
    const newest = event({ kind: 10002, created_at: 2, tags: [
      ['r', 'wss://both.example'], ['r', 'wss://both.example/'],
      ['r', 'wss://read.example', 'read'], ['r', 'wss://write.example', 'write'],
      ['r', 'https://invalid.example'], ['r', 'wss://unknown.example', 'other'],
    ] });
    const { client, requests } = setup({ request: () => of(newest, old) });
    const first = client.discoverRelays(pubkey);
    expect(client.discoverRelays(pubkey)).toBe(first);
    const result = await first;
    expect(result.event?.id).toBe(newest.id);
    expect(result.read).toEqual(['wss://both.example/', 'wss://read.example/']);
    expect(result.write).toEqual(['wss://both.example/', 'wss://write.example/']);
    await client.discoverRelays(pubkey);
    expect(requests).toHaveBeenCalledTimes(1);
    expect(requests.mock.calls[0][0]).toBe('wss://discovery.example/');
  });

  it('does not cache missing discovery results', async () => {
    const { client, requests } = setup();
    await client.discoverRelays(pubkey);
    await client.discoverRelays(pubkey);
    expect(requests).toHaveBeenCalledTimes(2);
  });

  it('expires successful discovery cache entries', async () => {
    vi.useFakeTimers();
    const { client, requests } = setup({ request: () => of(event({ kind: 10002 })) });
    await client.discoverRelays(pubkey);
    await vi.advanceTimersByTimeAsync(101);
    await client.discoverRelays(pubkey);
    expect(requests).toHaveBeenCalledTimes(2);
  });

  it('does not regress to an older replica when the discovery cache expires', async () => {
    vi.useFakeTimers();
    const newest = event({ kind: 10002, created_at: 20, tags: [['r', 'wss://current.example', 'write']] });
    const old = event({ kind: 10002, created_at: 10, tags: [['r', 'wss://retired.example', 'write']] });
    let replica = newest;
    const { client } = setup({ request: () => of(replica) });
    expect((await client.discoverRelays(pubkey)).event?.id).toBe(newest.id);
    replica = old;
    await vi.advanceTimersByTimeAsync(101);
    const discovered = await client.discoverRelays(pubkey);
    expect(discovered.event?.id).toBe(newest.id);
    expect(discovered.write).toEqual(['wss://current.example/']);
  });

  it('retains an acknowledged relay-list update while discovery replicas lag behind', async () => {
    const old = event({ kind: 10002, created_at: 10, tags: [['r', 'wss://retired.example', 'write']] });
    const newest = event({ kind: 10002, created_at: 20, tags: [['r', 'wss://current.example', 'write']] });
    const { client, requests } = setup({ request: () => of(old) });
    await client.discoverRelays(pubkey);
    await client.publish(newest, ['wss://current.example']);
    const discovered = await client.discoverRelays(pubkey);
    expect(requests).toHaveBeenCalledTimes(2);
    expect(discovered.event?.id).toBe(newest.id);
    expect(discovered.write).toEqual(['wss://current.example/']);
  });

  it('finds configuration on owner write relays and never reads a read-only inbox', async () => {
    const list = event({ kind: 10002, tags: [['r', 'wss://outbox.example', 'write'], ['r', 'wss://inbox.example', 'read']] });
    const config = event({ kind: 30078, tags: [['d', 'key']] });
    const { client, requests } = setup({ request: url => url.includes('discovery') ? of(list) : url.includes('outbox') ? of(config) : EMPTY });
    expect((await client.queryOwner(pubkey, { kinds: [30078], '#d': ['key'] })).map(value => value.id)).toEqual([config.id]);
    expect(requests.mock.calls.some(([url]) => url.includes('outbox'))).toBe(true);
    expect(requests.mock.calls.some(([url]) => url.includes('inbox'))).toBe(false);
  });

  it('compares outbox and fallback replicas before selecting the latest configuration', async () => {
    const list = event({ kind: 10002, tags: [['r', 'wss://outbox.example', 'write']] });
    const old = event({ kind: 30078, created_at: 1, tags: [['d', 'config']] });
    const newest = event({ kind: 30078, created_at: 2, tags: [['d', 'config']] });
    const { client } = setup({ request: url => url.includes('discovery') ? of(list) : url.includes('outbox') ? of(old) : of(newest) });
    expect((await client.queryOwner(pubkey, { kinds: [30078], '#d': ['config'] })).map(value => value.id)).toEqual([newest.id]);
  });

  it('falls back to superrelays and the target relay when an outbox is unavailable', async () => {
    const list = event({ kind: 10002, tags: [['r', 'wss://outbox.example']] });
    const config = event({ kind: 30078 });
    const { client, requests } = setup({ request: url => url.includes('discovery') ? of(list) : url.includes('target') ? of(config) : EMPTY });
    expect((await client.queryOwner(pubkey, { kinds: [30078] }, ['wss://target.example'])).map(value => value.id)).toEqual([config.id]);
    expect(requests.mock.calls.some(([url]) => url.includes('super'))).toBe(true);
  });

  it('does not allow caller filters to override owner authorship or query invalid keys', async () => {
    const { client, requests } = setup();
    await client.queryOwner(pubkey, { kinds: [1], authors: ['other'] });
    expect(requests.mock.calls.at(-1)?.[1].authors).toEqual([pubkey]);
    requests.mockClear();
    expect(await client.queryOwner('', { kinds: [1] })).toEqual([]);
    expect(await client.discoverRelays('not-a-key')).toEqual({ read: [], write: [] });
    expect(requests).not.toHaveBeenCalled();
  });
});

describe('publishing and lifecycle', () => {
  it('requires an affirmative relay acknowledgement but tolerates partial failures', async () => {
    const { client } = setup({ publish: url => url.includes('bad') ? throwError(() => new Error('offline')) : of({ ok: true, from: url }) });
    const signed = event();
    await expect(client.publish(signed, ['wss://bad.example', 'wss://good.example'])).resolves.toBeUndefined();
    expect(client.store.getEvent(signed.id)?.id).toBe(signed.id);
  });

  it('reports rejected, silent, and absent write relays without caching the event', async () => {
    vi.useFakeTimers();
    const { client } = setup({ publish: url => url.includes('silent') ? NEVER : of({ ok: false, from: url, message: 'blocked' }) });
    const signed = event();
    const failure = expect(client.publish(signed, ['wss://silent.example', 'wss://reject.example'])).rejects.toThrow('No relay acknowledged');
    await vi.advanceTimersByTimeAsync(50);
    await failure;
    expect(client.store.getEvent(signed.id)).toBeUndefined();
    await expect(client.publish(signed, [])).rejects.toThrow('No write relays');
  });

  it('rejects invalid signed events before making network calls', async () => {
    const { client, publishes } = setup();
    await expect(client.publish({ ...event(), content: 'tampered' }, ['wss://relay.example'])).rejects.toThrow('invalid signed event');
    expect(publishes).not.toHaveBeenCalled();
  });

  it('invalidates discovery cache after an acknowledged relay-list publication', async () => {
    const list = event({ kind: 10002 });
    const { client, requests } = setup({ request: () => of(list) });
    await client.discoverRelays(pubkey);
    await client.publish(list, ['wss://relay.example']);
    await client.discoverRelays(pubkey);
    expect(requests).toHaveBeenCalledTimes(2);
  });

  it('uses the NIP-07 extension and retains no signer if access is denied', async () => {
    const { client } = setup();
    vi.stubGlobal('window', { nostr: { getPublicKey: vi.fn().mockRejectedValue(new Error('denied')) } });
    await expect(client.login()).rejects.toThrow('denied');
    expect(client.signer).toBeUndefined();
    vi.stubGlobal('window', { nostr: { getPublicKey: vi.fn().mockResolvedValue(pubkey), signEvent: vi.fn(async template => event(template)) } });
    expect(await client.login()).toBe(pubkey);
    expect(await client.signer?.getPublicKey()).toBe(pubkey);
  });

  it('closes subscriptions and the pool once, and rejects later publications', async () => {
    const teardown = vi.fn();
    const { client, close } = setup({ request: () => new Observable(() => teardown) });
    const pending = client.query({ kinds: [1] });
    client.close(); client.close();
    expect(await pending).toEqual([]);
    expect(teardown).toHaveBeenCalledTimes(1);
    expect(close).toHaveBeenCalledTimes(1);
    expect(await client.query({ kinds: [1] })).toEqual([]);
    await expect(client.publish(event(), ['wss://relay.example'])).rejects.toThrow('closed');
    await expect(client.login()).rejects.toThrow('closed');
  });
});
