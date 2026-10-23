export type ExecutionState =
  | "idle"
  | "initializing"
  | "ready"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";
export type ExecutionKind =
  | "success"
  | "syntax-error"
  | "runtime-error"
  | "test-failure"
  | "loading-error"
  | "worker-error"
  | "timeout"
  | "cancelled"
  | "source-limit";
export type ExecutionCheck = { id: string; code: string };
export type ExecutionRequest = {
  language: "python";
  source: string;
  stdin?: string;
  tests?: ExecutionCheck[];
  deadlineMs?: number;
};
export type TestResult = {
  id: string;
  status: "passed" | "failed";
  error?: string;
};
export type ExecutionResult = {
  kind: ExecutionKind;
  stdout: string;
  stderr: string;
  error?: string;
  tests: TestResult[];
  truncated: boolean;
};
export type ExecutionEvent = {
  state: ExecutionState;
  stdout?: string;
  stderr?: string;
};
export interface ExecutionEngine {
  execute(
    request: ExecutionRequest,
    onEvent: (event: ExecutionEvent) => void,
  ): Promise<ExecutionResult>;
  cancel(): void;
  dispose(): void;
}
export { SOURCE_LIMIT, INPUT_LIMIT, OUTPUT_LIMIT } from "./types";
export const DEFAULT_DEADLINE_MS = 3000;
export const INITIALIZATION_DEADLINE_MS = 30000;
