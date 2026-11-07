import type { NostrEvent } from 'nostr-tools';

export type DD = { lat: number; lon: number };
const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';

/** Read-only projection of the geographic tags used by monitor events. */
export class GeoCodedEvent {
  constructor(readonly event: NostrEvent) {}
  get pubkey() { return this.event.pubkey; }
  get tags() { return this.event.tags; }
  protected tagValue(name: string) { return this.tags.find(tag => tag[0] === name)?.[1]; }
  get geohash(): string | undefined {
    return this.tags.filter(tag => tag[0] === 'g' && (!tag[2] || ['gh', 'geohash'].includes(tag[2])))
      .map(tag => tag[1]).filter(value => /^[0-9bcdefghjkmnpqrstuvwxyz]{1,12}$/.test(value))
      .sort((a, b) => b.length - a.length)[0];
  }
  get dd(): DD | undefined {
    const latTag = this.tags.find(tag => tag[0] === 'g' && tag[2] === 'lat')?.[1];
    const lonTag = this.tags.find(tag => tag[0] === 'g' && tag[2] === 'lon')?.[1];
    if (latTag !== undefined && lonTag !== undefined && latTag.trim() && lonTag.trim()) {
      const lat = Number(latTag), lon = Number(lonTag);
      if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) return { lat, lon };
    }
    if (!this.geohash) return undefined;
    const ranges = [[-180, 180], [-90, 90]];
    let axis = 0;
    for (const char of this.geohash) {
      const value = BASE32.indexOf(char);
      for (let mask = 16; mask; mask >>= 1) {
        const range = ranges[axis];
        range[value & mask ? 0 : 1] = (range[0] + range[1]) / 2;
        axis = 1 - axis;
      }
    }
    return { lat: (ranges[1][0] + ranges[1][1]) / 2, lon: (ranges[0][0] + ranges[0][1]) / 2 };
  }
}
