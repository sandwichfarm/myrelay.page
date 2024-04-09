import { EventEmitter } from 'tseep';
import { MRPResolver } from './MRPResolver';

enum MRPStatus {
  Inactive = 'inactive',
  Pending = 'pending',
  Failed = 'failed',
  Completed = 'completed',
}

export class MRPData {
  private signal: EventEmitter<any>;
  private status: MRPStatus = MRPStatus.Inactive;
  private slug: string;
  
  constructor(signal: EventEmitter<any>, slug: string) {
    this.signal = signal;
    this.slug = slug;
  }

  get isInactive() {
    return this.status === MRPStatus.Inactive;
  }

  get isPending() {
    return this.status === MRPStatus.Pending;
  }

  get isFailed() {
    return this.status === MRPStatus.Failed;
  }

  get isCompleted() {
    return this.status === MRPStatus.Completed;
  }

  pending() {
    this.status = MRPStatus.Pending;
    this.signal.emit(`${this.slug}:pending`, this.status);
  }

  failed() {
    this.status = MRPStatus.Failed;
    this.signal.emit(`${this.slug}:failed`, this.status);
  }

  complete() {
    this.status = MRPStatus.Completed;
    this.signal.emit(`${this.slug}:completed`, this.status);
    this.ready();
  }

  ready(){
    this.signal.emit(`${this.slug}:ready`, this.status);
  }

}