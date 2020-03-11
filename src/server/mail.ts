import { MailService } from '@sendgrid/mail';
import { SENDGRIND_API_KEY } from './config';
import request from 'request';

const mailServer = new MailService();
let disabled = false;

export function setupMail() {
  if (SENDGRIND_API_KEY) mailServer.setApiKey(SENDGRIND_API_KEY);
  else {
    console.warn('sendgrid api has not been found mails are not going to be sent.');
    disabled = true;
  }
}

export function sendNewVerificationMail(email: string, verificationUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (disabled) return resolve();

    const text = `Please verify your new email on: ${verificationUrl}`;
    const html = `Please verify your new email on: <a>${verificationUrl}</a>`;

    sendMail(email, 'Verification code', text, html)
      .then(() => resolve())
      .catch(err => reject(err));
  });
}

export function sendNewPasswordResetMail(email: string, verificationUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (disabled) return resolve();

    const text = `Your password reset link is on: ${verificationUrl}`;
    const html = `Your password reset link is on: <a>${verificationUrl}</a>`;

    sendMail(email, 'Verification code', text, html)
      .then(() => resolve())
      .catch(err => reject(err));
  });
}

export function sendVerificationMail(email: string, verificationUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (disabled) {
      console.log(email);
      return resolve();
    }

    const text = `Please verify your account on: ${verificationUrl}`;
    const html = `Please verify your account on: <a>${verificationUrl}</a>`;

    sendMail(email, 'Verification code', text, html)
      .then(() => resolve())
      .catch(err => reject(err));
  });
}

export function sendMail(
  recipient: string,
  subject: string,
  text: string,
  html?: string,
): Promise<[request.Response, {}]> {
  return new Promise((resolve, reject) => {
    mailServer.send(
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
