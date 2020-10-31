import React, { Component } from "react";
import { Link } from "react-router-dom";
import { IAccount } from "../../shared/ApiUsersRequestsResponds";
import AdminAccount from "./AdminAccount";
import { IAdminWebSocket } from "./Websocket";
import AdminWebSocketStatus from "./AdminWebSocketStatus";
export type NavigationBarTab = "eventLog" | "account" | "webSockets";

interface INavigationBarAdminProps {
  account: IAccount;
  adminWebSocket: IAdminWebSocket;
}

export default class NavigationBarAdmin extends Component<INavigationBarAdminProps, {}> {
  isActive(type: string) {
    const result = location.pathname.includes(type);
    if (!type) {
      return /\/admin\/.*\//g.test(location.pathname) ? "" : " active";
    }
    return result ? " active" : "";
  }
  refresh = () => {
    this.setState({});
  };

  render() {
    return (
      <nav className='navbar navbar-expand-lg navbar-light bg-light'>
        <div className='collapse navbar-collapse' id='navbarNav'>
          <ul className='navbar-nav mr-auto'>
            <li className={`nav-item${this.isActive("")}`}>
              <Link to='/admin/' onClick={this.refresh} className='nav-link'>
                Home
              </Link>
            </li>
            <li className={`nav-item${this.isActive("eventlog")}`}>
              <Link to='/admin/event-log/' onClick={this.refresh} className='nav-link'>
                Event Log
              </Link>
            </li>
            <li className={`nav-item${this.isActive("accounts")}`}>
              <Link to='/admin/accounts/' onClick={this.refresh} className='nav-link'>
                Accounts
              </Link>
            </li>
            <li className={`nav-item${this.isActive("websocket")}`}>
              <Link to='/admin/web-sockets/' onClick={this.refresh} className='nav-link'>
                Web Sockets
              </Link>
            </li>
          </ul>
          <AdminWebSocketStatus adminWebSocket={this.props.adminWebSocket} />
          <AdminAccount account={this.props.account} />
        </div>
      </nav>
    );
  }
}
