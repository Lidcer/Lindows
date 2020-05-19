import './Lype.scss';
import React, { ChangeEvent } from 'react';
import { services } from '../../services/SystemService/ServiceHandler';
import { launchApp } from '../../essential/apps';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUserPlus,
  faHome,
  faUserTimes,
  faUserClock,
  faCog,
  faMicrophone,
  faVolumeUp,
  faSearch,
  faTimes,
  faPhoneAlt,
  faUserMinus,
  faUserSlash,
  faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { bgService, bgRunningService, killBGService } from '../../services/BackgroundService/ServicesHandler';
import { ILypeService, LypeServiceState, getStatusColour } from '../../services/BackgroundService/LypeServices';
import { ILypeAccount, LypeStatus } from '../../../shared/ApiLypeRequestsResponds';
import { LypeAccountInfo } from './LypeAccount';
import { popup } from '../../components/Popup/popupRenderer';
import { ContextMenu, IElement } from '../../components/ContextMenu/ContextMenu';
interface ILypeProps {
  window?: boolean;
  destroy?: () => void;
}

type Tab = 'friends' | 'addFriends' | 'friendRequests' | 'blockedUsers';

interface ILypeState {
  ready: boolean;
  error: string;
  tab: Tab;
  searchBar: string;
  searchAutoComplete: string;
  filterTab: string;
  inProgress: boolean;
  friendsSearch: ILypeAccount[];
  warn: string;
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
      filterTab: '',
      searchAutoComplete: 'filter',
      inProgress: false,
      searchBar: '',
      warn: '',
      friendsSearch: [],
      animation: {
        x: this.animationMaxOffset,
        y: this.animationMaxOffset,
      },
    };
  }

  render() {
    return (
      <div ref={this.ref} className='lype'>
        {this.loadingOverlay}
        {this.renderWarn}
        <div className='lype-content'>{this.lypeContent}</div>
      </div>
    );
  }
  get loadingOverlay() {
    if (!this.state.inProgress) return null;
    return (
      <>
        {this.loadingAnimation}
        <div className='lype-loading-overlay'></div>
      </>
    );
  }

  get renderWarn() {
    if (this.state.warn)
      return (
        <div className='lype-warn-content animated bounceIn faster'>
          {this.state.warn}
          <div className='lype-warn-ignore'>
            <FontAwesomeIcon onClick={() => this.setState({ warn: '' })} icon={faTimes}></FontAwesomeIcon>
          </div>
        </div>
      );
    return null;
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
              <FontAwesomeIcon title='Add home' icon={faHome}></FontAwesomeIcon>
            </div>
            <div
              className={`lype-left-navbar-button${this.state.tab === 'addFriends' ? ' llnb-active' : ''}`}
              onClick={() => this.switchTab('addFriends')}
            >
              <FontAwesomeIcon title='Add friend' icon={faUserPlus}></FontAwesomeIcon>
            </div>
            <div
              className={`lype-left-navbar-button${this.state.tab === 'friendRequests' ? ' llnb-active' : ''}`}
              onClick={() => this.switchTab('friendRequests')}
            >
              <FontAwesomeIcon title='Friend request' icon={faUserClock}></FontAwesomeIcon>
            </div>
            <div
              className={`lype-left-navbar-button${this.state.tab === 'blockedUsers' ? ' llnb-active' : ''}`}
              onClick={() => this.switchTab('blockedUsers')}
            >
              <FontAwesomeIcon title='Blocked users' icon={faUserTimes}></FontAwesomeIcon>
            </div>
          </div>
          <input
            type='text'
            autoComplete='off'
            value={this.state.searchBar}
            placeholder={this.state.searchAutoComplete}
            onChange={this.onSearchInputChange}
            onKeyUp={this.searchKeyUp}
          />
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

  searchKeyUp = async (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (ev.keyCode !== 13) return;
    if (this.state.tab !== 'addFriends') return;
    if (!this.state.searchBar) return;
    if (this.state.warn) this.setState({ warn: '' });
    this.setState({ inProgress: true });
    await this.startLoading();
    try {
      const result = await this.lypeService.findUsers(this.state.searchBar);
      const state = { ...this.state };
      if (!result.length) return this.setState({ warn: 'Nothing found', inProgress: false });
      state.friendsSearch = result;
      state.inProgress = false;
      this.setState(state);
    } catch (error) {
      this.setState({ inProgress: false, warn: error.message });
    }
    setTimeout(() => {
      this.setState({ inProgress: false });
    }, 20);
  };

  onSearchInputChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const target = ev.target;
    const state = { ...this.state };
    state.searchBar = target.value;
    this.setState(state);
  };

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
        <div className='lype-account-status-badge' style={{ backgroundColor: getStatusColour(ac.status) }}></div>
      </div>
    );
  };

  renderFriendsList() {
    const lypeAccount = this.lypeService.account;

    switch (this.state.tab) {
      case 'friends':
        return this.renderFriendsTab();
      case 'addFriends':
        return this.renderAddFriendsTab();
      case 'friendRequests':
        return this.renderFriendRequestsTab();
      case 'blockedUsers':
        return this.renderBlockedUsersTab();

      default:
        return (
          <div className='lype-left-empty lype-left-friends'>
            Ops... Something went wrong.
            <a
              onClick={ev => {
                ev.stopPropagation();
                this.switchTab('addFriends');
              }}
            >
              Click here
            </a>
            to return.
          </div>
        );
    }
  }

  areYouSureContext = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>, yes: () => void, no?: () => void) => {
    const element = (
      <ContextMenu
        x={ev.clientX}
        y={ev.clientY}
        onAnyClick={() => popup.remove(element)}
        elements={[
          { content: 'Are you sure' },
          {
            content: <span className='text-success'>Yes</span>,
            iconOrPicture: faCheck,
            onClick: () => yes(),
          },
          {
            content: <span className='text-danger'>No</span>,
            iconOrPicture: faTimes,
            onClick: () => {
              if (no) no();
            },
          },
        ]}
      />
    );
    setTimeout(() => {
      popup.add(element);
    });
  };

  openContentMenu = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>, account: ILypeAccount) => {
    const iElements: IElement[] = [];
    if (this.lypeService.friends.find(f => f.id === account.id)) {
      iElements.push({ content: 'Call', iconOrPicture: faPhoneAlt });
      iElements.push({
        content: <span className='text-danger'>Remove friend</span>,
        iconOrPicture: faUserMinus,
        onClick: event => {
          this.areYouSureContext(event, () => this.onAddOrRemoveFriend(account.id, false));
        },
      });
    }
    if (this.lypeService.friendRequest.find(f => f.id === account.id)) {
      iElements.push({
        content: <span className='text-success'>Accept</span>,
        iconOrPicture: faCheck,
        onClick: () => {
          this.onAddOrRemoveFriend(account.id, true);
        },
      });
      iElements.push({
        content: <span className='text-danger'>Deny</span>,
        iconOrPicture: faTimes,
        onClick: () => {
          this.onAddOrRemoveFriend(account.id, true);
        },
      });
    }
    if (this.lypeService.pendingRequests.find(f => f.id === account.id)) {
      iElements.push({
        content: <span className='text-danger'>Remove friend request</span>,
        iconOrPicture: faTimes,
        onClick: () => {
          this.onAddOrRemoveFriend(account.id, false);
        },
      });
    }
    if (this.state.friendsSearch.find(f => f.id === account.id)) {
      iElements.push({
        content: <span className='text-success'>Add friend</span>,
        iconOrPicture: faUserPlus,
        onClick: () => {
          const state = { ...this.state };
          const indexOf = state.friendsSearch.indexOf(account);
          if (indexOf !== -1) state.friendsSearch.splice(indexOf, 1);
          this.setState(state);
          this.onAddOrRemoveFriend(account.id, true);
        },
      });
    }

    if (this.lypeService.blockedUsers.find(f => f.id === account.id)) {
      iElements.push({
        content: <span className='text-danger'>Unblock User</span>,
        iconOrPicture: faUserPlus,
        onClick: () => {
          console.log('will block');
        },
      });
    } else {
      iElements.push({
        content: <span className='text-danger'>Block user</span>,
        iconOrPicture: faUserSlash,
        onClick: () => {
          console.log('will block');
        },
      });
    }

    const element = (
      <ContextMenu
        x={ev.clientX}
        y={ev.clientY}
        onAnyClick={() => {
          popup.remove(element);
        }}
        elements={iElements}
      />
    );
    popup.add(element);
  };

  renderFriendsTab = () => {
    const lypeAccount = this.lypeService.account;
    if (lypeAccount.friends.length === 0) {
      return (
        <div className='lype-left-empty lype-left-friends'>
          No friends. Press <FontAwesomeIcon icon={faUserPlus}></FontAwesomeIcon> to find some.
        </div>
      );
    }
    return (
      <div className='lype-left-friends'>
        {lypeAccount.friends.map((e, i) => (
          <LypeAccountInfo
            key={i}
            account={e}
            onClick={ev => console.log('test')}
            onContextMenu={ev => {
              ev.preventDefault();
              this.openContentMenu(ev, e);
            }}
          />
        ))}
      </div>
    );
  };

  renderAddFriendsTab = () => {
    if (this.state.friendsSearch.length === 0 && this.lypeService.pendingRequests.length === 0) {
      return (
        <div className='lype-left-empty lype-left-friends'>
          Type something in search bar <FontAwesomeIcon icon={faSearch}></FontAwesomeIcon> to user.
        </div>
      );
    }

    return (
      <div className='lype-left-friends'>
        {this.state.friendsSearch.map((e, i) => (
          <LypeAccountInfo
            key={i}
            account={e}
            onContextMenu={ev => {
              ev.preventDefault();
              this.openContentMenu(ev, e);
            }}
            buttons={[
              {
                onClick: () => {
                  const state = { ...this.state };
                  state.friendsSearch.splice(i, 1);
                  this.setState(state);
                  this.onAddOrRemoveFriend(e.id, true);
                },
                content: 'Add friend',
              },
            ]}
          />
        ))}
        {this.lypeService.pendingRequests.map((e, i) => (
          <LypeAccountInfo
            key={i}
            account={e}
            onContextMenu={ev => {
              ev.preventDefault();
              this.openContentMenu(ev, e);
            }}
            buttons={[
              {
                onClick: () => {
                  this.onAddOrRemoveFriend(e.id, false);
                },
                content: 'Remove friend Request',
              },
            ]}
          />
        ))}
      </div>
    );
  };

  onAddOrRemoveFriend = async (id: string, add: boolean) => {
    try {
      if (this.state.warn) this.setState({ warn: '' });
      this.setState({ warn: '', inProgress: true });
      await this.startLoading();
      await this.lypeService.addOrRemoveFriend(id, add);
      if (!this.destroyed) this.setState({ inProgress: false });
    } catch (error) {
      if (!this.destroyed) this.setState({ warn: error.message, inProgress: false });
    }
  };

  renderFriendRequestsTab = () => {
    const lypeAccount = this.lypeService.account;
    if (lypeAccount.friendRequest.length === 0) {
      return <div className='lype-left-empty lype-left-friends'>No pending requests.</div>;
    }
    return (
      <div className='lype-left-friends'>
        {lypeAccount.friendRequest.map((e, i) => (
          <li key={i} onClick={() => this.friendClick}>
            <LypeAccountInfo
              key={i}
              onContextMenu={ev => {
                ev.preventDefault();
                this.openContentMenu(ev, e);
              }}
              account={e}
              buttons={[
                {
                  onClick: () => {
                    this.onAddOrRemoveFriend(e.id, true);
                  },
                  content: 'Accept',
                },
                {
                  onClick: () => {
                    this.onAddOrRemoveFriend(e.id, false);
                  },
                  content: 'Deny',
                },
              ]}
            />
          </li>
        ))}
      </div>
    );
  };

  renderBlockedUsersTab = () => {
    const lypeAccount = this.lypeService.account;
    if (lypeAccount.friends.length === 0) {
      return <div className='lype-left-empty lype-left-friends'>Yay no blocks.</div>;
    }
    return (
      <div className='lype-left-friends'>
        {lypeAccount.blocked.map((e, i) => (
          <li key={i} onClick={() => this.friendClick}>
            {e.username}
          </li>
        ))}
      </div>
    );
  };

  addFriend = () => {
    const lypeAccount = this.lypeService.account;
    if (lypeAccount.friends.length === 0) {
      return <div className='lype-left-friends'>No friends</div>;
    }
    return (
      <div className='lype-left-friends'>
        {lypeAccount.friends.map((e, i) => (
          <li key={i} onClick={() => this.friendClick}>
            {e.username}
          </li>
        ))}
      </div>
    );
  };

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

  animateLoading = () => {
    if (this.destroyed) return;
    if (!this.shouldLoad && !this.state.inProgress) {
      const state = { ...this.state };
      state.animation.x = this.animationMaxOffset;
      state.animation.y = this.animationMaxOffset;
      this.animationState = 'idle';
      this.setState(state);
      return;
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
      this.startLoading();
      return;
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

  startLoading() {
    return new Promise(resolve => {
      setTimeout(() => {
        this.animateLoading();
        resolve();
      });
    });
  }

  get shouldLoad() {
    if (!this.lypeService) return true;
    if (this.lypeService.state === 'notReady') return true;
    if (this.lypeService.state === 'loading') return true;
    if (!this.state.ready) return true;
    return false;
  }

  switchTab(tab: Tab) {
    const state = { ...this.state };
    state.searchBar = '';
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
