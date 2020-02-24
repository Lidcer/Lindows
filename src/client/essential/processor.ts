import { BaseWindow } from '../apps/BaseWindow/BaseWindow';
import { EventEmitter } from 'events';
import fingerprintjs from 'fingerprintjs2';
import { UAParser } from 'ua-parser-js';
import { random } from 'lodash';
import React from 'react';
import { reactGeneratorFunction } from '../apps';
import * as MobileDetect from 'mobile-detect';
import { browserStorage } from './browserStorage';

declare type DisplayingApp = { processID: number; app: JSX.Element };
declare interface IProcessor {
  on(event: 'appAdd', listener: (object: BaseWindow) => void): this;
  on(event: 'appRemove', listener: (object: BaseWindow) => void): this;
  on(event: 'infoReady', listener: (object: fingerprintjs.Component[]) => void): this;
  on(event: 'appDisplayingAdd', listener: (object: DisplayingApp) => void): this;
}

class IProcessor extends EventEmitter {
  private lindowsProcesses: BaseWindow[] = [];
  private displaying: DisplayingApp[] = [];
  private info: fingerprintjs.Component[] = [];
  private user = `Guest${random(1000, 9999)}`;
  private _uptime: number = 0;
  private _mobileDetect: MobileDetect;
  private _frontend = 'Lindows 1.0 Alpha';
  private processID = 0;

  constructor() {
    super();
    browserStorage.load();
    this._uptime = Date.now();
    fingerprintjs.get(result => {
      this.info = result;
      const userAgent = result.find(e => e.key === 'userAgent');
      if (userAgent) {
        this._mobileDetect = new MobileDetect.default(userAgent.value);
      }
      this.emit('infoReady', result);
    });
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
    const id = this.processID++;
    const jsxElement = reactGeneratorFunction(id);
    const displayingApp: DisplayingApp = { processID: id, app: jsxElement };
    this.displaying.push(displayingApp);
    this.emit('appDisplayingAdd', displayingApp);
  };

  getRunningApps() {
    return this.displaying;
  }

  get uptime() {
    return this._uptime;
  }

  getProcesses() {
    return this.lindowsProcesses;
  }

  get frontend() {
    return this._frontend;
  }
}

export const processor = new IProcessor();
