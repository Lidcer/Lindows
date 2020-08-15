import { IManifest, BaseWindow, MessageBox } from '../BaseWindow/BaseWindow';
import React from 'react';
import { AnAppWarper } from './AnAppStyled';
import { WindowEvent } from '../BaseWindow/WindowEvent';
import { getNotification, NotificationSystem } from '../../components/Desktop/Notifications';

interface WebExplorerState {
  message: string;
}

export class AnApp extends BaseWindow<WebExplorerState> {
  public static readonly onlyOne = true;
  public notification:NotificationSystem |undefined;

  public static manifest: IManifest = {
    fullAppName: 'An app',
    launchName: 'anapp',
    icon: '/assets/images/unknown-app.svg',
  };

  constructor(props) {
    super(
      props,
      {
        minHeight: 300,
        minWidth: 300,
      },
      {
        message: '',
      },
    );
  }

  load() {
    console.log('function is called before app is ready');
  }

  shown() {
    this.notification = getNotification();
    console.log('function is called after the app is shown');
    // event listeners should be added here
  }
  closing() {
    console.log('function is called after the app is about to close');
    // event listeners should be removed here
  }

  closed() {
    console.log('function is called after the app is about to close');
  }

  onKeyDown?(event: KeyboardEvent) {
    // listens to the keyboard
  }
  onKeyPress?(event: KeyboardEvent) {
    // listens to keypresses
  }
  onKeyUp?(event: KeyboardEvent) {
    // listens to keyupses
  }

  onUpdate?(variables: WebExplorerState) {
    // on variables update
  }
  onExit?(event: WindowEvent) {
    // on exist
  }
  onMinimize?(event: WindowEvent) {
    // on minimize
  }
  onRestore?(event: WindowEvent) {
    // on restore
  }
  onMaximize?(event: WindowEvent) {
    // on maximize
  }
  onRestoreDown?(event: WindowEvent) {
    // on restore down
  }
  onBlur?(event: WindowEvent) {
    // on blur
  }
  onFocus?(event: WindowEvent) {
    // on focus
  }

  onChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const message = ev.target.value;
    this.setVariables({ message });
  };

  openMessageBox = () => {
    MessageBox.Show(this, this.variables.message || ' The message box', 'The message box');
  }

  antonymousOpenMessageBox = () => {
    MessageBox._anonymousShow(this.variables.message || ' The other message box' , 'The message box');
  }

  adminButton = async () => {
    let processor = this.getProcessor();
    if(processor || await this.requestAdmin()) {
      processor = this.getProcessor();
      MessageBox.Show(this, 'You now have permission to access the processor');
    } else {
      MessageBox.Show(this, "You don't have permission to access the processor");
    }
  };

  raiseNotification = () => {
    if(this.notification){
      this.notification.raise(this, AnApp.manifest.fullAppName, this.variables.message || 'notification');
    }
  }

  renderInside() {
    return (
      <AnAppWarper>
        <div>
          <div>{this.variables.message}</div>
          <input onChange={this.onChange} value={this.variables.message}></input>
        </div>
        <div>
          <div>
          <button onClick={this.openMessageBox}>Message box</button>
          <span>This will freeze windows</span>

          </div>
          <div>
          <button  onClick={this.antonymousOpenMessageBox}>Anonymous message box</button>
          <span>This won't freeze windows</span>

          </div>
        </div>

        <div>
          <button onClick={this.adminButton}>request get direct access to processor</button>
          <span>Admin promp will show up</span>
        </div>

        <div>
          <button onClick={_ => this.exit()}>exit</button>
          <button onClick={this.minimize}>minimize</button>
        </div>

        <button onClick={this.raiseNotification}>Raise notification</button>
      </AnAppWarper>
    );
  }
}
