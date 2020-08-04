import { BaseWindow, IBaseWindowProps, IManifest } from '../BaseWindow/BaseWindow';
//import './Lype.scss';
import React from 'react';
import { mousePointer } from '../../components/Cursor/Cursor';

export const manifest: IManifest = {
  fullAppName: 'Mouse Properties',
  launchName: 'mouse_properties',
  icon: '/assets/images/appsIcons/MouseProperties.svg',
};

export interface IMousePropertiesProperties {
    enabled: boolean;
}

export class MouseProperties extends BaseWindow<IMousePropertiesProperties> {
  constructor(props: IBaseWindowProps) {
    super(props, manifest, {
      title: 'Mouse Properties',
      image: manifest.icon,
      
      minHeight: 450,
      minWidth: 400,
    },{
        enabled: false
    });
  }

  load() {
    this.setVariables({enabled:mousePointer.enabled});
  }

  enableLidowMouseCheckBox = async () => { 
    const result = await mousePointer.enableDisableMouse(!this.variables.enabled);
    this.setVariables({enabled:result});
  }

  renderInside() {
    return <> 
        <input type="checkbox" onChange={this.enableLidowMouseCheckBox} checked={this.state.variables.enabled}  name="Enable mouse" id="mouse"/>
        <span>Enable lindow mouse</span>
         </>;
  }
}
