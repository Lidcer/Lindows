import { BaseWindow, IBaseWindowProps, IManifest } from '../BaseWindow/BaseWindow';
import React from 'react';
import './taskManager.scss';
import { services } from '../../services/services';

export const manifest: IManifest = {
  fullAppName: 'TaskManager',
  launchName: 'taskmgr',
  icon: './assets/images/appsIcons/TaskManager.svg',
};

export class TaskManager extends BaseWindow {
  private selected: BaseWindow;
  constructor(props: IBaseWindowProps) {
    super(props, manifest);
  }
  onStartUp() {
    this.changeOptions({
      title: 'Task Manager',
      image: manifest.icon,
    });

    services.processor.on('appAdd', this.update);
  }

  onClose() {
    services.processor.removeListener('appAdd', this.update);
  }

  update = () => {
    this.setState({});
  };

  renderInside() {
    return (
      <div className='task-manager'>
        <span>
          {services.processor.processes.length} | {services.processor.processes.filter(e => e.minimized).length}
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
      </div>
    );
  }

  killAll = () => {
    services.processor.processes.forEach(e => {
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
    return services.processor.processes.map(this.getItem);
  }

  getItem = (window: BaseWindow, index: number) => {
    const entries = Object.entries(window);
    const className = this.selected === window ? 'task-manager-selected' : '';
    let size = 0;
    entries.forEach(element => {
      const object = element[1];
      if (object && object.toString) size = size + window[element[0]].toString().length;
      //   else if (object) console.log(object);
    });
    // const size = JSON.stringify(window).length;
    return (
      <tr key={index} className={className} onClick={() => this.select(window)}>
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
