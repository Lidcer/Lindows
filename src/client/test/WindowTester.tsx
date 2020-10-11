import React from 'react';
import { appConstructorGenerator, allApps } from '../essential/apps';
import { services } from '../services/SystemService/ServiceHandler';
import { BaseWindow, MessageBox, AdminPromp } from '../apps/BaseWindow/BaseWindow';
import { pushUniqToArray, removeFromArray } from '../utils/util';
interface IWindowTesterState {
  display: JSX.Element;
  subWindow: BaseWindow<{}>[];
}
interface IConsoleHistory {
  level: 'log' | 'warn' | 'error' | 'debug';
  message: any;
}

const consoleHistory: IConsoleHistory[] = [];
export class WindowTester extends React.Component<{}, IWindowTesterState> {
  private ready = false;
  constructor(props) {
    super(props);
    this.state = {
      display: <div>Loading</div>,
      subWindow: [],
    };

    const log = console.log;
    console.log = (...args: any[]) => {
      consoleHistory.push({ level: 'log', message: args });
      log.apply(window, args);
      if (this.ready) this.update();
    };

    const warn = console.warn;
    console.warn = (...args: any[]) => {
      consoleHistory.push({ level: 'warn', message: args });
      warn.apply(window, args);
      if (this.ready) this.update();
    };

    const debug = console.debug;
    console.debug = (...args: any[]) => {
      consoleHistory.push({ level: 'debug', message: args });
      debug.apply(window, args);
      if (this.ready) this.update();
    };

    const error = console.error;
    console.error = (...args: any[]) => {
      consoleHistory.push({ level: 'error', message: args });
      error.apply(window, args);
      if (this.ready) this.update();
    };
  }

  update = () => {
    setTimeout(() => {
      this.forceUpdate();
    });
  };

  disassembleConsoleMessage(m: any) {
    if (m === null) return <span>null</span>;

    const type = typeof m;
    switch (type) {
      case 'string':
      case 'number':
        return <span>{m}</span>;

      case 'function':
        return <span>{(m as Function).name}()</span>;
      case 'object':
        if (Array.isArray(m)) {
          return m.map((e, i) => {
            try {
              const msg = <span key={i}>{this.disassembleConsoleMessage(e) as JSX.Element}</span>;
              return msg;
            } catch (error) {
              return <span key={i}>{e.toString}</span>;
            }
          });
        } else {
          const entries = Object.entries(m);
          const divs = [];
          for (const [string, a] of entries) {
            divs.push(
              <span>
                {'{'}
                {string}:{this.disassembleConsoleMessage(a)}
                {'}'}
              </span>,
            );
          }
          return divs.map((d, i) => {
            return <div key={i}>{d}</div>;
          });
        }
      case 'symbol':
        return <span>symbol</span>;
      default:
        try {
          return <span>{type.toString()}</span>;
        } catch (error) {
          return <span>unprogrammed: {type}: </span>;
        }
    }
  }

  disassemble(c: IConsoleHistory) {
    switch (c.level) {
      case 'log':
      case 'debug':
        return <div>{this.disassembleConsoleMessage(c.message)}</div>;
      case 'warn':
        return <div className='text-warning'>{this.disassembleConsoleMessage(c.message)}</div>;
      case 'error':
        return <div className='text-danger'>{this.disassembleConsoleMessage(c.message)}</div>;
      default:
        return (
          <div>
            ?{c.level}?{this.disassembleConsoleMessage(c.message)}
          </div>
        );
    }
  }

  get consoleMessages() {
    return consoleHistory.map((c, i) => {
      return <div key={i}>{this.disassemble(c)}</div>;
    });
  }

  render() {
    return (
      <>
        {this.consoleMessages}
        {this.state.display} <div>{this.subProcesses}</div>
      </>
    );
  }

  componentDidMount() {
    this.ready = true;
    console.info(`Initalizing kernel...`);
    this.start();
  }

  componentWillUnmount() {
    this.ready = false;
  }

  start() {
    if ((window as any).app) {
      (window as any).apps = [];
    }
    if (!services.ready) {
      services.on('allReady', () => this.start());
      services.on('onServiceReady', e => console.info(`ok ${e}`));
      services.on('onServiceFailed', e => console.error(`nOk ${e}`));
      return;
    }
    services.processor.on('appAdd', e => {
      pushUniqToArray((window as any).apps, e);
      if (e.props.id === -1) return;
      const urlParams = new URLSearchParams(window.location.search);
      const override = urlParams.get('ignorenewwindows') !== null && e instanceof MessageBox && e instanceof AdminPromp;
      if (override) {
        const renderInside = e.renderInside.bind(this);

        e.renderInside = () => {
          return (
            <>
              <div
                style={{
                  position: 'absolute',
                  padding: '5pt',
                  textAlign: 'center',
                  backgroundColor: 'orange',
                  color: 'black',
                  borderBottomRightRadius: '5pt',
                  opacity: '0.75',
                }}
              >
                Running in test mode
              </div>
              {renderInside()}
            </>
          );
        };

        this.forceUpdate();
      }
    });

    services.processor.on('appDisplayingAdd', app => {
      this.forceUpdate();
    });
    services.processor.on('appRemove', app => {
      removeFromArray((window as any).apps, app);
      //this.forceUpdate();
    });

    const url = new URL(document.location.href);
    const pathname = url.pathname.split('/').filter(e => !!e);
    const appName = pathname[pathname.length - 1];
    const shouldBeApp = appConstructorGenerator(appName);
    if (!shouldBeApp) {
      location.href = `${origin}/test/`;
      return;
    }
    const state = { ...this.state };

    state.display = shouldBeApp(-1);
    this.setState(state);
  }

  get subProcesses() {
    if (!services.ready) return null;
    return services.processor.runningApps.map((a, i) => {
      return a.app;
    });
  }
}
