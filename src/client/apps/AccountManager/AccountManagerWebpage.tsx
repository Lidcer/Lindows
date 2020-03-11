import './AccountManager.scss';
import React from 'react';
import { services } from '../../services/services';
import { IAccountInfo } from '../../services/account';

interface IAccountProps {
  window?: boolean;
}

enum Tab {
  Loading,
  Login,
  Register,
  Settings,
  ForgotPassword,
}

interface IAccountState {
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
  resetPassword: {
    email: string;
  };
  settings: {
    email: string;
    newEmail: string;
    password: string;
    newPassword: string;
    repeatPassword: string;
    file?: File;
  };
  tab: Tab;
  inProgress: boolean;
  logined: boolean;
  currentUserName: string;
  avatar: string;
  email: string;
  error: string;
  info: string;
}

const DEFAULT_AVATAR = './assets/images/appsIcons/AccountManager.svg';

export class AccountManagerWebpage extends React.Component<IAccountProps, IAccountState> {
  private destroyed = false;
  constructor(props: IAccountProps) {
    super(props);
    this.state = {
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
      settings: {
        email: '',
        newEmail: '',
        newPassword: '',
        repeatPassword: '',
        password: '',
      },
      resetPassword: {
        email: '',
      },
      tab: Tab.Loading,
      inProgress: false,
      logined: false,
      currentUserName: '',
      email: '',
      avatar: DEFAULT_AVATAR,
      info: '',
      error: '',
    };
  }

  render() {
    if (this.props.window)
      return (
        <div className='account-manager'>
          {this.renderWarn}
          {this.renderContent}
        </div>
      );
    return (
      <div className='account-manager-page account-manager'>
        {this.renderWarn}
        {this.renderContent}
      </div>
    );
  }

  get renderWarn() {
    if (this.state.error || this.state.info) {
      if (this.state.error) return <span className='text-warning'>{this.state.error}</span>;
      if (this.state.info) return <span className='text-success'>{this.state.info}</span>;
    }
    return null;
  }

  get renderContent() {
    if (this.state.inProgress) return this.loading;

    switch (this.state.tab) {
      case Tab.Register:
        return this.registerTab;
      case Tab.ForgotPassword:
        return this.forgetPassword;
      case Tab.Settings:
        return this.settingsTab;
      case Tab.Login:
        return this.loginTab;
      default:
        return this.loading;
    }
  }

  get loading() {
    return <div>Loading...</div>;
  }

  get loginTab() {
    return (
      <form onSubmit={this.login}>
        <h1>Login</h1>

        <input
          onChange={ev => this.onChange(ev, 'login', 'usernameOrEmail')}
          type='text'
          name='login-username-email'
          id='login-username-email'
          placeholder='Username of Email'
        />
        <input
          onChange={ev => this.onChange(ev, 'login', 'password')}
          type='password'
          name='login-password'
          id='login-password'
          placeholder='password'
        />

        <a onClick={this.gotoForgetPassword}>Forgot Password</a>
        <div>
          <button onClick={this.login}>Login</button>
          <button onClick={this.goToRegister}>Sign up</button>
        </div>
      </form>
    );
  }

  get registerTab() {
    return (
      <form onSubmit={this.register}>
        <h1>Register</h1>

        <input
          value={this.state.register.username}
          onChange={ev => this.onChange(ev, 'register', 'username')}
          type='text'
          name='register-username'
          id='register-username'
          placeholder='Username'
        />
        <input
          value={this.state.register.password}
          onChange={ev => this.onChange(ev, 'register', 'password')}
          type='password'
          name='register-password'
          id='register-password'
          placeholder='password'
        />
        <input
          value={this.state.register.repeatPassword}
          onChange={ev => this.onChange(ev, 'register', 'repeatPassword')}
          type='password'
          name='register-repeat-password'
          id='register-repeat-password'
          placeholder='Repeat password'
        />
        <input
          value={this.state.register.email}
          onChange={ev => this.onChange(ev, 'register', 'email')}
          type='register-email'
          name='register-email'
          id='register-email'
          placeholder='Email'
        />

        <div>
          <button onClick={this.register}>Register</button>
          <button onClick={this.gotoLogin}>Sign in</button>
        </div>
      </form>
    );
  }

  onChange = (
    ev: React.ChangeEvent<HTMLInputElement>,
    type: 'login' | 'register' | 'resetPassword' | 'settings',
    key: string,
  ) => {
    const value = ev.target.value;
    const state = { ...this.state };

    switch (type) {
      case 'login':
        state.login[key] = value;
        break;
      case 'register':
        state.register[key] = value;
        break;
      case 'resetPassword':
        state.resetPassword[key] = value;
        break;
      case 'settings':
        state.settings[key] = value;
        break;
      default:
        break;
    }
    this.setState(state);
  };

  get settingsTab() {
    return <div></div>;
  }

  get forgetPassword() {
    return (
      <form onSubmit={this.resetPassword}>
        <h1>Forgot Password</h1>

        <input
          onChange={ev => this.onChange(ev, 'resetPassword', 'email')}
          type='text'
          name='forgot-password-email'
          id='forgot-password-email'
          placeholder='forgot password email'
        />

        <button onClick={this.resetPassword}> Reset password </button>
        <button onClick={this.gotoLogin}> Back to Login </button>
      </form>
    );
  }

  login = async (ev?: React.FormEvent) => {
    if (ev) ev.preventDefault();
    const state = { ...this.state };
    this.setState({ inProgress: true });
    try {
      await services.account.login(this.state.login.usernameOrEmail, this.state.login.password);
      return this.updateTabAccordingToUser();
    } catch (error) {
      console.error(error);
      state.error = error.toString();
    }
    if (this.destroyed) return;
    this.setState(state);
  };

  register = async (ev?: React.FormEvent) => {
    if (ev) ev.preventDefault();
    this.setState({ inProgress: true });
    const state = { ...this.state };

    console.log(state);
    try {
      await services.account.register(
        this.state.register.username,
        this.state.register.email,
        this.state.register.password,
        this.state.register.repeatPassword,
      );
      return this.updateTabAccordingToUser();
    } catch (error) {
      console.error(error);
      state.error = error.toString();
    }

    if (this.destroyed) return;
    this.setState(state);
  };

  resetPassword = async (ev: React.FormEvent) => {
    ev.preventDefault();
    this.setState({ inProgress: true });
    services.account
      .resetPassword(this.state.resetPassword.email)
      .then(() => {
        if (this.destroyed) return;
        //TODO: requets form server
        this.setState({ info: 'Email has been sent' });
      })
      .catch(e => {
        if (this.destroyed) return;
        this.setState({ error: e.toString() });
      })
      .finally(() => {
        if (this.destroyed) return;
        this.setState({ inProgress: false });
      });
  };

  goToRegister = (ev: React.MouseEvent) => {
    ev.preventDefault();
    this.switchTab(Tab.Register);
  };

  gotoLogin = (ev: React.MouseEvent) => {
    ev.preventDefault();
    this.switchTab(Tab.Login);
  };

  gotoForgetPassword = (ev: React.MouseEvent) => {
    ev.preventDefault();
    this.switchTab(Tab.ForgotPassword);
  };

  switchTab(tab: Tab) {
    this.clearParameters();
    this.setState({ tab: Tab.Loading });
    /*
     * It has to be in setTimeout function in order to react fully update form
     * otherwise it only updates already displayed ones and report problem in console
     */
    setTimeout(() => {
      this.setState({ tab });
    });
  }

  componentDidMount() {
    if (services.isReady) return this.updateTabAccordingToUser();

    services.on('allReady', this.updateTabAccordingToUser);
  }
  componentWillUnmount() {
    this.destroyed = true;
    services.removeListener('allReady', this.updateTabAccordingToUser);
  }

  clearParameters() {
    const state = { ...this.state };
    state.resetPassword = {
      email: '',
    };
    state.settings = {
      email: '',
      newEmail: '',
      newPassword: '',
      password: '',
      repeatPassword: '',
      file: undefined,
    };
    state.login = {
      password: '',
      usernameOrEmail: '',
    };
    state.register = {
      email: '',
      password: '',
      repeatPassword: '',
      username: '',
    };
    this.setState(state);
  }

  updateTabAccordingToUser = () => {
    const ac = services.account.account;
    if (ac) {
      this.setState({
        tab: Tab.Settings,
        currentUserName: ac.username,
        avatar: ac.avatar,
      });
    } else {
      this.setState({ tab: Tab.Login });
    }
  };

  //private checkAccount() {
  //services.account.services.account
  //}
}
