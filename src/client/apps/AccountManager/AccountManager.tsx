import { BaseWindow, IBaseWindowProps, IManifest } from '../BaseWindow/BaseWindow';
import './AccountManager.scss';
import React from 'react';

export const manifest: IManifest = {
  fullAppName: 'Account Manager',
  launchName: 'accountmgr',
  icon: './assets/images/appsIcons/AccountManager.svg',
};

export class AccountManager extends BaseWindow {
  constructor(props: IBaseWindowProps) {
    super(props);
  }
  onStartUp() {
    this.changeOptions({
      title: 'Account Manager',
      image: manifest.icon,
    });
  }
  renderInside() {
    return <div>Working</div>;
  }
}
