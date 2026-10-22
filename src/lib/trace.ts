import type { TraceValue } from "@/content/types";

export function tracePosition(
  current: number,
  action: "next" | "previous" | "reset",
  length: number,
) {
  if (action === "reset" || !Number.isInteger(length) || length < 1) return 0;
  const position = Number.isFinite(current) ? Math.trunc(current) : 0;
  return Math.max(
    0,
    Math.min(length - 1, position + (action === "next" ? 1 : -1)),
  );
}
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string =>
  typeof value === "string" && !!value.trim();
const traceValue = (value: unknown): value is TraceValue =>
  value === null ||
  typeof value === "string" ||
  typeof value === "boolean" ||
  (typeof value === "number" && Number.isFinite(value));

/** Structural authoring validation, not a Python interpreter or semantic proof. */
function validateProgram(program: unknown): string[] {
  if (
    !record(program) ||
    !text(program.source) ||
    !text(program.result) ||
    !Array.isArray(program.steps)
  )
    return ["Incomplete trace"];
  const errors: string[] = program.steps.length < 2 ? ["Incomplete trace"] : [];
  const lines = program.source.split("\n");
  const validLine = (line: unknown) =>
    typeof line === "number" &&
    Number.isInteger(line) &&
    line > 0 &&
    line <= lines.length &&
    !!lines[line - 1].trim();
  const framed = program.steps.some((s) => record(s) && s.frames !== undefined);
  let priorOutput: string[] = [];
  let priorFrames: Record<string, unknown>[] = [];
  program.steps.forEach((step: unknown, index: number) => {
    if (!record(step)) {
      errors.push(`Invalid step ${index}`);
      return;
    }
    if (
      !text(step.explanation) ||
      !Array.isArray(step.lines) ||
      !step.lines.length ||
      !step.lines.every(validLine)
    )
      errors.push(`Invalid step ${index}`);
    if (
      Array.isArray(step.lines) &&
      new Set(step.lines).size !== step.lines.length
    )
      errors.push(`Duplicate lines ${index}`);
    if (step.detail !== undefined && !text(step.detail))
      errors.push(`Invalid detail ${index}`);
    if (
      !Array.isArray(step.variables) ||
      step.variables.some(
        (v: unknown) =>
          !record(v) || !text(v.name) || !text(v.scope) || !traceValue(v.value),
      )
    )
      errors.push(`Invalid variables ${index}`);
    else {
      const names = step.variables.map((v) => `${v.scope}:${v.name}`);
      if (new Set(names).size !== names.length)
        errors.push(`Invalid variables ${index}`);
    }
    if (
      !Array.isArray(step.output) ||
      step.output.some((v: unknown) => typeof v !== "string")
    )
      errors.push(`Invalid output ${index}`);
    else {
      const output = step.output;
      if (priorOutput.some((line, i) => output[i] !== line))
        errors.push(`Output must be cumulative ${index}`);
      priorOutput = step.output;
    }
    if (!framed) return;
    if (
      !Array.isArray(step.frames) ||
      !step.frames.length ||
      step.frames.some(
        (f: unknown) =>
          !record(f) ||
          !text(f.id) ||
          !text(f.name) ||
          !text(f.scope) ||
          !["active", "suspended", "returning"].includes(String(f.status)) ||
          (f.resumeLine !== undefined && !validLine(f.resumeLine)) ||
          (f.returnValue !== undefined && !traceValue(f.returnValue)) ||
          (f.status === "returning" && !Object.hasOwn(f, "returnValue")),
      )
    ) {
      errors.push(`Invalid frames ${index}`);
      return;
    }
    const frames = step.frames as Record<string, unknown>[];
    if (
      new Set(frames.map((f) => f.id)).size !== frames.length ||
      new Set(frames.map((f) => f.scope)).size !== frames.length ||
      frames.some((f, i) =>
        i < frames.length - 1
          ? f.status !== "suspended"
          : f.status === "suspended",
      )
    )
      errors.push(`Invalid frame status ${index}`);
    if (index) {
      const shared = Math.min(priorFrames.length, frames.length);
      if (
        Math.abs(priorFrames.length - frames.length) > 1 ||
        frames
          .slice(0, shared)
          .some(
            (f, i) =>
              f.id !== priorFrames[i].id ||
              f.name !== priorFrames[i].name ||
              f.scope !== priorFrames[i].scope,
          ) ||
        (frames.length < priorFrames.length &&
          priorFrames.at(-1)?.status !== "returning")
      )
        errors.push(`Invalid frame transition ${index}`);
    }
    priorFrames = frames;
  });
  if (
    framed &&
    (priorFrames.length !== 1 || priorFrames[0]?.status !== "active")
  )
    errors.push("Trace must restore the caller");
  return errors;
}
export function validateTrace(trace: unknown): string[] {
  if (!record(trace)) return ["Incomplete trace"];
  const errors = validateProgram(trace);
  if (trace.kind !== "trace" || !text(trace.title) || !text(trace.caption))
    errors.push("Incomplete trace");
  if (trace.scenarios !== undefined) {
    if (
      !Array.isArray(trace.scenarios) ||
      !trace.scenarios.length ||
      !text(trace.defaultLabel) ||
      !text(trace.inputLabel)
    )
      errors.push("Incomplete scenarios");
    if (Array.isArray(trace.scenarios)) {
      const ids = new Set<string>();
      const labels = new Set<string>();
      trace.scenarios.forEach((scenario: unknown, index: number) => {
        if (!record(scenario) || !text(scenario.id) || !text(scenario.label)) {
          errors.push(`Invalid scenario ${index}`);
          return;
        }
        if (
          ids.has(scenario.id) ||
          labels.has(scenario.label) ||
          scenario.label === trace.defaultLabel
        )
          errors.push(`Duplicate scenario ${index}`);
        ids.add(scenario.id);
        labels.add(scenario.label);
        errors.push(
          ...validateProgram(scenario).map(
            (e) => `Scenario ${scenario.id}: ${e}`,
          ),
        );
      });
    }
  }
  return errors;
}
