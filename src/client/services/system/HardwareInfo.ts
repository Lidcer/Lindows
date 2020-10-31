import fingerprintjs from 'fingerprintjs2';
import { UAParser } from 'ua-parser-js';
import MobileDetect from 'mobile-detect';
import { BaseService, SystemServiceStatus } from '../internals/BaseSystemService';
import { SECOND } from '../../../shared/constants';

export class HardwareInfo extends BaseService {
  private result: fingerprintjs.Component[] = [];
  private _status = SystemServiceStatus.Uninitialized;

  init() {
    if (this._status !== SystemServiceStatus.Uninitialized) throw new Error('Service has already been initialized');
    this._status = SystemServiceStatus.WaitingForStart;

    const start = () => {
      this._status = SystemServiceStatus.Starting;
      return new Promise<void>((resolve, reject) => {
        let done = false;
        fingerprintjs.get(result => {
          this.result = result;
          this.injectPlugin();
          if (!done) {
            this._status = SystemServiceStatus.Ready;
            resolve();
          }
          done = true;
        });
        setTimeout(() => {
          if (!done) {
            this._status = SystemServiceStatus.Failed;
            reject();
          }
        }, SECOND * 10);
      });
    };

    const destroy = () => {
      if (this._status === SystemServiceStatus.Destroyed) throw new Error('Service has already been destroyed');
      this._status = SystemServiceStatus.Destroyed;
      window.removeEventListener('focus', this.setFocused);
      window.removeEventListener('blur', this.setUnFocused);
      if (!/windows/i.test(navigator.userAgent)) {
        window.removeEventListener('touchstart', this.setTouch);
      }
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

  private injectPlugin() {
    this.result.push({ key: 'usesTouch', value: false });
    this.result.push({ key: 'focused', value: undefined });
    this.result.push({ key: 'isStandalone', value: this.isStandalone });
    this.result.push({ key: 'supportsLetAndConst', value: this.supportsLetAndConst });
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', this.setFocused);
      window.addEventListener('blur', this.setUnFocused);
      if (!/windows/i.test(navigator.userAgent)) {
        window.addEventListener('touchstart', this.setTouch);
      }
    }
  }
  private setFocused = () => {
    const focused = this.result.find(f => f.key === 'focused');
    if (!focused) this.result.push({ key: 'focused', value: true });
    else focused.value = true;
  };
  private setUnFocused = () => {
    const focused = this.result.find(f => f.key === 'focused');
    if (!focused) this.result.push({ key: 'focused', value: false });
    else focused.value = false;
  };

  setTouch = () => {
    if (this.result) return;
    const usesTouch = this.result.find(f => f.key === 'usesTouch');
    if (!usesTouch) this.result.push({ key: 'usesTouch', value: true });
    else usesTouch.value = true;
  };

  get supportsLetAndConst() {
    try {
      return new Function('let x = true; return x;')();
    } catch {
      return false;
    }
  }

  get isStandalone() {
    return !!window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true; // safari
  }
  get focused() {
    const info = this.result.find(e => e.key === 'focused');
    return info ? info.value : null;
  }

  get usesTouch() {
    const info = this.result.find(e => e.key === 'usesTouch');
    return info ? info.value : null;
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

  get allResults() {
    return this.result;
  }
}
