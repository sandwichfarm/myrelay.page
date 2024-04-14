import NDK, { NDKEvent, NDKKind, NDKRelaySet, NDKSubscription } from "@nostr-dev-kit/ndk";
import { AppConfig } from "./kinds/app-config";

import type { EventEmitter } from 'tseep';
import type { MRPState } from "./MRP";
import { MRPData } from "./MRPData";
import { MRPUser } from "./MRPUser";
import { GalleryThumbnailsIcon, TheaterIcon } from "lucide-svelte";
 
export class MRPConfig extends MRPData {

  private readonly namespace: `myrelay.page`;

  private _$: MRPState;
  private _type: string; //operator, user 
  private pubkey: string | undefined;
  private relay: string | undefined
  private _changed: boolean = false;
  private _configHash: string | undefined;
  
  public event: AppConfig;

  constructor($state: MRPState, relay?: string, operatorPubkey?: string){
    super($state.signal, 'config')
    this._$ = $state
    this.pubkey = operatorPubkey
    this.relay = relay
  }

  async init(){
    this.begin()
    let result: AppConfig | null = null;
    result = await this.fetch()
    if(this.event == null) result = this.create()
    this.event = result as AppConfig
    this.complete(true)
  }

  create(): AppConfig {
    this.event = new AppConfig(this.$.ndk as NDK)
    this.$.signal.emit('config:created', this.event)
    this.event.d = this.configKey()
    return this.event
  }

  async fetch(): Promise<AppConfig | null> {
    if(!this.$?.ndk) return null
    if(!this.pubkey) return null  
    const config: AppConfig | null = 
      (await this.$.ndk
        .fetchEvent(
          { kinds: [NDKKind.AppSpecificData], authors: [this.pubkey], '#d': [this.configKey()] },
          undefined,
          this.relay? NDKRelaySet.fromRelayUrls(['wss://appdata.kindpag.es', this.relay], this.$.ndk): undefined
        )
      ) as AppConfig
    if(config === null) return null
    this.event = new AppConfig(this.$.ndk, config?.rawEvent())
    this.$.signal.emit(`config:fetched`, this.type, this.event)
    return this.event
  }

  configKey(): string {
    return `myrelay.page/${this?.relay}operator@${this.pubkey}`
  }

  async publish(): Promise<boolean> {
    let error = false;
    this.event.d = this.configKey()
    this.event.created_at = undefined 
    this.event.sig = undefined
    this.event.id = ""
    await this.event?.publish(NDKRelaySet.fromRelayUrls(['wss://appdata.kindpag.es'], this.$.ndk as NDK)).catch((err) => { throw new Error(err) })
    if(!error){
      this.$.signal.emit(`config:published`, this.type, this.event)
      this.event.commitChanges()
    }
    return !error
  }

  formatType(): string {
    return `${this.type.toLowerCase()}@${this.namespace}`.toLowerCase()
  }
  
  get type(){
    return this._type
  }

  protected set type(type: string){
    this._type = type
  }

  private get $(): MRPState{
    return this._$
  }

  private set $($: MRPState){
    this._$ = $
  }


}