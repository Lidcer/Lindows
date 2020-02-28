import { MailService } from '@sendgrid/mail';
import { SENDGRIND_API_KEY } from './config';
import request from 'request';

const mailServer = new MailService();

export function setupMail() {
  if (SENDGRIND_API_KEY) mailServer.setApiKey(SENDGRIND_API_KEY);
  else console.warn('sendgrid api has not been found mails are not going to be sent.');
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
