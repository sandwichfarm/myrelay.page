import { EventEmitter } from 'tseep';

enum Theme {
  Default = 'default',
  Dark = 'dark'
}

enum CustomType {
  url = "Url",
  blossom = "Blossom",
  git = "Git"
}

export class MRPTheme {
  private theme = Theme.Default;
  private signal: EventEmitter<any>;
  private isCustom = false; 
  private customType = '';
  private custom: {
    url?: string,
    blossom?: string,
    git?: string
  }

  constructor(signal: EventEmitter<any>){
    signal = this.signal;
  }

  async set(key: Theme){
    this.theme = key;
    this.isCustom = false;
    this.customType = '';
    this.css = await this.fetchDefault() as Blob;
    this.signal.emit('theme:changed', key);
  }

  setUrl(key: string){
    this.custom.url = key;
    this.isCustom = true; 
    this.customType = 'url';
    
    this.signal.emit('theme:changed', key);
  }

  getUrl(){
    if(!this.isCustom) throw new Error(`No custom theme set`);
    return this.custom.url;
  }

  get(){
    return this.isCustom? this.[`get${this.customType}`]() : this.theme;
  }

  path(){
    return `$lib/assets/themes/${this.theme}.css`
  }
}