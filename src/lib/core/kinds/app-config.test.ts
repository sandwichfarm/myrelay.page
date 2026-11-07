import { describe, expect, it } from 'vitest';
import jsonpack from 'jsonpack';
import { AppConfig } from './app-config';

describe('application data compatibility', () => {
  it('keeps the historical defaults and block ordering', () => {
    const config = new AppConfig();
    expect(config.kind).toBe(30078);
    expect(config.getBlocksSorted()).toEqual(['nip11', 'follows-present', 'operator-profile', 'map']);
    expect(config.isLoginEnabled()).toBe(true);
    expect(config.theme.native).toBe('classic');
  });

  it('reads existing jsonpack payloads and preserves custom block options', () => {
    const content = jsonpack.pack({ blocks: { 'md:0': { enabled: true, order: 4, options: { text: 'Our relay' } } } });
    const config = new AppConfig({ content, tags: [['d', 'legacy-key']], kind: 30078 } as never);
    expect(config.blocks['md:0'].options?.text).toBe('Our relay');
    expect(config.blocks.nip11.enabled).toBe(true);
    expect(jsonpack.unpack(config.pack()).blocks['md:0']).toEqual({ enabled: true, order: 4, options: { text: 'Our relay' } });
  });

  it('sets one d tag without changing other tags', () => {
    const config = new AppConfig({ tags: [['d', 'old'], ['x', 'keep']] } as never);
    config.d = 'new';
    config.d = 'new';
    expect(config.tags).toEqual([['x', 'keep'], ['d', 'new']]);
  });
});

describe('configuration editing', () => {
  it('tracks direct nested edits and restores the acknowledged snapshot', () => {
    const config = new AppConfig();
    expect(config.changed).toBe(false);
    expect(config.configDiffersFromDefault()).toBe(false);
    config.config.general.theme.native = 'dark';
    expect(config.changed).toBe(true);
    expect(config.contentUnpacked.general.theme.native).toBe('dark');
    config.commitChanges();
    config.config.general.theme.native = 'classic';
    config.discardChanges();
    expect(config.theme.native).toBe('dark');
    expect(config.changed).toBe(false);
  });

  it('keeps edits made after the saved snapshot dirty', () => {
    const config = new AppConfig();
    config.setLoginEnabled(false);
    const snapshot = JSON.parse(JSON.stringify(config.config));
    config.setJoinEnabled(false);
    config.commitChanges(snapshot);
    expect(config.changed).toBe(true);
    config.discardChanges();
    expect(config.isLoginEnabled()).toBe(false);
    expect(config.isJoinEnabled()).toBe(true);
  });

  it('toggles login and join independently', () => {
    const config = new AppConfig();
    config.setJoinEnabled(false);
    expect(config.isJoinEnabled()).toBe(false);
    expect(config.isLoginEnabled()).toBe(true);
    config.setLoginEnabled(false);
    expect(config.isLoginEnabled()).toBe(false);
  });

  it('resets defaults without silently acknowledging the reset', () => {
    const config = new AppConfig();
    config.setLoginEnabled(false);
    config.commitChanges();
    config.reset();
    expect(config.isLoginEnabled()).toBe(true);
    expect(config.changed).toBe(true);
    config.discardChanges();
    expect(config.isLoginEnabled()).toBe(false);
  });

  it.each(['garbage', jsonpack.pack(null), jsonpack.pack({ blocks: null }), jsonpack.pack({ general: { login: false } }), jsonpack.pack({ blocks: { map: { enabled: 'yes', order: 1 } } })])('falls back safely for malformed payload %s', content => {
    const config = new AppConfig({ content });
    expect(config.isLoginEnabled()).toBe(true);
    expect(config.getBlocksSorted()).toHaveLength(4);
  });

  it('supports insertion, ordering, removal, and option edits', () => {
    const config = new AppConfig();
    config.insertBlockAt('md:0', { enabled: true, order: 0 });
    config.setBlockOption('md:0', 'content', 'Hello');
    expect(config.getBlock('md:0').options?.content).toBe('Hello');
    expect(config.getBlock('operator-profile').order).toBe(1);
    config.shiftBlockDown('md:0');
    expect(config.getBlock('md:0').order).toBe(1);
    config.shiftBlockUp('md:0');
    expect(config.getBlock('md:0').order).toBe(0);
    config.toggleBlock('md:0');
    expect(config.isBlockEnabled('md:0')).toBe(false);
    config.removeBlock('md:0');
    expect(config.getBlock('md:0')).toBeUndefined();
    expect(config.getBlock('operator-profile').order).toBe(0);
  });

  it('updates packed content for direct property deletion', () => {
    const config = new AppConfig();
    delete config.blocks.map;
    expect(jsonpack.unpack(config.content).blocks.map).toBeUndefined();
    expect(config.changed).toBe(true);
  });

  it('does not mutate caller-owned events or config objects', () => {
    const tags = [['d', 'original']];
    const config = new AppConfig({ tags });
    config.tags[0][1] = 'changed';
    expect(tags[0][1]).toBe('original');
    const snapshot = JSON.parse(JSON.stringify(config.config));
    config.config = snapshot;
    config.setLoginEnabled(false);
    expect(snapshot.general.login.enabled).toBe(true);
  });
});
