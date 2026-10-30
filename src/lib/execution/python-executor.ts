import config from "../../../python-runtime.json";
import { appResourceUrl } from "../app-resource-url";
import {
  DEFAULT_DEADLINE_MS,
  INITIALIZATION_DEADLINE_MS,
  INPUT_LIMIT,
  OUTPUT_LIMIT,
  SOURCE_LIMIT,
  type ExecutionEngine,
  type ExecutionEvent,
  type ExecutionRequest,
  type ExecutionResult,
  type TestResult,
} from "./python-types";
export type WorkerPort = Pick<
  Worker,
  "postMessage" | "terminate" | "onmessage" | "onerror" | "onmessageerror"
>;
type ActiveJob = {
  worker: WorkerPort;
  finish: (result: ExecutionResult) => void;
  result: ExecutionResult;
};
let cancelActive: (() => void) | undefined;
let nextId = 0;
const blank = (
  kind: ExecutionResult["kind"],
  error?: string,
): ExecutionResult => ({
  kind,
  error,
  stdout: "",
  stderr: "",
  tests: [],
  truncated: false,
});
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;
/** UI-independent adapter. Every request gets a new interpreter, even after success. */
export class PythonExecutor implements ExecutionEngine {
  private active?: ActiveJob;
  constructor(
    private createWorker: () => WorkerPort = () =>
      new Worker(appResourceUrl("/python-worker.js")),
  ) {}
  execute(
    request: ExecutionRequest,
    onEvent: (event: ExecutionEvent) => void,
  ): Promise<ExecutionResult> {
    cancelActive?.();
    this.cancel();
    if (
      request.source.length > SOURCE_LIMIT ||
      (request.stdin?.length ?? 0) > INPUT_LIMIT
    ) {
      onEvent({ state: "failed" });
      return Promise.resolve(
        blank(
          "source-limit",
          `Source must be at most ${SOURCE_LIMIT} characters; scripted input at most ${INPUT_LIMIT}.`,
        ),
      );
    }
    return new Promise((resolve) => {
      const id = ++nextId;
      let worker: WorkerPort;
      try {
        worker = this.createWorker();
      } catch (error) {
        onEvent({ state: "failed" });
        resolve(blank("loading-error", String(error)));
        return;
      }
      let timer: ReturnType<typeof setTimeout>;
      let initialized = false;
      const cancelJob = () => this.cancel();
      const job: ActiveJob = {
        worker,
        result: blank("success"),
        finish: (result) => {
          if (this.active !== job) return;
          clearTimeout(timer);
          worker.terminate();
          this.active = undefined;
          if (cancelActive === cancelJob) cancelActive = undefined;
          onEvent({
            state:
              result.kind === "cancelled"
                ? "cancelled"
                : result.kind === "success" || result.kind === "test-failure"
                  ? "completed"
                  : "failed",
          });
          resolve(result);
        },
      };
      this.active = job;
      cancelActive = cancelJob;
      const fail = (kind: ExecutionResult["kind"], error: string) =>
        job.finish({ ...job.result, kind, error });
      onEvent({ state: "initializing" });
      timer = setTimeout(
        () =>
          fail(
            "loading-error",
            "Python initialization exceeded 30 seconds. Retry to download a fresh runtime.",
          ),
        INITIALIZATION_DEADLINE_MS,
      );
      worker.onerror = (event) => {
        event.preventDefault?.();
        fail(
          initialized ? "worker-error" : "loading-error",
          event.message || "The Python Worker failed. Retry with a new Worker.",
        );
      };
      worker.onmessageerror = () =>
        fail(
          "worker-error",
          "The Worker response could not be read. Retry the request.",
        );
      worker.onmessage = ({ data }: MessageEvent<unknown>) => {
        if (this.active !== job || !record(data) || data.id !== id) return;
        if (data.type === "ready" && !initialized) {
          clearTimeout(timer);
          initialized = true;
          onEvent({ state: "ready" });
          const deadline = Number.isFinite(request.deadlineMs)
            ? Math.max(100, Math.min(10000, request.deadlineMs!))
            : DEFAULT_DEADLINE_MS;
          timer = setTimeout(
            () =>
              fail(
                "timeout",
                `Execution exceeded ${deadline / 1000} seconds. The Worker was terminated; the next request starts fresh.`,
              ),
            deadline,
          );
          onEvent({ state: "running" });
          try {
            worker.postMessage({
              type: "execute",
              id,
              request,
              outputLimit: OUTPUT_LIMIT,
            });
          } catch (error) {
            fail("worker-error", String(error));
          }
        } else if (
          data.type === "output" &&
          (data.channel === "stdout" || data.channel === "stderr") &&
          typeof data.text === "string"
        ) {
          const channel = data.channel;
          const remaining = Math.max(
            0,
            OUTPUT_LIMIT - job.result.stdout.length - job.result.stderr.length,
          );
          job.result[channel] += data.text.slice(0, remaining);
          if (data.text.length > remaining) job.result.truncated = true;
          onEvent({
            state: "running",
            stdout: job.result.stdout,
            stderr: job.result.stderr,
          });
        } else if (data.type === "output-limit") {
          job.result.truncated = true;
        } else if (data.type === "load-error" || data.type === "engine-error") {
          fail(
            data.type === "load-error" ? "loading-error" : "worker-error",
            String(data.error).slice(0, OUTPUT_LIMIT),
          );
        } else if (data.type === "result" && record(data.result)) {
          const result = data.result;
          if (
            ![
              "success",
              "syntax-error",
              "runtime-error",
              "test-failure",
            ].includes(String(result.kind)) ||
            !Array.isArray(result.tests)
          ) {
            fail(
              "worker-error",
              "Incomplete execution result. No tests were credited.",
            );
            return;
          }
          const expected = request.tests ?? [];
          const rows = result.tests;
          const validRows = rows.every(
            (row) =>
              record(row) &&
              typeof row.id === "string" &&
              expected.some((t) => t.id === row.id) &&
              ["passed", "failed"].includes(String(row.status)) &&
              (row.error === undefined || typeof row.error === "string"),
          );
          const complete =
            validRows &&
            rows.length === expected.length &&
            new Set(rows.map((row) => row.id)).size === expected.length;
          if (
            !validRows ||
            ((result.kind === "success" || result.kind === "test-failure") &&
              !complete)
          ) {
            fail(
              "worker-error",
              "Incomplete test results. No tests were credited; run the authored checks again.",
            );
            return;
          }
          job.finish({
            ...job.result,
            kind:
              rows.some((r) => r.status === "failed") &&
              result.kind === "success"
                ? "test-failure"
                : (result.kind as ExecutionResult["kind"]),
            tests: rows.map((r) => ({
              id: r.id,
              status: r.status,
              error: r.error?.slice(0, 4000),
            })) as TestResult[],
            error:
              typeof result.error === "string"
                ? result.error.slice(0, OUTPUT_LIMIT)
                : undefined,
            truncated: job.result.truncated || data.truncated === true,
          });
        }
      };
      try {
        worker.postMessage({
          type: "init",
          id,
          assetBase: appResourceUrl(`/python/${config.version}/`),
          version: config.version,
        });
      } catch (error) {
        fail("loading-error", String(error));
      }
    });
  }
  cancel() {
    if (this.active)
      this.active.finish({
        ...this.active.result,
        kind: "cancelled",
        error: "Execution cancelled. Its Worker was terminated.",
      });
  }
  dispose() {
    this.cancel();
  }
}
