import { BaseWindow, IBaseWindowProps, IManifest } from '../BaseWindow/BaseWindow';
import React from 'react';
import { LypeWebpage } from './LypeWebpage';

export const manifest: IManifest = {
  fullAppName: 'Lype',
  launchName: 'lype',
  icon: '/assets/images/appsIcons/Lype.svg',
};

export class Lype extends BaseWindow {
  constructor(props: IBaseWindowProps) {
    super(props, manifest, {
      title: 'Lype',
      image: manifest.icon,
      redirectToWebpageButton: 'lype',
      minHeight: 400,
      minWidth: 500,
    });
    this.on('ready', ev => {
      this.onStartUp();
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
    return <LypeWebpage window={true} destroy={this.exit}></LypeWebpage>;
  }
}
