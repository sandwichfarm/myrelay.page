import type { MRPConfig } from "./MRPConfig"
import type { MRPState } from "./MRP"
import { MRPData } from "./MRPData"

type Components = {
  [key: string]: string | boolean
}

type ComponentOption = {
  name: string,
  url?: string
}

type $Component = {
  name: string,
  module: NodeModule
}

type ComponentOptions = {
  options: any,
  optionsConfig: any
}

export class BlockLoader extends MRPData {
  private _options: Record<string, ComponentOptions> = {}
  private _components: Record<string, NodeModule> = {}
  private _repeatable: Map<string, string[]> = new Map()
  private _config: MRPConfig

  constructor($state: MRPState, config: MRPConfig){
    super($state.signal, 'blockLoader')
    this._config = config
  }

  async init(){
    if(this.isPending) return
    this.begin()
    await this.loadAllComponents().catch(BlockLoader.errorHandler)
  }

  async loadComponentOptions(key: string): Promise<ComponentOptions> {
    const options = await this.getComponentOptionConfig(key) || {}
    this.setComponentOptions(key, options)
    return this._options[key] || {}
  }

  async getComponentOptionConfig(key: string): Promise<{optionsConfig: any, defaultOptions: any}> {
    const type = this.getType(key)
    return import(
      `../components/blocks/${this.isRepeatable(key)
        ? 'repeatable'
        : 'unique'
      }/${type}/${type}.options.ts`)
        .catch(BlockLoader.errorHandler) || {}
  }

  setComponentOptions(key: string, options: {optionsConfig: any, defaultOptions: any}){
    const currentOptions = this.config.event.blocks[key]?.options || {}
    if(!options?.optionsConfig) options.optionsConfig = {}
    if(!options?.defaultOptions) options.optionsConfig = {}
    const {optionsConfig, defaultOptions} = options
    this._options[key] = {optionsConfig, options: {...defaultOptions, ...currentOptions}}
    this.config.event.blocks[key].options = this._options[key].options
  }

  async loadAllComponents(){
    await this.loadUniqueComponents().catch(BlockLoader.errorHandler)
    await this.loadRepeatableComponents().catch(BlockLoader.errorHandler)
    await this.loadRemoteComponents().catch(BlockLoader.errorHandler)
  }

  async loadUniqueComponents(){
    for (let key in this.config.event.blocks){
      if(this._components?.[key] !== undefined) continue;
      if(this.config.event.blocks[key].custom === true) continue;
      await this.loadUniqueComponent(key).catch(BlockLoader.errorHandler)
    }
  }

  async loadRepeatableComponents(){
    for (let key in this.config.event.blocks){
      if(!this.isRepeatable(key)) continue
      this.loadRepeatableComponent(key).catch(BlockLoader.errorHandler)
    }
  }

  setupRepeatable = (key: string) => {
    const type = this.getType(key)
    let repeatables = this.getRepeatablesByType(type)
    this._repeatable.set(type, [...repeatables, key])
  }

  getRepeatablesByType(type: string): string[] {
    return this._repeatable.get(type) || []
  }

  async loadRemoteComponents(){
    for(let key in this.config.event.blocks){
      this.setupRepeatable(key)
      const block = this.config.event.blocks[key]
      if(!block.enabled || block.custom === false) 
          continue;
      if(block.customType === 'url')
        await this.loadRemoteComponent(key, block.customUrl).catch(BlockLoader.errorHandler)
      
    }
  }
  async addComponent(type: string, order: number, url?: string): Promise<string> {
    const totalBlocks = Object.keys(this.config.event.blocks).length
    let repeatable = false
    let key: string = "";
    if(!url) {
      let repeatables = this.getRepeatablesByType(type)
      key = `${type}:${repeatables?.length}`
      this.setupRepeatable(key)
      repeatable = true 
      await this.loadRepeatableComponent(type).catch(BlockLoader.errorHandler)
    } 
    else {
      await this.loadRemoteComponent(type, url).catch(BlockLoader.errorHandler)
    }
    if(typeof order !== 'undefined')
      this.config.event.insertBlockAt(key, { enabled: true, order, options: {} })
    else
      this.config.event.setBlock(key, { enabled: true, order: totalBlocks, options: {} })
    this.changed()
    return key
  }

  private async loadUniqueComponent(key: string): Promise<NodeModule | undefined> {
    const block = this.config.event.blocks?.[key]
    const isUnique = !this.isRepeatable(key)
    let $component;
    if(block && isUnique){
      $component = await import(`../components/blocks/unique/${key}/${key}.svelte`).catch(BlockLoader.errorHandler)
      this._components[key] = $component?.default? $component.default: $component
    }
    await this.loadComponentOptions(key)
    return $component 
  }

  private async loadRepeatableComponent(key: string): Promise<NodeModule | undefined> {
    const type = this.getType(key)
    let $component = this?._components?.[type]
    if(typeof $component === 'undefined'){
      $component = await import(`../components/blocks/repeatable/${type}/${type}.svelte`).catch(BlockLoader.errorHandler)
      this._components[type] = $component?.default? $component.default: $component
      this.changed()
    }
    await this.loadComponentOptions(key)
    return $component 
  }

  private async loadRemoteComponent(key: string, url: string): Promise<NodeModule | undefined> {
    const block = this.config.event.blocks?.[key]
    let $component;
    if(block){
      $component = await import(/* @vite-ignore */ url).catch(BlockLoader.errorHandler)
      this._components[key] = $component?.default? $component.default: $component
    }
    return $component 
  }

  static errorHandler(error: Error){
    console.error(`BlockLoader: ${error}`)
  }

  get config(): MRPConfig { 
    return this._config
  }

  isRepeatable(key: string): boolean {
    return key.includes(':')
  }

  getType(key: string): string {
    return key.split(':')[0]
  }

  get sortedComponents(): { key: string, component: NodeModule }[] {
    return this.config.event.getBlocksSorted().map( (key: string) => ({ key, component: this._components[this.getType(key)] }))
  }

  get sortedKeys(): string[] {
    return this.config.event.getBlocksSorted().map( (key: string) => key)
  }

  get components(): Record<string, NodeModule> {
    return this._components
  }
}