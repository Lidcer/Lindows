import React from 'react';
import { mousePointer, CursorType } from '../../components/Cursor/Cursor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
  faTimes,
  faWindowMaximize,
  faWindowMinimize,
  faWindowRestore,
  faFile,
} from '@fortawesome/free-solid-svg-icons';
import { navBarPos } from '../../components/TaskBar/TaskBar';
import { services } from '../../services/SystemService/ServiceHandler';
import { random, clamp } from 'lodash';
import { IBaseWindowEmitter, WindowEvent, IBaseWindowEmitterType, IBaseWindowKeyboard } from './WindowEvent';
import { ReactGeneratorFunction } from '../../essential/apps';
import { EventEmitter } from 'events';
import { MsgBoxIcon, MsgBoxButton, MsgBoxButtons, MsgBoxCaption, LWindow, LWindowContent, LWindowUpHover, LWindowBottomHover, LWindowLeftHover, LWindowRightHover, LWindowUpLeftHover, LWindowUpRightHover, LWindowBottomLeftHover, LWindowBottomRightHover, TitleBarButtonDisabled, TitleBarExit, TitleBarIcon, TitleBar, TitleBarRight, TitleBarTitleWithIcon, TitleBarButtonHover, LWindowFullscreen, LWindowBottom, LWindowTop, LWindowRight, LWindowLeft, MsgBoxContent } from './baseWindowStyled';
import { alwaysOnTop as alwaysOnTopIndex } from '../../Constants';

const DEFAULT_APP_IMAGE = '/assets/images/unknown-app.svg';

export interface IBaseWindowProps {
  id: number;
  onlyOne?: boolean;
  windowType?: 'borderless' | 'windowed' | 'fullscreen';
  sudo?: boolean;
}

let lastX = random(0, window.innerWidth * 0.25);
let lastY = random(0, window.innerHeight * 0.25);

export interface IWindow {
  startPos?: 'center' | 'random' | 'card';
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  windowType?: 'borderless' | 'windowed' | 'fullscreen';
  resizable?: boolean;
  closeButton?: 'shown' | 'disabled' | 'hidden';
  maximizeRestoreDownButton?: 'shown' | 'disabled' | 'hidden';
  minimizeButton?: 'shown' | 'disabled' | 'hidden';
  redirectToWebpageButton?: string;
  maximized?: boolean;
  minimized?: boolean;
  image?: string;
  showIcon?: boolean;
  title?: string;
  alwaysOnTop?: boolean;
}

export interface IBaseWindowState<A> {
  options: IWindow;
  animate: 'none' | 'in' | 'out' | 'minimize' | 'unMinimize';
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  variables?: A;
}

export interface IManifest {
  launchName: string; // lowercase cannot without spaces
  fullAppName: string; // displayed name on app
  icon: string; // Default app icon
}

export interface IBounds {
  y: number;
  x: number;
  height: number;
  width: number;
}

declare type ResizingType =
  | 'none'
  | 'left'
  | 'right'
  | 'up'
  | 'bottom'
  | 'left-up'
  | 'right-up'
  | 'left-bottom'
  | 'right-bottom';

// eslint-disable-next-line
export interface BaseWindow<B = {}> extends React.Component<IBaseWindowProps, IBaseWindowState<B>> {
  renderInside(): JSX.Element;

  load?(): void | Promise<void>;
  closed?(): void | Promise<void>;
  closing?(): void | Promise<void>;
  onKeyDown?(event: KeyboardEvent):void
  onKeyPress?(event: KeyboardEvent):void
  onKeyUp?(event: KeyboardEvent):void

  resize?(width: number, height: number): void;
}

export abstract class BaseWindow<B> extends React.Component<IBaseWindowProps, IBaseWindowState<B>> {
  private minHeight = 250;
  private minWidth = 250;
  private titleBarOffsetX: number;
  private titleBarOffsetY: number;
  private isWindowMoving = false;
  private lastX = 0;
  private lastY = 0;
  private speedX = 0;
  private speedY = 0;
  private monitorInterval: number;
  private resizeType: ResizingType = 'none';
  private ref: React.RefObject<HTMLDivElement>;
  private wasActive = false;
  private ignoreMouse = false;
  private phone = null;
  private _mounted = false;
  private manifest: IManifest;
  private windowEmitter: IBaseWindowEmitter;
  private started = false;
  private memorizedState = {
    x: 0,
    y: 0,
  };
  private timeouts: (NodeJS.Timeout | number)[] = [];

  constructor(props: IBaseWindowProps, manifest: IManifest, options?: IWindow, variables?: Readonly<B>) {
    super(props);
    this.windowEmitter = new IBaseWindowEmitter(this);
    this.manifest = manifest;
    Object.freeze(this.manifest);
    this.phone = services.fingerprinter.mobile.phone();
    this.ref = React.createRef();
    this.minWidth = options && options.minWidth ? options.minWidth : this.minWidth;
    this.minHeight = options && options.minHeight ? options.minHeight : this.minHeight;

    let width = options && options.width ? options.width : this.minWidth;
    let height = options && options.height ? options.height : this.minHeight;
    if (height < this.minHeight) height = this.minHeight;
    if (width < this.minWidth) width = this.minWidth;

    width = clamp(width, 0, window.innerWidth);
    height = clamp(height, 0, window.innerHeight);
    const verifiedOptions = this.verifyOptions(options);
    let x = 0;
    let y = 0;
    const offset = 20;
    if (verifiedOptions.startPos === 'random') {
      x = random(offset, window.innerWidth - offset - width);
      y = random(offset, window.innerHeight - offset - height);
    } else if (verifiedOptions.startPos === 'center') {
      x = window.innerWidth * 0.5 - width * 0.5;
      y = window.innerHeight * 0.5 - height * 0.5;
    } else if (verifiedOptions.startPos === 'card') {
      x = lastX + offset;
      y = lastY + offset;
      if (y > window.innerHeight - height || x > window.innerWidth - width) {
        x = random(offset, window.innerHeight * 0.5);
        y = random(offset, window.innerWidth * 0.5);
      }
    }
    x = Math.floor(x);
    y = Math.floor(y);

    lastX = x;
    lastY = y;

    this.state = {
      options: verifiedOptions,
      animate: 'in',
      width,
      height,
      x,
      y,
      active: false,
      variables,
    };

    //Override protection
    setTimeout(async () => {
      //This has to be in set timeout because baseWindow needs to be shown before showing message boxes
      if (this.componentDidMount !== BaseWindow.prototype.componentDidMount) {
        this.exit();
        await MessageBox.Show(
          this,
          'System.overrideProtection exception has occurred. You cannot override componentDidMount!" Please consider using load() function.',
          'Error',
          MessageBoxButtons.OK,
          MessageBoxIcon.Error,
        );
        this.componentDidMount = BaseWindow.prototype.componentDidMount;
      } else if (this.componentWillUnmount !== BaseWindow.prototype.componentWillUnmount) {
        this.exit();
        MessageBox.Show(
          this,
          'System.overrideProtection exception has occurred. You cannot override componentWillUnmount!" Please consider using closing() function.',
          'Error',
          MessageBoxButtons.OK,
          MessageBoxIcon.Error,
        );
        this.componentWillUnmount = BaseWindow.prototype.componentWillUnmount;
      } else if (this.componentWillUnmount !== BaseWindow.prototype.componentWillUnmount) {
        this.exit();
        MessageBox.Show(
          this,
          'System.overrideProtection exception has occurred. You cannot override render!" Please consider using renderInside() function.',
          'Error',
          MessageBoxButtons.OK,
          MessageBoxIcon.Error,
        );
        this.componentWillUnmount = BaseWindow.prototype.componentWillUnmount;
      }
    });
  }

  async componentDidMount() {
    if (this.load) {
      const promise = this.load();
      if (promise instanceof Promise) {
        try {
          await promise;
        } catch (error) {
          MessageBox.Show(this, error.message, 'Error', MessageBoxButtons.OK, MessageBoxIcon.Error);
          this.exit();
          return;
        }
      }
    }
    this.started = true;

    this._mounted = false;
    window.addEventListener('resize', this.onResize, false);

    window.addEventListener('mousedown', this.mouseDown, false);
    window.addEventListener('touchstart', this.touchStart, false);

    window.addEventListener('mousemove', this.mouseMove, false);
    window.addEventListener('touchmove', this.touchMove, false);

    window.addEventListener('mouseup', this.mouseUp, false);
    window.addEventListener('touchend', this.touchEnd, false);
    window.addEventListener('keydown', this.keyboard);
    window.addEventListener('keypress', this.keyboard);
    window.addEventListener('keyup', this.keyboard);

    services.processor.startProcess(this);
    this.changeActiveState(true);
    services.processor.makeActive(this);
    this.setState({ animate: 'in' });
    const t = setTimeout(() => {
      this.removeTimeout(t);
      this.setState({ animate: 'none' });
    }, 1000);
    this.timeouts.push(t);

    this.monitorInterval = setInterval(this.monitor);

    this.windowEmitter.emit('ready');
  }

  async componentWillUnmount() {
    if (this.closing) {
      const promise = this.closing();
      if (promise instanceof Promise) {
        try {
          await promise;
        } catch (error) {
          MessageBox.Show(this, error.message, 'Error', MessageBoxButtons.OK, MessageBoxIcon.Error);
          return;
        }
      }
    }
    this._mounted = true;
    window.removeEventListener('resize', this.onResize, false);

    window.removeEventListener('mousedown', this.mouseDown, false);
    window.removeEventListener('touchstart', this.touchStart, false);

    window.removeEventListener('mousemove', this.mouseMove, false);
    window.removeEventListener('touchmove', this.touchMove, false);

    window.removeEventListener('mouseup', this.mouseUp, false);
    window.removeEventListener('touchend', this.touchEnd, false);
    const timeouts = this.timeouts;
    for (const timeout of timeouts) {
      this.removeTimeout(timeout);
    }

    services.processor.killProcess(this);
    this.windowEmitter.removeAllListeners();
    clearInterval(this.monitorInterval);
    if (this.closed) {
      const promise = this.closed();
      if (promise instanceof Promise) {
        try {
          await promise;
        } catch (error) {
          MessageBox.Show(this, error.message, 'Error', MessageBoxButtons.OK, MessageBoxIcon.Error);
          return;
        }
      }
    }
  }

  render() {
    if (!this.started) return null;
    let WindowDiv = LWindow;

    if (this.state.options.windowType === 'fullscreen') {
      WindowDiv = LWindowFullscreen;
    } else if(this.state.options.maximized) {
      switch (navBarPos) {
        case 'bottom':
          WindowDiv = LWindowBottom;
        break;
        case 'top':
          WindowDiv = LWindowTop;
        break;
        case 'left':
          WindowDiv = LWindowLeft;
        break;
        case 'right':
          WindowDiv = LWindowRight;
        break;
        default:
          break;
      }
    } 

    return (
      <WindowDiv className={this.windowClass} ref={this.ref} style={this.getStyle()}>
        {this.renderResizable()}
        {this.renderTitleBar()}
        <LWindowContent>{this.giveView()}</LWindowContent>
      </WindowDiv>
    );
  }

  on(event: IBaseWindowEmitterType | '*', listener: (event: WindowEvent) => void) {
    return this.windowEmitter.on(event, listener);
  }

  private monitor = () => {
    if (!this.isWindowMoving) {
      const { x, y, corrected } = this.getFixedPos(this.state.x - this.speedX, this.state.y - this.speedY);
      if (x === this.state.x && y === this.state.y) return;

      if (corrected) {
        this.speedX = 0;
        this.speedY = 0;
      }

      this.setState({ x, y });

      const slidingAmount = 0.05;
      const autoAlign = 0.01;

      if (this.speedY > autoAlign) this.speedY = this.speedY - slidingAmount * this.speedY;
      else if (this.speedY < -autoAlign) this.speedY = this.speedY + slidingAmount * -this.speedY;
      else this.speedY = this.speedY = 0;

      if (this.speedX > autoAlign) this.speedX = this.speedX - slidingAmount * this.speedX;
      else if (this.speedX < -autoAlign) this.speedX = this.speedX + slidingAmount * -this.speedX;
      else this.speedX = this.speedX = 0;
    }
  };

  private renderTitleBar() {
    if (this.state.options.windowType === 'windowed') {
      return (
        <TitleBar
          style={!this.active ? { backgroundColor: 'rgba(255, 255, 255, 0.25)'} : null}
          onMouseDown={e => this.onTitleBarMouseDown(e.nativeEvent)}
          onTouchStart={e => this.onTitleBarTouchStart(e.nativeEvent)}
          onTouchEnd={() => {
            if (this.ignoreMouse) this.ignoreMouse = false;
          }}
        >
          {this.renderIcon()}
          {this.renderTitleBarTitle()}
          <TitleBarRight>
            {this.renderRedirectToWebpage()}
            {this.renderMinimize()}
            {this.renderMaximizeRestoreDown()}
            {this.renderExit()}
          </TitleBarRight>
        </TitleBar>
      );
    }
    return null;
  }
  private renderIcon() {
    if (this.state.options.showIcon) {
      return <TitleBarIcon src={this.state.options.image} alt='App Icon' />;
    }
    return null;
  }

  private renderTitleBarTitle() {
    const tClass = this.state.options.showIcon ? 'title-bar-title-with-icon' : 'title-bar-title';

    if (this.state.options.title) {
 
      if (this.state.options.showIcon) {
        return <TitleBarTitleWithIcon>{this.state.options.title}</TitleBarTitleWithIcon>
      } else {
        return <TitleBarExit>{this.state.options.title}</TitleBarExit>
      }

    }
    return null;
  }

  private renderExit() {
    if (this.state.options.closeButton === 'shown') {
      return (
        <TitleBarExit onClick={this.buttonExit}>
          <FontAwesomeIcon icon={faTimes}></FontAwesomeIcon>
        </TitleBarExit>
      );
    } else if (this.state.options.closeButton === 'disabled') {
      return (
        <TitleBarButtonDisabled>
          <FontAwesomeIcon icon={faTimes}></FontAwesomeIcon>
        </TitleBarButtonDisabled>
      );
    }
    return null;
  }

  private renderRedirectToWebpage = () => {
    if (!!this.state.options.redirectToWebpageButton) {
      return (
        <TitleBarButtonHover onClick={this.redirect}>
          <FontAwesomeIcon icon={faFile}></FontAwesomeIcon>
        </TitleBarButtonHover>
      );
    } else {
      return null;
    }
  };

  private redirect = async () => {
    this.buttonMinimize();
    try {
      await services.processor.saveState();
      document.location.href = this.state.options.redirectToWebpageButton;
    } catch (error) {
      MessageBox.Show(this, `Unable to launch application ${error.message}`);
    }
  };

  private renderMaximizeRestoreDown() {
    const icon = this.state.options.maximized ? faWindowRestore : faWindowMaximize;
    const buttonFunction = this.state.options.maximized ? this.buttonMaximize : this.buttonRestore;

    if (this.state.options.maximizeRestoreDownButton === 'shown') {
      return (
        <TitleBarButtonHover onClick={buttonFunction}>
          <FontAwesomeIcon icon={icon}></FontAwesomeIcon>
        </TitleBarButtonHover>
      );
    } else if (this.state.options.maximizeRestoreDownButton === 'disabled') {
      return (
        <TitleBarButtonDisabled>
          <FontAwesomeIcon icon={icon}></FontAwesomeIcon>
        </TitleBarButtonDisabled>
      );
    }
    return null;
  }

  private renderMinimize() {
    if (this.state.options.minimizeButton === 'shown') {
      return (
        <TitleBarButtonHover
          onMouseDown={() => {
            this.isWindowMoving = false;
          }}
          onClick={this.buttonMinimize}
        >
          <FontAwesomeIcon icon={faWindowMinimize}></FontAwesomeIcon>
        </TitleBarButtonHover>
      );
    } else if (this.state.options.minimizeButton === 'disabled') {
      return (
        <TitleBarButtonDisabled>
          <FontAwesomeIcon icon={faWindowMinimize}></FontAwesomeIcon>
        </TitleBarButtonDisabled>
      );
    }
    return null;
  }

  private renderResizable() {
    if (this.state.options.resizable && this.state.options.windowType === 'windowed') {
      return (
        <>
          <LWindowUpHover
            onMouseEnter={() => this.mouseResize('verticalResize')}
            onMouseLeave={this.mouseResizeLeave}
            onMouseDown={() => this.setResize('up')}
            onTouchStart={() => this.setResize('up')}
          ></LWindowUpHover>
          <LWindowBottomHover
            onMouseEnter={() => this.mouseResize('verticalResize')}
            onMouseLeave={this.mouseResizeLeave}
            onMouseDown={() => this.setResize('bottom')}
            onTouchStart={() => this.setResize('bottom')}
          ></LWindowBottomHover>
          <LWindowLeftHover
            onMouseEnter={() => this.mouseResize('horizontalResize')}
            onMouseLeave={this.mouseResizeLeave}
            onMouseDown={() => this.setResize('left')}
            onTouchStart={() => this.setResize('left')}
          ></LWindowLeftHover>
          <LWindowRightHover
            onMouseEnter={() => this.mouseResize('horizontalResize')}
            onMouseLeave={this.mouseResizeLeave}
            onMouseDown={() => this.setResize('right')}
            onTouchStart={() => this.setResize('right')}
          ></LWindowRightHover>
          <LWindowUpLeftHover
            onMouseEnter={() => this.mouseResize('diagonalResize2')}
            onMouseLeave={this.mouseResizeLeave}
            onMouseDown={() => this.setResize('left-up')}
            onTouchStart={() => this.setResize('left-up')}
          ></LWindowUpLeftHover>
          <LWindowUpRightHover
            onMouseEnter={() => this.mouseResize('diagonalResize1')}
            onMouseLeave={this.mouseResizeLeave}
            onMouseDown={() => this.setResize('right-up')}
            onTouchStart={() => this.setResize('right-up')}
          ></LWindowUpRightHover>
          <LWindowBottomLeftHover
            onMouseEnter={() => this.mouseResize('diagonalResize1')}
            onMouseLeave={this.mouseResizeLeave}
            onMouseDown={() => this.setResize('left-bottom')}
            onTouchStart={() => this.setResize('left-bottom')}
          ></LWindowBottomLeftHover>
          <LWindowBottomRightHover
            onMouseEnter={() => this.mouseResize('diagonalResize2')}
            onMouseLeave={this.mouseResizeLeave}
            onMouseDown={() => this.setResize('right-bottom')}
            onTouchStart={() => this.setResize('right-bottom')}
          ></LWindowBottomRightHover>
        </>
      );
    }
    return null;
  }

  private mouseResize = (type: CursorType) => {
    if (!this.isWindowMoving) mousePointer.changeMouse(type);
  };
  private setResize = (resizeType: ResizingType) => {
    this.resizeType = resizeType;
  };

  private mouseResizeLeave = () => {
    if (this.resizeType === 'none') mousePointer.changeMouse('normal');
  };

  private onResize = () => {
    const { x, y } = this.getFixedPos();
    const width = clamp(this.state.width, 0, window.innerWidth);
    const height = clamp(this.state.height, 0, window.innerHeight);
    if (x !== this.state.x || y !== this.state.y || width !== this.state.width || height !== this.state.height) {
      this.setState({ x, y, width, height });
    }
  };

  private getFixedPos(xPos?: number, yPos?: number) {
    let x = xPos === undefined ? this.state.x : xPos;
    let y = yPos === undefined ? this.state.y : yPos;
    const bounding = this.ref.current.getBoundingClientRect();
    const maxY = window.innerHeight - bounding.height;
    const maxX = window.innerWidth - bounding.width;
    let corrected = false;
    if (x > maxX || y > maxY || x < 0 || y < 0) {
      corrected = true;
    }
    if (x > maxX) x = maxX;
    if (y > maxY) y = maxY;

    if (x < 0) x = 0;
    if (y < 0) y = 0;

    return { x, y, corrected };
  }

  private get windowClass() {
    switch (this.state.animate) {
      case 'in':
        return `animated jackInTheBox faster`;
      case 'out':
        return `animated zoomOut faster`;
      case 'minimize':
        return `animated bounceInUp faster`;
      case 'unMinimize':
        return `animated bounceOutDown faster`;
    }
    return '';
  }

  private giveView = () => {
    if (!this.renderInside) return <div>Missing content</div>;
    return this.renderInside();
  };

  private mouseMove = (event: MouseEvent) => {
    if (this.ignoreMouse) return;
    this.handleWindowMove(event.clientX, event.clientY);
  };

  private touchMove = (event: TouchEvent) => {
    this.handleWindowMove(event.touches[0].clientX, event.touches[0].clientY);
  };

  private handleWindowMove(clientX: number, clientY: number) {
    if (this.resizeType !== 'none' && !this.isWindowMoving) {
      let width = this.state.width;
      let height = this.state.height;
      let x = this.state.x;
      let y = this.state.y;
      const newX = clientX;
      const newY = clientY;
      const maxHeight = window.innerHeight;
      const maxWidth = window.innerWidth;

      switch (this.resizeType) {
        case 'right':
          if (newX >= window.innerWidth) break;
          width = newX - this.state.x;
          break;
        case 'left':
          if (newX <= 0) break;
          const tlWidth = this.state.x - clientX + this.state.width;
          if (tlWidth >= this.minWidth && tlWidth < maxWidth) {
            width = tlWidth;
            x = clientX;
          }
          break;

        case 'up':
          if (newY <= 0) break;
          const upHeight = this.state.y - clientY + this.state.height;
          if (upHeight >= this.minHeight && upHeight < maxHeight) {
            height = upHeight;
            y = clientY;
          }
          break;
        case 'bottom':
          if (newY >= window.innerHeight) break;
          height = clientY - this.state.y;
          break;
        case 'right-bottom':
          if (newX >= window.innerWidth) break;
          if (newY >= window.innerHeight) break;
          height = clientY - this.state.y;
          width = clientX - this.state.x;
          break;
        case 'left-bottom':
          if (newX <= 0) break;
          if (newY >= window.innerHeight) break;
          const lbWidth = this.state.x - clientX + this.state.width;
          height = clientY - this.state.y;
          if (lbWidth >= this.minWidth && lbWidth < maxWidth) {
            x = clientX;
            width = lbWidth;
          }
          break;
        case 'right-up':
          if (newX >= window.innerWidth) break;
          if (newY <= 0) break;
          const ruHeight = this.state.y - clientY + this.state.height;
          if (ruHeight >= this.minHeight && ruHeight < maxHeight) {
            height = ruHeight;
            y = clientY;
            width = clientX - this.state.x;
          }

          break;
        case 'left-up':
          if (newX <= 0) break;
          if (newY <= 0) break;
          const ltHeight = this.state.y - clientY + this.state.height;
          const ltWidth = this.state.x - clientX + this.state.width;
          if (ltWidth >= this.minWidth && ltWidth < maxWidth) {
            x = clientX;
            width = ltWidth;
          }
          if (ltHeight >= this.minHeight && ltHeight < maxHeight) {
            height = ltHeight;
            y = clientY;
          }

          break;
        default:
          break;
      }

      width = clamp(width, this.minWidth, maxWidth);
      height = clamp(height, this.minHeight, maxHeight);

      this.setState({ width, height, y, x });
      if (this.resize) this.resize(this.state.width, this.state.height);
    }

    if (this.isWindowMoving) {
      this.calculateSpeed(clientX, clientY);

      //prevents moving outside
      const { x, y } = this.getFixedPos(clientX - this.titleBarOffsetX, clientY - this.titleBarOffsetY);
      this.setState({ x, y });
    }
  }

  private mouseDown = (event: MouseEvent | TouchEvent) => {
    const div = this.ref.current as HTMLDivElement;
    const target = event.target as HTMLDivElement;
    if (div.contains(target)) this.changeActiveState(true);
    else this.changeActiveState(false);
  };

  private touchStart = (event: TouchEvent) => {
    this.ignoreMouse = true;
    this.mouseDown(event);
  };

  changeActiveState(active: boolean, doProcess = true) {
    if (this.state.active) this.wasActive = true;
    else this.wasActive = false;

    if (active !== this.state.active) {
      if (active) {
        this.windowEmitter.emit('focus');
        //const shouldPreventDefault = this.emitter.emit('focus');
        //if (!shouldPreventDefault && doProcess) return;
      } else if (!active) {
        this.windowEmitter.emit('blur');
        //const shouldPreventDefault = this.emitter.emit('blur');
        //if (!shouldPreventDefault && doProcess) return;
      }
      this.setState({ active });
    }
    if (active && doProcess) services.processor.makeActive(this);
  }

  private calculateSpeed(x: number, y: number) {
    this.speedX = this.lastX - x;
    this.speedY = this.lastY - y;
    this.lastY = y;
    this.lastX = x;
  }

  private mouseUp = (event: MouseEvent) => {
    this.resizeType = 'none';
    this.onTitleBarSetOffset(event.clientX, event.clientY, false);
  };

  private touchEnd = (event: TouchEvent) => {
    this.resizeType = 'none';

    if (event.touches[0]) this.onTitleBarSetOffset(event.touches[0].clientX, event.touches[0].clientY, false);
    else this.onTitleBarSetOffset(0, 0, false);
  };

  private onTitleBarMouseDown(event: MouseEvent) {
    const div = event.target as HTMLDivElement;
    if (div.tagName.toLowerCase() === 'span' || div.tagName.toLowerCase() === 'div')
      this.onTitleBarSetOffset(event.offsetX, event.offsetY);
  }
  private onTitleBarTouchStart = (event: TouchEvent) => {
    if (!this.ignoreMouse) this.ignoreMouse = true;
    if (event.targetTouches[0]) {
      const div = event.target as HTMLDivElement;
      if (div.tagName.toLowerCase() === 'span' || div.tagName.toLowerCase() === 'div') {
        const x = event.targetTouches[0].clientX - this.state.x;
        const y = event.targetTouches[0].clientY - this.state.y;
        this.onTitleBarSetOffset(x, y);
      }
    }
  };

  private onTitleBarSetOffset = (offsetX: number, offsetY: number, moving = true) => {
    this.isWindowMoving = moving;
    this.titleBarOffsetX = offsetX || 0;
    this.titleBarOffsetY = offsetY || 0;
  };

  private getStyle(): React.CSSProperties {
    let zIndex = 10;
    if (this.active) zIndex =  10000;
    if (this.state.options.alwaysOnTop) zIndex = alwaysOnTopIndex;
    if (this.state.options.maximized) {
      const scale = devicePixelRatio * 20;

      return {
        top: 0,
        left: 0,
        zIndex,
      };
    }

    return {
      top: this.state.y,
      left: this.state.x,
      height: this.state.height,
      width: this.state.width,
      zIndex,
    };
  }

  private buttonMinimize = () => {
    const shouldPrevent = this.windowEmitter.emit('buttonMinimize');
    if (!shouldPrevent) this.minimize();
  };

  minimize = () => {
    const options = { ...this.state.options };
    options.minimized = !options.minimized;

    this.setState({
      animate: options.minimized ? 'unMinimize' : 'minimize',
      options,
    });
  };

  private buttonExit = () => {
    const shouldContinue = this.windowEmitter.emit('buttonExit');
    if (!shouldContinue) this.exit();
  };

  exit = (): Promise<void> => {
    return new Promise(resolve => {
      this.windowEmitter.emit('exit');
      this.setState({
        animate: 'out',
      });
      const t = setTimeout(() => {
        services.processor.killProcess(this);
        this.removeTimeout(t);
        resolve();
      }, 200);
      this.timeouts.push(t);
    });
  };

  private buttonRestore = () => {
    const shouldPrevent = this.windowEmitter.emit('buttonMaximize');
    if (!shouldPrevent) this.maximizeRestoreDown();
  };

  private buttonMaximize = () => {
    const shouldPrevent = this.windowEmitter.emit('buttonMaximize');
    if (!shouldPrevent) this.maximizeRestoreDown();
  };

  maximizeRestoreDown = () => {
    const options = { ...this.state.options };
    options.maximized = !options.maximized;

    if (options.maximized || options.windowType === 'fullscreen') {
      this.memorizedState = {
        x: this.state.x,
        y: this.state.y,
      };
    } else {
      this.setState({
        x: this.memorizedState.x,
        y: this.memorizedState.y,
      });
    }

    this.setState({
      animate: 'in',
      options,
    });
    const t = setTimeout(() => {
      this.removeTimeout(t);
      this.setState({ animate: 'none' });
    }, 500);
    this.timeouts.push(t);
  };

  setState(
    state:
      | IBaseWindowState<B>
      | ((
          prevState: Readonly<IBaseWindowState<B>>,
          props: Readonly<IBaseWindowProps>,
        ) => IBaseWindowState<any> | Pick<IBaseWindowState<B>, any>)
      | Pick<IBaseWindowProps, any>,
    callback?: () => void,
  ): void {
    //console.log(state);
    if (this._mounted) {
      console.error(new Error('Trying to update destroyed component'));
    } else {
      super.setState(state, callback);
      this.windowEmitter.emit('stateUpdate');
    }
  }

  _silentSetState(
    state:
      | IBaseWindowState<B>
      | ((
          prevState: Readonly<IBaseWindowState<B>>,
          props: Readonly<IBaseWindowProps>,
        ) => IBaseWindowState<any> | Pick<IBaseWindowState<B>, any>)
      | Pick<IBaseWindowProps, any>,
    callback?: () => void,
  ): void {
    super.setState(state, callback);
  }

  changeOptions(options: IWindow) {
    this.setState({ options: this.verifyOptions(options) });
  }

  private verifyOptions(options?: IWindow): IWindow {
    if (!options) options = {};
    return {
      windowType: options.windowType === undefined ? 'windowed' : options.windowType,
      resizable: options.resizable === undefined ? true : options.resizable,
      startPos: options.startPos === undefined ? 'card' : options.startPos,
      closeButton: options.closeButton === undefined ? 'shown' : options.closeButton,
      minimizeButton: options.minimizeButton === undefined ? 'shown' : options.minimizeButton,
      maximized: options.maximized === undefined ? false : options.maximized,
      minimized: options.minimized === undefined ? false : options.minimized,
      image: options.image === undefined ? manifest.icon ||  DEFAULT_APP_IMAGE : options.image,
      redirectToWebpageButton: options.redirectToWebpageButton || options.redirectToWebpageButton,
      showIcon: options.showIcon === undefined ? true : options.showIcon,
      title: options.title === undefined ? this.manifest.fullAppName || 'An app' : options.title,
      maximizeRestoreDownButton: options.maximizeRestoreDownButton === undefined ? 'shown' : options.maximizeRestoreDownButton,
      alwaysOnTop: options.alwaysOnTop === undefined ? false : options.alwaysOnTop
    };
  }

  setOptions(options: IWindow) {
    const state = { ...this.state };
    state.options = this.verifyOptions(options);
    this.setState(state);
  }

  setVariables(object: B) {
    const state = { ...this.state };
    state.variables = object;
    this.setState(state);
  }

  private removeTimeout(timeout: NodeJS.Timeout | number) {
    const indexOf = this.timeouts.indexOf(timeout);
    clearTimeout(timeout as number);
    if (indexOf === -1) return;
    this.timeouts.splice(indexOf, 1);
  }

  private keyboard = (ev: KeyboardEvent) => {
    if (!this.state.active) return;
    switch(ev.type){
      case 'keydown':
      if (this.onKeyDown) this.onKeyDown(ev);   
      break
      case 'keypress':
        if (this.onKeyPress) this.onKeyPress(ev);   
        break
        case 'keyup':
          if (this.onKeyUp) this.onKeyUp(ev);   
        break
    }
  };

  get minimized() {
    return this.state.options.minimized;
  }

  get id() {
    return this.props.id;
  }

  get _wasActive() {
    return this.wasActive;
  }

  get active() {
    return this.state.active;
  }

  get variables(): B {
    return this.state.variables;
  }

  get options(): IWindow {
    return this.state.options;
  }

  get bounds(): IBounds {
    return {
      y: this.state.y,
      x: this.state.x,
      height: this.state.height,
      width: this.state.width,
    };
  }

  get isPhone() {
    return this.phone;
  }

  get flashing(): boolean {
    return false;
  }

  get progress(): null | number {
    return null;
  }

  get onlyOne() {
    return !!this.props.onlyOne;
  }

  get _manifest() {
    return this.manifest;
  }
}

// Message box class under baseWindow. webpack doesn't want to compile if it places in other folder because it used before.
// MessageBox is at that point system window

export enum MessageBoxButtons {
  OK,
  AbortRetryIgnore,
  OKCancel,
  RetryCancel,
  YesNo,
  YesNoCancel,
}
enum DialogResult {
  Cancel,
  Abort,
  Retry,
  No,
  Yes,
  Ignore,
  Ok,
}

export enum MessageBoxIcon {
  None,
  Error,
  Information,
  Question,
  Warning,
}

export const manifest: IManifest = {
  fullAppName: 'message box',
  launchName: 'msgBox',
  icon: '/assets/images/appsIcons/appIcon.svg',
};

interface IMessageBoxState {
  message: string;
  buttons: MessageBoxButtons;
  icon: MessageBoxIcon;
}

export class MessageBox extends BaseWindow<IMessageBoxState> {
  public msgBoxEmitter = new EventEmitter();
  private _dialogResult: DialogResult;

  constructor(props: IBaseWindowProps) {
    super(
      props,
      manifest,
      {
        title: 'Message box',
        image: '/assets/images/appsIcons/appIcon.svg',
        startPos: 'center',
        alwaysOnTop: true,
        resizable: false,

        minimizeButton: 'hidden',
        maximizeRestoreDownButton:'hidden',
        minimized: false,
        minHeight: 175,
        minWidth: 400,
      },
      {
        message: '',
        buttons: MessageBoxButtons.OK,
        icon: MessageBoxIcon.None,
      },
    );

    this.on('exit', () => {
      this.onButtonClick(DialogResult.Cancel, false);
    });
  }

  public static Show(
    object: BaseWindow,
    message: string,
    caption?: string,
    messageBoxButtons?: MessageBoxButtons,
    messageBoxIcon?: MessageBoxIcon,
  ) {
    return new Promise<DialogResult>(resolve => {
      const reactGeneratorFunction: ReactGeneratorFunction = (id: number, props?: any) => (
        <MessageBox key={id} id={id} {...props}></MessageBox>
      );

      const messageBox = services.processor.addApp<MessageBox>(reactGeneratorFunction, 'msgBox').object;
      messageBox.message = message || '';
      messageBox.caption = caption || 'Message box';
      messageBox.buttons = messageBoxButtons === undefined ? MessageBoxButtons.OK : messageBoxButtons;
      messageBox.icon = messageBoxIcon || MessageBoxIcon.None;
      const onClick = (dialogResult: DialogResult) => {
        messageBox.msgBoxEmitter.removeListener('onClick', onClick);
        resolve(dialogResult);
      };

      messageBox.msgBoxEmitter.on('onClick', onClick);
    });
  }

  set message(message: string) {
    const variables = this.variables;
    variables.message = message;
    this.setVariables(variables);
  }
  set caption(title: string) {
    const state = { ...this.state };
    this.state.options.title = title;
    this.setState(state);
  }

  private set buttons(messageBoxButtons: MessageBoxButtons) {
    const variables = this.variables;
    variables.buttons = messageBoxButtons;
    this.setVariables(variables);
  }

  private set icon(messageBoxIcon: MessageBoxIcon) {
    const variables = this.variables;
    variables.icon = messageBoxIcon;
    this.setVariables(variables);
  }

  private onButtonClick = (dialogResult: DialogResult, exit = true) => {
    this.msgBoxEmitter.emit('onClick', dialogResult);
    if (exit) {
      this.exit();
    }
  };
  get dialogResult() {
    return this._dialogResult;
  }

  private get image() {
    switch (this.state.variables.icon) {
      case MessageBoxIcon.Error:
        return <MsgBoxIcon src='/assets/images/icons/Error.svg' />;
      case MessageBoxIcon.Information:
        return <MsgBoxIcon src='/assets/images/icons/Information.svg' />;
      case MessageBoxIcon.Question:
        return <MsgBoxIcon src='/assets/images/icons/Question.svg' />;
      case MessageBoxIcon.Warning:
        return <MsgBoxIcon src='/assets/images/icons/Warning.svg' />;
    }
    return null;
  }

  private get actionButtons() {
    switch (this.variables.buttons) {
      case MessageBoxButtons.AbortRetryIgnore:
        return (
          <div>
            <MsgBoxButton onClick={() => this.onButtonClick(DialogResult.Abort)}>Abort</MsgBoxButton>
            <MsgBoxButton onClick={() => this.onButtonClick(DialogResult.Retry)}>Retry</MsgBoxButton>
            <MsgBoxButton onClick={() => this.onButtonClick(DialogResult.Ignore)}>Ignore</MsgBoxButton>
          </div>
        );
      case MessageBoxButtons.OKCancel:
        return (
          <div>
            <MsgBoxButton onClick={() => this.onButtonClick(DialogResult.Ok)}>Ok</MsgBoxButton>
            <MsgBoxButton onClick={() => this.onButtonClick(DialogResult.Cancel)}>Cancel</MsgBoxButton>
          </div>
        );
      case MessageBoxButtons.RetryCancel:
        return (
          <div>
            <MsgBoxButton onClick={() => this.onButtonClick(DialogResult.Retry)}>Retry</MsgBoxButton>
            <MsgBoxButton onClick={() => this.onButtonClick(DialogResult.Cancel)}>Cancel</MsgBoxButton>
          </div>
        );
      case MessageBoxButtons.YesNo:
        return (
          <div>
            <MsgBoxButton onClick={() => this.onButtonClick(DialogResult.Yes)}>Yes</MsgBoxButton>
            <MsgBoxButton onClick={() => this.onButtonClick(DialogResult.No)}>No</MsgBoxButton>
          </div>
        );
      case MessageBoxButtons.YesNoCancel:
        return (
          <div>
            <MsgBoxButton onClick={() => this.onButtonClick(DialogResult.Yes)}>Yes</MsgBoxButton>
            <MsgBoxButton onClick={() => this.onButtonClick(DialogResult.No)}>No</MsgBoxButton>
            <MsgBoxButton onClick={() => this.onButtonClick(DialogResult.Cancel)}>Cancel</MsgBoxButton>
          </div>
        );
    }

    return <MsgBoxButton onClick={() => this.onButtonClick(DialogResult.Ok)}>Ok</MsgBoxButton>;
  }

  renderInside() {
    return (<>
      <MsgBoxContent>
        {this.image}
        <MsgBoxCaption>{this.variables.message}</MsgBoxCaption>

      </MsgBoxContent>
        <MsgBoxButtons>{this.actionButtons}</MsgBoxButtons>
    </>);
  }
}
