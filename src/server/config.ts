import dotenv from 'dotenv';
import findUp from 'find-up';
import path from 'path';
import fs from 'fs';

const IS_DEV = process.env.NODE_ENV !== 'production';

if (IS_DEV) {
  dotenv.config({ path: findUp.sync('.env') });
}

const packageJsonPath = path.join(process.cwd(), 'package.json');
const rawPackageJson = fs.readFileSync(packageJsonPath).toString();
const PackageJson = JSON.parse(rawPackageJson);
const { version: VERSION } = PackageJson;

// server
const SERVER_PORT = process.env.PORT || 5500;
const WEBPACK_PORT = 8085; // For dev environment only
const PASSWORD_SALT = 'some_salt';
const DATABASE_CONNECTION_STRING = 'mongodb://localhost:27017/lindows';

if (PASSWORD_SALT === 'some_salt') {
  console.warn('You are using unsecured salt');
}

export { IS_DEV, VERSION, SERVER_PORT, WEBPACK_PORT, DATABASE_CONNECTION_STRING, PASSWORD_SALT };
