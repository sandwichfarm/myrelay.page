import NDK from "@nostr-dev-kit/ndk";
import { Config } from "./config";

import type { EventEmitter } from 'tseep';

export class UserConfig extends Config {
  constructor($: NDK, signal: EventEmitter<any>){
    super($, signal)
    this.type = 'user'
  }
}