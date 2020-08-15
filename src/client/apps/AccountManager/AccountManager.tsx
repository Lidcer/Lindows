import { BaseWindow, IBaseWindowProps, IManifest } from '../BaseWindow/BaseWindow';
import React from 'react';
import { AccountManagerWebpage } from './AccountManagerWebpage';

export class AccountManager extends BaseWindow {
  public static manifest: IManifest = {
    fullAppName: 'Account Manager',
    launchName: 'accountmgr',
    icon: '/assets/images/appsIcons/AccountManager.svg',
  };

  constructor(props: IBaseWindowProps) {
    super(props, {
      title: 'Account Manager',
      image: AccountManager.manifest.icon,
      redirectToWebpageButton: 'account',
      minHeight: 600,
      minWidth: 400,
    });
  }

  onStartUp() {
    if (this.isPhone) {
      const options = { ...this.options };
      options.maximized = true;
      this.changeOptions(options);
    }
  }

  renderInside() {
    return <AccountManagerWebpage window={true}></AccountManagerWebpage>;
  }
}
