import React from 'react';
import './bootScreen.scss';
import { services } from '../../services/services';
import { SECOND } from '../../../shared/constants';

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
      <div className='boot-screen'>
        <div className='top'>
          <div className='info'>
            <span>Lidcer BIOS v1.0, in browser bios</span>
            <span>Copyright (C) 2020-2020, Lidcer Software, Icn </span>
          </div>
          <img src='./assets/images/LidcerBiosLogo.svg' alt='biosLogo' />
        </div>
        <div className='middle'>
          <ul>{this.messages}</ul>
        </div>
        <div className='bottom'>
          <span>08/3/2020-489/Id2/WSD6</span>
          {this.biosMessage}
        </div>
      </div>
    );
  }

  get biosMessage() {
    if (this.state.goToBios) return <span>Entering setup...</span>;
    else
      return (
        <span>
          Press <b> DEL</b> to enter Setup, <b>ALT-F4</b> to force shutdown
        </span>
      );
  }

  get messages() {
    return this.state.messageToDisplay.map((m, i) => {
      return <li key={i}>{m}</li>;
    });
  }
  componentDidMount() {
    if (services.isReady) {
      this.allReady();
    }
    services.on('allReady', this.allReady);
    services.on('onServiceReady', this.onServiceReady);
    document.addEventListener('keydown', this.keypress, false);
    document.addEventListener('touchstart', this.onTouchStart, false);
    document.addEventListener('touchend', this.onTouchEnd, false);
  }
  componentWillUnmount() {
    services.removeListener('allReady', this.allReady);
    services.removeListener('onServiceReady', this.onServiceReady);
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
    setTimeout(() => {
      this.props.next(this.state.goToBios ? 'bios' : undefined);
    }, SECOND * 3);
  };

  onServiceReady = (name: string) => {
    const state = { ...this.state };
    this.state.messageToDisplay.push(`Initialized ${name}`);
    this.setState(state);
  };
}
