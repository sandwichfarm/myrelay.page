// import { RelayInformation } from 'nostr-tools/nip11';
import {currentOriginMatchesRelayOrigin } from '$lib/utils';

export type Limitations = {
  payment_required: boolean;
  auth_required: boolean;
  max_message_length: number;
  max_event_tags: number;
  max_subscriptions: number;
  [key: string]: any;
};

export type Fees = {
  subscription: SubscriptionFee[];
};

export type SubscriptionFee = {
  amount: number;
  unit: "msats";
  period: number;
};

export type Nip11 = {
  description?: string;
  name?: string;
  pubkey?: string;
  software?: string;
  supported_nips?: number[];
  version?: string;
  limitations?: Limitations;
  payments_url?: string;
  payment_url?: string;
  fees?: Fees;
  [key: string]: any;
}

export class MRPNip11 {
  private _url: string;
  private _json: any;
  private _description: string | undefined;
  private _name: string | undefined;
  private _pubkey: string | undefined;
  private _software: string | undefined;
  private _supported_nips: number[] | undefined;
  private _version: string | undefined;
  private _limitations: Limitations | undefined;
  private _payments_url: string | undefined;
  private _fees: Fees | undefined
  loaded: boolean = false;

  constructor(url: string){
    this.url = url
  }

  async init(){
    this._json = await this.fetch()
    this.loaded = true
    if(!this._json) return 
    this.set(this._json)
  }

  private set( nip11: Nip11 ){
    this.description = nip11.description
    this.name = nip11.name
    this.pubkey = nip11.pubkey
    this.software = nip11.software
    this.supported_nips = nip11.supported_nips
    this.version = nip11.version
    this.limitations = nip11.limitation
    this.payments_url = nip11.payments_url || nip11.payment_url
    this.fees = nip11.fees
    //console.log(nip11)
  }

  get json(): any {
    return this._json
  }

  get nips(): number[] | undefined {
    return this.supported_nips
  }

  get description(): string | undefined {
    return this._description
  }

  private set description(description: string | undefined){
    this._description = description
  }

  get name(): string | undefined {
    return this._name
  }

  private set name(name: string | undefined){
    this._name = name
  }

  get pubkey(): string | undefined {
    return this._pubkey
  }

  private set pubkey(pubkey: string | undefined){
    this._pubkey = pubkey
  }

  get software(): string | undefined {
    return this._software
  }

  private set software(software: string | undefined){
    this._software = software
  }

  get supported_nips(): number[] | undefined {
    return this._supported_nips
  }

  private set supported_nips(supported_nips: number[] | undefined){
    this._supported_nips = supported_nips
  }

  get version(): string | undefined {
    return this._version
  }

  private set version(version: string | undefined){
    this._version = version
  }

  get limitation(): Limitations | undefined {
    return this.limitations
  }

  get limitations(): Limitations | undefined {
    return this._limitations
  }

  private set limitations(limitations: Limitations | undefined){
    this._limitations = limitations
  }

  get payments_url(): string | undefined {
    return this._payments_url
  }

  private set payments_url(payments_url: string | undefined){
    this._payments_url = payments_url
  }

  get fees(): Fees | undefined {
    return this._fees
  }

  private set fees(fees: Fees | undefined){
    this._fees = fees
  }

  get isPaymentRequired(): boolean | undefined {
    return this.limitations?.payment_required as boolean | undefined
  }

  get isAuthRequired(): boolean | undefined {
    return this.limitations?.auth_required as boolean | undefined
  }

  get maxMessageLength(): number | undefined {
    return this.limitations?.max_message_length as number | undefined
  }

  get maxEventTags(): number | undefined {
    return this.limitations?.max_event_tags as number | undefined
  }

  get maxSubscriptions(): number | undefined {
    return this.limitations?.max_subscriptions as number | undefined
  }

  public nipIsSupported(nip: number): boolean | undefined {
    return this.supported_nips?.includes(nip)
  }

  private set url(url: string){
    const nip11Url = new URL(url)
    nip11Url.protocol = nip11Url.protocol === 'wss:' ? 'https:' : 'http:'
    this._url = nip11Url.toString()
  }

  private get url(): string {
    return this._url
  }

  randomHash(): string {
    let letters: string = '0123456789bcdefghjkmnpqrstuvwxyz'; 
    let hash: string = ''; 
    for (let i = 0; i < 24; i++) 
      hash += letters[(Math.floor(Math.random() * 16))]; 
    return hash;
  }

  async fetch(): Promise<Nip11 | undefined> {
    let url: string = this.url; 

    if (currentOriginMatchesRelayOrigin(url)) {
        const urlObj = new URL(url);
        url = urlObj.pathname + urlObj.search;
    }

    try {
        url = `${url}?c=${this.randomHash()}`;
        //console.log(`url: ${url}`)
        //console.log('nip-11 fetch from', url);
        const response = await fetch(url, {
            cache: "no-store",
            headers: {
                Accept: 'application/nostr+json'
            },
        }).catch(console.error);

        if (!response.ok) {
            throw new Error(`Failed to fetch data from ${url}: ${response.status} ${response.statusText}`);
        }
        
        const relayInfo = await response.json();
        return relayInfo as Nip11;
    } catch (error) {
        console.error(error);
        return undefined;
    }
  }
}



