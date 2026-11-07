import { GeoCodedEvent } from './geocoded';

export class RelayDiscovery extends GeoCodedEvent {
  get url() { return this.tagValue('d'); }
  get rttOpen() { return this.rtt('rtt-open'); }
  get rttRead() { return this.rtt('rtt-read'); }
  get rttWrite() { return this.rtt('rtt-write'); }
  private rtt(name: string) {
    const value = this.tagValue(name);
    if (value === undefined) return undefined;
    const rtt = Number(value);
    return Number.isFinite(rtt) && rtt >= 0 ? rtt : undefined;
  }
}
