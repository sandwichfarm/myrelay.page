import NDK, { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';
import type { NDKTag, NostrEvent } from '@nostr-dev-kit/ndk';

import jsonpack from 'jsonpack';


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

export type ConfigBlock = {
  enabled: boolean,
  order: number,
  options?: {
    [key: string]: any
  },
  custom?: boolean,
  customUrl?: string, 
  customType?: string
}

export type ConfigBlocks = {
  [key: string]: ConfigBlock
}

export type ConfigObj = {
  general: {
    login: {
      enabled: boolean,
      join: {
        enabled: boolean
      }
    },
    theme: ConfigTheme
  },
  blocks: ConfigBlocks
}

const defaults: ConfigObj = {
  general: {
    login: {
      enabled: true,
      join: {
        enabled: true 
      }
    },
    theme: {
      native: 'classic',
      custom: false,
      customUrl: '',
      customType: ''
    }
  },
  blocks: {
    'operator-profile': {
      enabled: true,
      order: 0
    },
    'relay-feed': {
      enabled: true,
      order: 1
    },
    'map': {
      enabled: true,
      order: 2
    }
  }
}

export class AppConfig extends NDKEvent {
  private _config: any = {}
  changed: boolean = false;

  constructor( ndk: NDK, event?: NostrEvent ){
    super(ndk, event)
    this.kind = NDKKind.AppSpecificData
    this.config = { ...defaults, ...this.parseConfig(this.content) }
    this.content = jsonpack.pack(this.config)
  }

  static from( ndk: NDK, rawEvent: NostrEvent ){
    return new AppConfig(ndk, rawEvent)
  }

  private parseConfig(content: string): ConfigObj {
    if (!content) return defaults;
    try {
      return jsonpack.unpack(content);
    } catch (e) {
      console.error(`Error parsing content: ${e}`);
      return defaults;
    }
  }

  set config(config: ConfigObj) {
    this._config = this.deepProxy(config, () => {
      this.content = this.pack();
    });
  }

  get config(): ConfigObj {
    return this._config;
  }

  get contentUnpacked(): Json {
    try {
      return jsonpack.unpack(this.content);
    } catch (e) {
      console.error(`Error unpacking content: ${e}`);
      return {};
    }
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
      this.changed = true
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
    return jsonpack.pack(this._config);
  }

  setLoginEnabled(enabled: boolean) {
    this._config.general.login.enabled = enabled;
    this.content = this.pack();
  }

  setJoinEnabled(enabled: boolean) {
    this._config.general.login.join.enabled = enabled;
    this.content = this.pack();
  }

  setTheme(theme: ConfigTheme) {
    this._config.general.theme = theme;
    this.content = this.pack();
  }

  setBlocks(blocks: ConfigBlocks) {
    this._config.blocks = blocks;
    this.content = this.pack();
  }

  setBlockEnabled(key: string, enabled: boolean) {
    if (this._config.blocks[key]) {
      this._config.blocks[key].enabled = enabled;
      this.content = this.pack();
    }
  }

  setBlockOrder(key: string, order: number) {
    if (this._config.blocks[key]) {
      this._config.blocks[key].order = order;
      this.content = this.pack();
    }
  }

  setBlockOptions(key: string, options: any) {
    if (this._config.blocks[key]) {
      this._config.blocks[key].options = options;
      this.content = this.pack();
    }
  }

  disableBlock(key: string) {
      this.setBlockEnabled(key, false);
  }

  enableBlock(key: string) {
      this.setBlockEnabled(key, true);
  }

  toggleBlock(key: string) {
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
    let targetOrder = block.order + (direction === 'decrement' ? 1 : -1);
    for (let key in this.config.blocks) {
      if (this.config.blocks[key].order === targetOrder) {
        this.config.blocks[key].order = block.order;
        block.order = targetOrder;
        break;
      }
    }
  }

  shiftBlockUp(key: string): undefined {
    if (this.config.blocks[key].order > 0) {
      this.shiftOrder(key, 'increment');
    }
  }

  shiftBlockDown(key: string): undefined {
    const block = this.config.blocks[key];
    const maxOrder = Object.keys(this.config.blocks).length - 1;
    if (block.order < maxOrder) {
      this.shiftOrder(key, 'decrement');
    }
  }
  
}