import React from 'react';
import moment from 'moment';
import './TaskBar.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentAlt } from '@fortawesome/free-solid-svg-icons';
import { BaseWindow } from '../../apps/BaseWindow/BaseWindow';
import { StartMenu } from '../StartMenu/StartMenu';
import { services } from '../../services/services';

interface IState {
  time: string;
  date: string;
  startMenu: boolean;
  runningApps: BaseWindow[];
}

declare type BavBarPos = 'bottom' | 'top' | 'left' | 'right';
interface ITaskBarApp {
  app: BaseWindow;
  multiple: boolean;
}
declare type ITaskBarAppIcon = ITaskBarApp[] | ITaskBarApp;

export let navBarPos: BavBarPos = 'bottom';
export function changeNavBarPos(pos: BavBarPos) {
  navBarPos = pos;
}

const notifications = 0;

export class TaskBar extends React.Component<{}, IState> {
  private timeOutFunction: NodeJS.Timeout;
  constructor(props) {
    super(props);
    this.state = {
      date: '',
      time: '',
      startMenu: false,
      runningApps: [],
    };
  }

  componentDidMount() {
    services.processor.on('appAdd', this.updateTaskBar);
    services.processor.on('appRemove', this.updateTaskBar);
    services.processor.on('appAdd', this.onAppAdd);
    services.processor.on('appRemove', this.onAppRemove);
    this.timeOutFunction = setInterval(this.updateTaskBar, 1000);
  }

  componentWillUnmount() {
    services.processor.removeListener('appAdd', this.updateTaskBar);
    services.processor.removeListener('appRemove', this.updateTaskBar);
    clearTimeout(this.timeOutFunction);
  }

  updateTaskBar = () => {
    this.setState({
      time: moment().format('HH:mm:ss'),
      date: moment().format('DD/MM/YYYY'),
    });
  };

  render() {
    return (
      <>
        {this.state.startMenu ? <StartMenu appClick={this.appClickStartMenu}></StartMenu> : null}
        <div className={this.getNavBarPosition('aero')}></div>
        <div className={this.getNavBarPosition('task-bar-background')}></div>
        <div className={this.getNavBarPosition(`task-bar-grid-${this.orientation} task-bar`)}>
          <div className={`task-bar-start-btn-${this.orientation}`}>
            <img
              src='./assets/images/lidcer-logo.svg'
              alt='StartMenu'
              onClick={() => this.setState({ startMenu: !this.state.startMenu })}
            />
          </div>

          <p></p>
          {this.openApps}
          <p></p>

          <div className={`task-bar-clock-${this.orientation}`}>
            <div>{this.state.time}</div>
            <div>{this.state.date}</div>
          </div>
          {this.getIcon()}
          <div className={`task-bar-show-desktop-${this.orientation}`} onClick={this.showDesktop}></div>
        </div>
      </>
    );
  }

  appClickStartMenu = (name: string) => {
    console.log('working');
    this.setState({
      startMenu: false,
    });
  };

  onAppAdd = (window: BaseWindow) => {
    const state = { ...this.state };
    state.runningApps.push(window);
    this.setState(state);
  };

  onAppRemove = (window: BaseWindow) => {
    const state = { ...this.state };
    // const app = state.runningApps.find(w => w === window);
    const indexOf = state.runningApps.indexOf(window);
    if (indexOf !== -1) {
      state.runningApps.splice(indexOf, 1);
    }
    this.setState(state);
    //console.log(`''`, !!app);
  };

  get openApps() {
    const displaying: BaseWindow[] = [];

    this.state.runningApps.forEach(a => {
      const sameInstanceOfApp = displaying.find(w => w instanceof a.constructor);
      if (sameInstanceOfApp) {
        return;
      }

      displaying.push(a);
    });
    //return <div>{displaying.map((app, i) => this.generateCollapsedIcons(app, i, true))}</div>;
    // return <div>{processor.getProcesses().map(this.generateIcons)}</div>;
    return <div>{displaying.map(this.generateCollapsedIcons)}</div>;
  }

  generateCollapsedIcons = (window: BaseWindow, index: number) => {
    let sameInstance: BaseWindow[] = [];
    if (!window.flashing || !window.progress) {
      sameInstance = this.state.runningApps.filter(a => a !== window && a instanceof window.constructor);
    }

    const active = window.active ? window.active : !!sameInstance.find(a => a.active);
    const multipleInstance = sameInstance.length > 1;
    return (
      <div
        key={index}
        //  onClick={() => this.openAppClick(app)}
        className={`task-bar-open-icons`}
      >
        <img className='task-bar-icon' src={window.state.options.image} alt={window.state.options.title} />
        {multipleInstance ? this.multipleInstances() : null}
      </div>
    );
  };

  multipleInstances() {
    return <div className='task-bar-extended'></div>;
  }

  generateIcons = (app: BaseWindow, index: number) => {
    return (
      <div
        key={index}
        onClick={() => this.openAppClick(app)}
        className={`task-bar-open-icons ${app.active ? 'task-bar-open-icon-active' : ''}`}
      >
        <img className='task-bar-icon' src={app.state.options.image} alt={app.state.options.title} />
      </div>
    );
  };

  openAppClick(app: BaseWindow) {
    if (app.state.options.minimized) {
      app.maximizeRestoreDown();
      app.changeActiveState(true);
    } else if (app._wasActive) app.maximizeRestoreDown();
    else app.changeActiveState(true);
  }

  getIcon() {
    if (notifications)
      return (
        <div className={`task-bar-notification-${this.orientation}`}>
          <FontAwesomeIcon icon={faCommentAlt} />
        </div>
      );
    else
      return (
        <div className={`task-bar-notification-${this.orientation}`}>
          <FontAwesomeIcon icon={faCommentAlt} />
        </div>
      );
  }

  get orientation() {
    return this.isHorizontal ? 'hor' : 'ver';
  }

  get isHorizontal() {
    switch (navBarPos) {
      case 'bottom':
      case 'top':
        return true;
      default:
        return false;
    }
  }

  private showDesktop(event: React.MouseEvent) {
    const pross = services.processor.processes.filter(a => !a.minimized);
    console.log(pross.length);
  }

  getNavBarPosition(classes: string) {
    return `${classes} task-bar-${navBarPos}`;
  }
}
