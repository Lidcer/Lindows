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
    if (services.account.account) return null;
    return (
      <ActivationWatermarkStyle>
        <h1>Activate Lindows</h1>
        <h2>Go to Account manager to activate Lindows</h2>
      </ActivationWatermarkStyle>
    );
  }
}
