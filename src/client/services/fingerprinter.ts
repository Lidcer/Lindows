import { EventEmitter } from 'events';
import fingerprintjs from 'fingerprintjs2';
import { UAParser } from 'ua-parser-js';
import MobileDetect from 'mobile-detect';

export declare interface IFingerpriner {
  on(event: 'ready', listener: (object: this) => void): this;
}

export class IFingerpriner extends EventEmitter {
  private result: any[] = [];
  private ready = false;

  constructor() {
    super();
    fingerprintjs.get(result => {
      this.result = result;
      this.ready = true;
      this.emit('ready', this);
    });
  }

  get isReady() {
    return this.ready;
  }

  get mobile() {
    const info = this.result.find(e => e.key === 'userAgent');
    if (info) return new MobileDetect(info.value);
    return null;
  }

  get userAgent() {
    const info = this.result.find(e => e.key === 'userAgent');
    if (!info) return null;
    return new UAParser(info.value);
  }

  get webdriver(): string {
    const info = this.result.find(e => e.key === 'webdriver');
    return info ? info.value : null;
  }

  get language(): string {
    const info = this.result.find(e => e.key === 'language');
    return info ? info.value : null;
  }

  get colorDepth(): number {
    const info = this.result.find(e => e.key === 'colorDepth');
    return info ? info.value : null;
  }

  get deviceMemory(): number {
    const info = this.result.find(e => e.key === 'deviceMemory');
    return info ? info.value : null;
  }

  get hardwareConcurrency(): number {
    const info = this.result.find(e => e.key === 'hardwareConcurrency');
    return info ? info.value : null;
  }

  get screenResolution(): [number, number] {
    const info = this.result.find(e => e.key === 'screenResolution');
    return info ? info.value : null;
  }

  get availableScreenResolution(): [number, number] {
    const info = this.result.find(e => e.key === 'screenResolution');
    return info ? info.value : null;
  }

  get timezoneOffset(): number {
    const info = this.result.find(e => e.key === 'timezoneOffset');
    return info ? info.value : null;
  }

  get timezone(): string {
    const info = this.result.find(e => e.key === 'timezone');
    return info ? info.value : null;
  }

  get sessionStorage(): boolean {
    const info = this.result.find(e => e.key === 'sessionStorage');
    return info ? info.value : null;
  }

  get localStorage(): boolean {
    const info = this.result.find(e => e.key === 'localStorage');
    return info ? info.value : null;
  }

  get indexedDb(): boolean {
    const info = this.result.find(e => e.key === 'indexedDb');
    return info ? info.value : null;
  }

  get addBehavior(): boolean {
    const info = this.result.find(e => e.key === 'addBehavior');
    return info ? info.value : null;
  }

  get openDatabase(): boolean {
    const info = this.result.find(e => e.key === 'openDatabase');
    return info ? info.value : null;
  }

  get cpuClass(): string {
    const info = this.result.find(e => e.key === 'cpuClass');
    return info ? info.value : null;
  }

  get platform(): string {
    const info = this.result.find(e => e.key === 'platform');
    return info ? info.value : null;
  }

  get plugins(): [string, string, string[]] {
    const info = this.result.find(e => e.key === 'plugins');
    return info ? info.value : null;
  }

  get canvas(): string {
    const info = this.result.find(e => e.key === 'canvas');
    return info ? info.value : null;
  }

  get webgl(): string[] {
    const info = this.result.find(e => e.key === 'webgl');
    return info ? info.value : null;
  }

  get webglVendorAndRenderer(): string {
    const info = this.result.find(e => e.key === 'webglVendorAndRenderer');
    return info ? info.value : null;
  }

  get adBlock(): boolean {
    const info = this.result.find(e => e.key === 'adBlock');
    return info ? info.value : null;
  }

  get hasLiedLanguages(): boolean {
    const info = this.result.find(e => e.key === 'hasLiedLanguages');
    return info ? info.value : null;
  }

  get hasLiedResolution(): boolean {
    const info = this.result.find(e => e.key === 'hasLiedResolution');
    return info ? info.value : null;
  }

  get hasLiedOs(): boolean {
    const info = this.result.find(e => e.key === 'hasLiedOs');
    return info ? info.value : null;
  }

  get hasLiedBrowser(): boolean {
    const info = this.result.find(e => e.key === 'hasLiedBrowser');
    return info ? info.value : null;
  }

  get touchSupport(): [number, boolean, boolean] {
    const info = this.result.find(e => e.key === 'touchSupport');
    return info ? info.value : null;
  }

  get fonts(): string[] {
    const info = this.result.find(e => e.key === 'fonts');
    return info ? info.value : null;
  }

  get audio(): string {
    const info = this.result.find(e => e.key === 'audio');
    return info ? info.value : null;
  }
}
