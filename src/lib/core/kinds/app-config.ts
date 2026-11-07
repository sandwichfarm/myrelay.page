import jsonpack from 'jsonpack';
import objectHash from 'object-hash';
import deepMerge from 'deepmerge';

import type { Event as NostrEvent } from 'nostr-tools';
import { z } from 'zod';

type Theme = string

export type ConfigTheme = {
  native: Theme,
  custom: boolean,
  customUrl: string, 
  customType: string
}

export type ConfigBlockOptions = {
  [key: string]: any
}

export type ConfigBlock = {
  enabled: boolean,
  order: number,
  options?: ConfigBlockOptions,
}

export type ConfigBlocks = {
  [key: string]: ConfigBlock
}

export type ConfigObj = {
  general: {
    login: {
      enabled: boolean,
    },
    join: {
      enabled: boolean
    },
    theme: ConfigTheme
  },
  blocks: ConfigBlocks
}

const defaults: ConfigObj = {
  general: {
    login: {
      enabled: true,
    },
    join: {
      enabled: true 
    },
    theme: {
      native: 'classic',
      custom: false,
      customUrl: '',
      customType: ''
    }
  },
  blocks: {
    'nip11': {
      enabled: true,
      order: -100
    },
    'follows-present': {
      enabled: true,
      order: -90
    },
    'operator-profile': {
      enabled: true,
      order: 0
    },
    // 'feed:0': {
    //   enabled: true,
    //   order: 1
    // },
    'map': {
      enabled: true,
      order: 1
    }
  }
}

const configSchema = z.object({
  general: z.object({
    login: z.object({ enabled: z.boolean().optional() }).passthrough().optional(),
    join: z.object({ enabled: z.boolean().optional() }).passthrough().optional(),
    theme: z.object({
      native: z.string().optional(), custom: z.boolean().optional(),
      customUrl: z.string().optional(), customType: z.string().optional(),
    }).passthrough().optional(),
  }).passthrough().optional(),
  blocks: z.record(z.object({
    enabled: z.boolean(), order: z.number().finite(), options: z.record(z.unknown()).optional(),
  }).passthrough()).optional(),
}).passthrough();

export class AppConfig {
  readonly kind = 30078;
  id = '';
  pubkey = '';
  created_at = 0;
  sig = '';
  tags: string[][] = [];
  content = '';
  private _config!: ConfigObj;
  private _configUnchanged!: ConfigObj;

  constructor(event?: Partial<NostrEvent>) {
    if (event) {
      this.id = event.id ?? '';
      this.pubkey = event.pubkey ?? '';
      this.created_at = event.created_at ?? 0;
      this.sig = event.sig ?? '';
      this.tags = deepClone(event.tags ?? []);
    }
    this.config = deepMerge(deepClone(defaults), this.parseConfig(event?.content ?? ''));
    this.commitChanges();
  }

  static from(event: NostrEvent) {
    return new AppConfig(event);
  }

  private parseConfig(content: string): Partial<ConfigObj> {
    if (!content) return {};
    try {
      return configSchema.parse(jsonpack.unpack(content)) as Partial<ConfigObj>;
    } catch {
      return {};
    }
  }

  reset() {
    this.config = deepClone(defaults);
  }

  configDiffersFromDefault(): boolean {
    return this.configHash !== objectHash(defaults);
  }

  // A publish can finish after the editor has changed again. Commit the exact
  // acknowledged snapshot while leaving those newer edits dirty.
  commitChanges(snapshot: ConfigObj = this.config) {
    this._configUnchanged = deepClone(snapshot);
  }

  discardChanges() {
    this.config = deepClone(this._configUnchanged);
  }

  set config(config: ConfigObj) {
    this._config = this.deepProxy(deepClone(config));
    this.content = this.pack();
  }

  get config(): ConfigObj { return this._config; }
  get changed(): boolean { return this.configHash !== objectHash(this._configUnchanged); }
  get configHash(): string { return objectHash(deepClone(this.config)); }
  get deterministicHash(): string { return this.configHash; }
  get contentUnpacked(): ConfigObj { return deepClone(this.config); }

  setConfigHash(setOriginal = false) {
    if (setOriginal) this.commitChanges();
  }

  private deepProxy(obj: any): any {
    return new Proxy(obj, {
      get: (target, key, receiver) => {
        const value = Reflect.get(target, key, receiver);
        return value && typeof value === 'object' ? this.deepProxy(value) : value;
      },
      set: (target, key, value) => {
        target[key] = value;
        this.content = this.pack();
        return true;
      },
      deleteProperty: (target, key) => {
        delete target[key];
        this.content = this.pack();
        return true;
      },
    });
  }

  rawEvent(): NostrEvent {
    return {
      id: this.id, pubkey: this.pubkey, created_at: this.created_at,
      kind: this.kind, tags: deepClone(this.tags), content: this.pack(), sig: this.sig,
    };
  }

  get theme(): ConfigTheme {
    return this.config.general?.theme
  }

  get blocks(): ConfigBlocks {
    return this.config.blocks
  }

  get general(): any {
    return this.config.general
  }

  get d(): string | undefined { return this.tags.find(tag => tag[0] === 'd')?.[1]; }

  set d(key: string) {
    this.tags = this.tags.filter( (tag: string[]) => tag[0]!== 'd' )
    this.tags.push(["d",`${key}`])
  }

  pack(): string {
    return jsonpack.pack(this.config);
  }

  setLoginEnabled(enabled: boolean) {
    this._config.general.login.enabled = enabled;
    this.config = this._config;
    this.content = this.pack();
  }

  setJoinEnabled(enabled: boolean) {
    this._config.general.join.enabled = enabled;
    this.config = this._config;
    this.content = this.pack();
  }

  setTheme(theme: ConfigTheme) {
    this._config.general.theme = theme;
    this.config = this._config;
    this.content = this.pack();
  }

  setBlocks(blocks: ConfigBlocks) {
    this._config.blocks = blocks;
    this.config = this._config;
    this.content = this.pack();
  }

  setBlock(name: string, block: ConfigBlock) {
    this._config.blocks[name] = block;
    this.config = this._config;
    this.content = this.pack();
  }

  setBlockEnabled(key: string, enabled: boolean) {
    if (this._config.blocks[key]) {
      this._config.blocks[key].enabled = enabled;
      this.config = this._config;
      this.content = this.pack();
    }
  }

  setBlockOrder(key: string, order: string | number) {
    if (this._config.blocks[key]) {
      this._config.blocks[key].order = typeof order === 'string'? parseInt(order): order;
      this.config = this._config;
      this.content = this.pack();
    }
  }

  setBlockOptions(key: string, options: ConfigBlockOptions) {
    if (this._config.blocks[key]) {
      this._config.blocks[key].options = options;
      this.config = this._config;
      this.content = this.pack();
    }
  }

  setBlockOption(key: string, optionKey: string, optionValue: any): void {
    if(!this._config.blocks?.[key]) return
    if(!this._config.blocks[key]?.options) {
      this._config.blocks[key].options = {} as ConfigBlockOptions
    }
    this._config.blocks[key].options![optionKey] = optionValue;
    this.config = this._config;
    this.content = this.pack();
  }

  disableBlock(key: string) {
    this.setBlockEnabled(key, false);
  }

  enableBlock(key: string) {
    this.setBlockEnabled(key, true);
  }

  toggleBlock(key: string) {
    // console.log(key, key, key)
    // console.log(key, this._config.blocks)
    const currentEnabledState = this._config.blocks[key].enabled;
    this.setBlockEnabled(key, !currentEnabledState);
  }

  isBlockEnabled(key: string): boolean {
    return this.blocks?.[key]?.enabled
  }

  isThemeCustom(): boolean {
    return this.config.general?.theme?.custom
  }

  isLoginEnabled(): boolean {
    return this.config.general?.login?.enabled
  }

  isJoinEnabled(): boolean {
    return this.config.general?.join?.enabled
  }

  getBlock(key: string): ConfigBlock {
    return this.blocks?.[key]
  }

  getBlocksSorted(): string[] {
    return Object.keys(this.blocks).sort((a, b) => this.getBlock(a).order - this.getBlock(b).order)
  }

  blockIsFirst(key: string): boolean {
    return this.getBlock(key)?.order === 0;
  }

  blockIsLast(key: string): boolean {
    return this.getBlock(key)?.order === Object.keys(this.blocks).length - 1;
  }
  
  private shiftOrder(key: string, direction: 'decrement' | 'increment'): void {
    const block = this.config.blocks[key];
    let targetOrder = block.order + (direction === 'decrement' ? -1 : 1);
    for (let key in this.config.blocks) {
      if (this.config.blocks[key].order === targetOrder) {
        this.config.blocks[key].order = block.order;
        block.order = targetOrder;
        break;
      }
    }
    this.config = this._config;
    this.content = this.pack();
  }

  shiftBlockUp(key: string): undefined {
    if (this.config.blocks[key].order > 0) {
      this.shiftOrder(key, 'decrement');
    }
  }

  shiftBlockDown(key: string): undefined {
    const block = this.config.blocks[key];
    const maxOrder = Object.keys(this.config.blocks).length - 1;
    if (block.order < maxOrder) {
      this.shiftOrder(key, 'increment');
    }
  }

  insertBlockAt(key: string, block: ConfigBlock): void {
    Object.keys(this.config.blocks).forEach(blockKey => {
      let currentBlock = this.config.blocks[blockKey];
      if (currentBlock.order >= block.order) {
        currentBlock.order++;
      }
    });
    this._config.blocks[key] = block;
    this.config = this._config;
  }

  removeBlock(name: string): void {
    const blockToRemove = this._config.blocks[name];
    if (!blockToRemove) return;
    const orderOfRemovedBlock = blockToRemove.order;
    delete this._config.blocks[name];
    Object.keys(this._config.blocks).forEach(blockKey => {
      let currentBlock = this._config.blocks[blockKey];
      if (currentBlock.order > orderOfRemovedBlock) {
        currentBlock.order--;
      }
    });
    this.config = this._config;
    this.content = this.pack();
  }
}

function deepClone(obj: any) {
  return JSON.parse(JSON.stringify(obj));
}
