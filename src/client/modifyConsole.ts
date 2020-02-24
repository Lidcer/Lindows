const log = console.log.bind(console);
const error = console.error.bind(console);
const warn = console.warn.bind(console);
const debug = console.debug.bind(console);
const info = console.info.bind(console);

log.call(console);

let modified = false;

export function modifyConsole() {
  if (modified) return;
  modified = true;

  console.log = (...optionalParams: any[]) => {
    log.apply(console, optionalParams);
  };

  console.error = (message?: any, ...optionalParams: any[]) => {
    error.apply(console, optionalParams);
  };

  console.warn = (message?: any, ...optionalParams: any[]) => {
    warn.apply(console, optionalParams);
  };

  console.debug = (message?: any, ...optionalParams: any[]) => {
    debug.apply(console, optionalParams);
  };

  console.info = (message?: any, ...optionalParams: any[]) => {
    info.apply(console, optionalParams);
  };
}
