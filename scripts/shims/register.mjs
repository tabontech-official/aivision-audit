// tsx/node module alias: resolve "server-only" to an empty shim for CLI scripts
import Module from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const shim = path.join(__dirname, "server-only.js");
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  if (request === "server-only") return shim;
  return origResolve.call(this, request, ...args);
};
