import { escapeRegExp } from "lodash";
import { sizeof } from "sizeof";
import { cloneDeep } from "../../shared/utils";
import { Collection } from "./Collection";

type Permission = Map<number, FileSystemPermissions>;
export type FileSystemContent = FileSystemDirectory | FileSystemFile<any>;

const directoryDeleted = "Directory has been deleted";
const fileDeleted = "File has already been deleted";

export interface ContentMetaData {
  dateCreated: number;
  dateModified: number;
  [key: string]: string | number | boolean;
}

export interface DirectoryData {
  name: string;
  permission: Permission;
  contents: Collection<string, FileSystemContent>;
  metadata: ContentMetaData;
}
export interface FileData<T = string> {
  name: string;
  permission: Permission;
  content: T;
  type: "text" | "unknown" | "json" | "lindowObject" | "lindowApp";
  metadata: ContentMetaData;
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
    if (typeof text !== "string") throw new Error(`Expected string got ${typeof text}!`);
    if (text === "root") throw new Error("You cannot generate root symbol");
    if (text === "everyone") throw new Error("You cannot generate everyone symbol");
    hashMap.set(this, getHash(text));
  }

  getHash(symbol: symbol) {
    if (symbol !== verificationSymbol) throw new Error("Invalid symbol!");
    return hashMap.get(this);
  }

  equals(stringSymbol: StringSymbol) {
    const hash = hashMap.get(this);
    const hash2 = hashMap.get(stringSymbol);
    return hash === hash2;
  }
  toString() {
    return "[Object StringSymbol]";
  }
}

const systemSymbol = new StringSymbol("_");
export const everyone = new StringSymbol("_");
const rootHash = getHash("root");
const everyoneHash = getHash("everyone");
systemSymbol.getHash = symbol => {
  if (symbol !== verificationSymbol) throw new Error("Invalid symbol!");
  return rootHash;
};

everyone.getHash = symbol => {
  if (symbol !== verificationSymbol) throw new Error("Invalid symbol!");
  return everyoneHash;
};

type OnChange = () => Promise<void>;

const directoriesMap = new WeakMap<FileSystemDirectory, DirectoryData>();
const upperPath = new WeakMap<FileSystemContent, FileSystemDirectory>();
const rootMap = new WeakMap<FileSystemContent, OnChange>();

export class FileSystemDirectory {
  constructor(name: string, owner = everyone, onChange: OnChange) {
    const result = isValidName(name);
    if (!result.valid) throw new Error(result.reason);
    const now = Date.now();
    const directoryData: DirectoryData = {
      name,
      contents: new Collection(),
      permission: new Map(),
      metadata: {
        dateCreated: now,
        dateModified: now,
      },
    };
    directoryData.permission.set(owner.getHash(verificationSymbol), FileSystemPermissions.ReadAndWrite);
    directoryData.permission.set(systemSymbol.getHash(verificationSymbol), FileSystemPermissions.ReadAndWrite);
    directoriesMap.set(this, directoryData);
    rootMap.set(this, onChange);
  }

  async createDirectory(name: string, owner = everyone) {
    const directory = directoriesMap.get(this);
    if (!directory) throw new Error(directoryDeleted);
    const permission = directory.permission.get(owner.getHash(verificationSymbol));
    if (_canModifyFileOrDirectory(permission)) {
      const result = isValidName(name);
      if (!result.valid) throw new Error(result.reason);
      const sameName = !!directory.contents.find(d => d.name === name);
      if (sameName) {
        throw new Error("Duplicate name!");
      }
      const onChange = rootMap.get(this);
      if (!onChange) {
        throw new Error("Missing root folder!");
      }
      const newDirectory = new FileSystemDirectory(name, owner, onChange);
      upperPath.set(newDirectory, this);
      directory.contents.set(name, newDirectory);
      try {
        await onChange();
      } catch (error) {
        upperPath.delete(newDirectory);
        directoriesMap.delete(newDirectory);
        rootMap.delete(newDirectory);
        directory.contents.delete(name);
        throw error;
      }
      return newDirectory;
    }
    throw new Error("You do not have permission to edit this folder!");
  }

  async createFile<C = any>(name: string, type: FileData["type"], content: C, owner = everyone) {
    const directory = directoriesMap.get(this);
    if (!directory) throw new Error(directoryDeleted);
    const permission = directory.permission.get(owner.getHash(verificationSymbol));

    if (_canModifyFileOrDirectory(permission)) {
      const result = isValidName(name);
      if (!result.valid) throw new Error(result.reason);
      const sameName = !!directory.contents.find(d => d.name === name);
      if (sameName) {
        throw new Error("Duplicate name!");
      }
      const onChange = rootMap.get(this);
      if (!onChange) {
        throw new Error("Missing root folder!");
      }
      const file = new FileSystemFile(name, type, content, this, onChange, owner);
      directory.contents.set(name, file);
      try {
        await onChange();
      } catch (error) {
        rootMap.delete(file);
        directoryLink.delete(file);
        directory.contents.delete(name);
        throw error;
      }
      return file;
    }
    throw new Error("You do not have permission to edit this folder!");
  }

  get name() {
    const data = directoriesMap.get(this);
    if (!data) throw new Error(directoryDeleted);
    return data.name;
  }

  setName(name: string, owner = everyone) {
    const directory = directoriesMap.get(this);
    if (!directory) throw new Error(directoryDeleted);
    const permission = directory.permission.get(owner.getHash(verificationSymbol));
    if (_canModifyFileOrDirectory(permission)) {
      const result = isValidName(name);
      if (!result.valid) throw new Error(result.reason);
      const upper = directoriesMap.get(upperPath.get(this));
      const sameNameFolder = !!upper.contents.find(d => d.name === name);
      if (sameNameFolder) {
        throw new Error("Duplicate name!");
      }
      upper.contents.delete(directory.name);
      directory.name = name;
      directory.metadata.dateModified = Date.now();
      upper.contents.set(directory.name, this);
      return;
    }
    throw new Error("You don not have permission to rename this directory!");
  }

  async deleteDirectory(owner = everyone, recursive = false) {
    const data = directoriesMap.get(this);
    if (!data) throw new Error(directoryDeleted);
    const permission = data.permission.get(owner.getHash(verificationSymbol));
    const onChange = rootMap.get(this);
    if (!onChange) {
      throw new Error("Missing root folder!");
    }

    if (_canModifyFileOrDirectory(permission)) {
      const upper = upperPath.get(this);

      if (upper.contents.length) {
        throw new Error("Directory is not empty!");
      }

      const directoriesMapBackup = directoriesMap.get(this);
      const rootMapBackup = rootMap.get(this);
      const upperPathBackup = upperPath.get(this);
      const upperData = directoriesMap.get(upper);
      upperData.contents.delete(directoriesMapBackup.name);

      directoriesMap.delete(this);
      rootMap.delete(this);
      upperPath.delete(this);
      try {
        await onChange();
      } catch (error) {
        directoriesMap.set(this, directoriesMapBackup);
        rootMap.set(this, rootMapBackup);
        upperPath.set(this, upperPathBackup);
        upperData.contents.set(directoriesMapBackup.name, this);
        throw error;
      }
      return;
    }

    throw new Error("You do not have permission to delete this directory!");
  }

  contents(owner = everyone) {
    const directory = directoriesMap.get(this);
    if (!directory) throw new Error(directoryDeleted);
    const permission = directory.permission.get(owner.getHash(verificationSymbol));
    if (_canReadFileOrDirectory(permission)) {
      return directory.contents;
    }
    throw new Error("Missing permission to read");
  }
  getFile<T = any>(name: string, owner = everyone): FileSystemFile<T> | null {
    const directory = directoriesMap.get(this);
    if (!directory) throw new Error(directoryDeleted);
    const permission = directory.permission.get(owner.getHash(verificationSymbol));
    if (_canReadFileOrDirectory(permission)) {
      return (directory.contents.find(n => !isDirectory(n) && n.name === name) as FileSystemFile<T>) || null;
    }
    throw new Error("Missing permission to read");
  }

  getDirectory(name: string, owner = everyone): FileSystemDirectory | null {
    const directory = directoriesMap.get(this);
    if (!directory) throw new Error(directoryDeleted);
    const permission = directory.permission.get(owner.getHash(verificationSymbol));
    if (_canReadFileOrDirectory(permission)) {
      return (directory.contents.find(n => isDirectory(n) && n.name === name) as FileSystemDirectory) || null;
    }
    throw new Error("Missing permission to read");
  }

  get deleted() {
    return !directoriesMap.get(this);
  }

  get path() {
    const directory = directoriesMap.get(this);
    if (!directory) throw new Error(directoryDeleted);
    const path = [];
    let target = this as FileSystemDirectory;

    while (target) {
      path.push(target.name);
      target = upperPath.get(target);
    }

    return path.reverse().join("/");
  }

  setPermissionFor(owner = everyone, target: StringSymbol, permission: FileSystemPermissions) {
    if (owner.getHash(verificationSymbol) === target.getHash(verificationSymbol))
      throw new Error("Cannot set permission to same target");
    const directory = directoriesMap.get(this);
    if (!directory) throw new Error(directoryDeleted);
    const directoryPermission = directory.permission.get(owner.getHash(verificationSymbol));
    if (_canModifyFileOrDirectory(directoryPermission)) {
      directory.permission.set(target.getHash(verificationSymbol), permission);
      return;
    }
    throw new Error("You don not have permission to set permission to this directory!");
  }

  setPermission(owner = everyone, permission: FileSystemPermissions) {
    const directory = directoriesMap.get(this);
    if (!directory) throw new Error(directoryDeleted);
    const directoryPermission = directory.permission.get(owner.getHash(verificationSymbol));
    if (_canModifyFileOrDirectory(directoryPermission)) {
      directory.permission.set(owner.getHash(verificationSymbol), permission);
      return;
    }
    throw new Error("You don not have permission to set permission to this directory!");
  }

  getPermission(owner = everyone) {
    const data = directoriesMap.get(this);
    if (!data) throw new Error(directoryDeleted);
    return data.permission.get(owner.getHash(verificationSymbol)) || FileSystemPermissions.None;
  }
  get size() {
    const directory = directoriesMap.get(this);
    if (!directory) throw new Error(directoryDeleted);
    let size = 0;
    directory.contents.forEach(content => {
      size += content.size;
    });
    return size;
  }

  getMetadata(key: undefined, owner?: StringSymbol): ContentMetaData;
  getMetadata(key?: string, owner = everyone) {
    const directory = directoriesMap.get(this);
    if (!directory) throw new Error(directoryDeleted);
    const filePermission = directory.permission.get(owner.getHash(verificationSymbol));
    if (_canReadFileOrDirectory(filePermission)) {
      if (key) {
        if (directory.metadata[key]) {
          return cloneDeep(directory.metadata[key]);
        }
      } else {
        return cloneDeep(directory.metadata);
      }
      return null;
    }
    throw new Error("Missing Permission to read");
  }
  async setMetaData(key: string, value: boolean | string | number, owner = everyone) {
    const type = typeof value;
    switch (type) {
      case "string":
      case "number":
      case "boolean":
        break;
      default:
        throw new Error(`Invalid value type`);
    }

    const directory = directoriesMap.get(this);
    if (!directory) throw new Error(directoryDeleted);
    const filePermission = directory.permission.get(owner.getHash(verificationSymbol));
    if (_canModifyFileOrDirectory(filePermission)) {
      const temp = directory.metadata;
      const metaClone = cloneDeep(directory.metadata);
      metaClone[key] = value;
      directory.metadata = metaClone;
      const onChange = rootMap.get(this);
      try {
        await onChange();
      } catch (error) {
        directory.metadata = temp;
        throw error;
      }
      return;
    }
    throw new Error("Missing permission to modify");
  }
}

const files = new WeakMap<FileSystemFile<any>, FileData<any>>();
const directoryLink = new WeakMap<FileSystemFile, FileSystemDirectory>();
export class FileSystemFile<C = any> {
  constructor(
    name: string,
    type: FileData["type"],
    content: C,
    fileSystemDirectory: FileSystemDirectory,
    onChange: OnChange,
    owner = everyone,
  ) {
    const now = Date.now();
    const fileData: FileData<C> = {
      name,
      type,
      content,
      permission: new Map(),
      metadata: {
        dateCreated: now,
        dateModified: now,
      },
    };
    fileData.permission.set(owner.getHash(verificationSymbol), FileSystemPermissions.ReadAndWrite);
    fileData.permission.set(systemSymbol.getHash(verificationSymbol), FileSystemPermissions.ReadAndWrite);
    files.set(this, fileData);
    directoryLink.set(this, fileSystemDirectory);
    rootMap.set(this, onChange);
  }

  getContent<CC = C>(owner = everyone): CC {
    const file = files.get(this);
    if (!file) throw new Error("File has been deleted!");
    const permission = file.permission.get(owner.getHash(verificationSymbol));
    if (_canReadFileOrDirectory(permission)) {
      if (file.type === "json") {
        return cloneDeep(file.content);
      }
      return file.content;
    }
    throw new Error("Missing permission to read");
  }

  async setContent<CC = C>(content: CC, owner = everyone) {
    const file = files.get(this);
    if (!file) throw new Error("File has been deleted!");
    const permission = file.permission.get(owner.getHash(verificationSymbol));
    if (_canModifyFileOrDirectory(permission)) {
      const onChange = rootMap.get(this);
      if (!onChange) {
        throw new Error("Missing root folder!");
      }
      const tempContent = file.content;
      const tempDateModified = file.metadata.dateModified;

      if (file.type === "json") {
        try {
          JSON.stringify(content);
        } catch (error) {
          throw new Error("Given file is not a json!");
        }
      }
      file.content = content;
      file.metadata.dateModified = Date.now();
      try {
        await onChange();
      } catch (error) {
        file.content = tempContent;
        file.metadata.dateModified = tempDateModified;
        throw error;
      }

      return;
    }
    throw new Error("Missing permission to read");
  }

  getType(owner = everyone) {
    const file = files.get(this);
    if (!file) throw new Error("File has been deleted!");
    const permission = file.permission.get(owner.getHash(verificationSymbol));
    if (_canModifyFileOrDirectory(permission)) {
      return file.type;
    }
    throw new Error("Missing permission to read");
  }

  setType(type: FileData["type"], owner = everyone) {
    const file = files.get(this);
    if (!file) throw new Error("File has been deleted!");
    const permission = file.permission.get(owner.getHash(verificationSymbol));
    if (_canModifyFileOrDirectory(permission)) {
      file.type = type;
      file.metadata.dateModified = Date.now();
      return;
    }
    throw new Error("Missing permission to read");
  }

  async deleteFile(owner = everyone) {
    const file = files.get(this);
    if (!file) throw new Error(fileDeleted);
    const permission = file.permission.get(owner.getHash(verificationSymbol));
    if (_canModifyFileOrDirectory(permission)) {
      files.delete(this);
      const directory = directoryLink.get(this);
      const data = directoriesMap.get(directory);
      if (data) {
        data.contents.delete(this.name);
      }
      const onChange = rootMap.get(this);
      try {
        await onChange();
      } catch (error) {
        data.contents.set(this.name, this);
        throw error;
      }
      rootMap.delete(this);
      directoryLink.delete(this);
      return;
    }
    throw new Error("You do not have permission to delete this file");
  }

  getPermission(owner = everyone) {
    const file = files.get(this);
    if (!file) throw new Error(fileDeleted);
    return file.permission.get(owner.getHash(verificationSymbol)) || FileSystemPermissions.None;
  }

  setPermissionFor(owner = everyone, target: StringSymbol, permission: FileSystemPermissions) {
    if (owner.getHash(verificationSymbol) === target.getHash(verificationSymbol))
      throw new Error("Cannot set permission to same target");
    const file = files.get(this);
    if (!file) throw new Error(directoryDeleted);
    const directoryPermission = file.permission.get(owner.getHash(verificationSymbol));
    if (_canModifyFileOrDirectory(directoryPermission)) {
      file.permission.set(target.getHash(verificationSymbol), permission);
      file.permission.set(systemSymbol.getHash(verificationSymbol), FileSystemPermissions.ReadAndWrite);
      return;
    }
    throw new Error("You don not have permission to set permission to this directory!");
  }

  setPermission(owner = everyone, permission: FileSystemPermissions) {
    const file = files.get(this);
    if (!file) throw new Error(directoryDeleted);
    const filePermission = file.permission.get(owner.getHash(verificationSymbol));
    if (_canModifyFileOrDirectory(filePermission)) {
      file.permission.set(owner.getHash(verificationSymbol), permission);
      file.permission.set(systemSymbol.getHash(verificationSymbol), FileSystemPermissions.ReadAndWrite);
      return;
    }
    throw new Error("You don not have permission to set permission to this directory!");
  }

  get name() {
    const file = files.get(this);
    if (!file) throw new Error("File has been deleted!");
    return file.name;
  }

  async setName(name: string, owner = everyone) {
    const file = files.get(this);
    if (!file) throw new Error("File has been deleted!");
    const permission = file.permission.get(owner.getHash(verificationSymbol));
    if (_canModifyFileOrDirectory(permission)) {
      const directory = directoryLink.get(this);
      const upper = directoriesMap.get(directory);
      const sameNameFolder = !!upper.contents.find(d => d.name === name);
      if (sameNameFolder) {
        throw new Error("Duplicate name!");
      }
      const temp = upper.contents.get(file.name);
      const tempName = file.name;
      const tempDateModified = file.metadata.dateModified;
      upper.contents.delete(file.name);
      if (!temp) throw new Error("Invalid name");
      file.name = name;
      file.metadata.dateModified = Date.now();
      upper.contents.set(file.name, this);
      const onChange = rootMap.get(this);
      try {
        await onChange();
      } catch (error) {
        file.name = tempName;
        file.metadata.dateModified = tempDateModified;
        throw error;
      }

      return;
    }
    throw new Error("Missing permission to write");
  }
  getMetadata(key: undefined, owner?: StringSymbol): ContentMetaData;
  getMetadata(key?: string, owner = everyone) {
    const file = files.get(this);
    if (!file) throw new Error(directoryDeleted);
    const filePermission = file.permission.get(owner.getHash(verificationSymbol));
    if (_canReadFileOrDirectory(filePermission)) {
      if (key) {
        if (file.metadata[key]) {
          return cloneDeep(file.metadata[key]);
        }
      } else {
        return cloneDeep(file.metadata);
      }
      return null;
    }
    throw new Error("Missing Permission to read");
  }
  async setMetaData(key: string, value: boolean | string | number, owner = everyone) {
    const type = typeof value;
    switch (type) {
      case "string":
      case "number":
      case "boolean":
        break;
      default:
        throw new Error(`Invalid value type`);
    }

    const file = files.get(this);
    if (!file) throw new Error("File has been deleted!");
    const filePermission = file.permission.get(owner.getHash(verificationSymbol));
    if (_canModifyFileOrDirectory(filePermission)) {
      const temp = file.metadata;
      const metaClone = cloneDeep(file.metadata);
      metaClone[key] = value;
      file.metadata = metaClone;
      const onChange = rootMap.get(this);
      try {
        await onChange();
      } catch (error) {
        file.metadata = temp;
        throw error;
      }
      return;
    }
    throw new Error("Missing permission to modify");
  }

  get deleted() {
    return !files.get(this);
  }
  get path() {
    const file = files.get(this);
    const directory = directoryLink.get(this);
    if (!file) throw new Error("File has been deleted!");
    if (!directory) throw new Error("Corrupted file!");
    return `${directory.path}/${file.name}`;
  }
  get size() {
    const file = files.get(this);
    if (!file) throw new Error("File has been deleted!");
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
  const notAllowed = notValidCharacters.split("");
  let newString = "";
  for (const char of name.split("")) {
    if (!notAllowed.includes(char)) {
      newString += char;
    }
  }
  return newString;
}

function isValidName(name: string) {
  if (typeof name !== "string") return result(`${typeof name} are not valid names. Expected string!`);
  if (!name.length) return result("Name must at least one character long!");
  const maxCharactersInFolder = 256;
  if (name.length > maxCharactersInFolder)
    return result(`Name cannot be longer than ${maxCharactersInFolder} one character long!`);
  const regExp = new RegExp(escapeRegExp(notValidCharacters), "ig");
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
  metadata: ContentMetaData;
}

interface ObjectFile {
  name: string;
  permission: ObjectPermission;
  content: string;
  type: FileData["type"];
}

interface ObjectPermission {
  [key: number]: number;
}

export function objectifyDirectory(directory: FileSystemDirectory, systemPermission = everyone): ObjectDirectory {
  const data = directoriesMap.get(directory);
  if (!data) throw new Error(directoryDeleted);
  const name = directory.name;
  const metadata = directory.getMetadata(undefined, systemPermission);
  const contents = directory
    .contents(systemPermission)
    .map(f => objectifyDirectoryFile(f, systemPermission))
    .filter(e => e);
  const permission = objectifyPermission(data.permission);

  return { name, contents, permission, metadata };
}

function objectifyFile(file: FileSystemFile, systemPermission = everyone): ObjectFile {
  const data = files.get(file);
  if (!data) throw new Error("File has been deleted!");
  const content = stringifyAnything(file.getContent(systemPermission));
  const type = file.getType(systemPermission);
  if (type === "lindowApp" || type === "lindowObject") {
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
  if (!data) throw new Error("Something went horribly wrong!");
  const permissionsEntires = Object.entries(objDir.permission);
  for (const [a, b] of permissionsEntires) {
    const hash = parseInt(a);
    const permissionEnum = parseInt(b);
    if (isNaN(hash) || isNaN(permissionEnum)) throw Error("Unable to convert permissions!");
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
  if (objFile.type === "json") {
    try {
      const conContent = JSON.parse(content);
      content = conContent;
    } catch (error) {
      DEV && console.error("Unable to parse JSON", content);
    }
  }

  const file = await root.createFile(objFile.name, objFile.type, content, owner);
  const data = files.get(file);
  if (!data) throw new Error("Something went horribly wrong!");
  const permissionsEntires = Object.entries(objFile.permission);
  for (const [a, b] of permissionsEntires) {
    const hash = parseInt(a);
    const permissionEnum = parseInt(b);
    if (isNaN(hash) || isNaN(permissionEnum)) throw Error("Unable to convert permissions!");
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
    case "string":
      return unknown;
    case "boolean":
      return unknown ? "true" : " false";
    case "number":
      return `${unknown}`;
    case "object":
      try {
        const json = JSON.stringify(unknown);
        return json;
      } catch (error) {
        /* ignored */
      }
      return `${unknown}`;
  }
  return "null";
}

let alreadyRequested = false;
export function requestSystemSymbol() {
  if (alreadyRequested) {
    return;
  }
  alreadyRequested = true;
  return systemSymbol;
}

export class FileSystemError extends Error {
  constructor(message: string, code: number) {
    super(message);
    Object.defineProperty(this, "code", {
      get() {
        return code;
      },
    });
  }
  get code() {
    return 0;
  }
}

export enum FileSystemErrorCode {
  ContentDoesNotExist = 1,
  MissingReadPermission = 2,
  MissingWritePermission = 3,
}
