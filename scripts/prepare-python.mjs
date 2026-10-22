import { createRequire } from "node:module";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
const require = createRequire(import.meta.url);
const root = dirname(require.resolve("pyodide/package.json"));
const { version } = JSON.parse(
  await readFile(resolve(root, "package.json"), "utf8"),
);
const config = JSON.parse(
  await readFile(new URL("../python-runtime.json", import.meta.url), "utf8"),
);
if (version !== config.version)
  throw new Error("Pyodide package and runtime pin differ");
const destination = new URL(`../public/python/${version}/`, import.meta.url);
await mkdir(destination, { recursive: true });
for (const file of [
  "pyodide.js",
  "pyodide.asm.js",
  "pyodide.asm.wasm",
  "python_stdlib.zip",
  "pyodide-lock.json",
]) {
  await copyFile(resolve(root, file), new URL(file, destination));
}
console.log(`Prepared same-origin Pyodide ${version} assets.`);
