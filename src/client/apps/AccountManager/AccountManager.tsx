import { BaseWindow, IBaseWindowProps, IManifest } from '../BaseWindow/BaseWindow';
import React from 'react';
import { AccountManagerWebpage } from './AccountManagerWebpage';

export const manifest: IManifest = {
  fullAppName: 'Account Manager',
  launchName: 'accountmgr',
  icon: '/assets/images/appsIcons/AccountManager.svg',
};

export class AccountManager extends BaseWindow {
  constructor(props: IBaseWindowProps) {
    super(props, manifest, {
      title: 'Account Manager',
      image: manifest.icon,
      redirectToWebpageButton: 'account',
      minHeight: 600,
      minWidth: 400,
    });
  }

  onStartUp() {
    if (this.isPhone) {
      const options = { ...this.options };
      options.maximized = true;
      this.setOptions(options);
    }
  }

  renderInside() {
    return <AccountManagerWebpage window={true}></AccountManagerWebpage>;
  }
}
