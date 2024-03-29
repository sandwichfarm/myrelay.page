import NDK, { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import type { NDKFilter } from '@nostr-dev-kit/ndk';

import type { NDKTag } from '@nostr-dev-kit/ndk';
import { AppConfig } from './kinds/app-config';
import { MRPUser } from './user';

export class MRPConfig {
  private readonly _kind: NDKKind = NDKKind.AppSpecificData;
  private _$: NDK;
  private _operator: MRPUser;
  private _event: AppConfig | undefined;

  constructor( $: NDK, operator: MRPUser ){
    this._$ = $
    this._operator = operator
  }

  async init(){
    const event = await this.fetch()
    if(typeof event === 'undefined' || event === null) return 
    this.event = new AppConfig(this.$, event.rawEvent())
  }

  async fetch(): Promise<NDKEvent | null> {
    if(this.operator?.pubkey) {
      const filter: NDKFilter = {
        kinds: [this.kind],
        authors: [this.operator?.pubkey]
      }
      return this.$.fetchEvent(filter);
    }
    return null
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

  private get $(): NDK {
    return this._$
  }

  private set $( $: NDK ){
    this._$ = $
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