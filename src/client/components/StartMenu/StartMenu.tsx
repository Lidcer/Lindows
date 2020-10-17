import React from 'react';
import { navBarPos } from '../TaskBar/TaskBar';
import { allInstalledApps, AppDescription, launchApp } from '../../essential/apps';
import { StartMenuStyled, TaskBarItem } from './StartMenuStyled';

export interface IStartMenuProps {
  appClick: (name: string) => void;
}

interface IStartMenu {
  height: number;
  apps: AppDescription[];
}

export class StartMenu extends React.Component<IStartMenuProps, IStartMenu> {
  constructor(props) {
    super(props);
    this.state = {
      height: 0,
      apps: [],
    };
  }

  render() {
    return (
      <StartMenuStyled style={this.style}>
        <div>{this.renderApps()} </div>
      </StartMenuStyled>
    );
  }

  renderApps() {
    return this.state.apps.map((e, i) => (
      <div key={i}>
        <TaskBarItem key={i} onClick={() => this.runApp(e.manifest.launchName)}>
          <img src={e.manifest.icon} alt={e.manifest.launchName} />
          <span>{e.manifest.fullAppName}</span>
        </TaskBarItem>
      </div>
    ));
  }

  runApp(name: string) {
    this.props.appClick(name);
    launchApp(name);
  }

  componentDidMount() {
    setTimeout(() => {
      this.setState({
        height: 500,
      });
    });
    const apps = allInstalledApps().filter(a => a.showInTaskBar);
    this.setState({ apps });
  }

  get style() {
    switch (navBarPos) {
      case 'bottom':
        return {
          bottom: '30pt',
          transition: 'width 0.2s, height 0.2s',
          height: `${this.state.height}px`,
        };
      default:
        break;
    }
  }
}
