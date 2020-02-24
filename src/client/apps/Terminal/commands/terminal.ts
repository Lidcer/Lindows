import { BaseCommand } from './BaseCommand';
import { TerminalCommand } from '../TerminalCommand';
import { launchApp } from '../../../apps';

export const COMMANDS = ['lterminal'];

export class Terminal extends BaseCommand {
  constructor(tr: TerminalCommand) {
    super(tr);
  }

  public onStart() {
    launchApp('terminal');

    this.terminalCommand.finish();
  }
  public onTab(input: string) {
    return [];
  }
  public interrupt() {
    this.terminalCommand.finish();
  }
}
