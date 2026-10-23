import { afterEach, describe, expect, it, vi } from "vitest";
import { CppExecutor, type WorkerPort } from "@/lib/execution/cpp-executor";
import {
  COMPILE_DEADLINE_MS,
  OUTPUT_LIMIT,
  RUN_DEADLINE_MS,
} from "@/lib/execution/types";
import { evaluateCases, normalizeOutput } from "@/lib/coding-evaluation";
import { cppExercises } from "@/content/cpp-exercises";

class FakeWorker implements WorkerPort {
  onmessage: WorkerPort["onmessage"] = null;
  onerror: WorkerPort["onerror"] = null;
  onmessageerror: WorkerPort["onmessageerror"] = null;
  terminate = vi.fn();
  postMessage = vi.fn();
  send(data: Record<string, unknown>) {
    this.onmessage?.call(
      this as unknown as Worker,
      {
        data: { id: this.postMessage.mock.calls[0][0].id, ...data },
      } as MessageEvent,
    );
  }
}
const wasmModule = new WebAssembly.Module(
  new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]),
);
const request = {
  language: "cpp" as const,
  source: "int main(){}",
  inputs: ["3\n"],
};
function setup() {
  const workers: FakeWorker[] = [];
  const executor = new CppExecutor(() => {
    const worker = new FakeWorker();
    workers.push(worker);
    return worker;
  });
  return { executor, workers };
}
afterEach(() => vi.useRealTimers());
describe("C++ execution orchestration", () => {
  it("compiles once, isolates cases, retains streams and exit status, and keeps grading data outside workers", async () => {
    const { executor, workers } = setup();
    const promise = executor.execute(
      { ...request, inputs: ["3\n", "0\n"] },
      vi.fn(),
    );
    workers[0].send({
      type: "compiled",
      module: wasmModule,
      diagnostics: "warning",
    });
    await Promise.resolve();
    expect(workers[0].terminate).toHaveBeenCalledOnce();
    expect(workers[1].postMessage.mock.calls[0][0]).toMatchObject({
      type: "run",
      stdin: "3\n",
    });
    expect(workers[1].postMessage.mock.calls[0][0]).not.toHaveProperty(
      "expected",
    );
    workers[1].send({ type: "output", channel: "stdout", text: "6\n" });
    workers[1].send({ type: "output", channel: "stderr", text: "notice" });
    workers[1].send({ type: "exit", exitCode: 0 });
    await Promise.resolve();
    workers[2].send({ type: "exit", exitCode: 7 });
    const results = await promise;
    expect(results[0]).toMatchObject({
      kind: "success",
      stdout: "6\n",
      stderr: "notice",
      exitCode: 0,
      diagnostics: "warning",
    });
    expect(results[1]).toMatchObject({ kind: "runtime-error", exitCode: 7 });
    expect(
      workers.every((worker) => worker.terminate.mock.calls.length === 1),
    ).toBe(true);
  });
  it("returns authentic compilation diagnostics and starts no program on failure", async () => {
    const { executor, workers } = setup();
    const promise = executor.execute(request, vi.fn());
    workers[0].send({
      type: "compiled",
      module: null,
      diagnostics: "main.cpp:2: error: expected ';'",
    });
    expect((await promise)[0]).toMatchObject({
      kind: "compilation-error",
      diagnostics: expect.stringContaining("main.cpp:2"),
    });
    expect(workers).toHaveLength(1);
  });
  it("enforces independent compilation and execution deadlines", async () => {
    vi.useFakeTimers();
    const { executor, workers } = setup();
    const compiling = executor.execute(request, vi.fn());
    await vi.advanceTimersByTimeAsync(COMPILE_DEADLINE_MS);
    expect((await compiling)[0].kind).toBe("timeout");
    const running = executor.execute(request, vi.fn());
    workers[1].send({ type: "compiled", module: wasmModule, diagnostics: "" });
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(RUN_DEADLINE_MS);
    expect((await running)[0].kind).toBe("timeout");
    expect(workers[2].terminate).toHaveBeenCalledOnce();
  });
  it("cancels an older lab and ignores its late responses", async () => {
    const first = setup(),
      second = setup();
    const old = first.executor.execute(request, vi.fn());
    const current = second.executor.execute(request, vi.fn());
    first.workers[0].send({
      type: "compiled",
      module: wasmModule,
      diagnostics: "late",
    });
    expect((await old)[0].kind).toBe("cancelled");
    second.executor.dispose();
    expect((await current)[0].kind).toBe("cancelled");
    expect(first.workers).toHaveLength(1);
  });
  it("rejects source/input bounds before creating a worker", async () => {
    const { executor, workers } = setup();
    expect(
      (
        await executor.execute(
          { ...request, source: "x".repeat(24001) },
          vi.fn(),
        )
      )[0].kind,
    ).toBe("source-limit");
    expect(
      (
        await executor.execute(
          { ...request, inputs: ["x".repeat(4001)] },
          vi.fn(),
        )
      )[0].kind,
    ).toBe("source-limit");
    expect(
      (await executor.execute({ ...request, inputs: [] }, vi.fn()))[0].kind,
    ).toBe("source-limit");
    expect(workers).toHaveLength(0);
  });
  it("bounds output and terminates on protocol errors", async () => {
    const { executor, workers } = setup();
    const promise = executor.execute(request, vi.fn());
    workers[0].send({ type: "compiled", module: wasmModule, diagnostics: "" });
    await Promise.resolve();
    workers[1].send({
      type: "output",
      channel: "stdout",
      text: "x".repeat(OUTPUT_LIMIT + 10),
    });
    expect((await promise)[0]).toMatchObject({
      kind: "output-limit",
      stdout: "x".repeat(OUTPUT_LIMIT),
    });
    const broken = executor.execute(request, vi.fn());
    workers[2].send({ type: "exit", exitCode: 0 });
    expect((await broken)[0].kind).toBe("runtime-error");
  });
  it("handles unavailable workers without losing the draft", async () => {
    const executor = new CppExecutor(() => {
      throw new Error("blocked");
    });
    expect((await executor.execute(request, vi.fn()))[0].kind).toBe(
      "loading-error",
    );
  });
});
describe("deterministic public grading", () => {
  it("only normalizes CRLF and one optional final newline", () => {
    expect(normalizeOutput(" a \r\n")).toBe(" a ");
    expect(normalizeOutput("a\n\n")).toBe("a\n");
    const cases = cppExercises[3].tests;
    const rows = evaluateCases(cases, [
      { kind: "success", stdout: "0", stderr: "", diagnostics: "" },
    ]);
    expect(rows.map((row) => row.passed)).toEqual([true, false, false, false]);
    expect(
      evaluateCases(cases, [
        {
          kind: "runtime-error",
          stdout: "0",
          stderr: "",
          diagnostics: "",
          exitCode: 1,
        },
      ])[0].passed,
    ).toBe(false);
  });
});
