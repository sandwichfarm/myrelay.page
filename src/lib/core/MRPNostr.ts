import { verifyEvent, type NostrEvent } from 'nostr-tools';
import type { EventEmitter } from 'tseep';
import { MRPRelay } from './MRPRelay';
import { MRPUser } from './MRPUser';
import { MRPMonitors } from './MRPMonitors';
import type { MRPState } from './MRP';
import { NostrClient, normalizeRelays } from './nostr';

export class MRPNostr {
  readonly $: MRPState;
  readonly relay: MRPRelay;
  readonly monitors: MRPMonitors;
  private _user?: MRPUser;
  private initialized?: Promise<void>;
  private closed = false;
  private loggingIn?: Promise<void>;
  private authGeneration = 0;
  private mutations: Promise<void> = Promise.resolve();
  private pendingList?: { key: string; event: NostrEvent };
  constructor(signal: EventEmitter<any>, _defaultRelays: Set<string>, url: string, readonly client = new NostrClient()) {
    this.$ = { signal, client };
    this.relay = new MRPRelay(this.$, url);
    this.monitors = new MRPMonitors(this.$, url);
  }
  async connect() { /* RelayPool connects lazily for each bounded request. */ }
  init(): Promise<void> {
    return this.initialized ??= this.relay.init().then(() => { if (!this.closed) void this.monitors.init(); });
  }
  login(): Promise<void> { return this.loggingIn ??= this.authenticate().finally(() => { this.loggingIn = undefined; }); }
  private async authenticate() {
    const generation = ++this.authGeneration;
    const pubkey = await this.client.login();
    const signer = this.client.signer;
    if (generation !== this.authGeneration) { this.client.signer = undefined; return; }
    const user = new MRPUser(this.$, pubkey, 'currentUser');
    await user.init();
    if (generation !== this.authGeneration) {
      if (this.client.signer === signer) this.client.signer = undefined;
      return;
    }
    this._user = user;
    this.$.signal.emit('mrp:login');
    this.$.signal.emit('state:changed');
  }
  logout() {
    this.authGeneration++;
    this._user = undefined;
    this.client.signer = undefined;
    this.pendingList = undefined;
    this.$.signal.emit('mrp:logout');
    this.$.signal.emit('state:changed');
  }
  toggleRelay(relay: string) { return this.changeRelay(relay); }
  joinRelay(relay: string) { return this.changeRelay(relay, true); }
  leaveRelay(relay: string) { return this.changeRelay(relay, false); }
  private changeRelay(relay: string, joined?: boolean): Promise<void> {
    const generation = this.authGeneration;
    const task = this.mutations.catch(() => {}).then(() => {
      if (generation !== this.authGeneration) throw new Error('Login changed before relay update');
      return this.updateRelay(relay, joined, generation);
    });
    this.mutations = task;
    return task;
  }
  private async updateRelay(value: string, joined: boolean | undefined, generation: number) {
    const user = this.user, signer = this.signer;
    if (!user || !signer) throw new Error('Log in before changing your relays');
    const [relay] = normalizeRelays([value]);
    if (!relay) throw new Error('Invalid relay URL');
    const present = user.hasRelay(relay);
    joined ??= !present;
    if (joined === present) return;
    const assertSession = () => {
      if (generation !== this.authGeneration || this.user !== user || this.signer !== signer) throw new Error('Login changed before relay update');
    };
    if (await signer.getPublicKey() !== user.pubkey) throw new Error('Signer does not match the logged in user');
    assertSession();
    const oldTags = user.relayList?.tags ?? [];
    const tags = oldTags.filter(tag => tag[0] !== 'r' || normalizeRelays([tag[1]])[0] !== relay).map(tag => [...tag]);
    if (joined) tags.push(['r', relay]);
    const key = JSON.stringify([user.pubkey, tags]);
    const destinations = normalizeRelays([...user.writeRelays, ...(joined ? [relay] : [])]);
    if (!destinations.length) throw new Error('No writable relays available');
    if (this.pendingList?.key !== key) {
      const template = { kind: 10002, content: user.relayList?.content ?? '', tags,
        created_at: Math.max(Math.floor(Date.now() / 1000), (user.relayList?.created_at ?? 0) + 1, (this.pendingList?.event.created_at ?? 0) + 1) };
      const signed = await signer.signEvent({ ...template, tags: template.tags.map(tag => [...tag]) });
      assertSession();
      const event = JSON.parse(JSON.stringify(signed)) as NostrEvent;
      if (event.pubkey !== user.pubkey || event.kind !== template.kind || event.content !== template.content ||
          event.created_at !== template.created_at || JSON.stringify(event.tags) !== JSON.stringify(tags) || !verifyEvent(event)) {
        throw new Error('Signer returned an invalid relay list');
      }
      this.pendingList = { key, event };
    }
    const event = this.pendingList.event;
    assertSession();
    await this.client.publish(event, destinations);
    if (this.user !== user || this.signer !== signer) return;
    user.relayList = event;
    user.readRelays = normalizeRelays(tags.filter(tag => tag[0] === 'r' && (!tag[2] || tag[2] === 'read')).map(tag => tag[1]));
    user.writeRelays = normalizeRelays(tags.filter(tag => tag[0] === 'r' && (!tag[2] || tag[2] === 'write')).map(tag => tag[1]));
    this.pendingList = undefined;
    this.$.signal.emit('state:changed');
  }
  get authed() { return !!this._user; }
  get owner() { return this.relay.owner; }
  get ownerAllRelays() { return this.owner?.relays; }
  get ownerReadRelays() { return this.owner?.readRelays; }
  get ownerWriteRelays() { return this.owner?.writeRelays; }
  get siteRelays() { return normalizeRelays([this.relay.url, ...(this.ownerWriteRelays ?? [])]); }
  get signer() { return this.client.signer; }
  get user() { return this._user; }
  close() { this.closed = true; this.logout(); this.relay.close(); this.client.close(); }
}
