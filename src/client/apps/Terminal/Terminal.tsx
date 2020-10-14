import { BaseWindow, IBaseWindowProps, IManifest, MessageBox } from '../BaseWindow/BaseWindow';
import { uniq } from 'lodash';
import React from 'react';
import { internal } from '../../services/SystemService/ServiceHandler';
import {
  TerminalBlinkingCursor,
  TerminalCommandContent,
  TerminalContent,
  TerminalInput,
  TerminalLine,
  TerminalName,
  TerminalStyled,
} from './TerminalStyled';
import { CommandForExecute, getCommand } from '../../essential/Commands/CommandHandler';
import { BaseCommand, ExecutionParameters } from '../../essential/Commands/BaseCommand';
import {
  FileSystemDirectory,
  FileSystemFile,
  isDirectory,
  sanitizeName,
  StringSymbol,
} from '../../utils/FileSystemDirectory';
//TODO: add html parser

interface ITerminal {
  beforeCursor: string;
  afterCursor: string;
  userName: string;
  deviceInfo: string;
  active: BaseCommand | undefined;
  history: JSX.Element[];
  current: string;
  directory: FileSystemDirectory;
}

interface OutputInFile {
  append?: boolean;
  fileName?: string;
  command: string;
}

function terminalName() {
  if (internal.account.account) return internal.account.account.username;
  return internal.processor.username;
}

function deviceInfo() {
  const browser = internal.fingerprinter.userAgent.getBrowser();
  if (browser && (browser.name || browser.version)) return `${browser.name || ''}${browser.version || ''}`;
  return 'unknown';
}

export class Terminal extends BaseWindow<ITerminal> {
  public static manifest: IManifest = {
    fullAppName: 'Terminal',
    launchName: 'lterminal',
    icon: '/assets/images/appsIcons/Terminal.svg',
  };
  private lastUsedSuggestion = '';
  folderPermission: import('c:/Users/Alpha/Desktop/dev/Lindows/src/client/utils/FileSystemDirectory').StringSymbol;
  constructor(props: IBaseWindowProps) {
    super(
      props,
      { width: 500, showIcon: true },
      {
        afterCursor: '',
        beforeCursor: '',
        deviceInfo: terminalName(),
        userName: deviceInfo(),
        active: undefined,
        history: [],
        current: undefined,
        directory: internal.fileSystem.home,
      },
    );
  }
  async shown() {
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
    } else if (internal.processor.username) {
      this.folderPermission = new StringSymbol(sanitizeName(internal.processor.username));
    }
    const path = this.launchFlags.path;
    if (path) {
      const directory = this.parseDirectory(path);
      if (directory) {
        this.setVariables({ directory });
      }
    } else {
      const directory = internal.fileSystem.userDirectory;
      if (directory) {
        this.setVariables({ directory });
      }
    }
  }
  private parseDirectory(path: string) {
    try {
      const directory = internal.fileSystem.parseDirectory(path, this.folderPermission);
      return directory;
    } catch (error) {
      /* ignored */
    }
    return null;
  }

  private get userDirectoryPath() {
    return `${internal.fileSystem.home.path}/${sanitizeName(internal.processor.username)}`;
  }

  history() {
    return this.variables.history.map((h, i) => <TerminalCommandContent key={i}>{h}</TerminalCommandContent>);
  }

  renderInputLine(noCursor = false) {
    return <TerminalLine>{this.renderContentInputLine(noCursor)}</TerminalLine>;
  }
  private get getPath() {
    const path = this.variables.directory.path;
    if (path.startsWith(internal.fileSystem.userDirectory.path)) {
      const h = path.slice(internal.fileSystem.userDirectory.path.length);
      return `~${h ? h : ''}`;
    }
    if (path.startsWith('root/')) {
      return path.slice(5);
    }
    return this.variables.directory.path;
  }
  get dollarOrHash() {
    return this.getProcessor() ? '#' : '$';
  }

  renderContentInputLine(noCursor = false) {
    return (
      <>
        <TerminalName>
          {this.variables.userName}@{this.variables.deviceInfo}
        </TerminalName>
        <span>:</span>
        <span>{this.getPath}</span>
        <span>{this.dollarOrHash}</span>
        <TerminalInput>{this.variables.beforeCursor}</TerminalInput>
        {noCursor ? null : <TerminalBlinkingCursor hidden={!this.active}>|</TerminalBlinkingCursor>}
        <TerminalInput>{this.variables.afterCursor}</TerminalInput>
      </>
    );
  }

  onExit() {
    if (this.variables.active) {
      this.variables.active.signalKill('Terminal closed');
    }
  }

  fullscreenMode = () => {
    if (this.options.windowType === 'fullscreen') {
      this.changeOptions({ windowType: 'windowed' });
    } else {
      this.changeOptions({ windowType: 'fullscreen' });
    }
  };

  onKeyDown = (event: KeyboardEvent) => {
    const variables = { ...this.variables };
    if (this.variables.active) {
      this.variables.active.signalInput(event);
    }
    if (event.ctrlKey && event.key.toLowerCase() === 'c' && variables.active) {
      return variables.active.signalTerminate('^C');
    }
    if (event.key.length <= 1) {
      if (event.key === ' ') this.lastUsedSuggestion = '';
      variables.beforeCursor = `${variables.beforeCursor}${event.key}`;
    } else
      switch (event.key) {
        case 'Enter':
          const entry = `${variables.beforeCursor}${variables.afterCursor}`;
          if (!entry) return;
          if (entry === 'clear' || entry === 'cls') {
            variables.beforeCursor = '';
            variables.afterCursor = '';
            variables.history = [];
            this.setVariables(variables);
            return;
          }
          const commands = entry.split('&&');
          const validCommands = commands.map(c => {
            c = c.trim();
            const pipes = c.split('||').map(c => c.trim());
            pipes.shift();

            const executablePipes: CommandForExecute[] = [];

            for (const pipe of pipes) {
              const cmd = pipe.split(' ')[0];
              executablePipes.push({
                entry: pipe,
                command: cmd,
                object: getCommand(cmd),
              });
            }

            const cmd = c.split(' ')[0];
            const executable: CommandForExecute = {
              entry: c,
              command: cmd,
              object: getCommand(cmd),
              pipes: executablePipes,
            };
            return executable;
          }) as CommandForExecute[];
          const notValidCommand = validCommands.find(c => c.object === null);
          const notValidPipe = validCommands.find(c => c.pipes.find(p => p.object === null));
          if (notValidCommand) {
            variables.history.push(this.renderInputLine(true));
            variables.history.push(this.parseString(`${notValidCommand.command}: command not found`));
          } else if (notValidPipe) {
            const invalidPipe = notValidPipe.pipes.find(p => p.object === null);
            variables.history.push(this.renderInputLine(true));
            variables.history.push(this.parseString(`${invalidPipe.command}: command not found`));
          } else {
            this.executeCommands(validCommands as Required<CommandForExecute>[]);
          }

          variables.beforeCursor = '';
          variables.afterCursor = '';
          break;
        case 'Backspace':
          if (variables.beforeCursor.length > 0) variables.beforeCursor = variables.beforeCursor.slice(0, -1);
          break;
        case 'Delete':
          if (variables.afterCursor.length > 0) variables.afterCursor = variables.afterCursor.slice(1);
          break;
        case 'ArrowLeft':
          if (variables.beforeCursor.length !== 0) {
            const newBeforeCursor = variables.beforeCursor.split('');
            const addCharacter = newBeforeCursor.pop();
            variables.afterCursor = `${addCharacter}${variables.afterCursor}`;
            variables.beforeCursor = newBeforeCursor.join('');
          }
          break;
        case 'Tab':
          event.preventDefault();
          const entry2 = variables.beforeCursor;
          const typedCommand = entry2.split('&&').map(m => m.trim());
          const command = typedCommand[typedCommand.length - 1].split('||').map(m => m.trim());
          const cmd = command[0].split(' ')[0].trim();
          const commandObject = getCommand(cmd);
          const argIndex = command.length - 1;
          const typing = command[argIndex].split(' ');
          if (commandObject) {
            const c = new commandObject(cmd);
            if (c.suggest) {
              const arg = typing[typing.length - 1];
              const result = c.suggest(cmd, typing.length, arg, this.variables.directory);
              if (result.length) {
                let index = result.indexOf(this.lastUsedSuggestion);
                const newResult = result[++index % result.length];
                this.lastUsedSuggestion = newResult;
                if (newResult) {
                  if (arg === cmd) {
                    const newEntry = `${entry2}${newResult}`;
                    variables.beforeCursor = newEntry;
                  } else {
                    const newEntry = `${entry2.slice(0, -arg.length)}${newResult}`;
                    variables.beforeCursor = newEntry;
                  }
                }
              }
            }
            c._destructor();
          }

          break;
        case 'ArrowRight':
          if (variables.afterCursor.length !== 0) {
            const newAfterCursor = variables.afterCursor.split('');
            const addCharacter = newAfterCursor.shift();
            variables.beforeCursor = `${variables.beforeCursor}${addCharacter}`;
            variables.afterCursor = newAfterCursor.join('');
          }
          break;
        default:
          // console.log(event.key);
          break;
      }

    this.setVariables(variables);
  };

  private outputInFile(commandEntry: string): OutputInFile {
    const appendFileArrow = '>>';
    const overwriteArrow = '>';
    const appendFile = commandEntry.split(appendFileArrow)[1];
    const newFile = commandEntry.split(overwriteArrow)[1];
    if (appendFile) {
      commandEntry = commandEntry.split(appendFileArrow)[0];

      return {
        append: true,
        fileName: appendFile.trim(),
        command: commandEntry,
      };
    } else if (newFile) {
      commandEntry = commandEntry.split(overwriteArrow)[0];
      return {
        append: false,
        fileName: newFile.trim(),
        command: commandEntry,
      };
    }
    return { command: commandEntry };
  }

  private executeCommands(commands: Required<CommandForExecute>[]) {
    const command = commands.shift();
    let result = -1;
    const variables = { ...this.variables };
    variables.beforeCursor = '';
    variables.afterCursor = '';
    const cmd = this.outputInFile(command.entry);

    try {
      variables.active = new command.object(cmd.command);
    } catch (error) {
      variables.history.push(this.renderInputLine(true));
      variables.history.push(
        this.parseString(`An error occurred while trying to execute this command! ${error.message}`),
      );
      this.setVariables(variables);
      return;
    }
    const rect = this.getBoundingRect();
    const object: ExecutionParameters = {
      directory: this.variables.directory,
      height: rect.height,
      width: rect.width,
      processor: this.getProcessor(),
    };

    variables.history.push(this.renderInputLine(true));
    this.setVariables(variables);
    variables.active.addHistory = text => {
      if (!text && this.variables.current) {
        variables.history.push(this.parseString(this.variables.current));
      } else if (text) {
        variables.history.push(this.parseString(text));
      } else {
        variables.history.push(this.parseString(''));
      }
      variables.current = undefined;
      this.setVariables(variables);
    };
    variables.active.update = text => {
      variables.current = text;
      this.setVariables(variables);
    };
    variables.active.finish = text => {
      setTimeout(() => {
        if (object && object.directory && isDirectory(object.directory)) {
          variables.directory = object.directory;
        }
        let textToPush = '';
        if (!text && this.variables.current) {
          textToPush = this.variables.current;
        } else if (text) {
          textToPush = text;
        }
        variables.current = undefined;
        variables.active.finish = null;
        variables.active.addHistory = null;
        variables.active.update = null;
        variables.active._destructor();
        variables.active = undefined;
        let wroteFile = false;
        const writeFile = (cmd: OutputInFile): boolean => {
          if (cmd.fileName) {
            try {
              let file: FileSystemFile;
              if (cmd.append) {
                const files = variables.directory.contents(this.folderPermission);
                file = files.find(c => !isDirectory(c) && c.name === cmd.fileName) as FileSystemFile;
              }
              if (file) {
                const content = file.getContent(this.folderPermission);
                file.setContent(`${content}\n${textToPush}`);
              } else {
                variables.directory.createFile(cmd.fileName, 'text', textToPush, this.folderPermission);
              }
              wroteFile = true;
            } catch (error) {
              variables.history.push(error.message);
              this.setVariables(variables);
              return false;
            }
          }
          return true;
        };
        if (!writeFile(cmd)) return;

        while (command.pipes.length) {
          const pipe = command.pipes.shift();
          const pcmd = this.outputInFile(pipe.entry);

          textToPush = new pipe.object(pcmd.command, textToPush).pipe(object);
          if (!writeFile(pcmd)) return;
        }
        if (!wroteFile) {
          variables.history.push(this.parseString(textToPush || ''));
        }
        this.setVariables(variables);
        if (commands.length && result === 0) {
          return this.executeCommands(commands);
        }
      });
    };
    (async () => {
      try {
        result = await variables.active.execute(object);
      } catch (error) {
        if (!this.destroyed) {
          variables.history.push(
            this.parseString(`An error occurred while trying to execute this command! ${error.message}`),
          );
        }
      }
    })();
    this.setVariables(variables);
    return;
  }

  private parseString(text: string) {
    return <span>{text}</span>;
  }
  private get renderCommandContent() {
    if (this.variables.active && this.variables.current) {
      return this.parseString(this.variables.current);
    }
    return this.variables.current;
  }

  onResize(width: number, height: number) {
    if (this.variables.active) {
      //   this.variables.active._bounds = this.bounds;
    }
  }

  renderInside() {
    return (
      <TerminalStyled>
        <TerminalContent>
          {this.history()}
          {this.variables.active ? this.renderCommandContent : this.renderInputLine()}
        </TerminalContent>
      </TerminalStyled>
    );
  }
}
