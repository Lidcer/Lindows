import React from 'react';
import './Bios.scss';
import { services } from '../../services/services';
import { UAParser } from 'ua-parser-js';

interface IBIOSProps {
  next: (type: WebpageType) => void;
  shouldStayInBios: boolean;
}

declare type WebpageType = 'webpage' | 'lindows';

interface IBIOSState {
  progress: number;
  forward: boolean;
  rightSideInfo: string;

  popup?: {
    title: string;
    content: string;
    firstButton: IBIOSButton;
    secondButton?: IBIOSButton;
    thirdButton?: IBIOSButton;
  };
}
interface IBIOSButton {
  content: string;
  selected: boolean;
  fun: () => void;
}

interface IBIOSStorage {
  bootInLindows: boolean;
}

export class Bios extends React.Component<IBIOSProps, IBIOSState> {
  private readonly BROWSER_STORAGE_KEY = '__BIOS_STORAGE__';
  private interval: number;

  constructor(props: IBIOSProps) {
    super(props);
    this.state = {
      progress: 50,
      forward: false,
      rightSideInfo: 'Right side info',
    };
  }

  render() {
    return (
      <div className='bios'>
        {this.popup}
        <div className='top' style={this.style}>
          BIOS SETUP UTILITY
        </div>
        <div className='middle'>
          <div className='bios-settings'>
            {this.systemInfo}
            <div className='bios-settings-line'>
              <span>Reset storage:</span>
              <button onClick={this.resetStorage}>[ACTION]</button>
            </div>
            <div className='bios-settings-line'>
              <span>boot option:</span>
              <button onClick={this.bootOptionPopup}>[{this.bootOption}]</button>
            </div>
          </div>
          {this.info}
        </div>
        <div className='bottom'>V01.00 (C)Copyright 2020-2020, Lidcer MegaBin Icn</div>
      </div>
    );
  }

  get bootOption() {
    const data: IBIOSStorage = services.browserStorage.getItem(this.BROWSER_STORAGE_KEY);
    if (!data) return 'NONE';
    return data.bootInLindows ? 'Lindows' : 'WEBPAGE';
  }

  get systemInfo() {
    const systemInfo = services.fingerprinter;
    const userAgent = systemInfo.userAgent;
    const browser = userAgent.getBrowser();
    const cpu = userAgent.getCPU();
    const os = userAgent.getOS();
    const engine = userAgent.getEngine();
    return (
      <div className='bios-system-info'>
        <span>
          OS: {os.name} {os.version}
        </span>
        <span>
          Browser: {browser.name}({browser.version})
        </span>
        <span>
          Engine: {engine.name}({engine.version})
        </span>
        {cpu.architecture ? <span>CPU: {cpu.architecture}</span> : null}
        <span>Language: {systemInfo.language}</span>
        {this.getDevice(userAgent)}
      </div>
    );
  }

  get popup() {
    if (!this.state.popup) return null;
    const popup = this.state.popup;
    return (
      <>
        <div className='popup'>
          <div className='popup-title'>
            <span>{popup.title}</span>
          </div>
          <div className='popup-inner'>
            <div className='popup-inner-content'>{popup.content}</div>

            <div className='popup-buttons'>
              <button
                className={popup.firstButton.selected ? 'active' : ''}
                onMouseOver={() => this.selectHoverButtonPopup('first')}
                onClick={() => popup.secondButton.fun()}
              >
                {popup.secondButton.content}
              </button>
              {popup.secondButton ? (
                <button
                  className={popup.secondButton.selected ? 'active' : ''}
                  onMouseOver={() => this.selectHoverButtonPopup('second')}
                  onClick={() => popup.firstButton.fun()}
                >
                  {popup.firstButton.content}
                </button>
              ) : null}
              {popup.thirdButton ? (
                <button
                  className={popup.thirdButton.selected ? 'active' : ''}
                  onMouseOver={() => this.selectHoverButtonPopup('third')}
                  onClick={() => popup.thirdButton.fun()}
                >
                  {popup.thirdButton.content}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </>
    );
  }

  resetStorage = () => {
    const state = { ...this.state };

    state.popup = {
      title: 'Reset All settings',
      content: 'Your are about to reset all the settings. Are you sure that you want to do that?',
      firstButton: {
        content: 'Yes',
        selected: false,
        fun: async () => {
          services.browserStorage.clear();
          this.closePopup();
        },
      },
      secondButton: {
        content: 'No',
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
    if (window.innerWidth > window.innerHeight) {
      return <div className='bios-info'>{this.state.rightSideInfo}</div>;
    }
    return null;
  }

  componentDidMount() {
    this.interval = setInterval(this.animateBar);
    const data: IBIOSStorage = services.browserStorage.getItem(this.BROWSER_STORAGE_KEY);

    if (!data) this.bootOptionPopup();
    else if (!this.props.shouldStayInBios) {
      this.props.next(data.bootInLindows ? 'lindows' : 'webpage');
    }
  }

  bootOptionPopup = () => {
    const state = { ...this.state };
    state.popup = {
      title: 'Select boot option',
      content: 'Select in which thing would you like to boot',
      firstButton: {
        content: 'Lindows',
        selected: true,
        fun: () => this.selectOptionsBootOptionFirstBoot('lindows'),
      },
      secondButton: {
        content: 'webpage',
        selected: false,
        fun: () => this.selectOptionsBootOptionFirstBoot('webpage'),
      },
    };
    this.setState(state);
  };

  componentWillUnmount() {
    clearTimeout(this.interval);
  }

  selectHoverButtonPopup = (button: 'first' | 'second' | 'third') => {
    const state = this.state;
    if (!state.popup) return;
    state.popup.firstButton.selected = false;
    if (state.popup.secondButton) state.popup.secondButton.selected = false;
    if (state.popup.thirdButton) state.popup.thirdButton.selected = false;

    switch (button) {
      case 'first':
        state.popup.firstButton.selected = true;
        break;
      case 'second':
        if (state.popup.secondButton) state.popup.secondButton.selected = true;
        break;
      case 'third':
        if (state.popup.thirdButton) state.popup.thirdButton.selected = true;
        break;
    }
    this.setState(state);
  };

  animateBar = () => {
    const state = { ...this.state };
    const MULTIPLAYER = 0.05;
    if (this.state.forward) state.progress += MULTIPLAYER;
    else state.progress -= MULTIPLAYER;
    if (state.progress < 25) state.forward = true;
    if (state.progress > 75) state.forward = false;
    this.setState(state);
  };

  get style(): React.CSSProperties {
    return {
      background: `linear-gradient(90deg, rgba(0, 0, 0, 1) 0%, rgba(25, 34, 253, 1) ${this.state.progress}%, rgba(0, 0, 0, 1) 100%)`,
    };
  }

  selectOptionsBootOptionFirstBoot = async (type: WebpageType) => {
    const data: IBIOSStorage = {
      bootInLindows: type === 'lindows',
    };
    this.closePopup();
    await services.browserStorage.setItem(this.BROWSER_STORAGE_KEY, data);
    if (!this.props.shouldStayInBios) this.props.next(type);
  };

  getDevice(userAgent: UAParser) {
    const device = userAgent.getDevice();
    if (!device.model || !device.vendor) return null;
    const model = device.model || '';
    const vendor = device.vendor || '';
    const type = device.type || '';

    const deviceString = `${vendor} ${type} ${model}`;
    return <span>Device: {deviceString}</span>;
  }
}
