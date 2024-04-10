/*
 vars
  type  
  kind 
  frequency
 load: 
 get
 publish
 update
*/

import NDK, { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk";
import { AppConfig } from "../kinds/app-config";

import type { EventEmitter } from 'tseep';
import { MRPState } from "../MRP";
 
export class Config {

  private readonly kind: NDKKind.AppSpecificData;
  private readonly namespace: `myrelay.page`;

  private _$: MRPState;
  private _type: string; //operator, user 
  private _event: AppConfig | null;
  private _data: any; 
  private _pubkey: string | undefined;

  constructor($state: MRPState, pubkey?: string){
    this._$ = $state
    this._pubkey = pubkey
  }

  create(){
    if(this?.event) return 
    if(!this.$?.ndk) return
    this.event = new AppConfig(this.$.ndk)
    this.$.signal.emit('config:created', this.event)
  }

  async fetch(): Promise<AppConfig | null> {
    if(!this.$?.ndk) return null
    const config: AppConfig | null = (await this.$.ndk.fetchEvent({ kinds: [this.kind], authors: [this.pubkey] })) as AppConfig
    if(config === null) return null
    this.event = new AppConfig(this.$.ndk, config?.rawEvent())
    this.$.signal.emit(`config:fetched`, this.type, this.event)
    return this.event
  }

  update(key: string, config: Record<string, any>): boolean{
    if(!this?.event) return false
    this.data[key] = config;
    this.event.set(key, this.data[key])
    this.$.signal.emit(`config:updated`, this.type, key, this.event)
    return true
  }

  async publish(): Promise<boolean> {
    let error = false;
    await this.event?.publish().catch((err) => error=true)
    if(!error){
      this.$.signal.emit(`config:published`, this.type, this.event)
    }
    return error
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

  get event(): AppConfig | null {
    return this._event
  }

  private set event(event: AppConfig){
    this._event = event
  }

  private get $(): MRPState{
    return this._$
  }

  private set $($: MRPState){
    this._$ = $
  }

  get data(){
    return this._data
  }

  private set data(data: any){
    this._data = data
  }

  get pubkey(): string | undefined{
    return this._pubkey
  }

  private set pubkey(pubkey: string){
    this._pubkey = pubkey
  }
}