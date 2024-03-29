import NDK, {NDKNip07Signer, NDKKind, NDKEvent, NDKRelay, NDKRelaySet } from '@nostr-dev-kit/ndk';
import NDKCacheAdapterDexie from "@nostr-dev-kit/ndk-cache-dexie";

import type { NDKSigner } from '@nostr-dev-kit/ndk';

import { MRPRelay } from '../relay';
import { MRPUser } from '../user';
import { MRPMonitors } from '../monitors';


export class NDKService {
  
  private _$: NDK;
  private _user: MRPUser | undefined; 
  private _relay: MRPRelay;
  private _monitors: MRPMonitors;
  private _authed: boolean = false

  constructor(defaultRelays: Set<string>, url: string) {
    this._$ = new NDK({
      cacheAdapter: new NDKCacheAdapterDexie({ dbName: 'myrelay.page' }),
      explicitRelayUrls: Array.from(defaultRelays),
      blacklistRelayUrls: ['wss://nostr1.tunnelsats.com/', 'wss://relay.nostr.info/', 'wss://nostr-relay.wlvs.space/', 'wss://relayer.fiatjaf.com/']
    });
    this._relay = new MRPRelay(this.$, url)
    this._monitors = new MRPMonitors(this.$, url)
  }

  public async init(){
    await this.$.connect();
    await this._relay.init()
    await this.monitors.init()
  }

  get $(): NDK {
    return this._$
  }

  set $( $: NDK ){
    this._$ = $
  }

  public async login(){
    this.signer = new NDKNip07Signer();
    const user = await this.signer.user();
    this.user = new MRPUser(this.$, user);
    await this.user.init();
    await this.$.connect();
    this._authed = true;
  }

  public logout(){
    this.user = undefined
    this._authed = false
  }

  async toggleRelay(relay: string){
    if(this?.user?.hasRelay(relay)) {
      //console.log('leaving relay')
      await this.leaveRelay(relay)
    }
    else {
      //console.log('joining relay')
      await this.joinRelay(relay)
    }
  }

  async joinRelay(relay: string){ 
    if(!this?.user?.relayList) return; 
    relay = new URL(relay).toString()
    this.user.relayList.sig = undefined
    this.user.relayList.created_at = undefined 
    this.user.relayList.id = ""
    this.user.relayList.tags.push([ 'r', relay ])
    const publishToRelays = NDKRelaySet.fromRelayUrls([...(this.user.relayList.writeRelayUrls|| []), relay], this.$)
    await this.user.relayList.publish(publishToRelays)
    //console.log('joined relay')
  }

  async leaveRelay(relay: string){
    if(!this?.user?.relayList) return;
    relay = new URL(relay).toString()
    this.user.relayList.sig = undefined
    this.user.relayList.created_at = undefined 
    this.user.relayList.id = ""
    this.user.relayList.tags = this.user.relayList.tags.filter( tag => tag[1] !== relay )
    const publishToRelays = NDKRelaySet.fromRelayUrls([...(this.user.relayList.writeRelayUrls|| []), relay], this.$)
    await this.user.relayList.publish(publishToRelays)
    //console.log('left relay')
  }

  get authed(): boolean {
    return this._authed
  }



  get monitors(): MRPMonitors {
    return this._monitors
  }

  get relay(): MRPRelay | undefined {
    return this._relay
  }

  private set relay(relay: MRPRelay){
    this._relay = relay
  }

  get siteRelays(): string[] {
    return Array.from(this.siteRelaysSet)
  }

  get ownerAllRelays(): string[] | undefined {
    return this.relay?.owner?.relays
  }

  get ownerReadRelays(): string[] | undefined {
    return this.relay?.owner?.readRelays
  }

  get ownerWriteRelays(): string[] | undefined {
    return this.relay?.owner?.writeRelays
  }

  get owner(): MRPUser | undefined {
    return this.relay?.owner
  }

  get ndk(): NDK {
    return this._ndk
  }

  private set ndk(ndk: NDK){
    this._ndk = ndk
  }

  get signer(): NDKSigner | undefined {
    return this.$.signer
  }

  private set signer(signer: NDKSigner){
    this.$.signer = signer
  }

  get user(): MRPUser | undefined {
    return this._user
  }

  private set user(user: MRPUser | undefined){
    this._user = user
  }

  // public async sign (kind: NDKKind, event: NDKEvent | NostrEvent ){
  //   if(event as NostrEvent){
  //     return this.$.sign(kind, event as NostrEvent)
  //   }
  //   return this.$.sign(kind, event as NDKEvent)
  // }

  // public async publish ( event: NDKEvent ) {
  //   return this.$.publish(event as NDKEvent)
  // }

}