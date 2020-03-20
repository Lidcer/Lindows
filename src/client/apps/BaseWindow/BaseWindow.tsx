import React from 'react';
import './BaseWindow.scss';
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
import { services } from '../../services/services';
import { random, clamp } from 'lodash';
import {
  IBaseWindowEmitter,
  WindowEvent,
  IBaseWindowEmitterType,
  IBaseWindowKeyboard,
  KeyboardEmitterType,
} from './WindowEvent';

const DEFAULT_APP_IMAGE = './assets/images/unknown-app.svg';

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
  private destroyed = false;
  private manifest: IManifest;
  private emitter: IBaseWindowEmitter;
  private keyboardEmitter: IBaseWindowKeyboard;
  private memorizedState = {
    x: 0,
    y: 0,
  };

  constructor(props: IBaseWindowProps, manifest: IManifest, options?: IWindow, variables?: Readonly<B>) {
    super(props);
    this.emitter = new IBaseWindowEmitter(this);
    this.keyboardEmitter = new IBaseWindowKeyboard();
    this.manifest = manifest;
    Object.seal(this.manifest);
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
  }

  componentDidMount() {
    this.destroyed = false;
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

    setTimeout(() => {
      if (!this.destroyed)
        this.setState({
          animate: 'none',
        });
    }, 1000);

    this.monitorInterval = setInterval(this.monitor);

    this.emitter.emit('ready');
  }

  componentWillUnmount() {
    this.destroyed = true;
    window.removeEventListener('resize', this.onResize, false);

    window.removeEventListener('mousedown', this.mouseDown, false);
    window.removeEventListener('touchstart', this.touchStart, false);

    window.removeEventListener('mousemove', this.mouseMove, false);
    window.removeEventListener('touchmove', this.touchMove, false);

    window.removeEventListener('mouseup', this.mouseUp, false);
    window.removeEventListener('touchend', this.touchEnd, false);

    services.processor.killProcess(this);
    this.emitter.removeAllListeners();
    this.keyboardEmitter.removeAllListeners();
    clearInterval(this.monitorInterval);
  }

  render() {
    return (
      <div className={this.windowClass} ref={this.ref} style={this.getStyle()}>
        {this.renderResizable()}
        {this.renderTitleBar()}
        <div className='window-content'>{this.giveView()}</div>
      </div>
    );
  }

  on(event: IBaseWindowEmitterType | '*', listener: (event: WindowEvent) => void) {
    return this.emitter.on(event, listener);
  }

  onKeyboard(event: 'keypress' | 'keyup' | 'keydown' | '*', listener: (event: WindowEvent) => void) {
    return this.keyboardEmitter.on(event, listener);
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
        <div
          className={this.active ? 'title-bar' : 'title-bar title-bar-inactive'}
          onMouseDown={e => this.onTitleBarMouseDown(e.nativeEvent)}
          onTouchStart={e => this.onTitleBarTouchStart(e.nativeEvent)}
          onTouchEnd={() => {
            if (this.ignoreMouse) this.ignoreMouse = false;
          }}
        >
          {this.renderIcon()}
          {this.renderTitleBarTitle()}
          <div className='title-bar-right'>
            {this.renderRedirectToWebpage()}
            {this.renderMinimize()}
            {this.renderMaximizeRestoreDown()}
            {this.renderExit()}
          </div>
        </div>
      );
    }
    return null;
  }
  private renderIcon() {
    if (this.state.options.showIcon) {
      return <img className='title-bar-icon' src={this.state.options.image} alt='App Icon' />;
    }
    return null;
  }

  private renderTitleBarTitle() {
    const tClass = this.state.options.showIcon ? 'title-bar-title-with-icon' : 'title-bar-title';

    if (this.state.options.title) return <span className={tClass}>{this.state.options.title}</span>;
    return null;
  }

  private renderExit() {
    if (this.state.options.closeButton === 'shown') {
      return (
        <span className='title-bar-buttons title-bar-exit' onClick={this.buttonExit}>
          <FontAwesomeIcon icon={faTimes}></FontAwesomeIcon>
        </span>
      );
    } else if (this.state.options.closeButton === 'disabled') {
      return (
        <span className='title-bar-buttons title-bar-button-disabled'>
          <FontAwesomeIcon icon={faTimes}></FontAwesomeIcon>
        </span>
      );
    }
    return null;
  }

  private renderRedirectToWebpage = () => {
    if (!!this.state.options.redirectToWebpageButton) {
      return (
        <span className='title-bar-buttons title-bar-button-hover' onClick={this.redirect}>
          <FontAwesomeIcon icon={faFile}></FontAwesomeIcon>
        </span>
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
      //TODO: add message box
      console.log('unable to launch');
    }
  };

  private renderMaximizeRestoreDown() {
    const icon = this.state.options.maximized ? faWindowRestore : faWindowMaximize;
    const buttonFunction = this.state.options.maximized ? this.buttonMaximize : this.buttonRestore;

    if (this.state.options.maximizeRestoreDownButton === 'shown') {
      return (
        <span className='title-bar-buttons title-bar-button-hover' onClick={buttonFunction}>
          <FontAwesomeIcon icon={icon}></FontAwesomeIcon>
        </span>
      );
    } else if (this.state.options.maximizeRestoreDownButton === 'disabled') {
      return (
        <span className='title-bar-buttons title-bar-button-disabled'>
          <FontAwesomeIcon icon={icon}></FontAwesomeIcon>
        </span>
      );
    }
    return null;
  }

  private renderMinimize() {
    if (this.state.options.minimizeButton === 'shown') {
      return (
        <span
          className='title-bar-buttons title-bar-button-hover'
          onMouseDown={() => {
            this.isWindowMoving = false;
          }}
          onClick={this.buttonMinimize}
        >
          <FontAwesomeIcon icon={faWindowMinimize}></FontAwesomeIcon>
        </span>
      );
    } else if (this.state.options.minimizeButton === 'disabled') {
      return (
        <span className='title-bar-buttons title-bar-button-disabled'>
          <FontAwesomeIcon icon={faWindowMinimize}></FontAwesomeIcon>
        </span>
      );
    }
    return null;
  }

  private renderResizable() {
    if (this.state.options.resizable && this.state.options.windowType === 'windowed') {
      return (
        <>
          <div
            className='window-up-hover'
            onMouseEnter={() => this.mouseResize('verticalResize')}
            onMouseLeave={this.mouseResizeLeave}
            onMouseDown={() => this.setResize('up')}
            onTouchStart={() => this.setResize('up')}
          ></div>
          <div
            className='window-bottom-hover'
            onMouseEnter={() => this.mouseResize('verticalResize')}
            onMouseLeave={this.mouseResizeLeave}
            onMouseDown={() => this.setResize('bottom')}
            onTouchStart={() => this.setResize('bottom')}
          ></div>
          <div
            className='window-left-hover'
            onMouseEnter={() => this.mouseResize('horizontalResize')}
            onMouseLeave={this.mouseResizeLeave}
            onMouseDown={() => this.setResize('left')}
            onTouchStart={() => this.setResize('left')}
          ></div>
          <div
            className='window-right-hover'
            onMouseEnter={() => this.mouseResize('horizontalResize')}
            onMouseLeave={this.mouseResizeLeave}
            onMouseDown={() => this.setResize('right')}
            onTouchStart={() => this.setResize('right')}
          ></div>
          <div
            className='window-up-left-hover'
            onMouseEnter={() => this.mouseResize('diagonalResize2')}
            onMouseLeave={this.mouseResizeLeave}
            onMouseDown={() => this.setResize('left-up')}
            onTouchStart={() => this.setResize('left-up')}
          ></div>
          <div
            className='window-up-right-hover'
            onMouseEnter={() => this.mouseResize('diagonalResize1')}
            onMouseLeave={this.mouseResizeLeave}
            onMouseDown={() => this.setResize('right-up')}
            onTouchStart={() => this.setResize('right-up')}
          ></div>
          <div
            className='window-bottom-left-hover'
            onMouseEnter={() => this.mouseResize('diagonalResize1')}
            onMouseLeave={this.mouseResizeLeave}
            onMouseDown={() => this.setResize('left-bottom')}
            onTouchStart={() => this.setResize('left-bottom')}
          ></div>
          <div
            className='window-bottom-right-hover'
            onMouseEnter={() => this.mouseResize('diagonalResize2')}
            onMouseLeave={this.mouseResizeLeave}
            onMouseDown={() => this.setResize('right-bottom')}
            onTouchStart={() => this.setResize('right-bottom')}
          ></div>
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
        return `window animated jackInTheBox faster${this.windowTypeClass}`;
      case 'out':
        return `window animated zoomOut faster${this.windowTypeClass}`;
      case 'minimize':
        return `window animated bounceInUp faster${this.windowTypeClass}`;
      case 'unMinimize':
        return `window animated bounceOutDown faster${this.windowTypeClass}`;
      default:
        return `window${this.windowTypeClass}`;
    }
  }

  private get windowTypeClass() {
    if (this.state.options.maximized) return ` window-${navBarPos}`;
    if (this.state.options.windowType === 'fullscreen') return ' window-fullscreen';
    return ``;
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
        this.emitter.emit('focus');
        //const shouldPreventDefault = this.emitter.emit('focus');
        //if (!shouldPreventDefault && doProcess) return;
      } else if (!active) {
        this.emitter.emit('blur');
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
    if (this.active) zIndex = 10000;
    if (this.state.options.alwaysOnTop) zIndex = 99999999;
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
    const shouldPrevent = this.emitter.emit('buttonMinimize');
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
    const shouldContinue = this.emitter.emit('buttonExit');
    if (!shouldContinue) this.exit();
  };

  exit() {
    this.emitter.emit('exit');
    this.setState({
      animate: 'out',
    });
    setTimeout(() => {
      services.processor.killProcess(this);
    }, 200);
  }

  private buttonRestore = () => {
    const shouldPrevent = this.emitter.emit('buttonMaximize');
    if (!shouldPrevent) this.maximizeRestoreDown();
  };

  private buttonMaximize = () => {
    const shouldPrevent = this.emitter.emit('buttonMaximize');
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
    setTimeout(() => {
      if (!this.destroyed) this.setState({ animate: 'none' });
    }, 500);
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
    super.setState(state, callback);
    this.emitter.emit('stateUpdate');
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
      image: options.image === undefined ? DEFAULT_APP_IMAGE : options.image,
      redirectToWebpageButton: options.redirectToWebpageButton || options.redirectToWebpageButton,
      showIcon: options.showIcon === undefined ? true : options.showIcon,
      title: options.title === undefined ? 'Lindow app' : options.title,
      maximizeRestoreDownButton:
        options.maximizeRestoreDownButton === undefined ? 'shown' : options.maximizeRestoreDownButton,
    };
  }

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

  private keyboard = (ev: KeyboardEvent) => {
    if (!this.state.active) return;
    this.keyboardEmitter.emit(ev.type, ev);
  };

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
    return { ...this.manifest };
  }
}
