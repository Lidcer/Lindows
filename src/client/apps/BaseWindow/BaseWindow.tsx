import React from "react";
import { mousePointer, CursorType } from "../../components/Cursor/Cursor";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTimes,
  faWindowMaximize,
  faWindowMinimize,
  faWindowRestore,
  faFile,
} from "@fortawesome/free-solid-svg-icons";
import { navBarPos } from "../../components/TaskBar/TaskBar";
import { internal } from "../../services/internals/Internal";
import { random, clamp } from "lodash";
import { ReactGeneratorFunction, appConstructorGenerator, launchApp, AppDescription } from "../../essential/apps";
import { EventEmitter } from "events";
import { cloneDeep, randomString } from "../../../shared/utils";
import {
  MsgBoxIcon,
  MsgBoxButton,
  MsgBoxButtons,
  MsgBoxCaption,
  LWindow,
  LWindowContent,
  LWindowUpHover,
  LWindowBottomHover,
  LWindowLeftHover,
  LWindowRightHover,
  LWindowUpLeftHover,
  LWindowUpRightHover,
  LWindowBottomLeftHover,
  LWindowBottomRightHover,
  TitleBarButtonDisabled,
  TitleBarExit,
  TitleBarIcon,
  TitleBar,
  TitleBarRight,
  TitleBarTitleWithIcon,
  TitleBarButtonHover,
  MsgBoxContent,
  Blocker,
  UserAdminStyled,
  UserAdminTop,
  UserAdminContent,
  TitleBarTitle,
  UserAdminMiddle,
  UserAdminBottom,
  MsgBoxWarper,
} from "./baseWindowStyled";
import { alwaysOnTop as alwaysOnTopIndex } from "../../Constants";
import { WindowEvent } from "./WindowEvent";
import { Network } from "../../services/system/NetworkSystem";
import { attachToWindowIfDev } from "../../essential/requests";
import "./baseWindows.scss";
import { LindowError } from "../../utils/util";
import { FileSystemFile } from "../../utils/FileSystemDirectory";
import { AppOptions } from "../../../shared/Websocket";
const DEFAULT_APP_IMAGE = "/assets/images/unknown-app.svg";

export interface IBaseWindowProps {
  id: number;
  launchFile: FileSystemFile<AppDescription>;
  flags?: string;
  onlyOne?: boolean;
  windowType?: "borderless" | "windowed" | "fullscreen";
  sudo?: boolean;
}

export interface ILaunchFlags {
  [key: string]: string;
}

let lastX = random(0, window.innerWidth * 0.25);
let lastY = random(0, window.innerHeight * 0.25);

export interface IWindow {
  startPos?: "center" | "random" | "card";
  width?: number;
  height?: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  windowType?: "borderless" | "windowed" | "fullscreen";
  resizable?: boolean;
  closeButton?: "shown" | "disabled" | "hidden";
  maximizeRestoreDownButton?: "shown" | "disabled" | "hidden";
  minimizeButton?: "shown" | "disabled" | "hidden";
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
  animate: "none" | "in" | "out" | "minimize" | "unMinimize";
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
  | "none"
  | "left"
  | "right"
  | "up"
  | "bottom"
  | "left-up"
  | "right-up"
  | "left-bottom"
  | "right-bottom";

// eslint-disable-next-line
export interface BaseWindow<B = {}> extends React.Component<IBaseWindowProps, IBaseWindowState<B>> {
  manifest: IManifest;
  renderInside(): JSX.Element;

  load?(): void | Promise<void>;
  shown?(): void | Promise<void>;
  closed?(): void | Promise<void>;
  closing?(): void | Promise<void>;
  onKeyDown?(event: KeyboardEvent): void;
  onKeyPress?(event: KeyboardEvent): void;
  onKeyUp?(event: KeyboardEvent): void;

  onUpdate?(variables: B): void;
  onExit?(event: WindowEvent): void;
  onMinimize?(event: WindowEvent): void;
  onRestore?(event: WindowEvent): void;
  onMaximize?(event: WindowEvent): void;
  onRestoreDown?(event: WindowEvent): void;
  onBlur?(event: WindowEvent): void;
  onFocus?(event: WindowEvent): void;
  onError?(event: LindowError): void;

  // | 'move'
  // | 'resize'
  // | 'stateUpdate';

  onResize?(width: number, height: number): void;
}

const securityKeys = new WeakMap<BaseWindow, symbol>();
const adminAllowed = new WeakMap<BaseWindow, boolean>();

function overrideProtector(baseWindow: BaseWindow) {
  const overrideProtectionShow = (overriddenMethod: string, suggestedMethod: string) => {
    MessageBox.Show(
      baseWindow,
      `System.overrideProtection exception has occurred. You cannot override ${overriddenMethod}()!" Please consider using ${suggestedMethod}() function.`,
      "Override violation",
      MessageBoxButtons.OK,
      MessageBoxIcon.Error,
    );
  };

  const overrideProtectionBlock = (overriddenMethod: string) => {
    MessageBox.Show(
      baseWindow,
      `System.overrideProtection exception has occurred. ${overriddenMethod}() is system method you are not allowed to override!"`,
      "Override violation",
      MessageBoxButtons.OK,
      MessageBoxIcon.Error,
    );
  };

  const reactMethods: { method: string; suggested: string }[] = [
    { method: "componentDidMount", suggested: "load" },
    { method: "componentWillUnmount", suggested: "closing" },
    { method: "render", suggested: "renderInside" },
  ];
  //This has to be in set timeout because baseWindow needs to be shown before showing message boxes
  for (const rectMethod of reactMethods) {
    if (baseWindow[rectMethod.method] !== BaseWindow.prototype[rectMethod.method]) {
      baseWindow.exit();
      overrideProtectionShow(rectMethod.method, rectMethod.suggested);
      return;
    }
  }
  const entries = Object.getOwnPropertyDescriptors(BaseWindow.prototype);
  for (const [key] of Object.entries(entries)) {
    //bound methods cannot be protected
    if (!key) continue;
    if (key === "constructor") continue;
    try {
      BaseWindow.prototype[key];
    } catch (error) {
      continue;
    } // you cannot access getters
    if (baseWindow[key] && BaseWindow.prototype[key] && baseWindow[key] !== BaseWindow.prototype[key]) {
      baseWindow.exit();
      overrideProtectionBlock(key);
    }
  }
}

let anonymous = false;
function parseFlags(flags?: string): ILaunchFlags {
  if (typeof flags !== "string" || !flags) return {};
  const flagsParsed = flags.split("-");
  const launchFlags: ILaunchFlags = {};
  for (const flag of flagsParsed) {
    const trimmed = flag.trim();
    if (trimmed) {
      const values = trimmed.split("=");
      const key = values[0] && values[0].trim();
      const value = values[1] && values[1].trim();
      if (!key) continue;
      if (value) {
        const newValue = value.match(/"(?:[^"\\]|\\.)*"/);
        if (newValue && newValue[0]) {
          launchFlags[key] = newValue[0].slice(1, -1);
        }
      }
      if (!launchFlags[key]) {
        launchFlags[key] = value || null;
      }
    }
  }
  return launchFlags;
}

export abstract class BaseWindow<B> extends React.Component<IBaseWindowProps, IBaseWindowState<B>> {
  private _ref: React.RefObject<HTMLDivElement> = React.createRef();
  public static readonly onlyOne: boolean = false;
  private development = false;
  private _minHeight = 250;
  private _minWidth = 250;
  private _titleBarOffsetX: number;
  private _titleBarOffsetY: number;
  private _isWindowMoving = false;
  private _lastX = 0;
  private _lastY = 0;
  private _speedX = 0;
  private _speedY = 0;
  private _monitorInterval: number;
  private _resizeType: ResizingType = "none";
  private wasActive = false;
  private _ignoreMouse = false;
  private _phone = null;
  private _mounted = false;
  private _started = false;
  private _frozen = false;
  private _warnOnce = false;
  private _destroyed = false;
  private _error?: any;
  private _launchFlags: ILaunchFlags;
  private _memorizedState = {
    x: 0,
    y: 0,
  };
  private timeouts: (NodeJS.Timeout | number)[] = [];

  constructor(props: IBaseWindowProps, options?: IWindow, variables?: Readonly<B>) {
    super(props);
    this._launchFlags = parseFlags(this.props.flags);

    //@ts-ignore manifest not showing up
    const manifest: IManifest = this.constructor.manifest;

    if (!anonymous) {
      anonymous = false;
      if (!manifest) {
        MessageBox._anonymousShow("Missing manifest of the app", "Error");
        return;
      }

      if (!manifest.launchName) {
        MessageBox._anonymousShow("Missing launch name", "Error");
        return;
      }

      if (!manifest.fullAppName) {
        MessageBox._anonymousShow("Missing full app Name in manifest name", "Error");
        return;
      }

      if (props === undefined) {
        MessageBox._anonymousShow(
          `Cannot create app. Please use 'await ${this.constructor.name}.New()'`,
          "Wrong implementation",
        );
        return;
      }
    }

    securityKeys.set(this, Symbol());

    this._phone = internal.hardwareInfo.mobile.phone();
    this._minWidth = options && options.minWidth ? options.minWidth : this._minWidth;
    this._minHeight = options && options.minHeight ? options.minHeight : this._minHeight;

    let width = options && options.width ? options.width : this._minWidth;
    let height = options && options.height ? options.height : this._minHeight;
    if (height < this._minHeight) height = this._minHeight;
    if (width < this._minWidth) width = this._minWidth;

    width = clamp(width, 0, window.innerWidth);
    height = clamp(height, 0, window.innerHeight);
    const verifiedOptions = this.verifyOptions(options);
    let x = 0;
    let y = 0;
    const offset = 20;
    if (verifiedOptions.startPos === "random") {
      x = random(offset, window.innerWidth - offset - width);
      y = random(offset, window.innerHeight - offset - height);
    } else if (verifiedOptions.startPos === "center") {
      x = window.innerWidth * 0.5 - width * 0.5;
      y = window.innerHeight * 0.5 - height * 0.5;
    } else if (verifiedOptions.startPos === "card") {
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
      animate: "in",
      width,
      height,
      x,
      y,
      active: false,
      variables,
    };

    //Override protection
    setTimeout(async () => {
      overrideProtector(this);
    });
  }

  public static async New(fileFile: FileSystemFile) {
    // @ts-ignore It does exist
    const manifest: IManifest = this.prototype.constructor.manifest;

    if (manifest) {
      const generator = appConstructorGenerator(manifest.launchName);
      if (generator) {
        const app = await internal.system.processor.addApp<BaseWindow>(generator, manifest.launchName);
        return app.object;
      }
    }
    const App = this.prototype.constructor;

    const name = manifest && manifest.launchName ? manifest.launchName : randomString(20);
    const mockGenerator: ReactGeneratorFunction = (id: number, props?) => (
      <App key={id} id={id} launchFile={fileFile} {...props}></App>
    );
    anonymous = true;

    const app = await internal.system.processor.addApp<BaseWindow>(mockGenerator, name);
    return app.object;
  }

  getBoundingRect() {
    if (this.state.options.windowType === "fullscreen") {
      return {
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: window.innerHeight,
      };
    }
    if (this.state.options.maximized) {
      const rect = this.reference.current && this.reference.current.getBoundingClientRect();
      return {
        x: 0,
        y: 0,
        width: (rect || rect.width) && window.innerWidth,
        height: (rect || rect.height) && window.innerHeight,
      };
    }

    return {
      x: this.state.x,
      y: this.state.y,
      width: this.state.width,
      height: this.state.height,
    };
  }

  /** Internal function will throw an error!
   *  Use load(ev:Window Event) or load(ev:Window Event) instead
   * @deprecated
   * @inheritdoc
   */
  async componentDidMount() {
    const launchFile = this.props && this.props.launchFile && (this.props.launchFile as FileSystemFile<AppDescription>);
    if (!launchFile || launchFile.deleted) {
      this.exit();
    } else if (launchFile.getType(internal.systemSymbol) !== "lindowApp") {
      this.exit();
    } else if (!launchFile.getContent(internal.systemSymbol).app) {
      this.exit();
    }

    if (this.load) {
      try {
        const promise = this.load();
        if (promise instanceof Promise) await promise;
      } catch (error) {
        this.exit();
        MessageBox._anonymousShow(
          getMessageFromError(error, "An unknown error occurred on load"),
          "Error",
          MessageBoxButtons.OK,
          MessageBoxIcon.Error,
        );
        return;
      }
    }
    this._started = true;
    this._mounted = true;
    window.addEventListener("resize", this._onResize, false);

    window.addEventListener("mousedown", this._mouseDown, false);
    window.addEventListener("touchstart", this.touchStart, false);

    window.addEventListener("mousemove", this._mouseMove, false);
    window.addEventListener("touchmove", this._touchMove, false);

    window.addEventListener("mouseup", this._mouseUp, false);
    window.addEventListener("touchend", this._touchEnd, false);

    window.addEventListener("keydown", this._keyboard);
    window.addEventListener("keypress", this._keyboard);
    window.addEventListener("keyup", this._keyboard);

    internal.system.processor.startProcess(this);
    this.changeActiveState(true);
    internal.system.processor.makeActive(this);
    this.setState({ animate: "in" });
    const t = setTimeout(() => {
      this._removeTimeout(t);
      this.setState({ animate: "none" });
    }, 1000);
    this.timeouts.push(t);

    this._monitorInterval = setInterval(this._windowLoop);

    setTimeout(async () => {
      if (this.shown && this._mounted) {
        try {
          const promise = this.shown();
          if (promise instanceof Promise) await promise;
        } catch (error) {
          MessageBox._anonymousShow(
            getMessageFromError(error, "An unknown error occurred on shown"),
            "Error",
            MessageBoxButtons.OK,
            MessageBoxIcon.Error,
          );
          return;
        }
      }
    });
  }

  /** Internal function will throw an error!
   *  Use closing(ev:Window Event) or closed(ev:Window Event) instead
   * @deprecated
   * @inheritdoc
   */
  async componentWillUnmount() {
    this._mounted = false;
    clearInterval(this._monitorInterval);
    window.removeEventListener("resize", this._onResize, false);

    window.removeEventListener("mousedown", this._mouseDown, false);
    window.removeEventListener("touchstart", this.touchStart, false);

    window.removeEventListener("mousemove", this._mouseMove, false);
    window.removeEventListener("touchmove", this._touchMove, false);

    window.removeEventListener("mouseup", this._mouseUp, false);
    window.removeEventListener("touchend", this._touchEnd, false);

    window.removeEventListener("keydown", this._keyboard);
    window.removeEventListener("keypress", this._keyboard);
    window.removeEventListener("keyup", this._keyboard);

    const timeouts = this.timeouts;
    for (const timeout of timeouts) {
      this._removeTimeout(timeout);
    }

    internal.system.processor.killProcess(this);
    if (this.closed) {
      try {
        const promise = this.closed();
        if (promise instanceof Promise) await promise;
      } catch (error) {
        MessageBox._anonymousShow(
          getMessageFromError(error, "An error occurred while closed"),
          "Error",
          MessageBoxButtons.OK,
          MessageBoxIcon.Error,
        );
        return;
      }
    }
  }
  /**
   *  Returns window launch flags
   * @returns {Object}
   */
  get launchFlags() {
    return this._launchFlags;
  }
  /**
   *  return if window has launch flag
   * @returns {boolean}
   */
  hasLaunchFlag(flag: string) {
    if (this._launchFlags[flag] === null) return true;
    return !!this._launchFlags[flag];
  }

  /** Internal function will throw an error!
   *  Use renderInside()
   * @deprecated
   * @inheritdoc
   */
  render() {
    if (!this._started || this._error) return null;
    let className = this._windowClass;

    if (this.state.options.windowType === "fullscreen") {
      className += " LWindowFullscreen";
    } else if (this.state.options.maximized) {
      switch (navBarPos) {
        case "bottom":
          className += " LWindowBottom";
          break;
        case "top":
          className += " LWindowTop";
          break;
        case "left":
          className += " LWindowLeft";
          break;
        case "right":
          className += " LWindowRight";
          break;
        default:
          break;
      }
    }

    const blocker = this._frozen ? <Blocker /> : null;
    try {
      return (
        <LWindow className={className + " lll"} ref={this._ref} style={this.getStyle()}>
          {blocker}
          {this._renderResizable()}
          {this._renderTitleBar()}
          <LWindowContent>
            {blocker}
            {this._giveView()}
          </LWindowContent>
        </LWindow>
      );
    } catch (error) {
      this._error = error;
      if (this.onError) {
        this.onError(new LindowError(error));
      }

      this.exit();
    }
    return null;
  }

  changeOptions(newOptions: IWindow) {
    const options = { ...this.state.options };
    Object.assign(options, newOptions);
    this.setState({ options });
    //this.setState({ options: this.verifyOptions(options) });
  }

  setVariables(object: Partial<B>) {
    const state = { ...this.state };
    Object.assign(state.variables, object);
    this.setState(state);
  }

  changeActiveState(active: boolean, doProcess = true) {
    if (this._frozen) return;
    if (this.state.active) this.wasActive = true;
    else this.wasActive = false;

    if (active !== this.state.active) {
      if (active) {
        const we = new WindowEvent("focus", this);
        if (this.onFocus) {
          try {
            this.onFocus(we);
          } catch (error) {
            this.exit();
            MessageBox._anonymousShow(`${getMessageFromError(error, "An error occurred in onFocus() method")}`);
          }
        }

        if (we.isDefaultPrevented && doProcess) return;
      } else if (!active) {
        if (this.onBlur) {
          const we = new WindowEvent("blure", this);
          try {
            this.onBlur(we);
          } catch (error) {
            this.exit();
            MessageBox._anonymousShow(`${getMessageFromError(error, "An error occurred in onBlur() method")}`);
          }
          if (we.isDefaultPrevented && doProcess) return;
        }
      }
      this.setState({ active });
    }
    if (active && doProcess) internal.system.processor.makeActive(this);
  }

  focus() {
    if (this.minimized) {
      this.minimize();
    }
    this.changeActiveState(true);
  }

  minimize = () => {
    const options = { ...this.state.options };
    options.minimized = !options.minimized;

    this.setState({
      animate: options.minimized ? "unMinimize" : "minimize",
      options,
    });
  };

  //You need app key to access key
  freeze(key: symbol) {
    this.changeActiveState(false);
    if (key === securityKeys.get(this)) {
      this._frozen = true;
      this.forceUpdate();
    } else {
      MessageBox.Show(this, "Invalid key");
    }
  }

  unFreeze(key: symbol) {
    if (key === securityKeys.get(this)) {
      this._frozen = false;
      this.forceUpdate();
    } else {
      MessageBox.Show(this, "Invalid key");
    }
  }

  getProcessor() {
    if (adminAllowed.get(this)) {
      return internal.system.processor;
    }
    return null;
  }

  async requestAdmin(): Promise<boolean> {
    if (!adminAllowed.get(this)) {
      return await AdminPromp.requestAdmin(this);
    }
    return adminAllowed.get(this);
  }

  getAccount(password: string) {
    return internal.system.account;
  }

  get network() {
    return internal.system.network;
  }

  /** Sets item in storage but doesn't save
   * @param {object} value
   */
  setItemQuick<V = string>(value: V) {
    return internal.system.registry.setUserItem(this.getManifest().fullAppName, value);
  }

  /** Sets item in storage and saves it if save it
   * @param {object} value
   * @returns {Promise}
   */
  setItem<V = any>(value: V) {
    return internal.system.registry.setUserItem(this.getManifest().fullAppName, value);
  }

  /** Gets set item
   * @returns {object | undefined}
   */
  getItem<T = any>(): T | null {
    return internal.system.registry.getUserItemValue(this.getManifest().fullAppName);
  }

  getItemReg() {
    return internal.system.registry.getUserItem(this.getManifest().fullAppName);
  }

  get reference() {
    return this._ref;
  }

  /** Sets item in storage but doesn't save to reduce time of saving
   * @param {object} value
   */
  private _windowLoop = () => {
    if (!this._isWindowMoving) {
      const { x, y, corrected } = this._getFixedPos(this.state.x - this._speedX, this.state.y - this._speedY);
      if (x === this.state.x && y === this.state.y) return;

      if (corrected) {
        this._speedX = 0;
        this._speedY = 0;
      }

      this.setState({ x, y });

      const slidingAmount = 0.05;
      const autoAlign = 0.01;

      if (this._speedY > autoAlign) this._speedY = this._speedY - slidingAmount * this._speedY;
      else if (this._speedY < -autoAlign) this._speedY = this._speedY + slidingAmount * -this._speedY;
      else this._speedY = this._speedY = 0;

      if (this._speedX > autoAlign) this._speedX = this._speedX - slidingAmount * this._speedX;
      else if (this._speedX < -autoAlign) this._speedX = this._speedX + slidingAmount * -this._speedX;
      else this._speedX = this._speedX = 0;
    }
  };

  private _renderTitleBar() {
    if (this.state.options.windowType === "windowed") {
      return (
        <TitleBar
          style={!this.active ? { backgroundColor: "rgba(64, 64, 64, 1)" } : { backgroundColor: "rgba(0, 0, 0, 1)" }}
          onMouseDown={e => this._onTitleBarMouseDown(e.nativeEvent)}
          onTouchStart={e => this._onTitleBarTouchStart(e.nativeEvent)}
          onTouchEnd={() => {
            if (this._ignoreMouse) this._ignoreMouse = false;
          }}
        >
          {this._renderIcon()}
          {this._renderTitleBarTitle()}
          <TitleBarRight>
            {this._renderRedirectToWebpage()}
            {this._renderMinimize()}
            {this._renderMaximizeRestoreDown()}
            {this._renderExit()}
          </TitleBarRight>
        </TitleBar>
      );
    }
    return null;
  }
  private _renderIcon() {
    if (this.state.options.showIcon) {
      return <TitleBarIcon src={this.state.options.image} alt='App Icon' />;
    }
    return null;
  }

  private _renderTitleBarTitle() {
    const tClass = this.state.options.showIcon ? "title-bar-title-with-icon" : "title-bar-title";

    if (this.state.options.title) {
      if (this.state.options.showIcon) {
        return <TitleBarTitleWithIcon>{this.state.options.title}</TitleBarTitleWithIcon>;
      } else {
        return <TitleBarTitle>{this.state.options.title}</TitleBarTitle>;
      }
    }
    return null;
  }

  private _renderExit() {
    if (this.state.options.closeButton === "shown") {
      return (
        <TitleBarExit onClick={this.buttonExit}>
          <FontAwesomeIcon icon={faTimes}></FontAwesomeIcon>
        </TitleBarExit>
      );
    } else if (this.state.options.closeButton === "disabled") {
      return (
        <TitleBarButtonDisabled>
          <FontAwesomeIcon icon={faTimes}></FontAwesomeIcon>
        </TitleBarButtonDisabled>
      );
    }
    return null;
  }

  private _renderRedirectToWebpage() {
    if (!!this.state.options.redirectToWebpageButton) {
      return (
        <TitleBarButtonHover onClick={this._redirect}>
          <FontAwesomeIcon icon={faFile}></FontAwesomeIcon>
        </TitleBarButtonHover>
      );
    } else {
      return null;
    }
  }

  private _redirect = async () => {
    if (this._frozen) return;
    this._buttonMinimize();
    try {
      await internal.system.processor.saveState();
      document.location.href = this.state.options.redirectToWebpageButton;
    } catch (error) {
      MessageBox.Show(this, `Unable to launch application ${error.message}`);
    }
  };

  private _renderMaximizeRestoreDown() {
    const icon = this.state.options.maximized ? faWindowRestore : faWindowMaximize;
    const buttonFunction = this.state.options.maximized ? this._buttonRestore : this._buttonMaximize;
    if (this.state.options.maximizeRestoreDownButton === "shown") {
      return (
        <TitleBarButtonHover onClick={buttonFunction}>
          <FontAwesomeIcon icon={icon}></FontAwesomeIcon>
        </TitleBarButtonHover>
      );
    } else if (this.state.options.maximizeRestoreDownButton === "disabled") {
      return (
        <TitleBarButtonDisabled>
          <FontAwesomeIcon icon={icon}></FontAwesomeIcon>
        </TitleBarButtonDisabled>
      );
    }
    return null;
  }

  private _renderMinimize() {
    if (this.state.options.minimizeButton === "shown") {
      return (
        <TitleBarButtonHover
          onMouseDown={() => {
            this._isWindowMoving = false;
          }}
          onClick={this._buttonMinimize}
        >
          <FontAwesomeIcon icon={faWindowMinimize}></FontAwesomeIcon>
        </TitleBarButtonHover>
      );
    } else if (this.state.options.minimizeButton === "disabled") {
      return (
        <TitleBarButtonDisabled>
          <FontAwesomeIcon icon={faWindowMinimize}></FontAwesomeIcon>
        </TitleBarButtonDisabled>
      );
    }
    return null;
  }

  private _renderResizable() {
    if (this.state.options.resizable && this.state.options.windowType === "windowed") {
      return (
        <>
          <LWindowUpHover
            onMouseEnter={() => this._mouseResize("verticalResize")}
            onMouseLeave={this._mouseResizeLeave}
            onMouseDown={() => this.setResize("up")}
            onTouchStart={() => this.setResize("up")}
          ></LWindowUpHover>
          <LWindowBottomHover
            onMouseEnter={() => this._mouseResize("verticalResize")}
            onMouseLeave={this._mouseResizeLeave}
            onMouseDown={() => this.setResize("bottom")}
            onTouchStart={() => this.setResize("bottom")}
          ></LWindowBottomHover>
          <LWindowLeftHover
            onMouseEnter={() => this._mouseResize("horizontalResize")}
            onMouseLeave={this._mouseResizeLeave}
            onMouseDown={() => this.setResize("left")}
            onTouchStart={() => this.setResize("left")}
          ></LWindowLeftHover>
          <LWindowRightHover
            onMouseEnter={() => this._mouseResize("horizontalResize")}
            onMouseLeave={this._mouseResizeLeave}
            onMouseDown={() => this.setResize("right")}
            onTouchStart={() => this.setResize("right")}
          ></LWindowRightHover>
          <LWindowUpLeftHover
            onMouseEnter={() => this._mouseResize("diagonalResize2")}
            onMouseLeave={this._mouseResizeLeave}
            onMouseDown={() => this.setResize("left-up")}
            onTouchStart={() => this.setResize("left-up")}
          ></LWindowUpLeftHover>
          <LWindowUpRightHover
            onMouseEnter={() => this._mouseResize("diagonalResize1")}
            onMouseLeave={this._mouseResizeLeave}
            onMouseDown={() => this.setResize("right-up")}
            onTouchStart={() => this.setResize("right-up")}
          ></LWindowUpRightHover>
          <LWindowBottomLeftHover
            onMouseEnter={() => this._mouseResize("diagonalResize1")}
            onMouseLeave={this._mouseResizeLeave}
            onMouseDown={() => this.setResize("left-bottom")}
            onTouchStart={() => this.setResize("left-bottom")}
          ></LWindowBottomLeftHover>
          <LWindowBottomRightHover
            onMouseEnter={() => this._mouseResize("diagonalResize2")}
            onMouseLeave={this._mouseResizeLeave}
            onMouseDown={() => this.setResize("right-bottom")}
            onTouchStart={() => this.setResize("right-bottom")}
          ></LWindowBottomRightHover>
        </>
      );
    }
    return null;
  }

  private _mouseResize = (type: CursorType) => {
    if (!this._isWindowMoving) mousePointer.changeMouse(type);
  };
  private setResize = (resizeType: ResizingType) => {
    this._resizeType = resizeType;
  };

  private _mouseResizeLeave = () => {
    if (this._resizeType === "none") mousePointer.changeMouse("normal");
  };

  private _onResize = () => {
    if (this._frozen) return;
    const { x, y } = this._getFixedPos();
    const width = clamp(this.state.width, 0, window.innerWidth);
    const height = clamp(this.state.height, 0, window.innerHeight);
    if (x !== this.state.x || y !== this.state.y || width !== this.state.width || height !== this.state.height) {
      this.setState({ x, y, width, height });
    }
  };

  private _getFixedPos(xPos?: number, yPos?: number): { x: number; y: number; corrected: boolean } {
    let x = xPos === undefined ? this.state.x : xPos;
    let y = yPos === undefined ? this.state.y : yPos;
    if (!this._ref.current) {
      return { x, y, corrected: false };
    }

    const bounding = this._ref.current.getBoundingClientRect();
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

  private get _windowClass() {
    switch (this.state.animate) {
      case "in":
        return `animated jackInTheBox faster`;
      case "out":
        return `animated zoomOut faster`;
      case "minimize":
        return `animated bounceInUp faster`;
      case "unMinimize":
        return `animated bounceOutDown faster`;
    }
    return "";
  }

  private _giveView = () => {
    if (!this.renderInside) return <div>Missing content</div>;
    const jsx = this.renderInside();
    //@ts-ignore Im so sorry
    if (jsx && typeof jsx === "object" && jsx.$$typeof && typeof jsx.$$typeof === "symbol") {
      return jsx;
    }

    return <div className='text-danger'>Broken renderInside() function!</div>;
  };

  private _mouseMove = (event: MouseEvent) => {
    if (this._frozen) return;
    if (this._ignoreMouse) return;
    this._handleWindowMove(event.clientX, event.clientY);
  };

  private _touchMove = (event: TouchEvent) => {
    this._handleWindowMove(event.touches[0].clientX, event.touches[0].clientY);
  };

  private _handleWindowMove(clientX: number, clientY: number) {
    if (this._resizeType !== "none" && !this._isWindowMoving) {
      let width = this.state.width;
      let height = this.state.height;
      let x = this.state.x;
      let y = this.state.y;
      const newX = clientX;
      const newY = clientY;
      const maxHeight = window.innerHeight;
      const maxWidth = window.innerWidth;

      switch (this._resizeType) {
        case "right":
          if (newX >= window.innerWidth) break;
          width = newX - this.state.x;
          break;
        case "left":
          if (newX <= 0) break;
          const tlWidth = this.state.x - clientX + this.state.width;
          if (tlWidth >= this._minWidth && tlWidth < maxWidth) {
            width = tlWidth;
            x = clientX;
          }
          break;

        case "up":
          if (newY <= 0) break;
          const upHeight = this.state.y - clientY + this.state.height;
          if (upHeight >= this._minHeight && upHeight < maxHeight) {
            height = upHeight;
            y = clientY;
          }
          break;
        case "bottom":
          if (newY >= window.innerHeight) break;
          height = clientY - this.state.y;
          break;
        case "right-bottom":
          if (newX >= window.innerWidth) break;
          if (newY >= window.innerHeight) break;
          height = clientY - this.state.y;
          width = clientX - this.state.x;
          break;
        case "left-bottom":
          if (newX <= 0) break;
          if (newY >= window.innerHeight) break;
          const lbWidth = this.state.x - clientX + this.state.width;
          height = clientY - this.state.y;
          if (lbWidth >= this._minWidth && lbWidth < maxWidth) {
            x = clientX;
            width = lbWidth;
          }
          break;
        case "right-up":
          if (newX >= window.innerWidth) break;
          if (newY <= 0) break;
          const ruHeight = this.state.y - clientY + this.state.height;
          if (ruHeight >= this._minHeight && ruHeight < maxHeight) {
            height = ruHeight;
            y = clientY;
            width = clientX - this.state.x;
          }

          break;
        case "left-up":
          if (newX <= 0) break;
          if (newY <= 0) break;
          const ltHeight = this.state.y - clientY + this.state.height;
          const ltWidth = this.state.x - clientX + this.state.width;
          if (ltWidth >= this._minWidth && ltWidth < maxWidth) {
            x = clientX;
            width = ltWidth;
          }
          if (ltHeight >= this._minHeight && ltHeight < maxHeight) {
            height = ltHeight;
            y = clientY;
          }

          break;
        default:
          break;
      }

      width = clamp(width, this._minWidth, maxWidth);
      height = clamp(height, this._minHeight, maxHeight);

      this.setState({ width, height, y, x });
      if (this.onResize) {
        try {
          this.onResize(this.state.width, this.state.height);
        } catch (error) {
          this.exit();
          MessageBox._anonymousShow(`${getMessageFromError(error, "An error occurred in onResize() method")}`);
        }
      }
    }

    if (this._isWindowMoving) {
      this._calculateSpeed(clientX, clientY);

      //prevents moving outside
      const { x, y } = this._getFixedPos(clientX - this._titleBarOffsetX, clientY - this._titleBarOffsetY);
      this.setState({ x, y });
    }
  }

  private _mouseDown = (event: MouseEvent | TouchEvent) => {
    const div = this._ref.current as HTMLDivElement;
    const target = event.target as HTMLDivElement;
    if (div.contains(target)) this.changeActiveState(true);
    else this.changeActiveState(false);
  };

  private touchStart = (event: TouchEvent) => {
    if (this._frozen) return;
    this._ignoreMouse = true;
    this._mouseDown(event);
  };

  private _calculateSpeed(x: number, y: number) {
    this._speedX = this._lastX - x;
    this._speedY = this._lastY - y;
    this._lastY = y;
    this._lastX = x;
  }

  private _mouseUp = (event: MouseEvent) => {
    if (this._frozen) return;
    this._resizeType = "none";
    this._onTitleBarSetOffset(event.clientX, event.clientY, false);
  };

  private _touchEnd = (event: TouchEvent) => {
    if (this._frozen) return;
    this._resizeType = "none";

    if (event.touches[0]) this._onTitleBarSetOffset(event.touches[0].clientX, event.touches[0].clientY, false);
    else this._onTitleBarSetOffset(0, 0, false);
  };

  private _onTitleBarMouseDown(event: MouseEvent) {
    const div = event.target as HTMLDivElement;
    if (div.tagName.toLowerCase() === "span" || div.tagName.toLowerCase() === "div")
      this._onTitleBarSetOffset(event.offsetX, event.offsetY);
  }
  private _onTitleBarTouchStart = (event: TouchEvent) => {
    if (!this._ignoreMouse) this._ignoreMouse = true;
    if (event.targetTouches[0]) {
      const div = event.target as HTMLDivElement;
      if (div.tagName.toLowerCase() === "span" || div.tagName.toLowerCase() === "div") {
        const x = event.targetTouches[0].clientX - this.state.x;
        const y = event.targetTouches[0].clientY - this.state.y;
        this._onTitleBarSetOffset(x, y);
      }
    }
  };

  private _onTitleBarSetOffset = (offsetX: number, offsetY: number, moving = true) => {
    if (this._frozen) return;
    this._isWindowMoving = moving;
    this._titleBarOffsetX = offsetX || 0;
    this._titleBarOffsetY = offsetY || 0;
  };

  private getStyle(): React.CSSProperties {
    let zIndex = 10;
    if (this.active) zIndex = 10000;
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

  runningDirectory() {
    return this.props.launchFile;
  }

  private _buttonMinimize = () => {
    if (this._frozen) return;
    const we = new WindowEvent("minimize", this);
    if (this.onMinimize) {
      try {
        this.onFocus(we);
      } catch (error) {
        this.exit();
        MessageBox._anonymousShow(`${getMessageFromError(error, "An error occurred in onMinimize() method")}`);
      }
    }

    if (!we.isDefaultPrevented) this.minimize();
  };

  private buttonExit = () => {
    if (this._frozen) return;
    const we = new WindowEvent("exit", this);
    if (this.onExit) {
      try {
        this.onExit(we);
      } catch (error) {
        this.exit();
        MessageBox._anonymousShow(`${getMessageFromError(error, "An error occurred in onExit() method")}`);
      }
    }
    if (!we.isDefaultPrevented) this.exit();
  };

  exit(): Promise<void> {
    return new Promise(async resolve => {
      if (this.closing) {
        try {
          const promise = this.closing();
          if (promise instanceof Promise) await promise;
        } catch (error) {
          MessageBox._anonymousShow(
            getMessageFromError(error, "An error occurred while closing"),
            "Error",
            MessageBoxButtons.OK,
            MessageBoxIcon.Error,
          );
        }
      }
      securityKeys.delete(this);
      this.setState({
        animate: "out",
      });
      const t = setTimeout(() => {
        internal.system.processor.killProcess(this);
        this._destroyed = true;
        this._removeTimeout(t);
        resolve();
      }, 200);
      this.timeouts.push(t);
    });
  }

  private _buttonRestore = () => {
    if (this._frozen) return;
    const we = new WindowEvent("restore", this);
    if (this.onRestore) {
      try {
        this.onRestore(we);
      } catch (error) {
        this.exit();
        MessageBox._anonymousShow(`${getMessageFromError(error, "An error occurred in onRestore() method")}`);
      }
    }
    if (!we.isDefaultPrevented) this.maximizeRestoreDown();
  };

  private _buttonMaximize = () => {
    if (this._frozen) return;
    const we = new WindowEvent("maximize", this);
    if (this.onMaximize) {
      try {
        this.onMaximize(we);
      } catch (error) {
        this.exit();
        MessageBox._anonymousShow(`${getMessageFromError(error, "An error occurred in onMaximize() method")}`);
      }
    }
    if (!we.isDefaultPrevented) this.maximizeRestoreDown();
  };

  maximizeRestoreDown = () => {
    const options = { ...this.state.options };
    options.maximized = !options.maximized;

    if (options.maximized || options.windowType === "fullscreen") {
      this._memorizedState = {
        x: this.state.x,
        y: this.state.y,
      };
    } else {
      this.setState({
        x: this._memorizedState.x,
        y: this._memorizedState.y,
      });
    }

    this.setState({
      animate: "in",
      options,
    });
    const t = setTimeout(() => {
      this._removeTimeout(t);
      this.setState({ animate: "none" });
    }, 500);
    this.timeouts.push(t);
  };

  /** Internal function use setVariables()
   * @deprecated
   * @inheritdoc
   */
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
    const launchFile = this.props && this.props.launchFile;
    if (!launchFile || launchFile.deleted) {
      setTimeout(() => {
        this.exit();
      });
      return;
    } else if (launchFile.getType(internal.systemSymbol) !== "lindowApp") {
      console.log("not not lindows app");
      setTimeout(() => {
        this.exit();
      });
      return;
    } else if (!launchFile.getContent(internal.systemSymbol).app) {
      setTimeout(() => {
        this.exit();
      });
      return;
    }
    if (!this._mounted) {
      if (!this._warnOnce) {
        MessageBox._anonymousShow("Trying to update not mounted or destroyed window", "Crash prevention");
        this._warnOnce = true;
        this.exit();
      }
    } else {
      super.setState(state, callback);
      if (this.onUpdate) {
        try {
          this.onUpdate(this.state.variables);
        } catch (error) {
          this.exit();
          MessageBox._anonymousShow(`${getMessageFromError(error, "An error occurred in onUpdate() method")}`);
        }
      }
    }
  }

  private verifyOptions(options?: IWindow): IWindow {
    if (!options) options = {};
    return {
      windowType: options.windowType === undefined ? "windowed" : options.windowType,
      resizable: options.resizable === undefined ? true : options.resizable,
      startPos: options.startPos === undefined ? "card" : options.startPos,
      closeButton: options.closeButton === undefined ? "shown" : options.closeButton,
      minimizeButton: options.minimizeButton === undefined ? "shown" : options.minimizeButton,
      maximized: options.maximized === undefined ? false : options.maximized,
      minimized: options.minimized === undefined ? false : options.minimized,
      width: options.width === undefined ? window.innerWidth : options.width,
      height: options.height === undefined ? window.innerHeight : options.height,

      maxWidth: options.maxWidth === undefined ? window.innerWidth : options.maxWidth,
      maxHeight: options.maxHeight === undefined ? window.innerHeight : options.maxHeight,

      minWidth: options.minWidth === undefined ? 0 : options.minWidth,
      minHeight: options.maxHeight === undefined ? 0 : options.minHeight,

      image: options.image === undefined ? this.getManifest().icon || DEFAULT_APP_IMAGE : options.image,
      redirectToWebpageButton: options.redirectToWebpageButton || options.redirectToWebpageButton,
      showIcon: options.showIcon === undefined ? true : options.showIcon,
      title: options.title === undefined ? this.getManifest().fullAppName || "An app" : options.title,
      maximizeRestoreDownButton:
        options.maximizeRestoreDownButton === undefined ? "shown" : options.maximizeRestoreDownButton,
      alwaysOnTop: options.alwaysOnTop === undefined ? false : options.alwaysOnTop,
    };
  }

  protected setX(x: number) {
    const width = clamp(this.state.width, 0, window.innerWidth);
    this.setState({ x, width });
  }
  protected setY(y: number) {
    const height = clamp(this.state.height, 0, window.innerHeight);
    this.setState({ y, height });
  }

  private _removeTimeout(timeout: NodeJS.Timeout | number) {
    const indexOf = this.timeouts.indexOf(timeout);
    clearTimeout(timeout as number);
    if (indexOf === -1) return;
    this.timeouts.splice(indexOf, 1);
  }

  private _keyboard = (ev: KeyboardEvent) => {
    if (this._frozen) return;
    if (!this.state.active) return;
    switch (ev.type) {
      case "keydown":
        if (this.onKeyDown) {
          try {
            this.onKeyDown(ev);
          } catch (error) {
            this.exit();
            MessageBox.Show(this, getMessageFromError(error, "an error occurred in onkeyDown"), "Error");
          }
        }
        break;
      case "keypress":
        if (this.onKeyPress) {
          try {
            this.onKeyPress(ev);
          } catch (error) {
            this.exit();
            MessageBox.Show(this, getMessageFromError(error, "an error occurred in onKeyPress"), "Error");
          }
        }
        break;
      case "keyup":
        if (this.onKeyUp) {
          try {
            this.onKeyUp(ev);
          } catch (error) {
            this.exit();
            MessageBox.Show(this, getMessageFromError(error, "an error occurred in onKeyUp"), "Error");
          }
        }
        break;
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
    return this._phone;
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

  get destroyed() {
    return !!this._destroyed;
  }

  getManifest(): IManifest {
    //@ts-ignore
    const manifest: IManifest = this.constructor.manifest;
    if (manifest) {
      return manifest;
    } else {
      return {
        fullAppName: "Anonymous app",
        launchName: "",
        icon: DEFAULT_APP_IMAGE,
      };
    }
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
export enum DialogResult {
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

interface IMessageBoxState {
  message: string;
  content: string;
  buttons: MessageBoxButtons;
  icon: MessageBoxIcon;
}

export class MessageBox extends BaseWindow<IMessageBoxState> {
  msgBoxEmitter = new EventEmitter();
  private _dialogResult: DialogResult;

  public static manifest: IManifest = {
    fullAppName: "message box",
    launchName: "msgBox",
    icon: "/assets/images/appsIcons/appIcon.svg",
  };

  constructor(props) {
    super(
      props,
      {
        title: "Message box",
        image: "/assets/images/appsIcons/appIcon.svg",
        startPos: "center",
        //alwaysOnTop: true,
        resizable: true,
        showIcon: false,
        minimizeButton: "hidden",
        maximizeRestoreDownButton: "hidden",
        minimized: false,
        minHeight: 175,
        minWidth: 400,
      },
      {
        message: "",
        content: "",
        buttons: MessageBoxButtons.OK,
        icon: MessageBoxIcon.None,
      },
    );
  }

  public static Show(
    baseWindow: BaseWindow,
    message: string,
    caption?: string,
    messageBoxButtons?: MessageBoxButtons,
    messageBoxIcon?: MessageBoxIcon,
  ) {
    return new Promise<DialogResult>(async resolve => {
      const reactGeneratorFunction: ReactGeneratorFunction = (id: number, props?: any) => (
        <MessageBox key={id} id={id} launchFile={baseWindow.props.launchFile} {...props}></MessageBox>
      );
      const key = securityKeys.get(baseWindow);
      baseWindow.freeze(key);
      const changeActiveState = baseWindow.changeActiveState;
      const messageBox = await internal.system.processor.addApp<MessageBox>(reactGeneratorFunction, "msgBox");

      const onClick = (dialogResult: DialogResult) => {
        messageBox.object.msgBoxEmitter.removeListener("onClick", onClick);
        baseWindow.changeActiveState = changeActiveState;
        baseWindow.unFreeze(key);
        resolve(dialogResult);
      };

      messageBox.object.message = message || "";
      messageBox.object.caption = caption || "Message box";
      messageBox.object.buttons = messageBoxButtons === undefined ? MessageBoxButtons.OK : messageBoxButtons;
      messageBox.object.icon = messageBoxIcon || MessageBoxIcon.None;
      baseWindow.changeActiveState = bool => {
        setTimeout(() => {
          if (bool && !messageBox.object.active) {
            messageBox.object.changeActiveState(true);
          }
        });
      };
      messageBox.object.msgBoxEmitter.on("onClick", onClick);
    });
  }

  onExit(event: WindowEvent) {
    this.onButtonClick(DialogResult.Cancel);
    event.preventDefault();
  }

  public static _anonymousShow(
    message: string,
    caption?: string,
    messageBoxButtons?: MessageBoxButtons,
    messageBoxIcon?: MessageBoxIcon,
  ) {
    const system = internal.systemSymbol;
    const apps = internal.fileSystem.root.getDirectory("bin", system).getDirectory("apps", system);

    const reactGeneratorFunction: ReactGeneratorFunction = (id: number, props?: any) => (
      <MessageBox
        key={id}
        id={id}
        launchFile={apps.getFile(MessageBox.manifest.launchName, system)}
        {...props}
      ></MessageBox>
    );
    setTimeout(async () => {
      const messageBox = await internal.system.processor.addApp<MessageBox>(reactGeneratorFunction, "msgBox");
      messageBox.object.message = message || "";
      messageBox.object.caption = caption || "Message box";
      messageBox.object.buttons = messageBoxButtons === undefined ? MessageBoxButtons.OK : messageBoxButtons;
      messageBox.object.icon = messageBoxIcon || MessageBoxIcon.None;
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

  set buttons(messageBoxButtons: MessageBoxButtons) {
    const variables = this.variables;
    variables.buttons = messageBoxButtons;
    this.setVariables(variables);
  }

  set icon(messageBoxIcon: MessageBoxIcon) {
    const variables = this.variables;
    variables.icon = messageBoxIcon;
    this.setVariables(variables);
  }

  private onButtonClick = (dialogResult: DialogResult, exit = true) => {
    this.msgBoxEmitter.emit("onClick", dialogResult);
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
    return (
      <MsgBoxWarper>
        <MsgBoxContent>
          {this.image}
          <MsgBoxCaption>{this.variables.message}</MsgBoxCaption>
        </MsgBoxContent>
        <MsgBoxButtons>{this.actionButtons}</MsgBoxButtons>
      </MsgBoxWarper>
    );
  }
}

export function getMessageFromError(error: Error, fallbackMessage: string) {
  if (typeof error === "string") {
    return error;
  } else if (typeof error === "object" && typeof error.message === "string") {
    return error.message;
  }
  return fallbackMessage;
}

export class AdminPromp extends BaseWindow {
  public static manifest: IManifest = {
    fullAppName: "Admin Prop",
    launchName: "adminProp",
    icon: "/assets/images/appsIcons/appIcon.svg",
  };

  adminPrompEmitter = new EventEmitter();
  private _baseWindow: BaseWindow;

  constructor(props) {
    super(props, {
      title: "User Account Control",
      image: "/assets/images/appsIcons/appIcon.svg",
      startPos: "center",
      alwaysOnTop: true,
      resizable: false,
      windowType: "borderless",

      minimizeButton: "hidden",
      maximizeRestoreDownButton: "hidden",
      minimized: false,
      minHeight: 400,
      minWidth: 400,
    });
  }

  static requestAdmin(baseWindow: BaseWindow) {
    return new Promise<boolean>(async resolve => {
      const reactGeneratorFunction: ReactGeneratorFunction = (id: number, props?: any) => (
        <AdminPromp key={id} id={id} launchFile={baseWindow.props.launchFile} {...props}></AdminPromp>
      );
      const key = securityKeys.get(baseWindow);
      baseWindow.freeze(key);
      const changeActiveState = baseWindow.changeActiveState;
      const adminPromp = await internal.system.processor.addApp<AdminPromp>(reactGeneratorFunction, "msgBox");

      const onClick = (bool: boolean) => {
        adminPromp.object.adminPrompEmitter.removeListener("onClick", onClick);
        adminPromp.object.exit();
        baseWindow.changeActiveState = changeActiveState;
        baseWindow.unFreeze(key);
        resolve(bool);
      };

      baseWindow.changeActiveState = bool => {
        setTimeout(() => {
          if (bool && !adminPromp.object.active) {
            adminPromp.object.changeActiveState(true);
          }
        });
      };
      adminPromp.object._baseWindow = baseWindow;
      adminPromp.object.forceUpdate();
      adminPromp.object.adminPrompEmitter.on("onClick", onClick);
    });
  }

  onExit(event: WindowEvent) {
    event.preventDefault();
    this.reject();
  }

  private accept = (mouseEvent: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (!mouseEvent) {
      return this.unknownSourceReject("function has been called without mouse event!");
    }
    if (!mouseEvent.isTrusted) {
      return this.unknownSourceReject("Action cannot be trusted!");
    }
    if (!this.reference) return;
    const div = this.reference.current as HTMLDivElement;
    const target = event.target as HTMLDivElement;
    if (div.contains(target)) {
      adminAllowed.set(this._baseWindow, true);
      this.adminPrompEmitter.emit("onClick", true);
      return securityKeys.get(this._baseWindow);
    }
    return this.unknownSourceReject("Unknown source of mouse event!");
  };

  private reject = () => {
    this.adminPrompEmitter.emit("onClick", false);
  };

  private unknownSourceReject(reason: string) {
    this.adminPrompEmitter.emit("onClick", false);
    MessageBox._anonymousShow(reason, "Security violation");
    return new Error(reason);
  }

  getIcon() {
    if (this._baseWindow && this._baseWindow.manifest && this._baseWindow.manifest.icon) {
      return <img src={this._baseWindow.manifest.icon} />;
    }
    return null;
  }

  getName() {
    if (this._baseWindow && this._baseWindow.manifest && this._baseWindow.manifest.fullAppName) {
      return <div>{this._baseWindow.manifest.fullAppName}</div>;
    }
    return null;
  }

  renderInside() {
    return (
      <UserAdminStyled>
        <UserAdminTop>
          <TitleBar>
            <TitleBarTitle>{this.state.options.title}</TitleBarTitle>
            <TitleBarRight>
              <TitleBarExit onClick={this.reject}>
                <FontAwesomeIcon icon={faTimes}></FontAwesomeIcon>
              </TitleBarExit>
            </TitleBarRight>
          </TitleBar>
          <UserAdminContent>Do you want to allow this app to make changes to your device?</UserAdminContent>
        </UserAdminTop>
        <UserAdminMiddle>
          {this.getIcon()}
          {this.getName()}
        </UserAdminMiddle>
        <UserAdminBottom>
          <button onClick={this.accept}>Yes</button>
          <button onClick={this.reject}>No</button>
        </UserAdminBottom>
      </UserAdminStyled>
    );
  }
}
attachToWindowIfDev("BaseWindow", BaseWindow);
