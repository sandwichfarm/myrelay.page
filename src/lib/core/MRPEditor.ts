export class MRPEditor {
  private _enabled: boolean = false;
  constructor(){}

  enable(){
    this.enabled = true
  }

  disable(){
    this.enabled = false
  }

  toggle(){
    this.enabled = !this.enabled
  }

  get enabled(): boolean {
    return this._enabled
  }

  private set enabled(enabled: boolean){
    this._enabled = enabled
  }
  
  async init(){}
}