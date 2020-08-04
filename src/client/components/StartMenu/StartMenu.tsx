import React from 'react';
import { navBarPos } from '../TaskBar/TaskBar';
import { allApps, launchApp } from '../../essential/apps';
import { StartMenuStyled, TaskBarItem } from './StartMenuStyled';

export interface IStartMenuProps {
  appClick: (name: string) => void;
}

interface IStartMenu {
  height: number;
}

export class StartMenu extends React.Component<IStartMenuProps, IStartMenu> {
  constructor(props) {
    super(props);
    this.state = {
      height: 0,
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
    return allApps.map((e, i) => (
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
  }

  get style() {
    switch (navBarPos) {
      case 'bottom':
        return {
          bottom: '30pt',
          transition: 'width 0.2s, height 0.2s',
          height: `${this.state.height}px`,
        }
    
      default:
        break;
    }

  }
}
