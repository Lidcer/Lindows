import React from 'react';
import './activationWatermark.scss';
import { services } from '../../services/SystemService/ServiceHandler';

export class ActivationWatermark extends React.Component {
  render() {
    if (services.account.account) return null;
    return (
      <div className='activation-watermark'>
        <h1>Activate Lindows</h1>
        <h2>Go to Account manager to activate Lindows</h2>
      </div>
    );
  }
}
