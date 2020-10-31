import React, { Component } from "react";
import { TOKEN_HEADER } from "../../shared/constants";
import Axios, { AxiosRequestConfig } from "axios";
import { IResponse } from "../../shared/ApiUsersRequestsResponds";
import Navigation from "./AdminNavigation";
import { IAdminWebSocket } from "./Websocket";
import { Link } from "react-router-dom";
import ReactLoading from "react-loading";
import moment from "moment";

export interface IAdminAccount {
  id: string;
  username: string;
  displayedName: string;
  compromised: boolean;
  banned: boolean;
  createdAt: number;
  lastOnlineAt: number;
  avatar: string;
  email: string;
  note: string;
  verified: boolean;
  ip: string[];
  roles: string[];
  flags: string[];
}
interface IAdminAccountsState {
  accounts: IAdminAccount[];
  refreshing: boolean;
  page: number;
  search: string;
}
interface IAdminAccountsProps {
  adminWebSocket: IAdminWebSocket;
}

interface IAccountData {
  accounts: IAdminAccount[];
  date: Date;
}

let accountsData: IAccountData = {
  accounts: [],
  date: new Date(),
};

export class AdminAccountsList extends Component<IAdminAccountsProps, IAdminAccountsState> {
  constructor(props) {
    super(props);
    this.state = {
      accounts: accountsData.accounts,
      page: 0,
      search: "",
      refreshing: false,
    };
  }

  componentDidMount() {
    if (!accountsData.accounts.length) this.getInfo();
    this.props.adminWebSocket.on("account", this.addAccountFromSocket);
  }

  componentWillUnmount() {
    this.props.adminWebSocket.removeListener("account", this.addAccountFromSocket);
  }

  addAccountFromSocket = (account: IAdminAccount) => {
    if (!account) {
      this.getInfo();
      return;
    }
    const find = accountsData.accounts.find(a => a.id === account.id);
    if (!find) {
      accountsData.accounts.push(account);
      this.setState({ accounts: accountsData.accounts });
    }
  };

  async getInfo() {
    this.setState({ refreshing: true });
    const token = localStorage.getItem("auth");
    const axiosRequestConfig: AxiosRequestConfig = {
      headers: {},
    };
    axiosRequestConfig.headers[TOKEN_HEADER] = token;

    try {
      const response = await Axios.get<IResponse<IAdminAccount[]>>("/api/v1/admin/accounts", axiosRequestConfig);
      const accounts = response.data.success;
      if (!accounts) throw new Error("Missing data");
      accountsData = { accounts, date: new Date() };
      this.setState({ refreshing: false, accounts });
    } catch (error) {
      console.error(error);
    }
    this.setState({ refreshing: false });
  }

  getAccount(account: IAdminAccount) {
    return (
      <Link className='router-link' to={`/admin/accounts/${account.id}`} style={{ textDecoration: "none" }}>
        <div className={`m-2 p-2 event-log admin-clickable border ${account.banned ? "account-banned" : ""}`}>
          <div>
            {account.avatar ? (
              <>
                <img className='account-avatar' src={account.avatar} /> {account.avatar}
              </>
            ) : (
              "Avatar: none"
            )}
          </div>
          <div>Username: {account.username}</div>
          <div>displayedName: {account.displayedName}</div>
          <div>compromised: {account.compromised}</div>
          <div>createdAt: {account.createdAt}</div>
          <div>lastOnlineAt: {account.lastOnlineAt}</div>
          <div>email: {account.email}</div>
          <div>verified: {`${account.verified}`}</div>
        </div>
      </Link>
    );
  }

  page() {
    const multiplayer = this.state.page !== 0 ? 10 * this.state.page : 0;
    const events = this.state.accounts.slice(0 + multiplayer, 10 + multiplayer);
    if (!events.length && this.state.page !== 0) {
      this.setState({ page: 0 });
      return null;
    }
    if (!events.length) return <div>No accounts ?</div>;
    return events.map((e, i) => {
      return <div key={i}> {this.getAccount(e)} </div>;
    });
  }

  updateList = () => {
    const accounts = accountsData.accounts
      .filter(a => {
        const username = a.username;
        const displayedName = a.displayedName || "";
        const email = a.email || "";
        const note = a.note || "";
        const msg = `${username}${displayedName}${email}${note}`.toLowerCase();
        return msg.includes(this.state.search.toLowerCase());
      })
      .sort((a, b) => new Date(b.createdAt).getMilliseconds() - new Date(a.createdAt).getTime());

    this.setState({ accounts });
  };

  render() {
    if (this.state.refreshing) {
      return <ReactLoading className='m-2' type={"bars"} color={"#00ff00"} height={50} width={50} />;
    }

    const c = (ev: React.ChangeEvent<HTMLInputElement>) => {
      this.setState({ search: ev.target.value });
    };

    const key = (ev: React.KeyboardEvent<HTMLInputElement>) => {
      if (ev.key === "Enter") {
        setTimeout(() => {
          this.updateList();
        });
      }
    };

    const time = accountsData.date ? (
      <span className='p-2'> {moment(accountsData.date).format("MMMM Do YYYY, HH:mm:ss")}</span>
    ) : null;

    return (
      <div className='m-2'>
        <button className='btn btn-terminal' onClick={() => this.getInfo()}>
          Refresh
        </button>
        {time}
        <div>
          <input
            type='text'
            className='input-terminal'
            value={this.state.search}
            onChange={c}
            placeholder='Search'
            onKeyDown={key}
          />
          {this.page()}
          <Navigation
            length={this.state.accounts.length}
            currentPage={this.state.page}
            onNext={() => {
              this.setState({ page: this.state.page + 1 });
            }}
            onPrevious={() => {
              this.setState({ page: this.state.page - 1 });
            }}
          />
        </div>
      </div>
    );
  }
}
