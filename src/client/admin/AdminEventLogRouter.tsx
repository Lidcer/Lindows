import React, { Component } from 'react';
import { Route, Switch } from 'react-router-dom';
import { AdminEventLogList } from './AdminEventLogList';
import AdminEventLogItem from './AdminEventLogItem';
import { IAdminWebSocket } from './Websocket';
import { INotificationHandler } from './NotificationHandler';

interface IAdminEventLogRouterProps {
  adminWebSocket: IAdminWebSocket;
  notificationHandler: INotificationHandler;
}

export default class AdminEventLogRouter extends Component<IAdminEventLogRouterProps> {
  render() {
    return (
      <Switch>
        <Route
          exact
          path='/admin/event-log/:eventID'
          component={() => <AdminEventLogItem notificationHandler={this.props.notificationHandler} />}
        />
        <Route
          path='/admin/event-log'
          component={() => <AdminEventLogList adminWebSocket={this.props.adminWebSocket} />}
        />
      </Switch>
    );
  }
}
