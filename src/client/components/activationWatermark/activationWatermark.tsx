import React from 'react';
import { services } from '../../services/SystemService/ServiceHandler';
import { ActivationWatermarkStyle } from './activationWatermarkStyled';

export class ActivationWatermark extends React.Component {
  componentDidMount() {
    services.account.on('login', this.refresh);
    services.account.on('logout', this.refresh);
  }
  componentWillUnmount(){
    services.account.on('login', this.refresh);
    services.account.on('logout', this.refresh);
  }

  refresh = () => {
    this.setState({});
  }

  render() {
    if (STATIC) {
      return (
      <ActivationWatermarkStyle>
        <h1>Lindows Demo</h1>
        <h2>You are using Demo edition of Lindows</h2>
      </ActivationWatermarkStyle>
    );
    }
    if (services.account.account) return null;
    return (
      <ActivationWatermarkStyle>
        <h1>Activate Lindows</h1>
        <h2>Go to Account manager to activate Lindows</h2>
      </ActivationWatermarkStyle>
    );
  }
}
