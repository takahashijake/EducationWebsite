export const SOURCE_LIMIT = 24000;
export const INPUT_LIMIT = 4000;
export const OUTPUT_LIMIT = 20000;
export const COMPILE_DEADLINE_MS = 60000;
export const RUN_DEADLINE_MS = 2000;
export type ExecutionKind =
  | "success"
  | "compilation-error"
  | "runtime-error"
  | "timeout"
  | "output-limit"
  | "cancelled"
  | "loading-error"
  | "source-limit"
  | "incorrect-output";
export type ProgramResult = {
  kind: ExecutionKind;
  stdout: string;
  stderr: string;
  diagnostics: string;
  error?: string;
  exitCode?: number;
};
export type ExecutionRequest = {
  language: "cpp";
  source: string;
  inputs: string[];
};
export type ExecutionEvent = {
  state: "compiling" | "running";
  caseIndex?: number;
};
export interface ExecutionEngine {
  execute(
    request: ExecutionRequest,
    onEvent: (event: ExecutionEvent) => void,
  ): Promise<ProgramResult[]>;
  cancel(): void;
  dispose(): void;
}
