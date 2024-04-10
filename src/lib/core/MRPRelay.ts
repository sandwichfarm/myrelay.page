import NDK, { NDKRelay, NDKRelaySet, NDKEvent } from '@nostr-dev-kit/ndk';
import { Nip11, type Nip11Json } from '$lib/core/schemata/nip11';
import { MRPUser } from './MRPUser';

import type { EventPointer } from 'nostr-tools/nip19';
import { MRPFeed, type MRPFeedOptions } from './MRPFeed';
import type { MRPState } from './MRP';
import { MRPData, MRPStage, MRPStatus } from './MRPData';
import { MRPInfoDocument } from './MRPInfoDocument';
import { EventEmitter } from 'tseep';

export class MRPRelay extends MRPData {
  private $: MRPState;
  private _url: string;
  private _info: MRPNip11 | undefined;
  private _owner: MRPUser | undefined;
  private _relayFeed: MRPFeed;
  private _feedPointers: Record<string, EventPointer>
  private _favicon: string | ArrayBuffer | null | undefined;

  constructor($state: MRPState, url: string){
    super($state.signal, 'relay')
    this.$ = $state
    this.url = url
    this._info = new MRPInfoDocument(this.$, this.url)
  }

  public async init(){
    this.$.signal.on('info:completed', async (stage: MRPStage, status: MRPStatus) => {
      if(status === MRPStatus.Failure ) return
      this.owner = new MRPUser(this.$, this.info.pubkey, 'operator')
      await this.owner.init()
      await this.owner.fetchNotes()
    })
    this.info?.init()
    this.fetchRelayNotes()
  }

  async fetchOwnerFeed(opts: any){
    await this.owner?.fetchNotes(opts)
  }

  async fetchRelayNotes(){
    const exclude = { pubkey: this.owner?.pubkey as string }
    const relays: NDKRelaySet = new NDKRelaySet(new Set([new NDKRelay(this.url as string)]), this.$.ndk)
    const feedOptions: MRPFeedOptions = { 
      filter: { kinds: [1], limit: 10 },
      relays, 
      pointerRelays: relays, 
      exclude
    }
    const $feed: MRPFeed = new MRPFeed(this.$, 'relayNotes', feedOptions)
    await $feed.fetch()
    this._relayFeed = $feed
    this._feedPointers = $feed.pointers
  }

  get feedPointers(): Record<string, EventPointer> {
    return this._feedPointers
  }

  get feed(): MRPFeed {
    return this._relayFeed
  }

  subscribeRelayNotes(){
    const relaySet = new NDKRelaySet(new Set([new NDKRelay(this.url as string)]), this.$.ndk)
    this.$.ndk.subscribe({ kinds: [1] }, undefined, relaySet)
  }

  get httpUrl(): URL {
    const url = new URL(this.url || "");
    url.protocol = url.protocol.replace('ws', 'http');
    return url
  }

  async faviconExists(): Promise<boolean> {
    if(!this?.url) return false
    try {

      const faviconUrl = `${this.httpUrl.origin}/favicon.ico`;
      const response = await fetch(faviconUrl);
  
      return response.status === 200;
    } catch (error) {
      console.error("Error checking favicon:", error);
      return false;
    }
  }

  async imageEncodeBase64(url: string): Promise<string | ArrayBuffer | null> {
    const response = await fetch(url)
    const blob = await response.blob()
    const encoded: string | ArrayBuffer | null = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    return encoded;
  }

  async setFavicon(): Promise<string | undefined> {
    if(!this.faviconExists()) return 
    this._favicon = await this.imageEncodeBase64(`${this.httpUrl.origin}/favicon.ico`)
  }

  private set url (url: string){
    this._url = url
  }

  get url () : string | undefined {
    return this._url
  }

  get info() : MRPNip11 | undefined {
    return this._info
  }

  get nip11() : MRPNip11 | undefined{
    return this._info
  }

  private set owner(owner: MRPUser){
    this._owner = owner
  }

  get owner() : MRPUser | undefined{
    return this._owner
  }
  
}