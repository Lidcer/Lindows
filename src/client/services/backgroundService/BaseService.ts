import { EventEmitter } from 'events';

export abstract class BaseService extends EventEmitter {
  start(): void | Promise<void> {}
  destroy(): void | Promise<void> {}
}
