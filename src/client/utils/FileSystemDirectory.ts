import { escapeRegExp } from "lodash";
import { randomString } from "../../shared/utils";

export interface DirectoryData {
  name: string,
  permission: Map<number, FileSystemPermissions>,
  contents: (FileSystemDirectory | FileSystemFile)[],
}
export interface FileData<T = string> {
  name: string,
  permission: Map<number, FileSystemPermissions>,
  content: T,
  type: 'text' | 'unknown',
}
export enum FileSystemPermissions {
    None,
    ReadOnly,
    WriteOnly,
    ReadAndWrite,
}

export function isValidName(name: string) {
  if (typeof name !== 'string') return result(`${typeof name} are not valid names. Expected string!`);
  if (!name.length) return result('Name must at least one character long!');
  const maxCharactersInFolder = 256;
  if (name.length > maxCharactersInFolder) return result(`Name cannot be longer than ${maxCharactersInFolder} one character long!`);
  const notValidCharacters = '\\/:*?"<>|';
  const regExp = new RegExp(escapeRegExp(notValidCharacters), 'ig');
  if (regExp.test(name)) {
    return result(`Name cannot contain characters "${notValidCharacters}"!`);
  }
  return result()
}

function result(error?: string) {
  if (error) {
    return {
      valid: false,
      reason: error
    }
  }
  return {
    valid: true,
  }
}

const hashMap = new WeakMap<StringSymbol, number>()
export class StringSymbol {

  constructor(text: string) {
    if (typeof text !== 'string') throw new Error(`Expected string got ${typeof text}!`)
    let hash = 0;
    let chr: number;
    for (let i = 0; i < text.length; i++) {
      chr = text.charCodeAt(i);
      hash  = ((hash << 5) - hash) + chr;
      hash |= 0; 
    }
    hashMap.set(this, hash);
  }

  get hash() {
    return hashMap.get(this);
  }
}

export const everyone = new StringSymbol(randomString(99));

const directoriesMap = new WeakMap<FileSystemDirectory, DirectoryData>();
const upperPath = new WeakMap<(FileSystemFile | FileSystemDirectory), FileSystemDirectory>();
export class FileSystemDirectory {
  constructor(name: string, owner = everyone) {
    const result = isValidName(name);
    if (!result.valid) throw new Error(result.reason);
    const directoryData: DirectoryData = {
      name,
      contents: [],
      permission: new Map()
    }
    directoryData.permission.set(owner.hash, FileSystemPermissions.ReadAndWrite);
    directoriesMap.set(this, directoryData);
  }

  createDirectory(name: string, owner = everyone) {
    const directory = directoriesMap.get(this);
    if (!directory) throw new Error('Directory has been deleted!');
    const permission = directory.permission.get(owner.hash);
    if (canModifyFileOrDirectory(permission)) {
      const result = isValidName(name);
      if (!result.valid) throw new Error(result.reason);
      const sameName = !!directory.contents.find(d => d.name === name)
      if (sameName) {
        throw new Error('Duplicate name!');
      }
      const newDirectory = new FileSystemDirectory(name, owner)
      upperPath.set(newDirectory, this);
      directory.contents.push(newDirectory);
      return newDirectory;
    }
    throw new Error('You do not have permission to edit this folder!');
  }

  createFile<C = any>(name: string, type: FileData['type'], content: C,  owner = everyone) {
    const directory = directoriesMap.get(this)
    if (!directory) throw new Error('Directory has been deleted!');
    const permission = directory.permission.get(owner.hash);

    if (canModifyFileOrDirectory(permission)) {
      const result = isValidName(name);
      if (!result.valid) throw new Error(result.reason);
      const sameName = !!directory.contents.find(d => d.name === name)
      if (sameName) {
        throw new Error('Duplicate name!');
      }
      const file = new FileSystemFile(name, type, content, this, owner);
      directory.contents.push(file);
      return file;
    }
    throw new Error('You do not have permission to edit this folder!');
  }

  get name() {
    const data = directoriesMap.get(this)
    if (!data) throw new Error('Directory has been deleted!');
    return data.name;
  }

  setName(name: string, owner = everyone) {
    const directory = directoriesMap.get(this)
    if (!directory) throw new Error('Directory has been deleted!');
    const permission = directory.permission.get(owner.hash);
    if (canModifyFileOrDirectory(permission)) {
      const result = isValidName(name);
      if (!result.valid) throw new Error(result.reason);
        const sameNameFolder = !!directory.contents.find(d => d.name === name)
        if (sameNameFolder) {
          throw new Error('Duplicate name!');
        }
        directory.name = name;
      return;
    }
    throw new Error('You don not have permission to rename this directory!');
  }

  deleteDirectory(owner = everyone) {
    const data = directoriesMap.get(this)
    if (!data) throw new Error('Directory has been deleted!');
   
  
  }

  contents(owner = everyone) {
    const directory = directoriesMap.get(this)
    if (!directory) throw new Error('Directory has been deleted!');
    const permission = directory.permission.get(owner.hash);
    if (canReadFileOrDirectory(permission)) {
      return directory.contents;
    }
    throw new Error('Missing permission to read');
  }

  get path() {
    const directory = directoriesMap.get(this)
    if (!directory) throw new Error('Directory has been deleted!');
    let path = [];
    let target = this as FileSystemDirectory;

    while (target) {
      path.push(target.name);
      target = upperPath.get(target);
    }

    return path.reverse().join('/');
  }

  setPermissionFor(owner = everyone, target: StringSymbol, permission: FileSystemPermissions) {
    if (owner.hash === target.hash) throw new Error('Cannot set permission to same target');
    const directory = directoriesMap.get(this)
    if (!directory) throw new Error('Directory has been deleted!');
    const directoryPermission = directory.permission.get(owner.hash);
    if (canModifyFileOrDirectory(directoryPermission)) {
      directory.permission.set(target.hash, permission);
      return;
    }
    throw new Error('You don not have permission to set permission to this directory!');
  }
  
  setPermission(owner = everyone, permission: FileSystemPermissions) {
    const directory = directoriesMap.get(this)
    if (!directory) throw new Error('Directory has been deleted!');
    const directoryPermission = directory.permission.get(owner.hash);
    if (canModifyFileOrDirectory(directoryPermission)) {
      directory.permission.set(owner.hash, permission);
      return;
    }
    throw new Error('You don not have permission to set permission to this directory!');
  }

  getPermission(owner = everyone) {
    const data = directoriesMap.get(this)
    if (!data) throw new Error('Directory has been deleted!');
    return data.permission.get(owner.hash) || FileSystemPermissions.None;
  }
}

const files = new WeakMap<FileSystemFile<any>, FileData<any>>()
const directoryLink = new WeakMap<FileSystemFile, FileSystemDirectory>()
export class FileSystemFile<C = any> {
  constructor(name: string, type: FileData['type'], content: C, fileSystemDirectory: FileSystemDirectory, owner = everyone) {
    const fileData: FileData<C> = {
      name, type, content,
      permission: new Map()
    }
    fileData.permission.set(owner.hash, FileSystemPermissions.ReadAndWrite);
    files.set(this, fileData);
    directoryLink.set(this, fileSystemDirectory);
  }

  getContent<CC = C>(owner = everyone): CC {
    const file = files.get(this)
    if (!file) throw new Error('File has been deleted!');
    const permission = file.permission.get(owner.hash);
    if (canReadFileOrDirectory(permission)) {
      return file.content;
    }
    throw new Error('Missing permission to read');
  }

  setContent<CC = C>(content: CC, owner = everyone) {
    const file = files.get(this)
    if (!file) throw new Error('File has been deleted!');
    const permission = file.permission.get(owner.hash);
    if (canModifyFileOrDirectory(permission)) {
      file.content = content;
      return;
    }
    throw new Error('Missing permission to read');
  }

  getType(owner = everyone) {
    const file = files.get(this)
    if (!file) throw new Error('File has been deleted!');
    const permission = file.permission.get(owner.hash);
    if (canModifyFileOrDirectory(permission)) {
      return file.type;
    }
    throw new Error('Missing permission to read');
  }

  setType(type: FileData['type'], owner = everyone) {
    const file = files.get(this)
    if (!file) throw new Error('File has been deleted!');
    const permission = file.permission.get(owner.hash);
    if (canModifyFileOrDirectory(permission)) {
      file.type = type;
      return;
    }
    throw new Error('Missing permission to read');
  }

  deleteFile(owner = everyone) {
    const file = files.get(this)
    if (!file) throw new Error('File has already been deleted!');
    const permission = file.permission.get(owner.hash);
    if (canModifyFileOrDirectory(permission)) {
      files.delete(this);
      const directory = directoryLink.get(this);
      const data = directoriesMap.get(directory);
      if (data) {
        const index = data.contents.indexOf(this);
        if (index !== -1) {
          data.contents.splice(index, 1);
        }
      }
      directoryLink.delete(this);
    }
    throw new Error('You do not have permission to delete this file');
  }
  
  permission(owner = everyone) {
    const file = files.get(this)
    if (!file) throw new Error('File has already been deleted!');
    return file.permission.get(owner.hash) || FileSystemPermissions.None;
  }

  setPermissionFor(owner = everyone, target: StringSymbol, permission: FileSystemPermissions) {
    if (owner.hash === target.hash) throw new Error('Cannot set permission to same target');
    const file = files.get(this)
    if (!file) throw new Error('Directory has been deleted!');
    const directoryPermission = file.permission.get(owner.hash);
    if (canModifyFileOrDirectory(directoryPermission)) {
      file.permission.set(target.hash, permission);
      return;
    }
    throw new Error('You don not have permission to set permission to this directory!');
  }
  
  setPermission(owner = everyone, permission: FileSystemPermissions) {
    const file = files.get(this)
    if (!file) throw new Error('Directory has been deleted!');
    const directoryPermission = file.permission.get(owner.hash);
    if (canModifyFileOrDirectory(directoryPermission)) {
      file.permission.set(owner.hash, permission);
      return;
    }
    throw new Error('You don not have permission to set permission to this directory!');
  }

  get name() {
    const file = files.get(this)
    if (!file) throw new Error('File has been deleted!');
    return file.name;
  }

  setName(name: string, owner = everyone) {
    const file = files.get(this)
    if (!file) throw new Error('File has been deleted!');
    const permission = file.permission.get(owner.hash);
    if (canModifyFileOrDirectory(permission)) {
      file.name = name;
      return;
    }
    throw new Error('Missing permission to read');
  }
  get path() {
    const file = files.get(this)
    const directory = directoryLink.get(this);
    if (!file) throw new Error('File has been deleted!');
    if (!directory) throw new Error('Corrupted file!');
    return `${directory.path}/${file.name}`;
  }
}


function canModifyFileOrDirectory(permission: FileSystemPermissions) {
  return permission === FileSystemPermissions.ReadAndWrite || permission === FileSystemPermissions.WriteOnly;
}

function canReadFileOrDirectory(permission: FileSystemPermissions){
  return permission === FileSystemPermissions.ReadAndWrite || permission === FileSystemPermissions.ReadOnly;
}
