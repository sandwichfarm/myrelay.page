import type { ComponentType } from 'svelte';
import type { MRPConfig } from './MRPConfig';
import type { MRPState } from './MRP';
import { MRPData } from './MRPData';

type OptionModule = { optionsConfig?: Record<string, any>; defaultOptions?: Record<string, any> };
type ComponentModule = { default: ComponentType };

export class BlockLoader extends MRPData {
  private _options: Record<string, OptionModule> = {};
  private _components: Record<string, ComponentType> = {};
  private initialized?: Promise<void>;
  constructor(state: MRPState, readonly config: MRPConfig) { super(state.signal, 'blockLoader'); }
  init(): Promise<void> { return this.initialized ??= this.initialize(); }
  private async initialize() {
    this.begin();
    await this.loadAllComponents();
    this.complete();
  }
  async loadComponentOptions(key: string) {
    const options = await this.getComponentOptionConfig(key);
    this.setComponentOptions(key, options);
    return { optionsConfig: options.optionsConfig ?? {}, options: this.getOptions(key) };
  }
  async getComponentOptionConfig(key: string): Promise<OptionModule> {
    const type = this.getType(key);
    return import(`../components/blocks/${this.isRepeatable(key) ? 'repeatable' : 'unique'}/${type}/${type}.options.ts`)
      .catch(() => ({}));
  }
  setComponentOptions(key: string, options: OptionModule) { this._options[key] = options; }
  getOptions(key: string): Record<string, any> {
    return { ...this._options[key]?.defaultOptions, ...this.config.event.blocks[key]?.options };
  }
  async loadAllComponents() {
    await Promise.all(this.sortedKeys.map(key => this.loadComponent(key)));
  }
  private async loadComponent(key: string) {
    const type = this.getType(key);
    try {
      if (!this._components[type]) {
        const module: ComponentModule = this.isRepeatable(key)
          ? await import(`../components/blocks/repeatable/${type}/${type}.svelte`)
          : await import(`../components/blocks/unique/${type}/${type}.svelte`);
        this._components[type] = module.default;
      }
      await this.loadComponentOptions(key);
      this.changed();
    } catch (error) { BlockLoader.errorHandler(error as Error); }
  }
  getRepeatablesByType(type: string) { return this.sortedKeys.filter(key => this.isRepeatable(key) && this.getType(key) === type); }
  async addComponent(type: string, order?: number, url?: string): Promise<string> {
    if (url) throw new Error('Remote executable blocks are not supported');
    let index = 0;
    while (this.config.event.blocks[`${type}:${index}`]) index++;
    const key = `${type}:${index}`;
    const block = { enabled: true, order: order ?? this.sortedKeys.length, options: {} };
    if (order !== undefined) this.config.event.insertBlockAt(key, block);
    else this.config.event.setBlock(key, block);
    await this.loadComponent(key);
    this.changed();
    return key;
  }
  static errorHandler(error: Error) { console.error(`BlockLoader: ${error.message}`); }
  isRepeatable(key: string) { return key.includes(':'); }
  getType(key: string) { return key.split(':')[0]; }
  get sortedComponents() { return this.sortedKeys.map(key => ({ key, component: this._components[this.getType(key)] })); }
  get sortedKeys() { return this.config.event.getBlocksSorted(); }
  get components() { return this._components; }
}
