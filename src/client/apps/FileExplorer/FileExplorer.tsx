import { IManifest, BaseWindow, MessageBox } from '../BaseWindow/BaseWindow';
import React from 'react';

import {
  FileExploreBottom,
  FileExplorerContent,
  FileExplorerContents,
  FileExplorerFileOrDirectory,
  FileExplorerList,
  FileExplorerUrlBar,
  FileExplorerWarper,
} from './FileExplorerStyled';
import { services } from '../../services/SystemService/ServiceHandler';
import {
  everyone,
  FileSystemContent,
  FileSystemDirectory,
  FileSystemFile,
  FileSystemPermissions,
  isDirectory,
  sanitizeName,
  StringSymbol,
} from '../../utils/FileSystemDirectory';
import { IElement, showContext } from '../../components/ContextMenu/ContextMenu';

interface IFileExplorerState {
  path: string;
  directory: FileSystemDirectory;
  renaming: undefined | { structure: FileSystemContent; value: string };
}

export class FileExplorer extends BaseWindow<IFileExplorerState> {
  private readonly folderImage = './assets/images/folderIcon.svg';
  private readonly fileImage = './assets/images/fileIcon.svg';
  private folderPermission = everyone;
  public static manifest: IManifest = {
    fullAppName: 'File Explorer',
    launchName: 'file-explorer',
    icon: '/assets/images/appsIcons/FileExplorerIcon.svg',
  };

  constructor(props) {
    super(
      props,
      {
        minHeight: 240,
        minWidth: 150,
        width: 400,
        height: 300,
      },
      {
        path: '',
        directory: services.fileSystem.home,
        renaming: undefined,
      },
    );
  }

  onKeyUp(ev: KeyboardEvent) {
    if (!this.state.variables.renaming) return;
    if (ev.key.toLowerCase() === 'enter') {
      const dir = this.state.variables.renaming.structure;
      const newName = this.state.variables.renaming.value;
      if (newName !== dir.name) {
        try {
          dir.setName(newName, this.folderPermission);
        } catch (error) {
          MessageBox._anonymousShow(`Unable to rename this folder: ${error.message}`);
        }
      }
      this.setVariables({ renaming: undefined });
    } else if (ev.key.toLowerCase() === 'escape') {
      this.setVariables({ renaming: undefined });
    }

    console.log(ev);
  }

  private parseDirectory(path: string): FileSystemDirectory | null {
    path = path.replace(/\\/g, '/');
    const folders = path.split('/');
    let currentScanner = services.fileSystem.root;
    for (const folderName of folders) {
      if (currentScanner.name === folderName) {
        continue;
      } else {
        const contents = currentScanner.contents(services.processor.symbol);
        const find = contents.find(f => f.name === folderName);
        if (find && isDirectory(find)) {
          currentScanner = find;
        } else {
          return null;
        }
      }
    }
    try {
      currentScanner.contents(this.folderPermission);
      return currentScanner;
    } catch (error) {
      /* ignored */
    }
    return currentScanner;
  }

  async shown() {
    if (!this.hasLaunchFlag('permissioneveryone')) {
      if (this.hasLaunchFlag('admin')) {
        const processor = this.getProcessor();
        if (!processor) {
          const result = await this.requestAdmin();
          if (!result) {
            await MessageBox.Show(this, 'Unable to obtain admin permission', 'Failed');
            this.exit();
            return;
          }
          this.folderPermission = this.getProcessor().symbol;
        }
      } else if (services.processor.username) {
        this.folderPermission = new StringSymbol(sanitizeName(services.processor.username));
      }
    }
    const path = this.launchFlags.path;
    if (path) {
      const directory = this.parseDirectory(path);
      if (directory) {
        this.setVariables({ directory });
      }
    } else {
      const directory = this.parseDirectory(
        `${services.fileSystem.home.path}/${sanitizeName(services.processor.username)}`,
      );
      if (directory) {
        this.setVariables({ directory });
      }
    }
  }

  get renderFileExplorer() {
    if (this.state.width < 200) return null;

    return <FileExplorerList></FileExplorerList>;
  }
  get folderContent() {
    let contents: FileSystemContent[];
    try {
      contents = this.variables.directory.contents(this.folderPermission);
    } catch (error) {
      return <div> {error.message} </div>;
    }
    return contents.map((c, i) => {
      const folderSize = 15;
      let image = (
        <img
          src={this.fileImage}
          onMouseDown={e => e.preventDefault()}
          width={folderSize}
          height={folderSize}
          draggable='false'
        />
      );
      if (isDirectory(c)) {
        image = (
          <img
            src={this.folderImage}
            onMouseDown={e => e.preventDefault()}
            width={folderSize}
            height={folderSize}
            draggable='false'
          />
        );
      }
      const onContext = (ev: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        ev.preventDefault();

        const elements: IElement[] = [];
        elements.push({
          content: 'Open',
          onClick: () => {
            if (isDirectory(c)) {
              const directory = this.parseDirectory(c.path);
              if (directory) {
                this.setVariables({ directory });
              }
            }
            this.forceUpdate();
          },
        });
        if (
          c.getPermission(this.folderPermission) === FileSystemPermissions.WriteOnly ||
          c.getPermission(this.folderPermission) === FileSystemPermissions.ReadAndWrite
        ) {
          elements.push({
            content: 'Rename',
            onClick: () => {
              this.setVariables({ renaming: { structure: c, value: c.name } });
            },
          });
        }
        if (
          c.getPermission(this.folderPermission) === FileSystemPermissions.WriteOnly ||
          c.getPermission(this.folderPermission) === FileSystemPermissions.ReadAndWrite
        ) {
          elements.push({
            content: 'Delete',
            onClick: () => {
              if (isDirectory(c)) {
                c.deleteDirectory(this.folderPermission);
              } else {
                c.deleteFile(this.folderPermission);
              }
              this.forceUpdate();
            },
          });
        }

        elements.push({ content: 'Properties', onClick: () => {} });

        showContext(elements, ev.clientX, ev.clientY);
      };

      let name = <span> {c.name} </span>;
      if (this.variables.renaming && this.variables.renaming.structure === c) {
        name = (
          <input
            onChange={ev => {
              this.variables.renaming.value = ev.target.value;
              this.forceUpdate();
            }}
            value={this.variables.renaming.value}
          ></input>
        );
      }

      return (
        <FileExplorerFileOrDirectory onContextMenu={onContext} key={i}>
          {image}
          {name}

          {services.fileSystem.size(c)}
        </FileExplorerFileOrDirectory>
      );
    });
  }

  createNewDirectory = () => {
    const newName = services.fileSystem.getUniqueName(
      this.variables.directory,
      'New folder',
      services.processor.symbol,
    );
    this.variables.directory.createDirectory(newName, this.folderPermission);
    this.forceUpdate();
  };

  createNewFile = () => {
    const newName = services.fileSystem.getUniqueName(this.variables.directory, 'New File', services.processor.symbol);
    this.variables.directory.createFile(newName, 'text', '', this.folderPermission);
    this.forceUpdate();
  };

  onContextMenu = (cm: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    cm.preventDefault();
    showContext(
      [
        {
          content: 'Refresh',
          onClick: () => {
            this.forceUpdate();
          },
        },
        {
          content: 'new',
          elements: [
            {
              content: 'Folder',
              onClick: () => {
                this.createNewDirectory();
              },
            },
            {
              content: 'File',
              onClick: () => {
                this.createNewFile();
              },
            },
          ],
        },
        { content: 'Properties' },
      ],
      cm.clientX,
      cm.clientY,
    );
  };

  renderInside() {
    return (
      <FileExplorerWarper>
        <FileExplorerUrlBar>{this.variables.directory.path}</FileExplorerUrlBar>
        <FileExplorerContent>
          {this.renderFileExplorer}
          <FileExplorerContents onContextMenu={this.onContextMenu}>{this.folderContent}</FileExplorerContents>
        </FileExplorerContent>
        <FileExploreBottom></FileExploreBottom>
      </FileExplorerWarper>
    );
  }
}
