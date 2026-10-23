import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { build } from "esbuild";

// Reduce each compiler's declared linear-memory maximum to 256 MiB.
function capMemory(input) {
  let offset = 8;
  function read() {
    let value = 0,
      shift = 0,
      byte;
    do {
      byte = input[offset++];
      value += (byte & 127) * 2 ** shift;
      shift += 7;
    } while (byte & 128);
    return value;
  }
  function encode(value) {
    const bytes = [];
    do {
      const next = value >>> 7;
      bytes.push((value & 127) | (next ? 128 : 0));
      value = next;
    } while (value);
    return bytes;
  }
  while (offset < input.length) {
    const start = offset;
    const id = input[offset++];
    const size = read();
    const end = offset + size;
    if (id === 5) {
      if (read() !== 1 || read() !== 1)
        throw new Error("Unexpected compiler memory declaration");
      const initial = read();
      const maximum = read();
      if (initial > 4096 || offset !== end)
        throw new Error("Unsupported compiler memory limits");
      const section = [
        1,
        1,
        ...encode(initial),
        ...encode(Math.min(maximum, 4096)),
      ];
      return Buffer.concat([
        input.subarray(0, start),
        Buffer.from([5, ...encode(section.length), ...section]),
        input.subarray(end),
      ]);
    }
    offset = end;
  }
  throw new Error("Compiler memory not found");
}

await mkdir("public/cpp/runtime", { recursive: true });
for (const file of ["index.js", "clang.js", "lld.js", "sysroot.tar"]) {
  await cp(`node_modules/browsercc/dist/${file}`, `public/cpp/runtime/${file}`);
}
const runtimePath = "public/cpp/runtime/index.js";
const runtime = await readFile(runtimePath, "utf8");
const append = 'stderr += data + "\\n";';
if (runtime.split(append).length !== 4)
  throw new Error("Unexpected browsercc diagnostic collection");
await writeFile(
  runtimePath,
  runtime.replaceAll(
    append,
    'stderr = (stderr + data + "\\n").slice(0, 20000);',
  ),
);
for (const file of ["clang.wasm", "lld.wasm"]) {
  const bytes = capMemory(
    await readFile(`node_modules/browsercc/dist/${file}`),
  );
  if (!WebAssembly.validate(bytes)) throw new Error(`Invalid prepared ${file}`);
  await writeFile(`public/cpp/runtime/${file}`, bytes);
}
await cp(
  "node_modules/browsercc/LICENSE",
  "public/cpp/runtime/LICENSE.browsercc",
);
await build({
  stdin: {
    contents: 'export * from "@bjorn3/browser_wasi_shim";',
    resolveDir: process.cwd(),
  },
  bundle: true,
  format: "esm",
  outfile: "public/cpp/wasi.js",
  minify: true,
});
console.log("Prepared browsercc 0.1.1 and WASI assets (local files only).");
