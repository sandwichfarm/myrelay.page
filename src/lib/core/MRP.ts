import { MRPEditor } from './MRPEditor'
import { MRPConfig } from './MRPConfig'
import { MRPNostr } from './MRPNostr'
import { BlockLoader } from './MRPBlockLoader';
import NDK, { NDKRelay, NDKRelaySet, NDKUser } from '@nostr-dev-kit/ndk';
import { EventEmitter } from 'tseep';
import { MRPData, MRPStage, MRPStatus } from './MRPData';

import type { MRPUser } from './MRPUser';
import type { DD } from './kinds/geocoded';

export interface MRPState {
  signal: EventEmitter<any>;
  ndk?: NDK;
}

export class MyRelayPage extends MRPData {
  private readonly defaultRelays: Set<string> = new Set(['wss://purplepag.es', 'wss://user.kindpag.es', 'wss://history.nostr.watch'] as string[])
  private _url: string;
  private _nostr: MRPNostr;
  private _editor: MRPEditor;
  private _config: MRPConfig;
  private _loader: BlockLoader | undefined;
  private _userFollowsOnRelay: NDKUser[] = []
  private _promises: Promise<any>[] = []

  public $: MRPState;

  constructor(url?: string){
    const signal = new EventEmitter()
    super(signal, 'root')
    this.begin()
    this.$ = { signal }
    this.url = url
    if(!this.url) throw new Error(`No valid URL provided/detected: ${this.url}`)
    this._nostr = new MRPNostr(this.$.signal, this.defaultRelays, this.url)
    this.$.ndk = this._nostr.ndk
    this._editor = new MRPEditor()
    this.bindHandlers()
  }

  async init(){
    this.bindHandlers()
    await this.nostr?.connect()
    await this.nostr?.init()
    // await this.editor?.init()
    this.$.signal.once('relay:completed', () => { this.complete() })
  }

  bindHandlers(){
    this.$.signal.once('config:completed', async (stage: MRPStage, status: MRPStatus) => {
      if(status === MRPStatus.Failure || typeof this._loader !== "undefined" ) return
      this._loader = new BlockLoader(this.$, this.nostr?.relay?.config as MRPConfig)
      await this.loader.init()
    })
  }

  async getUserFollowsOnRelay() {
    await this.nostr.user?.getFollows();
    if (!this.nostr.user?.follows) return;

    console.log(`you follow ${this.nostr.user?.follows} nostriches`)
  
    const relay = new NDKRelaySet(new Set([new NDKRelay(this.url as string)]), new NDK({explicitRelayUrls:[this.url as string]}));
    
    const promises = Array.from(this.nostr.user.follows).map(follow => {
      return this.nostr.$.ndk.fetchEvent({
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
            return tag[0] === 'r' && url === this.url
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
      .map(result => result.value.pubkey);
      
    pubkeyResults = Array.from(new Set(pubkeyResults))

    console.log(`${this.nostr.user?.follows} of them are lurking on ${this.url}`)
  
    for (const follow of this.nostr.user.follows) {
      if (!pubkeyResults.includes(follow.pubkey)) continue;
      await follow.fetchProfile();
      this._userFollowsOnRelay.push(follow);
    }
  }

  isEditorEnabled(): boolean {
    return this.editor?.enabled
  }
  
  get userFollowsOnRelay(): NDKUser[] | undefined {
    return this._userFollowsOnRelay
  }

  set url(url: string | undefined){
    const _url = url ? new URL(url) : new URL(window.location.href);
    if(_url.protocol !== 'wss:' && _url.protocol !== 'ws:'){
      if(_url.protocol === 'https:') _url.protocol = 'wss:';
      else _url.protocol = 'ws:';
    }
    _url.hash = '';
    _url.search = '';
    this._url = _url.toString();
  }

  get url(): string | undefined {
    return this._url
  }

  get owner(): MRPUser | undefined {
    return this.nostr?.relay?.owner
  }

  get dd(): DD | undefined {
    return this.nostr?.monitors?.getRelayDD()
  }

  get monitorsDD(): Record<string, DD | undefined> {
    return this.nostr?.monitors?.getMonitorsDD()
  }

  get nostr(): MRPNostr {
    return this._nostr
  }

  get ndk (): NDK {
    return this._nostr.ndk
  }

  get editor (): MRPEditor {
    return this._editor
  }

  get config (): MRPConfig | undefined {
    return this?.nostr?.relay?.config
  }

  get loader(): BlockLoader {
    return this._loader
  }

  hasInfo(): boolean{
    return this.nostr?.relay?.info ? true : false
  }

  site(): any {
    let info = {};
    if(this.hasInfo()) {
      info = {
        name: this.nostr?.relay?.info?.name,
        description: this.nostr?.relay?.info?.description,
        owner: this.nostr?.relay?.owner,
        limitations: this.nostr?.relay?.info?.limitations,
        fees: this.nostr?.relay?.info?.fees,
        is: {
          paymentRequired: this.nostr?.relay?.info?.isPaymentRequired,
          authRequired: this.nostr?.relay?.info?.isAuthRequired
        },
        limits: {
          maxFileSize: this.nostr?.relay?.info?.maxFileSize,
          maxFileCount: this.nostr?.relay?.info?.maxFileCount,
          maxFileStorage: this.nostr?.relay?.info?.maxFileStorage
        }
      }
    }
    return {
      url: this.nostr?.relay?.url,
      ...removeUndefinedKeys(info)
    }
  }

  session(): any{
    return removeUndefinedKeys({
      user: this.nostr?.user?.user,
      profile: this.nostr?.user?.profile,
      relays: this.nostr?.user?.relays
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