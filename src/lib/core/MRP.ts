import { MRPEditor } from './MRPEditor'
import { MRPConfig } from './MRPConfig'
import { MRPNostr } from './MRPNostr'
import { BlockLoader } from './MRPBlockLoader';
import { NostrClient } from './nostr';
import { EventEmitter } from 'tseep';
import { MRPData, MRPStage, MRPStatus } from './MRPData';

import type { MRPUser } from './MRPUser';
import type { DD } from './kinds/geocoded';

export interface MRPState {
  signal: EventEmitter<any>;
  client: NostrClient;
}

export class MyRelayPage extends MRPData {

  private _url!: string;
  private _nostr: MRPNostr;
  private _editor: MRPEditor;
  private _loader: BlockLoader | undefined;
  private _userFollowsOnRelay: MRPUser[] = []
  private initialized?: Promise<void>;
  private handlersBound = false;
  private closed = false;
  private followsGeneration = 0;
  
  public $: MRPState;

  constructor(url?: string, client = new NostrClient()){
    const signal = new EventEmitter()
    super(signal, 'root')
    this.begin()
    this.$ = { signal, client }
    this.url = url
    if(!this.url) throw new Error(`No valid URL provided/detected: ${this.url}`)
    this._nostr = new MRPNostr(this.$.signal, new Set(), this.url, this.$.client)
    this._editor = new MRPEditor()
    this.bindHandlers()
  }

  init(): Promise<void> {
    return this.initialized ??= this.initialize();
  }

  private async initialize() {
    this.begin();
    await this.nostr.init();
    await this.loader?.init();
    this.complete();
  }

  close() {
    this.closed = true;
    this.nostr.close();
    this.$.signal.removeAllListeners();
  }

  bindHandlers(){
    if (this.handlersBound) return;
    this.handlersBound = true;
    const clearFollows = () => {
      this.followsGeneration++;
      this._userFollowsOnRelay = [];
      this.changed();
    };
    this.$.signal.on('mrp:login', clearFollows);
    this.$.signal.on('mrp:logout', clearFollows);
    this.$.signal.once('config:completed', async (stage: MRPStage, status: MRPStatus) => {
      if(status === MRPStatus.Failure || typeof this._loader !== "undefined" ) return
      this._loader = new BlockLoader(this.$, this.nostr?.relay?.config as MRPConfig)
      await this.loader?.init()
    })
  }

  async getUserFollowsOnRelay() {
    const user = this.nostr.user;
    if (!user || this.closed) return;
    const generation = ++this.followsGeneration;
    const isCurrent = () => !this.closed && this.nostr.user === user && this.followsGeneration === generation;
    await user.getFollows();
    if (!isCurrent()) return;
    const follows = [...(user.follows ?? [])];
    const present = await Promise.all(follows.map(async follow => {
      await follow.fetchRelayList();
      if (!isCurrent() || !follow.hasRelay(this.url!)) return undefined;
      await follow.fetchProfile();
      return follow;
    }));
    if (!isCurrent()) return;
    this._userFollowsOnRelay = present.filter((follow): follow is MRPUser => !!follow);
    this.changed();
  }

  isEditorEnabled(): boolean {
    return this.editor?.enabled
  }
  
  get userFollowsOnRelay(): MRPUser[] | undefined {
    return this._userFollowsOnRelay
  }

  set url(url: string | undefined){
    const _url = url ? new URL(url) : new URL(window.location.href);
    if(_url.protocol !== 'wss:' && _url.protocol !== 'ws:'){
      if(_url.protocol === 'https:') _url.protocol = 'wss:';
      else if (_url.protocol === 'http:') _url.protocol = 'ws:';
      else throw new Error('Invalid relay URL');
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

  get client(): NostrClient {
    return this._nostr.client
  }

  get editor (): MRPEditor {
    return this._editor
  }

  get config (): MRPConfig | undefined {
    return this?.nostr?.relay?.config
  }

  get loader(): BlockLoader | undefined {
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
        owner: this.nostr?.relay?.owner?.pubkey,
        limitations: this.nostr?.relay?.info?.limitations,
        fees: this.nostr?.relay?.info?.fees,
        is: {
          paymentRequired: this.nostr?.relay?.info?.isPaymentRequired,
          authRequired: this.nostr?.relay?.info?.isAuthRequired
        },

      }
    }
    return {
      url: this.nostr?.relay?.url,
      ...removeUndefinedKeys(info)
    }
  }

  session(): any{
    return removeUndefinedKeys({
      user: this.nostr?.user?.pubkey,
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