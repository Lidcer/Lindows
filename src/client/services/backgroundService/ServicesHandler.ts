import { ILypeService } from './LypeServices';
import { BaseService } from './BaseService';
import { EventEmitter } from 'events';

interface IBackgroundServices {
  name: string;
  Service: constructorGenerator;
  origin: BaseService['constructor'];
}

export type constructorGenerator = () => BaseService;

const INSTALLED_SERVICES: IBackgroundServices[] = [
  { name: 'lype', Service: () => new ILypeService(), origin: ILypeService },
];

const startUp: string[] = ['lype'];

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
declare interface BackgroundServices {
  on(event: 'ready', listener: () => void): this;
}

class BackgroundServices extends EventEmitter {
  private services: BaseService[] = [];
  private isReady = false;
  constructor(loadAllStartUpServices = false) {
    super();
    if (loadAllStartUpServices) {
      this.loadAll();
    } else {
      this.isReady = true;
      this.emit('ready');
    }
  }

  startOrGetService<T = BaseService>(name: string): Promise<T> {
    return new Promise((resolve, reject) => {
      const running = this.findRunningService(name) as any;
      if (running) return resolve(running);

      const service = INSTALLED_SERVICES.find(s => s.name === name);
      if (!service) return reject(new Error('Unknown service'));
      try {
        const actualService = service.Service();
        const startResult = actualService.start();
        if (startResult instanceof Promise) {
          startResult.then(() => {
            resolve(actualService as any);
            this.services.push(actualService);
          });
        } else {
          this.services.push(actualService);
          resolve(actualService as any);
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  findRunningService<T = BaseService>(name: string): T {
    const service = this.findService(name);
    if (!service) return null;
    for (const runningService of this.services) {
      if (service === runningService.constructor) return runningService as any;
    }
    return null;
  }

  killService(name: string): Promise<void> {
    return new Promise(resolve => {
      const running = this.findRunningService(name) as BaseService;
      if (!running) return resolve();

      const indexOf = this.services.indexOf(running);
      if (indexOf !== -1) this.services.splice(indexOf, 1);
      const destroy = running.destroy();
      if (destroy instanceof Promise) {
        destroy
          .then(() => {
            resolve(destroy as any);
          })
          .catch(() => {
            /* ignore */
          });
      } else {
        resolve();
      }
    });
  }

  private findService(name: string) {
    for (const installedService of INSTALLED_SERVICES) {
      if (installedService.name === name) return installedService.origin;
    }
    return null;
  }

  private loadAll() {
    return new Promise(async resolve => {
      for (const serviceName of startUp) {
        await this.startOrGetService(serviceName).catch(err => console.error(err));
      }
      resolve();
      this.isReady = true;
      this.emit('ready');
    });
  }

  get ready() {
    return this.isReady;
  }
}

let service: BackgroundServices;

export function backgroundServices() {
  if (service) return service;
  return startBackgroundServices(true);
}

export function bgService<T>(name: string): Promise<T> {
  return new Promise(resolve => {
    const justResolve = () => {
      service.removeListener('ready', justResolve);
      return resolve(service.startOrGetService<T>(name));
    };
    if (service && service.ready) {
      return justResolve();
    } else {
      if (!service) startBackgroundServices();
      if (service.ready) {
        justResolve();
      } else {
        service.on('ready', justResolve);
      }
    }
  });
}

export function bgRunningService<T>(name: string) {
  return backgroundServices().findRunningService<T>(name);
}

export function killBGService<T>(name: string): Promise<void> {
  return backgroundServices().killService(name);
}

export function startBackgroundServices(loadAllStartUpServices = false) {
  if (service) return service;
  service = new BackgroundServices(loadAllStartUpServices);
  window.s = service;
  return service;
}
