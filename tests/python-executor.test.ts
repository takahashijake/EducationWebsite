import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PythonExecutor,
  type WorkerPort,
} from "@/lib/execution/python-executor";
import {
  INITIALIZATION_DEADLINE_MS,
  OUTPUT_LIMIT,
  SOURCE_LIMIT,
  type ExecutionRequest,
} from "@/lib/execution/python-types";
class FakeWorker {
  onmessage: WorkerPort["onmessage"] = null;
  onerror: WorkerPort["onerror"] = null;
  onmessageerror: WorkerPort["onmessageerror"] = null;
  messages: Record<string, unknown>[] = [];
  terminate = vi.fn();
  postMessage(message: Record<string, unknown>) {
    this.messages.push(message);
  }
  emit(data: object) {
    this.onmessage?.call(
      this as unknown as Worker,
      new MessageEvent("message", {
        data: {
          id: this.messages.findLast((message) => message.type === "init")!.id,
          ...data,
        },
      }),
    );
  }
}
const request: ExecutionRequest = {
  language: "python",
  source: "print('hello')",
};
afterEach(() => vi.useRealTimers());
describe("disposable Python execution adapter", () => {
  it("initializes lazily, reports ready/running, captures bounded streams, and terminates even after success", async () => {
    const worker = new FakeWorker();
    const factory = vi.fn(() => worker);
    const engine = new PythonExecutor(factory);
    expect(factory).not.toHaveBeenCalled();
    const events = vi.fn();
    const done = engine.execute(request, events);
    expect(events).toHaveBeenCalledWith({ state: "initializing" });
    worker.emit({ type: "ready" });
    expect(events).toHaveBeenCalledWith({ state: "ready" });
    expect(events).toHaveBeenCalledWith({ state: "running" });
    worker.emit({ type: "output", channel: "stdout", text: "hello\n" });
    worker.emit({ type: "output", channel: "stderr", text: "warning\n" });
    worker.emit({ type: "result", result: { kind: "success", tests: [] } });
    expect(await done).toMatchObject({
      kind: "success",
      stdout: "hello\n",
      stderr: "warning\n",
    });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
  it("cancels an infinite computation, ignores late messages, and starts the next request with a new Worker", async () => {
    const workers: FakeWorker[] = [];
    const engine = new PythonExecutor(() => {
      const worker = new FakeWorker();
      workers.push(worker);
      return worker;
    });
    const first = engine.execute(
      { ...request, source: "while True: pass" },
      vi.fn(),
    );
    workers[0].emit({ type: "ready" });
    const late = workers[0].onmessage!;
    engine.cancel();
    expect((await first).kind).toBe("cancelled");
    expect(workers[0].terminate).toHaveBeenCalled();
    const events = vi.fn();
    const second = engine.execute(request, events);
    const count = events.mock.calls.length;
    late.call(
      workers[0] as unknown as Worker,
      new MessageEvent("message", {
        data: {
          id: workers[0].messages[0].id,
          type: "result",
          result: { kind: "success", tests: [] },
        },
      }),
    );
    expect(events).toHaveBeenCalledTimes(count);
    workers[1].emit({ type: "ready" });
    workers[1].emit({ type: "result", result: { kind: "success", tests: [] } });
    expect((await second).kind).toBe("success");
  });
  it("starts its configurable execution deadline after readiness and recovers after timeout", async () => {
    vi.useFakeTimers();
    const workers: FakeWorker[] = [];
    const engine = new PythonExecutor(() => {
      const w = new FakeWorker();
      workers.push(w);
      return w;
    });
    const first = engine.execute({ ...request, deadlineMs: 500 }, vi.fn());
    await vi.advanceTimersByTimeAsync(1000);
    expect(workers[0].terminate).not.toHaveBeenCalled();
    workers[0].emit({ type: "ready" });
    await vi.advanceTimersByTimeAsync(500);
    expect((await first).kind).toBe("timeout");
    const second = engine.execute(request, vi.fn());
    workers[1].emit({ type: "ready" });
    workers[1].emit({ type: "result", result: { kind: "success", tests: [] } });
    expect((await second).kind).toBe("success");
  });
  it("handles loading errors, initialization deadlines and unavailable Workers", async () => {
    vi.useFakeTimers();
    const w = new FakeWorker();
    const engine = new PythonExecutor(() => w);
    const failed = engine.execute(request, vi.fn());
    w.emit({ type: "load-error", error: "download failed" });
    expect(await failed).toMatchObject({
      kind: "loading-error",
      error: "download failed",
    });
    const timeout = engine.execute(request, vi.fn());
    await vi.advanceTimersByTimeAsync(INITIALIZATION_DEADLINE_MS);
    expect((await timeout).kind).toBe("loading-error");
    expect(
      (
        await new PythonExecutor(() => {
          throw Error("Worker blocked");
        }).execute(request, vi.fn())
      ).kind,
    ).toBe("loading-error");
  });
  it("rejects oversized source before constructing a Worker and bounds output", async () => {
    const w = new FakeWorker();
    const factory = vi.fn(() => w);
    const engine = new PythonExecutor(factory);
    expect(
      (
        await engine.execute(
          { ...request, source: "x".repeat(SOURCE_LIMIT + 1) },
          vi.fn(),
        )
      ).kind,
    ).toBe("source-limit");
    expect(factory).not.toHaveBeenCalled();
    expect(
      (await engine.execute({ ...request, stdin: "x".repeat(4001) }, vi.fn()))
        .kind,
    ).toBe("source-limit");
    expect(factory).not.toHaveBeenCalled();
    const done = engine.execute(request, vi.fn());
    w.emit({ type: "ready" });
    w.emit({
      type: "output",
      channel: "stdout",
      text: "x".repeat(OUTPUT_LIMIT + 50),
    });
    w.emit({ type: "result", result: { kind: "success", tests: [] } });
    const result = await done;
    expect(result.stdout).toHaveLength(OUTPUT_LIMIT);
    expect(result.truncated).toBe(true);
  });
  it("does not equate successful execution or incomplete responses with passing authored tests", async () => {
    const w = new FakeWorker();
    const engine = new PythonExecutor(() => w);
    const requestWithTests = {
      ...request,
      tests: [{ id: "boundary", code: "assert False" }],
    };
    const done = engine.execute(requestWithTests, vi.fn());
    w.emit({ type: "ready" });
    w.emit({ type: "result", result: { kind: "success", tests: [] } });
    expect(await done).toMatchObject({ kind: "worker-error", tests: [] });
    const failure = engine.execute(requestWithTests, vi.fn());
    w.emit({ type: "ready" });
    w.emit({
      type: "result",
      result: {
        kind: "success",
        tests: [{ id: "boundary", status: "failed", error: "AssertionError" }],
      },
    });
    expect((await failure).kind).toBe("test-failure");
  });
  it("rejects malformed check rows and retains output-limit evidence on timeout", async () => {
    vi.useFakeTimers();
    const worker = new FakeWorker();
    const engine = new PythonExecutor(() => worker);
    const malformed = engine.execute(
      { ...request, tests: [{ id: "one", code: "assert True" }] },
      vi.fn(),
    );
    worker.emit({ type: "ready" });
    worker.emit({ type: "result", result: { kind: "success", tests: [null] } });
    expect((await malformed).kind).toBe("worker-error");
    const timeout = engine.execute({ ...request, deadlineMs: 100 }, vi.fn());
    worker.emit({ type: "ready" });
    worker.emit({ type: "output-limit" });
    await vi.advanceTimersByTimeAsync(100);
    expect(await timeout).toMatchObject({ kind: "timeout", truncated: true });
  });
  it("cancels on dispose and when another lab takes ownership", async () => {
    const a = new PythonExecutor(() => new FakeWorker());
    const b = new PythonExecutor(() => new FakeWorker());
    const first = a.execute(request, vi.fn());
    const second = b.execute(request, vi.fn());
    expect((await first).kind).toBe("cancelled");
    b.dispose();
    expect((await second).kind).toBe("cancelled");
  });
});

it("settles and terminates if dispatching execution to the Worker fails", async () => {
  const worker = new FakeWorker();
  const engine = new PythonExecutor(() => worker);
  const done = engine.execute(request, vi.fn());
  worker.postMessage = () => {
    throw new Error("Worker port closed");
  };
  try {
    expect(() => worker.emit({ type: "ready" })).not.toThrow();
    expect(await done).toMatchObject({
      kind: "worker-error",
      error: "Error: Worker port closed",
    });
    expect(worker.terminate).toHaveBeenCalledOnce();
  } finally {
    engine.dispose();
  }
});
