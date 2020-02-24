import React from 'react';
import './BlueScreen.scss';
import { random } from 'lodash';

export interface IBlueScreenProps {
  errorCode?: string;
}

interface IState {
  time: number;
}
export class BlueScreen extends React.Component<IBlueScreenProps, IState> {
  constructor(props) {
    super(props);
    this.state = {
      time: 0,
    };
  }

  componentDidMount() {
    this.count();
  }

  count() {
    if (this.state.time >= 100) {
      document.location.href = '/';
      return;
    }
    const number = this.state.time + 1;
    this.setState({
      time: number,
    });
    setTimeout(() => {
      this.count();
    }, random(200, 300));
  }

  render() {
    return (
      <div className='blue-screen'>
        <p className='bsod bsod-title'>:(</p>
        <p className='bsod bsod-content'>
          Your browser ran in to a problem and it needs to be redirected. We&apos;re are not collecting any data because
          we don&apos;t really care. We&apos;ll redirect you shortly.
        </p>

        <p className='bsod bsod-waiting'> {this.state.time}% waiting</p>
        <p className='bsod bsod-stop-code'>
          Stop code: {this.props.errorCode ? this.props.errorCode : 'ERROR_404_PAGE_NOT_FOUND'}
        </p>
      </div>
    );
  }
}
