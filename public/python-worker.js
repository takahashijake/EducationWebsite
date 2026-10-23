/* The runtime is loaded only inside a disposable, same-origin Web Worker.
   This Worker is NOT a strong sandbox for hostile Python/JavaScript. */
let python;
let currentId;
let used = 0;
let truncated = false;
let limit = 20000;
let pending = { stdout: "", stderr: "" };
const decoders = { stdout: new TextDecoder(), stderr: new TextDecoder() };
function flush(channel) {
  if (pending[channel]) {
    self.postMessage({
      type: "output",
      id: currentId,
      channel,
      text: pending[channel],
    });
    pending[channel] = "";
  }
}
function capture(channel, bytes) {
  const text = decoders[channel].decode(bytes, { stream: true });
  const remaining = Math.max(0, limit - used);
  const kept = text.slice(0, remaining);
  used += kept.length;
  if (kept.length < text.length && !truncated) {
    truncated = true;
    self.postMessage({ type: "output-limit", id: currentId });
  }
  pending[channel] += kept;
  // Deliver each flushed write before Stop or a deadline terminates the Worker.
  flush(channel);
  return bytes.length;
}
self.onmessage = async ({ data }) => {
  currentId = data.id;
  if (data.type === "init") {
    try {
      importScripts(`${data.assetBase}pyodide.js`);
      python = await self.loadPyodide({ indexURL: data.assetBase });
      if (python.version !== data.version)
        throw new Error("Runtime version does not match the application pin");
      const response = await fetch("/python-harness.py");
      if (!response.ok)
        throw new Error(`Harness download failed (${response.status})`);
      await python.runPythonAsync(await response.text());
      // unittest.mock is part of this pinned runtime's standard library.
      await python.runPythonAsync("from unittest.mock import patch");
      self.postMessage({ type: "ready", id: currentId });
    } catch (error) {
      self.postMessage({
        type: "load-error",
        id: currentId,
        error: String(error),
      });
    }
    return;
  }
  if (data.type !== "execute" || !python) return;
  limit = data.outputLimit;
  python.setStdout({ write: (bytes) => capture("stdout", bytes) });
  python.setStderr({ write: (bytes) => capture("stderr", bytes) });
  python.setStdin({ stdin: () => null });
  try {
    python.globals.set("_lab_payload_json", JSON.stringify(data.request));
    const raw = await python.runPythonAsync(
      "execute_payload(json.loads(_lab_payload_json))",
    );
    flush("stdout");
    flush("stderr");
    const result = JSON.parse(raw);
    // Bound tracebacks and assertion messages as well as ordinary output.
    result.error = result.error?.slice(0, limit);
    for (const test of result.tests) test.error = test.error?.slice(0, 4000);
    self.postMessage({ type: "result", id: currentId, result, truncated });
  } catch (error) {
    flush("stdout");
    flush("stderr");
    self.postMessage({
      type: "engine-error",
      id: currentId,
      error: String(error).slice(0, limit),
    });
  }
};
