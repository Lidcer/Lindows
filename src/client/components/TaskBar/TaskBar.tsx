import React from 'react';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCommentAlt } from '@fortawesome/free-solid-svg-icons';
import { BaseWindow } from '../../apps/BaseWindow/BaseWindow';
import { StartMenu } from '../StartMenu/StartMenu';
import { internal } from '../../services/internals/Internal';
import { TaskBarNotificationHor, TaskBarNotificationVer, TaskBarExtended, TaskBarIcon, TaskBarOpenIcons,
   TaskBarClockHor, TaskBarClockVer, TaskBarShowDesktopHor, TaskBarShowDesktopVer, TaskBarStartBtnHor,
    TaskBarStartBtnVer, TaskBarGridHor, TaskBarGridVer, TaskBarBackground, Aero, TaskBarBottom, TaskBarTop,
     TaskBarLeft, TaskBarRight } from './TaskBarStyled';

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
    internal.processor.on('appAdd', this.updateTaskBar);
    internal.processor.on('appRemove', this.updateTaskBar);
    internal.processor.on('appAdd', this.onAppAdd);
    internal.processor.on('appRemove', this.onAppRemove);
    this.timeOutFunction = setInterval(this.updateTaskBar, 1000);
  }

  componentWillUnmount() {
    internal.processor.removeListener('appAdd', this.updateTaskBar);
    internal.processor.removeListener('appRemove', this.updateTaskBar);
    clearTimeout(this.timeOutFunction);
  }

  updateTaskBar = () => {
    this.setState({
      time: moment().format('HH:mm:ss'),
      date: moment().format('DD/MM/YYYY'),
    });
  };

  appClickStartMenu = (name: string) => {
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

    // const active = window.active ? window.active : !!sameInstance.find(a => a.active);
    const multipleInstance = sameInstance.length > 1;
    return (
      <TaskBarOpenIcons style={ { backgroundColor: window.active ? 'rgba(255,255,255,0.25)' : 'transparent'}}
        key={index}
          onClick={() => this.openAppClick(window)}
      >
        <TaskBarIcon src={window.state.options.image} alt={window.state.options.title} />
        {multipleInstance ? this.multipleInstances() : null}
      </TaskBarOpenIcons>
    );
  };

  multipleInstances() {
    return <TaskBarExtended />;
  }

  // generateIcons = (app: BaseWindow, index: number) => {

  //   return (
  //     <TaskBarIcon
  //       key={index}
  //       onClick={() => this.openAppClick(app)}
  //       className={`${app.active ? 'task-bar-open-icon-active' : ''}`}
  //     >
  //       <TaskBarIcon title={app.options.title} src={app.options.image} />
  //     </TaskBarIcon>
  //   );
  // };

  openAppClick(app: BaseWindow) {
    if(app.minimized || !app.active){
      app.focus();
    } else {
      app.minimize();
    }
    this.forceUpdate();
  }

  getIcon() {
     const TaskBarAlert = this.isHorizontal ? TaskBarNotificationHor : TaskBarNotificationVer; 
    if (notifications)
      return (
        <TaskBarAlert>
          <FontAwesomeIcon icon={faCommentAlt} />
        </TaskBarAlert>
      );
    else
      return (
        <TaskBarAlert>
          <FontAwesomeIcon icon={faCommentAlt} />
        </TaskBarAlert>
      );
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
    const pross = internal.processor.processes.filter(a => !a.minimized);
  }

  get navBar() {
    switch (navBarPos) {
      case 'bottom':
        return TaskBarBottom;
      case 'top':
        return TaskBarTop;
      case 'left':
          return TaskBarLeft;
      case 'right':
          return TaskBarRight;
      default:
        break;
    }

  }

  render() {
    const TaskBarClock = this.isHorizontal ? TaskBarClockHor : TaskBarClockVer;
    const TaskBarShowDesktop = this.isHorizontal ? TaskBarShowDesktopHor : TaskBarShowDesktopVer;
    const TaskBarStartBtn = this.isHorizontal ? TaskBarStartBtnHor : TaskBarStartBtnVer;
    const TaskBarGrid = this.isHorizontal ? TaskBarGridHor : TaskBarGridVer;
    const NavBar = this.navBar;
    return (
      <>
        {this.state.startMenu ? <StartMenu appClick={this.appClickStartMenu} /> : null}
        <NavBar> <Aero /></NavBar>
        <NavBar> <TaskBarBackground  style={{color:'blue'}}/> </NavBar>
        <NavBar> <TaskBarGrid>
          <TaskBarStartBtn>
            <img
              src='./assets/images/lidcer-logo.svg'
              alt='StartMenu'
              onClick={() => this.setState({ startMenu: !this.state.startMenu })}
            />
          </TaskBarStartBtn>

          <p></p>
          {this.openApps}
          <p></p>


          <TaskBarClock>
            <div>{this.state.time}</div>
            <div>{this.state.date}</div>
          </TaskBarClock>
          {this.getIcon()}
          <TaskBarShowDesktop onClick={this.showDesktop}/>
        </TaskBarGrid></NavBar>
      </>
    );
  }
}
