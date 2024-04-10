import { EventEmitter } from 'tseep';
import { MRPResolver } from './MRPResolver';
import type { MRPState } from './MRP';

export enum MRPStage {
  Inactive = 'inactive',
  Pending = 'pending',
  Errored = 'errored',
  Completed = 'completed',
}

export enum MRPStatus {
  Success = 'success',
  Failure = 'failure',
}

export class MRPData {
  private stage: MRPStage = MRPStage.Inactive;
  private status: MRPStatus;
  protected _signal: EventEmitter<any>;
  protected slug: string;
  // protected $: MRPState | null;
  
  constructor(signal: EventEmitter<any>, slug: string) {
    this._signal = signal;
    this.slug = slug;
  }

  protected get signal(): EventEmitter<any> | undefined {
    return this?.$?.signal? this.$.signal: this._signal;
  }

  protected set signal(signal: EventEmitter<any>){
    this._signal = signal
  }


  private key(){
    return `${this.slug}:${this.stage}`
  }

  protected changed(){
    if(!this?.signal) return console.warn('No signal found for MRPData instance')
    this.signal.emit(`state:changed`, this.stage, this.status);
  }

  private emit(arg1?:any, arg2?:any, arg?:any){
    if(!this?.signal) return console.warn('No signal found for MRPData instance')
    this.signal.emit(this.key(), ...arguments);
  }

  begin() {
    this.stage = MRPStage.Pending;
    this.emit(this.stage);
    this.changed();
  }

  error(err: Error) {
    this.stage = MRPStage.Errored;
    this.status = MRPStatus.Failure;
    this.emit(this.stage, this.status, err);
    this.changed();
  }

  complete(success: boolean = true, data?: any) {
    this.stage = MRPStage.Completed;
    this.status = success ? MRPStatus.Success: MRPStatus.Failure;
    this.emit(this.stage, this.status, data);
    this.ready();
    this.changed();
  }

  ready(){
    this.signal.emit(`${this.slug}:ready`, this.stage, this.status);
    this.changed();
  }

  get isInactive() {
    return this.stage === MRPStage.Inactive;
  }

  get isPending() {
    return this.stage === MRPStage.Pending;
  }

  get isError() {
    return this.stage === MRPStage.Errored;
  }

  get isComplete() {
    return this.stage === MRPStage.Completed;
  }

}