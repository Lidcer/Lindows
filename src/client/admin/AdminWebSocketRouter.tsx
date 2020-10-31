import React, { Component } from "react";
import { IAdminWebSocket } from "./Websocket";
import { INotificationHandler } from "./NotificationHandler";
import { Route, Switch } from "react-router-dom";
import { AdminWebSocketMain } from "./AdminWebSocketMain";
import AdminWebSocketItem from "./AdminWebSocketItem";

interface IAdminWebSocketRouterProps {
  adminWebSocket: IAdminWebSocket;
  notificationHandler: INotificationHandler;
}

export class AdminWebSocketRouter extends Component<IAdminWebSocketRouterProps, {}> {
  render() {
    return (
      <Switch>
        <Route
          exact
          path='/admin/web-sockets/:websocketID'
          component={() => (
            <AdminWebSocketItem
              notificationHandler={this.props.notificationHandler}
              adminWebSocket={this.props.adminWebSocket}
            />
          )}
        />
        <Route
          path='/admin/web-sockets'
          component={() => (
            <AdminWebSocketMain
              notificationHandler={this.props.notificationHandler}
              adminWebSocket={this.props.adminWebSocket}
            />
          )}
        />
      </Switch>
    );
  }
}
