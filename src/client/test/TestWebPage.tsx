import React from 'react';
import { allInstalledApps, AppDescription, installApp, installPreInstalledApps } from '../essential/apps';
import { internal } from '../services/SystemService/ServiceHandler';

interface State {
  apps: AppDescription[];
}

export class TestWebPage extends React.Component<{}, State> {
  constructor(props) {
    super(props);
    this.state = {
      apps: [],
    };
  }

  componentDidMount = () => {
    internal.removeListener('allReady', this.componentDidMount);
    if (internal.ready) {
      const apps = allInstalledApps();
      this.setState({ apps });
    } else {
      internal.addListener('allReady', this.componentDidMount);
    }
  };

  componentWillUnmount() {
    internal.removeListener('allReady', this.componentDidMount);
  }

  get links() {
    return this.state.apps.map((a, i) => {
      return (
        <li key={i}>
          <div
            className='border border-secondary rounded-5 bg-dark p-1'
            onClick={() => {
              location.href = `app-tester/${a.manifest.launchName}`;
            }}
            style={{ cursor: 'pointer' }}
          >
            <a className='text-info pl-2' href={`app-tester/${a.manifest.launchName}`}>
              <img className='text-info mr-2' src={a.manifest.icon} height='25' />
              {a.manifest.fullAppName}
            </a>
          </div>
        </li>
      );
    });
  }

  render() {
    return (
      <div className='container d-block p-5'>
        <ul>{this.links}</ul>
      </div>
    );
  }
}
