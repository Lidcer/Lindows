import './Lype.scss';
import React from 'react';
import { services } from '../../services/services';
import { launchApp } from '../../essential/apps';

interface ILypeProps {
  window?: boolean;
}

interface ILypeState {
  ready: boolean;
}

declare type ShowOptions = 'register' | 'login' | 'accountSettings' | 'none';

const DEFAULT_AVATAR = './assets/images/appsIcons/Lype.svg';

export class LypeWebpage extends React.Component<ILypeProps, ILypeState> {
  destroyed = true;

  constructor(props: ILypeProps) {
    super(props);
    this.state = {
      ready: false,
    };
  }

  render() {
    if (!this.state.ready) return <div>Loading</div>;
    if (!services.account.account) return this.loginAccount;
    return (
      <>
        <div className='lype'>
          <div className='lype-friends'>
            <ul>{this.renderFriendsList()}</ul>{' '}
          </div>
          <div className='lype-chat'>
            <div className='lype-chat-header'>Friend name i guess</div>
            <div className='lype-chat-content'>
              <div className='messages'>{this.renderMessages()}</div>
            </div>
            <div className='lype-chat-input'>
              <input type='text' />
            </div>
          </div>
        </div>
      </>
    );
  }

  get loginAccount() {
    return (
      <div className='lype'>
        <div className='lype-login-required'>
          <h1>Login required</h1>
          <button className='btn btn-primary' onClick={this.handleLogin}>
            Login
          </button>
        </div>
      </div>
    );
  }

  handleLogin = () => {
    if (this.props.window) {
      launchApp('accountmgr');
    } else {
      location.href = `${location.origin}/account/?a=lype`;
    }
  };

  renderFriendsList() {
    //TODO: replace with proper list
    const fakeFriends: string[] = [];
    for (let i = 0; i < 99; i++) {
      fakeFriends.push(i.toString());
    }
    return fakeFriends.map((e, i) => (
      <li key={i} onClick={() => this.friendClick}>
        {e}
      </li>
    ));
  }

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
    if (services.isReady) return this.setup();
    services.on('allReady', this.setup);
  }

  componentWillUnmount() {
    this.destroyed = true;
    services.removeListener('allReady', this.setup);
    services.account.removeListener('login', this.update);
    services.account.removeListener('logout', this.update);
  }

  setup = async () => {
    services.account.on('login', this.update);
    services.account.on('logout', this.update);
    this.setState({ ready: true });
    this.update();
  };

  update = () => {
    this.setState({});
  };
}
