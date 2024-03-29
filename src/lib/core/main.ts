import { MRPEditor } from './editor'
import { MRPConfig } from './config'
import { NDKService } from './services/ndk'
import type { NDKRelay, NDKTag } from '@nostr-dev-kit/ndk';
import { ComponentLoader } from './component-loader';
import type { MRPUser } from './user';
import type { RelayMetaParsed } from './relay-meta';
import type { DD } from './geocoded';

export class MyRelayPage {
  private readonly defaultRelays: Set<string> = new Set(['wss://purplepag.es', 'wss://monitorpag.es', 'wss://relaypag.es', 'wss://history.nostr.watch'] as string[])
  private _url: string;
  private _ndk: NDKService;
  private _editor: MRPEditor;
  private _config: MRPConfig;
  private _loader: ComponentLoader;
  

  constructor(url?: string){
    this.url = url
    if(!this.url) throw new Error(`No valid URL provided/detected: ${this.url}`)
    this._ndk = new NDKService(this.defaultRelays, this.url)
    this._config = new MRPConfig(this.ndk.$, this.owner as MRPUser) 
    this._editor = new MRPEditor()
    this._loader = new ComponentLoader()
  }

  async init(){
    //console.log(`MyRelayPage: ndk: init()`)
    await this.ndk?.init()
    //console.log(`MyRelayPage: config: init()`)
    await this.config?.init()
    //console.log(`MyRelayPage: editor: init()`)
    await this._loader.init(this._config)
    //console.log(`MyRelayPage: loader: init()`)
    await this.editor?.init()
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

  get ndk (): NDKService {
    return this._ndk
  }

  get editor (): MRPEditor {
    return this._editor
  }

  get config (): MRPConfig {
    return this._config
  }

  get loader(): ComponentLoader {
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