import { BaseWindow, IBaseWindowProps, IManifest, MessageBox } from '../BaseWindow/BaseWindow';
import React from 'react';
import { random } from 'lodash';
import { randomString } from '../../../shared/utils';
import { attachDebugMethod } from '../../essential/requests';
import { GroupViewerCanvas, ICanvasInteraction } from './GroupViewerCanvas';
import { toPixelData } from '../../utils/screenshoter/src/index';
import { GroupViewerStyled } from './GroupViewerStyled';

export interface IGroupViewerState {
  userId: string;
  userPassword: string;

  connectUser: string;
  connectPassword: string;
  connecting: boolean;
  connectionEstablished: boolean;
  height: number;
  width: number;
}

export class GroupViewer extends BaseWindow<IGroupViewerState> {
  public static readonly onlyOne = true;
  public static manifest: IManifest = {
    fullAppName: 'Group Viewer',
    launchName: 'groupviewer',
    icon: '/assets/images/appsIcons/GroupViewer.svg',
  };

  private readonly EVENT_DELAY = 0;
  private selected: BaseWindow;
  private interval: number;
  private canvasInteraction?: ICanvasInteraction;
  private lastSentEvent = 0;
  private cursor = document.createElement('img');

  constructor(props: IBaseWindowProps) {
    super(
      props,
      {
        width: 500,
        height: 500,
      },
      {
        userId: '',
        userPassword: '',
        connectPassword: '',
        connectUser: '',
        connecting: false,
        connectionEstablished: false,
        height: 0,
        width: 0,
      },
    );
    this.cursor.src = '/assets/images//cursors/normal.svg';
    this.cursor.style.zIndex = `${Number.MAX_SAFE_INTEGER}`;
    this.cursor.style.position = 'fixed';
    this.cursor.style.transform = 'rotate(-20deg)';
    this.cursor.height = 50;
    attachDebugMethod('groupViewer', this);
  }

  async obtainId() {
    try {
      const id = await this.network.emitPromise<string, []>('group-viewer-ready');
      this.setVariables({ userId: id, userPassword: randomString(6) });
    } catch (error) {
      await MessageBox.Show(this, `Unable to get id ${error.message}`, 'Connection error');
      this.exit();
    }
  }

  shown() {
    this.obtainId();
    this.network.socket.on('disconnect', this.unexpectedDisconnect);
    this.network.socket.on('group-viewer-password-check', this.passwordCheck);
    this.network.socket.on('group-viewer-establish', this.establish);
    this.network.socket.on('group-viewer-display', this.onDisplay);
    this.network.socket.on('group-viewer-event', this.onEvent);
  }

  closing() {
    this.network.socket.removeEventListener('disconnect', this.unexpectedDisconnect);
    this.network.socket.removeEventListener('group-viewer-password-check', this.passwordCheck);
    this.network.socket.removeEventListener('group-viewer-establish', this.establish);
    this.network.socket.removeEventListener('group-viewer-display', this.onDisplay);
    this.network.socket.removeEventListener('group-viewer-event', this.onEvent);
    document.body.style.width = ``;
    document.body.style.height = ``;
    this.removeCursor();
    if (this.network.socket.connected) {
      this.network.socket.emit('group-viewer-clean');
    }
    // this.network.removeListener('group-viewer-connected', this.connectResponse);
  }

  removeCursor() {
    const parent = this.cursor.parentElement;
    if (parent) {
      parent.removeChild(this.cursor);
    }
  }
  showCursor(x: number, y: number) {
    const parent = this.cursor.parentElement;
    if (!parent) {
      document.body.append(this.cursor);
    }
    this.cursor.style.top = `${y - 25}px`;
    this.cursor.style.left = `${x - 15}px`;
  }

  onEvent = (type: string, properties: any) => {
    try {
      if (type === 'mousemove') {
        const mouseEvent = new MouseEvent('hover', {
          ...properties,
          clientX: properties.x,
          clientY: properties.y,
        });
        document.getElementById('app').dispatchEvent(mouseEvent);
        return this.showCursor(properties.x, properties.y);
      }
      let event: MouseEvent | KeyboardEvent | TouchEvent | undefined;
      if (type.includes('mouse') || type.includes('click')) {
        event = new MouseEvent(type, properties);
      } else if (type.includes('key')) {
        event = new KeyboardEvent(type, properties);
      } else if (type.includes('touch')) {
        event = new TouchEvent(type, properties);
      }

      if (event) {
        //const children = [...document.body.children];
        document.dispatchEvent(event);
      }
    } catch (error) {
      MessageBox.Show(this, error.message);
      this.exit();
    }
  };

  reGenerate() {
    this.setVariables({ userPassword: randomString(6) });
    this.network.socket.on('disconnect', this.unexpectedDisconnect);
    //  this.network.emit('group-viewer-ready', this.variables.userId);
  }

  unexpectedDisconnect = async () => {
    await MessageBox.Show(this, 'Unexpected disconnect occurred');
    this.exit();
  };

  async takeScreenshot() {
    try {
      document.body.style.width = `${window.innerWidth}px`;
      document.body.style.height = `${window.innerHeight}px`;
      const dataUrl = await toPixelData(document.body, { cacheBust: true, cache: true });
      return dataUrl;
    } catch (error) {
      console.log('an error occurred', error);
    }
    return new Uint8ClampedArray();
  }

  update = () => {
    this.forceUpdate();
  };

  onUserId = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const variables = { ...this.variables };
    variables.connectUser = ev.target.value;
    this.setVariables(variables);
  };

  onPasswordId = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const variables = { ...this.variables };
    variables.connectPassword = ev.target.value;
    this.setVariables(variables);
  };
  connect = async () => {
    if (this.variables.connecting) return;
    if (this.variables.connectUser && this.variables.connectPassword) {
      this.setVariables({ connecting: true });
      try {
        const exist = await this.network.emitPromise<string, [string, string]>(
          'group-viewer-connect',
          this.variables.connectUser,
          this.variables.connectPassword,
        );
        if (!exist) {
          MessageBox.Show(this, 'Id was not found');
          this.setVariables({ connecting: false });
        }
      } catch (error) {
        MessageBox.Show(this, error.message);
      }
    }
  };
  establish = (ok: boolean) => {
    if (!ok) {
      this.variables.connecting = false;
      return;
    }

    if (this.variables.connecting) {
      const variables = { ...this.variables };
      variables.connectionEstablished = true;
      this.setVariables(variables);

      this.canvasInteraction.addEventListiner('mousemove', (ev: MouseEvent) => {
        const date = Date.now();
        if (this.lastSentEvent + this.EVENT_DELAY < date) {
          this.lastSentEvent = date;
          if (this.network.socket.connected) {
            const { left, top } = (ev.target as HTMLCanvasElement).getBoundingClientRect();

            this.network.socket.emit('group-viewer-event', 'mousemove', {
              x: ev.clientX - left,
              y: ev.clientY - top,
              pageX: ev.pageX,
              pageY: ev.pageY,
              offsetX: ev.offsetX,
              offsetY: ev.offsetY,
              bubbles: ev.bubbles,
              button: ev.button,
              clientX: ev.clientX,
              clientY: ev.clientY,
              altKey: ev.altKey,
              screenX: ev.screenX,
              screenY: ev.screenY,
            });
          }
        }
      });

      this.canvasInteraction.addEventListiner('mousedown', (ev: MouseEvent) => {
        const date = Date.now();
        if (this.lastSentEvent + this.EVENT_DELAY < date) {
          this.lastSentEvent = date;
          if (this.network.socket.connected) {
            const { left, top } = (ev.target as HTMLCanvasElement).getBoundingClientRect();

            this.network.socket.emit('group-viewer-event', 'mousedown', {
              x: ev.clientX - left,
              y: ev.clientY - top,
              pageX: ev.pageX,
              pageY: ev.pageY,
              offsetX: ev.offsetX,
              offsetY: ev.offsetY,
              bubbles: ev.bubbles,
              button: ev.button,
              clientX: ev.clientX,
              clientY: ev.clientY,
              altKey: ev.altKey,
              screenX: ev.screenX,
              screenY: ev.screenY,
            });
          }
        }
      });

      this.canvasInteraction.addEventListiner('mouseup', (ev: MouseEvent) => {
        const date = Date.now();
        if (this.lastSentEvent + this.EVENT_DELAY < date) {
          this.lastSentEvent = date;
          if (this.network.socket.connected) {
            const { left, top } = (ev.target as HTMLCanvasElement).getBoundingClientRect();

            this.network.socket.emit('group-viewer-event', 'mouseup', {
              x: ev.clientX - left,
              y: ev.clientY - top,
              pageX: ev.pageX,
              pageY: ev.pageY,
              offsetX: ev.offsetX,
              offsetY: ev.offsetY,
              bubbles: ev.bubbles,
              button: ev.button,
              clientX: ev.clientX,
              clientY: ev.clientY,
              altKey: ev.altKey,
              screenX: ev.screenX,
              screenY: ev.screenY,
            });
          }
        }
      });

      this.canvasInteraction.addEventListiner('click', (ev: MouseEvent) => {
        const date = Date.now();
        if (this.lastSentEvent + this.EVENT_DELAY < date) {
          this.lastSentEvent = date;
          if (this.network.socket.connected) {
            const { left, top } = (ev.target as HTMLCanvasElement).getBoundingClientRect();

            this.network.socket.emit('group-viewer-event', 'click', {
              x: ev.clientX - left,
              y: ev.clientY - top,
              pageX: ev.pageX,
              pageY: ev.pageY,
              offsetX: ev.offsetX,
              offsetY: ev.offsetY,
              bubbles: ev.bubbles,
              button: ev.button,
              clientX: ev.clientX,
              clientY: ev.clientY,
              altKey: ev.altKey,
              screenX: ev.screenX,
              screenY: ev.screenY,
            });
          }
        }
      });

      this.canvasInteraction.addEventListiner('keypress', (ev: KeyboardEvent) => {
        const date = Date.now();
        if (this.lastSentEvent + this.EVENT_DELAY < date) {
          this.lastSentEvent = date;
          if (this.network.socket.connected) {
            this.network.socket.emit('group-viewer-event', 'keypress', {
              altKey: ev.altKey,
              bubbles: ev.bubbles,
              char: ev.char,
              ctrlKey: ev.ctrlKey,
              key: ev.key,
              keyCode: ev.keyCode,
            });
          }
        }
      });

      this.canvasInteraction.addEventListiner('keyup', (ev: KeyboardEvent) => {
        const date = Date.now();
        if (this.lastSentEvent + this.EVENT_DELAY < date) {
          this.lastSentEvent = date;
          if (this.network.socket.connected) {
            this.network.socket.emit('group-viewer-event', 'keyup', {
              altKey: ev.altKey,
              bubbles: ev.bubbles,
              char: ev.char,
              ctrlKey: ev.ctrlKey,
              key: ev.key,
              keyCode: ev.keyCode,
            });
          }
        }
      });
      this.canvasInteraction.addEventListiner('keydown', (ev: KeyboardEvent) => {
        const date = Date.now();
        if (this.lastSentEvent + this.EVENT_DELAY < date) {
          this.lastSentEvent = date;
          if (this.network.socket.connected) {
            this.network.socket.emit('group-viewer-event', 'keydown', {
              altKey: ev.altKey,
              bubbles: ev.bubbles,
              char: ev.char,
              ctrlKey: ev.ctrlKey,
              key: ev.key,
              keyCode: ev.keyCode,
            });
          }
        }
      });
    } else {
      this.minimize();
      this.stream();
    }
  };

  stream = async () => {
    const base = await this.takeScreenshot();
    const bounds = {
      height: window.innerHeight,
      width: window.innerWidth,
    };

    try {
      await this.network.emitPromise('group-viewer-screen', base.buffer, bounds);
    } catch (error) {
      MessageBox.Show(this, error.message);
      if (this.minimized) {
        this.minimized;
      }
      return;
    }

    requestAnimationFrame(this.stream);
  };

  onDisplay = (data: ArrayBufferLike, bounds: { height: number; width: number }) => {
    const variables = { ...this.variables };
    if (this.canvasInteraction && this.canvasInteraction.ctx) {
      this.canvasInteraction.height(bounds.height);
      this.canvasInteraction.width(bounds.width);

      try {
        const uac = new Uint8ClampedArray(new Uint8Array(data), bounds.width, bounds.height);
        const dat = new ImageData(uac, bounds.width, bounds.height);
        this.canvasInteraction.ctx.putImageData(dat, 0, 0);
      } catch (error) {
        //warn
        console.error(error);
      }
    }
    // variables.displaying = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/g,'');
    // variables.height = bounds.height;
    // variables.width = bounds.width;
    this.setVariables(variables);
  };

  connectResponse(id: string, boolean: boolean) {
    console.log(id, boolean);
  }

  passwordCheck = (password: string, socketId: string) => {
    const result = password === this.variables.userPassword;
    this.network.socket.emit('group-viewer-password-response', result, socketId);
  };

  renderInside() {
    if (this.minimized) return null;
    if (this.variables.connectionEstablished) {
      return (
        <GroupViewerCanvas canvasInteraction={canvasInteraction => (this.canvasInteraction = canvasInteraction)} />
      );
      //return <iframe style={{width: this.variables.width, height: this.variables.height}} srcDoc={this.variables.displaying}></iframe>
      //return <div  style={{width: this.variables.width, height: this.variables.height}} dangerouslySetInnerHTML={{ __html:this.variables.displaying}}/>
    }

    const e = (
      <div style={{ border: '1px solid blue' }}>
        <div>
          <span>User ID:</span>
          <input type='text' onChange={this.onUserId} value={this.variables.connectUser} />
        </div>
        <div>
          <span>User password:</span>
          <input type='text' onChange={this.onPasswordId} value={this.variables.connectPassword} />
        </div>
        <button onClick={this.connect}>Connect</button>
      </div>
    );

    return (
      <GroupViewerStyled>
        <div style={{ border: '1px solid orange' }}>
          <div>
            <span>User ID:</span>
            <input type='text' value={this.variables.userId} readOnly />
          </div>
          <div>
            <span>User password:</span>
            <input type='text' value={this.variables.userPassword} readOnly />
          </div>
        </div>

        {this.variables.connecting ? null : e}
      </GroupViewerStyled>
    );
  }
}
