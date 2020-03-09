import './Lype.scss';
import React from 'react';

interface IAccountProps {
  window?: boolean;
}
declare type ShowOptions = 'register' | 'login' | 'accountSettings' | 'none';

const DEFAULT_AVATAR = './assets/images/appsIcons/Lype.svg';

export class LypeWebpage extends React.Component<IAccountProps, {}> {
  constructor(props: IAccountProps) {
    super(props);
  }

  componentDidMount() {
    console.log('mounted');
  }

  render() {
    return (
      <>
        <div className='lype'>
          <div className='friends'>
            <ul>{this.renderFriendsList()}</ul>{' '}
          </div>
          <div className='chat'>
            <div className='header'>Friend name i guess</div>
            <div className='footer'>
              <div className='messages'>{this.renderMessages()}</div>
              <div className='input'>
                <input type='text' />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

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
}
