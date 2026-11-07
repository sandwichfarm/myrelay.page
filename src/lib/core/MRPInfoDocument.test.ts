import { afterEach, describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'tseep';
import type { MRPState } from './MRP';
import { MRPInfoDocument } from './MRPInfoDocument';
vi.mock('$lib/utils', () => ({ currentOriginMatchesRelayOrigin: () => false }));
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
function setup() { const signal = new EventEmitter(); return { signal, info: new MRPInfoDocument({ signal } as MRPState, 'wss://relay.test/') }; }
describe('NIP-11 loading', () => {
  it('loads once over HTTPS with NIP-11 content negotiation', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ name: 'Relay', pubkey: 'a'.repeat(64) }) }); vi.stubGlobal('fetch', fetch);
    const { info } = setup(); await Promise.all([info.init(), info.init()]);
    expect(fetch).toHaveBeenCalledTimes(1); expect(fetch.mock.calls[0][0]).toMatch(/^https:\/\/relay.test\//);
    expect(fetch.mock.calls[0][1].headers.Accept).toBe('application/nostr+json'); expect(fetch.mock.calls[0][1].signal).toBeDefined();
    expect(info.loaded).toBe(true); expect(info.name).toBe('Relay'); expect(info.isComplete).toBe(true);
  });
  it.each(['network', 'http', 'json'])('emits completion on %s failure so default config can render', async failure => {
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => {
      if (failure === 'network') throw new Error('offline');
      return { ok: failure !== 'http', status: 500, json: async () => { throw new Error('invalid JSON'); } };
    }));
    const { signal, info } = setup(); const complete = vi.fn(); signal.on('info:completed', complete);
    await info.init(); expect(info.loaded).toBe(false); expect(complete).toHaveBeenCalledTimes(1); expect(info.isComplete).toBe(true);
  });
  it('does not accept malformed operator identity', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ pubkey: 'npub1bad' }) }));
    const { info } = setup(); await info.init(); expect(info.pubkey).toBeUndefined();
  });
  it('aborts pending HTTP work on teardown and settles cleanly', async () => {
    let requestSignal!: AbortSignal;
    vi.stubGlobal('fetch', vi.fn((_url, options) => {
      requestSignal = options.signal;
      return new Promise((_resolve, reject) => requestSignal.addEventListener('abort', () => reject(new Error('aborted'))));
    }));
    const { info } = setup(); const pending = info.init(); info.close(); await pending;
    expect(requestSignal.aborted).toBe(true); expect(info.isComplete).toBe(true);
  });
  it('bounds a stalled NIP-11 fetch', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new Error('timed out')));
    })));
    const { info } = setup(); const pending = info.init();
    await vi.advanceTimersByTimeAsync(8000); await pending; expect(info.isComplete).toBe(true);
  });

});
