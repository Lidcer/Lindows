import './AccountManager.scss';
import React from 'react';
import { IAccountRegisterRequest } from '../../../shared/ApiRequests';
import { registerUserJoi } from '../../../shared/joi';
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
  warn: string;
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
      warn: '',
    };
  }

  componentDidMount() {
    if (localStorage.getItem('auth')) {
      this.setState({ show: 'accountSettings' });
    } else {
      this.setState({ show: 'register' });
    }
  }

  render() {
    return (
      <>
        <div className='account-manager'>{this.renderContent}</div>
      </>
    );
  }

  get renderContent() {
    if (this.props.window)
      return (
        <div className='account-manager-window'>
          {this.navigationBar}
          <div className='m-5'>{this.registerRender}</div>
          {this.state.warn ? <div className='p-3 mb-2 bg-danger text-white'>{this.state.warn}</div> : null}
        </div>
      );
    else
      return (
        <>
          {this.navigationBar}
          <div className='m-5'>{this.registerRender}</div>
          {this.state.warn ? <div className='p-3 mb-2 bg-danger text-white'>{this.state.warn}</div> : null}
        </>
      );
  }

  get navigationBar() {
    return (
      <div className='p-2'>
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

  get registerRender() {
    return (
      <>
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
      </>
    );
  }

  registerChange = (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const state = { ...this.state };
    state.register[type] = event.target.value;
    this.setState(state);
  };

  register = () => {
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
          this.setState({ show: 'register' });
          localStorage.setItem('auth', response.headers['x-auth-token']);
        })
        .catch((error: any) => {
          if (error && error.response && error.response.data && error.response.data.error) {
            this.setState({ warn: error.response.data.error });
          } else {
            this.setState({ warn: 'Internal server error' });
          }
        });
    }
  };
}
