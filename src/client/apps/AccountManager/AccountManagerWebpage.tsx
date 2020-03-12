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
  Verification,
}

interface IAccountState {
  account?: IAccountInfo;
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
    displayedName: string;
    newEmail: string;
    password: string;
    newPassword: string;
    repeatPassword: string;
    file?: File;
  };
  verifyResult: string;
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
        displayedName: '',
        newEmail: '',
        newPassword: '',
        repeatPassword: '',
        password: '',
      },
      resetPassword: {
        email: '',
      },
      verifyResult: '',
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
      case Tab.Verification:
        return this.verification;
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
          placeholder='Password'
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
          placeholder='Password'
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

  get verification() {
    return (
      <>
        <h1>Verifying</h1>

        <span>{this.state.verifyResult}</span>
      </>
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
    const ac = services.account.account;
    if (!ac) return null;
    return (
      <form onSubmit={this.changeProfile}>
        <h1>User profile</h1>
        <div className='account-manager-card account-manager-settings-header'>
          <div className='account-manager-avatar'>
            <img src={ac.avatar} alt={ac.username} onClick={this.openFile} />

            <input
              id='account-manager-avatar-file-input'
              type='file'
              accept='image/jpeg, image/png'
              onChange={this.filesSelected}
              hidden
            ></input>
          </div>
          <div className='account-manager-info'>
            <span>Account ID:</span>
            <input type='text' value={ac.accountId} disabled />
            <span>Username:</span>
            <input type='text' value={ac.username} disabled />
            <span>Displayed name:</span>
            <input
              type='text'
              value={this.state.settings.displayedName}
              onChange={ev => this.onChange(ev, 'settings', 'displayedName')}
            />
          </div>
        </div>
        <div className='account-manager-card'>
          <span>Change password:</span>
          <input
            type='password'
            name='settings-new-password'
            id='settings-new-password'
            placeholder='Password'
            value={this.state.settings.newPassword}
            onChange={ev => this.onChange(ev, 'settings', 'newPassword')}
          />
          <input
            type='password'
            name='settings-repeat-new-password'
            id='settings-repeat-new-password'
            placeholder='Repeat Password'
            value={this.state.settings.repeatPassword}
            onChange={ev => this.onChange(ev, 'settings', 'repeatPassword')}
          />
        </div>

        <div className='account-manager-card'>
          <span>Change email:</span>
          <input
            type='text'
            placeholder='Email'
            value={this.state.settings.newEmail}
            onChange={ev => this.onChange(ev, 'settings', 'newEmail')}
          />
        </div>

        <div className='account-manager-card'>
          <span>Current Password</span>
          <input
            type='password'
            name='settings-password'
            id='settings-password'
            placeholder='Password'
            value={this.state.settings.password}
            onChange={ev => this.onChange(ev, 'settings', 'password')}
          />
          {this.changes}
          <button className='btn btn-secondary'>Alter Profile</button>
          <button className='btn btn-secondary' onClick={this.logout}>
            Log out
          </button>
        </div>
      </form>
    );
  }

  logout = () => {
    services.account.logout();

    this.setState({});
  };

  get changes() {
    const changes: string[] = [];
    const st = this.state.settings;
    const ac = services.account.account;
    if (st.displayedName !== ac.displayedName)
      changes.push(`Displayed name: ${ac.displayedName} => ${st.displayedName}`);
    if (st.newPassword) changes.push('Password: ******* => ********');
    if (st.newEmail) changes.push(`Email: [HIDDEN] => ${st.newEmail}`);
    if (st.file) changes.push(`Avatar: ${st.file.name}`);
    if (!changes.length) return null;
    return (
      <div className='account-manager-card'>
        <span>This will alter</span>
        <ul>
          {changes.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </div>
    );
  }

  filesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files[0];
    const state = { ...this.state };
    state.settings.file = file;
    this.setState(state);
  };

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

  openFile = () => {
    const input = document.getElementById('account-manager-avatar-file-input') as HTMLInputElement;
    if (input) input.click();
    console.log('should open file');
  };

  login = async (ev?: React.FormEvent) => {
    if (ev) ev.preventDefault();
    const state = { ...this.state };
    this.setState({ inProgress: true });
    try {
      await services.account.login(this.state.login.usernameOrEmail, this.state.login.password);
      if (this.destroyed) return;
      this.setState({ inProgress: false });
      return this.updateTabAccordingToUser();
    } catch (error) {
      if (this.destroyed) return;
      console.log(error);
      state.error = error.message;
      this.setState(state);
    }
  };

  register = async (ev?: React.FormEvent) => {
    if (ev) ev.preventDefault();
    this.setState({ inProgress: true });
    const state = { ...this.state };

    try {
      const response = await services.account.register(
        this.state.register.username,
        this.state.register.email,
        this.state.register.password,
        this.state.register.repeatPassword,
      );
      this.setState({
        error: '',
        info: response,
      });
      this.updateTabAccordingToUser();
      return;
    } catch (error) {
      state.error = error.message;
      if (this.destroyed) return;
      this.setState(state);
      return;
    } finally {
      this.setState({ inProgress: false });
    }
  };

  resetPassword = async (ev: React.FormEvent) => {
    ev.preventDefault();
    this.setState({ inProgress: true });
    services.account
      .resetPassword(this.state.resetPassword.email)
      .then(() => {
        if (this.destroyed) return;
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

  changeProfile = async (ev: React.FormEvent) => {
    ev.preventDefault();
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

  switchTab(tab: Tab): Promise<void> {
    return new Promise(resolve => {
      this.clearParameters();
      this.setState({ tab: Tab.Loading });
      /*
       * It has to be in setTimeout function in order to react fully update form
       * otherwise it only updates already displayed ones and report problem in console
       */
      setTimeout(() => {
        this.setState({ tab });
        resolve();
      });
    });
  }

  verifyCode(code: string) {
    services.account
      .verifyAccount(code)
      .then(account => {
        this.setState({ verifyResult: `Welcome ${account.username}. You account has been verified.` });
        setTimeout(() => {
          if (this.destroyed) return;
          this.switchTab(Tab.Settings);
        }, 5000);
      })
      .catch((error: Error) => this.setState({ verifyResult: error.message }));
  }

  async componentDidMount() {
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
      displayedName: services.account.account ? services.account.account.displayedName : '',
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

  updateTabAccordingToUser = async () => {
    if (!this.props.window) {
      const url = new URL(document.location.href);
      const verificationCode = url.searchParams.get('v');
      if (verificationCode) {
        await this.switchTab(Tab.Verification);
        this.verifyCode(verificationCode);
        return;
      }
    }
    const ac = services.account.account;
    if (ac) {
      await this.switchTab(Tab.Settings);
      this.setState({
        currentUserName: ac.username,
        avatar: ac.avatar,
      });
    } else {
      await this.switchTab(Tab.Login);
    }
  };

  //private checkAccount() {
  //services.account.services.account
  //}
}
