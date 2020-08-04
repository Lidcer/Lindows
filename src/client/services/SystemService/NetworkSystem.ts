import io from 'socket.io-client';
import { attachDebugMethod } from '../../essential/requests';
import fingerprintjs from 'fingerprintjs2';
import { EventEmitter } from 'events';
import { SECOND } from '../../../shared/constants';
import { BaseSystemService } from './BaseSystemService';
import { Fingerpriner } from './FingerprinerSystem';

export class Network extends BaseSystemService {
  private _socket: SocketIOClient.Socket;
  private eventEmitter = new EventEmitter();
  private windowTabs: Window[] = [];

  constructor(private fingerpriner: Fingerpriner) {
    super();
    attachDebugMethod('network', this);
  }

  start = async () => {
    return new Promise<void>((resolve, reject) => {
      const replaceLink = (link: string) => {
        if (!link) return '';
        link = link.replace(/\${origin}/g, origin);
        link = link.replace(/\${location.host}/g, location.host);
        link = link.replace(/\${location.hostname}/g, location.hostname);
        return link;
      };

      this._socket = io(origin);
      this._socket.on('connect', () => {
        this.connection();
        resolve();
      });

      setTimeout(() => {
        if (!this._socket.connected) {
          reject(new Error('Unable to establish connection'));
        }
      }, SECOND * 10);

      this._socket.on('redirect', (redirectLink: string) => window.location.replace(replaceLink(redirectLink)));
      this._socket.on('open-new-tab', (redirectLink: string) => {
        this.windowTabs.push(window.open(replaceLink(redirectLink), '_blank'));
      });

      this._socket.on('admin-event-log-report', (redirectLink: string) => {
        console.error('this should not be visible');
      });

      this._socket.on('authenticate-failed', (message: string) => {
        console.error(message);
      });

      this._socket.on('disconnect', () => {
        this.emit('connection');
      });

      this._socket.on('take-fingerprint', (message: string) => {
        if (localStorage.getItem('terms-of-policy') !== 'true') return;
        this._socket.emit('fingerprint-result', this.fingerpriner.allResults);
      });
      this._socket.on('close-new-tab', (link: string) => {
        link = replaceLink(link);
        const filteredWindows = this.windowTabs.filter(
          w =>
            w.origin === link || w.location.host === link || w.location.hostname === link || w.location.href === link,
        );
        for (const w of filteredWindows) {
          const indexOf = this.windowTabs.indexOf(w);
          if (indexOf !== -1) this.windowTabs.splice(indexOf, 1);
          w.close();
        }
      });
    });
  };

  destroy() {
    this._socket.disconnect();
  }

  on(event: 'connection', listener: (object: this) => void): void;
  on(event: 'disconnect', listener: (object: this) => void): void;
  on(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  private emit(event: 'connection', ...args: any[]): void;
  private emit(event: 'disconnect', ...args: any[]): void;
  private emit(event: string | symbol, ...args: any[]) {
    this.eventEmitter.emit.apply(this.eventEmitter, [event, ...args]);
  }

  authenticate = (token: string) => {
    this.socket.emit('authenticate', token);
  };

  unauthenticate = () => {
    this.socket.emit('unauthenticate');
  };

  connection = () => {
    this.emit('connection');
  };

  get socket() {
    return this._socket;
  }
}
