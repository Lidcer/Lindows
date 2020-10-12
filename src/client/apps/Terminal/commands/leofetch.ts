import { BaseCommand } from './BaseCommand';
import { TerminalCommand } from '../TerminalCommand';
import { services } from '../../../services/SystemService/ServiceHandler';
import moment from 'moment';

export const COMMANDS = ['leofetch'];
const LIDCER_LOGO = [
  '                              (@@@@@@@@@@@@                    ',
  '                             (@@@@@@@@@@@@,                    ',
  '                            (@@@@@@@@@@@@@                     ',
  '        @@@@@@@@@@@@@@@@   @@@@@@@@@@@@@@   @@@@@@@@@@@        ',
  '      @@@@@@@@@@@@@@@@@   @@@@@@@@@@@@@@   @@@@@@@@@@@@@@      ',
  '   @@@@@@@@@@@@@@@@@@@   @@@@@@@@@@@@@@   @@@@@@@@@@@@@@@@@@   ',
  '   @@@@@@@@@@@@@@@@@@   @@@@@@@@@@@@@@   @@@@@@@@@@@@@@@@@@@   ',
  '   @@@@@@@@@@@@        @@@@@@@@@@@@@@         @@@@@@@@@@@@@@   ',
  '   @@@@@@@@@@@@       @@@@@@@@@@@@@@          @@@@@@@@@@@@@@   ',
  '   @@@@@@@@@@@@      @@@@@@@@@@@@@@           @@@@@@@@@@@@@@   ',
  '   @@@@@@@@@@@@     @@@@@@@@@@@@@@#           @@@@@@@@@@@@@@   ',
  '   @@@@@@@@@@@@    @@@@@@@@@@@@@@@            @@@@@@@@@@@@@@   ',
  '   @@@@@@@@@@@@                               @@@@@@@@@@@@@@   ',
  '   @@@@@@@@@@@@                               @@@@@@@@@@@@@@   ',
  '   @@@@@@@@@@                                 @@@@@@@@@@@@@@   ',
  '   @@@@@@@@                                   @@@@@@@@@@@@@@   ',
  '   @@@@@       @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@   ',
  '   @@@       @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@   ',
  '           @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@     ',
  '         @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@       ',
  '                                                               ',
];

export class Leofetch extends BaseCommand {
  constructor(tr: TerminalCommand) {
    super(tr);
  }

  public onStart() {
    //const COPY_LIDCER_LOGO = [...LIDCER_LOGO];
    const COPY_LIDCER_LOGO = ['', '', '', '', '', '', ''];
    const name = `${services.processor.deviceName}@${services.processor.username}`;
    if (this.terminalCommand.bounds.width < 700) {
      for (const i in COPY_LIDCER_LOGO) {
        const splitLine = Math.floor((this.terminalCommand.bounds.width / 700) * COPY_LIDCER_LOGO[i].length * 0.09);
        let line = COPY_LIDCER_LOGO[i].split('');
        line = line.filter((_, i) => {
          return (i + 1) % splitLine !== 0;
        });
        COPY_LIDCER_LOGO[i] = line.join('');
      }
    }
    COPY_LIDCER_LOGO[0] += `${name}`;
    COPY_LIDCER_LOGO[1] += '-'.repeat(name.length);
    //COPY_LIDCER_LOGO[2] += `Frontend: ${services.processor.frontend}`;
    //COPY_LIDCER_LOGO[3] += `Browser: ${services.processor.deviceInfo.getBrowser().name} v:${
    //  services.fingerprinter.userAgent.getBrowser().version}`;
    COPY_LIDCER_LOGO[4] += `OS: ${services.fingerprinter.userAgent.getOS().name} ${
      services.fingerprinter.userAgent.getOS().version
    } `;
    COPY_LIDCER_LOGO[5] += `Uptime: ${moment(services.processor.uptime)} `;
    this.terminalCommand.content = COPY_LIDCER_LOGO.join('\n');
    this.terminalCommand.finish();
  }
  public onTab(input: string) {
    return [];
  }
  public interrupt() {
    this.terminalCommand.finish();
  }
}
