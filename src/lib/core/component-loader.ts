import type { R } from "vitest/dist/reporters-P7C2ytIv.js"
import type { MRPConfig } from "./config"

type Components = {
  [key: string]: string
}

type ComponentOption = {
  name: string,
  url: string
}

type $Component = {
  name: string,
  module: NodeModule
}

export class ComponentLoader {
  private readonly defaultComponents: Components = {
    // 'speedtest': 'speedtest',
    'profile': 'profile',
    'map': 'map',
    'monitors': 'monitors',
    'relay-feed': 'relay-feed',
    // 'feed': 'feed',
    
    
  }
  private _componentsDef: Components = {}
  private _components: Record<string, NodeModule> = {}
  private _config: { [key: string]: boolean } | undefined

  constructor(){}

  async init(config: MRPConfig | undefined){
    if(config?.componentVisible && Object.keys(config?.componentVisible)?.length){
      ////console.log('config.componentVisible', config?.componentVisible)
      this._config = { ...config.componentVisible, ...this.defaultComponents }
      // this._config = {}
    }
    else {
      ////console.log('this.defaultComponents')
      this._componentsDef = this.defaultComponents
    }
    await this.loadComponents().catch(ComponentLoader.errorHandler)
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
    await this.loadComponent(name).catch(ComponentLoader.errorHandler)
  }

  private async loadComponent(name: string): Promise<NodeModule | undefined> {
    let $component;
    if(this._componentsDef[name]){
      $component = await import(`../components/${this._componentsDef[name]}.svelte`).catch(ComponentLoader.errorHandler)
      this._components[name] = $component?.default? $component.default: $component
    }
  }

  async loadComponents(){
    for(let name in this._componentsDef){
      await this.loadComponent(name).catch(ComponentLoader.errorHandler)
    }
  }

  static errorHandler(error: Error){
    console.error(`ComponentLoader: ${error}`)
  }

  get components(): Record<string, NodeModule> {
    return this._components
  }
}