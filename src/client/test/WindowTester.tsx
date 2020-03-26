import React from 'react';
import { appConstructorGenerator, allApps } from '../essential/apps';
import { services } from '../services/services';
import { BaseWindow } from '../apps/BaseWindow/BaseWindow';

interface IWindowTesterState {
  display: JSX.Element;
  subWindow: BaseWindow<{}>[];
}

export class WindowTester extends React.Component<{}, IWindowTesterState> {
  constructor(props) {
    super(props);
    this.state = {
      display: <div>Loading</div>,
      subWindow: [],
    };
  }

  render() {
    return (
      <div className='container'>
        {this.state.display} <div>{this.subProcesses}</div>
      </div>
    );
  }

  componentDidMount() {
    this.start();
  }

  start() {
    if (!services.ready) {
      services.on('allReady', () => this.start());
      services.on('onServiceReady', e => console.info(`ok ${e}`));
      services.on('onServiceFailed', e => console.error(`nOk ${e}`));
      return;
    }
    services.processor.on('appAdd', e => {
      if (e.props.id === -1) return;
      const renderInside = e.renderInside;

      e.renderInside = () => {
        return (
          <>
            <div
              style={{
                position: 'absolute',
                padding: '5pt',
                textAlign: 'center',
                backgroundColor: 'orange',
                color: 'black',
                borderBottomRightRadius: '5pt',
                opacity: '0.75',
              }}
            >
              Running in test mode
            </div>
            {renderInside()}
          </>
        );
      };

      this.setState({});
    });

    services.processor.on('appDisplayingAdd', () => {
      this.setState({});
    });
    services.processor.on('appRemove', () => {
      this.setState({});
    });

    const url = new URL(document.location.href);
    const app = url.searchParams.get('app') || '';
    const shouldBeApp = appConstructorGenerator(app);
    const state = { ...this.state };

    if (!shouldBeApp) {
      state.display = <ul>{this.allApps}</ul>;
      this.setState(state);
    } else {
      state.display = shouldBeApp(-1);
      this.setState(state);
    }
  }

  get allApps() {
    allApps.forEach(a => {
      console.log(a);
    });
    return allApps.map((a, i) => (
      <li key={i} onClick={() => this.redirect(a.manifest.launchName)}>
        {a.manifest.launchName}
      </li>
    ));
  }

  get subProcesses() {
    if (!services.ready) return null;
    return services.processor.runningApps.map((a, i) => {
      return a.app;
    });
  }

  redirect = (app: string) => {
    location.href = `${location.href}/?app=${app}`;
  };
}
