import React from 'react';
import './StartMenu.scss';
import { navBarPos } from '../TaskBar/TaskBar';
import { allApps, launchApp } from '../../essential/apps';

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
      <div className={`start-menu start-menu-${navBarPos}`} style={this.style}>
        <div>{this.renderApps()} </div>
      </div>
    );
  }

  renderApps() {
    return allApps.map((e, i) => (
      <div key={i}>
        <div className='task-bar-item' key={i} onClick={() => this.runApp(e.manifest.launchName)}>
          <img src={e.manifest.icon} alt={e.manifest.launchName} />
          <span>{e.manifest.fullAppName}</span>
        </div>
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
    return {
      height: `${this.state.height}px`,
    };
  }
}
