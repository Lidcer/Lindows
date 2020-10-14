import { SECOND } from '../../../../dist/shared/constants';
import { BaseCommand, ExecutionParameters } from './BaseCommand';

export class TestDelayCommand extends BaseCommand {
  public static help = 'time';

  async execute(parameters: ExecutionParameters) {
    if (parameters.processor) {
      return this.onFinish(`You cannot run this command under admin`);
    }

    if (this.args.map(e => e.toLocaleLowerCase()).includes('help')) {
      return this.onFinish(`Example '${this.args[0]} 5' will count 5 seconds`);
    }

    const stringNumber = this.args[1];
    if (!stringNumber) {
      return this.onFinish('You are using this command incorrectly!');
    }
    const number = parseInt(stringNumber);
    if (isNaN(number)) {
      return this.onFinish('Number was expected provided something else?');
    }

    for (let i = 0; i < number; i++) {
      this.onStatusUpdate(`Counting from ${number - i}`);
      await new Promise(resolve => {
        setTimeout(() => {
          resolve();
        }, SECOND);
      });
    }
    return this.onFinish('Done');
  }
}
