import React, { Component } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { SECOND } from '../../shared/constants';
import { INotificationHandler } from './NotificationHandler';

interface IAdminNotificationState {
  notifications: INotificationState[];
}

interface INotificationState {
  type: 'danger' | 'warning' | 'info';
  title: string;
  message: string;
  buttons?: IButton[];
  time?: number;
}

interface IButton {
  message: string;
  onClick: () => void;
}

interface IAdminNotificationProps {
  notificationHandler: INotificationHandler;
}

export default class AdminNotification extends Component<IAdminNotificationProps, IAdminNotificationState> {
  private timeouts: NodeJS.Timeout[] = [];

  constructor(props) {
    super(props);
    this.state = {
      notifications: [],
    };
  }

  createNotification(type: INotificationState['type'], title: string, message: string) {
    const state = { ...this.state };
    const notification = { type, message, title };

    state.notifications.push(notification);
    this.setState(state);

    const timeout = setTimeout(() => {
      const tState = { ...this.state };
      const indexOf = tState.notifications.indexOf(notification);
      if (indexOf !== -1) {
        tState.notifications.splice(indexOf, 1);
        this.setState(state);
      }
      const ino = this.timeouts.indexOf(timeout);
      if (ino !== -1) this.timeouts.splice(ino, 1);
    }, SECOND * 30);
  }

  addInfoNotification = (title: string, message: string) => {
    this.createNotification('warning', title, message);
  };

  addWarnNotification = (title: string, message: string) => {
    this.createNotification('warning', title, message);
  };

  addDangerNotification = (title: string, message: string) => {
    this.createNotification('danger', title, message);
  };

  componentDidMount() {
    this.props.notificationHandler.on('info', this.addInfoNotification);
    this.props.notificationHandler.on('danger', this.addDangerNotification);
    this.props.notificationHandler.on('warn', this.addWarnNotification);
  }

  componentWillUnmount() {
    this.props.notificationHandler.removeListener('info', this.addInfoNotification);
    this.props.notificationHandler.removeListener('danger', this.addDangerNotification);
    this.props.notificationHandler.removeListener('warn', this.addWarnNotification);
    for (const timeout of this.timeouts) {
      clearTimeout(timeout);
    }
    this.timeouts = [];
  }

  getColour(type: INotificationState['type']) {
    switch (type) {
      case 'danger':
        return '#ff0000';
      case 'warning':
        return '#ff9601';
      case 'info':
        return '#01c0ff';
    }
  }

  removeNotification(index: number) {
    const state = { ...this.state };
    const notification = state.notifications[index];
    const indexOf = state.notifications.indexOf(notification);
    if (indexOf !== -1) state.notifications.splice(indexOf, 1);
    this.setState(state);
  }

  get notification() {
    return this.state.notifications.map((n, i) => {
      const color = this.getColour(n.type);
      return (
        <div key={i}>
          <div
            className={`toast p-2`}
            style={{ border: `1px solid ${color}` }}
            role='alert'
            aria-live='assertive'
            aria-atomic='true'
          >
            <div className='toast-header'>
              <strong className='mr-auto' style={{ color }}>
                {n.title}
              </strong>
              <button
                type='button'
                onClick={() => this.removeNotification(i)}
                className='ml-2 mb-1 close'
                data-dismiss='toast'
                aria-label='Close'
                style={{ color: 'white' }}
              >
                <FontAwesomeIcon icon={faTimes}></FontAwesomeIcon>
              </button>
            </div>
            <div className='toast-body'>{n.message}</div>
          </div>
        </div>
      );
    });
  }

  render() {
    return (
      <>
        <div aria-live='polite' aria-atomic='true' style={{ position: 'relative' }}>
          <div style={{ position: 'fixed', top: '20', right: '0' }}>{this.notification}</div>
        </div>
      </>
    );
  }
}
