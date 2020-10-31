import React, { createRef } from "react";
import { SECOND } from "../../../shared/constants";
import { installPreInstalledApps } from "../../essential/apps";
import { installPreInstalledCommands } from "../../essential/Commands/CommandHandler";
import { internal } from "../../services/internals/Internal";
import { LindowsLoadingBar, LindowsLogo, LindowsWarper, LindowsWatermarks } from "./BootLindow";
import "./BootLindows.scss";

export interface BootProps {
  next: () => void;
}
interface BootState {
  loadingAnimation: number;
}

export class BootLindows extends React.Component<BootProps, BootState> {
  private readonly ANIMATION_TIME = 100;
  private readonly LOADING_BOX_WIDTH = 17;
  private readonly LOADERS = 3;
  private readonly LOADER_WIDTH = this.LOADERS * this.LOADING_BOX_WIDTH;
  private active = false;
  private lastNow = 0;
  private time = 0;
  private ref = createRef<HTMLDivElement>();

  constructor(props) {
    super(props);
    this.state = {
      loadingAnimation: this.startAnimationPos,
    };
  }

  get startAnimationPos() {
    return -this.LOADER_WIDTH;
  }

  eventLoop = () => {
    if (!this.active) return;
    const now = performance.now();
    const delta = now - this.lastNow;
    this.time += delta;
    this.lastNow = now;

    if (this.time > this.ANIMATION_TIME) {
      const { width } = this.ref.current.getBoundingClientRect();
      const pos = this.state.loadingAnimation + this.LOADING_BOX_WIDTH;
      if (width + this.LOADER_WIDTH < pos) {
        this.setState({ loadingAnimation: this.startAnimationPos });
      } else {
        this.setState({ loadingAnimation: pos });
      }

      this.time = 0;
    }

    requestAnimationFrame(this.eventLoop);
  };

  componentDidMount() {
    this.active = true;
    if (internal.readyToBoot) {
      this.boot();
    } else {
      internal.on("readyToBoot", this.boot);
    }
    this.lastNow = performance.now();
    this.eventLoop();
  }

  componentWillUnmount() {
    this.active = false;
  }

  boot = async () => {
    internal.removeListener("readyToBoot", this.boot);
    await internal.system.init();

    setTimeout(() => {
      this.props.next();
    }, SECOND * 5);
  };

  get loaderStyle(): React.CSSProperties {
    return { left: `${this.state.loadingAnimation}px` };
  }

  render() {
    return (
      <LindowsWarper>
        <LindowsLogo>
          <img src='./assets/images/lidcer-logo.svg' />
        </LindowsLogo>
        <LindowsLoadingBar>
          <div ref={this.ref} className='loading-box'>
            <div className='loading-animator' style={this.loaderStyle}>
              <span />
              <span />
              <span />
            </div>
          </div>
        </LindowsLoadingBar>
        <LindowsWatermarks>Lidcer</LindowsWatermarks>
      </LindowsWarper>
    );
  }
}
