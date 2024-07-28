import jsonpack from 'jsonpack';
import objectHash from 'object-hash';
import deepMerge from 'deepmerge';

import NDK, { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';

import type { NDKTag, NostrEvent } from '@nostr-dev-kit/ndk';


type Colors = {
  background?: string,
  foreground?: string,
  primary?: string,
  secondary?: string,
  accent?: string,
  muted?: string,
}
type ColorKeys = keyof Colors;
type ColorTuple = ['color', ColorKeys, string];

type Font = {
  [key: string]: string
}

type Json = {
  [key: string]: any
}

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

export class AppConfig extends NDKEvent {
  private _changed: boolean = false;
  private _config: ConfigObj;
  private _configUnchanged: ConfigObj;
  private _configHash: string | undefined;  
  private _configHashUnchanged: string | undefined;  
  private _configDefault: ConfigObj = deepClone(defaults);
  private _configDefaultHash: string = '';

  constructor( ndk: NDK, event?: NostrEvent ){
    super(ndk, event)
    this.kind = NDKKind.AppSpecificData

    this._configDefaultHash = objectHash(this._configDefaultHash, { algorithm: 'sha1' });
    this.config = deepMerge(this._configDefault, this.parseConfig(this.content))
    this._configUnchanged = deepClone(this.config)
    this.content = jsonpack.pack(this.config);
  }

  static from( ndk: NDK, rawEvent: NostrEvent ){
    return new AppConfig(ndk, rawEvent)
  }

  private parseConfig(content: string): ConfigObj {
    if (!content) return this._configDefault;
    try {
      return jsonpack.unpack(content);
    } catch (e) {
      console.error(`Error parsing content: ${e}`);
      return this._configDefault;
    }
  }

  reset(){
    this.config = deepClone(this._configDefault)
    this._configUnchanged = deepClone(this.config)
    this.content = jsonpack.pack(this.config);
  }

  configDiffersFromDefault(): boolean {
    // console.log(this.configHash, this._configDefaultHash, this.configHash !== this._configDefaultHash)
    return this.configHash !== this._configDefaultHash;
  }

  commitChanges(){
    this._configUnchanged = { ...this.config }
    this.setConfigHash(true)
  }

  discardChanges(){
    // console.log(`hash of unchanged config`, objectHash(this._configUnchanged, { algorithm: 'sha1' }))  
    // console.log('discarding changes', this.deterministicHash)
    this.config = deepClone( this._configUnchanged )
    this.configHash = this.configHashUnchanged as string;
    // console.log('hash after', this.deterministicHash)
  }  

  set config(config: ConfigObj) {
    this._config = this.deepProxy(config, () => {
      this.content = this.pack();
      // console.log('content packed', this.content)  
    });
    this.setConfigHash(this?._configHashUnchanged? false: true)
  }

  get config(): ConfigObj {
    return this._config;
  }

  set changed(changed: boolean) {
    this._changed = changed;
  }

  get changed(): boolean {
    return this._changed
  }
  
  get configHash(): string | undefined {
    return this._configHash;
  }

  private set configHash(hash: string) {
    this._configHash = hash;
  }

  private get configHashUnchanged(): string | undefined {
    return this._configHashUnchanged;
  }

  private set configHashUnchanged(hash: string) {
    this._configHashUnchanged = hash;
  }

  get contentUnpacked(): Json {
    try {
      return jsonpack.unpack(this.content);
    } catch (e) {
      console.error(`Error unpacking content: ${e}`);
      return {};
    }
  }

  setConfigHash(setOriginal: boolean = false) {
    const newHash = objectHash(this.config, { algorithm: 'sha1' });
    if (setOriginal) {
      this.configHashUnchanged = newHash;
    }
    this.configHash = newHash;
    this.changed = this.configHash !== this.configHashUnchanged;
    // console.log(this.changed ? 'changed' : 'unchanged', this.configHash, this.configHashUnchanged);
  }

  private deepProxy(obj: any, callback: () => void): any {
    return new Proxy(obj, {
        get: (target, property, receiver) => {
            const value = Reflect.get(target, property, receiver);
            return value && typeof value === 'object' ? this.deepProxy(value, callback) : value;
        },
        set: (target, property, value, receiver) => {
            if (typeof value === 'boolean' || target[property] !== value) {
                target[property] = value;
                callback(); // Trigger callback only on actual change
                return true;
            }
            return Reflect.set(target, property, value, receiver);
        }
    });
  }

  get deterministicHash(){
    return objectHash(this.config, { algorithm: 'sha1' });
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

  private updateConfig(path: string[], value: any) {
        let current = this._config;
      for (let i = 0; i < path.length - 1; i++) {
          current = current[path[i]];
      }
      if(!current?.[path?.[path.length - 1]]) throw new Error(`${path} does not exist`) 
      current[path[path.length - 1]] = value;
      this.config = this._config;
  }

  set d(key: string) {
    this.tags = this.tags.filter( (tag: NDKTag) => tag[0]!== 'd' )
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
    this._config.general.login.join.enabled = enabled;
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
    return this.config.general?.login?.join?.enabled
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
