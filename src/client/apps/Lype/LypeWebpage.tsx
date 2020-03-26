import './Lype.scss';
import React from 'react';
import { services } from '../../services/services';
import { launchApp } from '../../essential/apps';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faHome, faCog, faMicrophone, faVolumeUp } from '@fortawesome/free-solid-svg-icons';
import {
  backgroundServices,
  bgService,
  bgRunningService,
  killBGService,
} from '../../services/backgroundService/ServicesHandler';
import { ILypeService, LypeServiceState } from '../../services/backgroundService/LypeServices';
import { LypeStatus } from '../../../shared/ApiUsersRequestsResponds';
interface ILypeProps {
  window?: boolean;
  destroy?: () => void;
}

type Tab = 'friends' | 'addFriend' | 'something';

interface ILypeState {
  ready: boolean;
  error: string;
  tab: Tab;
  animation: {
    x: number;
    y: number;
  };
}

export class LypeWebpage extends React.Component<ILypeProps, ILypeState> {
  private lypeService = bgRunningService<ILypeService>('lype');
  private ref: React.RefObject<HTMLDivElement>;
  private performance = -1;
  private animationState: 'start' | 'loop' | 'end' | 'idle' = 'idle';
  private animationIdle = 0;
  private animationMaxOffset = 45;
  destroyed = false;

  constructor(props: ILypeProps) {
    super(props);
    this.ref = React.createRef();
    this.state = {
      tab: 'friends',
      ready: false,
      error: '',
      animation: {
        x: this.animationMaxOffset,
        y: this.animationMaxOffset,
      },
    };
  }

  render() {
    return (
      <div ref={this.ref} className='lype'>
        {this.lypeContent}
      </div>
    );
  }

  get lypeContent() {
    if (this.state.error) return this.showError;
    if (this.shouldLoad) return this.loadingAnimation;
    if (this.lypeService.state === 'createAccount') return this.connectAccount;
    if (!this.lypeService || !this.lypeService.account) return this.loginAccount;

    if (!this.lypeService.account) return <div>?</div>;
    return (
      <>
        {this.leftBar}
        <div className='lype-chat'>
          <div className='lype-chat-header'>test</div>
          <div className='lype-chat-content'>
            <div className='messages'>{this.renderMessages()}</div>
          </div>
          <div className='lype-chat-input'>
            <input type='text' />
          </div>
        </div>
      </>
    );
  }

  get loadingAnimation() {
    return (
      <div className='lype-loading'>
        <div className='lype-loading-top'></div>
        <div className='lype-loading-bottom'></div>
        <div className='lype-loading-left'></div>
        <div className='lype-loading-right'></div>

        <div className='lype-loading-coroner-right-top'></div>
        <div className='lype-loading-coroner-left-bottom'></div>

        <div className='lype-loading-center'></div>
        <div className='lype-loading-l-side'></div>
        <div className='lype-loading-l-bottom'></div>
        <div
          className='lype-loading-box'
          style={{ left: `${this.state.animation.x}px`, top: `${this.state.animation.y}px` }}
        ></div>
        <div
          className='lype-loading-box'
          style={{ right: `${this.state.animation.x}px`, bottom: `${this.state.animation.y}px` }}
        ></div>
      </div>
    );
  }

  get connectAccount() {
    const name = services.account.account ? services.account.account.username : '';
    return (
      <div className='lype'>
        <div className='lype-login-required'>
          <h1>Ops. It looks like that your account has not been connect to lype service</h1>
          <button onClick={this.handleConnect}>Connect account {name} to Lype service</button>
        </div>
      </div>
    );
  }

  get showError() {
    return (
      <div className='lype'>
        <div className='lype-login-required'>
          <h1 className='text-danger'>Well that was unexpected. An error occurred</h1>
          <h1 className='text-danger'>{this.state.error}</h1>
          <button onClick={this.destroy}>Restart</button>
        </div>
      </div>
    );
  }

  get loginAccount() {
    return (
      <div className='lype'>
        <div className='lype-login-required'>
          <h1>Login required</h1>
          <button onClick={this.handleLogin}>Login</button>
        </div>
      </div>
    );
  }

  get leftBar() {
    const div = this.ref.current;
    if (!div) return null;
    const { width } = div.getBoundingClientRect();
    if (width < 450) return null;

    const ac = this.lypeService.account;

    return (
      <div className='lype-left-bar'>
        <div className='lype-left-navbar'>
          <div className='lype-left-navbar-buttons'>
            <div
              className={`lype-left-navbar-button${this.state.tab === 'friends' ? ' llnb-active' : ''}`}
              onClick={() => this.switchTab('friends')}
            >
              <FontAwesomeIcon icon={faHome}></FontAwesomeIcon>
            </div>
            <div
              className={`lype-left-navbar-button${this.state.tab === 'addFriend' ? ' llnb-active' : ''}`}
              onClick={() => this.switchTab('addFriend')}
            >
              <FontAwesomeIcon icon={faUserPlus}></FontAwesomeIcon>
            </div>
          </div>
          <input type='text' autoComplete='off' />
        </div>
        <div className='lype-left-friends'>
          <ul>{this.renderFriendsList()}</ul>
        </div>
        <div className='lype-left-userInfo'>
          <div className='lype-left-userInfo-avatar'>{this.avatar()}</div>
          <div className='lype-left-userInfo-name'>
            <div className='lype-lui-displayed-name'>{ac.displayedName}</div>
            <div className='lype-lui-custom-status'>{ac.customStatus}</div>
          </div>
          <div className='lype-left-userInfo-settings'>
            <div className='lype-lus-button'>
              <FontAwesomeIcon icon={faMicrophone}></FontAwesomeIcon>
            </div>
            <div className='lype-lus-button'>
              <FontAwesomeIcon icon={faVolumeUp}></FontAwesomeIcon>
            </div>
            <div className='lype-lus-button'>
              <FontAwesomeIcon icon={faCog}></FontAwesomeIcon>
            </div>
          </div>
        </div>
      </div>
    );
  }

  handleConnect = () => {
    this.lypeService.createLypeUser();
  };

  handleLogin = () => {
    if (this.props.window) {
      launchApp('accountmgr');
    } else {
      location.href = `${location.origin}/account/?a=lype`;
    }
  };

  avatar = () => {
    const ac = this.lypeService.account;
    return (
      <div className='la-status'>
        <img src={ac.avatar} alt={ac.username} />
        <div className='lype-account-status-badge' style={{ backgroundColor: this.getStatusColour(ac.status) }}></div>
      </div>
    );
  };

  renderFriendsList() {
    const fakeFriends: string[] = [];
    for (let i = 0; i < 99; i++) {
      fakeFriends.push(i.toString());
    }

    switch (this.state.tab) {
      case 'addFriend':
        return <div>test</div>;
      case 'friends':
        return fakeFriends.map((e, i) => (
          <li key={i} onClick={() => this.friendClick}>
            {e}
          </li>
        ));

      default:
        return <div>eee</div>;
    }
  }
  //TODO: replace with proper list

  renderMessages() {
    //TODO: render message
    const fakeMessages: string[] = [];
    for (let i = 0; i < 99; i++) {
      fakeMessages.push(`${i} bla bla bla`);
    }
    return fakeMessages.map((e, i) => <li key={i}>{e}</li>);
  }

  friendClick = (text: string) => {
    console.log(text);
  };

  componentDidMount() {
    if (!this.props.window) window.addEventListener('resize', this.update);
    this.animateLoading();
    this.startup();
  }

  componentWillUnmount() {
    this.destroyed = true;
    services.removeListener('allReady', this.startup);
    services.account.removeListener('login', this.update);
    services.account.removeListener('logout', this.update);
    this.lypeService.removeListener('destroy', this.lypeServiceCrash);
    window.removeEventListener('resize', this.update);
  }

  lypeServiceCrash = () => {
    const state = { ...this.state };
    state.error = 'Lype service crashed';
    this.setState(state);
  };

  getStatusColour = (status: LypeStatus) => {
    switch (status) {
      case 'online':
        return '#43b581';
      case 'awayFromKeyboard':
        return '#faa61a';
      case 'doNotDisturb':
        return '#f04747';
      default:
        return '#747f8d';
    }
  };

  animateLoading = () => {
    if (this.destroyed) return;
    if (!this.shouldLoad) {
      const state = { ...this.state };
      state.animation.x = this.animationMaxOffset;
      state.animation.y = this.animationMaxOffset;
      this.animationState = 'idle';
      this.setState(state);
    }
    const performanceNow = performance.now();
    if (this.performance === -1) {
      this.performance = performanceNow;
      requestAnimationFrame(this.animateLoading);
      return;
    }
    const current = performanceNow - this.performance;
    const state = { ...this.state };

    const animationSpeed = 0.5;
    const maxLimit = 160;
    const safeSpeed = 0.1;

    if (this.animationState === 'loop') {
      if (state.animation.y === maxLimit) {
        state.animation.y = 0;
        state.animation.x = 0;
        this.animationState = 'end';
      }

      if (state.animation.x === maxLimit) {
        let speed = 1 - state.animation.y / maxLimit;
        if (speed < safeSpeed) speed = safeSpeed;
        state.animation.y = state.animation.y + current * animationSpeed * speed;
        if (state.animation.y > maxLimit) {
          state.animation.y = maxLimit;
        }
      } else {
        let speed = state.animation.x / maxLimit;
        if (speed < safeSpeed) speed = safeSpeed;
        state.animation.x = state.animation.x + current * animationSpeed * speed;
      }

      if (state.animation.x > maxLimit) {
        state.animation.x = maxLimit;
      }
    } else if (this.animationState === 'start') {
      let speed = state.animation.y / this.animationMaxOffset;
      if (speed < safeSpeed) speed = safeSpeed;
      state.animation.y = state.animation.y - current * animationSpeed * speed;
      state.animation.x = state.animation.y;
      if (state.animation.y < 0) {
        state.animation.x = 0;
        state.animation.y = 0;
        this.animationState = 'loop';
      }
    } else if (this.animationState === 'end') {
      let speed = state.animation.y / this.animationMaxOffset;
      if (speed < safeSpeed) speed = safeSpeed;
      state.animation.y = state.animation.y + current * animationSpeed * speed;
      state.animation.x = state.animation.y;

      if (state.animation.y > this.animationMaxOffset) {
        state.animation.x = this.animationMaxOffset;
        state.animation.y = this.animationMaxOffset;
        this.animationState = 'idle';
      }
    } else if (this.animationState === 'idle') {
      this.animationIdle += current;

      if (this.animationIdle > 500) {
        this.animationIdle = 0;
        this.animationState = 'start';
      }
    }

    //console.log(state.animation.x);
    // state.animation.y = state.animation.y - current * 0.05;

    this.setState(state);
    this.performance = performanceNow;
    requestAnimationFrame(this.animateLoading);
  };

  onStateChange = (lypeState: LypeServiceState) => {
    const state = { ...this.state };
    if (lypeState === LypeServiceState.Loading) {
      this.animateLoading();
    } else if (lypeState === LypeServiceState.Error) {
      state.error = this.lypeService.errorMessage ? this.lypeService.errorMessage : 'Unknown';
    }
    this.setState(state);
  };

  update = () => {
    this.setState({});
  };

  startup = async () => {
    this.lypeService = await bgService<ILypeService>('lype');
    if (this.lypeService.state === 'notReady') {
      this.lypeService.on('stateChange', this.startup);
      return;
    }
    console.log(this.lypeService.state);
    this.lypeService.removeListener('stateChange', this.startup);
    this.lypeService.on('stateChange', this.onStateChange);
    this.lypeService.on('destroy', this.lypeServiceCrash);
    const state = { ...this.state };
    state.ready = true;
    if (this.lypeService.state === LypeServiceState.Error) {
      state.error = this.lypeService.errorMessage;
    }

    this.setState(state);
  };

  get shouldLoad() {
    if (!this.lypeService) return true;
    if (this.lypeService.state === 'notReady') return true;
    if (this.lypeService.state === 'loading') return true;
    if (!this.state.ready) return true;
    return false;
  }

  switchTab(tab: Tab) {
    const state = { ...this.state };
    state.tab = tab;
    this.setState(state);
  }

  destroy = async () => {
    this.destroyed = true;
    if (this.props.destroy) {
      await this.props.destroy();
      setTimeout(async () => {
        await killBGService('lype');
        launchApp('lype');
      }, 500);
    }
    if (!this.props.window) location.reload();
  };
}
