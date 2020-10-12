import React from 'react';
import { BaseWindow, IManifest, MessageBox } from '../BaseWindow/BaseWindow';
import { MoneyClickerGame } from './MoneyClickerGame';
import { MoneyClickerWarper } from './MoneyClickerStyled';

export class MoneyClicker extends BaseWindow {
  private ref = React.createRef<HTMLCanvasElement>();
  private moneyClicker: MoneyClickerGame;

  public static manifest: IManifest = {
    fullAppName: 'Money Clicker',
    launchName: 'money-clicker',
    icon: '/assets/images/appsIcons/MoneyClicker.svg',
  };

  constructor(props) {
    super(
      props,
      {
        title: 'Loading...',
        minHeight: 500,
        minWidth: 700,
      },
      {},
    );
  }

  shown() {
    this.moneyClicker = new MoneyClickerGame(this.ref.current, this);
    this.moneyClicker.loadGame(this.loading);
  }

  closing() {
    //this.moneyClicker.destroy();
    this.moneyClicker = undefined;
  }

  resize() {
    this.onResolutionUpdate();
  }
  onRestore() {
    requestAnimationFrame(this.onResolutionUpdate);
  }
  onRestoreDown() {
    requestAnimationFrame(this.onResolutionUpdate);
  }
  onMaximize() {
    requestAnimationFrame(this.onResolutionUpdate);
  }

  onResolutionUpdate = () => {
    if (this.moneyClicker) {
      this.moneyClicker.onResolutionChange();
    }
  };

  loading = async (percentage: number) => {
    if (!this.destroyed) {
      if (percentage === 100) {
        this.changeOptions({ title: `Money Clicker` });
        try {
          this.moneyClicker.startGame();
        } catch (error) {
          DEVELOPMENT && console.error(error);
          await MessageBox.Show(
            this,
            'An error occurred. Money clicker was unable to load game files',
            'Unable to load',
          );
          this.exit();
        }
      } else {
        this.changeOptions({ title: `Money Clicker loading ${Math.round(percentage)}%` });
      }
    }
  };

  renderInside() {
    return (
      <MoneyClickerWarper>
        <canvas ref={this.ref} style={{ height: `100%`, width: `100%` }}></canvas>
      </MoneyClickerWarper>
    );
  }
}
