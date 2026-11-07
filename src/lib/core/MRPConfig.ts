import type { Event as NostrEvent } from 'nostr-tools';
import { verifyEvent } from 'nostr-tools';
import { AppConfig, type ConfigObj } from './kinds/app-config';
import type { MRPState } from './MRP';
import { MRPData } from './MRPData';

export class MRPConfig extends MRPData {
  public event!: AppConfig;
  readonly type = 'operator';
  private initialization?: Promise<void>;
  private publishing?: Promise<boolean>;
  private pending?: { content: string; event: NostrEvent; snapshot: ConfigObj };

  constructor(
    private readonly state: MRPState,
    private readonly relay?: string,
    private readonly pubkey?: string,
  ) {
    super(state.signal, 'config');
  }

  init(): Promise<void> {
    return this.initialization ??= this.initialize();
  }

  private async initialize(): Promise<void> {
    this.begin();
    try {
      this.event = (await this.fetch()) ?? this.create();
    } catch {
      // A missing/unreachable config must never prevent the relay page loading.
      this.event = this.create();
    }
    this.complete(true);
  }

  create(): AppConfig {
    this.event = new AppConfig();
    this.event.d = this.configKey();
    this.state.signal.emit('config:created', this.event);
    return this.event;
  }

  async fetch(): Promise<AppConfig | null> {
    if (!this.pubkey || !/^[a-f0-9]{64}$/.test(this.pubkey)) return null;
    const events = await this.state.client.queryOwner(this.pubkey, {
      kinds: [30078], authors: [this.pubkey], '#d': [this.configKey()],
    }, this.relay ? [this.relay] : []);
    const event = events
      .filter(event => event.kind === 30078 && event.pubkey === this.pubkey &&
        event.tags.find(tag => tag[0] === 'd')?.[1] === this.configKey())
      .sort((a, b) => b.created_at - a.created_at || a.id.localeCompare(b.id))[0];
    if (!event) return null;
    this.event = new AppConfig(event);
    this.state.signal.emit('config:fetched', this.type, this.event);
    return this.event;
  }

  configKey(): string {
    // Keep the historical address so existing published configurations load.
    return `myrelay.page/${this.relay}operator@${this.pubkey}`;
  }

  publish(): Promise<boolean> {
    if (!this.publishing) {
      this.publishing = this.publishSnapshot().finally(() => { this.publishing = undefined; });
    }
    return this.publishing;
  }

  private async publishSnapshot(): Promise<boolean> {
    const signer = this.state.client.signer;
    if (!this.pubkey || !signer || await signer.getPublicKey() !== this.pubkey) {
      throw new Error('Only the relay operator can publish this configuration.');
    }
    if (!this.event) throw new Error('Configuration has not loaded.');
    if (this.event.id && !this.event.changed) return true;

    this.event.d = this.configKey();
    const content = this.event.pack();
    const snapshot: ConfigObj = JSON.parse(JSON.stringify(this.event.config));
    const { write } = await this.state.client.discoverRelays(this.pubkey);
    if (!write.length) throw new Error('No writable relays found in the operator relay list.');
    if (this.state.client.signer !== signer) throw new Error('Signing session changed. Please save again.');

    if (!this.pending || this.pending.content !== content) {
      // Capture content and snapshot together: a relay lookup/signing prompt can
      // remain open while the operator continues editing.
      const template = {
        kind: 30078,
        created_at: Math.max(Math.floor(Date.now() / 1000), this.event.created_at + 1, (this.pending?.event.created_at ?? 0) + 1),
        tags: this.event.tags.map(tag => [...tag]),
        content,
      };
      const signed: NostrEvent = JSON.parse(JSON.stringify(await signer.signEvent({ ...template, tags: template.tags.map(tag => [...tag]) })));
      if (signed.pubkey !== this.pubkey || signed.kind !== template.kind ||
        signed.created_at !== template.created_at || signed.content !== template.content ||
        JSON.stringify(signed.tags) !== JSON.stringify(template.tags) || !verifyEvent(signed)) {
        throw new Error('The signer returned an invalid configuration event.');
      }
      this.pending = { content, event: signed, snapshot };
    }

    const pending = this.pending;
    const currentPubkey = await signer.getPublicKey();
    if (this.state.client.signer !== signer || currentPubkey !== this.pubkey) {
      throw new Error('Signing session changed. Please save again.');
    }
    await this.state.client.publish(pending.event, write);
    this.event.id = pending.event.id;
    this.event.pubkey = pending.event.pubkey;
    this.event.created_at = pending.event.created_at;
    this.event.sig = pending.event.sig;
    this.event.commitChanges(pending.snapshot);
    this.pending = undefined;
    this.state.signal.emit('config:published', this.type, this.event);
    return true;
  }

  formatType(): string { return 'operator@myrelay.page'; }
}
