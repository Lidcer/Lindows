import { TerminalCommand } from '../TerminalCommand';

export abstract class BaseCommand {
  constructor(protected terminalCommand: TerminalCommand) { }

  public abstract onStart(): void;

  public abstract onTab(input: string): string[];

  public abstract interrupt();
}
