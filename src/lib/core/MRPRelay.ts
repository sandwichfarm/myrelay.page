import { MRPUser } from './MRPUser';
import { MRPFeed } from './MRPFeed';
import type { MRPState } from './MRP';
import { MRPData } from './MRPData';
import { MRPInfoDocument } from './MRPInfoDocument';
import { MRPConfig } from './MRPConfig';
import type { Filter } from 'nostr-tools';

export class MRPRelay extends MRPData {
  config!: MRPConfig;
  readonly info: MRPInfoDocument;
  owner?: MRPUser;
  feed?: MRPFeed;
  private initialized?: Promise<void>;
  constructor(private state: MRPState, readonly url: string) {
    super(state.signal, 'relay');
    this.info = new MRPInfoDocument(state, url);
  }
  init(): Promise<void> { return this.initialized ??= this.load(); }
  private async load() {
    this.begin();
    await this.info.init();
    if (this.info.pubkey) this.owner = new MRPUser(this.state, this.info.pubkey, 'operator');
    this.config = new MRPConfig(this.state, this.url, this.info.pubkey);
    await this.config.init();
    const tasks: Promise<unknown>[] = [];
    if (this.owner) tasks.push(this.owner.init().then(() => {
      if (this.config.event.isBlockEnabled('operator-profile')) return this.owner!.fetchNotes();
    }));
    if (this.config.event.isBlockEnabled('relay-feed')) tasks.push(this.fetchRelayNotes());
    await Promise.allSettled(tasks);
    this.complete();
  }
  async fetchOwnerFeed(opts?: { relays?: string[]; filter?: Filter }) { await this.owner?.fetchNotes(opts); }
  async fetchRelayNotes() {
    this.feed ??= new MRPFeed(this.state, 'relayFeed', {
      filter: { kinds: [1], limit: 15 }, relays: [this.url], exclude: { pubkey: this.owner?.pubkey },
    });
    await this.feed.fetch();
  }
  close() { this.info.close(); }
  get feedPointers() { return this.feed?.pointers ?? {}; }
  get nip11() { return this.info; }
  get httpUrl() { const url = new URL(this.url); url.protocol = url.protocol.replace('ws', 'http'); return url; }
}
