import * as compress from 'compress-str';
import { BaseSystemService, SystemServiceStatus } from './BaseSystemService';
import { attachDebugMethod, isDev } from '../../essential/requests';
import { inIframe } from '../../utils/util';
import { faThermometerQuarter } from '@fortawesome/free-solid-svg-icons';

export class BrowserStorage extends BaseSystemService {
  private readonly storageName = '__lindows__';
  private data: any = {};
  private useSession = false;
  private _status = SystemServiceStatus.Uninitialized;

  init() {
    if (this.status() !== SystemServiceStatus.Uninitialized) throw new Error('Service has already been initialized');
    this._status = SystemServiceStatus.WaitingForStart;

    const obsoleteBrowser = () => {
      location.href = 'unsupported-browser';
    };
    const start = async () => {
      if (this._status !== SystemServiceStatus.WaitingForStart) throw new Error('Service is not in state for start');
      if (!localStorage) {
        obsoleteBrowser();
        this._status = SystemServiceStatus.Failed;
        throw new Error('Browser storage does not exist');
      }

      if (inIframe()) {
        this._status = SystemServiceStatus.Ready;
        return;
      }

      let data = '';
      if (sessionStorage) {
        data = sessionStorage.getItem(this.storageName);
      }
      if (data) {
        this.useSession = true;
      } else {
        data = localStorage.getItem(this.storageName);
      }

      if (!data) {
        await this.save();
        this._status = SystemServiceStatus.Ready;
        return;
      }
      try {
        const rawData = await compress.gunzip(data);
        const parseData = JSON.parse(rawData);
        this.data = parseData;
      } catch (error) {
        if (DEVELOPMENT) {
          console.error(error);
        }
        this.clear();
      }
      this._status = SystemServiceStatus.Ready;
    };

    const destroy = () => {
      if (this._status === SystemServiceStatus.Destroyed) throw new Error('Service has already been destroyed');
      this._status = SystemServiceStatus.Destroyed;
    };

    return {
      start: start,
      destroy: destroy,
      status: this.status,
    };
  }

  status = () => {
    return this._status;
  };

  //This doesn't save
  setItemQuick<V = any>(key: string, value: V) {
    if (key.length < 3) throw new Error('key must have more than 3 characters');
    this.data[key] = value;
  }
  async setItem<V = any>(key: string, value: V): Promise<void> {
    this.setItemQuick(key, value);
    await this.save();
  }

  getItem<V = any>(key: string): V {
    return this.data[key];
  }

  getItemRaw(key: string) {
    if (this.status() !== SystemServiceStatus.Ready) return '';
    if (inIframe()) return undefined;
    if (this.useSession && sessionStorage) {
      return sessionStorage.getItem(key);
    } else {
      return localStorage.getItem(key);
    }
  }

  setItemRaw(key: string, value: string): boolean {
    if (key === this.storageName) throw new Error(`Cannot use "${key}" as key`);
    if (this.status() !== SystemServiceStatus.Ready) return false;
    if (inIframe()) return true;
    if (this.useSession && sessionStorage) {
      sessionStorage.setItem(key, value);
    } else {
      localStorage.setItem(key, value);
    }
    return true;
  }

  async save(): Promise<void> {
    if (inIframe()) return;
    const data = JSON.stringify(this.data);
    const compressedData = await compress.gzip(data);
    if (this.useSession && sessionStorage) {
      sessionStorage.setItem(this.storageName, compressedData);
    } else {
      localStorage.setItem(this.storageName, compressedData);
    }
  }

  load() {
    return this.data;
  }

  clear() {
    if (this.useSession) {
      sessionStorage.clear();
    } else {
      localStorage.clear();
    }
  }

  clearAll() {
    if (sessionStorage) {
      sessionStorage.clear();
    }
    if (localStorage) {
      localStorage.clear();
    }
  }
}
