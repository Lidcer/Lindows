import './AccountManager.scss';
import React from 'react';
import { services } from '../../services/services';
import { IAccountInfo } from '../../services/account';

interface IAccountProps {
  window?: boolean;
}
declare type ShowOptions = 'register' | 'login' | 'accountSettings' | 'none';

interface IAccountState {
  show: ShowOptions;
  register: {
    username: string;
    password: string;
    repeatPassword: string;
    email: string;
  };
  login: {
    usernameOrEmail: string;
    password: string;
  };

  accountChange: {
    email: string;
    newEmail: string;
    password: string;
    newPassword: string;
    repeatPassword: string;
    file?: File;
  };
  logined: boolean;
  currentUserName: string;
  avatar: string;
  email: string;
  error: string;
  info: string;
}

const DEFAULT_AVATAR = './assets/images/appsIcons/AccountManager.svg';

export class AccountManagerWebpage extends React.Component<IAccountProps, IAccountState> {
  constructor(props: IAccountProps) {
    super(props);
    this.state = {
      show: 'none',
      register: {
        email: '',
        password: '',
        repeatPassword: '',
        username: '',
      },
      login: {
        password: '',
        usernameOrEmail: '',
      },
      accountChange: {
        email: '',
        newEmail: '',
        newPassword: '',
        repeatPassword: '',
        password: '',
      },
      logined: false,
      currentUserName: '',
      email: '',
      avatar: DEFAULT_AVATAR,
      info: '',
      error: '',
    };
  }

  render() {
    return <>{this.renderContent}</>;
  }

  get renderContent() {
    if (this.props.window)
      return (
        <>
          {this.navigationBar}
          <div className='m-2'>{this.renderTab}</div>
          {this.state.error ? <div className='p-3 mb-2 bg-danger text-white'>{this.state.error}</div> : null}
        </>
      );
    else
      return (
        <div className='services.account-manager'>
          <div className='services.account-manager-window'>
            {this.navigationBar}
            {this.state.error ? <div className='p-3 mb-2 bg-danger text-white'>{this.state.error}</div> : null}
            <div
              className={
                this.props.window
                  ? 'h-100 services.account-manager-form-content'
                  : 'p-5 h-100 services.account-manager-form-content'
              }
            >
              {this.renderTab}
            </div>
          </div>
        </div>
      );
  }

  get navigationBar() {
    return (
      <div className='p-2 btn-lrs'>
        <ul className='nav nav-tabs'>
          {this.state.logined ? (
            <>
              <li className='nav-item'>
                <button
                  className={`nav-link${this.state.show === 'login' ? ' active' : ''}`}
                  onClick={() => this.switchTab('login')}
                >
                  login
                </button>
              </li>
            </>
          ) : null}
          {this.state.logined ? (
            <>
              <li className='nav-item'>
                <button
                  className={`nav-link${this.state.show === 'register' ? ' active' : ''}`}
                  onClick={() => this.switchTab('register')}
                >
                  register
                </button>
              </li>
            </>
          ) : null}
          {!this.state.logined ? (
            <li className='nav-item'>
              <button
                className={`nav-link${this.state.show === 'accountSettings' ? ' active' : ''}`}
                onClick={() => this.switchTab('accountSettings')}
              >
                settings
              </button>
            </li>
          ) : null}
        </ul>
      </div>
    );
  }

  get renderTab() {
    if (this.state.show === 'login') return this.loginRender;
    else if (this.state.show === 'register') return this.registerRender;
    else if (this.state.show === 'accountSettings') return this.settingsRender;
    else null;
  }

  get registerRender() {
    return (
      <>
        <form className='services.account-manager-form'>
          <h5>Username</h5>
          <input
            type='text'
            className='form-control'
            value={this.state.register.username}
            onChange={e => {
              this.registerChange(e, 'username');
            }}
            placeholder='Username'
          ></input>
          <h5>Email</h5>
          <input
            type='text'
            className='form-control'
            value={this.state.register.email}
            onChange={e => {
              this.registerChange(e, 'email');
            }}
            placeholder='Email'
          ></input>
          <h5>Password</h5>
          <input
            type='password'
            className='form-control'
            value={this.state.register.password}
            onChange={e => {
              this.registerChange(e, 'password');
            }}
            placeholder='password'
          ></input>
          <h5>Repeat Password</h5>
          <input
            type='password'
            className='form-control'
            value={this.state.register.repeatPassword}
            onChange={e => {
              this.registerChange(e, 'repeatPassword');
            }}
            placeholder='Repeat password'
          ></input>
          <button className='btn btn-lrs m-2' onClick={this.register}>
            Register
          </button>
        </form>
      </>
    );
  }

  get loginRender() {
    return (
      <>
        <form className='services.account-manager-form'>
          <h5>Username or mail</h5>
          <input
            type='text'
            className='form-control'
            value={this.state.login.usernameOrEmail}
            onChange={e => {
              this.loginChange(e, 'usernameOrEmail');
            }}
            placeholder='Username or Mail'
          ></input>
          <h5>Password</h5>
          <input
            type='password'
            className='form-control'
            value={this.state.login.password}
            onChange={e => {
              this.loginChange(e, 'password');
            }}
            placeholder='password'
          ></input>
          <button className='btn btn-lrs m-2' onClick={this.login}>
            Login
          </button>
        </form>
      </>
    );
  }

  get settingsRender() {
    return (
      <>
        <form className='services.account-manager-form' onSubmit={this.accountSettings}>
          <div className='d-flex'>
            <img
              className='m-1'
              height='200px'
              width='200px'
              src={this.state.avatar}
              alt={this.state.currentUserName}
              onClick={this.uploadImage}
            ></img>

            <div>
              <h4>{this.state.currentUserName}</h4>
              <h5>Password</h5>
              <input
                type='Change Password'
                className='form-control'
                value={this.state.login.password}
                onChange={e => {
                  this.loginChange(e, 'password');
                }}
                placeholder='password'
              ></input>
              <input type='file' name='imgUploader' multiple onChange={this.filesSelected}></input>
              {this.state.accountChange.file ? this.renderUpdateImageButton() : null}
            </div>
          </div>

          <br />

          <div className='services.account-manager-section'>
            <h5>new Password</h5>
            <input
              type='password'
              className='form-control'
              value={this.state.accountChange.newPassword}
              onChange={e => {
                this.settingsChange(e, 'newPassword');
              }}
              placeholder='password'
            ></input>
            <h5>Repeat new Password</h5>
            <input
              type='password'
              className='form-control'
              value={this.state.accountChange.repeatPassword}
              onChange={e => {
                this.settingsChange(e, 'repeatPassword');
              }}
              placeholder='password'
            ></input>
            <button className='btn btn-lrs m-2' onClick={this.changePassword}>
              Change Password
            </button>
          </div>
          <br />
          <div className='services.account-manager-section'>
            <h5>Change mail</h5>
            <input
              type='text'
              className='form-control'
              value={this.state.accountChange.newEmail}
              onChange={e => {
                this.settingsChange(e, 'newMail');
              }}
              placeholder='Change Email'
            ></input>
            <button className='btn btn-lrs m-2' onClick={this.changeMail}>
              Change mail
            </button>
          </div>

          <div></div>
          <button className='btn btn-lrs m-2' onClick={this.logout}>
            Logout
          </button>
        </form>
      </>
    );
  }

  componentDidMount() {
    this.checkAccount();
  }

  private checkAccount() {
    //services.account.services.account
  }

  switchTab = (tab: ShowOptions) => {
    this.setState({ show: tab });
  };

  get show() {
    switch (this.state.show) {
      case 'register':
        return this.registerRender;
      default:
        return null;
    }
  }

  registerChange = (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const state = { ...this.state };
    state.register[type] = event.target.value;
    this.setState(state);
  };

  register = (event: React.MouseEvent) => {
    event.preventDefault();
    services.account
      .register(
        this.state.register.username,
        this.state.register.email,
        this.state.register.password,
        this.state.register.repeatPassword,
      )
      .then(this.setAccount)
      .catch(this.showError)
      .finally(this.clearPasswordFields);
  };

  loginChange = (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const state = { ...this.state };
    state.login[type] = event.target.value;
    this.setState(state);
  };

  login = (event: React.MouseEvent) => {
    event.preventDefault();
    services.account
      .login(this.state.login.usernameOrEmail, this.state.login.password)
      .then(this.setAccount)
      .catch(this.showError)
      .finally(this.clearPasswordFields);
  };

  renderUpdateImageButton() {
    return (
      <button className='btn btn-lrs m-2' onClick={this.uploadImage}>
        Alter profile
      </button>
    );
  }

  filesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files[0];
    const state = { ...this.state };
    state.accountChange.file = file;
    this.setState(state);
    console.log(event);
  };

  accountSettings = (event: React.FormEvent) => {
    console.log(event);
  };

  uploadImage = async (event: React.MouseEvent) => {
    event.preventDefault();
    services.account
      .changeAvatar(this.state.accountChange.password, this.state.accountChange.file, e => {
        console.log(e);
      })
      .then(this.setAccount)
      .catch(this.showError)
      .finally(this.clearPasswordFields);
  };

  settingsChange = (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const state = { ...this.state };
    state.accountChange[type] = event.target.value;
    this.setState(state);
  };

  changePassword = () => {
    services.account
      .changePassword(
        this.state.accountChange.password,
        this.state.accountChange.newEmail,
        this.state.accountChange.repeatPassword,
      )
      .then(this.setAccount)
      .catch(this.showError)
      .finally(this.clearPasswordFields);
  };

  changeMail = () => {
    services.account
      .changeEmail(this.state.accountChange.password, this.state.accountChange.email)
      .then(this.setAccount)
      .catch(this.showError)
      .finally(this.clearPasswordFields);
  };
  setAccount = (account: IAccountInfo) => {
    this.setState({
      logined: true,
      avatar: account.avatar,
      currentUserName: account.username,
    });
  };

  showError = (error: any) => {
    if (error.message) this.setState({ error: error.message });
    else error.toString();
  };

  clearPasswordFields = () => {
    const state = { ...this.state };
    state.accountChange.password = '';
    state.register.password = '';
    state.register.repeatPassword = '';
  };

  logout = () => {
    services.account.logout();
    this.setState({
      logined: false,
      avatar: DEFAULT_AVATAR,
      currentUserName: '',
      email: '',
    });
  };
}
