import React from 'react';
import { ILypeAccount } from '../../../shared/ApiLypeRequestsResponds';
import { getStatusColour } from '../../services/backgroundService/LypeServices';
import { DEFAULT_AVATAR } from '../AccountManager/AccountManagerWebpage';
import {
  LypeAccountInfoBTN,
  LypeAccountInfoButtons,
  LypeAccountInfoDetails,
  LypeAccountInfoName,
  LypeAccountInfoCustom,
  LypeAccountInfoProfilePic,
  LypeAccountStatusBadge,
  LypeAccountInfoStyle,
  LypeAccountStatusBadgeBig,
} from './LypeStyled';

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
      <LypeAccountInfoButtons>
        {this.props.buttons.map((b, i) => {
          if (typeof b.content === 'string') {
            return (
              <LypeAccountInfoBTN key={i} onClick={e => b.onClick(e)}>
                {b.content}
              </LypeAccountInfoBTN>
            );
          }
          return (
            <div key={i} onClick={e => b.onClick(e)}>
              {b.content}
            </div>
          );
        })}
      </LypeAccountInfoButtons>
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
        <LypeAccountInfoDetails>
          <LypeAccountInfoName>{this.props.account.displayedName}</LypeAccountInfoName>
          <LypeAccountInfoCustom>
            {this.customStatus} {this.buttons}
          </LypeAccountInfoCustom>
        </LypeAccountInfoDetails>
      );
    }
    return (
      <LypeAccountInfoDetails>
        <LypeAccountInfoName>{this.props.account.displayedName}</LypeAccountInfoName>
      </LypeAccountInfoDetails>
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
      <LypeAccountInfoStyle
        className={`${this.props.onClick ? ' clickable' : ''}`}
        onContextMenu={this.handleContentMenu}
        onClick={this.handleClick}
      >
        <LypeAccountInfoProfilePic>
          <LypeAccountStatusBadgeBig style={{ backgroundColor: getStatusColour(this.props.account.status) }} />
          <img src={this.image} />
        </LypeAccountInfoProfilePic>
        {this.name}
      </LypeAccountInfoStyle>
    );
  }
}
