import type { MRPState } from "$lib/core/MRP";
import { MRPData } from "$lib/core/MRPData";
import { Nip11, type Nip11Json } from "$lib/core/schemata/nip11";
import {currentOriginMatchesRelayOrigin } from '$lib/utils';

export { MRPData } from "$lib/core/MRPData";
export { Nip11 } from "$lib/core/schemata/Nip11";

export class MRPInfoDocument {
  private $: MRPState;
  private _url: string;

  constructor($state: MRPState, url: string) {
    this.$ = $state;
    this.url = url;
    this.slug = 'info'
  }

  async init(){
    this.begin()
    await this.fetch()
      .then((json: Nip11Json | undefined) => {
        if(!json) return this.complete(false)
        this.set(json)
        console.log('wtf', this)
        this.complete(true, this)
      })
      .catch( (err) => {
        console.log('got here')
        this.error(err)
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

    const response = await fetch(url, {
        cache: "no-store",
        headers: {
            Accept: 'application/nostr+json'
        },
    });

    if (!response?.ok) {
        throw new Error(`Failed to fetch data from ${url}: ${response.status} ${response.statusText}`);
    }
    
    const relayInfo = await response.json();
    return relayInfo as Nip11Json;
  }

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