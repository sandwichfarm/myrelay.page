import NDK, { NDKEvent, NDKRelay, NDKRelaySet } from "@nostr-dev-kit/ndk";
import type { EventPointer } from "nostr-tools/nip19"

export class MRPFeed {
  private $: NDK; 
  private _notes: NDKEvent[] = [];
  private _pointers: Record<string, EventPointer> = {};
  private _pointerRelays: string[] = [];
  private _filter: NDKFilter; 
  private _relays: NDKRelaySet; 
  private _exclude: Record<string, string | number | boolean> | undefined = {};

  constructor(
      _$: NDK, 
      filter: Record<string, any>, 
      relays: NDKRelaySet, 
      pointerRelays?: NDKRelaySet, 
      exclude?: Record<string, string | number | boolean>
    ){
    this.$ = _$
    this.filter = filter
    this.relays = relays
    this.pointerRelays = MRPFeed.relaySetToArray(pointerRelays? pointerRelays: this.relays);
    this.exclude = exclude
  }

  async fetch(){
    //console.log('options: ', this.filter, this.relays)
    const feed = await this.$.fetchEvents(this.filter, undefined, this.relays)
    //console.log(`feed: ${feed?.size}`)
    if(!feed?.size) return 
    this.notes = Array.from(feed)
    this.notes = this.notes.sort( (a: NDKEvent, b: NDKEvent) => b.created_at as number - a.created_at as number )
    this.notes.forEach( (event: NDKEvent) => {
      this.pointer = {
        id: event.id,
        relays: this.pointerRelays,
        author: event.pubkey,
        kind: event.kind,
      } as EventPointer;
    })
    if(this.filter?.limit) this.notes.length = this.filter.limit
    for(const exclude in this.exclude){
      this.notes = this.notes.filter( (note: NDKEvent) => this.exclude[exclude] !== note[exclude] )
    }
  }

  private set pointerRelays(relays: string[]){
    this._pointerRelays = relays
  }

  get pointerRelays(): string[] {
    return this._pointerRelays
  }

  private set exclude(exclude: Record<string, string | number | boolean> | undefined){
    this._exclude = exclude
  }

  get exclude(): Record<string, string | number | boolean> | undefined {
    return this._exclude
  }

  private set notes(feed: NDKEvent[]){
    this._notes = feed
  }

  get notes(): NDKEvent[] {
    return this._notes
  }

  private set filter(filter: Record<string, any> ){
    this._filter = filter
  }

  get filter(): Record<string, any> {
    return this._filter
  } 

  private set relays(relays: NDKRelaySet){
    this._relays = relays
  }

  get relays(): NDKRelaySet {
    return this._relays
  }

  set pointer (pointer: EventPointer){
    if(pointer?.id === undefined) return
    this._pointers[pointer.id as string] = pointer
  }

  get pointers(): Record<string, EventPointer> {
    return this._pointers
  }

  static relaySetToArray(relaySet: NDKRelaySet): string[] {
    return Array.from(relaySet.relays).map(r => String(r.url))
  }

  
}