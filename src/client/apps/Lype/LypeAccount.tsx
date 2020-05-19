import './Lype.scss';
import React from 'react';
import { ILypeAccount } from '../../../shared/ApiLypeRequestsResponds';
import { DEFAULT_AVATAR } from '../AccountManager/AccountManagerWebpage';
import { getStatusColour } from '../../services/BackgroundService/LypeServices';

interface ILypeAccountInfo {
  account: ILypeAccount;
  showCustomStatus?: boolean;
  buttons?: IButton[];
  onClick?: (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
  onContextMenu?: (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => void;
}

interface IButton {
  onClick: (ev: React.MouseEvent<HTMLElement, MouseEvent>) => void;
  content: string | JSX.Element;
}

export class LypeAccountInfo extends React.Component<ILypeAccountInfo, {}> {
  constructor(props) {
    super(props);
  }

  get image() {
    return this.props.account.avatar || DEFAULT_AVATAR;
  }
  get status() {
    return this.props.account.status;
  }

  get buttons() {
    if (!this.props.buttons) return null;
    return (
      <div className='lype-account-info-buttons'>
        {this.props.buttons.map((b, i) => {
          if (typeof b.content === 'string') {
            return (
              <button key={i} className='lype-account-info-btn' onClick={e => b.onClick(e)}>
                {b.content}
              </button>
            );
          }
          return (
            <div key={i} onClick={e => b.onClick(e)}>
              {b.content}
            </div>
          );
        })}
      </div>
    );
  }

  get customStatus() {
    if (!this.props.showCustomStatus) return null;
    if (!this.props.account.customStatus) return null;
    return <span>{this.props.account.customStatus}</span>;
  }

  get name() {
    if (this.props.account.customStatus || this.props.buttons) {
      return (
        <div className='lype-account-info-details'>
          <div className='lype-account-info-name'>{this.props.account.displayedName}</div>
          <div className='lype-account-info-custom'>
            {this.customStatus} {this.buttons}
          </div>
        </div>
      );
    }
    return (
      <div className='lype-account-info-details'>
        <div className='lype-account-info-name'>{this.props.account.displayedName}</div>
      </div>
    );
  }

  handleClick = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (this.props.onClick) this.props.onClick(ev);
  };

  handleContentMenu = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (this.props.onContextMenu) this.props.onContextMenu(ev);
  };

  render() {
    return (
      <div
        className={`lype-account-info${this.props.onClick ? ' clickable' : ''}`}
        onContextMenu={this.handleContentMenu}
        onClick={this.handleClick}
      >
        <div className='lype-account-info-profile-pic'>
          <img src={this.image} />
          <div
            className='lype-account-status-badge'
            style={{ backgroundColor: getStatusColour(this.props.account.status) }}
          ></div>
        </div>
        {this.name}
      </div>
    );
  }
}
