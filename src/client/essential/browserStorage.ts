import * as compress from 'compress-str';
import { EventEmitter } from 'events';

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
declare interface BrowserStorage {
  on(event: 'ready', listener: () => void): this;
}

class BrowserStorage extends EventEmitter {
  private readonly storageName = 'lindows';
  private ready = false;
  private data: any = {};

  constructor() {
    super();
    this.init();
  }

  private async init() {
    const data = localStorage.getItem(this.storageName);
    if (!data) {
      await this.save();
      return this;
    }
    await compress
      .gunzip(data)
      .then(data => {
        this.ready = true;

        try {
          const parseData = JSON.parse(data);
          this.data = parseData;
        } catch (error) {
          console.error('Cannot parse data object', data);
        }
      })
      .catch(() => this.save());

    this.ready = true;
    this.emit('ready');
  }

  store(key: string, value: any): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (key.length < 3) return reject(new Error('key must have more than 3 characters'));
      this.data[key] = value;
      try {
        await this.save();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
  getStorage(key: string) {
    return this.data[key];
  }

  save(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const data = JSON.stringify(this.data);
      try {
        const compressedData = await compress.gzip(data);
        this.ready = true;
        localStorage.setItem(this.storageName, compressedData);
        resolve();
      } catch (error) {
        reject(error);
        return;
      }
    });
  }

  load() {
    return this.data;
  }

  get isReady() {
    return this.ready;
  }
}

export const browserStorage = new BrowserStorage();
