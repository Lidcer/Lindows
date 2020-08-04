import React from 'react';
import { random } from 'lodash';
import { BlueScreenStyle, BSODTitle, BSODContent, BSODwaiting, BSODStopCode } from './BlueScreenStyle';

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
      <BlueScreenStyle>
        <BSODTitle>:(</BSODTitle>
        <BSODContent>
          Your browser ran in to a problem and it needs to be redirected. We&apos;re not collecting any data because
          we don&apos;t really care. We&apos;ll redirect you shortly.
        </BSODContent>

        <BSODwaiting> {this.state.time}% waiting</BSODwaiting>
        <BSODStopCode>
          Stop code: {this.props.errorCode ? this.props.errorCode : 'ERROR_404_PAGE_NOT_FOUND'}
        </BSODStopCode>
      </BlueScreenStyle>
    );
  }
}
