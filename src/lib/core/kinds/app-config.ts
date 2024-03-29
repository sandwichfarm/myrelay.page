import NDK, { NDKEvent, NDKKind } from '@nostr-dev-kit/ndk';

import type { NDKTag, NostrEvent } from '@nostr-dev-kit/ndk';

type ComponentVisible = {
  [key: string]: boolean
}

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

type Theme = string

export class AppConfig extends NDKEvent {
  private _color: Colors | undefined;
  private _font: Font | undefined;
  private _theme: Theme | undefined = "default";
  private _visible: ComponentVisible | undefined;

  constructor( ndk: NDK, event: NostrEvent ){
    super(ndk, event)
  }

  static from( ndk: NDK, rawEvent: NostrEvent ){
    return new AppConfig(ndk, rawEvent)
  }

  get colors(): Colors | undefined{
    const result = new Object() as Colors;
    (this.tags as ColorTuple[])
      .filter( (tag: ColorTuple) => tag[0] === 'color')
      .forEach( (tag: ColorTuple) => {
        result[tag[1]] = String(tag[2])
      })
    return result;
  }

  set backgroundColor(color: string){
    this.removeByKeyAndValue('color', 'background')
    this.tags.push(["color", 'background', color]);
  }

  get backgroundColor(): string | undefined{
    return this.tags.find( (tag: NDKTag) => tag[1] === 'background')?.[2]
  }

  set foregroundColor(color: string){
    this.removeByKeyAndValue('color', 'foreground')
    this.tags.push(["color", 'foreground', color]);
  }

  get foregroundColor(): string | undefined{
    return this.tags.find( (tag: NDKTag) => tag[1] === 'foreground')?.[2]
  }

  set primaryColor(color: string){
    this.removeByKeyAndValue('color', 'primary')
    this.tags.push(["color", 'primary', color]);
  }

  get primaryColor(): string | undefined{
    return this.tags.find( (tag: NDKTag) => tag[1] === 'primary')?.[2]
  }

  set secondaryColor(color: string){
    this.removeByKeyAndValue('color', 'secondary')
    this.tags.push(["color", 'secondary', color]);
  }

  get secondaryColor(): string | undefined{
    return this.tags.find( (tag: NDKTag) => tag[1] === 'secondary')?.[2]
  }

  set accentColor(color: string){
    this.removeByKeyAndValue('color', 'accent')
    this.tags.push(["color", 'accent', color]);
  }

  get accentColor(): string | undefined{
    return this.tags.find( (tag: NDKTag) => tag[1] === 'accent')?.[2]
  }

  set mutedColor(color: string){
    this.removeByKeyAndValue('color', 'muted')
    this.tags.push(["color", 'muted', color]);
  }

  get mutedColor(): string | undefined{
    return this.tags.find( (tag: NDKTag) => tag[1] === 'muted')?.[2]
  }

  get font(): Font | undefined{
    return this._font
  }

  set font(font: Font){
    this._font = font
  }

  get theme(): string | undefined{
    return this._theme
  }

  set theme(theme: string){
    this._theme = theme
  }

  get visible(): ComponentVisible | undefined{
    const result = new Object() as ComponentVisible;
    (this.tags)
      .filter( (tag: NDKTag) => tag[0] === 'visible')
      .forEach( (tag: NDKTag) => {
        result[tag[1]] = true
      })
    return result;
  }

  set visible(visible: ComponentVisible ){
    for (const key in visible){
      this.removeByKeyAndValue('visible', key)
      this.tags.push(["visible", key, 'true']);
    }
  }

  private removeByKeyAndValue(key: string, value: string){
    this.tags = this.tags.filter( (tag: NDKTag) => tag[0] === key && tag[1] !== value)
  }
}