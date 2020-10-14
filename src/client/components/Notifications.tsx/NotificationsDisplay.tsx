import React from 'react';
import { internal } from '../../services/SystemService/ServiceHandler';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { popup } from '../Popup/popupRenderer';
import { ContextMenu, IElement } from '../ContextMenu/ContextMenu';
import { SECOND } from '../../../shared/constants';
import { NotificationContent, NotificationImage, NotificationButtons, NotificationOverlay, NotificationToast } from './NotificationsDisplayStyled';
import { getNotification, INotification } from '../Desktop/Notifications';

interface INotificationDisplay extends INotification {
  className: 'animated' | 'none';
}

interface INotificationsDisplayState {
  notifications: INotificationDisplay[];
}

export class NotificationsDisplay extends React.Component<{}, INotificationsDisplayState> {
  private timeouts: NodeJS.Timeout[] = [];
  private notification = getNotification(); 
  constructor(props) {
    super(props);
    this.state = {
      notifications: [],
    };
  }
  componentDidMount() {

    this.notification.on('notification', this.newNotification);
  }

  componentWillUnmount() {
    this.notification.removeListener('notification', this.newNotification);
    for (const timeout of this.timeouts) {
      this.removeTimeout(timeout);
    }
  }

  newNotification = (notification: INotification) => {
    const alert: INotificationDisplay = {
      block: notification.block,
      sender: notification.sender,
      title: notification.title,
      icon: notification.icon,
      content: notification.content,
      className: 'animated',
    };

    const state = { ...this.state };
    state.notifications.unshift(alert);
    this.setState(state);

    const t = setTimeout(() => {
      this.removeTimeout(t);
      const state = { ...this.state };
      const thatAlert = state.notifications.find(n => n === alert);
      if (thatAlert) {
        thatAlert.className = 'none';
        this.setState(state);
      }
    }, 1000);
    this.timeouts.push(t);

    const timeout = setTimeout(() => {
      this.removeNotification(alert);
    }, SECOND * 7);
    this.timeouts.push(timeout);
  };

  private removeTimeout(timeout: NodeJS.Timeout) {
    clearTimeout(timeout);
    const indexOf = this.timeouts.indexOf(timeout);
    if (indexOf !== -1) this.timeouts.splice(indexOf, 1);
  }

  getImageNotification(notification: INotification) {
    if (!notification.icon) return null;
    return (
      <NotificationImage>
        <img src={notification.icon} />
      </NotificationImage>
    );
  }

  getContent(notification: INotification) {
    return (
      <NotificationContent>
        <h1>{notification.title}</h1>
        {notification.content ? <h5>{notification.content}</h5> : null}
        <p>{notification.sender}</p>
      </NotificationContent>
    );
  }

  getIcons(notification: INotification, key: number) {
    const remove = () => {
      const state = { ...this.state };
      this.state.notifications.splice(key, 1);
      this.setState(state);
    };

    const contextMenu = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const elements: IElement[] = [
        { content: `Go to notification settings` },
        { content: `Turn off all notification for ${notification.sender}`, onClick: notification.block },
      ];

      const element = (
        <ContextMenu
          elements={elements}
          x={e.clientX - 50}
          y={e.clientY - 50}
          onAnyClick={() => popup.remove(element)}
        />
      );
      popup.add(element);
    };

    return (
      <NotificationButtons>
        <div onClick={remove}>
          <FontAwesomeIcon icon={faArrowRight} />
        </div>
        <div onClick={contextMenu}>
          <FontAwesomeIcon icon={faCog} />
        </div>
      </NotificationButtons>
    );
  }

  alert(notification: INotificationDisplay, key: number) {
    return (
      <NotificationToast className={`notification-${notification.className}`} key={key}>
        {this.getImageNotification(notification)}
        {this.getContent(notification)}
        {this.getIcons(notification, key)}
      </NotificationToast>
    );
  }

  removeNotification(notification: INotificationDisplay) {
    const state = { ...this.state };
    const alert = state.notifications.find(a => a === notification);
    if (!alert) return;
    alert.className = 'animated';
    this.setState(state);
    const t = setTimeout(() => {
      this.removeTimeout(t);
      const tState = { ...this.state };
      const indexOf = state.notifications.indexOf(notification);
      if (indexOf !== -1) {
        state.notifications.slice(indexOf, 1);
        this.setState(tState);
      }
    }, SECOND);
    this.timeouts.push(t);
  }

  render() {
    //370 * 100
    return (
      <NotificationOverlay>
        {this.state.notifications.map((n, i) => {
          return this.alert(n, i);
        })}
      </NotificationOverlay>
    );
  }
}
