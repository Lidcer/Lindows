import React from "react";
import { TaskBar } from "../TaskBar/TaskBar";
import { Cursor } from "../Cursor/Cursor";
import { IElement, showContext } from "../ContextMenu/ContextMenu";
import { SelectBox } from "../SelectBox/SelectBox";
import Axios from "axios";
import { launchApp } from "../../essential/apps";
import { HotKeyHandler } from "../../essential/apphotkeys";
import { BlueScreen } from "../BlueScreen/BlueScreen";
import { internal } from "../../services/internals/Internal";
import { Keypress } from "../../essential/constants/Keypress";
import { startBackgroundServices, backgroundServices } from "../../services/backgroundService/ServicesHandler";
import { ActivationWatermark } from "../activationWatermark/activationWatermark";
import { popup } from "../Popup/popupRenderer";
import { NotificationsDisplay } from "../Notifications.tsx/NotificationsDisplay";
import { ScreenStyled, Wallpaper } from "./DesktopStyled";
import { FileSystemDirectory, FileSystemFile, StringSymbol } from "../../utils/FileSystemDirectory";
import { DesktopIcons } from "./DesktopIcon";
import { MessageBox } from "../../apps/BaseWindow/BaseWindow";

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
  icons: JSX.Element;
}

const customWallpaper: string = "";

export class Desktop extends React.Component<{}, IState> {
  private wallpaperContextMenu: IElement[] = [
    {
      content: "View",
      elements: [{ content: "Large Icons" }, { content: "Medium Icons" }, { content: "Small Icons" }],
    },
    {
      content: "Sort by",
      elements: [{ content: "Name" }, { content: "Size" }, { content: "Item type" }, { content: "Date modified" }],
    },
    { content: "Refresh", onClick: () => this.refresh() },
    {},
    { content: "Paste" },
    { content: "LVidia Control Panel", iconOrPicture: "./assets/images/livida.svg" },
    {
      content: "New",
      elements: [
        { content: "Folder", onClick: e => this.createNewFolder(e) },
        { content: "File", onClick: e => this.createNewFile(e) },
      ],
    },
    { content: "Browser Settings", iconOrPicture: "./assets/images/browserSettings.svg" },
    { content: "Personalize", iconOrPicture: "./assets/images/browserSettings.svg" },
  ];

  private terminal: HotKeyHandler;
  private blueScreen: HotKeyHandler;
  private taskManager: HotKeyHandler;
  private killActiveWindow: HotKeyHandler;
  private newFile?: {
    x: number;
    y: number;
    file: FileSystemFile | FileSystemDirectory;
  };

  constructor(props) {
    super(props);
    this.state = {
      blueScreen: "",
      ready: internal.ready,
      landscape: true,
      selectionBox: {
        shown: false,
        x: 0,
        y: 0,
      },
      wallpaper: {
        base64: "",
        height: 1080,
        width: 1920,
      },
      icons: null,
    };
  }

  updateView = () => {
    // this.terminal.reset();
    if (DEV) {
      this.blueScreen.reset();
    }
    this.killActiveWindow.reset();
    this.forceUpdate();
  };

  showBlueScreen = () => {
    this.setState({ blueScreen: "CRASHED_BY_USER" });
  };

  componentDidMount() {
    startBackgroundServices(true);
    const serviceReady = () => {
      (alert as any) = (message: any) => {
        MessageBox._anonymousShow(message.toString(), "Alert");
      };
      this.setState({
        ready: true,
      });
      internal.system.processor.on("appDisplayingAdd", this.updateView);
      internal.system.processor.on("appRemove", this.updateView);

      backgroundServices().removeListener("ready", serviceReady);

      window.addEventListener("error", this.showError);
      this.refresh();
    };
    if (!backgroundServices().ready) {
      backgroundServices().addListener("ready", serviceReady);
    } else serviceReady();

    this.terminal = new HotKeyHandler([Keypress.Control, Keypress.Alt, Keypress.T], true);
    this.terminal.onCombination = () => launchApp("lterminal");
    this.killActiveWindow = new HotKeyHandler([Keypress.Alt, Keypress.Four], true);
    this.killActiveWindow.onCombination = () => {
      const active = internal.system.processor.processes.find(p => p.active);
      if (active) active.exit();
    };

    this.taskManager = new HotKeyHandler([Keypress.Control, Keypress.Alt, Keypress.D]);
    this.taskManager.onCombination = () => launchApp("taskmgr");
    if (DEV) {
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
      this.blueScreen.onCombination = this.showBlueScreen;
    }
    this.updateDimensions();
    window.addEventListener("resize", this.updateDimensions, false);

    if (!customWallpaper) return;
    Axios.get(customWallpaper, {
      responseType: "arraybuffer",
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
        //console.log(err);
      });
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateDimensions, false);
    window.removeEventListener("showError", this.showError);
    this.terminal.destroy();
    this.killActiveWindow.destroy();
    this.blueScreen.destroy();
    internal.system.processor.removeListener("appDisplayingAdd", this.updateView);
    internal.system.processor.removeListener("appRemove", this.updateView);
  }

  showError = (error: ErrorEvent) => {
    this.setState({ blueScreen: error.message.toString() });
  };

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

  createNewFolder = async (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const usr = internal.system.user.userSymbol;
    const userDirectory = internal.system.user.userDirectory;
    let desktop = userDirectory.getDirectory("Desktop", usr);
    if (!desktop) {
      desktop = await userDirectory.createDirectory("Desktop", usr);
    }

    const uniqueName = internal.fileSystem.getUniqueName(desktop, "New folder", internal.systemSymbol);
    internal.fileSystem.saveHome();
    const file = await desktop.createDirectory(uniqueName, new StringSymbol(internal.system.user.cleanUserName));
    this.newFile = {
      x: ev.clientX,
      y: ev.clientY,
      file,
    };
    this.refresh();
  };
  createNewFile = async (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const usr = internal.system.user.userSymbol;
    const userDirectory = internal.system.user.userDirectory;
    const desktop = userDirectory.getDirectory("Desktop", usr);
    const uniqueName = internal.fileSystem.getUniqueName(desktop, "New File", internal.systemSymbol);
    const file = await desktop.createFile(uniqueName, "text", "", new StringSymbol(internal.system.user.cleanUserName));
    this.newFile = {
      x: ev.clientX,
      y: ev.clientY,
      file,
    };
    internal.fileSystem.saveHome();
    this.refresh();
  };

  refresh = async () => {
    const sys = internal.systemSymbol;

    const userDirectory = internal.system.user.userDirectory;
    let desktop = userDirectory.getDirectory("Desktop", sys);
    if (!desktop) {
      desktop = await userDirectory.createDirectory("Desktop", internal.system.user.userSymbol);
    }
    const contents = desktop.contents(sys);
    const userSymbol = internal.system.user.userSymbol;
    const icons = (
      <DesktopIcons
        desktop={desktop}
        system={sys}
        contents={contents}
        newFile={this.newFile}
        userSymbol={userSymbol}
        onUpdate={this.refresh}
        selectionBox={this.state.selectionBox}
      />
    );
    this.newFile = undefined;
    this.setState({ icons });
  };

  get processApps() {
    return internal.system.processor.runningApps.map((a, i) => {
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
    event.preventDefault();
    this.setState({
      selectionBox: {
        shown: true,
        x: event.clientX,
        y: event.clientY,
      },
    });
    requestAnimationFrame(this.refresh);
  };

  onWallpaperMouseUp = (event: React.MouseEvent<HTMLImageElement, MouseEvent>) => {
    this.setState({
      selectionBox: {
        shown: false,
        x: 0,
        y: 0,
      },
    });
    requestAnimationFrame(this.refresh);
  };

  wallpaperClick = (event: React.MouseEvent<HTMLImageElement | HTMLDivElement, MouseEvent>) => {
    event.preventDefault();
    showContext(this.wallpaperContextMenu, event.clientX, event.clientY);
  };

  get wallpaperStyle() {
    return this.state.landscape ? { width: "100%", height: "auto" } : { width: "auto", height: "100%" };
  }

  render() {
    if (this.state.blueScreen) return <BlueScreen errorCode={this.state.blueScreen}></BlueScreen>;
    if (!this.state.ready) return null;

    return (
      <div>
        <Cursor></Cursor>
        {this.state.icons}
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
}
