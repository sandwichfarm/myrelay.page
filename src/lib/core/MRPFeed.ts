import type { Filter, NostrEvent } from 'nostr-tools';
import type { EventPointer } from 'nostr-tools/nip19';
import { MRPData } from './MRPData';
import type { MRPState } from './MRP';

export interface MRPFeedOptions {
  filter: Filter;
  relays: string[];
  pointerRelays?: string[];
  exclude?: Record<string, string | number | boolean | undefined>;
}

export class MRPFeed extends MRPData {
  notes: NostrEvent[] = [];
  pointers: Record<string, EventPointer> = {};
  private pending?: Promise<void>;
  readonly pointerRelays: string[];
  constructor(private state: MRPState, slug: string, private options: MRPFeedOptions) {
    super(state.signal, slug);
    this.pointerRelays = options.pointerRelays ?? options.relays;
  }
  get filter() { return this.options.filter; }
  get relays() { return this.options.relays; }
  fetch(): Promise<void> {
    return this.pending ??= this.load().finally(() => { this.pending = undefined; });
  }
  private async load() {
    this.begin();
    try {
      const events = await this.state.client.query(this.filter, this.relays);
      this.notes = events.filter(event => !Object.entries(this.options.exclude ?? {})
        .some(([key, value]) => value !== undefined && (event as unknown as Record<string, unknown>)[key] === value))
        .sort((a, b) => b.created_at - a.created_at || a.id.localeCompare(b.id));
      if (this.filter.limit !== undefined) this.notes = this.notes.slice(0, this.filter.limit);
      this.pointers = Object.fromEntries(this.notes.map(event => [event.id, {
        id: event.id, relays: this.pointerRelays, pubkey: event.pubkey, kind: event.kind,
      }]));
      this.complete();
    } catch (error) {
      this.error(error as Error);
      this.complete(false);
    }
  }
}
