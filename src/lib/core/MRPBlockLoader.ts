import type { R } from "vitest/dist/reporters-P7C2ytIv.js"
import type { MRPConfig } from "./MRPConfig"
import type { MRPState } from "./MRP"
import { MRPData } from "./MRPData"

type Components = {
  [key: string]: string | boolean
}

type ComponentOption = {
  name: string,
  url: string
}

type $Component = {
  name: string,
  module: NodeModule
}

export class BlockLoader extends MRPData {
  private readonly defaultComponents: Components = {
    // 'speedtest': 'speedtest',
    'profile': 'profile',
    'map': 'map',
    'monitors': 'monitors',
    'relay-feed': 'relay-feed',
    // 'feed': 'feed',
  }
  private $: MRPState
  private _componentsDef: Components = {}
  private _components: Record<string, NodeModule> = {}
  private _config: MRPConfig | undefined

  constructor($state: MRPState, config: MRPConfig | undefined){
    super($state.signal, 'blockLoader')
    this.$ = $state
    if(!config) return
    this._config = config
  }

  async init(){
    this.begin()
    if(this._config?.componentVisible && Object.keys(this._config?.componentVisible)?.length){
      this._config = { ...config.componentVisible, ...this.defaultComponents }
    }
    else {
      this._componentsDef = this.defaultComponents
    }
    await this.loadComponents().catch(BlockLoader.errorHandler)
  }

  private set componentDef( component: ComponentOption ){
    this._componentsDef[component.name] = component.url
  }

  private set component( component: $Component ){
    this._components[component.name] = component.module
  }

  async addComponent(name: string, url: string){
    this.componentDef = { 
      name: name,
      url: url
    } as ComponentOption
    await this.loadComponent(name).catch(BlockLoader.errorHandler)
  }

  private async loadComponent(name: string): Promise<NodeModule | undefined> {
    let $component;
    if(this._componentsDef[name]){
      $component = await import(`../components/blocks/${this._componentsDef[name]}.svelte`).catch(BlockLoader.errorHandler)
      this._components[name] = $component?.default? $component.default: $component
    }
    return $component 
  }

  async loadComponents(){
    for(let name in this._componentsDef){
      await this.loadComponent(name).catch(BlockLoader.errorHandler)
    }
  }

  static errorHandler(error: Error){
    console.error(`BlockLoader: ${error}`)
  }

  get components(): Record<string, NodeModule> {
    return this._components
  }
}