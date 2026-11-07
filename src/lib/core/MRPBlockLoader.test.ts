import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'tseep';
import type { MRPState } from './MRP';
import type { MRPConfig } from './MRPConfig';
import { BlockLoader } from './MRPBlockLoader';
function setup() {
  const blocks = { 'feed:0': { options: { filterLimit: 5 } } };
  const config = { event: { blocks, getBlocksSorted: () => Object.keys(blocks) } } as unknown as MRPConfig;
  return { blocks, loader: new BlockLoader({ signal: new EventEmitter() } as MRPState, config) };
}
describe('BlockLoader', () => {
  it('keeps rendering defaults out of the signed config and observes later edits', () => {
    const { blocks, loader } = setup(); const before = JSON.stringify(blocks);
    loader.setComponentOptions('feed:0', { defaultOptions: { filterLimit: 15, feedLayout: 'grid' } });
    expect(loader.getOptions('feed:0')).toEqual({ filterLimit: 5, feedLayout: 'grid' });
    expect(JSON.stringify(blocks)).toBe(before);
    blocks['feed:0'].options.filterLimit = 8; expect(loader.getOptions('feed:0').filterLimit).toBe(8);
  });
  it('awaits imports and coalesces repeated initialization', async () => {
    const { loader } = setup(); let resolve!: () => void;
    const load = vi.spyOn(loader, 'loadAllComponents').mockImplementation(() => new Promise<void>(r => { resolve = r; }));
    const first = loader.init(); const second = loader.init();
    expect(first).toBe(second); expect(loader.isComplete).toBe(false); resolve(); await first;
    expect(loader.isComplete).toBe(true); expect(load).toHaveBeenCalledTimes(1);
  });
});
