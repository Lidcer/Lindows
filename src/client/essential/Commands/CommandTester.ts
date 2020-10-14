import { SECOND } from '../../../shared/constants';
import { BaseCommand, ExecutionParameters } from './BaseCommand';

export class CommandTester extends BaseCommand {
  public static help = 'time';
  private canWork = true;
  private listenToKeyboard = false;

  private resolve = (status: number) => {
    return status;
  };

  async execute(obj: ExecutionParameters) {
    if (obj.processor) {
      this.finish(`You cannot run this command under admin`);
      return 1;
    }

    if (this.args.map(e => e.toLocaleLowerCase()).includes('help')) {
      const helpMessage = [
        `Example '${this.args[0]} 5' will count 5 seconds`,
        `or '${this.args[0]} keyboard' will test keyboard`,
      ];
      this.finish(helpMessage.join('\n'));
      return 0;
    }

    if (this.hasArg('keyboard')) {
      this.listenToKeyboard = true;
      return new Promise<number>(resolve => (resolve = this.resolve));
    }

    const stringNumber = this.args[1];
    if (!stringNumber) {
      this.finish('You are using this command incorrectly!');
      return 1;
    }
    const number = parseInt(stringNumber);
    if (isNaN(number)) {
      this.finish('Number was expected provided something else?');
      return 1;
    }
    const history = this.hasArg('history') ? true : false;

    for (let i = 0; i < number; i++) {
      if (history) {
        this.addHistory(`Counting from ${number - i}`);
      } else {
        this.update(`Counting from ${number - i}`);
      }
      await new Promise(resolve => {
        setTimeout(() => {
          if (!this.canWork) {
            this.finish('And we are done');
            return 1;
          }
          resolve();
        }, SECOND);
      });
    }
    this.finish('Done');
    return 0;
  }
  sigKill() {
    this.canWork = false;
    this.resolve(1);
  }
  sigTerm() {
    this.canWork = false;
    this.resolve(1);
    return true;
  }

  sigInt(event: KeyboardEvent) {
    if (this.listenToKeyboard && this.canWork) {
      this.addHistory(event.key);
    }
  }
}
