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
import { SystemServiceStatus } from "../../services/internals/BaseSystemService";
import { clamp, random } from "lodash";
import Axios from "axios";

interface IBootScreenProps {
  next: (bios?: "bios" | "bootLindows") => void;
  goToBios: () => void;
}

interface IBootScreenState {
  ramTest: string;
  messageToDisplay: string[];
  goToBios: boolean;
}

export class BootScreen extends React.Component<IBootScreenProps, IBootScreenState> {
  private timeout: NodeJS.Timeout;
  private takingToLong = false;
  private error = false;
  onTouchTimeoutFunction: NodeJS.Timeout;

  constructor(props: IBootScreenProps) {
    super(props);
    this.state = {
      messageToDisplay: [],
      goToBios: false,
      ramTest: "",
    };
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
  get ramTest() {
    return this.state.ramTest;
  }

  doRamTest() {
    return new Promise(resolve => {
      const ram = ((navigator as any).deviceMemory || 1) * 1000;
      let currentValue = 0;
      const setState = () => {
        this.setState({ ramTest: `Testing ram ${currentValue}mb/${ram}mb` });
      };

      const increment = async () => {
        currentValue = clamp(random(currentValue + 1, currentValue + 25), 0, ram);
        setState();
        if (currentValue === ram) {
          try {
            const result = await Axios.post<{ ready: boolean }>("/api/v1/ready");
            const state = { ...this.state };
            if (result.data.ready) {
              this.setState({ ramTest: `${this.state.ramTest} Succeeded` });
              this.forceUpdate();
              return resolve();
            } else {
              this.setState({ ramTest: `${this.state.ramTest} Failed try again later` });
              return resolve();
            }
            this.forceUpdate();
          } catch (error) {
            this.setState({ ramTest: `${this.state.ramTest} Failed` });
            this.forceUpdate();
          }
          return;
        }
        setTimeout(() => {
          increment();
        }, 5);
      };
      setState();
      increment();
    });
  }

  async componentDidMount() {
    internal.on("readyToBoot", this.readyToBoot);
    internal.on("onServiceReady", this.onServiceReady);
    internal.on("onServiceFailed", this.onServiceFailed);
    document.addEventListener("keydown", this.keypress, false);
    document.addEventListener("touchstart", this.onTouchStart, false);
    document.addEventListener("touchend", this.onTouchEnd, false);

    if (this.timeout === undefined) {
      this.timeout = setTimeout(() => {
        if (!this.error) {
          const state = { ...this.state };
          state.messageToDisplay.push("This is taking to long!");
          state.messageToDisplay.push("Your system might be broken. You can resolve issues in Setup.");
          state.messageToDisplay.push("Press DEL to run Setup.");
          this.takingToLong = true;
          this.setState(state);
        }
      }, SECOND * 15);
    }

    if (internal.ready) {
      this.readyToBoot();
    }
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
      if (this.takingToLong || this.error) {
        return this.props.goToBios();
      }
      this.setState({ goToBios: true });
    }
  };

  readyToBoot = async () => {
    if (this.timeout !== undefined) {
      clearTimeout(this.timeout);
    }
    const urlParams = new URLSearchParams(window.location.search);
    const doRamTest = urlParams.get("ram-test") !== null;
    if (doRamTest && !this.state.ramTest) {
      await this.doRamTest();
      window.history.pushState({}, document.title, "/");
    }
    if (internal.fileSystem.status() === SystemServiceStatus.Failed) {
      const state = { ...this.state };
      this.error = true;
      state.messageToDisplay.push(``);
      state.messageToDisplay.push(`File system error!`);
      state.messageToDisplay.push(`Press DEL to run Setup`);
      this.setState(state);
      return;
    }

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
          <ul>{this.ramTest}</ul>
        </BootScreenMiddle>
        <BootScreenBottom>
          <span>08/3/2020-489/Id2/WSD6</span>
          {this.biosMessage}
        </BootScreenBottom>
      </BootScreenStyled>
    );
  }
}
