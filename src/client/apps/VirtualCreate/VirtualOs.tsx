import { BaseWindow, IManifest } from '../BaseWindow/BaseWindow';
import React from 'react';
import { VirtualCrateWarper, Frame } from './VirtualCrateStyled';
import { WebsiteOperationSystems } from './VirtualCrate';

export interface VirtualOsState {
  details?: WebsiteOperationSystems;
}

export class VirtualOs extends BaseWindow<VirtualOsState> {
  constructor(props) {
    super(
      props,
      {
        minHeight: 500,
        minWidth: 500,
      },
      {
        details: undefined,
      },
    );
  }

  loadSystem(details: WebsiteOperationSystems) {
    this.setVariables({ details });
    this.changeOptions({ title: details.name, image: details.icon });
  }

  renderLindows() {
    return (
      <VirtualCrateWarper>
        <Frame loading='lazy' src={this.variables.details.url}>
          Not supported
        </Frame>
      </VirtualCrateWarper>
    );
  }

  renderInside() {
    if (this.variables.details) {
      return this.renderLindows();
    }
    return <div>Loading....</div>;
  }
}
