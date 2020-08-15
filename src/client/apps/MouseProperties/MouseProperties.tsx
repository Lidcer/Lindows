import { BaseWindow, IBaseWindowProps, IManifest, MessageBox } from '../BaseWindow/BaseWindow';
//import './Lype.scss';
import React from 'react';
import { mousePointer } from '../../components/Cursor/Cursor';
import { throws } from 'assert';
import { MousePropertiesWarper } from './MousePropertiesStyled';



export interface IMousePropertiesProperties {
    enabled: boolean;
}
//@ts-ignore
export class MouseProperties extends BaseWindow<IMousePropertiesProperties> {
  public static readonly onlyOne = true;
  public static manifest: IManifest = {
    fullAppName: 'Mouse Properties',
    launchName: 'mouse_properties',
    icon: '/assets/images/appsIcons/MouseProperties.svg',
  };
  
  constructor(props: IBaseWindowProps) {
    super(props, {
      title: 'Mouse Properties',
      image: '/assets/images/appsIcons/MouseProperties.svg',
      showIcon: false,
      minHeight: 450,
      minWidth: 400,
    },{
        enabled: false
    });
  }

  shown() {
    this.setVariables({enabled:mousePointer.enabled});
  }

  enableLindowMouseCheckBox = async () => { 
    const result = await mousePointer.enableDisableMouse(!this.variables.enabled);
    this.setVariables({enabled:result});
  }

  renderInside() {
    return (
    <MousePropertiesWarper> 
      <div>
        <input type="checkbox" onChange={this.enableLindowMouseCheckBox} checked={this.state.variables.enabled}  name="Enable mouse" id="mouse"/>

        <span>Enable lindow mouse</span>
      </div>
  </MousePropertiesWarper>
 );
  }
}
