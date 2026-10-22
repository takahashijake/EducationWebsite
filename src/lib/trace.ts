import type { CodeTrace } from "@/content/types";
export function tracePosition(
  current: number,
  action: "next" | "previous" | "reset",
  length: number,
) {
  if (action === "reset") return 0;
  return Math.max(
    0,
    Math.min(length - 1, current + (action === "next" ? 1 : -1)),
  );
}
export function validateTrace(trace: CodeTrace): string[] {
  const errors: string[] = [];
  const lineCount = trace.source.split("\n").length;
  if (
    !trace.title.trim() ||
    !trace.source.trim() ||
    !trace.caption.trim() ||
    !trace.result.trim() ||
    trace.steps.length < 2
  )
    errors.push("Incomplete trace");
  trace.steps.forEach((step, index) => {
    if (
      !step.explanation.trim() ||
      !step.lines.length ||
      step.lines.some(
        (line) =>
          !Number.isInteger(line) ||
          line < 1 ||
          line > lineCount ||
          !trace.source.split("\n")[line - 1].trim(),
      )
    )
      errors.push(`Invalid step ${index}`);
    if (new Set(step.lines).size !== step.lines.length)
      errors.push(`Duplicate lines ${index}`);
    const names = step.variables.map((v) => `${v.scope}:${v.name}`);
    if (
      new Set(names).size !== names.length ||
      step.variables.some(
        (v) =>
          !v.name.trim() ||
          !v.scope.trim() ||
          !(
            v.value === null ||
            typeof v.value === "string" ||
            typeof v.value === "boolean" ||
            (typeof v.value === "number" && Number.isFinite(v.value))
          ),
      )
    )
      errors.push(`Invalid variables ${index}`);
    if (step.output.some((line) => typeof line !== "string"))
      errors.push(`Invalid output ${index}`);
  });
  return errors;
}
