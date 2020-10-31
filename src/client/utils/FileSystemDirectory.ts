import { escapeRegExp } from 'lodash';
import { sizeof } from 'sizeof';
import { cloneDeep } from '../../shared/utils';

type Permission = Map<number, FileSystemPermissions>;

export interface DirectoryData {
  name: string;
  permission: Permission;
  contents: (FileSystemDirectory | FileSystemFile)[];
}
export interface FileData<T = string> {
  name: string;
  permission: Permission;
  content: T;
  type: 'text' | 'unknown' | 'json' | 'lindowObject' | 'lindowApp';
}
export enum FileSystemPermissions {
  None,
  ReadOnly,
  WriteOnly,
  ReadAndWrite,
}

function getHash(text: string) {
  let hash = 0;
  let chr: number;
  for (let i = 0; i < text.length; i++) {
    chr = text.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return hash;
}

const verificationSymbol = Symbol();

const hashMap = new WeakMap<StringSymbol, number>();
export class StringSymbol {
  constructor(text: string) {
    if (typeof text !== 'string') throw new Error(`Expected string got ${typeof text}!`);
    if (text === 'root') throw new Error('You cannot generate root symbol');
    if (text === 'everyone') throw new Error('You cannot generate everyone symbol');
    hashMap.set(this, getHash(text));
  }

  getHash(symbol: symbol) {
    if (symbol !== verificationSymbol) throw new Error('Invalid symbol!');
    return hashMap.get(this);
  }

  equals(stringSymbol: StringSymbol) {
    const hash = hashMap.get(this);
    const hash2 = hashMap.get(stringSymbol);
    return hash === hash2;
  }
  toString() {
    return '[Object StringSymbol]';
  }
}

const systemSymbol = new StringSymbol('_');
export const everyone = new StringSymbol('_');
const rootHash = getHash('root');
const everyoneHash = getHash('everyone');
systemSymbol.getHash = symbol => {
  if (symbol !== verificationSymbol) throw new Error('Invalid symbol!');
  return rootHash;
};

everyone.getHash = symbol => {
  if (symbol !== verificationSymbol) throw new Error('Invalid symbol!');
  return everyoneHash;
};

type OnChange = () => Promise<void>;

export type FileSystemContent = FileSystemDirectory | FileSystemFile<any>;
const directoriesMap = new WeakMap<FileSystemDirectory, DirectoryData>();
const upperPath = new WeakMap<FileSystemContent, FileSystemDirectory>();
const rootMap = new WeakMap<FileSystemContent, OnChange>();

export class FileSystemDirectory {
  constructor(name: string, owner = everyone, onChange: OnChange) {
    const result = isValidName(name);
    if (!result.valid) throw new Error(result.reason);
    const directoryData: DirectoryData = {
      name,
      contents: [],
      permission: new Map(),
    };
    directoryData.permission.set(owner.getHash(verificationSymbol), FileSystemPermissions.ReadAndWrite);
    directoryData.permission.set(systemSymbol.getHash(verificationSymbol), FileSystemPermissions.ReadAndWrite);
    directoriesMap.set(this, directoryData);
    rootMap.set(this, onChange);
  }

  async createDirectory(name: string, owner = everyone) {
    const directory = directoriesMap.get(this);
    if (!directory) throw new Error('Directory has been deleted!');
    const permission = directory.permission.get(owner.getHash(verificationSymbol));
    if (_canModifyFileOrDirectory(permission)) {
      const result = isValidName(name);
      if (!result.valid) throw new Error(result.reason);
      const sameName = !!directory.contents.find(d => d.name === name);
      if (sameName) {
        throw new Error('Duplicate name!');
      }
      const onChange = rootMap.get(this);
      if (!onChange) {
        throw new Error('Missing root folder!');
      }
      const newDirectory = new FileSystemDirectory(name, owner, onChange);
      upperPath.set(newDirectory, this);
      directory.contents.push(newDirectory);
      try {
        await onChange();
      } catch (error) {
        upperPath.delete(newDirectory);
        directoriesMap.delete(newDirectory);
        rootMap.delete(newDirectory);
        const index = directory.contents.indexOf(newDirectory);
        if (index !== -1) {
          directory.contents.splice(index, 1);
        }
        throw error;
      }
      return newDirectory;
    }
    throw new Error('You do not have permission to edit this folder!');
  }

  async createFile<C = any>(name: string, type: FileData['type'], content: C, owner = everyone) {
    const directory = directoriesMap.get(this);
    if (!directory) throw new Error('Directory has been deleted!');
    const permission = directory.permission.get(owner.getHash(verificationSymbol));

    if (_canModifyFileOrDirectory(permission)) {
      const result = isValidName(name);
      if (!result.valid) throw new Error(result.reason);
      const sameName = !!directory.contents.find(d => d.name === name);
      if (sameName) {
        throw new Error('Duplicate name!');
      }
      const onChange = rootMap.get(this);
      if (!onChange) {
        throw new Error('Missing root folder!');
      }
      const file = new FileSystemFile(name, type, content, this, onChange, owner);
      directory.contents.push(file);
      try {
        await onChange();
      } catch (error) {
        rootMap.delete(file);
        directoryLink.delete(file);
        const index = directory.contents.indexOf(file);
        if (index !== -1) {
          directory.contents.splice(index, 1);
        }
        throw error;
      }
      return file;
    }
    throw new Error('You do not have permission to edit this folder!');
  }

  get name() {
    const data = directoriesMap.get(this);
    if (!data) throw new Error('Directory has been deleted!');
    return data.name;
  }

  setName(name: string, owner = everyone) {
    const directory = directoriesMap.get(this);
    if (!directory) throw new Error('Directory has been deleted!');
    const permission = directory.permission.get(owner.getHash(verificationSymbol));
    if (_canModifyFileOrDirectory(permission)) {
      const result = isValidName(name);
      if (!result.valid) throw new Error(result.reason);
      const upper = directoriesMap.get(upperPath.get(this));
      const sameNameFolder = !!upper.contents.find(d => d.name === name);
      if (sameNameFolder) {
        throw new Error('Duplicate name!');
      }
      directory.name = name;
      return;
    }
    throw new Error('You don not have permission to rename this directory!');
  }

  async deleteDirectory(owner = everyone, recursive = false) {
    const data = directoriesMap.get(this);
    if (!data) throw new Error('Directory has been deleted!');
    const permission = data.permission.get(owner.getHash(verificationSymbol));
    const onChange = rootMap.get(this);
    if (!onChange) {
      throw new Error('Missing root folder!');
    }

    if (_canModifyFileOrDirectory(permission)) {
      const upper = upperPath.get(this);

      if (upper.contents.length) {
        throw new Error('Directory is not empty!');
      }
      const directoriesMapBackup = directoriesMap.get(this);
      const rootMapBackup = rootMap.get(this);
      const upperPathBackup = upperPath.get(this);
      directoriesMap.delete(this);
      rootMap.delete(this);
      upperPath.delete(this);
      try {
        await onChange();
      } catch (error) {
        directoriesMap.set(this, directoriesMapBackup);
        rootMap.set(this, rootMapBackup);
        upperPath.set(this, upperPathBackup);
        throw error;
      }
      return;
    }

    throw new Error('You do not have permission to delete this directory!');
  }

  contents(owner = everyone) {
    const directory = directoriesMap.get(this);
    if (!directory) throw new Error('Directory has been deleted!');
    const permission = directory.permission.get(owner.getHash(verificationSymbol));
    if (_canReadFileOrDirectory(permission)) {
      return directory.contents;
    }
    throw new Error('Missing permission to read');
  }
  getFile<T = any>(name: string, owner = everyone): FileSystemFile<T> | null {
    const directory = directoriesMap.get(this);
    if (!directory) throw new Error('Directory has been deleted!');
    const permission = directory.permission.get(owner.getHash(verificationSymbol));
    if (_canReadFileOrDirectory(permission)) {
      return (directory.contents.find(n => !isDirectory(n) && n.name === name) as FileSystemFile<T>) || null;
    }
    throw new Error('Missing permission to read');
  }

  getDirectory(name: string, owner = everyone): FileSystemDirectory | null {
    const directory = directoriesMap.get(this);
    if (!directory) throw new Error('Directory has been deleted!');
    const permission = directory.permission.get(owner.getHash(verificationSymbol));
    if (_canReadFileOrDirectory(permission)) {
      return (directory.contents.find(n => isDirectory(n) && n.name === name) as FileSystemDirectory) || null;
    }
    throw new Error('Missing permission to read');
  }

  get deleted() {
    return !directoriesMap.get(this);
  }

  get path() {
    const directory = directoriesMap.get(this);
    if (!directory) throw new Error('Directory has been deleted!');
    const path = [];
    let target = this as FileSystemDirectory;

    while (target) {
      path.push(target.name);
      target = upperPath.get(target);
    }

    return path.reverse().join('/');
  }

  setPermissionFor(owner = everyone, target: StringSymbol, permission: FileSystemPermissions) {
    if (owner.getHash(verificationSymbol) === target.getHash(verificationSymbol))
      throw new Error('Cannot set permission to same target');
    const directory = directoriesMap.get(this);
    if (!directory) throw new Error('Directory has been deleted!');
    const directoryPermission = directory.permission.get(owner.getHash(verificationSymbol));
    if (_canModifyFileOrDirectory(directoryPermission)) {
      directory.permission.set(target.getHash(verificationSymbol), permission);
      return;
    }
    throw new Error('You don not have permission to set permission to this directory!');
  }

  setPermission(owner = everyone, permission: FileSystemPermissions) {
    const directory = directoriesMap.get(this);
    if (!directory) throw new Error('Directory has been deleted!');
    const directoryPermission = directory.permission.get(owner.getHash(verificationSymbol));
    if (_canModifyFileOrDirectory(directoryPermission)) {
      directory.permission.set(owner.getHash(verificationSymbol), permission);
      return;
    }
    throw new Error('You don not have permission to set permission to this directory!');
  }

  getPermission(owner = everyone) {
    const data = directoriesMap.get(this);
    if (!data) throw new Error('Directory has been deleted!');
    return data.permission.get(owner.getHash(verificationSymbol)) || FileSystemPermissions.None;
  }
  get size() {
    const directory = directoriesMap.get(this);
    if (!directory) throw new Error('Directory has been deleted!');
    let size = 0;
    for (const content of directory.contents) {
      size += content.size;
    }
    return size;
  }
}

const files = new WeakMap<FileSystemFile<any>, FileData<any>>();
const directoryLink = new WeakMap<FileSystemFile, FileSystemDirectory>();
export class FileSystemFile<C = any> {
  constructor(
    name: string,
    type: FileData['type'],
    content: C,
    fileSystemDirectory: FileSystemDirectory,
    onChange: OnChange,
    owner = everyone,
  ) {
    const fileData: FileData<C> = {
      name,
      type,
      content,
      permission: new Map(),
    };
    fileData.permission.set(owner.getHash(verificationSymbol), FileSystemPermissions.ReadAndWrite);
    fileData.permission.set(systemSymbol.getHash(verificationSymbol), FileSystemPermissions.ReadAndWrite);
    files.set(this, fileData);
    directoryLink.set(this, fileSystemDirectory);
    rootMap.set(this, onChange);
  }

  getContent<CC = C>(owner = everyone): CC {
    const file = files.get(this);
    if (!file) throw new Error('File has been deleted!');
    const permission = file.permission.get(owner.getHash(verificationSymbol));
    if (_canReadFileOrDirectory(permission)) {
      if (file.type === 'json') {
        return cloneDeep(file.content);
      }
      return file.content;
    }
    throw new Error('Missing permission to read');
  }

  setContent<CC = C>(content: CC, owner = everyone) {
    const file = files.get(this);
    if (!file) throw new Error('File has been deleted!');
    const permission = file.permission.get(owner.getHash(verificationSymbol));
    if (_canModifyFileOrDirectory(permission)) {
      if (file.type === 'json') {
        try {
          JSON.stringify(content);
        } catch (error) {
          throw new Error('Given file is not a json!');
        }
      }
      file.content = content;
      return;
    }
    throw new Error('Missing permission to read');
  }

  getType(owner = everyone) {
    const file = files.get(this);
    if (!file) throw new Error('File has been deleted!');
    const permission = file.permission.get(owner.getHash(verificationSymbol));
    if (_canModifyFileOrDirectory(permission)) {
      return file.type;
    }
    throw new Error('Missing permission to read');
  }

  setType(type: FileData['type'], owner = everyone) {
    const file = files.get(this);
    if (!file) throw new Error('File has been deleted!');
    const permission = file.permission.get(owner.getHash(verificationSymbol));
    if (_canModifyFileOrDirectory(permission)) {
      file.type = type;
      return;
    }
    throw new Error('Missing permission to read');
  }

  async deleteFile(owner = everyone) {
    const file = files.get(this);
    if (!file) throw new Error('File has already been deleted!');
    const permission = file.permission.get(owner.getHash(verificationSymbol));
    if (_canModifyFileOrDirectory(permission)) {
      files.delete(this);
      const directory = directoryLink.get(this);
      const data = directoriesMap.get(directory);
      if (data) {
        const index = data.contents.indexOf(this);
        if (index !== -1) {
          data.contents.splice(index, 1);
        }
      }
      const onChange = rootMap.get(this);
      try {
        await onChange();
      } catch (error) {
        data.contents.push(this);
        throw error;
      }
      rootMap.delete(this);
      directoryLink.delete(this);
      return;
    }
    throw new Error('You do not have permission to delete this file');
  }

  getPermission(owner = everyone) {
    const file = files.get(this);
    if (!file) throw new Error('File has already been deleted!');
    return file.permission.get(owner.getHash(verificationSymbol)) || FileSystemPermissions.None;
  }

  setPermissionFor(owner = everyone, target: StringSymbol, permission: FileSystemPermissions) {
    if (owner.getHash(verificationSymbol) === target.getHash(verificationSymbol))
      throw new Error('Cannot set permission to same target');
    const file = files.get(this);
    if (!file) throw new Error('Directory has been deleted!');
    const directoryPermission = file.permission.get(owner.getHash(verificationSymbol));
    if (_canModifyFileOrDirectory(directoryPermission)) {
      file.permission.set(target.getHash(verificationSymbol), permission);
      file.permission.set(systemSymbol.getHash(verificationSymbol), FileSystemPermissions.ReadAndWrite);
      return;
    }
    throw new Error('You don not have permission to set permission to this directory!');
  }

  setPermission(owner = everyone, permission: FileSystemPermissions) {
    const file = files.get(this);
    if (!file) throw new Error('Directory has been deleted!');
    const directoryPermission = file.permission.get(owner.getHash(verificationSymbol));
    if (_canModifyFileOrDirectory(directoryPermission)) {
      file.permission.set(owner.getHash(verificationSymbol), permission);
      file.permission.set(systemSymbol.getHash(verificationSymbol), FileSystemPermissions.ReadAndWrite);
      return;
    }
    throw new Error('You don not have permission to set permission to this directory!');
  }

  get name() {
    const file = files.get(this);
    if (!file) throw new Error('File has been deleted!');
    return file.name;
  }

  setName(name: string, owner = everyone) {
    const file = files.get(this);
    if (!file) throw new Error('File has been deleted!');
    const permission = file.permission.get(owner.getHash(verificationSymbol));
    if (_canModifyFileOrDirectory(permission)) {
      const directory = directoryLink.get(this);
      const upper = directoriesMap.get(directory);
      const sameNameFolder = !!upper.contents.find(d => d.name === name);
      if (sameNameFolder) {
        throw new Error('Duplicate name!');
      }
      file.name = name;
      return;
    }
    throw new Error('Missing permission to write');
  }
  get deleted() {
    return !files.get(this);
  }

  get path() {
    const file = files.get(this);
    const directory = directoryLink.get(this);
    if (!file) throw new Error('File has been deleted!');
    if (!directory) throw new Error('Corrupted file!');
    return `${directory.path}/${file.name}`;
  }
  get size() {
    const file = files.get(this);
    if (!file) throw new Error('File has been deleted!');
    return sizeof(file.content);
  }
}

export function isDirectory(fileDirectory: any): fileDirectory is FileSystemDirectory {
  return (
    !!fileDirectory.contents &&
    !!fileDirectory.name &&
    !!fileDirectory.getPermission &&
    !!fileDirectory.setPermission &&
    !!fileDirectory.setPermissionFor &&
    !!fileDirectory.createDirectory &&
    !!fileDirectory.deleteDirectory
  );
}

function _canModifyFileOrDirectory(permission: FileSystemPermissions) {
  return permission === FileSystemPermissions.ReadAndWrite || permission === FileSystemPermissions.WriteOnly;
}

function _canReadFileOrDirectory(permission: FileSystemPermissions) {
  return permission === FileSystemPermissions.ReadAndWrite || permission === FileSystemPermissions.ReadOnly;
}

export function canModifyFileOrDirectory(permission: FileSystemPermissions) {
  return _canModifyFileOrDirectory(permission);
}

export function canReadFileOrDirectory(permission: FileSystemPermissions) {
  return _canReadFileOrDirectory(permission);
}

const notValidCharacters = '\\/:*?"<>|';
export function sanitizeName(name: string) {
  const notAllowed = notValidCharacters.split('');
  let newString = '';
  for (const char of name.split('')) {
    if (!notAllowed.includes(char)) {
      newString += char;
    }
  }
  return newString;
}

function isValidName(name: string) {
  if (typeof name !== 'string') return result(`${typeof name} are not valid names. Expected string!`);
  if (!name.length) return result('Name must at least one character long!');
  const maxCharactersInFolder = 256;
  if (name.length > maxCharactersInFolder)
    return result(`Name cannot be longer than ${maxCharactersInFolder} one character long!`);
  const regExp = new RegExp(escapeRegExp(notValidCharacters), 'ig');
  if (regExp.test(name)) {
    return result(`Name cannot contain characters "${notValidCharacters}"!`);
  }
  return result();
}

export function isNameValid(name: string) {
  return isValidName(name);
}

function result(error?: string) {
  if (error) {
    return {
      valid: false,
      reason: error,
    };
  }
  return {
    valid: true,
  };
}

export interface ObjectDirectory {
  name: string;
  contents: (ObjectDirectory | ObjectFile)[];
  permission: ObjectPermission;
}

interface ObjectFile {
  name: string;
  permission: ObjectPermission;
  content: string;
  type: FileData['type'];
}

interface ObjectPermission {
  [key: number]: number;
}

export function objectifyDirectory(directory: FileSystemDirectory, systemPermission = everyone): ObjectDirectory {
  const data = directoriesMap.get(directory);
  if (!data) throw new Error('Directory has been deleted!');
  const name = directory.name;
  const contents = directory
    .contents(systemPermission)
    .map(f => objectifyDirectoryFile(f, systemPermission))
    .filter(e => e);
  const permission = objectifyPermission(data.permission);

  return { name, contents, permission };
}

function objectifyFile(file: FileSystemFile, systemPermission = everyone): ObjectFile {
  const data = files.get(file);
  if (!data) throw new Error('File has been deleted!');
  const content = stringifyAnything(file.getContent(systemPermission));
  const type = file.getType(systemPermission);
  if (type === 'lindowApp' || type === 'lindowObject') {
    return null;
  }

  const permission = objectifyPermission(data.permission);
  const name = data.name;

  return { content, name, permission, type };
}

function objectifyPermission(permission: Permission) {
  const objectPermissions: ObjectPermission = {};
  permission.forEach((permission, number) => {
    if (number === systemSymbol.getHash(verificationSymbol) || number === everyone.getHash(verificationSymbol)) return;

    objectPermissions[number] = permission;
  });
  return objectPermissions;
}

function objectifyDirectoryFile(obj: FileSystemFile | FileSystemDirectory, systemPermission = everyone) {
  if (isDirectory(obj)) {
    return objectifyDirectory(obj, systemPermission);
  } else {
    return objectifyFile(obj, systemPermission);
  }
}

export async function parseDirectory(root: FileSystemDirectory, objDir: ObjectDirectory, owner = everyone) {
  const directory = await root.createDirectory(objDir.name, owner);
  const data = directoriesMap.get(directory);
  if (!data) throw new Error('Something went horribly wrong!');
  const permissionsEntires = Object.entries(objDir.permission);
  for (const [a, b] of permissionsEntires) {
    const hash = parseInt(a);
    const permissionEnum = parseInt(b);
    if (isNaN(hash) || isNaN(permissionEnum)) throw Error('Unable to convert permissions!');
    data.permission.set(hash, permissionEnum);
    data.permission.set(systemSymbol.getHash(verificationSymbol), FileSystemPermissions.ReadAndWrite);
  }

  for (const content of objDir.contents) {
    parseDirectoryOrFile(directory, content, owner);
  }
  return directory;
}

export function parseDirectoryOrFile(root: FileSystemDirectory, obj: ObjectDirectory | ObjectFile, owner = everyone) {
  if (isObjectDirectory(obj)) {
    parseDirectory(root, obj, owner);
  } else {
    parseFile(root, obj, owner);
  }
}

async function parseFile(root: FileSystemDirectory, objFile: ObjectFile, owner = everyone) {
  let content = objFile.content;
  if (objFile.type === 'json') {
    try {
      const conContent = JSON.parse(content);
      content = conContent;
    } catch (error) {
      DEV && console.error('Unable to parse JSON', content);
    }
  }

  const file = await root.createFile(objFile.name, objFile.type, content, owner);
  const data = files.get(file);
  if (!data) throw new Error('Something went horribly wrong!');
  const permissionsEntires = Object.entries(objFile.permission);
  for (const [a, b] of permissionsEntires) {
    const hash = parseInt(a);
    const permissionEnum = parseInt(b);
    if (isNaN(hash) || isNaN(permissionEnum)) throw Error('Unable to convert permissions!');
    data.permission.set(hash, permissionEnum);
    data.permission.set(systemSymbol.getHash(verificationSymbol), FileSystemPermissions.ReadAndWrite);
  }
  return file;
}

function isObjectDirectory(objectDirectory: any): objectDirectory is ObjectDirectory {
  return !!objectDirectory.contents && !!objectDirectory.name && !!objectDirectory.permission;
}

function stringifyAnything(unknown: unknown) {
  switch (typeof unknown) {
    case 'string':
      return unknown;
    case 'boolean':
      return unknown ? 'true' : ' false';
    case 'number':
      return `${unknown}`;
    case 'object':
      try {
        const json = JSON.stringify(unknown);
        return json;
      } catch (error) {
        /* ignored */
      }
      return `${unknown}`;
  }
  return 'null';
}

let alreadyRequested = false;
export function requestSystemSymbol() {
  if (alreadyRequested) {
    return;
  }
  alreadyRequested = true;
  return systemSymbol;
}
