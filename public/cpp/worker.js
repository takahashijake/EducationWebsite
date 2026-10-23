import { WASI, File, OpenFile, ConsoleStdout } from "./wasi.js";

const OUTPUT_LIMIT = 20000;
const SOURCE_LIMIT = 24000;
const INPUT_LIMIT = 4000;
const allowedImports = new Set([
  "args_get",
  "args_sizes_get",
  "environ_get",
  "environ_sizes_get",
  "fd_close",
  "fd_fdstat_get",
  "fd_fdstat_set_flags",
  "fd_filestat_get",
  "fd_read",
  "fd_seek",
  "fd_tell",
  "fd_write",
  "fd_prestat_get",
  "fd_prestat_dir_name",
  "path_open",
  "proc_exit",
  "proc_raise",
  "sched_yield",
]);

self.onmessage = async ({ data }) => {
  const { id, type } = data;
  try {
    if (type === "compile") {
      if (typeof data.source !== "string" || data.source.length > SOURCE_LIMIT)
        throw new Error("Source size limit exceeded.");
      const { compile } = await import("./runtime/index.js");
      const { module, compileOutput } = await compile({
        source: data.source,
        fileName: "main.cpp",
        flags: [
          "-std=c++17",
          "-O0",
          "-fno-exceptions",
          "-Wall",
          "-Wextra",
          "-ferror-limit=5",
          "-fno-color-diagnostics",
          "-Wl,--max-memory=67108864",
          "-Wl,-z,stack-size=1048576",
        ],
      });
      self.postMessage({
        id,
        type: "compiled",
        module,
        diagnostics: compileOutput.slice(0, OUTPUT_LIMIT),
      });
    } else if (type === "run") {
      if (typeof data.stdin !== "string" || data.stdin.length > INPUT_LIMIT)
        throw new Error("Input size limit exceeded.");
      for (const entry of WebAssembly.Module.imports(data.module)) {
        if (
          entry.module !== "wasi_snapshot_preview1" ||
          entry.kind !== "function" ||
          !allowedImports.has(entry.name)
        ) {
          throw new Error(
            `Unsupported program import: ${entry.module}.${entry.name}`,
          );
        }
      }
      let size = 0;
      const pending = { stdout: "", stderr: "" };
      const decoders = { stdout: new TextDecoder(), stderr: new TextDecoder() };
      function flush(channel, final = false) {
        if (final) pending[channel] += decoders[channel].decode();
        if (pending[channel]) {
          self.postMessage({
            id,
            type: "output",
            channel,
            text: pending[channel],
          });
          pending[channel] = "";
        }
      }
      const output = (channel) =>
        new ConsoleStdout((bytes) => {
          if (size + bytes.length > OUTPUT_LIMIT)
            throw new Error("Output size limit exceeded.");
          size += bytes.length;
          pending[channel] += decoders[channel].decode(bytes, { stream: true });
          if (pending[channel].length >= 1024) flush(channel);
        });
      const wasi = new WASI(
        ["program"],
        [],
        [
          new OpenFile(new File(new TextEncoder().encode(data.stdin))),
          output("stdout"),
          output("stderr"),
        ],
      );
      const imports = Object.fromEntries(
        [...allowedImports].map((name) => [name, wasi.wasiImport[name]]),
      );
      const instance = await WebAssembly.instantiate(data.module, {
        wasi_snapshot_preview1: imports,
      });
      let exitCode;
      try {
        exitCode = wasi.start(instance);
      } finally {
        flush("stdout", true);
        flush("stderr", true);
      }
      self.postMessage({ id, type: "exit", exitCode });
    }
  } catch (error) {
    self.postMessage({
      id,
      type: "error",
      error: String(error).slice(0, OUTPUT_LIMIT),
    });
  }
};
