import { BaseWindow, IManifest } from '../apps/BaseWindow/BaseWindow';
import { EventEmitter } from 'events';
import fingerprintjs from 'fingerprintjs2';
import { UAParser } from 'ua-parser-js';
import { random } from 'lodash';
import React from 'react';
import { reactGeneratorFunction, appConstructorGenerator } from './apps';
import * as MobileDetect from 'mobile-detect';
import { browserStorage } from './browserStorage';
import { faItalic } from '@fortawesome/free-solid-svg-icons';

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
declare interface IProcessor {
  on(event: 'appAdd', listener: (object: BaseWindow) => void): this;
  on(event: 'appRemove', listener: (object: BaseWindow) => void): this;
  on(event: 'ready', listener: () => void): this;
  on(event: 'appDisplayingAdd', listener: (object: IDisplayingApp) => void): this;
}

class IProcessor extends EventEmitter {
  private readonly browserStorageKey = '__processor';
  private lindowsProcesses: BaseWindow[] = [];
  private displaying: IDisplayingApp[] = [];
  private info: fingerprintjs.Component[];
  private user = `Guest${random(1000, 9999)}`;
  private _uptime: number = 0;
  private _mobileDetect: MobileDetect;
  private _frontend = 'Lindows 1.0 Alpha';
  private processID = 0;
  private ready = false;
  private isBrowserStorageReady = false;
  private displayAppQueue: reactGeneratorFunction[] = [];

  constructor() {
    super();

    if (browserStorage.isReady) {
      this.isBrowserStorageReady = true;
      this.setReady();
    } else {
      const makeBrowserStorageReady = () => {
        this.isBrowserStorageReady = true;
        browserStorage.removeListener('ready', makeBrowserStorageReady);
        this.setReady();
      };
      browserStorage.on('ready', makeBrowserStorageReady);
    }
    this._uptime = Date.now();
    fingerprintjs.get(result => {
      this.info = result;
      const userAgent = result.find(e => e.key === 'userAgent');
      if (userAgent) {
        this._mobileDetect = new MobileDetect.default(userAgent.value);
      }
      this.setReady();
    });
  }

  private setReady() {
    if (this.info && this.isBrowserStorageReady && !this.ready) {
      this.ready = true;
      this.emit('ready');

      this.displayAppQueue.forEach(app => this.addApp(app));
      this.displayAppQueue = [];

      const storage = browserStorage.getStorage(this.browserStorageKey);
      if (storage) {
        try {
          const json: IStringifiedProcess[] = JSON.parse(storage);
          if (Array.isArray(json)) {
            json.forEach(app => {
              const launchName = app.manifest.launchName;
              const appConstructor = appConstructorGenerator(launchName);

              const id = this.processID++;
              const customProps = { ...app.props };
              customProps.id = id;
              customProps.key = id;
              const jsxElement = appConstructor(id, customProps);

              const displayingApp: IDisplayingApp = { processID: id, app: jsxElement, state: app.state };
              this.displaying.push(displayingApp);
              this.emit('appDisplayingAdd', displayingApp);
            });
          }
        } catch (_) {}
      }

      //appConstructorGenerator
    }
  }

  mobileDetect() {
    return this._mobileDetect;
  }

  get userName() {
    return this.user;
  }

  get deviceInfo() {
    const info = this.info.find(e => e.key === 'userAgent');
    if (!info) return undefined;
    return new UAParser(info.value);
  }

  get browser() {
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
      object._onReady = () => {
        object.setState(displayingObject.state);
      };
    }
    object.changeActiveState(false);
    this.lindowsProcesses.push(object);
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

  addApp = (reactGeneratorFunction: reactGeneratorFunction) => {
    if (!this.ready) {
      this.displayAppQueue.push(reactGeneratorFunction);
      return;
    }
    const id = this.processID++;
    const jsxElement = reactGeneratorFunction(id);
    const displayingApp: IDisplayingApp = { processID: id, app: jsxElement };
    this.displaying.push(displayingApp);
    this.emit('appDisplayingAdd', displayingApp);
  };

  saveState = (): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      const stringifiedProcesses = this.stringify;
      try {
        await browserStorage.store(this.browserStorageKey, stringifiedProcesses);
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

  get frontend() {
    return this._frontend;
  }

  get isReady() {
    return this.ready;
  }
}

export const processor = new IProcessor();
