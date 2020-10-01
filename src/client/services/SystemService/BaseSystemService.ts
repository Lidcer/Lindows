export enum SystemServiceStatus {
  Uninitialized,
  WaitingForStart,
  Starting,
  Failed,
  Ready,
  Destroyed,
}

export interface InitReturn {
  start(): void | Promise<void>,
  destroy(): void | Promise<void>,
  status(): SystemServiceStatus;
}

export abstract class BaseSystemService {
  init(): InitReturn {
    throw new Error('Not implemented!');
  }  
  status() {
    return SystemServiceStatus.Uninitialized;
  }
  get ready() {
    return this.status() === SystemServiceStatus.Ready;
  }
}
