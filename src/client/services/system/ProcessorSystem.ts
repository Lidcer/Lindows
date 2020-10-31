import { BaseWindow, IManifest } from "../../apps/BaseWindow/BaseWindow";
import { EventEmitter } from "events";
import { random } from "lodash";
import { ReactGeneratorFunction, appConstructorGenerator, launchApp } from "../../essential/apps";
import { Broadcaster } from "../internals/BroadcasterSystem";
import { IJSONWindowEvent } from "../../apps/BaseWindow/WindowEvent";
import { BrowserStorage } from "../internals/__BrowserStorageSystem";
import { BaseService, Service, SystemServiceStatus } from "../internals/BaseSystemService";
import { HardwareInfo } from "./HardwareInfo";
import { Internal } from "../internals/Internal";

interface IStringifiedProcess {
  manifest: IManifest;
  props: any;
  state: any;
}

export interface IDisplayingApp<T = unknown> {
  processID: number;
  app: JSX.Element;
  flags?: string;
  object?: T;
  state?: any;
}

const browserStorageKey = "__processor";
const internal = new WeakMap<Processor, Internal>();
export class Processor extends BaseService {
  private readonly serviceName = "processor";
  private readonly processorId = random(1000, 9999);
  private readonly _uptime = Date.now();
  private lindowsProcesses: BaseWindow[] = [];
  private displaying: IDisplayingApp<any>[] = [];
  private user = "";
  private _deviceName = "Unknown";
  private _mobileDetect: MobileDetect;
  private _frontend = "Lindows 1.0 Alpha";
  private processID = 0;
  private processors: number[] = [];
  private main = true;
  private destroyed = false;
  private monitorFunction: number;
  private lastPerformance = 0;
  private paused = false;
  private eventEmitter = new EventEmitter();
  private _status = SystemServiceStatus.Uninitialized;
  public onAppAdd() {}

  constructor(_internal: Internal) {
    super();
    internal.set(this, _internal);
    const storageKey = `${browserStorageKey}:__user`;
    this.user = localStorage.getItem(storageKey) || `Guest${random(1000, 9999)}`;
    localStorage.setItem(storageKey, this.user);
    const browser = _internal.hardwareInfo.userAgent.getBrowser();
    if (browser) {
      this._deviceName = `${browser.name}${browser.version}`;
    }
  }

  init() {
    if (this._status !== SystemServiceStatus.Uninitialized) throw new Error("Service has already been initialized");
    this._status = SystemServiceStatus.WaitingForStart;
    return {
      start: this.start,
      destroy: this.destroy,
      status: this.status,
    };
  }

  private start = () => {
    if (this._status !== SystemServiceStatus.WaitingForStart) throw new Error("Service is not in state for start");
    this._status = SystemServiceStatus.Starting;
    this.broadcastNewProcess();

    // this.broadcaster.on(`${this.serviceName}-attach`, this.addNewProcess);
    // this.broadcaster.on(`${this.serviceName}-detach`, this.removeProcess);
    // this.broadcaster.on(`${this.serviceName}-update`, this.updateProcesses);
    // this.broadcaster.on(`${this.serviceName}-addApp`, this.remoteAppAdd);
    window.addEventListener("beforeunload", this.destroy);
    this.monitorFunction = setInterval(() => {
      this.monitor();
      this.lastPerformance = performance.now();
    });
    this._status = SystemServiceStatus.Ready;
  };

  private destroy = () => {
    if (this._status === SystemServiceStatus.Destroyed) throw new Error("Service has already been destroyed");
    this._status = SystemServiceStatus.Destroyed;
    internal.delete(this);
    // this.broadcaster.removeListener(`${this.serviceName}-attach`, this.addNewProcess);
    // this.broadcaster.removeListener(`${this.serviceName}-detach`, this.removeProcess);
    // this.broadcaster.removeListener(`${this.serviceName}-update`, this.updateProcesses);
    // this.broadcaster.removeListener(`${this.serviceName}-addApp`, this.remoteAppAdd);
  };

  status = () => {
    return this._status;
  };

  updateProcesses = (json: IJSONWindowEvent) => {
    const id = json.props.id;
    const lProcess = this.lindowsProcesses.find(e => e.id === id);
    if (!lProcess) return;
    // lProcess._silentSetState(json.state);
  };

  remoteAppAdd = (prop: [string, number]) => {
    const reactGeneratorFunction = appConstructorGenerator(prop[0]);
    this.addApp(reactGeneratorFunction, prop[0], undefined, prop[1]);
  };

  private monitor = () => {
    const perf = performance.now();
    const result = perf - this.lastPerformance;
    if (result > 1000 && !document.hidden) {
      this.emit("slowSystem", result);
    }

    // const dataToUpdate = []
    // this.lindowsProcesses.forEach(e => {
    //   e.props.
    // })

    this.lastPerformance = perf;
  };

  on(value: "appAdd", listener: (object: BaseWindow) => void): void;
  on(value: "appRemove", listener: (object: BaseWindow) => void): void;
  on(value: "appDisplayingAdd", listener: (object: IDisplayingApp) => void): void;
  on(value: "slowSystem", listener: (performance: number) => void): void;
  on(value: string | symbol, listener: (...args: any[]) => void) {
    this.eventEmitter.on(value, listener);
  }

  private emit(value: "appAdd", object: BaseWindow): void;
  private emit(value: "appRemove", object: BaseWindow): void;
  private emit(value: "appDisplayingAdd", object: IDisplayingApp<any>): void;
  private emit(value: "slowSystem", performance: number): void;
  private emit(value: string | symbol, ...args: any[]) {
    this.eventEmitter.emit.apply(this.eventEmitter, [value, ...args]);
  }

  removeListener(value: string | symbol, listener: (...args: any[]) => void) {
    this.eventEmitter.removeListener(value, listener);
  }

  private broadcastNewProcess = () => {
    const int = internal.get(this);
    int.broadcaster.emit(`${this.serviceName}-attach`, this._uptime);
  };

  private broadcastProcessRemoval = () => {
    const int = internal.get(this);
    int.broadcaster.emit(`${this.serviceName}-detach`, this._uptime);
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
      console.warn("this is main");
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

  get username() {
    return this.user;
  }
  get deviceName() {
    return this._deviceName;
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
          this.emit("appRemove", lindowsProcess);
          lindowsProcess.changeActiveState(true);
          return;
        }
      }
    }

    const displayingObject = this.displaying.find(d => d.processID === object.id);
    if (displayingObject) {
      displayingObject.object = object;
    }
    if (displayingObject && displayingObject.state) {
      // object.on('ready', () => {
      //   object.setState(displayingObject.state);
      // });
    }
    object.changeActiveState(false);
    this.lindowsProcesses.push(object);
    // object.on('*', ev => {
    //   this.broadcaster.emit(`${this.serviceName}-update`, ev.json);
    // });

    this.emit("appAdd", object);
  }

  killProcess(object: BaseWindow) {
    // console.log('killing', object, this);
    const process = this.lindowsProcesses.find(o => o.id === object.id);
    const displaying = this.displaying.find(o => o.processID === object.id);

    const indexOfProcess = this.lindowsProcesses.indexOf(process);
    const indexOfDisplaying = this.displaying.indexOf(displaying);

    if (indexOfProcess !== -1) this.lindowsProcesses.splice(indexOfProcess, 1);
    if (indexOfDisplaying !== -1) this.displaying.splice(indexOfDisplaying, 1);

    this.emit("appRemove", process);
  }

  makeActive(object: BaseWindow) {
    this.lindowsProcesses.forEach(wind => {
      if (object !== wind) wind.changeActiveState(false, false);
    });
  }

  addApp = <A = JSX.Element>(
    reactGeneratorFunction: ReactGeneratorFunction,
    appName: string,
    flags?: string,
    id?: number,
  ): Promise<IDisplayingApp<A>> => {
    return new Promise(resolve => {
      if (id === undefined) {
        id = this.processID++;
        const int = internal.get(this);
        int.broadcaster.emit(`${this.serviceName}-addApp`, [appName, id]);
      } else if (id > this.processID) this.processID = id + 1;

      const jsxElement = reactGeneratorFunction(id, { flags });
      const displayingApp: IDisplayingApp<A> = {
        processID: id,
        app: jsxElement,
      };
      this.displaying.push(displayingApp);
      this.emit("appDisplayingAdd", displayingApp);

      //react doesn't update element instantly
      setTimeout(() => {
        resolve(displayingApp);
      });
    });
  };

  saveState = (): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      const stringifiedProcesses = this.stringify;
      try {
        //await this.browserStorage.setItem(browserStorageKey, stringifiedProcesses);
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
        manifest: app.getManifest(),
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

  // private destroy = (ev?: BeforeUnloadEvent) => {
  //   if (ev) ev.preventDefault();
  //   this.destroyed = true;

  //   //this.broadcaster.removeListener(`${this.serviceName}-attach`, this.addNewProcess);
  //   //this.broadcaster.removeListener(`${this.serviceName}-detach`, this.removeProcess);
  //   //this.broadcaster.removeListener(`${this.serviceName}-update`, this.updateProcesses);
  //   //this.broadcaster.removeListener(`${this.serviceName}-addApp`, this.remoteAppAdd);
  //   window.removeEventListener('beforeunload', this.destroy);
  //   clearInterval(this.monitorFunction);
  //   this.broadcastProcessRemoval();
  // };
}
