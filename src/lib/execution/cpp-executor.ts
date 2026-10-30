import {
  COMPILE_DEADLINE_MS,
  INPUT_LIMIT,
  OUTPUT_LIMIT,
  RUN_DEADLINE_MS,
  SOURCE_LIMIT,
  type ExecutionEngine,
  type ExecutionEvent,
  type ExecutionRequest,
  type ProgramResult,
} from "./types";
import { appResourceUrl } from "../app-resource-url";

export type WorkerPort = Pick<
  Worker,
  "postMessage" | "terminate" | "onmessage" | "onerror" | "onmessageerror"
>;
const blank = (kind: ProgramResult["kind"], error?: string): ProgramResult => ({
  kind,
  error,
  stdout: "",
  stderr: "",
  diagnostics: "",
});
let cancelActive: (() => void) | undefined;
let requestId = 0;

export class CppExecutor implements ExecutionEngine {
  private stop?: () => void;
  private generation = 0;
  constructor(
    private createWorker: () => WorkerPort = () =>
      new Worker(appResourceUrl("/cpp/worker.js"), { type: "module" }),
  ) {}

  private job(
    message: Record<string, unknown>,
    deadline: number,
  ): Promise<{ result: ProgramResult; module?: WebAssembly.Module }> {
    return new Promise((resolve) => {
      let worker: WorkerPort;
      try {
        worker = this.createWorker();
      } catch (error) {
        resolve({ result: blank("loading-error", String(error)) });
        return;
      }
      const id = ++requestId;
      const result = blank("success");
      let done = false;
      const finish = (value: {
        result: ProgramResult;
        module?: WebAssembly.Module;
      }) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        worker.terminate();
        this.stop = undefined;
        resolve(value);
      };
      const fail = (kind: ProgramResult["kind"], error: string) =>
        finish({ result: { ...result, kind, error } });
      const timer = setTimeout(
        () =>
          fail(
            "timeout",
            message.type === "compile"
              ? "Compilation exceeded 60 seconds. Try a smaller program or retry."
              : "Execution exceeded 2 seconds. Check the loop condition and update.",
          ),
        deadline,
      );
      this.stop = () =>
        fail("cancelled", "Execution stopped. Retry starts a fresh Worker.");
      worker.onerror = (event) => {
        event.preventDefault?.();
        fail(
          "loading-error",
          event.message ||
            "Unable to load the C++ runtime. Retry after checking the connection.",
        );
      };
      worker.onmessageerror = () =>
        fail("runtime-error", "Unreadable Worker response.");
      worker.onmessage = ({ data }) => {
        if (done || !data || data.id !== id) return;
        if (
          data.type === "output" &&
          (data.channel === "stdout" || data.channel === "stderr") &&
          typeof data.text === "string"
        ) {
          const remaining =
            OUTPUT_LIMIT - result.stdout.length - result.stderr.length;
          result[data.channel as "stdout" | "stderr"] += data.text.slice(
            0,
            remaining,
          );
          if (data.text.length > remaining)
            fail("output-limit", "Output exceeded 20,000 characters.");
        } else if (
          data.type === "compiled" &&
          message.type === "compile" &&
          (data.module === null || data.module instanceof WebAssembly.Module) &&
          typeof data.diagnostics === "string"
        ) {
          result.diagnostics = data.diagnostics.slice(0, OUTPUT_LIMIT);
          result.kind = data.module ? "success" : "compilation-error";
          finish({ result, module: data.module ?? undefined });
        } else if (
          data.type === "exit" &&
          message.type === "run" &&
          Number.isInteger(data.exitCode)
        ) {
          finish({
            result: {
              ...result,
              exitCode: data.exitCode,
              kind: data.exitCode === 0 ? "success" : "runtime-error",
            },
          });
        } else if (data.type === "error" && typeof data.error === "string") {
          fail(
            data.error.includes("Output size limit")
              ? "output-limit"
              : message.type === "compile"
                ? "loading-error"
                : "runtime-error",
            data.error.slice(0, OUTPUT_LIMIT),
          );
        } else {
          fail(
            "runtime-error",
            "Unexpected Worker response. No tests were credited.",
          );
        }
      };
      try {
        worker.postMessage({ ...message, id });
      } catch (error) {
        fail("loading-error", String(error));
      }
    });
  }

  async execute(
    request: ExecutionRequest,
    onEvent: (event: ExecutionEvent) => void,
  ) {
    cancelActive?.();
    this.cancel();
    const generation = this.generation;
    if (
      request.source.length > SOURCE_LIMIT ||
      !request.inputs.length ||
      request.inputs.length > 12 ||
      request.inputs.some((input) => input.length > INPUT_LIMIT)
    ) {
      return [
        blank(
          "source-limit",
          "Use at most 24,000 source characters, 4,000 input characters, and 12 cases.",
        ),
      ];
    }
    const cancel = () => this.cancel();
    cancelActive = cancel;
    try {
      onEvent({ state: "compiling" });
      const compiled = await this.job(
        { type: "compile", source: request.source },
        COMPILE_DEADLINE_MS,
      );
      if (!compiled.module) return [compiled.result];
      const results: ProgramResult[] = [];
      for (const [caseIndex, stdin] of request.inputs.entries()) {
        if (generation !== this.generation)
          return [...results, blank("cancelled")];
        onEvent({ state: "running", caseIndex });
        const { result } = await this.job(
          { type: "run", module: compiled.module, stdin },
          RUN_DEADLINE_MS,
        );
        results.push({ ...result, diagnostics: compiled.result.diagnostics });
        if (result.kind === "cancelled") break;
      }
      return results;
    } finally {
      if (cancelActive === cancel) cancelActive = undefined;
    }
  }
  cancel() {
    this.generation++;
    this.stop?.();
  }
  dispose() {
    this.cancel();
  }
}
