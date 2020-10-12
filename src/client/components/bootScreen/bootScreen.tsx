import React from 'react';
import { services } from '../../services/SystemService/ServiceHandler';
import { SECOND } from '../../../shared/constants';
import { launchApp } from '../../essential/apps';
import {
  BootScreenStyled,
  BootScreenMiddle,
  BootScreenTop,
  BootScreenBottom,
  BootScreenInfo,
} from './bootScreenStyled';
import { inIframe } from '../../utils/util';

interface IBootScreenProps {
  next: (bios?: 'bios') => void;
}

interface IBootScreenState {
  messageToDisplay: string[];
  goToBios: boolean;
}

export class BootScreen extends React.Component<IBootScreenProps, IBootScreenState> {
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
    if (services.ready) {
      this.allReady();
    }
    services.on('allReady', this.allReady);
    services.on('onServiceReady', this.onServiceReady);
    services.on('onServiceFailed', this.onServiceFailed);
    document.addEventListener('keydown', this.keypress, false);
    document.addEventListener('touchstart', this.onTouchStart, false);
    document.addEventListener('touchend', this.onTouchEnd, false);
  }
  componentWillUnmount() {
    services.removeListener('allReady', this.allReady);
    services.removeListener('onServiceReady', this.onServiceReady);
    services.removeListener('onServiceFailed', this.onServiceFailed);
    document.removeEventListener('keydown', this.keypress, false);
    document.removeEventListener('touchstart', this.onTouchStart, false);
    document.removeEventListener('touchend', this.onTouchEnd, false);
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
    if (ev.key.toLowerCase() === 'delete') {
      this.setState({ goToBios: true });
    }
  };

  allReady = () => {
    const bootTime = inIframe() ? 5000 : STATIC ? 1000 : 500;
    setTimeout(() => {
      this.props.next(this.state.goToBios ? 'bios' : undefined);
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
