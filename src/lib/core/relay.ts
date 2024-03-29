import NDK, { NDKRelay, NDKRelaySet, NDKEvent } from '@nostr-dev-kit/ndk';
import { MRPNip11 } from '$lib/core/schemata/nip11';
import { MRPUser } from './user';

import type { EventPointer } from 'nostr-tools/nip19';
import { MRPFeed } from './feed';

export class MRPRelay {
  private $: NDK;
  private _url: string;
  private _info: MRPNip11 | undefined;
  private _owner: MRPUser | undefined;
  private _relayFeed: MRPFeed;
  private _feedPointers: Record<string, EventPointer>
  private _favicon: string | ArrayBuffer | null | undefined;

  constructor(_$: NDK, url: string){
    //console.log(`MRPRelay: constructor(): ${url}`)
    this.$ = _$
    this.url = url
    this._info = new MRPNip11(this.url)
  }

  public async init(){
    await this.info?.init()
    if(!this.info?.pubkey) return
    this.owner = new MRPUser(this.$, this.info.pubkey)
    await this.owner.init()
    await this.fetchRelayNotes()
  }

  async fetchOwnerFeed(opts: any){
    await this.owner?.fetchNotes(opts)
  }

  async fetchRelayNotes(){
    const exclude = { pubkey: this.owner?.pubkey as string }
    const relays: NDKRelaySet = new NDKRelaySet(new Set([new NDKRelay(this.url as string)]), this.$, exclude)
    const $feed: MRPFeed = new MRPFeed(this.$, { kinds: [1], limit: 10 }, relays, relays)
    await $feed.fetch()
    this._relayFeed = $feed
    this._feedPointers = $feed.pointers
    // const relay = new NDKRelaySet(new Set([new NDKRelay(this.url as string)]), this.$)
    // this._relayFeed = await this.$.fetchEvents({ kinds: [1], limit: 20 }, undefined, relay)
  }

  get feedPointers(): Record<string, EventPointer> {
    return this._feedPointers
  }

  get feed(): MRPFeed {
    return this._relayFeed
  }

  subscribeRelayNotes(){
    this.$.subscribe({ kinds: [1] }, undefined, new NDKRelaySet(new Set([new NDKRelay(this.url as string)]), this.$))
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