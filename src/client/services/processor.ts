import { BaseWindow, IManifest } from '../apps/BaseWindow/BaseWindow';
import { EventEmitter } from 'events';
import { random } from 'lodash';
import { reactGeneratorFunction, appConstructorGenerator, launchApp } from '../essential/apps';
import { IBrowserStorage } from './browserStorage';
import { Broadcaster } from './broadcaster';
import { IJSONWindowEvent } from '../apps/BaseWindow/WindowEvent';

interface IStringifiedProcess {
  manifest: IManifest;
  props: any;
  state: any;
}

interface IDisplayingApp {
  processID: number;
  app: JSX.Element;
  state?: any;
}

export declare interface IProcessor {
  on(event: 'appAdd', listener: (object: BaseWindow) => void): this;
  on(event: 'appRemove', listener: (object: BaseWindow) => void): this;
  on(event: 'appDisplayingAdd', listener: (object: IDisplayingApp) => void): this;
  on(event: 'slowSystem', listener: (performance: number) => void): this;
}

export class IProcessor extends EventEmitter {
  private readonly browserStorageKey = '__processor';
  private readonly serviceName = 'procesor';
  private readonly processorId = random(1000, 9999);
  private readonly _uptime = Date.now();
  private lindowsProcesses: BaseWindow[] = [];
  private displaying: IDisplayingApp[] = [];
  private user = `Guest${random(1000, 9999)}`;
  private _mobileDetect: MobileDetect;
  private _frontend = 'Lindows 1.0 Alpha';
  private processID = 0;
  private processors: number[] = [];
  private main = true;
  private destroyed = false;
  private monitorFunction: number;
  private lastPerformance = 0;
  private paused = false;

  constructor(private browserStorage: IBrowserStorage, private broadcaster: Broadcaster) {
    super();
    this.broadcastNewProcess();

    // this.broadcaster.on(`${this.serviceName}-attach`, this.addNewProcess);
    // this.broadcaster.on(`${this.serviceName}-detach`, this.removeProcess);
    // this.broadcaster.on(`${this.serviceName}-update`, this.updateProcesses);
    // this.broadcaster.on(`${this.serviceName}-addApp`, this.remoteAppAdd);
    window.addEventListener('beforeunload', this.destroy);
    this.monitorFunction = setInterval(() => {
      this.monitor();
      this.lastPerformance = performance.now();
    });

    this.setReady();
  }

  updateProcesses = (json: IJSONWindowEvent) => {
    const id = json.props.id;
    const lProcess = this.lindowsProcesses.find(e => e.id === id);
    if (!lProcess) return;
    lProcess._silentSetState(json.state);
  };

  remoteAppAdd = (prop: [string, number]) => {
    const reactGeneratorFunction = appConstructorGenerator(prop[0]);
    this.addApp(reactGeneratorFunction, prop[0], prop[1]);
  };

  private monitor = () => {
    const perf = performance.now();
    const result = perf - this.lastPerformance;
    if (result > 1000 && !document.hidden) {
      this.emit('slowSystem', result);
    }

    // const dataToUpdate = []
    // this.lindowsProcesses.forEach(e => {
    //   e.props.
    // })

    this.lastPerformance = perf;
  };

  private broadcastNewProcess = () => {
    this.broadcaster.emit(`${this.serviceName}-attach`, this._uptime);
  };

  private broadcastProcessRemoval = () => {
    this.broadcaster.emit(`${this.serviceName}-detach`, this._uptime);
  };

  private addNewProcess = (id: number) => {
    if (this._uptime === id) return;
    const indexOf = this.processors.indexOf(id);
    if (indexOf === -1) {
      this.processors.push(id);
      this.setMain();
    }
  };

  private setMain() {
    const processorIds = [...this.processors];
    processorIds.push(this._uptime);
    processorIds.sort((a, b) => a - b);
    if (processorIds[0] === this._uptime) {
      this.main = true;
      console.warn('this is main');
    }
  }

  private removeProcess = (id: number) => {
    if (this._uptime === id) return;
    const indexOf = this.processors.indexOf(id);
    if (indexOf !== -1) {
      this.processors.slice(indexOf, 1);
      this.setMain();
    }
  };

  private setReady() {
    // const storage = this.browserStorage.getItem(this.browserStorageKey);
    // if (storage) {
    //   try {
    //     const json: IStringifiedProcess[] = JSON.parse(storage);
    //     if (Array.isArray(json)) {
    //       json.forEach(app => {
    //         const launchName = app.manifest.launchName;
    //         const appConstructor = appConstructorGenerator(launchName);
    //         const id = this.processID++;
    //         const customProps = { ...app.props };
    //         customProps.id = id;
    //         customProps.key = id;
    //         const jsxElement = appConstructor(id, customProps);
    //         const displayingApp: IDisplayingApp = { processID: id, app: jsxElement, state: app.state };
    //         this.displaying.push(displayingApp);
    //         this.emit('appDisplayingAdd', displayingApp);
    //       });
    //     }
    //   } catch (_) {
    //     /* ignored */
    //   }
    // }
  }

  private mobileDetect() {
    return this._mobileDetect;
  }

  get userName() {
    return this.user;
  }

  private get deviceInfo() {
    return null;
    // const info = this.info.find(e => e.key === 'userAgent');
    //if (!info) return undefined;
    //return new UAParser(info.value);
  }

  private get browser() {
    const deviceInfo = this.deviceInfo;
    if (!deviceInfo) return undefined;
    return `${deviceInfo.getBrowser().name}${deviceInfo.getBrowser().version}`;
  }

  startProcess(object: BaseWindow) {
    if (object.onlyOne) {
      for (const lindowsProcess of this.lindowsProcesses) {
        if (lindowsProcess instanceof object.constructor) {
          const displaying = this.displaying.find(o => o.processID === object.id);
          const indexOfDisplaying = this.displaying.indexOf(displaying);
          if (indexOfDisplaying !== -1) this.displaying.splice(indexOfDisplaying, 1);
          this.emit('appRemove', process);
          lindowsProcess.changeActiveState(true);
          return;
        }
      }
    }

    const displayingObject = this.displaying.find(d => d.processID === object.id);
    if (displayingObject && displayingObject.state) {
      object.on('ready', () => {
        object.setState(displayingObject.state);
      });
    }
    object.changeActiveState(false);
    this.lindowsProcesses.push(object);
    // object.on('*', ev => {
    //   this.broadcaster.emit(`${this.serviceName}-update`, ev.json);
    // });

    this.emit('appAdd', object);
  }

  killProcess(object: BaseWindow) {
    // console.log('killing', object, this);
    const process = this.lindowsProcesses.find(o => o.id === object.id);
    const displaying = this.displaying.find(o => o.processID === object.id);

    const indexOfProcess = this.lindowsProcesses.indexOf(process);
    const indexOfDisplaying = this.displaying.indexOf(displaying);

    if (indexOfProcess !== -1) this.lindowsProcesses.splice(indexOfProcess, 1);
    if (indexOfDisplaying !== -1) this.displaying.splice(indexOfDisplaying, 1);

    this.emit('appRemove', process);
  }

  makeActive(object: BaseWindow) {
    this.lindowsProcesses.forEach(wind => {
      if (object !== wind) wind.changeActiveState(false, false);
    });
  }

  addApp = (reactGeneratorFunction: reactGeneratorFunction, appName: string, id?: number) => {
    if (id === undefined) {
      id = this.processID++;
      this.broadcaster.emit(`${this.serviceName}-addApp`, [appName, id]);
    } else if (id > this.processID) this.processID = id + 1;

    const jsxElement = reactGeneratorFunction(id);
    const displayingApp: IDisplayingApp = { processID: id, app: jsxElement };
    this.displaying.push(displayingApp);
    this.emit('appDisplayingAdd', displayingApp);
  };

  saveState = (): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      const stringifiedProcesses = this.stringify;
      try {
        await this.browserStorage.setItem(this.browserStorageKey, stringifiedProcesses);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  };

  private get stringify() {
    const stringifiedProcesses: IStringifiedProcess[] = [];
    this.processes.forEach(app => {
      const stringifiedProcess: IStringifiedProcess = {
        manifest: app._manifest,
        props: app.props,
        state: app.state,
      };
      stringifiedProcesses.push(stringifiedProcess);
    });
    return JSON.stringify(stringifiedProcesses);
  }

  get runningApps() {
    return this.displaying;
  }

  get uptime() {
    return this._uptime;
  }

  get processes() {
    return this.lindowsProcesses;
  }

  private get frontend() {
    return this._frontend;
  }

  private destroy = (ev?: BeforeUnloadEvent) => {
    if (ev) ev.preventDefault();
    this.destroyed = true;

    //this.broadcaster.removeListener(`${this.serviceName}-attach`, this.addNewProcess);
    //this.broadcaster.removeListener(`${this.serviceName}-detach`, this.removeProcess);
    //this.broadcaster.removeListener(`${this.serviceName}-update`, this.updateProcesses);
    //this.broadcaster.removeListener(`${this.serviceName}-addApp`, this.remoteAppAdd);
    window.removeEventListener('beforeunload', this.destroy);
    clearInterval(this.monitorFunction);
    this.broadcastProcessRemoval();
  };
}
