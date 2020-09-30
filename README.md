# What is Lindows
Lindows is fictitious operation system designed to run in modern web browsers.\
It has plan where you would be able to install and run custom apps on your own.\
Entire frontend structure uses extended React Library meaning coding lidnows apps should be very easy to do.\
Each window css is encapsulated with library styled-component meaning that css is not shared shared between then in any way. \
 
## Built-in Apps
Terminal - You can execute command with it. (WIP)\
Task Manager - get all info about open windows (WIP)\
Account manager - It allows you to create account.\
Lype - Communicating app. It allows you to chat with your friends. (WIP)\
Mouse properties - Lindows has its own unique built-in mouse. It does have a bit of latency due to all calculations. (WIP)\
Web Explorer - Web browser using iFrame. Can only load websites that do not send x-frame-options header. \
Virtual crate - It allows you to virtualize web browser operation system. Currently only lindows works(WIP).\
Group Viewer - App that allows you to share your in browser screen to someone you would like to have access to. Currently it is very slow and viewer cannot interact with shared screen (WIP)\

## System services
Processor service which I suppose it could be called kernel because it kinda does job on kernel level like adding displaying windows doing action like focus closing then and so on.\
Account service in order to active your lindows you need to create account which is free.
broadcaster service is service that handles communicating between browser tabs. The entire operation system is light wight making this thing possible.\
FingerPriner service is service which tells you all information about your system.\
Network service is service that connects you to the server websocket. \

## background services
Lype service which runs behind the lype app and it is always launched on start up\
Notification service is service that shows you notifications like form lype\

### How to develope a simple window app
```js
import React from 'react';
import { IManifest, BaseWindow, MessageBox } from '../BaseWindow/BaseWindow';


export class AnApp extends BaseWindow {
  public static manifest: IManifest = {
    fullAppName: 'An app',
    launchName: 'anapp',
    icon: '/assets/images/unknown-app.svg',
  };

  constructor(props) {
    super(
      props,
      {
        minHeight: 300,
        minWidth: 300,
      },
    );
  }

  renderInside() {
    return (
      <div>
        <h1>Hello World</h1>
      </div>
    );
  }
}
```

checkout `..src\client\apps\AnApp\AnApp.tsx` for full example

## How to run?

```bash
npm install
npm run dev
```

### Usage

- `npm run dev` - Client and server are in watch mode with source maps, opens [http://localhost:5050](http://localhost:5050)
- `npm run test` - Runs jest tests
- `npm run lint` - Runs es-lint
- `npm run build` - `dist` folder will include all the needed files, both client (Bundle) and server.
- `npm start` - Just runs `node ./dist/server/server.js`
- `npm start:prod` - sets `NODE_ENV` to `production` and then runs `node ./dist/server/server.js`. (Bypassing webpack proxy)
