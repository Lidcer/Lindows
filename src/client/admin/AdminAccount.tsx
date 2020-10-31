import React, { Component } from "react";
import { IAccount } from "../../shared/ApiUsersRequestsResponds";

interface IAdminAccountsProps {
  account?: IAccount;
}

export default class AdminAccount extends Component<IAdminAccountsProps> {
  get displayedName() {
    if (this.props.account.displayedName !== this.props.account.username) return null;

    return <span>({this.props.account.displayedName})</span>;
  }
  get profilePic() {
    if (!this.props.account.avatar) return null;
    return <img src={this.props.account.avatar} />;
  }

  render() {
    if (!this.props.account) return;

    return (
      <div className='admin-account'>
        <b>{this.props.account.username}</b>
        {this.displayedName}
        {this.profilePic}
      </div>
    );
  }
}
