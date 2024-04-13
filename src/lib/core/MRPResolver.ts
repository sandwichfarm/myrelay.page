import { EventEmitter } from 'tseep';
import Deferred from 'promise-deferred';

type Timeout = ReturnType<typeof setTimeout>;

export class MRPResolver {
  protected signal: EventEmitter<any>;
  private resolved: Map<string, boolean> = new Map();
  
  constructor(signal: EventEmitter<any>){
    this.signal = signal;
  }

  private onFail(key: string, deferred: Deferred<boolean>, $timeout?: Timeout): void {
    const result = false;
    if ($timeout) clearTimeout($timeout);
    this.resolved.set(key, result);
    deferred.resolve(result);
    this.signal.removeListener(`${key}:ready`, this.onReady);
    this.signal.removeListener(`${key}:fail`, this.onFail);
  }

  private onReady(key: string, deferred: Deferred<boolean>, $timeout?: Timeout): void{
    const result = true;
    if ($timeout) clearTimeout($timeout);
    this.resolved.set(key, result);
    deferred.resolve(result);
    this.signal.removeListener(`${key}:ready`, this.onReady);
    this.signal.removeListener(`${key}:fail`, this.onFail);
  }
  
  async ready(key: string, timeout?: number): Promise<boolean> {
    if(this.resolved.get(key) === true) {
      return true;
    }

    const deferred = new Deferred<boolean>();
    let $timeout: Timeout | undefined;

    if(timeout) {
      $timeout = setTimeout(() => {
        this.onFail(key, deferred, $timeout);
      }, timeout);
    }

    this.signal.on(`${key}:ready`, () => this.onReady(key, deferred, $timeout));
    this.signal.on(`${key}:fail`, () => this.onFail(key, deferred, $timeout));

    return deferred.promise;
  }
}