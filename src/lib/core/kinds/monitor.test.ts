import { describe, it, expect } from 'vitest';
import type { NostrEvent } from 'nostr-tools';
import { RelayDiscovery } from './relay-discovery';
import { RelayMonitor } from './monitor';
const event = (tags: string[][]) => ({ tags, pubkey: 'operator' } as NostrEvent);
describe('monitor projections', () => {
  it('uses the most precise geohash and leaves source tags untouched', () => {
    const source = event([['g', 'u4'], ['g', 'u4pruydqqvj', 'geohash']]); const before = JSON.stringify(source);
    const discovery = new RelayDiscovery(source);
    expect(discovery.geohash).toBe('u4pruydqqvj'); expect(discovery.dd?.lat).toBeCloseTo(57.64911, 4); expect(discovery.dd?.lon).toBeCloseTo(10.40744, 4);
    expect(JSON.stringify(source)).toBe(before);
  });
  it('supports equator/prime-meridian coordinates and operator tags', () => {
    const monitor = new RelayMonitor(event([['g', '0', 'lat'], ['g', '0', 'lon'], ['o', 'owner']]));
    expect(monitor.dd).toEqual({ lat: 0, lon: 0 }); expect(monitor.operator).toBe('owner');
  });
  it('rejects invalid locations and round-trip times', () => {
    const discovery = new RelayDiscovery(event([['g', 'invalid!'], ['rtt-open', '-2'], ['rtt-read', 'NaN'], ['rtt-write', '0']]));
    expect(discovery.dd).toBeUndefined(); expect(discovery.rttOpen).toBeUndefined(); expect(discovery.rttRead).toBeUndefined(); expect(discovery.rttWrite).toBe(0);
  });
});
