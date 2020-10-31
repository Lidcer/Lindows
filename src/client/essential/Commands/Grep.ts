import { escapeRegExp } from "lodash";
import { BaseCommand } from "./BaseCommand";

export class Grep extends BaseCommand {
  execute() {
    this.finish("you cannot use it like that!");
    return 1;
  }

  pipe() {
    if (!this.data) {
      return "Not supported!";
    }
    const reg = new RegExp(escapeRegExp(this.commandEntry), "gi");
    const result = this.data.match(reg);

    if (!result) return "";
    return result[0];
  }
}
