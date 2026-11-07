import type { Filter, NostrEvent } from 'nostr-tools';
import type { EventPointer } from 'nostr-tools/nip19';
import type { MRPState } from './MRP';
import { MRPData } from './MRPData';
import { normalizeRelays } from './nostr';

export interface UserProfile {
  name?: string;
  displayName?: string;
  display_name?: string;
  about?: string;
  picture?: string;
  image?: string;
  photo?: string;
  banner?: string;
  nip05?: string;
  lud16?: string;
  lud06?: string;
  website?: string;
}

export class MRPUser extends MRPData {
  readonly pubkey: string;
  profile?: UserProfile;
  follows?: Set<MRPUser>;
  relayList?: NostrEvent;
  readRelays: string[] = [];
  writeRelays: string[] = [];
  feed: NostrEvent[] = [];
  feedPointers: Record<string, EventPointer> = {};
  private initialized?: Promise<void>;
  constructor(private state: MRPState, user: string | { pubkey: string }, slug?: string) {
    const pubkey = typeof user === 'string' ? user : user.pubkey;
    super(state.signal, slug ?? pubkey);
    this.pubkey = pubkey;
  }
  get user() { return this; }
  get relays() { return normalizeRelays([...this.readRelays, ...this.writeRelays]); }
  get photo() { return this.profile?.image ?? this.profile?.picture ?? this.profile?.photo; }
  get lud16() { return this.profile?.lud16; }
  get lud06() { return this.profile?.lud06; }
  hasPhoto() { return !!this.photo; }
  init(): Promise<void> { return this.initialized ??= this.load(); }
  private async load() {
    this.begin();
    try {
      await this.fetchRelayList();
      await this.fetchProfile();
      this.complete();
    } catch (error) { this.error(error as Error); this.complete(false); }
  }
  async fetchProfile(): Promise<UserProfile | undefined> {
    const [event] = await this.state.client.queryOwner(this.pubkey, { kinds: [0], authors: [this.pubkey] });
    if (event) {
      try {
        const profile = JSON.parse(event.content);
        if (profile && typeof profile === 'object' && !Array.isArray(profile)) {
          this.profile = Object.fromEntries(Object.entries(profile).filter(([, value]) => typeof value === 'string'));
          this.profile.displayName ??= this.profile.display_name;
          this.profile.image ??= this.profile.picture;
        }
      } catch { /* A malformed metadata event must not prevent the relay page loading. */ }
    }
    return this.profile;
  }
  async fetchRelayList() {
    const relays = await this.state.client.discoverRelays(this.pubkey);
    this.relayList = relays.event;
    this.readRelays = relays.read;
    this.writeRelays = relays.write;
  }
  async getFollows() {
    const [event] = await this.state.client.queryOwner(this.pubkey, { kinds: [3], authors: [this.pubkey] });
    const pubkeys = new Set(event?.tags.filter(tag => tag[0] === 'p' && /^[a-f0-9]{64}$/.test(tag[1])).map(tag => tag[1]));
    this.follows = new Set([...pubkeys].map(pubkey => new MRPUser(this.state, pubkey)));
  }
  hasRelay(url: string) {
    const [normalized] = normalizeRelays([url]);
    return !!normalized && this.relays.includes(normalized);
  }
  async fetchNotes(opts?: { relays?: string[]; filter?: Filter }) {
    const filter: Filter = { ...opts?.filter, kinds: [1], authors: [this.pubkey], limit: opts?.filter?.limit ?? 3 };
    this.feed = opts?.relays
      ? await this.state.client.query(filter, opts.relays)
      : await this.state.client.queryOwner(this.pubkey, filter);
    this.feed = this.feed.slice().sort((a, b) => b.created_at - a.created_at || a.id.localeCompare(b.id)).slice(0, filter.limit);
    this.feedPointers = Object.fromEntries(this.feed.map(event => [event.id, {
      id: event.id, relays: opts?.relays ?? this.writeRelays, pubkey: event.pubkey, kind: event.kind,
    }]));
    this.changed();
  }
}
