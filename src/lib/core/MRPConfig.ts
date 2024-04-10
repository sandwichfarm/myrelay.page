import NDK, { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import type { NDKFilter } from '@nostr-dev-kit/ndk';

import type { NDKTag } from '@nostr-dev-kit/ndk';
import { AppConfig } from './kinds/app-config';
import { MRPUser } from './MRPUser';

import { MRPData } from './MRPData';
import type { MRPState } from './MRP';

export class MRPConfig extends MRPData {
  private readonly _kind: NDKKind = NDKKind.AppSpecificData;
  private _$: MRPState;
  private _operator: MRPUser;
  private _event: AppConfig | undefined;

  constructor( $state: MRPState, operator: MRPUser ){
    super($state.signal, 'config')
    this._$ = $state
    this._operator = operator
  }

  async init(){
    this.begin()
    const event = await this.fetch()
    if(typeof event === 'undefined' || event === null) return this.complete(false)
    this.event = new AppConfig(this.$.ndk, event.rawEvent())
    this.complete(true, this.event)
  }

  async fetch(): Promise<NDKEvent | null> {
    if(this.operator?.pubkey) {
      const filter: NDKFilter = {
        kinds: [this.kind],
        authors: [this.operator?.pubkey]
      }
      return this.$.ndk.fetchEvent(filter);
    }
    return null
  }

  get $(): MRPState {
    return this._$
  }

  set $(state: MRPState){
    this._$ = state
  }

  private get operator(): MRPUser {
    return this._operator
  }

  private set operator(operator: MRPUser){
    this._operator = operator
  }

  private get kind(): NDKKind {
    return this._kind
  }

  get event(): AppConfig | undefined{
    return this._event
  }

  private set event(event: AppConfig | undefined){
    this._event = event
  }

  get config(): NDKTag[] | undefined{
    return this.event?.tags
  }

  getKey(key: string): any {
    return this.event?.[key]
  }

  get componentVisible(): { [key: string]: boolean } | undefined {
    return this.event?.visible
  }
    
}