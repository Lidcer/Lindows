import { MailService as Ms } from '@sendgrid/mail';
import request from 'request';
import { MINUTE } from '../../shared/constants';
import { join } from 'path';
import { readFile } from 'fs';
import { logger } from '../database/EventLog';

const SUPPORT_EMAIL = 'somethingsometing';

export interface IMailAccountInfo {
  id: string;
  username: string;
  verificationURL: string;
  ip: string;
  reason: string;
}

export class MailService {
  private mailCooldowns = new Map<string, NodeJS.Timeout>();
  private mailServer = new Ms();
  private disabled = false;
  private MAIL_COOL_DOWN = MINUTE * 10;

  constructor(SENDGRIND_API_KEY: string) {
    if (SENDGRIND_API_KEY) this.mailServer.setApiKey(SENDGRIND_API_KEY);
    else {
      console.warn('sendgrid api has not been found mails are not going to be sent.');
      this.disabled = true;
    }
  }

  sendVerification(email: string, accountInfo: IMailAccountInfo): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (this.isMailOnCoolDown(email)) return reject(new Error('Mail cool down please wait a bit and try again'));
      if (this.disabled) return resolve();

      const text = `Please verify your new email on: ${accountInfo.verificationURL}`;
      let html: string;
      try {
        html = await readHTML('emailVerification', accountInfo);
      } catch (error) {
        logger.error(error, 'Unable to read template file');
      }
      this.sendMail(email, 'Verification code', text, html)
        .then(() => {
          this.addCoolDownToMail(email);
          logger.log(`Mail has been sent ${email}`);
          logger.log(JSON.stringify(accountInfo, undefined, 1));
          resolve();
        })
        .catch(err => reject(err));
    });
  }

  sendNewVerification(email: string, accountInfo: IMailAccountInfo): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (this.isMailOnCoolDown(email)) return reject(new Error('Mail cool down please wait a bit and try again'));
      if (this.disabled) return resolve();

      const text = `Please verify your new email on: ${accountInfo.verificationURL}`;
      let html: string;
      try {
        html = await readHTML('newEmailVerification', accountInfo);
      } catch (error) {
        logger.error(error, 'Unable to read template file');
      }

      this.sendMail(email, 'Verification code', text, html)
        .then(() => {
          this.addCoolDownToMail(email);
          resolve();
        })
        .catch(err => reject(err));
    });
  }

  sendNewPasswordReset(email: string, accountInfo: IMailAccountInfo): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (this.isMailOnCoolDown(email)) return reject(new Error('Mail cool down please wait a bit and try again'));
      if (this.disabled) return resolve();

      const text = `Your password reset link is on: ${accountInfo.verificationURL}`;
      let html: string;
      try {
        html = await readHTML('passwordReset', accountInfo);
      } catch (error) {
        logger.error(error, 'Unable to read template file');
      }

      this.sendMail(email, 'Verification code', text, html)
        .then(() => resolve())
        .catch(err => reject(err));
    });
  }

  informAboutAccountDeletion(email: string, accountInfo: IMailAccountInfo): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (this.isMailOnCoolDown(email)) return reject(new Error('Mail cool down please wait a bit and try again'));
      if (this.disabled) return resolve();

      const text = `Your account has been deleted`;
      let html: string;
      try {
        html = await readHTML('deletedAccount', accountInfo);
      } catch (error) {
        logger.error(error, 'Unable to read template file');
      }

      this.sendMail(email, 'Verification code', text, html)
        .then(() => {
          this.addCoolDownToMail(email);
          resolve();
        })
        .catch(err => reject(err));
    });
  }

  informAboutBannedAccount(email: string, accountInfo: IMailAccountInfo): Promise<void> {
    return new Promise(async (resolve, reject) => {
      if (this.isMailOnCoolDown(email)) return reject(new Error('Mail cool down please wait a bit and try again'));
      if (this.disabled) return resolve();

      const text = `Your account has been banned`;
      let html: string;
      try {
        html = await readHTML('accountBanned', accountInfo);
      } catch (error) {
        logger.error(error, 'Unable to read template file');
      }

      this.sendMail(email, 'Verification code', text, html)
        .then(() => {
          this.addCoolDownToMail(email);
          resolve();
        })
        .catch(err => reject(err));
    });
  }
  private sendMail(recipient: string, subject: string, text: string, html?: string): Promise<[request.Response, {}]> {
    return new Promise((resolve, reject) => {
      this.mailServer.send(
        {
          from: 'noreply@lidcer.com',
          to: recipient,
          text,
          subject,
          html,
        },
        false,
        (err, response) => {
          if (err) {
            return reject(err);
          }
          resolve(response);
        },
      );
    });
  }

  isMailOnCoolDown(email: string): boolean {
    return !!this.mailCooldowns.get(email);
  }

  addCoolDownToMail(email: string) {
    this.removeMailFromCoolDown(email);
    const timeoutFun = setTimeout(() => {
      this.removeMailFromCoolDown(email);
    }, this.MAIL_COOL_DOWN);
    this.mailCooldowns.set(email, timeoutFun);
  }

  removeMailFromCoolDown(email: string): boolean {
    const timeoutFunction = this.mailCooldowns.get(email);
    if (timeoutFunction) {
      clearTimeout(timeoutFunction);
      this.mailCooldowns.delete(email);
      return true;
    }
    return false;
  }
}

export function readHTML(documentName: string, accountInfo: IMailAccountInfo): Promise<string> {
  return new Promise((resole, reject) => {
    const readPath = join(process.cwd(), 'emailTemplates', `${documentName}.html`);
    readFile(readPath, 'utf8', (err, data) => {
      if (err) return reject(err);
      data = data
        .replace(/\${url}/g, accountInfo.verificationURL)
        .replace(/\${id}/g, accountInfo.id)
        .replace(/\${username}/g, accountInfo.username)
        .replace(/\${ip}/g, accountInfo.ip)
        .replace(/\${reason}/g, accountInfo.reason)
        .replace(/\${supportEmail}/g, SUPPORT_EMAIL);

      resole(data);
    });
  });
}
