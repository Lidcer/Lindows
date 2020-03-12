import { MailService as Ms } from '@sendgrid/mail';
import request from 'request';
import { MINUTE } from '../shared/constants';

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

  sendVerification(email: string, verificationUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isMailOnCoolDown(email)) return reject(new Error('Mail cool down plase wait a bit and try again'));
      if (this.disabled) return resolve();

      const text = `Please verify your new email on: ${verificationUrl}`;
      const html = `Please verify your new email on: <a>${verificationUrl}</a>`;

      this.sendMail(email, 'Verification code', text, html)
        .then(() => {
          this.addCoolDownToMail(email);
          console.log(`Mail has been sent ${email}`);
          resolve();
        })
        .catch(err => reject(err));
    });
  }

  sendNewVerification(email: string, verificationUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isMailOnCoolDown(email)) return reject(new Error('Mail cool down plase wait a bit and try again'));
      if (this.disabled) return resolve();

      const text = `Please verify your new email on: ${verificationUrl}`;
      const html = `Please verify your new email on: <a>${verificationUrl}</a>`;

      this.sendMail(email, 'Verification code', text, html)
        .then(() => {
          this.addCoolDownToMail(email);
          resolve();
        })
        .catch(err => reject(err));
    });
  }

  sendNewPasswordReset(email: string, verificationUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isMailOnCoolDown(email)) return reject(new Error('Mail cool down plase wait a bit and try again'));
      if (this.disabled) return resolve();

      const text = `Your password reset link is on: ${verificationUrl}`;
      const html = `Your password reset link is on: <a>${verificationUrl}</a>`;

      this.sendMail(email, 'Verification code', text, html)
        .then(() => resolve())
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
