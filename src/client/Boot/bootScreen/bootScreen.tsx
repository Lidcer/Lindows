import React from "react";
import { internal } from "../../services/internals/Internal";
import { SECOND } from "../../../shared/constants";

import {
  BootScreenStyled,
  BootScreenMiddle,
  BootScreenTop,
  BootScreenBottom,
  BootScreenInfo,
} from "./bootScreenStyled";
import { inIframe } from "../../utils/util";

interface IBootScreenProps {
  next: (bios?: "bios" | "bootLindows") => void;
  goToBios: () => void;
}

interface IBootScreenState {
  messageToDisplay: string[];
  goToBios: boolean;
}

export class BootScreen extends React.Component<IBootScreenProps, IBootScreenState> {
  private timeout: NodeJS.Timeout;
  private takingToLong = false;
  onTouchTimeoutFunction: NodeJS.Timeout;

  constructor(props: IBootScreenProps) {
    super(props);
    this.state = {
      messageToDisplay: [],
      goToBios: false,
    };
  }
  render() {
    return (
      <BootScreenStyled>
        <BootScreenTop>
          <BootScreenInfo>
            <span>Lidcer BIOS v1.0, in browser bios</span>
            <span>Copyright (C) 2020-2020, Lidcer Software, Inc </span>
          </BootScreenInfo>
          <img src='./assets/images/LidcerBiosLogo.svg' alt='biosLogo' />
        </BootScreenTop>
        <BootScreenMiddle>
          <ul>{this.messages}</ul>
        </BootScreenMiddle>
        <BootScreenBottom>
          <span>08/3/2020-489/Id2/WSD6</span>
          {this.biosMessage}
        </BootScreenBottom>
      </BootScreenStyled>
    );
  }

  get biosMessage() {
    if (this.state.goToBios) return <span>Entering setup...</span>;
    else
      return (
        <span>
          Press <b> DEL</b> to enter Setup, <b>ALT+F4</b> to force shutdown
        </span>
      );
  }

  get messages() {
    return this.state.messageToDisplay.map((m, i) => {
      return <li key={i}>{m}</li>;
    });
  }
  componentDidMount() {
    if (this.timeout === undefined) {
      this.timeout = setTimeout(() => {
        this.state.messageToDisplay.push(
          "This is taking to long! Your system might be broken you can try and reset browser storage!",
        );
        this.takingToLong = true;
      }, SECOND * 15);
    }

    if (internal.ready) {
      this.readyToBoot();
    }
    internal.on("readyToBoot", this.readyToBoot);
    internal.on("onServiceReady", this.onServiceReady);
    internal.on("onServiceFailed", this.onServiceFailed);
    document.addEventListener("keydown", this.keypress, false);
    document.addEventListener("touchstart", this.onTouchStart, false);
    document.addEventListener("touchend", this.onTouchEnd, false);
  }
  componentWillUnmount() {
    if (this.timeout !== undefined) {
      clearTimeout(this.timeout);
    }
    internal.removeListener("readyToBoot", this.readyToBoot);
    internal.removeListener("onServiceReady", this.onServiceReady);
    internal.removeListener("onServiceFailed", this.onServiceFailed);
    document.removeEventListener("keydown", this.keypress, false);
    document.removeEventListener("touchstart", this.onTouchStart, false);
    document.removeEventListener("touchend", this.onTouchEnd, false);
    if (this.onTouchTimeoutFunction) clearTimeout(this.onTouchTimeoutFunction);
  }

  onTouchStart = (ev: MouseEvent) => {
    this.onTouch(true);
  };

  onTouchEnd = (ev: MouseEvent) => {
    this.onTouch(false);
  };

  onTouch(start: boolean) {
    if (this.onTouchTimeoutFunction) {
      clearTimeout(this.onTouchTimeoutFunction);
    }
    if (start) {
      this.onTouchTimeoutFunction = setTimeout(() => {
        this.setState({ goToBios: true });
      }, SECOND * 2);
    }
  }

  keypress = (ev: KeyboardEvent) => {
    if (ev.key.toLowerCase() === "delete") {
      if (this.takingToLong) {
        return this.props.next("bios");
      }
      this.setState({ goToBios: true });
    }
  };

  readyToBoot = () => {
    const bootTime = inIframe() ? 5000 : STATIC ? 1000 : 500;
    setTimeout(() => {
      if (this.state.goToBios) {
        this.props.goToBios();
      } else {
        this.props.next();
      }
    }, bootTime);
    //launchApp('lype');
    // setTimeout(() => {
    //   this.props.next(this.state.goToBios ? 'bios' : undefined);
    // }, SECOND * 3);
  };

  onServiceReady = (name: string) => {
    const state = { ...this.state };
    this.state.messageToDisplay.push(`Initialized ${name}`);
    this.setState(state);
  };
  onServiceFailed = (name: string) => {
    const state = { ...this.state };
    this.state.messageToDisplay.push(`Failed to initialized ${name}`);
    this.setState(state);
  };
}
