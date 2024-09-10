import NDK, { NDKRelaySet, type NDKEvent, NDKRelay, type NDKUserProfile, NDKUser } from "@nostr-dev-kit/ndk";
import { RelayMonitor } from "./kinds/monitor";
import { RelayDiscovery } from "./kinds/relay-discovery";
import type { DD } from "./kinds/geocoded"; 
import type { MRPState } from "./MRP";
import { MRPData } from "./MRPData";

type RelayDiscoveryDictionary = Record<string, RelayDiscovery[]>

export class MRPMonitors extends MRPData {
  private readonly monitorEventRelays: string[] = ['wss://history.nostr.watch', 'wss://relaypag.es', 'wss://relay.nostr.watch']
  private readonly livenessThreshold: number = Math.round(Date.now()/1000)-60*60*6

  private ndk: NDK;
  private $: MRPState;
  private relaySet: NDKRelaySet;
  private _monitors: Set<RelayMonitor> = new Set();
  private _monitorEvents: Set<NDKEvent> = new Set();
  public _relayDiscovery: RelayDiscoveryDictionary = {};
  private _operators: Record<string, NDKUserProfile> = {};
  private _url: string; 

  constructor($state: MRPState, url: string){
    super($state.signal, 'monitors')
    this.$ = $state;
    this._url = url;
    if(!$state?.ndk) return
    this.relaySet = new NDKRelaySet(new Set(this.monitorEventRelays.map((relay: string) => new NDKRelay(relay))), $state.ndk)
  }

  async init(){
    this.begin()

    const discoveryEvents = await this?.$?.ndk?.fetchEvents({ kinds: [30166], "#d": [new URL(this._url).toString()], since: this.livenessThreshold }, null, this.relaySet).catch( err => this.error(err) )
    const dedupedDiscoveryEvents = new Set(Array.from(discoveryEvents).map((event: NDKEvent) => new RelayDiscovery(this.$.ndk, event.rawEvent())))
    Array.from(dedupedDiscoveryEvents).forEach((event: RelayDiscovery) => {
      if(!this._relayDiscovery[event.pubkey]){
        this._relayDiscovery[event.pubkey] = []
      }
      this._relayDiscovery[event.pubkey].push(event)
    })

    const authors = Array.from(new Set(this.getAllRelayDiscovery().map((event: NDKEvent) => event.pubkey) ))
    
    const monitorEvents: Set<NDKEvent> | void = await this.$.ndk.fetchEvents({ kinds: [10166], authors }, null, this.relaySet).catch( err => this.error(err) )

    if(!monitorEvents) return this.complete(false)

    const operators = new Set()

    for await ( const event of monitorEvents) {
      const monitor: RelayMonitor = new RelayMonitor(this.$.ndk, event.rawEvent())
      await monitor.init()
      this._monitors.add(monitor)
      operators.add(monitor.operator)
    }

    Array.from(operators).forEach(async (operator) => {
      const profile: NDKUserProfile | null = await this.$.ndk.getUser({ pubkey: operator as string }).fetchProfile()
      if(!profile) return 
      this._operators[operator as string] = profile
    })

    if(!this.isError) this.complete(true)
  } 

  getRelayDD() {
    let dd: DD | undefined;
    for (const event of this.getAllRelayDiscovery()) {
      if(!event?.dd) continue
      dd = event.dd
      if(dd) break
    }
    return dd
  }

  getMonitorsDD() {
    let dd: Record<string, DD | undefined> = {};
    for (const event of Array.from(this._monitors)) {
      dd[event.pubkey] = event.dd
    }
    Object.entries(dd).forEach(([pubkey, dd]) => {
      if(typeof dd === 'undefined') delete dd?.[pubkey]
    })
    return dd
  }

  discoveryEventsFor(pubkey: string): RelayDiscovery[] | undefined {
    return this._relayDiscovery[pubkey]
  }

  countMonitors(): number{
    return this._monitors.size
  }

  getAllRelayDiscovery(): RelayDiscovery[] {
    let result: RelayDiscovery[] = []
    Object.keys(this._relayDiscovery).forEach((key) => {
      result = result.concat(Array.from(this._relayDiscovery[key]))
    })
    return result
  }

  get operators(): Record<string, NDKUserProfile> {
    return this._operators
  }

  get all(): RelayMonitor[] {
    return Array.from(this._monitors)
  }

  get monitorEvents(): Set<RelayMonitor> {
    return this._monitors
  }


  get relayDiscovery(): RelayDiscoveryDictionary {
    return this._relayDiscovery
  }
}