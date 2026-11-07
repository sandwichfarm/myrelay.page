import { RelayDiscovery } from './kinds/relay-discovery';
import { RelayMonitor } from './kinds/monitor';
import type { DD } from './kinds/geocoded';
import type { MRPState } from './MRP';
import { MRPData } from './MRPData';
import { MRPUser, type UserProfile } from './MRPUser';

export class MRPMonitors extends MRPData {
  private readonly relays = ['wss://history.nostr.watch', 'wss://relay.nostr.watch'];
  private initialized?: Promise<void>;
  readonly operators: Record<string, UserProfile> = {};
  readonly relayDiscovery: Record<string, RelayDiscovery[]> = {};
  readonly monitorEvents = new Set<RelayMonitor>();
  constructor(private state: MRPState, private url: string) { super(state.signal, 'monitors'); }
  init(): Promise<void> { return this.initialized ??= this.load(); }
  private async load() {
    this.begin();
    try {
      const events = await this.state.client.query({ kinds: [30166], '#d': [this.url], since: Math.floor(Date.now() / 1000) - 21600 }, this.relays);
      for (const event of events) (this.relayDiscovery[event.pubkey] ??= []).push(new RelayDiscovery(event));
      const authors = Object.keys(this.relayDiscovery);
      if (authors.length) {
        const monitors = await this.state.client.query({ kinds: [10166], authors }, this.relays);
        await Promise.all(monitors.map(async event => {
          const monitor = new RelayMonitor(event);
          this.monitorEvents.add(monitor);
          const profile = new MRPUser(this.state, monitor.pubkey);
          monitor.profile = await profile.fetchProfile().catch(() => undefined);
          if (monitor.operator && /^[a-f0-9]{64}$/.test(monitor.operator)) {
            const operator = new MRPUser(this.state, monitor.operator);
            const metadata = await operator.fetchProfile().catch(() => undefined);
            if (metadata) this.operators[monitor.operator] = metadata;
          }
        }));
      }
      this.complete();
    } catch (error) { this.error(error as Error); this.complete(false); }
  }
  getRelayDD(): DD | undefined { return this.getAllRelayDiscovery().find(event => event.dd)?.dd; }
  getMonitorsDD(): Record<string, DD> {
    return Object.fromEntries(this.all.filter(monitor => monitor.dd).map(monitor => [monitor.pubkey, monitor.dd!]));
  }
  discoveryEventsFor(pubkey: string) { return this.relayDiscovery[pubkey]; }
  countMonitors() { return this.monitorEvents.size; }
  getAllRelayDiscovery() { return Object.values(this.relayDiscovery).flat(); }
  get all() { return [...this.monitorEvents]; }
}
