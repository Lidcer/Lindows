import { internal } from "../../services/internals/Internal";
import { BaseCommand, ExecutionParameters as ExecutionData } from "./BaseCommand";
import { Cd } from "./Cd";
import { HelpCommand } from "./Help";
import { LsCommand } from "./Ls";
import { Start } from "./Start";
import { Sudo } from "./Sudo";
import { Take } from "./Take";
import { CommandTester } from "./CommandTester";
import { Grep } from "./Grep";
import { createKeyboardEvent } from "../../utils/util";
import { MkDir } from "./Mkdir";
import { EchoCommand } from "./Echo";
import { Cat } from "./Cat";
import {
  everyone,
  FileSystemDirectory,
  FileSystemFile,
  isDirectory,
  isNameValid,
  StringSymbol,
} from "../../utils/FileSystemDirectory";
import { attachToWindowIfDev } from "../requests";

export interface CommandForExecute {
  entry: string;
  command: string;
  object: typeof BaseCommand;
  pipes?: CommandForExecute[];
}

export async function installCommand(command: BaseCommand, name: string, owner = everyone) {
  const validName = isNameValid(name);
  if (!validName.valid) {
    throw new Error(validName.reason);
  }
  if (!/^[a-z]+$/gi.test(name)) {
    throw new Error("Invalid name");
  }
  const system = internal.processor.symbol;
  const directories = internal.fileSystem.root.contents(system);
  const bin = directories.find(b => isDirectory(b) && b.name === "bin") as FileSystemDirectory;
  if (!bin) throw new Error("Corrupted file system");
  const cmd = bin.contents(system).find(b => isDirectory(b) && b.name === "cmd") as FileSystemDirectory;
  if (!cmd) throw new Error("Corrupted file system");
  const contents = cmd.contents(system);
  const existing = contents.find(c => c.name.toLowerCase() == name.toLowerCase());
  if (existing && !isDirectory(existing)) {
    throw new Error("Command already installed!");
  } else if (existing) {
    throw new Error("Failed to install command under this name!");
  }
  return await cmd.createFile(name.toLowerCase(), "lindowObject", command, owner);
}

export async function installSystemCommand(command: BaseCommand | any, name: string, system: StringSymbol) {
  if (system.getHash !== internal.processor.symbol.getHash) {
    throw new Error("You do not have admin permission to install this command");
  }
  return installCommand(command, name, system);
}

export function uninstallCommand(name: string, owner = everyone) {
  const system = internal.processor.symbol;
  const directories = internal.fileSystem.root.contents(system);
  const bin = directories.find(b => isDirectory(b) && b.name === "bin") as FileSystemDirectory;
  if (!bin) throw new Error("Corrupted file system");
  const cmd = bin.contents(system).find(b => isDirectory(b) && b.name === "cmd") as FileSystemDirectory;
  if (!cmd) throw new Error("Corrupted file system");
  const contents = cmd.contents(system);

  const existing = contents.find(c => c.name.toLowerCase() == name.toLowerCase());
  if (!existing) {
    throw new Error("Command is not installed!");
  }
  if (!isDirectory(existing)) {
    existing.deleteFile(owner);
  } else {
    throw new Error("File is a directory");
  }
}

export async function installPreInstalledCommands() {
  await installSystemCommand(HelpCommand, "help", internal.processor.symbol);
  await installSystemCommand(Grep, "grep", internal.processor.symbol);
  await installSystemCommand(Sudo, "sudo", internal.processor.symbol);
  await installSystemCommand(Start, "start", internal.processor.symbol);
  await installSystemCommand(LsCommand, "ls", internal.processor.symbol);
  await installSystemCommand(Cd, "cd", internal.processor.symbol);
  await installSystemCommand(MkDir, "mkdir", internal.processor.symbol);
  await installSystemCommand(EchoCommand, "echo", internal.processor.symbol);
  await installSystemCommand(Cat, "cat", internal.processor.symbol);
  if (DEV) {
    await installSystemCommand(CommandTester, "dev", internal.processor.symbol);
    await installSystemCommand(Take, "take", internal.processor.symbol);
  }
}

export function getCommand(commandName: string) {
  const system = internal.processor.symbol;
  const directories = internal.fileSystem.root.contents(system);
  const bin = directories.find(b => isDirectory(b) && b.name === "bin") as FileSystemDirectory;
  if (!bin) throw new Error("Corrupted file system");
  const cmd = bin.contents(system).find(b => isDirectory(b) && b.name === "cmd") as FileSystemDirectory;
  if (!cmd) throw new Error("Corrupted file system");
  const contents = cmd.contents(system);
  const command = contents.find(c => !isDirectory(c) && c.name === commandName) as FileSystemFile;
  if (command) {
    return command.getContent(system) as typeof BaseCommand;
  }
  return null;
}

export interface CommandResponse {
  addHistory: (text: string) => void;
  update: (text: string) => void;
  finish: (text: string) => void;
}

function createExecutionData(useWindow = false): ExecutionData {
  const object: ExecutionData = {
    directory: internal.fileSystem.home,
  };
  if (useWindow) {
    object.width = window.innerWidth;
    object.height = window.innerHeight;
  }
  return object;
}

export function executeCommand(text: string, response: CommandResponse, object?: ExecutionData) {
  if (!object) {
    object = createExecutionData();
  }

  const commands = text.split("&&");
  const validCommands = commands.map(c => {
    c = c.trim();
    const pipes = c.split("||").map(c => c.trim());
    pipes.shift();

    const executablePipes: CommandForExecute[] = [];

    for (const pipe of pipes) {
      const cmd = pipe.split(" ")[0];
      executablePipes.push({
        entry: pipe,
        command: cmd,
        object: getCommand(cmd),
      });
    }

    const cmd = c.split(" ")[0];
    const executable: CommandForExecute = {
      entry: c,
      command: cmd,
      object: getCommand(cmd),
      pipes: executablePipes,
    };
    return executable;
  }) as CommandForExecute[];
  const notValidCommand = validCommands.find(c => c.object === null);
  const notValidPipe = validCommands.find(c => c.pipes.find(p => p.object === null));
  if (notValidCommand) {
    response.addHistory(`${notValidCommand.command}: command not found`);
  } else if (notValidPipe) {
    const invalidPipe = notValidPipe.pipes.find(p => p.object === null);
    response.addHistory(`${invalidPipe.command}: command not found`);
  } else {
    return executeCommands(validCommands as Required<CommandForExecute>[], response, object);
  }
}

function executeCommands(commands: Required<CommandForExecute>[], response: CommandResponse, object: ExecutionData) {
  if (!response) throw new Error(`Expected response object`);
  const responseValidator = (key: string) => {
    if (!response[key]) throw new Error(`Expected function ${key}`);
    const type = typeof response[key];
    if (type !== "function") throw new Error(`Expected function ${key} got ${type}`);
  };
  const validate = ["addHistory", "update", "finish"];
  validate.forEach(e => responseValidator(e));

  const command = commands.shift();
  let executor: BaseCommand;
  let result = -1;
  try {
    executor = new command.object(command.entry);
  } catch (error) {
    throw new Error(`An error occurred while trying to execute this command! ${error.message}`);
  }

  executor.addHistory = text => {
    let textToAdd = "";
    if (text) {
      textToAdd = text;
    }
    response.addHistory(textToAdd);
  };
  executor.update = text => {
    response.update(text);
  };
  executor.finish = text => {
    setTimeout(() => {
      let textToPush = "";
      if (text) {
        textToPush = text;
      }

      while (command.pipes.length) {
        const pipe = command.pipes.shift();
        textToPush = new pipe.object(pipe.entry, textToPush).pipe(object);
      }
      response.finish(textToPush);
      if (commands.length && result === 0) {
        return executeCommands(commands, response, object);
      }
    });
  };
  (async () => {
    try {
      result = await executor.execute(object);
    } catch (error) {
      response.finish(`An error occurred while trying to execute this command! ${error.message}`);
    }
  })();
  return {
    signalKill: (text: string) => {
      executor.signalKill(text);
    },
    signalTerm: (text: string) => {
      executor.signalTerminate(text);
    },
    inputKeyboard: (text: string) => {
      for (const character of text) {
        const keyEvent = createKeyboardEvent(character);
        executor.signalInput(keyEvent);
      }
    },
  };
}

function mockExecuter(command: string) {
  if (typeof command !== "string") {
    throw new Error(`Expected string got ${typeof command}`);
  } else if (!command.length) {
    return;
  }

  const response: CommandResponse = {
    finish: text => {
      console.log(text);
      setTimeout(() => {
        (window as any).command = mockExecuter;
      });
    },
    addHistory: text => {
      console.info(text);
    },
    update: text => {
      console.log(text);
    },
  };
  const object = executeCommand(command, response);
  if (object) {
    (window as any).command = object;
  }
}

(window as any).command = mockExecuter;
