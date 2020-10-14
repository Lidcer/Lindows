import { BaseWindow, IBaseWindowProps, IManifest } from '../BaseWindow/BaseWindow';
import React from 'react';
import { internal } from '../../services/SystemService/ServiceHandler';
import { TaskManagerStyle } from './taskManagerStyled';

export class TaskManager extends BaseWindow {
  public static readonly onlyOne = true;
  public static manifest: IManifest = {
    fullAppName: 'TaskManager',
    launchName: 'taskmgr',
    icon: '/assets/images/appsIcons/TaskManager.svg',
  };

  private selected: BaseWindow;

  constructor(props: IBaseWindowProps) {
    super(props, {
      alwaysOnTop: true,
    });
  }
  onStartUp() {
    this.changeOptions({
      title: 'Task Manager',
      image: TaskManager.manifest.icon,
    });

    internal.processor.on('appAdd', this.update);
  }

  onClose() {
    internal.processor.removeListener('appAdd', this.update);
  }

  update = () => {
    this.setState({});
  };

  renderInside() {
    return (
      <TaskManagerStyle>
        <span>
          {internal.processor.processes.length} | {internal.processor.processes.filter(e => e.minimized).length}
        </span>
        <table>
          <tbody>
            <tr>
              <th>Name</th>
              <th>Memory</th>
            </tr>
            {this.renderList}
          </tbody>
        </table>
        <button style={{ left: '0px' }} onClick={this.killAll}>
          Kill all
        </button>
        <button onClick={this.kill}>End Task</button>
      </TaskManagerStyle>
    );
  }

  killAll = () => {
    internal.processor.processes.forEach((e: any) => {
      if (e !== this) e.exit();
    });
    setTimeout(() => {
      this.update();
    }, 500);
  };

  kill = () => {
    if (this.selected) {
      this.selected.exit();
      this.selected = undefined;
    }
    this.setState({});
  };

  get renderList() {
    return internal.processor.processes.map(this.getThing);
  }

  getThing = (window: BaseWindow, index: number) => {
    const entries = Object.entries(window);
    const style = this.selected === window ? { backgroundColor: 'rgba(125, 125, 125, 0.25)' } : {};
    let size = 0;
    entries.forEach(element => {
      const object = element[1];
      if (object && object.toString) size = size + window[element[0]].toString().length;
      //   else if (object) console.log(object);
    });
    // const size = JSON.stringify(window).length;
    return (
      <tr key={index} style={style} onClick={() => this.select(window)}>
        <td>{window.state.options.title}</td>
        <td>{size}</td>
      </tr>
    );
  };

  select(window: BaseWindow) {
    this.selected = window;
    this.setState({});
  }

  fullscreenMode = () => {
    const options = { ...this.state.options };
    if (options.windowType === 'fullscreen') {
      options.windowType = 'windowed';
    } else {
      options.windowType = 'fullscreen';
    }
    this.setState({
      options,
    });
  };
}
