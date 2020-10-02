import { BaseWindow, IBaseWindowProps, IManifest } from '../BaseWindow/BaseWindow';
import { uniq } from 'lodash';
import React from 'react';
import './Terminal.scss';
import { onTerminalCommand, onTab } from './commands';
import { TerminalCommand } from './TerminalCommand';
import { services } from '../../services/SystemService/ServiceHandler';
//TODO: add html parser

interface ITerminal {
  beforeCursor: string;
  afterCursor: string;
  userName: string;
  deviceInfo: string;
  active: TerminalCommand;
  history: TerminalCommand[];
}

export const manifest: IManifest = {
  fullAppName: 'Terminal',
  launchName: 'lterminal',
  icon: '/assets/images/appsIcons/Terminal.svg',
};

function terminalName() {
  if (services.account.account) return services.account.account.username;
  return services.processor.userName;
}

function deviceInfo() {
  const browser = services.fingerprinter.userAgent.getBrowser();
  if (browser) return `${browser.name}${browser.version}`;
  return 'unknown';
}

export class Terminal extends BaseWindow<ITerminal> {
  public static manifest: IManifest = {
    fullAppName: 'Terminal',
    launchName: 'lterminal',
    icon: '/assets/images/appsIcons/Terminal.svg',
  };

  private currentTabSuggestion: string[] = [];
  constructor(props: IBaseWindowProps) {
    super(
      props,
      { width: 500, showIcon: true},
      {
        afterCursor: '',
        beforeCursor: '',
        deviceInfo: terminalName(),
        userName: deviceInfo(),
        active: undefined,
        history: [],
      },
    );
  }

  renderInside() {
    return (
      <div className='terminal'>
        {this.history()}
        {this.variables.active ? null : this.renderInputLine()}
      </div>
    );
  }

  history() {
    return this.variables.history.map((h, i) => (
      <div key={i} className='terminal-command-content'>
        {h.content}
      </div>
    ));
  }

  renderInputLine() {
    return <div className='terminal-line'>{this.renderContentInputLine()}</div>;
  }
  renderContentInputLine() {
    return (
      <>
        <span className='terminal-name'>
        {this.variables.userName}@{this.variables.deviceInfo}
        </span>
        <span>:</span>
        <span className='terminal-input'>{this.variables.beforeCursor}</span>
        <span className='terminal-blinking-cursor' hidden={!this.active}>
          |
        </span>
        <span className='terminal-input'>{this.variables.afterCursor}</span>
      </>
    );
  }

  renderContentEmpty(content: string) {
    return (
      <>
        <span className='terminal-name'>
          {this.variables.userName}@{this.variables.deviceInfo}
        </span>
        <span>:</span>
        <span className='terminal-input'>{content}</span>
      </>
    );
  }

  fullscreenMode = () => {
    const options = { ...this.state.options };
    if (options.windowType === 'fullscreen') {
      options.windowType = 'windowed';
    } else {
      options.windowType = 'fullscreen';
    }
    this.setState({
      options,
    });
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
          if(!entry) return;
          if (entry === 'clear' || entry === 'cls') {
            variables.beforeCursor = '';
            variables.afterCursor = '';
            variables.history = [];
            this.setVariables(variables);
            return;
          }

          const terminalCommand = new TerminalCommand(undefined, this.options, this.bounds);
          terminalCommand.content = this.renderContentEmpty(entry);
          terminalCommand.finish();
          variables.history.push(terminalCommand);
          variables.active = onTerminalCommand(this.options, this.bounds, entry, this);

          variables.history.push(variables.active);
          variables.active.onChange = () => {
            this.setVariables(variables);
          };

          variables.active.onFinish = () => {
            variables.active = undefined;
            this.setVariables(variables);
          };

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

  resize(width: number, height: number) {
    if (this.variables.active) {
      this.variables.active._bounds = this.bounds;
    }
  }
}
