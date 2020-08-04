import * as compress from 'compress-str';
import { EventEmitter } from 'events';
import { BaseSystemService } from './BaseSystemService';
import { attachDebugMethod, isDev } from '../../essential/requests';

export class BrowserStorage extends BaseSystemService {
  private readonly storageName = '__lindows__';
  private data: any = {};
  private useSession = false;

  constructor() {
    super();
    attachDebugMethod('BrowserStorage', this);
  }

  obsoleteBrowser() {
    location.href = 'unsupported-browser';
  }

  acceptTermsOfService() {
    location.href = 'terms-of-service';
  }

  async start() {
    if (!localStorage) {
      this.obsoleteBrowser();
      throw new Error('Browser storage does not exist');
    }

    const accepted = localStorage.getItem('terms-of-policy');
    if (accepted !== 'true') {
      this.acceptTermsOfService();
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
      return;
    }
    try {
      const rawData = await compress.gunzip(data);
      const parseData = JSON.parse(rawData);
      this.data = parseData;
    } catch (error) {
      if (isDev()) {
        console.error(error);
      }
      this.clear();
    }
  }

  async setItem(key: string, value: any): Promise<void> {
    if (key.length < 3) throw new Error('key must have more than 3 characters');
    this.data[key] = value;
    await this.save();
  }
  getItem(key: string) {
    return this.data[key];
  }

  getItemRaw(key: string) {
    if (!this.ok) return '';
    if (this.useSession && sessionStorage) {
      sessionStorage.getItem(key);
    } else {
      localStorage.getItem(key);
    }
  }

  setItemRaw(key: string, value: string): boolean {
    if (key === this.storageName) throw new Error(`Cannot use "${key}" as key`);
    if (!this.ok) return false;
    if (this.useSession && sessionStorage) {
      sessionStorage.setItem(key, value);
    } else {
      localStorage.setItem(key, value);
    }
    return true;
  }

  async save(): Promise<void> {
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

  get ok() {
    return !!localStorage || !!sessionStorage;
  }
}
