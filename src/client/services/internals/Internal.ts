import { EventEmitter } from "events";
import { HardwareInfo } from "../system/HardwareInfo";
import { Broadcaster } from "./BroadcasterSystem";
import { Service, SystemServiceStatus } from "./BaseSystemService";
import { attachToWindowIfDev } from "../../essential/requests";
import { FileSystem } from "./FileSystem";
import { requestSystemSymbol } from "../../utils/FileSystemDirectory";
import { System } from "../system/System";

const systemSymbol = requestSystemSymbol();
export class Internal {
  private _eventEmitter = new EventEmitter();
  private _fileSystem: Service<FileSystem>;
  private _hardwareInfo: Service<HardwareInfo>;
  private _broadcaster: Service<Broadcaster>;
  private _system: System;
  private isReady = false;
  private _readyToBoot = false;

  constructor() {
    attachToWindowIfDev("internal", this);
  }
  private failedServiceInternals() {
    let _status = SystemServiceStatus.Failed;
    const mockInternal: Service<any>["internalMethods"] = {
      start: () => {},
      destroy: () => {
        _status = SystemServiceStatus.Destroyed;
      },
      status: () => {
        return _status;
      },
    };
    return mockInternal;
  }

  async init() {
    this._fileSystem = await this.initService(new FileSystem(this), "FileSystem");
    this._hardwareInfo = await this.initService(new HardwareInfo(), "HardwareInfo");
    this._broadcaster = await this.initService(new Broadcaster(), "Broadcaster");

    this._readyToBoot = true;

    this._system = new System(this, () => {
      this.isReady = true;
      this._eventEmitter.emit("allReady");
    });
    this._eventEmitter.emit("readyToBoot", this);
  }
  private emitServiceStatus(service: Service<any>, serviceName: string) {
    if (!service.internalMethods || service.internalMethods.status() === SystemServiceStatus.Failed) {
      this._eventEmitter.emit("onServiceFailed", serviceName);
      return;
    }
    this._eventEmitter.emit("onServiceReady", serviceName);
  }

  // @ts-ignorea
  private async initService<S extends Service>(service: S, name: string) {
    const systemInternal: Service<S> = {
      service,
      internalMethods: this.failedServiceInternals(),
    };
    try {
      const internal = systemInternal.service.init();
      systemInternal.internalMethods = internal;
      await internal.start();
    } catch (error) {
      DEV && console.error(error);
    }

    this.emitServiceStatus(systemInternal, name);
    return systemInternal;
  }

  on(event: "onServiceReady", listener: (name: string) => void): void;
  on(event: "onServiceFailed", listener: (name: string) => void): void;
  on(event: "allReady", listener: () => void): void;
  on(event: "readyToBoot", listener: () => void): void;
  on(event: string, listener: (...args: any[]) => void): void {
    this._eventEmitter.on(event, listener);
  }

  removeListener(event: "onServiceReady", listener: (name: string) => void): void;
  removeListener(event: "onServiceFailed", listener: (name: string) => void): void;
  removeListener(event: "allReady", listener: () => void): void;
  removeListener(event: "readyToBoot", listener: () => void): void;
  removeListener(event: string, listener: (...args: any[]) => void) {
    this._eventEmitter.removeListener(event, listener);
  }
  get system() {
    return this._system;
  }

  get ready() {
    return this.isReady;
  }
  get readyToBoot() {
    return this._readyToBoot;
  }
  get hardwareInfo() {
    return this._hardwareInfo.service;
  }

  get broadcaster() {
    return this._broadcaster.service;
  }

  get fileSystem() {
    return this._fileSystem.service;
  }

  get systemSymbol() {
    return systemSymbol;
  }
}

export const internal = new Internal();
internal.init();
