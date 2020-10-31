import React from 'react';
import { internal } from '../../services/internals/Internal';
import './BootLindows.scss';

export interface BootProps {
  next: () => void;
}

export class BootLindows extends React.Component<BootProps> {
  componentDidMount() {
    if (internal.readyToBoot) {
      this.boot();
    } else {
      internal.on('readyToBoot', this.boot);
    }
  }

  boot = async () => {
    console.log('booting')
    internal.removeListener('readyToBoot', this.boot);
    console.log('booting2')
    await internal.system.init();
    console.log('booting3')
    this.props.next();
  };

  render() {
    return (
      <div className=''>
        <div>Loading....</div>
      </div>
    );
  }
}
