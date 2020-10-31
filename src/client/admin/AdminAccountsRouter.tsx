import React, { Component } from "react";
import { IAdminWebSocket } from "./Websocket";
import { Route, Switch } from "react-router-dom";
import { AdminAccountsList } from "./AdminAccountsList";
import { INotificationHandler } from "./NotificationHandler";
import AdminAccountsItem from "./AdminAccountsItem";

interface IAdminAccountsProps {
  adminWebSocket: IAdminWebSocket;
  notificationHandler: INotificationHandler;
}

export class AdminAccountsRouter extends Component<IAdminAccountsProps> {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Switch>
        <Route
          exact
          path='/admin/accounts/:accountID'
          component={() => <AdminAccountsItem notificationHandler={this.props.notificationHandler} />}
        />
        <Route
          path='/admin/accounts'
          component={() => <AdminAccountsList adminWebSocket={this.props.adminWebSocket} />}
        />
      </Switch>
    );
  }
}
