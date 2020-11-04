import fs from "fs";

export function readFile(path: string) {
  return new Promise<string>((resolve, reject) => {
    fs.readFile(path, "utf-8", (error, data) => {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}
export function writeFile(path: string, data: string) {
  return new Promise<void>((resolve, reject) => {
    fs.writeFile(path, data, "utf-8", error => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}
export function existFile(path: string) {
  return new Promise<boolean>(resolve => {
    fs.access(path, error => {
      if (error) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

export function mkdir(path: string) {
  return new Promise<void>((resolve, reject) => {
    fs.mkdir(path, error => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

export function unlink(path: string) {
  return new Promise<void>((resolve, reject) => {
    fs.unlink(path, err => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}
