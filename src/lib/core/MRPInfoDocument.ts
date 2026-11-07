import type { MRPState } from "./MRP";
import { MRPData } from "./MRPData";

import {currentOriginMatchesRelayOrigin } from '$lib/utils';
import { Nip11, type Nip11Json } from "./schemata/nip11";

export { MRPData } from "./MRPData";
export { Nip11 } from "./schemata/nip11";

export class MRPInfoDocument {
  loaded = false;
  private $: MRPState;
  private _url!: string;
  private initialized?: Promise<void>;
  private controller?: AbortController;
  icon?: string;

  constructor($state: MRPState, url: string) {
    this.$ = $state;
    this.url = url;
    this.slug = 'info'
    this._signal = $state.signal
  }

  init(): Promise<void> {
    return this.initialized ??= this.load();
  }

  private async load(){
    this.begin()
    await this.fetch()
      .then((json: Nip11Json | undefined) => {
        if(!json) return this.complete(false)
        this.icon = typeof json.icon === 'string' ? json.icon : undefined;
        this.set(json)
        this.loaded = true
        this.complete(true, this)
      })
      .catch( (err) => {
        this.error(err)
        this.complete(false)
      })
  }

  randomHash(): string {
    let letters: string = '0123456789bcdefghjkmnpqrstuvwxyz'; 
    let hash: string = ''; 
    for (let i = 0; i < 24; i++) 
      hash += letters[(Math.floor(Math.random() * 16))]; 
    return hash;
  }

  async fetch(): Promise<Nip11Json | undefined> {
    let url: string = this.url; 

    if (currentOriginMatchesRelayOrigin(url)) {
        const urlObj = new URL(url);
        url = urlObj.pathname + urlObj.search;
    }

    url = `${url}?c=${this.randomHash()}`;

    const controller = this.controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
    const response = await fetch(url, {
        cache: "no-store",
        signal: controller.signal,
        headers: {
            Accept: 'application/nostr+json'
        },
    });

    if (!response?.ok) {
        throw new Error(`Failed to fetch data from ${url}: ${response.status} ${response.statusText}`);
    }
    
    const relayInfo = await response.json();
    if (!relayInfo || typeof relayInfo !== 'object' || Array.isArray(relayInfo)) throw new Error('Invalid relay information');
    if (typeof relayInfo.pubkey !== 'string' || !/^[a-f0-9]{64}$/.test(relayInfo.pubkey)) delete relayInfo.pubkey;
    return relayInfo as Nip11Json;
    } finally { clearTimeout(timeout); this.controller = undefined; }
  }

  close() { this.controller?.abort(); }

  private set url(url: string){
    const nip11Url = new URL(url)
    nip11Url.protocol = nip11Url.protocol === 'wss:' ? 'https:' : 'http:'
    this._url = nip11Url.toString()
  }

  private get url(): string {
    return this._url
  }
}

export interface MRPInfoDocument extends Nip11, MRPData {}

mixin(MRPInfoDocument, [Nip11, MRPData])

function mixin(derived: any, based: any[]) {
  based.forEach((base) => {
    Object.getOwnPropertyNames(base.prototype).forEach((name) => {
      Object.defineProperty(
        derived.prototype,
        name,
        Object.getOwnPropertyDescriptor(base.prototype, name) ||
          Object.create(null)
      );
    });
  });
}