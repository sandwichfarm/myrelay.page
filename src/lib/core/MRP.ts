import { MRPEditor } from './MRPEditor'
import { MRPConfig } from './MRPConfig'
import { MRPNostr } from './MRPNostr'
import NDK, { NDKRelay, NDKRelaySet, NDKUser, type NDKTag } from '@nostr-dev-kit/ndk';
// import type { NDK } from '@nostr-dev-kit/ndk';
import { BlockLoader } from './MRPBlockLoader';
import type { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk';
import type { MRPUser } from './MRPUser';
import type { RelayMetaParsed } from './kinds/relay-meta';
import type { DD } from './kinds/geocoded';
import { MRPFeed } from './MRPFeed';

import { EventEmitter } from 'tseep';

export interface MRPState {
  signal: EventEmitter<any>;
  ndk?: NDK;
}

export class MyRelayPage {
  private readonly defaultRelays: Set<string> = new Set(['wss://monitorpag.es', 'wss://relaypag.es', 'wss://history.nostr.watch'] as string[])
  private _url: string;
  private _ndk: MRPNostr;
  private _editor: MRPEditor;
  private _config: MRPConfig;
  private _loader: BlockLoader;
  private _userFollowsOnRelay: NDKUser[] = []
  private _promises: Promise<any>[] = []

  public $: MRPState = { signal: new EventEmitter() }

  constructor(url?: string){
    this.url = url
    if(!this.url) throw new Error(`No valid URL provided/detected: ${this.url}`)
    this._ndk = new MRPNostr(this.$.signal, this.defaultRelays, this.url)
    this.$.ndk = this._ndk.ndk
    this._config = new MRPConfig(this.$, this.owner as MRPUser) 
    this._editor = new MRPEditor()
    this._loader = new BlockLoader(this.$, this._config)
  }

  async init(){
    await this.ndk?.connect()
    await this.config?.init()
    await this.loader.init()
    await this.ndk?.init()
    await this.editor?.init()
    this.bindHandlers()
  }

  bindHandlers(){
    // this.ndk?.$.once("mrp:login", async () => {
    //   await this.userFollowsOnRelay(this.ndk?.$)
    // });
  }

  async getUserFollowsOnRelay() {
    await this.ndk.user?.getFollows();
    if (!this.ndk.user?.follows) return;
  
    const relay = new NDKRelaySet(new Set([new NDKRelay(this.url as string)]), new NDK({explicitRelayUrls:[this.url as string]}));
    
    const promises = Array.from(this.ndk.user.follows).map(follow => {
      return this.ndk.$.ndk.fetchEvent({
        kinds: [10002, 3],
        authors: [follow.pubkey]
      }, { groupable: true, closeOnEose: false });
    }, relay);
  
    const results = await Promise.allSettled(promises);
    
    let pubkeyResults = results
      .filter( result => result.value !== null)
      .filter( ( result) => {
        if(result.value.kind === 10002) {
          try {
          return result?.value?.tags.find(tag => {
            const url = new URL(tag[1]).toString()
            const includes = url === this.url
            return tag[0] === 'r' && includes
          })
        }
        catch(e){ return false }
        }
        if(result.value.kind === 3 && result.value.content.length > 0){
          try {
            const json = JSON.parse(result.value.content)
            return Object.keys(json).find(key => {
              const url = new URL(key).toString()
              return url === this.url
            })
          }
          catch(e){ return false }
        } 
      })
      .map(result => result.value.pubkey); // Assuming `result.value` is the Set<NDKEvent>.
      
    pubkeyResults = Array.from(new Set(pubkeyResults))
  
    for (const follow of this.ndk.user.follows) {
      if (!pubkeyResults.includes(follow.pubkey)) continue;
      await follow.fetchProfile();
      this._userFollowsOnRelay.push(follow);
    }
  }
  
  get userFollowsOnRelay(): NDKUser[] | undefined {
    return this._userFollowsOnRelay
  }

  set url(url: string | undefined){
    const _url = url? new URL(url): new URL(window.location.href)
    if(_url.protocol !== 'wss:' && _url.protocol !== 'ws:'){
      if(_url.protocol === 'https:') _url.protocol = 'wss:'
      else _url.protocol = 'ws:'
    }
    this._url = _url.toString()
  }

  get url(): string | undefined {
    return this._url
  }

  get owner(): MRPUser | undefined {
    return this.ndk?.relay?.owner
  }

  get dd(): DD | undefined {
    return this.ndk?.monitors?.getRelayDD()
  }

  get monitorsDD(): Record<string, DD | undefined> {
    return this.ndk?.monitors?.getMonitorsDD()
  }

  get ndk (): MRPNostr {
    return this._ndk
  }

  get editor (): MRPEditor {
    return this._editor
  }

  get config (): MRPConfig {
    return this._config
  }

  get loader(): BlockLoader {
    return this._loader
  }

  hasInfo(): boolean{
    return this.ndk?.relay?.info ? true : false
  }

  site(): any {
    let info = {};
    if(this.hasInfo()) {
      info = {
        name: this.ndk?.relay?.info?.name,
        description: this.ndk?.relay?.info?.description,
        owner: this.ndk?.relay?.owner,
        limitations: this.ndk?.relay?.info?.limitations,
        fees: this.ndk?.relay?.info?.fees,
        is: {
          paymentRequired: this.ndk?.relay?.info?.isPaymentRequired,
          authRequired: this.ndk?.relay?.info?.isAuthRequired
        },
        limits: {
          maxFileSize: this.ndk?.relay?.info?.maxFileSize,
          maxFileCount: this.ndk?.relay?.info?.maxFileCount,
          maxFileStorage: this.ndk?.relay?.info?.maxFileStorage
        }
      }
    }
    return {
      url: this.ndk?.relay?.url,
      ...removeUndefinedKeys(info)
    }
  }

  session(): any{
    return removeUndefinedKeys({
      user: this.ndk?.user?.user,
      profile: this.ndk?.user?.profile,
      relays: this.ndk?.user?.relays
    })
  }

  siteConfig(){
    return {}
  }
}

const removeUndefinedKeys = (obj: Record<string, any>): Record<string, any> => {
  for (const key in obj) {
      if (obj[key] === undefined) {
          delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          obj[key] = removeUndefinedKeys(obj[key]);
      }
  }
  return obj;
}