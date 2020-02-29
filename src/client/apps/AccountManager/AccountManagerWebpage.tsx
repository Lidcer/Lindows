import './AccountManager.scss';
import React from 'react';
import { IAccountRegisterRequest, IAccountLoginRequest } from '../../../shared/ApiRequests';
import { registerUserJoi, loginUserJoi } from '../../../shared/joi';
import Axios from 'axios';

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
  };
  logined: boolean;
  currentUserName: string;
  email: string;
  warn: string;
  info: string;
}

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
      info: '',
      warn: '',
    };
  }

  componentDidMount() {
    const token = localStorage.getItem('auth');
    if (token) {
      Axios.get('/api/v1/users/checkAccount', {
        headers: {
          'x-auth-token': token,
        },
      })
        .then(response => {
          if (response && response.data && typeof response.data === 'object') {
            this.setState({
              logined: true,
              currentUserName: response.data.username,
              email: response.data.email,
            });
          }
        })
        .catch(err => {
          console.log('some weird shiasdt');
          console.log(err);
        });
      console.log('some weird shit');
      this.setState({ show: 'accountSettings' });
    } else {
      this.setState({ show: 'register' });
    }
  }

  render() {
    return <>{this.renderContent}</>;
  }

  get renderContent() {
    if (this.props.window)
      return (
        <>
          {this.navigationBar}
          <div className='m-5'>{this.renderTab}</div>
          {this.state.warn ? <div className='p-3 mb-2 bg-danger text-white'>{this.state.warn}</div> : null}
        </>
      );
    else
      return (
        <div className='account-manager'>
          <div className='account-manager-window'>
            {this.navigationBar}
            <div className='m-5'>{this.renderTab}</div>
            {this.state.warn ? <div className='p-3 mb-2 bg-danger text-white'>{this.state.warn}</div> : null}
          </div>
        </div>
      );
  }

  get navigationBar() {
    return (
      <div className='p-2 btn-lrs'>
        <ul className='nav nav-tabs'>
          <li className='nav-item'>
            <button
              className={`nav-link${this.state.show === 'login' ? ' active' : ''}`}
              onClick={() => this.switchTab('login')}
            >
              login
            </button>
          </li>
          <li className='nav-item'>
            <button
              className={`nav-link${this.state.show === 'register' ? ' active' : ''}`}
              onClick={() => this.switchTab('register')}
            >
              register
            </button>
          </li>
          <li className='nav-item'>
            <button
              className={`nav-link${this.state.show === 'accountSettings' ? ' active' : ''}`}
              onClick={() => this.switchTab('accountSettings')}
            >
              settings
            </button>
          </li>
        </ul>
      </div>
    );
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

  get renderTab() {
    if (this.state.show === 'login') return this.loginRender;
    else if (this.state.show === 'register') return this.registerRender;
    else if (this.state.show === 'accountSettings') return this.settingsRender;
    else null;
  }

  get registerRender() {
    return (
      <>
        <form>
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

  registerChange = (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const state = { ...this.state };
    state.register[type] = event.target.value;
    this.setState(state);
  };

  register = (event: React.MouseEvent) => {
    event.preventDefault();
    const accountRegisterRequest: IAccountRegisterRequest = {
      email: this.state.register.email,
      password: this.state.register.password,
      repeatPassword: this.state.register.repeatPassword,
      username: this.state.register.username,
    };

    const valid = registerUserJoi.validate(accountRegisterRequest);

    if (valid.error) this.setState({ warn: valid.error.message });
    else {
      this.setState({ warn: '' });
      this.setState({ show: 'none' });
      Axios.post(`${document.location.origin}/api/v1/users/register`, accountRegisterRequest)
        .then(response => {
          this.setState({ show: 'accountSettings' });
          localStorage.setItem('auth', response.headers['x-auth-token']);
        })
        .catch((error: any) => {
          this.setState({ show: 'register' });
          if (error && error.response && error.response.data && error.response.data.error) {
            this.setState({ warn: error.response.data.error });
          } else {
            this.setState({ warn: 'Internal server error' });
          }
        });
    }
  };

  get loginRender() {
    return (
      <>
        <form>
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

  loginChange = (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const state = { ...this.state };
    state.login[type] = event.target.value;
    this.setState(state);
  };

  login = (event: React.MouseEvent) => {
    event.preventDefault();
    const accountLoginRequest: IAccountLoginRequest = {
      email: this.state.login.usernameOrEmail,
      password: this.state.login.password,
      username: this.state.login.usernameOrEmail,
    };

    const valid = loginUserJoi.validate(accountLoginRequest);

    if (valid.error) this.setState({ warn: valid.error.message });
    else {
      this.setState({ warn: '' });
      this.setState({ show: 'none' });
      Axios.post(`${document.location.origin}/api/v1/users/login`, accountLoginRequest)
        .then(response => {
          this.setState({ show: 'accountSettings' });
          localStorage.setItem('auth', response.headers['x-auth-token']);
        })
        .catch((error: any) => {
          this.setState({ show: 'login' });
          console.log(error);
          if (error && error.response && error.response.data && error.response.data.error) {
            this.setState({ warn: error.response.data.error });
          } else {
            this.setState({ warn: 'Internal server error' });
          }
        });
    }
  };

  get settingsRender() {
    return (
      <>
        <form>
          <h5>{this.state.currentUserName}</h5>

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

          <br />

          <div className='account-manager-section'>
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
          <div className='account-manager-section'>
            <h5>Change mail</h5>
            <input
              type='text'
              className='form-control'
              value={this.state.accountChange.newEmail}
              onChange={e => {
                this.settingsChange(e, 'newMail');
              }}
              placeholder='password'
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
  settingsChange = (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const state = { ...this.state };
    state.accountChange[type] = event.target.value;
    this.setState(state);
  };

  changePassword = () => {};

  changeMail = () => {};

  logout = () => {
    localStorage.removeItem('auth');
    this.setState({
      logined: false,
      currentUserName: '',
      email: '',
    });
  };
}
