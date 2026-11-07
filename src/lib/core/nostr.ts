import { EventStore } from 'applesauce-core/event-store';
import { getEventUID, isEvent, verifyEvent, type EventTemplate, type NostrEvent } from 'applesauce-core/helpers/event';
import { matchFilter, type Filter } from 'applesauce-core/helpers/filter';
import { RelayPool, type Relay } from 'applesauce-relay';
import { ExtensionSigner } from 'applesauce-signers/signers/extension-signer';
import { EMPTY, ReplaySubject, catchError, defer, firstValueFrom, take, takeUntil, timer, toArray } from 'rxjs';

export type { NostrEvent, EventTemplate, Filter };

export const DISCOVERY_RELAYS = ['wss://purplepag.es/', 'wss://index.hzrd149.com/'];
export const SUPER_RELAYS = ['wss://relay.ditto.pub/', 'wss://relay.damus.io/', 'wss://nos.lol/'];
export const DEFAULT_RELAYS = [...DISCOVERY_RELAYS, ...SUPER_RELAYS];

export function normalizeRelays(relays: readonly string[]): string[] {
  const normalized = new Set<string>();
  for (const relay of relays) {
    try {
      const url = new URL(relay);
      if (!['ws:', 'wss:'].includes(url.protocol) || url.username || url.password) continue;
      url.hash = '';
      normalized.add(url.toString());
    } catch { /* Ignore malformed relay-list entries. */ }
  }
  return [...normalized];
}

function compareEvents(a: NostrEvent, b: NostrEvent): number {
  return b.created_at - a.created_at || a.id.localeCompare(b.id);
}

/** NIP-01 replacement ordering, independent of relay response order. */
export function latestEvent(events: readonly NostrEvent[]): NostrEvent | undefined {
  return [...events].sort(compareEvents)[0];
}

function uniqueEvents(events: NostrEvent[], limit?: number): NostrEvent[] {
  const seen = new Set<string>();
  const result = events.sort(compareEvents).filter(event => {
    const key = getEventUID(event);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return limit === undefined ? result : result.slice(0, Math.max(0, limit));
}

function verifiedCopy(event: NostrEvent): NostrEvent | undefined {
  try {
    if (!isEvent(event)) return;
    // Copy only wire fields: a caller's cached verification symbol must not bypass validation.
    const copy = {
      id: event.id, pubkey: event.pubkey, sig: event.sig, kind: event.kind,
      created_at: event.created_at, content: event.content,
      tags: event.tags.map(tag => [...tag]),
    };
    return verifyEvent(copy) ? copy : undefined;
  } catch { return; }
}

export interface NostrSigner {
  getPublicKey(): Promise<string>;
  signEvent(template: EventTemplate): Promise<NostrEvent>;
}

export interface NostrPool {
  relay(url: string): Pick<Relay, 'request' | 'event'>;
  close(): void;
}

export interface RelayList {
  event?: NostrEvent;
  read: string[];
  write: string[];
}

export interface NostrClientOptions {
  pool?: NostrPool;
  discoveryRelays?: string[];
  fallbackRelays?: string[];
  requestTimeout?: number;
  publishTimeout?: number;
  discoveryCacheMs?: number;
}

/** One shared pool and event store per page; requests complete on EOSE or a fixed deadline. */
export class NostrClient {
  readonly pool: NostrPool;
  readonly store = new EventStore({ verifyEvent });
  signer?: NostrSigner;
  private readonly discoveryRelays: string[];
  private readonly fallbackRelays: string[];
  private readonly requestTimeout: number;
  private readonly publishTimeout: number;
  private readonly discoveryCacheMs: number;
  private readonly pending = new Map<string, Promise<NostrEvent[]>>();
  private readonly discoveryPending = new Map<string, Promise<RelayList>>();
  private readonly discoveryCache = new Map<string, { expires: number; value: RelayList }>();
  private readonly closed$ = new ReplaySubject<void>(1);
  private closed = false;

  constructor(options: NostrClientOptions = {}) {
    this.requestTimeout = options.requestTimeout ?? 3000;
    this.publishTimeout = options.publishTimeout ?? 6000;
    this.discoveryCacheMs = options.discoveryCacheMs ?? 60_000;
    this.discoveryRelays = normalizeRelays(options.discoveryRelays ?? DEFAULT_RELAYS);
    this.fallbackRelays = normalizeRelays(options.fallbackRelays ?? SUPER_RELAYS);
    this.pool = options.pool ?? new RelayPool({ keepAlive: 15_000, requestReconnect: 0 });
  }

  query(filter: Filter, relays: string[] = this.fallbackRelays): Promise<NostrEvent[]> {
    if (this.closed) return Promise.resolve([]);
    const urls = normalizeRelays(relays);
    // Filters are snapshots: later UI mutations cannot change an in-flight request.
    const snapshot: Filter = JSON.parse(JSON.stringify(filter));
    const key = JSON.stringify([urls.slice().sort(), snapshot]);
    const existing = this.pending.get(key);
    if (existing) return existing;
    const request = Promise.all(urls.map(async url => {
      const events = await firstValueFrom(defer(() => this.pool.relay(url).request(snapshot, {
        reconnect: false, resubscribe: false, timeout: this.requestTimeout,
      })).pipe(
        takeUntil(timer(this.requestTimeout)), takeUntil(this.closed$),
        catchError(() => EMPTY), toArray(),
      ));
      if (this.closed) return [];
      const valid: NostrEvent[] = [];
      for (const event of events) {
        const copy = verifiedCopy(event);
        if (!copy || !matchFilter(snapshot, copy)) continue;
        this.store.add(copy, url);
        valid.push(copy);
      }
      return valid;
    })).then(groups => uniqueEvents(groups.flat(), snapshot.limit));
    this.pending.set(key, request);
    const cleanup = () => { this.pending.delete(key); };
    void request.then(cleanup, cleanup);
    return request;
  }

  discoverRelays(pubkey: string): Promise<RelayList> {
    if (!/^[0-9a-f]{64}$/.test(pubkey) || this.closed) return Promise.resolve({ read: [], write: [] });
    const cached = this.discoveryCache.get(pubkey);
    if (cached && cached.expires > Date.now()) return Promise.resolve(cached.value);
    const existing = this.discoveryPending.get(pubkey);
    if (existing) return existing;
    const request = this.query({ kinds: [10002], authors: [pubkey] }, this.discoveryRelays).then(events => {
      // A stale discovery replica must not undo a newer list already received or
      // acknowledged locally. EventStore retains the latest valid replacement.
      const stored = this.store.getReplaceable(10002, pubkey);
      const event = latestEvent(stored ? [...events, stored] : events);
      const read: string[] = [], write: string[] = [];
      for (const tag of event?.tags ?? []) {
        if (tag[0] !== 'r' || !tag[1]) continue;
        if (!tag[2] || tag[2] === 'read') read.push(tag[1]);
        if (!tag[2] || tag[2] === 'write') write.push(tag[1]);
      }
      const result = { event, read: normalizeRelays(read), write: normalizeRelays(write) };
      // Missing records may be temporary outages; never cache their absence.
      if (event && !this.closed) this.discoveryCache.set(pubkey, { expires: Date.now() + this.discoveryCacheMs, value: result });
      return result;
    });
    this.discoveryPending.set(pubkey, request);
    const cleanup = () => { this.discoveryPending.delete(pubkey); };
    void request.then(cleanup, cleanup);
    return request;
  }

  async queryOwner(pubkey: string, filter: Filter, extraRelays: string[] = []): Promise<NostrEvent[]> {
    if (!/^[0-9a-f]{64}$/.test(pubkey)) return [];
    const { write } = await this.discoverRelays(pubkey);
    const ownerFilter = { ...filter, authors: [pubkey] };
    // Check all replicas after discovering the outbox: a fast stale replica must not win.
    return this.query(ownerFilter, normalizeRelays([...write, ...extraRelays, ...this.fallbackRelays]));
  }

  async login(): Promise<string> {
    if (this.closed) throw new Error('Nostr client is closed');
    const signer = new ExtensionSigner();
    const pubkey = await signer.getPublicKey();
    if (this.closed) throw new Error('Nostr client is closed');
    this.signer = signer;
    return pubkey;
  }

  async publish(event: NostrEvent, relays: string[]): Promise<void> {
    if (this.closed) throw new Error('Nostr client is closed');
    const signed = verifiedCopy(event);
    if (!signed) throw new Error('Cannot publish an invalid signed event');
    const urls = normalizeRelays(relays);
    if (!urls.length) throw new Error('No write relays available');
    const responses = await Promise.all(urls.map(url => firstValueFrom(
      defer(() => this.pool.relay(url).event(signed)).pipe(
        take(1), takeUntil(timer(this.publishTimeout)), takeUntil(this.closed$),
        catchError(() => EMPTY), toArray(),
      ),
    )));
    if (!responses.flat().some(response => response.ok)) throw new Error('No relay acknowledged the event');
    if (!this.closed) this.store.add(signed);
    if (signed.kind === 10002) this.discoveryCache.delete(signed.pubkey);
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    this.signer = undefined;
    this.closed$.next();
    this.closed$.complete();
    this.pool.close();
    this.store.dispose();
    this.discoveryCache.clear();
  }
}
