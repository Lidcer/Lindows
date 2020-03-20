import express from 'express';
import { listen } from 'socket.io';
import path from 'path';
import { apiRouter } from './routes/api-router';
import { pagesRouter } from './routes/pages-router';
import { staticsRouter } from './routes/statics-router';
import * as config from './config';
import { socketConnection } from './websocket/SocketHandler';
import { setupDatabase } from './database/database';
import { MailService, readHTML } from './routes/mail';

//sendgrid, mandrill, mailgun
console.info(`*******************************************`);
console.info(`NODE_ENV: ${process.env.NODE_ENV}`);
console.info(`config: ${JSON.stringify(config, null, 2)}`);
console.info(`*******************************************`);

const app = express();
app.set('view engine', 'ejs');

app.use('/assets', express.static(path.join(process.cwd(), 'assets')));
app.use(apiRouter());
app.use(staticsRouter());
app.use(pagesRouter());

const http = app.listen(config.SERVER_PORT, () => {
  console.log(`App listening on port ${config.SERVER_PORT}!`);
});

export const io = listen(http);

io.on('connection', s => {
  socketConnection(s);
});

export const mailService = new MailService(config.SENDGRIND_API_KEY);
setupDatabase();
