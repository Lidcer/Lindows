import React from "react";
import { UAParser } from "ua-parser-js";
import { Keypress } from "../../essential/constants/Keypress";
import Axios from "axios";
import { IP, IIPResponse } from "../../../shared/ApiUsersRequestsResponds";
import {
  BiosStyled,
  BiosTop,
  BiosTitle,
  BiosGradient,
  BiosNavBar,
  BiosButton,
  BiosMiddle,
  BiosSettings,
  BiosSystemInfo,
  BiosPopup,
  BiosPopupInner,
  BiosPopupTitle,
  BiosPopupInnerContent,
  BiosPopupButtons,
  BiosInfo,
  BiosTopInfo,
  BiosBottomInfo,
  BiosBottom,
} from "./BiosStyled";
import { inIframe } from "../../utils/util";
import { BiosTermsAndPolicy } from "./TermsAndPolicy";
import { internal } from "../../services/internals/Internal";

interface IBIOSProps {
  next: () => void;
}

declare type Tab = "main" | "network" | "exit";
const TAB: Tab[] = ["main", "network", "exit"];
declare type GradientColours = [number, number, number];

interface IBIOSState {
  progress: number;
  forward: boolean;
  rightSideInfo: string;
  tab: Tab;
  gradient: GradientColours[];

  networkInfo?: IP;

  popup?: {
    title: string;
    content: string;
    firstButton: IBiosButton;
    secondButton?: IBiosButton;
    thirdButton?: IBiosButton;
  };
}
interface IBiosButton {
  content: string;
  selected: boolean;
  fun: () => void;
}

interface IBIOSStorage {
  bootInLindows: boolean;
}

function initGradient() {
  const COLOUR = [25, 34, 253];
  const RANGE = internal.hardwareInfo.mobile.mobile() ? 25 : 100;
  const HALF = Math.floor(RANGE * 0.5);
  const R_MULTIPLAYER = COLOUR[0] / HALF;
  const G_MULTIPLAYER = COLOUR[1] / HALF;
  const B_MULTIPLAYER = COLOUR[2] / HALF;
  const gradientColours: GradientColours[] = [];
  for (let i = 0; i < RANGE; i++) {
    if (i === 0) {
      gradientColours.push([0, 0, 0]);
      continue;
    }
    const pE = gradientColours[i - 1];
    if (i < HALF) {
      gradientColours.push([
        Math.floor(pE[0] + R_MULTIPLAYER),
        Math.floor(pE[1] + G_MULTIPLAYER),
        Math.floor(pE[2] + B_MULTIPLAYER),
      ]);
    } else {
      gradientColours.push([
        Math.floor(pE[0] - R_MULTIPLAYER),
        Math.floor(pE[1] - G_MULTIPLAYER),
        Math.floor(pE[2] - B_MULTIPLAYER),
      ]);
    }
  }
  return gradientColours;
}

const MAIN_TAB_INFO = "This section is showing info about your system";

export class Bios extends React.Component<IBIOSProps, IBIOSState> {
  private readonly BROWSER_STORAGE_KEY = "__BIOS_STORAGE__";
  private networkStatus: "unknown" | "fetched" | "noConnection" | "fetching" | "notAvailable" = "unknown";
  private interval: NodeJS.Timeout;

  constructor(props: IBIOSProps) {
    super(props);
    this.state = {
      gradient: initGradient(),
      progress: 50,
      forward: false,
      rightSideInfo: MAIN_TAB_INFO,
      tab: "main",
    };
  }

  render() {
    const footerText = "V01.00 (C)Copyright 2020-2020, Lidcer MegaBin Inc";
    if (showTermsOfPolicy()) {
      return (
        <BiosStyled>
          {this.popup}
          <BiosTop>
            <BiosTitle> BIOS SETUP UTILITY</BiosTitle>
            <BiosGradient> {this.renderGradient}</BiosGradient>
          </BiosTop>
          <BiosNavBar>
            <span>Main</span>
            <span>Network</span>
            <span className='active'>Terms and conditions</span>
            <span>Exit</span>
          </BiosNavBar>
          <BiosMiddle>
            {this.renderTab}
            {this.info}
          </BiosMiddle>
          <BiosBottom>{footerText}</BiosBottom>
        </BiosStyled>
      );
    }

    return (
      <BiosStyled>
        {this.popup}
        <BiosTop>
          <BiosTitle> BIOS SETUP UTILITY</BiosTitle>
          <BiosGradient> {this.renderGradient}</BiosGradient>
        </BiosTop>
        <BiosNavBar>
          <span className={this.state.tab === "main" ? "active" : null} onClick={() => this.changeTab("main")}>
            Main
          </span>
          <span className={this.state.tab === "network" ? "active" : null} onClick={() => this.changeTab("network")}>
            Network
          </span>
          <span className={this.state.tab === "exit" ? "active" : null} onClick={() => this.changeTab("exit")}>
            Exit
          </span>
        </BiosNavBar>
        <BiosMiddle>
          {this.renderTab}
          {this.info}
        </BiosMiddle>
        <BiosBottom>{footerText}</BiosBottom>
      </BiosStyled>
    );
  }

  get renderGradient() {
    return this.state.gradient.map((e, i) => {
      return (
        <span key={i} style={{ backgroundColor: `rgba(${e[0]}, ${e[1]}, ${e[2]},1)` }}>
          &nbsp;
        </span>
      );
    });
  }

  get renderTab() {
    if (showTermsOfPolicy()) {
      return (
        <BiosTermsAndPolicy
          onAcceptTermsOfPolicy={() => {
            this.setState({
              popup: {
                title: "Have you read it all?",
                content: "With this action you agreed that you have read everything that has been written on page",
                firstButton: {
                  content: "Accept",
                  selected: false,
                  fun: () => {
                    localStorage.setItem("terms-of-policy", "true");
                    location.reload();
                    this.setState({ popup: undefined, tab: "exit" });
                  },
                },
                secondButton: {
                  content: "Read it again",
                  selected: true,
                  fun: () => {
                    this.setState({ popup: undefined });
                  },
                },
                thirdButton: {
                  content: "I don't agree",
                  selected: false,
                  fun: () => {
                    localStorage.clear();
                    location.href = "https://duckduckgo.com/";
                  },
                },
              },
            });
          }}
        />
      );
    } else if (this.state.tab === "main")
      return (
        <BiosSettings>
          {this.systemInfo}

          <table>
            <tbody>
              <tr>
                <td>Reset storage:</td>
                <td>
                  <BiosButton onClick={this.resetStorage}>[ACTION]</BiosButton>
                </td>
              </tr>
              {/* <tr>
                <td>Boot options:</td>
                <td>
                  <button onClick={this.bootOptionPopup}>[{this.bootOption}]</button>
                </td>
              </tr> */}
            </tbody>
          </table>
        </BiosSettings>
      );
    else if (this.state.tab === "network") {
      if (STATIC) {
        return (
          <BiosSettings>
            <BiosSystemInfo>
              <span>Not available in demo version</span>
            </BiosSystemInfo>
          </BiosSettings>
        );
      }

      if (this.networkStatus === "unknown") {
        this.networkStatus = "fetching";
        Axios.get<IIPResponse>("/api/v1/ip")
          .then(result => {
            const props = { ...this.state };
            props.networkInfo = result.data.success;
            this.networkStatus = "fetched";
            this.setState(props);
          })
          .catch(err => {
            console.error(err);
            this.networkStatus = "noConnection";
            this.setState({});
          });
      }

      if (!this.state.networkInfo) {
        return <div>Fetching</div>;
      } else {
        const netInfo = this.state.networkInfo;
        return (
          <BiosSettings>
            <BiosSystemInfo>
              <span>IP: {netInfo.ip}</span>
              {netInfo.city ? <span>City: {netInfo.city}</span> : null}
              {netInfo.loc ? <span>Location: {netInfo.loc}</span> : null}
              {netInfo.org ? <span>Org: {netInfo.org}</span> : null}
              {netInfo.postal ? <span>Postal: {netInfo.postal}</span> : null}
              {netInfo.timezone ? <span>Timezone: {netInfo.timezone}</span> : null}
              {netInfo.region ? <span>Region: {netInfo.region}</span> : null}
              {netInfo.hostname ? <span>Hostname: {netInfo.hostname}</span> : null}
            </BiosSystemInfo>
          </BiosSettings>
        );
      }
    } else if (this.state.tab === "exit") {
      return (
        <BiosSettings>
          <table>
            <tbody>
              <tr>
                <td>
                  <BiosButton className={true ? "" : "active"}>{"[Save changes & reboot]"}</BiosButton>
                </td>
              </tr>
              <tr>
                <td>
                  <BiosButton className={false ? "" : "active"}>{"[Discard changes & reboot]"}</BiosButton>
                </td>
              </tr>
              <tr>
                <td>
                  <BiosButton className={false ? "" : "active"}>{"[Discard changes]"}</BiosButton>
                </td>
              </tr>
              <tr>
                <td>
                  <BiosButton className={false ? "" : "active"}>{"[Load defaults]"}</BiosButton>
                </td>
              </tr>
            </tbody>
          </table>
        </BiosSettings>
      );
    }
    return null;
  }

  get systemInfo() {
    const systemInfo = internal.hardwareInfo;
    const userAgent = systemInfo.userAgent;
    const browser = userAgent.getBrowser();
    const cpu = userAgent.getCPU();
    const os = userAgent.getOS();
    const engine = userAgent.getEngine();
    return (
      <BiosSystemInfo>
        <span>OS: {inIframe() ? "Lindows Alpha 1.0.0" : `${os.name} ${os.version}`}</span>
        <span>Browser: {inIframe() ? "Virtual crate(unknown)" : `${browser.name}(${browser.version})`}</span>
        <span>Engine: {inIframe() ? "Link(unknown)" : `${engine.name}(${engine.version})`}</span>
        {cpu.architecture ? <span>CPU: {cpu.architecture}</span> : null}
        <span>Language: {systemInfo.language}</span>
        {this.getDevice(userAgent)}
      </BiosSystemInfo>
    );
  }

  get popup() {
    if (!this.state.popup) return null;
    const popup = this.state.popup;
    return (
      <>
        <BiosPopup>
          <BiosPopupTitle>
            <span>{popup.title}</span>
          </BiosPopupTitle>
          <BiosPopupInner>
            <BiosPopupInnerContent>{popup.content}</BiosPopupInnerContent>

            <BiosPopupButtons>
              <button
                className={popup.firstButton.selected ? "bios-active" : ""}
                onMouseOver={() => this.selectHoverButtonPopup("first")}
                onClick={() => popup.firstButton.fun()}
              >
                {popup.firstButton.content}
              </button>
              {popup.secondButton ? (
                <button
                  className={popup.secondButton.selected ? "bios-active" : ""}
                  onMouseOver={() => this.selectHoverButtonPopup("second")}
                  onClick={() => popup.secondButton.fun()}
                >
                  {popup.secondButton.content}
                </button>
              ) : null}
              {popup.thirdButton ? (
                <button
                  className={popup.thirdButton.selected ? "bios-active" : ""}
                  onMouseOver={() => this.selectHoverButtonPopup("third")}
                  onClick={() => popup.thirdButton.fun()}
                >
                  {popup.thirdButton.content}
                </button>
              ) : null}
            </BiosPopupButtons>
          </BiosPopupInner>
        </BiosPopup>
      </>
    );
  }

  resetStorage = () => {
    const state = { ...this.state };

    state.popup = {
      title: "Reset All settings",
      content: "You are about to reset all the settings. Are you sure that you want to do that?",
      firstButton: {
        content: "Yes",
        selected: false,
        fun: async () => {
          if (inIframe()) {
            internal.broadcaster.emit("vm", { type: "request-clear-data", origin });
            this.closePopup();
          } else {
            localStorage.clear();
            this.closePopup();
          }
        },
      },
      secondButton: {
        content: "No",
        selected: true,
        fun: () => {
          this.closePopup();
        },
      },
    };
    this.setState(state);
  };

  closePopup = () => {
    const state = { ...this.state };
    state.popup = undefined;
    this.setState(state);
  };

  get info() {
    if (window.innerWidth > window.innerHeight && !showTermsOfPolicy()) {
      return (
        <BiosInfo>
          <BiosTopInfo>{this.state.rightSideInfo}</BiosTopInfo>
          <BiosBottomInfo></BiosBottomInfo>
        </BiosInfo>
      );
    }
    return null;
  }

  componentDidMount() {
    this.interval = setInterval(this.animateBar, 50);
    // const data: IBIOSStorage = services.browserStorage.getItem(this.BROWSER_STORAGE_KEY);

    // if (!data) this.bootOptionPopup();
    // else if (!this.props.shouldStayInBios) {
    //   this.props.next(data.bootInLindows ? 'lindows' : 'webpage');
    //   return;
    // }
    document.addEventListener("keyup", this.keyboardListener, false);
  }

  bootOptionPopup = () => {
    // const state = { ...this.state };
    // state.popup = {
    //   title: 'Select boot option',
    //   content: 'Select in which thing would you like to boot',
    //   firstButton: {
    //     content: 'Lindows',
    //     selected: true,
    //     fun: () => this.selectOptionsBootOptionFirstBoot('lindows'),
    //   },
    //   secondButton: {
    //     content: 'webpage',
    //     selected: false,
    //     fun: () => this.selectOptionsBootOptionFirstBoot('webpage'),
    //   },
    //   thirdButton: {
    //     content: 'Close',
    //     selected: false,
    //     fun: () => this.closePopup(),
    //   },
    // };
    //this.setState(state);
  };

  componentWillUnmount() {
    clearTimeout(this.interval);
    document.removeEventListener("keyup", this.keyboardListener, false);
  }

  selectHoverButtonPopup = (button: "first" | "second" | "third") => {
    const state = this.state;
    if (!state.popup) return;
    state.popup.firstButton.selected = false;
    if (state.popup.secondButton) state.popup.secondButton.selected = false;
    if (state.popup.thirdButton) state.popup.thirdButton.selected = false;

    switch (button) {
      case "first":
        state.popup.firstButton.selected = true;
        break;
      case "second":
        if (state.popup.secondButton) state.popup.secondButton.selected = true;
        break;
      case "third":
        if (state.popup.thirdButton) state.popup.thirdButton.selected = true;
        break;
    }
    this.setState(state);
  };

  animateBar = () => {
    const state = { ...this.state };
    const endColour = state.gradient.pop();
    state.gradient.unshift(endColour);
    this.setState(state);
  };

  get style(): React.CSSProperties {
    return {
      background: `linear-gradient(90deg, rgba(0, 0, 0, 1) 0%, rgba(25, 34, 253, 1) ${this.state.progress}%, rgba(0, 0, 0, 1) 100%)`,
    };
  }

  // selectOptionsBootOptionFirstBoot = async (type: WebpageType) => {
  //   const data: IBIOSStorage = {
  //     bootInLindows: type === 'lindows',
  //   };
  //   this.closePopup();
  //   await internal.browserStorage.setItem(this.BROWSER_STORAGE_KEY, data);
  //   if (!this.props.shouldStayInBios) this.props.next('bootLindows');
  // };

  getDevice(userAgent: UAParser) {
    const device = userAgent.getDevice();
    if (!device.model || !device.vendor) return null;
    const model = device.model || "";
    const vendor = device.vendor || "";
    const type = device.type || "";

    const deviceString = `${vendor} ${type} ${model}`;
    return <span>Device: {deviceString}</span>;
  }

  changeTab(tab: Tab) {
    this.setState({ tab });
  }

  nextOrPreviousTab(next: boolean) {
    let index = TAB.indexOf(this.state.tab);
    if (next) index++;
    else index--;
    if (TAB[index]) {
      this.setState({ tab: TAB[index] });
    }
  }

  keyboardListener = (ev: KeyboardEvent) => {
    const st = this.state;
    //console.log(ev);
    switch (ev.keyCode) {
      case Keypress.ArrowRight:
        if (st.popup) {
          if (st.popup.firstButton.selected && st.popup.secondButton) this.selectHoverButtonPopup("second");
          else if (st.popup.secondButton && st.popup.secondButton.selected && st.popup.thirdButton)
            this.selectHoverButtonPopup("third");
        } else {
          this.nextOrPreviousTab(true);
        }

        return;
      case Keypress.ArrowLeft:
        if (st.popup) {
          if (st.popup.secondButton && st.popup.secondButton.selected) this.selectHoverButtonPopup("first");
          else if (st.popup.thirdButton && st.popup.thirdButton.selected && st.popup.secondButton)
            this.selectHoverButtonPopup("second");
        } else {
          this.nextOrPreviousTab(false);
        }
        return;
      case Keypress.Enter:
        if (st.popup) {
          if (st.popup.firstButton.selected) st.popup.firstButton.fun();
          if (st.popup.secondButton && st.popup.secondButton.selected) st.popup.secondButton.fun();
          if (st.popup.thirdButton && st.popup.thirdButton.selected) st.popup.thirdButton.fun();
        }
        return;
      default:
        break;
    }
  };
}

export function showTermsOfPolicy() {
  return localStorage.getItem("terms-of-policy") !== "true" && !STATIC;
}
