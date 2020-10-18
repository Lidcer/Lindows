import { clamp } from 'lodash';
import React from 'react';
import { MessageBox, MessageBoxButtons, MessageBoxIcon } from '../../apps/BaseWindow/BaseWindow';
import { launchApp } from '../../essential/apps';
import { internal } from '../../services/SystemService/ServiceHandler';
import { FileSystemDirectory, FileSystemFile, isDirectory, StringSymbol } from '../../utils/FileSystemDirectory';
import { IElement, showContext } from '../ContextMenu/ContextMenu';
import { DesktopIconCation, DesktopIconRenamingInput, DesktopIconStyle } from './DesktopStyled';

interface IPropertyDesktopIcon {
  system: StringSymbol;
  userSymbol: StringSymbol;
  desktop: FileSystemDirectory;
  newFile: {
    x: number;
    y: number;
    file: FileSystemDirectory | FileSystemFile;
  };
  selectionBox: {
    x: number;
    y: number;
    shown: boolean;
  };
  onUpdate: () => void;
  contents: (FileSystemDirectory | FileSystemFile)[];
}

interface IStateDesktopIcon {
  selected: (FileSystemDirectory | FileSystemFile)[];
  renaming?: {
    value: string;
    ref: FileSystemDirectory | FileSystemFile;
  };
  moving?: {
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
    show: boolean;
    ref: FileSystemDirectory | FileSystemFile;
  };
}

interface IDotDesktop {
  [key: string]: {
    x: number;
    y: number;
  };
}

export class DesktopIcons extends React.Component<IPropertyDesktopIcon, IStateDesktopIcon> {
  private readonly folderImage = './assets/images/folderIcon.svg';
  private readonly fileImage = './assets/images/fileIcon.svg';

  private dotDesktop: IDotDesktop = {};
  private doNotUnselect = false;

  constructor(props) {
    super(props);
    this.state = {
      selected: [],
      renaming: undefined,
      moving: undefined,
    };
  }

  get desktop() {
    return this.props.desktop;
  }
  get sys() {
    return this.props.system;
  }
  get usr() {
    return this.props.userSymbol;
  }

  async componentDidMount() {
    let desktopDes = this.desktop.getFile('.desktop', this.sys);
    if (!desktopDes) {
      desktopDes = await this.props.desktop.createFile<IDotDesktop>('.desktop', 'json', {}, this.sys);
    } else {
      if (desktopDes.getType(this.sys) !== 'json') {
        desktopDes.deleteFile(this.sys);
        desktopDes = await this.desktop.createFile<IDotDesktop>('.desktop', 'json', {}, this.sys);
      }
    }
    this.dotDesktop = desktopDes.getContent(this.sys);
    this.forceUpdate();

    window.addEventListener('click', this.unselect);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('resize', this.onResize);
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.unselect);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('resize', this.onResize);
  }

  onResize = () => {
    this.forceUpdate();
  };

  saveDotDesktop = async () => {
    let desktopDes = this.desktop.getFile('.desktop', this.sys);
    if (!desktopDes) {
      desktopDes = await this.props.desktop.createFile<IDotDesktop>('.desktop', 'json', this.dotDesktop, this.sys);
    } else {
      if (desktopDes.getType(this.sys) !== 'json') {
        desktopDes.deleteFile(this.sys);
        desktopDes = await this.desktop.createFile<IDotDesktop>('.desktop', 'json', this.dotDesktop, this.sys);
      }
    }
    desktopDes.setContent(this.dotDesktop, this.sys);
    internal.fileSystem.saveHome();
  };

  unselect = () => {
    if (this.doNotUnselect) {
      this.doNotUnselect = false;
      return;
    }
    this.setState({ selected: [] });
  };

  get showHiddenFiles() {
    return false;
  }

  getStyle(file: FileSystemDirectory | FileSystemFile, overlay = false): React.CSSProperties {
    const cords = this.dotDesktop[file.name];
    const offset = 100;
    const x = clamp((cords && cords.x) || 0, 0, window.innerWidth - offset);
    const y = clamp((cords && cords.y) || 0, 0, window.innerHeight - offset);

    if (this.state.selected.includes(file)) {
      return {
        border: '1px solid white',
        backgroundColor: 'rgba(255, 255, 255, 0.50)',
        top: y,
        left: x,
      };
    } else if (!overlay && this.state.moving && this.state.moving.ref === file) {
      return {
        top: `${this.state.moving.y}px`,
        left: `${this.state.moving.x}px`,
      };
    }
    return {
      top: y,
      left: x,
    };
  }

  onClick = (events: React.MouseEvent<HTMLElement, MouseEvent>, selected: FileSystemDirectory | FileSystemFile) => {
    this.doNotUnselect = true;
    this.setState({ selected: [selected], moving: undefined });
  };

  onContext = (event: React.MouseEvent<HTMLElement, MouseEvent>, selected: FileSystemDirectory | FileSystemFile) => {
    this.doNotUnselect = true;
    event.preventDefault();
    const elements: IElement[] = [
      {
        content: 'Open',
        onClick: () => {
          if (isDirectory(selected)) {
            launchApp('file-explorer', `path="${selected.path}"`);
          } else if (selected.getType(this.sys) === 'lindowApp') {
            try {
              console.log(selected.getContent(this.sys));
              selected.getContent(this.sys).app.New(selected);
            } catch (error) {
              DEV && console.error(error);
              MessageBox._anonymousShow('Unable to open');
            }
          }
        },
      },
      {
        content: 'Delete',
        onClick: () => {
          try {
            if (isDirectory(selected)) {
              selected.deleteDirectory(this.sys);
            } else {
              selected.deleteFile(this.sys);
            }
            this.props.onUpdate();
            this.doNotUnselect = true;
          } catch (error) {
            MessageBox._anonymousShow(error.message, 'Cannot rename file', MessageBoxButtons.OK, MessageBoxIcon.Error);
          }
        },
      },
      {
        content: 'Rename',
        onClick: () => {
          this.setState({
            renaming: {
              ref: selected,
              value: selected.name,
            },
          });
        },
      },
      { content: 'Properties', onClick: () => {} },
    ];

    if (isDirectory(selected)) {
      showContext(elements, event.clientX, event.clientY);
    } else {
      showContext(elements, event.clientX, event.clientY);
    }
  };

  componentDidUpdate() {
    if (!this.state.renaming && this.props.newFile) {
      this.dotDesktop[this.props.newFile.file.name] = {
        x: this.props.newFile.x,
        y: this.props.newFile.y,
      };

      this.setState({
        renaming: {
          ref: this.props.newFile.file,
          value: this.props.newFile.file.name,
        },
      });
    }
  }

  onMouseDown = (event: React.MouseEvent<HTMLElement, MouseEvent>, selected: FileSystemDirectory | FileSystemFile) => {
    if (this.state.renaming) return;
    if (event.button !== 0) return;

    this.setState({
      moving: {
        x: event.clientX - event.nativeEvent.offsetX,
        y: event.clientY - event.nativeEvent.offsetY,
        offsetX: event.nativeEvent.offsetX,
        offsetY: event.nativeEvent.offsetY,
        show: false,
        ref: selected,
      },
    });
  };
  onMouseMove = (event: MouseEvent) => {
    if (this.state.moving) {
      this.setState({
        moving: {
          ...this.state.moving,
          x: event.clientX - this.state.moving.offsetX,
          y: event.clientY - this.state.moving.offsetY,
          show: true,
        },
      });
    }
    if (this.props.selectionBox.shown) {
      const minX = Math.min(this.props.selectionBox.x, event.clientX);
      const minY = Math.min(this.props.selectionBox.y, event.clientY);
      const maxX = Math.max(this.props.selectionBox.x + 75, event.clientX);
      const maxY = Math.max(this.props.selectionBox.y + 100, event.clientY);
      const files = this.props.contents.map(f => {
        return { name: f.name, ref: f };
      });
      const selected = [];
      for (const file of files) {
        const obj = this.dotDesktop[file.name];
        if (!obj) continue;
        if (obj.x > minX && obj.y > minY && obj.x < maxX && obj.y < maxY) {
          if (!selected.includes(file.ref)) {
            selected.push(file.ref);
          }
        }
      }
      this.setState({ selected });
    }
  };
  onMouseUp = (event: MouseEvent) => {
    if (this.state.moving) {
      this.dotDesktop[this.state.moving.ref.name] = {
        x: this.state.moving.x,
        y: this.state.moving.y,
      };
      this.saveDotDesktop();
      this.setState({ moving: undefined });
    }
  };

  getCaption(f: FileSystemDirectory | FileSystemFile) {
    if (this.state.renaming && this.state.renaming.ref === f) {
      const rename = () => {
        try {
          const orgName = f.name;
          if (this.state.renaming.value && this.state.renaming.value === orgName) {
            this.props.onUpdate();
            this.setState({ renaming: undefined });
            return;
          }
          if (this.state.renaming.value) {
            f.setName(this.state.renaming.value, this.usr);
          }
          this.dotDesktop[f.name] = this.dotDesktop[orgName];
          delete this.dotDesktop[orgName];
          this.saveDotDesktop();
        } catch (error) {
          MessageBox._anonymousShow(error.message, 'Cannot rename file', MessageBoxButtons.OK, MessageBoxIcon.Error);
        }

        this.props.onUpdate();
        this.setState({ renaming: undefined });
      };

      return (
        <DesktopIconRenamingInput
          ref={i => i && i.focus()}
          value={this.state.renaming.value}
          onChange={e => this.setState({ renaming: { ref: f, value: e.target.value } })}
          onKeyUp={e => {
            if (e.key.toLowerCase() === 'enter') rename();
          }}
          onBlur={() => {
            rename();
          }}
        />
      );
    }
    return <DesktopIconCation>{f.name}</DesktopIconCation>;
  }

  getElement(f: FileSystemDirectory | FileSystemFile, key?: number) {
    let image = <img src={this.fileImage} onMouseDown={ev => ev.preventDefault()} draggable='false' />;
    if (isDirectory(f)) {
      image = <img src={this.folderImage} onMouseDown={ev => ev.preventDefault()} draggable='false' />;
    }

    return (
      <DesktopIconStyle
        key={key}
        style={this.getStyle(f, key === undefined)}
        onContextMenu={e => key !== undefined && this.onContext(e, f)}
        onClick={e => key !== undefined && this.onClick(e, f)}
        onMouseDown={e => key !== undefined && this.onMouseDown(e, f)}
      >
        {image}
        {this.getCaption(f)}
      </DesktopIconStyle>
    );
  }

  render() {
    const moving = this.state.moving && this.state.moving.show ? this.getElement(this.state.moving.ref) : null;
    return (
      <>
        {moving}
        {this.props.contents
          .filter(f => !f.deleted && !(f.name.startsWith('.') && !this.showHiddenFiles))
          .map((f, i) => {
            return this.getElement(f, i);
          })}
      </>
    );
  }
}
