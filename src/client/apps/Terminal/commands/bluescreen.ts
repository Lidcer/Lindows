import { BaseCommand } from './BaseCommand';
import { TerminalCommand } from '../TerminalCommand';
import { launchApp } from '../../../apps';

export const COMMANDS = ['raiseinternalexeption'];

export class Bluescreen extends BaseCommand {
  constructor(tr: TerminalCommand) {
    super(tr);
  }

  public onStart() {
    this.terminalCommand.content = 'killing...';
    this.terminalCommand.finish();
    throw 'Throwing';
  }
  public onTab(input: string) {
    return [];
  }
  public interrupt() {
    this.terminalCommand.finish();
  }
}
