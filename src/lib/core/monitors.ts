import NDK, { NDKRelaySet, type NDKEvent, NDKRelay, type NDKUserProfile, NDKUser } from "@nostr-dev-kit/ndk";
import { RelayMonitor } from "./monitor";
import { RelayMeta } from "./relay-meta";
import { RelayDiscovery } from "./relay-discovery";
import type { RelayMetaParsed } from "./relay-meta";
import type { DD } from "./geocoded"; 

type RelayMetaDictionary = Record<string, RelayMeta[]>
type RelayDiscoveryDictionary = Record<string, RelayDiscovery[]>

export class MRPMonitors {
  private readonly monitorEventRelays: string[] = ['wss://history.nostr.watch', 'wss://monitorpag.es']
  private readonly livenessThreshold: number = Math.round(Date.now()/1000)-60*60*2

  private $: NDK;
  private relaySet: NDKRelaySet;
  private _monitors: Set<RelayMonitor> = new Set();
  private _monitorEvents: Set<NDKEvent> = new Set();
  private _relayMeta: RelayMetaDictionary = {};
  private _relayDiscovery: RelayDiscoveryDictionary = {};
  private _operators: Record<string, NDKUserProfile> = {};
  private _url: string; 

  constructor(ndk: NDK, url: string){
    this.$ = ndk 
    this._url = url 
    this.relaySet = new NDKRelaySet(new Set(this.monitorEventRelays.map((relay: string) => new NDKRelay(relay))), this.$)
  }

  async init(){
    const metaEvents = await this.$.fetchEvents({ kinds: [30066], "#d": [new URL(this._url).toString()], since: this.livenessThreshold }, null, this.relaySet)
    const dedupedMetaEvents = new Set(Array.from(metaEvents).map((event: NDKEvent) => new RelayMeta(this.$, event.rawEvent())))
    Array.from(dedupedMetaEvents).forEach((event: RelayMeta) => {
      if(!this._relayMeta[event.pubkey]){
        this._relayMeta[event.pubkey] = []
      }
      this._relayMeta[event.pubkey].push(event)
    })

    const discoveryEvents = await this.$.fetchEvents({ kinds: [30166], "#d": [new URL(this._url).toString()], since: this.livenessThreshold }, null, this.relaySet)
    const dedupedDiscoveryEvents = new Set(Array.from(discoveryEvents).map((event: NDKEvent) => new RelayDiscovery(this.$, event.rawEvent())))
    Array.from(dedupedDiscoveryEvents).forEach((event: RelayDiscovery) => {
      if(!this._relayDiscovery[event.pubkey]){
        this._relayDiscovery[event.pubkey] = []
      }
      this._relayDiscovery[event.pubkey].push(event)
    })

    const authors = Array.from(new Set(this.getAllRelayMeta().map((event: NDKEvent) => event.pubkey) ))
    ////console.log(`authors: ${authors}`)
    
    const monitorEvents = await this.$.fetchEvents({ kinds: [10166], authors }, null, this.relaySet)

    const operators = new Set()

    for await ( const event of monitorEvents) {
      const monitor: RelayMonitor = new RelayMonitor(this.$, event.rawEvent())
      await monitor.init()
      this._monitors.add(monitor)
      operators.add(monitor.operator)
    }

    Array.from(operators).forEach(async (operator) => {
      ////console.log(`operator: ${operator}`)
      const profile: NDKUserProfile | null = await this.$.getUser({ pubkey: operator as string }).fetchProfile()
      if(!profile) return 
      this._operators[operator as string] = profile
    })
    
  } 

  getRtt(): RelayMetaParsed | undefined {  
    let rtt: RelayMetaParsed | undefined;
    for (const event of this.getAllRelayMeta()) {
      if(rtt) break
      rtt = event?.rtt
    }
    return rtt
  }

  getRelayDD() {
    let dd: DD | undefined;
    for (const event of this.getAllRelayDiscovery()) {
      if(dd) break
      if(!event?.dd) continue
      dd = event.dd
    }
    return dd
  }

  getMonitorsDD() {
    let dd: Record<string, DD | undefined> = {};
    for (const event of Array.from(this._monitors)) {
      ////console.log(event.pubkey, event.dd)  
      dd[event.pubkey] = event.dd
    }
    Object.entries(dd).forEach(([pubkey, dd]) => {
      if(typeof dd === 'undefined') delete dd?.[pubkey]
    })
    return dd
  }

  metaEventsFor(pubkey: string): RelayMeta[] | undefined {
    return this._relayMeta[pubkey]
  }

  discoveryEventsFor(pubkey: string): RelayDiscovery[] | undefined {
    return this._relayDiscovery[pubkey]
  }

  countMonitors(): number{
    return this._monitors.size
  }

  getAllRelayMeta(): RelayMeta[] {
    let result: RelayMeta[] = []
    Object.keys(this._relayMeta).forEach((key) => {
      result = result.concat(Array.from(this._relayMeta[key]))
    })
    return result
  }

  getAllRelayDiscovery(): RelayDiscovery[] {
    let result: RelayDiscovery[] = []
    Object.keys(this._relayDiscovery).forEach((key) => {
      result = result.concat(Array.from(this._relayDiscovery[key]))
    })
    return result
  }

  countReports(): number {
    return this.getAllRelayMeta().length
  }

  get operators(): Record<string, NDKUserProfile> {
    return this._operators
  }

  get all(): RelayMonitor[] {
    console.log('monitorsA', this._monitors)
    return Array.from(this._monitors)
  }

  get monitorEvents(): Set<RelayMonitor> {
    return this._monitors
  }

  get relayMetaEvents(): RelayMetaDictionary {
    return this._relayMeta
  }

  get relayDiscovery(): RelayDiscoveryDictionary {
    return this._relayDiscovery
  }
}