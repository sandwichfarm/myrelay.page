import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'tseep';
import type { MRPState } from './MRP';
import { MRPMonitors } from './MRPMonitors';
describe('monitor discovery', () => {
  it('never sends an unbounded author filter when no monitors are known', async () => {
    const query = vi.fn().mockResolvedValue([]);
    const monitors = new MRPMonitors({ signal: new EventEmitter(), client: { query } } as unknown as MRPState, 'wss://relay.test/');
    await Promise.all([monitors.init(), monitors.init()]);
    expect(query).toHaveBeenCalledTimes(1); expect(monitors.countMonitors()).toBe(0); expect(monitors.isComplete).toBe(true);
  });
  it('finishes when discovery fails', async () => {
    const query = vi.fn().mockRejectedValue(new Error('offline'));
    const monitors = new MRPMonitors({ signal: new EventEmitter(), client: { query } } as unknown as MRPState, 'wss://relay.test/');
    await monitors.init(); expect(monitors.isComplete).toBe(true); expect(monitors.getMonitorsDD()).toEqual({});
  });
});
