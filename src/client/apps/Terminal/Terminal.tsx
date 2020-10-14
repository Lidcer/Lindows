import { BaseWindow, IBaseWindowProps, IManifest, MessageBox } from '../BaseWindow/BaseWindow';
import { uniq } from 'lodash';
import React from 'react';
import { onTerminalCommand, onTab } from './commands';
import { TerminalCommand } from './TerminalCommand';
import { services } from '../../services/SystemService/ServiceHandler';
import {
  TerminalBlinkingCursor,
  TerminalCommandContent,
  TerminalContent,
  TerminalInput,
  TerminalLine,
  TerminalName,
  TerminalStyled,
} from './TerminalStyled';
import { getCommand } from '../../essential/Commands/CommandHandler';
import { BaseCommand, ExecutionParameters } from '../../essential/Commands/BaseCommand';
import { FileSystemDirectory, isDirectory, sanitizeName, StringSymbol } from '../../utils/FileSystemDirectory';
//TODO: add html parser

interface ITerminal {
  beforeCursor: string;
  afterCursor: string;
  userName: string;
  deviceInfo: string;
  active: BaseCommand | undefined;
  history: JSX.Element[];
  directory: FileSystemDirectory;
}

function terminalName() {
  if (services.account.account) return services.account.account.username;
  return services.processor.username;
}

function deviceInfo() {
  const browser = services.fingerprinter.userAgent.getBrowser();
  if (browser && (browser.name || browser.version)) return `${browser.name || ''}${browser.version || ''}`;
  return 'unknown';
}

export class Terminal extends BaseWindow<ITerminal> {
  public static manifest: IManifest = {
    fullAppName: 'Terminal',
    launchName: 'lterminal',
    icon: '/assets/images/appsIcons/Terminal.svg',
  };

  private currentTabSuggestion: string[] = [];
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
        directory: services.fileSystem.home,
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
    } else if (services.processor.username) {
      this.folderPermission = new StringSymbol(sanitizeName(services.processor.username));
    }
    const path = this.launchFlags.path;
    if (path) {
      const directory = this.parseDirectory(path);
      if (directory) {
        this.setVariables({ directory });
      }
    } else {
      const directory = services.fileSystem.userDirectory;
      if (directory) {
        this.setVariables({ directory });
      }
    }
  }
  private parseDirectory(path: string) {
    try {
      const directory = services.fileSystem.parseDirectory(path, this.folderPermission);
      return directory;
    } catch (error) { /* ignored */ }
    return null;
  }

  private get userDirectoryPath() {
    return `${services.fileSystem.home.path}/${sanitizeName(services.processor.username)}`;
  }

  history() {
    return this.variables.history.map((h, i) => <TerminalCommandContent key={i}>{h}</TerminalCommandContent>);
  }

  renderInputLine(noCursor = false) {
    return <TerminalLine>{this.renderContentInputLine(noCursor)}</TerminalLine>;
  }
  private get getPath() {
    if (services.fileSystem.userDirectory.path === this.variables.directory.path) {
      return '~';
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

  fullscreenMode = () => {
    if (this.options.windowType === 'fullscreen') {
      this.changeOptions({ windowType: 'windowed' });
    } else {
      this.changeOptions({ windowType: 'fullscreen' });
    }
  };

  onKeyDown = (event: KeyboardEvent) => {
    const variables = { ...this.variables };
    if (event.key.length <= 1) {
      if (event.key === ' ') this.currentTabSuggestion = [];
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
          const cmd = entry.split(' ')[0];
          const Command = getCommand(cmd);
          if (!Command) {
            variables.history.push(this.renderInputLine(true));
            variables.history.push(this.parseString(`${cmd}: command not found`));
            this.setVariables(variables);
          } else {
            variables.beforeCursor = '';
            variables.afterCursor = '';
            try {
              variables.active = new Command(entry);
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
            variables.active.onStatusUpdate = text => {
              variables.history.push(this.parseString(text));
              this.setVariables(variables);
            };
            variables.active.onFinish = text => {
              if (object && object.directory && isDirectory(object.directory)) {
                variables.directory = object.directory;
              }

              variables.history.push(this.parseString(text));
              variables.active.onFinish = null;
              variables.active.onStatusUpdate = null;
              variables.active = undefined;
              this.setVariables(variables);
            };
            (async () => {
              try {
                await variables.active.execute(object);
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
          const args = entry2.split(' ');
          if (!this.currentTabSuggestion.length) {
            const lastArgs = args[args.length - 1];
            if (args.length > 1) {
              this.currentTabSuggestion = uniq(
                onTab(entry2)
                  .map(e => e.toLowerCase())
                  .filter(e => e.startsWith(lastArgs)),
              );
            }
            if (this.currentTabSuggestion[0]) {
              const autoCorrect = this.currentTabSuggestion[0].slice(lastArgs.length);
              variables.beforeCursor = `${variables.beforeCursor}${autoCorrect}`;
            }
            break;
          }

          if (args.length > 1) {
            const lastArgs = args[args.length - 1];
            const indexOf = this.currentTabSuggestion.indexOf(lastArgs);
            if (indexOf !== -1) {
              let newSuggestion = this.currentTabSuggestion[indexOf + 1];
              if (!newSuggestion) newSuggestion = this.currentTabSuggestion[0];
              if (newSuggestion) {
                variables.beforeCursor = `${entry2.slice(0, -lastArgs.length)}${newSuggestion}`;
              }
            }
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

  private parseString(text: string) {
    return <span>{text}</span>;
  }

  onResize(width: number, height: number) {
    if (this.variables.active) {
      this.variables.active._bounds = this.bounds;
    }
  }

  renderInside() {
    return (
      <TerminalStyled>
        <TerminalContent>
          {this.history()}
          {this.variables.active ? null : this.renderInputLine()}
        </TerminalContent>
      </TerminalStyled>
    );
  }
}
