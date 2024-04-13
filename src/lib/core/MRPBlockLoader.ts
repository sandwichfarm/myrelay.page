import type { R } from "vitest/dist/reporters-P7C2ytIv.js"
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

export class BlockLoader extends MRPData {
  // private $: MRPState
  private _components: Record<string, NodeModule> = {}
  private _config: MRPConfig

  constructor($state: MRPState, config: MRPConfig){
    super($state.signal, 'blockLoader')
    // this.$ = $state
    this._config = config
  }

  async init(){
    if(this.isPending) return
    this.begin()
    await this.loadNativeComponents().catch(BlockLoader.errorHandler)
  }

  async loadAllComponents(){
    await this.loadNativeComponents().catch(BlockLoader.errorHandler)
    await this.loadRemoteComponents().catch(BlockLoader.errorHandler)
  }

  async loadNativeComponents(){
    for (let name in this.config.event.blocks){
      if(this._components?.[name] !== undefined) continue;
      if(this.config.event.blocks[name].custom === true) continue;
      await this.loadNativeComponent(name).catch(BlockLoader.errorHandler)
    }
  }

  async loadRemoteComponents(){
    for(let name in this.config.event.blocks){
      const block = this.config.event.blocks[name]
      if(!block.enabled || block.custom === false) 
          continue;
      if(block.customType === 'url')
        await this.loadRemoteComponent(name, block.customUrl).catch(BlockLoader.errorHandler)
    }
  }

  nativeComponentPath(name: string): string {
    return `../components/blocks/${this._componentsDef[name]}/index.svelte`
  }

  async addComponent(name: string, url?: string, native: boolean = true){
    if(native)
      await this.loadNativeComponent(name).catch(BlockLoader.errorHandler)
    else if(url)
      await this.loadRemoteComponent(name, url).catch(BlockLoader.errorHandler)
    this.config.event.setBlock(name, { enabled: true, order: Object.keys(this.config.event.blocks).length, options: {} })
  }

  private async loadNativeComponent(name: string): Promise<NodeModule | undefined> {
    const block = this.config.event.blocks?.[name]
    let $component;
    if(block){
      $component = await import(`../components/blocks/${name}/${name}.svelte`).catch(BlockLoader.errorHandler)
      this._components[name] = $component?.default? $component.default: $component
    }
    return $component 
  }

  private async loadRemoteComponent(name: string, url: string): Promise<NodeModule | undefined> {
    const block = this.config.event.blocks?.[name]
    let $component;
    if(block){
      $component = await import(/* @vite-ignore */ url).catch(BlockLoader.errorHandler)
      this._components[name] = $component?.default? $component.default: $component
    }
    return $component 
  }

  static errorHandler(error: Error){
    console.error(`BlockLoader: ${error}`)
  }

  get config(): MRPConfig { 
    return this._config
  }

  get sortedComponents(): { key: string, component: NodeModule }[] {
    return this.config.event.getBlocksSorted().map( (key: string) => ({ key, component: this._components[key] }))
  }

  get sortedKeys(): string[] {
    return this.config.event.getBlocksSorted().map( (key: string) => key)
  }

  get components(): Record<string, NodeModule> {
    return this._components
  }
}