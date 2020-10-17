import React from 'react';
import {
  BaseWindow,
  DialogResult,
  IManifest,
  MessageBox,
  MessageBoxButtons,
  MessageBoxIcon,
} from '../BaseWindow/BaseWindow';
import { MoneyClickerGame } from './MoneyClickerGame';
import { MenuButton, MoneyClickerMenuButtons, MoneyClickerSettings, MoneyClickerWarper } from './MoneyClickerStyled';
import { MoneyClickerSaveGameData } from './src/Values';
interface IMoneyClickerState {
  paused: boolean;
  loading: number;
  settings: boolean;
  actualSettings: {
    sounds: boolean;
    fullscreen: boolean;
  };
}

interface MoneyClickerStorage {
  sounds: boolean;
  fullscreen: boolean;
  data: MoneyClickerSaveGameData | undefined;
}

export class MoneyClicker extends BaseWindow<IMoneyClickerState> {
  private ref = React.createRef<HTMLCanvasElement>();
  private moneyClicker: MoneyClickerGame;
  private storage: MoneyClickerStorage;

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
      {
        loading: 0,
        paused: true,
        settings: false,
        actualSettings: {
          fullscreen: false,
          sounds: false,
        },
      },
    );
  }
  async load() {
    let storage: MoneyClickerStorage = this.getItem();
    if (!storage) {
      storage = {
        fullscreen: false,
        sounds: false,
        data: undefined,
      };
      await this.setItem(storage);
    }
    this.storage = storage;
  }
  async shown() {
    if (this.storage.fullscreen) {
      this.changeOptions({ windowType: 'fullscreen' });
    }

    this.moneyClicker = new MoneyClickerGame(
      this.ref.current,
      this,
      () => this.storage.data,
      async (data, quick) => {
        this.storage.data = data;
        if (quick) {
          return this.setItemQuick(this.storage);
        } else {
          return await this.setItem(this.storage);
        }
      },
    );
    this.setVariables({
      actualSettings: {
        fullscreen: this.storage.fullscreen,
        sounds: this.storage.sounds,
      },
    });

    try {
      await this.moneyClicker.loadGame(this.loading);
      if (this.moneyClicker) {
        this.moneyClicker.startGame();
        this.moneyClicker.pauseGame();
        this.moneyClicker.audio = this.storage.sounds;
        this.changeOptions({ title: `Money Clicker` });
        this.setVariables({ loading: 100 });
      }
    } catch (error) {
      const message = error.message || 'An unknown error occured while loading the game!';
      MessageBox._anonymousShow(message, 'Failed to load');
      this.exit();
    }
  }

  onKeyDown(event: KeyboardEvent) {
    if (event.key.toLowerCase() === 'escape' && this.moneyClicker) {
      this.moneyClicker.pauseGame();
      this.setVariables({ paused: true });
    }
  }

  onBlur() {
    if (this.moneyClicker) {
      this.moneyClicker.pauseGame();
      this.setVariables({ paused: true });
    }
  }

  closing() {
    if (this.moneyClicker) {
      this.moneyClicker.destroy();
    }
    this.moneyClicker = undefined;
  }
  async onExit() {
    await this.setItem(this.storage);
  }

  onResize() {
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
      this.setVariables({ loading: percentage });
      this.changeOptions({ title: `Money Clicker loading ${Math.round(percentage)}%` });
    }
  };

  private resumeGame = () => {
    this.setVariables({ paused: false, settings: false });
    this.moneyClicker.resumeGame();
  };
  private settings = () => {
    this.setVariables({ paused: true, settings: true });
  };
  private pauseMenu = () => {
    this.setVariables({ paused: true, settings: false });
  };
  private resetData = () => {
    this.changeOptions({ windowType: 'windowed' });
    setTimeout(async () => {
      const result = await MessageBox.Show(
        this,
        'Are you sure you want to reset game data this action is irreversible',
        'Are you serious?',
        MessageBoxButtons.YesNo,
        MessageBoxIcon.Question,
      );
      if (result === DialogResult.Yes) {
        this.storage.data = undefined;
        await this.setItem(this.storage);
        this.closing();
        this.shown();
      }
      this.changeOptions({ windowType: this.storage.fullscreen ? 'fullscreen' : 'windowed' });
    });
  };

  private enableDisableFullScreen = () => {
    const settings = { ...this.variables.actualSettings };
    settings.fullscreen = !settings.fullscreen;
    this.setVariables({ actualSettings: settings });
    this.storage.fullscreen = settings.fullscreen;
    if (this.storage.fullscreen) {
      this.changeOptions({ windowType: 'fullscreen' });
    } else {
      this.changeOptions({ windowType: 'windowed' });
    }
    requestAnimationFrame(this.onResolutionUpdate);
    this.setItem(this.settings);
  };

  private enableDisableSounds = () => {
    const settings = { ...this.variables.actualSettings };
    settings.sounds = !settings.sounds;
    this.setVariables({ actualSettings: settings });
    this.storage.sounds = settings.sounds;
    if (this.moneyClicker) {
      this.moneyClicker.audio = settings.sounds;
    }
  };

  get renderOverLay() {
    if (this.variables.loading !== 100) {
      const percentage = this.variables.loading;
      return (
        <MoneyClickerSettings>
          <div style={{ width: `${percentage}%`, height: '10px', bottom: '0', backgroundColor: 'white' }}></div>
        </MoneyClickerSettings>
      );
    }
    if (this.variables.paused) {
      if (this.variables.settings) {
        return (
          <MoneyClickerSettings>
            <MoneyClickerMenuButtons>
              <MenuButton onClick={this.enableDisableSounds}>
                {this.variables.actualSettings.sounds ? 'Sounds on' : 'Sounds off'}
              </MenuButton>
              <MenuButton onClick={this.enableDisableFullScreen}>
                {this.variables.actualSettings.fullscreen ? 'Fullscreen' : 'Window'}
              </MenuButton>
              <MenuButton onClick={this.resetData}>Reset Game</MenuButton>
              <MenuButton onClick={this.pauseMenu}>Back</MenuButton>
            </MoneyClickerMenuButtons>
          </MoneyClickerSettings>
        );
      }

      return (
        <MoneyClickerSettings>
          <MoneyClickerMenuButtons>
            <MenuButton onClick={this.resumeGame}>Resume</MenuButton>
            <MenuButton onClick={this.settings}>Settings</MenuButton>
            <MenuButton onClick={() => this.exit()}>Exit</MenuButton>
          </MoneyClickerMenuButtons>
        </MoneyClickerSettings>
      );
    }
  }

  renderInside() {
    return (
      <MoneyClickerWarper>
        {this.renderOverLay}
        <canvas ref={this.ref} style={{ height: `100%`, width: `100%` }}></canvas>
      </MoneyClickerWarper>
    );
  }
}
