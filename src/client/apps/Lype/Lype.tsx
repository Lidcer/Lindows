import { BaseWindow, IBaseWindowProps, IManifest } from '../BaseWindow/BaseWindow';
import './Lype.scss';
import React from 'react';
import { LypeWebpage } from './LypeWebpage';

export const manifest: IManifest = {
  fullAppName: 'Lype',
  launchName: 'lype',
  icon: './assets/images/appsIcons/Lype.svg',
};

export class Lype extends BaseWindow {
  constructor(props: IBaseWindowProps) {
    super(props, manifest, {
      title: 'Lype',
      image: manifest.icon,
      redirectToWebpageButton: 'lype',
      minHeight: 400,
      minWidth: 400,
    });
    this.on('ready', ev => {
      this.onStartUp();
    });
    this.onKeyboard('keydown', e => {
      console.log(e);
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
    return <LypeWebpage window={true}></LypeWebpage>;
  }
}
