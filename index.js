
// const fs = require("fs");
// const path = require("path");
// const moment = require("moment");
// const logsPath = path.join(__dirname, "logs.txt");

// const overrieds = ["debug", "log", "warn", "info", "error"];

// class Stringify {
//   constructor(anything, ignoreEmpty) {
//     this.anything = anything;
//     this.ignoreEmpty = ignoreEmpty;
//     this.MAX_DEPTH = 100;
//     this.map = new Map();
//   }
//   process() {
//     if (this._result) return this._result;
//     this._result = this.stringify(this.anything);
//     return this._result;
//   }
//   stringify(something) {
//     if (this.map.size === this.MAX_DEPTH) return "<Failed: object to large>";
//     const r = this.map.get(something);
//     if (r) return r;
//     if (something === null) return "null";
//     const type = typeof something;
//     switch (type) {
//       case "string":
//         return something;
//       case "number":
//       case "bigint":
//         return something.toString();
//       case "undefined":
//         return "undefined";
//       case "symbol":
//         return "Symbol()";
//       case "function":
//         const fun = something;
//         try {
//           const name = fun.name || "<anonymous>";
//           return `${name}()`;
//         } catch (error) {
//           return `function();`;
//         }
//       case "object":
//         this.map.set(something, "<repeated>");
//         if (Array.isArray(something)) {
//           if (something.length === 0) {
//             const result = this.ignoreEmpty ? "" : "[]";
//             this.map.set(something, result);
//             return result;
//           }
//           const result = `[\n${something.map(e => `   ${this.stringify(e)}`).join("\n")}]\n`;
//           this.map.set(something, result);
//           return result;
//         }
//         try {
//           const keys = Object.keys(something);
//           if (keys.length === 0) {
//             const result = this.ignoreEmpty ? "" : "{}";
//             this.map.set(something, result);
//             return result;
//           }
//           const mapped = keys.map(k => `${k} : ${this.stringify(something[k])}`).join("\n");
//           const result = `{\n${mapped}\n}`;
//           this.map.set(something, result);
//           return result;
//         } catch (error) {
//           return `<Failed: ${error.message}>`;
//         }
//       default:
//         return "<unknwon>";
//     }
//   }
//   get result() {
//     return this._result;
//   }
//   static do(something, ignoreEmpty = false) {
//     const string = new Stringify(something, ignoreEmpty);
//     return string.process();
//   }
// }

// for (const key of overrieds) {
//   const org = console[key];
//   console[key] = function (...args) {
//     const date = moment.utc().toDate();
//     const dateText = moment(date).format("MMMM Do YYYY, HH:mm:ss");
//     const string = `${key} ${dateText}: ${args.map(e => Stringify.do(e)).join("  ")}\n`;
//     fs.appendFile(logsPath, string, "utf-8", err => {
//       if (err) {
//         fs.watchFile(logsPath, string, "utf-8", err => {
//           return;
//         });
//       }
//     });
//     org(key);
//     org.apply(this, args);
//   };
// }

require("./dist/server/main");
