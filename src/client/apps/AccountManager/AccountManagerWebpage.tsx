import './AccountManager.scss';
import React from 'react';
import { services } from '../../services/services';
import { IAccountInfo } from '../../services/account';
import { VerificationType } from '../../../shared/ApiRequestsResponds';
import { OpenFileDialog } from '../../essential/FileDialog';
import { SECOND } from '../../../shared/constants';

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
  ResetPassword,
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
    password: string;
    repeatPassword: string;
  };
  forgetPassword: {
    email: string;
  };
  settings: {
    displayedName: string;
    newEmail: string;
    password: string;
    newPassword: string;
    repeatPassword: string;
    alteringProfile: string[];
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
      resetPassword: {
        password: '',
        repeatPassword: '',
      },
      settings: {
        displayedName: '',
        newEmail: '',
        newPassword: '',
        repeatPassword: '',
        password: '',
        alteringProfile: [],
        file: undefined,
      },
      forgetPassword: {
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

  get forgetPasswordTab() {
    return (
      <form onSubmit={this.changePasswordForm}>
        <h1>Forgot Password</h1>

        <input
          onChange={ev => this.onChange(ev, 'forgetPassword', 'email')}
          type='text'
          name='forgot-password-email'
          id='forgot-password-email'
          placeholder='Email'
          autoComplete='off'
        />

        <button onClick={this.changePasswordForm}> Reset password </button>
        <button onClick={this.gotoLogin}> Back to Login </button>
      </form>
    );
  }

  get loadingTab() {
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
          autoComplete='off'
        />
        <input
          onChange={ev => this.onChange(ev, 'login', 'password')}
          type='password'
          name='login-password'
          id='login-password'
          placeholder='Password'
          autoComplete='off'
        />

        <a onClick={this.gotoForgetPassword}>Forgot Password</a>
        <div>
          <button onClick={this.login}>Login</button>
          <button onClick={this.goToRegister}>Sign up</button>
        </div>
      </form>
    );
  }

  get resetPasswordTab() {
    return (
      <form onSubmit={this.resetPassword}>
        <h1>Password reset</h1>

        <input
          onChange={ev => this.onChange(ev, 'resetPassword', 'password')}
          type='password'
          name='reset-password'
          id='reset-password'
          placeholder='Password'
          autoComplete='off'
        />

        <input
          onChange={ev => this.onChange(ev, 'resetPassword', 'repeatPassword')}
          type='password'
          name='reset-repeat-password'
          id='reset-repeat-password'
          placeholder='Repeat password'
          autoComplete='off'
        />

        <div>
          <button onClick={this.resetPassword}>Reset password</button>
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
          autoComplete='off'
        />
        <input
          value={this.state.register.password}
          onChange={ev => this.onChange(ev, 'register', 'password')}
          type='password'
          name='register-password'
          id='register-password'
          placeholder='Password'
          autoComplete='off'
        />
        <input
          value={this.state.register.repeatPassword}
          onChange={ev => this.onChange(ev, 'register', 'repeatPassword')}
          type='password'
          name='register-repeat-password'
          id='register-repeat-password'
          placeholder='Repeat password'
          autoComplete='off'
        />
        <input
          value={this.state.register.email}
          onChange={ev => this.onChange(ev, 'register', 'email')}
          type='register-email'
          name='register-email'
          id='register-email'
          placeholder='Email'
          autoComplete='off'
        />

        <div>
          <button onClick={this.register}>Register</button>
          <button onClick={this.gotoLogin}>Sign in</button>
        </div>
      </form>
    );
  }

  get verificationTab() {
    return (
      <>
        <h1>Verifying</h1>

        <span>{this.state.verifyResult}</span>
      </>
    );
  }

  get settingsTab() {
    const ac = services.account.account;
    if (!ac) {
      this.switchTab(Tab.Login);
      return null;
    }
    const avatar = this.props.window ? ac.avatar : `./.${ac.avatar}`;

    return (
      <form onSubmit={this.changeProfile}>
        <h1>User profile</h1>
        <div className='account-manager-scrollabled'>
          <div className='account-manager-card account-manager-settings-header'>
            <div className='account-manager-avatar'>
              <img src={avatar} alt={ac.username} onClick={this.openFile} />

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

              <div hidden={this.qt}>
                <span>Displayed name:</span>
                <input
                  type='text'
                  value={this.state.settings.displayedName}
                  autoComplete='off'
                  onChange={ev => this.onChange(ev, 'settings', 'displayedName')}
                />
              </div>
            </div>
          </div>
          <div hidden={this.qt}>
            <div className='account-manager-card'>
              <span>Change password:</span>
              <input
                type='password'
                name='settings-new-password'
                id='settings-new-password'
                placeholder='Password'
                autoComplete='off'
                value={this.state.settings.newPassword}
                onChange={ev => this.onChange(ev, 'settings', 'newPassword')}
              />
              <input
                type='password'
                name='settings-repeat-new-password'
                id='settings-repeat-new-password'
                placeholder='Repeat Password'
                autoComplete='off'
                value={this.state.settings.repeatPassword}
                onChange={ev => this.onChange(ev, 'settings', 'repeatPassword')}
              />
            </div>

            <div className='account-manager-card'>
              <span>Change email:</span>
              <input
                type='text'
                placeholder='New email'
                autoComplete='off'
                value={this.state.settings.newEmail}
                onChange={ev => this.onChange(ev, 'settings', 'newEmail')}
              />
            </div>
          </div>
          <div hidden={this.qt}>
            <div className='account-manager-card'>
              <span>Current Password</span>
              <input
                type='password'
                name='settings-password'
                id='settings-password'
                placeholder='Current Password'
                autoComplete='off'
                value={this.state.settings.password}
                onChange={ev => this.onChange(ev, 'settings', 'password')}
              />
              {this.changes}
              <div hidden={this.qt}>
                <button
                  className='btn btn-secondary'
                  disabled={!this.changes || this.state.settings.password.length < 3}
                  onClick={this.alterProfile}
                >
                  Alter Profile
                </button>
                <button className='btn btn-secondary' onClick={this.logout}>
                  Log out
                </button>
              </div>
            </div>
          </div>
          {this.alteringChanges}
        </div>
      </form>
    );
  }

  get alteringChanges() {
    if (!this.state.settings.alteringProfile.length) return null;
    return (
      <div className='account-manager-card'>
        <span>Altering</span>
        <ul>
          {this.state.settings.alteringProfile.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </div>
    );
  }

  get qt() {
    return !!this.state.settings.alteringProfile.length;
  }

  alterProfile = async () => {
    this.resetWarnings();
    const state = { ...this.state };
    const pass = state.settings.password;
    state.settings.password = '';
    const ap = state.settings.alteringProfile;
    const ac = services.account;
    try {
      if (state.settings.file) {
        ap.push('Uploading file....');
        const result = await ac.changeAvatar(pass, state.settings.file, n => {
          if (this.destroyed) return;
          ap[1] = `Upload process... ${n}%`;
          state.settings.file = undefined;
          this.setState(state);
        });
        ap[1] = result;
        if (this.destroyed) return;
        this.setState(state);
      }
      if (ac.account.displayedName !== state.settings.displayedName) {
        ap.push('altering displayed Name....');
        const result = await ac.changeDisplayName(state.settings.displayedName, pass);
        ap.push(result);
        if (this.destroyed) return;
        this.state.settings.displayedName = ac.account.displayedName;
        this.setState(state);
      }
      if (state.settings.newEmail) {
        ap.push('Altering Email....');
        const result = await ac.changeEmail(pass, state.settings.newEmail);
        ap.push(result);
        state.settings.newEmail = '';
        if (this.destroyed) return;
        this.setState(state);
      }

      if (state.settings.newPassword) {
        ap.push('Altering Password....');
        await ac.changePassword(pass, state.settings.newPassword, state.settings.repeatPassword);
        state.settings.newPassword = '';
        state.settings.repeatPassword = '';
        ap.push('Password has been changed');
        if (this.destroyed) return;
        this.setState(state);
      }

      ap.push('Done...');
      ap.push('Redirecting back in 30sec');
      this.setInfoMsg('All altering jobs have finished');
      setTimeout(() => {
        if (this.destroyed) return;
        state.settings.alteringProfile = [];
        this.setState(state);
        this.clearParameters();
        this.resetWarnings();
      }, SECOND * 30);
    } catch (error) {
      state.error = error.message;
      if (this.destroyed) return;
      ap.push('Altering Failed!');
      ap.push('Redirecting back in 30sec');
      this.setState(state);
      setTimeout(() => {
        if (this.destroyed) return;
        state.settings.alteringProfile = [];
        this.setState(state);
        this.clearParameters();
      }, SECOND * 30);
    }
  };

  logout = () => {
    services.account.logout();
    this.resetWarnings();
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

  openFile = async () => {
    const fileDialog = new OpenFileDialog();
    const state = { ...this.state };
    fileDialog.acceptTypes = 'image/jpeg, image/png';
    fileDialog
      .ShowDialog()
      .then(files => {
        state.settings.file = files[0];
        this.setState({});
      })
      .catch(_ => {
        state.settings.file = undefined;
        this.setState({});
      });
  };

  login = async (ev?: React.FormEvent) => {
    if (ev) ev.preventDefault();
    const state = { ...this.state };
    this.setState({ inProgress: true });
    try {
      const msg = await services.account.login(this.state.login.usernameOrEmail, this.state.login.password);
      if (this.destroyed) return;
      this.setInfoMsg(msg);
      return this.updateTabAccordingToUser();
    } catch (error) {
      if (this.destroyed) return;
      state.error = error.message;
      this.setState(state);
    } finally {
      this.setState({ inProgress: false });
    }
  };

  resetPassword = async (ev?: React.FormEvent) => {
    if (ev) ev.preventDefault();
    services.account
      .changePasswordWithTemporarilyToken(
        this.temporarilyToken,
        this.state.resetPassword.password,
        this.state.resetPassword.repeatPassword,
      )
      .then(result => {
        this.setInfoMsg(result);
        location.href = `${location.origin}${location.pathname}`;
      })
      .catch(err => {
        this.setErrorMsg(err);
      });
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

  changePasswordForm = async (ev: React.FormEvent) => {
    ev.preventDefault();
    this.setState({ inProgress: true });
    services.account
      .resetPassword(this.state.forgetPassword.email)
      .then(msg => {
        if (this.destroyed) return;
        this.setState({ info: msg });
        this.switchTab(Tab.Login);
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
      if (this.destroyed) return;
      this.clearParameters();
      this.setState({ tab: Tab.Loading });
      /*
       * It has to be in setTimeout function in order to react fully update form
       * otherwise it only updates already displayed ones and report problem in console
       */
      setTimeout(() => {
        if (!this.destroyed) this.setState({ tab });
        resolve();
      });
    });
  }

  async verifyCode(token: string) {
    const redirect = () => {
      setTimeout(() => {
        if (!this.props.window) {
          location.href = `${location.origin}${location.pathname}`;
        }
      }, SECOND * 5);
    };
    try {
      const tokenType = await services.account.checkOutTemporarilyToken(token);
      if (this.destroyed) return;

      if (tokenType === VerificationType.PasswordReset) {
        this.switchTab(Tab.ResetPassword);
      } else if (tokenType === VerificationType.ChangeEmail || tokenType === VerificationType.Verificaiton) {
        this.setState({ verifyResult: 'Validating...' });
        services.account
          .verifyEmail(token)
          .then(msg => {
            this.resetWarnings();
            this.setState({ verifyResult: msg });
          })
          .catch(err => {
            this.setErrorMsg(err);
          })
          .finally(() => {
            redirect();
          });
      }
    } catch (error) {
      this.setState({ verifyResult: error.message });
      redirect();
    }
    // services.account.verifyAccount(code)
    // .then(account => {
    //   this.setState({ verifyResult: `Welcome ${account.username}. You account has been verified.` });
    //   setTimeout(() => {
    //     if (this.destroyed) return;
    //     this.switchTab(Tab.Settings);
    //   }, 5000);
    // })
    // .catch((error: Error) => this.setState({ verifyResult: error.message }));
  }

  async componentDidMount() {
    if (services.isReady) return this.updateTabAccordingToUser();
    services.on('allReady', this.updateTabAccordingToUser);
  }

  componentWillUnmount() {
    this.destroyed = true;
    services.removeListener('allReady', this.updateTabAccordingToUser);
    services.account.removeListener('login', this.updateTabAccordingToUser);
    services.account.removeListener('logout', this.updateTabAccordingToUser);
  }

  clearParameters() {
    const state = { ...this.state };
    state.forgetPassword = {
      email: '',
    };
    state.settings = {
      displayedName: services.account.account ? services.account.account.displayedName : '',
      newEmail: '',
      newPassword: '',
      password: '',
      repeatPassword: '',
      alteringProfile: [],
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
    services.account.on('login', this.updateTabAccordingToUser);
    services.account.on('logout', this.updateTabAccordingToUser);
    if (!this.props.window) {
      const verificationCode = this.temporarilyToken;
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

  onChange = (
    ev: React.ChangeEvent<HTMLInputElement>,
    type: 'login' | 'register' | 'resetPassword' | 'forgetPassword' | 'settings',
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
      case 'forgetPassword':
        state.forgetPassword[key] = value;
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

  setErrorMsg(error: any) {
    if (this.destroyed && !error) return;
    this.resetWarnings();
    const err = error.message ? error.message : error.toString();
    this.setState({ error: err });
  }

  setInfoMsg(info: string) {
    if (this.destroyed && !info) return;
    this.resetWarnings();
    this.setState({ info: info });
  }

  private resetWarnings() {
    if (this.destroyed) return;
    this.setState({
      info: '',
      error: '',
    });
  }

  get renderContent() {
    if (this.state.inProgress) return this.loadingTab;
    switch (this.state.tab) {
      case Tab.Register:
        return this.registerTab;
      case Tab.ForgotPassword:
        return this.forgetPasswordTab;
      case Tab.Settings:
        return this.settingsTab;
      case Tab.Login:
        return this.loginTab;
      case Tab.Verification:
        return this.verificationTab;
      case Tab.ResetPassword:
        return this.resetPasswordTab;
      default:
        return this.loadingTab;
    }
  }

  get temporarilyToken() {
    const url = new URL(document.location.href);
    return url.searchParams.get('v');
  }
}
