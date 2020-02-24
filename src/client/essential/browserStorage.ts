import * as compress from 'compress-str';
import { EventEmitter } from 'events';

class BrowserStorage extends EventEmitter {
  private readonly storageName = 'lindows';
  private ready = false;
  private data = {};

  constructor() {
    super();
    const data = localStorage.getItem(this.storageName);
    if (!data) {
      this.save();
      return this;
    }
    compress
      .gunzip(data)
      .then(data => {
        this.ready = true;
        this.data = data;
      })
      .catch(() => this.save());
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
}

export const browserStorage = new BrowserStorage();
