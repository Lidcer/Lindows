import React from 'react';
import { TaskBar } from '../TaskBar/TaskBar';
import { Cursor } from '../Cursor/Cursor';
import { ContextMenu, IElement } from '../ContextMenu/ContextMenu';
import { SelectBox } from '../SelectBox/SelectBox';
import Axios from 'axios';
import { launchApp } from '../../essential/apps';
import { HotKeyHandler } from '../../essential/apphotkeys';
import { BlueScreen } from '../BlueScreen/BlueScreen';
import { services } from '../../services/SystemService/ServiceHandler';
import { Keypress } from '../../essential/constants/Keypress';
import { startBackgroundServices, backgroundServices } from '../../services/BackgroundService/ServicesHandler';
import { ActivationWatermark } from '../activationWatermark/activationWatermark';
import { popup } from '../Popup/popupRenderer';
import { NotificationsDisplay } from '../Notifications.tsx/NotificationsDisplay';
import { ScreenStyled, Wallpaper } from './DesktopStyled';

interface IState {
  ready: boolean;
  blueScreen: string;
  landscape: boolean;
  selectionBox: {
    shown: boolean;
    x: number;
    y: number;
  };
  wallpaper: {
    base64: string;
    width: number;
    height: number;
  };
}

const customWallpaper: string = '';

const wallpaperContextMenu: IElement[] = [
  { content: 'View', elements: [{ content: 'Large Icons' }, { content: 'Medium Icons' }, { content: 'Small Icons' }] },
  {
    content: 'Sort by',
    elements: [{ content: 'Name' }, { content: 'Size' }, { content: 'Item type' }, { content: 'Date modified' }],
  },
  { content: 'Refresh' },
  {},
  { content: 'Paste' },
  { content: 'LVidia Control Panel', iconOrPicture: './assets/images/livida.svg' },
  { content: 'New', elements: [{ content: 'Folder' }] },
  { content: 'Browser Settings', iconOrPicture: './assets/images/browserSettings.svg' },
  { content: 'Personalize', iconOrPicture: './assets/images/browserSettings.svg' },
];

export class Desktop extends React.Component<{}, IState> {
  private terminal: HotKeyHandler;
  private blueScreen: HotKeyHandler;
  private taskManager: HotKeyHandler;
  private killActiveWindow: HotKeyHandler;

  constructor(props) {
    super(props);
    this.state = {
      blueScreen: '',
      ready: services.ready,
      landscape: true,
      selectionBox: {
        shown: false,
        x: 0,
        y: 0,
      },
      wallpaper: {
        base64: '',
        height: 1080,
        width: 1920,
      },
    };
    window.onerror = message => {
      this.setState({ blueScreen: message.toString() });
    };
  }

  updateView = () => {
    console.log('update')
    // this.terminal.reset();
    this.blueScreen.reset();
    this.killActiveWindow.reset();
    this.setState({});
  };

  openTerminal = () => {
    launchApp('terminal');
  };

  showBlueScreen = () => {
    this.setState({ blueScreen: 'CRASHED_BY_USER' });
  };

  componentDidMount() {
    startBackgroundServices(true);
    const serviceReady = () => {
      this.setState({
        ready: true,
      });
      services.processor.on('appDisplayingAdd', this.updateView);
      services.processor.on('appRemove', this.updateView);

      backgroundServices().removeListener('ready', serviceReady);
    };
    if (!backgroundServices().ready) {
      backgroundServices().addListener('ready', serviceReady);
    } else serviceReady();

    this.terminal = new HotKeyHandler([Keypress.Control, Keypress.Alt, Keypress.T], true);
    this.terminal.on('combination', this.openTerminal);
    this.killActiveWindow = new HotKeyHandler([Keypress.Alt, Keypress.Four], true);
    this.killActiveWindow.on('combination', () => {
      const active = services.processor.processes.find(p => p.active);
      if (active) active.exit();
    });

    this.taskManager = new HotKeyHandler([Keypress.Control, Keypress.Alt, Keypress.D]);
    this.taskManager.on('combination', () => {
      launchApp('taskManager');
    });
    this.blueScreen = new HotKeyHandler([
      Keypress.ArrowUp,
      Keypress.ArrowUp,
      Keypress.ArrowDown,
      Keypress.ArrowDown,
      Keypress.ArrowLeft,
      Keypress.ArrowRight,
      Keypress.ArrowLeft,
      Keypress.ArrowRight,
      Keypress.B,
      Keypress.A,
    ]);
    this.blueScreen.on('combination', this.showBlueScreen);
    this.updateDimensions();
    window.addEventListener('resize', this.updateDimensions, false);

    if (!customWallpaper) return;
    Axios.get(customWallpaper, {
      responseType: 'arraybuffer',
    })
      .then(response => {
        // const base64 = `data:image/png;base64, ${Buffer.from(response.data, 'binary').toString('base64')}`;
        // const image = new Image();
        // image.src = base64;
        // image.onload = () => {
        //   const { height, width } = image;
        //   this.setState({ wallpaper: { base64, height, width } });
        //   this.updateDimensions();
        // };
      })
      .catch(err => {
        console.log(err);
      });
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.updateDimensions, false);
    this.terminal.destroy();
    this.killActiveWindow.destroy();
    this.blueScreen.destroy();
    services.processor.removeListener('appDisplayingAdd', this.updateView);
    services.processor.removeListener('appRemove', this.updateView);
  }
  updateDimensions = () => {
    //if (this.state.wallpaper) return;
    let landscape: boolean;
    const imageRatio = this.state.wallpaper.height / this.state.wallpaper.width;
    const windowRatio = window.innerHeight / window.innerWidth;
    if (imageRatio < windowRatio) {
      landscape = false;
    } else landscape = true;
    if (this.state.landscape !== landscape) {
      this.setState({ landscape });
    }
  };

  render() {
    if (this.state.blueScreen) return <BlueScreen errorCode={this.state.blueScreen}></BlueScreen>;
    if (!this.state.ready) return null;

    return (
      <div>
        <Cursor></Cursor>
        {this.processApps}
        {this.shouldShowSelectionBox()}
        <div></div>
        <ScreenStyled>{this.wallpaper()}</ScreenStyled>
        <TaskBar />
        <NotificationsDisplay />
        <ActivationWatermark />
      </div>
    );
  }

  get processApps() {
    return services.processor.runningApps.map((a, i) => {
      return a.app;
    });
  }

  shouldShowSelectionBox() {
    if (!this.state.selectionBox.shown) return null;
    const pos = this.state.selectionBox;
    return <SelectBox pos={{ x: pos.x, y: pos.y }}></SelectBox>;
  }

  wallpaper() {
    if (!this.state.wallpaper || !this.state.wallpaper.base64) {
      return (
        <Wallpaper
          style={this.wallpaperStyle}
          onMouseDown={this.onWallpaperMouseDown}
          onMouseUp={this.onWallpaperMouseUp}
          onContextMenu={this.wallpaperClick}
          src='./assets/images/bliss.svg'
          alt='bliss'
          draggable='false'
        />
      );
    }
    return (
      <Wallpaper
        style={this.wallpaperStyle}
        onContextMenu={this.wallpaperClick}
        src={this.state.wallpaper.base64}
        alt='bliss'
        draggable='false'
      />
    );
  }

  onWallpaperMouseDown = (event: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
    this.setState({
      selectionBox: {
        shown: true,
        x: event.clientX,
        y: event.clientY,
      },
    });
  };

  onWallpaperMouseUp = (event: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
    this.setState({
      selectionBox: {
        shown: false,
        x: 0,
        y: 0,
      },
    });
  };

  wallpaperClick = (event: React.MouseEvent<HTMLImageElement | HTMLDivElement, MouseEvent>) => {
    event.preventDefault();
    popup.add(
      <ContextMenu elements={wallpaperContextMenu} x={event.clientX} y={event.clientY}></ContextMenu>,
      false,
      true,
    );
  };

  get wallpaperStyle() {
    return this.state.landscape ? {width: '100%', height: 'auto' } : {width: 'auto', height: '100%' };
  }
}