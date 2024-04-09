import NDK, { NDKUser, NDKKind, NDKRelayList, NDKRelaySet, type EventPointer } from '@nostr-dev-kit/ndk';
import { type NDKUserProfile, NDKRelay, type NDKEvent } from '@nostr-dev-kit/ndk';
import type { MRPState } from './MRP';
import { MRPData } from './MRPData';


export class MRPUser extends MRPData {
  private ndk: NDK;
  private $: MRPState; 
  private _user: NDKUser;
  private _follows: Set<NDKUser> | undefined;
  private _relayList: NDKRelayList | undefined;
  private _feed: NDKEvent[] = new Set();
  private _feedPointers: Record<string, EventPointer> = {}
  private _readRelays: string[] | undefined;
  private _writeRelays: string[] | undefined;

  constructor( $state: MRPState, user: string | NDKUser, slug?: string ){
    const _slug: string = slug || (typeof user === 'string' ? user : user.pubkey as string)
    super($state.signal, _slug);
    this.$ = $state;
    this.ndk = $state.ndk;
    if(typeof user === 'string') {
      this.user = this.ndk.getUser({ pubkey: user })
    } else {
      this.user = this.ndk.getUser({ pubkey: user.pubkey })
    }
  }

  async init(){
    if(!this.user) return 
    await this.setRelays()
    await this.user.fetchProfile()
    await this.fetchRelayList()
  }

  async fetchRelayList(){
    // if(!this?.pubkey)
    this.relayList = await NDKRelayList.forUser(this.pubkey, this.$.ndk)
  }

  async getFollows(){
    if(!this.user) return
    console.log('getting follows')
    this.follows = await this.user.follows()
    console.log(`got follows ${this.follows.size}`)
  }

  hasRelay(url: string): boolean {
    // if(!this?.relayList) return false
    return this?.relayList?.tags.filter( tag => tag[0] === 'r' && tag[1] === url)?.length > 0? true: false;
  }

  async fetchNotes(opts?: any){
    const relays = new NDKRelaySet(
      new Set(
        (opts?.relays || this.relays)
          .map( (relay: string) => 
            new NDKRelay(relay)
          )
        ), 
      this.$.ndk)
    if(!this?.user || !this?.relays) return
    let filter = { kinds: [1], authors: [this.pubkey as string], limit: 3 }
    if(opts?.filter) filter = {...opts.filter, ...filter }
    this._feed = Array.from(await this.ndk.fetchEvents(filter, undefined, relays))
    this._feed.sort( (a: NDKEvent, b: NDKEvent) => (b.created_at as number) - (a.created_at as number) )
    this._feed.forEach( (event: NDKEvent) => {
      this._feedPointers[event.id] = {
        id: event.id,
        relays: this.relays,
        pubkey: this.pubkey,
        kind: event.kind,
      } as EventPointer;
    })
  } 

  get photo(): string | undefined {
    return this.user?.profile?.image || this.user?.profile?.picture || this.user?.profile?.photo || undefined
  }

  hasPhoto(): boolean {
    return typeof this.photo === 'string' ? true : false;
  } 

  private set follows(follows: Set<NDKUser>){
    this._follows = follows
  }

  get follows(): Set<NDKUser> | undefined {
    return this._follows
  }

  private set relayList(relayList: NDKRelayList | undefined){
    this._relayList = relayList
  }

  get relayList(): NDKRelayList | undefined {
    return this._relayList
  }

  set user(user: NDKUser){
    this._user = user
  }

  get user(): NDKUser | undefined {
    return this._user
  }

  get profile(): NDKUserProfile | undefined{
    return this._user?.profile
  }

  get relays(): string[] | undefined {
    const read = Array.from(this.readRelays || [])
    const write = Array.from(this.writeRelays || [])
    return Array.from(new Set([ ...read, ...write]))
  }

  set readRelays(relays: string[] | undefined){
    this._readRelays = relays
  }

  get readRelays():string[]| undefined {
    return this._readRelays
  }

  set writeRelays(relays: string[] | undefined){
    this._writeRelays = relays
  }

  private async setRelays(){
    if(!this.user) return
    let relays = await NDKRelayList.forUser( this.user.pubkey, this.$.ndk )
    if(!relays) return
    this.readRelays = relays.readRelayUrls
    this.writeRelays = relays.writeRelayUrls
  }

  get writeRelays(): string[] | undefined {
    return this._writeRelays
  }

  get pubkey (): string | undefined {
    return this.user?.pubkey
  }

  get lud16(): string | undefined {
    return this.user?.profile?.lud16
  }

  get lud06(): string | undefined {
    return this.user?.profile?.lud06
  }

  get feed(): NDKEvent[] | undefined {
    return this._feed
  }

  get feedPointers(): Record<string, EventPointer> | undefined {
    return this._feedPointers
  } 
}