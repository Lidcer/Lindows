import React from "react";
import {
  FileExplorer,
  FileExplorerButton,
  FileExplorerContent,
  FileExplorerLabel,
  FolderOrFile,
} from "./IDE-LideStyled";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFolder, faFile, faAngleDown, faAngleRight } from "@fortawesome/free-solid-svg-icons";
import { ContextMenu, IElement } from "../../components/ContextMenu/ContextMenu";
import { popup } from "../../components/Popup/popupRenderer";

export interface IExplorerFile {
  name: string;
  content: string;
  path: string;
}

export interface IExplorerFolder {
  name: string;
  contents: (IExplorerFolder | IExplorerFile)[];
  collapsed: boolean;
}

interface IDEFileExplorerState {
  content: JSX.Element | null;
}

interface IDEFileExplorerProps {
  onFileCreated: (file: IExplorerFile) => void;
  onFileDeleted: (file: IExplorerFile) => void;
  onFileRename: (oldFile: IExplorerFile, newFile: IExplorerFile) => void;
  onFileClick: (file: IExplorerFile) => void;
  fs?: IExplorerFolder;
  selected: IExplorerFile;
}

interface FileDirectoryList {
  name: string;
  folder: boolean;
  indentation: number;
  ref: IExplorerFolder | IExplorerFile;
}

export class IDEFileExplorer extends React.Component<IDEFileExplorerProps, IDEFileExplorerState> {
  private selected: IExplorerFile;
  private selectedFolder: IExplorerFolder;
  private originalName: string;
  private renaming: IExplorerFile | IExplorerFolder;
  constructor(props: IDEFileExplorerProps) {
    super(props);
    this.state = {
      content: null,
    };
  }

  componentDidMount() {
    this.refreshFolder();
    window.addEventListener("click", this.dismissRenaming);
    window.addEventListener("keyup", this.onKeyUp);
  }

  componentDidUpdate() {
    if (this.selected !== this.props.selected) {
      this.refreshFolder();
      this.selected = this.props.selected;
    }
  }

  componentWillUnmount() {
    window.removeEventListener("click", this.dismissRenaming);
    window.removeEventListener("keyup", this.onKeyUp);
  }

  dismissRenaming = () => {
    let file: IExplorerFile;
    if (this.renaming && !isFolder(this.renaming)) {
      file = this.renaming;
    }

    this.renaming = undefined;
    this.originalName = undefined;
    this.refreshFolder();
    if (file) {
      this.onFileClick(file);
    }
  };

  onKeyUp = (event: KeyboardEvent) => {
    if (event.key === "F2") {
      if (this.renaming) {
        this.dismissRenaming();
        return;
      }

      if (this.selectedFolder) {
        this.originalName = this.selectedFolder.name;
        this.renaming = this.selectedFolder;
      } else {
        this.originalName = this.selected.name;
        this.renaming = this.selected;
      }
      this.refreshFolder();
    }
    if (event.key === "Backspace" && this.renaming) {
      const name = this.renaming.name;
      this.renaming.name = name.slice(0, name.length - 1);
      this.refreshFolder();
    }
    if (event.key === "Escape" && this.renaming) {
      if (this.originalName) {
        this.renaming.name = this.originalName;
        this.dismissRenaming();
      }
    }
    if (event.key === "Enter" && this.renaming) {
      if (this.originalName) {
        this.dismissRenaming();
      }
    }

    if (this.renaming && event.key.length === 1) {
      this.renaming.name += event.key;
      this.refreshFolder();
    }
  };

  onFileClick = (file: IExplorerFile) => {
    this.selectedFolder = undefined;
    this.props.onFileClick(file);
  };

  refreshFolder() {
    const content = this.renderFolderContent(this.props.fs);
    this.setState({ content });
  }

  folderContains(folder: IExplorerFolder, file: IExplorerFile) {
    return !!folder.contents.find(f => f === file);
  }

  getFolderContent(list: FileDirectoryList[], obj: IExplorerFolder | IExplorerFile, indentation = -1): void {
    if (isFolder(obj)) {
      if (obj !== this.props.fs) {
        list.push({ name: obj.name, folder: true, ref: obj, indentation });
      }
      if (obj.collapsed) return;
      const contents = obj.contents.sort((a, b) => (a.name > b.name ? -1 : 1));
      for (const content of contents) {
        this.getFolderContent(list, content, indentation + 1);
      }
    } else {
      list.push({ name: obj.name, folder: false, ref: obj, indentation });
    }
  }

  deleteFile(file: IExplorerFile) {
    const folder = getFolder(file, this.props.fs);
    if (!folder) {
      this.props.onFileDeleted(file);
      return;
    }
    const index = folder.contents.indexOf(file);
    folder.contents.splice(index, 1);
    this.props.onFileDeleted(file);
  }

  onContextMenu(event: React.MouseEvent<HTMLDivElement, MouseEvent>, obj: IExplorerFile | IExplorerFolder) {
    event.preventDefault();

    const deleteFile = () => {
      if (isFolder(obj)) {
        const deleteFolder = (folder: IExplorerFolder) => {
          const contents = [...folder.contents];
          for (const content of contents) {
            if (isFolder(content)) {
              deleteFolder(content);
            } else {
              this.deleteFile(content);
            }
          }
        };
        deleteFolder(obj);
        const folder = getFolder(obj, this.props.fs);
        if (folder) {
          const index = folder.contents.indexOf(obj);
          folder.contents.splice(index, 1);
        }
      } else {
        this.deleteFile(obj);
      }
      this.refreshFolder();
    };
    const renameFile = () => {
      setTimeout(() => {
        this.originalName = obj.name;
        this.renaming = obj;

        this.refreshFolder();
      }, 500);
    };

    const elements: IElement[] = [
      { content: "Delete DEL", onClick: deleteFile },
      { content: "Rename F2", onClick: renameFile },
    ];
    const element = (
      <ContextMenu
        x={event.clientX}
        y={event.clientY}
        onAnyClick={() => {
          popup.remove(element);
        }}
        elements={elements}
      />
    );
    popup.add(element);
  }

  renderFolderContent = (folder: IExplorerFolder): JSX.Element => {
    const list: FileDirectoryList[] = [];
    this.getFolderContent(list, folder);
    const jsxList = list.map((e, i) => {
      const multiplayer = 5;
      const style: React.CSSProperties = { paddingLeft: `${e.indentation * multiplayer}px` };
      const renaming = this.renaming === e.ref;
      if (renaming) {
        style.border = `2px solid #2b303a`;
        style.backgroundColor = `#1e1e24`;
      }

      if (e.folder) {
        const file = e.ref as IExplorerFolder;
        const faArrow = file.collapsed ? faAngleRight : faAngleDown;
        const faAwesome = <FontAwesomeIcon icon={faArrow} />;
        const isSelected = this.selectedFolder === e.ref;
        if (isSelected && !renaming) {
          style.backgroundColor = `#00010a`;
        }
        return (
          <FolderOrFile
            style={style}
            onClick={() => this.collapseFolder(file)}
            onContextMenu={ev => this.onContextMenu(ev, e.ref)}
            key={i}
          >
            {faAwesome}
            {e.name}
          </FolderOrFile>
        );
      } else {
        const isSelected = !this.selectedFolder && e.ref === this.props.selected;
        if (isSelected && !renaming) {
          style.backgroundColor = `#00010a`;
        }
        return (
          <FolderOrFile
            style={style}
            onContextMenu={ev => this.onContextMenu(ev, e.ref)}
            onClick={() => this.onFileClick(e.ref as IExplorerFile)}
            key={i}
          >
            {e.name}
          </FolderOrFile>
        );
      }
    });
    return <>{jsxList}</>;
  };

  uniqNameGenerator(array: { name: string }[], name: string) {
    let newName = name;
    let iteration = 0;
    while (!!array.find(f => f.name === newName)) {
      newName = `${name} (${++iteration})`;
    }
    return newName;
  }

  createFile = () => {
    const folder = this.selectedFolder || getFolder(this.selected, this.props.fs);
    const name = this.uniqNameGenerator(folder.contents, "Untitled file");
    const file: IExplorerFile = { content: "", name, path: "/" };
    folder.contents.push(file);
    setTimeout(() => {
      this.renaming = file;
      this.originalName = name;
      this.refreshFolder();
    });
    this.props.onFileCreated(file);
  };

  createFolder = () => {
    const folder = this.selectedFolder || getFolder(this.selected, this.props.fs);
    const name = this.uniqNameGenerator(folder.contents, "Untitled folder");
    const f: IExplorerFolder = { contents: [], name, collapsed: false };
    folder.contents.push(f);
    setTimeout(() => {
      this.renaming = f;
      this.originalName = name;
      this.refreshFolder();
    });
  };

  collapseFolder = (folder: IExplorerFolder) => {
    this.selectedFolder = folder;
    folder.collapsed = !folder.collapsed;
    this.refreshFolder();
  };

  render() {
    return (
      <FileExplorer>
        <FileExplorerLabel>
          {this.props.fs.name}
          <FileExplorerButton onClick={this.createFile}>
            <FontAwesomeIcon icon={faFile} />
          </FileExplorerButton>
          <FileExplorerButton onClick={this.createFolder}>
            <FontAwesomeIcon icon={faFolder} />
          </FileExplorerButton>
        </FileExplorerLabel>
        <FileExplorerContent>{this.state.content}</FileExplorerContent>
      </FileExplorer>
    );
  }
}

export function getFolder(file: IExplorerFile | IExplorerFolder, root: IExplorerFolder): IExplorerFolder {
  const scanInFolder = (folder: IExplorerFolder) => {
    for (const content of folder.contents) {
      if (content === file) {
        return folder;
      }
      if (isFolder(content)) {
        const folder = scanInFolder(content);
        if (folder) return folder;
      }
    }
  };
  return scanInFolder(root);
}

export function isFolder(folder: IExplorerFolder | IExplorerFile): folder is IExplorerFolder {
  return !!(folder as IExplorerFolder).contents;
}
