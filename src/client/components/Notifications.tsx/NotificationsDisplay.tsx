import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCog, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { popup } from "../Popup/popupRenderer";
import { ContextMenu, IElement, showContext } from "../ContextMenu/ContextMenu";
import {
  NotificationContent,
  NotificationImage,
  NotificationButtons,
  NotificationOverlay,
  NotificationToast,
} from "./NotificationsDisplayStyled";
import { getNotification, INotification } from "../Desktop/Notifications";
import { removeFromArray } from "../../../shared/utils";

interface INotificationDisplay extends INotification {
  time: number;
}

interface INotificationsDisplayState {
  notifications: INotificationDisplay[];
}

export class NotificationsDisplay extends React.Component<{}, INotificationsDisplayState> {
  private readonly MAX_NOTIFICATOIN_DISPLAYTIME = 10000;
  private readonly NOTIFICATION_WIDTH = 400;
  private readonly OFFSET = 10;
  private readonly EASE = Math.round(this.MAX_NOTIFICATOIN_DISPLAYTIME * 0.05);
  private destroyed = false;
  private now: number;
  private frame: number;
  private notification = getNotification();

  constructor(props) {
    super(props);
    this.state = {
      notifications: [],
    };
  }
  componentDidMount() {
    this.notification.on("notification", this.newNotification);
    this.now = performance.now();
    this.frame = requestAnimationFrame(this.eventLoop);
  }

  componentWillUnmount() {
    this.notification.removeListener("notification", this.newNotification);
    this.destroyed = true;
    cancelAnimationFrame(this.frame);
  }

  eventLoop = () => {
    if (this.destroyed) return;
    const now = performance.now();
    const delta = now - this.now;
    this.now = now;

    const state = { ...this.state };
    for (const notification of state.notifications) {
      const remove = this.update(notification, delta);
      if (remove) {
        removeFromArray(state.notifications, notification);
      }
    }
    this.setState(state);

    this.frame = requestAnimationFrame(this.eventLoop);
  };

  update(notification: INotificationDisplay, delta: number): boolean {
    notification.time += delta;
    if (notification.time > this.MAX_NOTIFICATOIN_DISPLAYTIME) {
      return true;
    }

    return false;
  }

  newNotification = (notification: INotification) => {
    const alert: INotificationDisplay = {
      block: notification.block,
      sender: notification.sender,
      title: notification.title,
      icon: notification.icon,
      content: notification.content,
      time: 0,
    };

    const state = { ...this.state };
    state.notifications.unshift(alert);
    this.setState(state);
  };

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

  get notificationWidth() {
    const innerWidth = window.innerWidth;
    if (innerWidth < this.NOTIFICATION_WIDTH) {
      return innerWidth;
    }
    return this.NOTIFICATION_WIDTH;
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

      showContext(elements, e.clientX - 50, e.clientY - 50);
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
    const width = this.notificationWidth;
    const widthOffest = width - this.OFFSET;
    const time = notification.time;
    //const precentage = time / this.MAX_NOTIFICATOIN_DISPLAYTIME;

    let precentage = 1;
    const range = this.MAX_NOTIFICATOIN_DISPLAYTIME - this.EASE;
    if (time < this.EASE) {
      precentage = time / this.EASE;
    } else if (time > range) {
      const nTime = time - range;
      precentage = 1 - nTime / this.EASE;
    }
    const right = -widthOffest + this.notificationWidth * precentage;
    const style: React.CSSProperties = { right: `${right}px`, width: `${width}px` };
    return (
      <NotificationToast style={style} key={key}>
        {this.getImageNotification(notification)}
        {this.getContent(notification)}
        {this.getIcons(notification, key)}
      </NotificationToast>
    );
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
