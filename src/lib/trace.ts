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
  return [...errors, ...validateStack(trace)];
}

function isValue(value: unknown) {
  return (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  );
}

/** Validate one-frame-at-a-time LIFO transitions; returning and removing are separate states. */
export function validateStack(trace: CodeTrace): string[] {
  const errors: string[] = [];
  if (!trace.steps.some((step) => step.stack !== undefined || step.stackEvent))
    return errors;
  let previous: NonNullable<CodeTrace["steps"][number]["stack"]> = [];
  const seen = new Set<string>();
  trace.steps.forEach((step, index) => {
    const stack = step.stack;
    if (!stack) {
      errors.push(`Missing stack ${index}`);
      return;
    }
    const event = step.stackEvent;
    const top = stack.at(-1);
    const priorTop = previous.at(-1);
    const prefix = (count: number) =>
      stack.slice(0, count).every((f, i) => f.id === previous[i]?.id);
    const sameArguments = stack.every((f) => {
      const prior = previous.find((p) => p.id === f.id);
      return (
        !prior ||
        (f.functionName === prior.functionName &&
          JSON.stringify(f.arguments) === JSON.stringify(prior.arguments))
      );
    });
    if (
      new Set(stack.map((f) => f.id)).size !== stack.length ||
      !sameArguments ||
      stack.some((frame, i) => {
        const namedValues = (values: typeof frame.locals) =>
          new Set(values.map((v) => v.name)).size === values.length &&
          values.every((v) => v.name.trim() && isValue(v.value));
        return (
          !frame.id.trim() ||
          !frame.functionName.trim() ||
          !namedValues(frame.arguments) ||
          !namedValues(frame.locals) ||
          (i < stack.length - 1
            ? frame.status !== "waiting"
            : !["running", "returned"].includes(frame.status)) ||
          (frame.status === "returned"
            ? !("returnValue" in frame) || !isValue(frame.returnValue)
            : "returnValue" in frame)
        );
      })
    )
      errors.push(`Invalid frames ${index}`);
    if (!event) {
      if (
        stack.length !== previous.length ||
        !prefix(stack.length) ||
        stack.some((frame, i) => {
          const prior = previous[i];
          return (
            !prior ||
            frame.status !== prior.status ||
            frame.returnValue !== prior.returnValue ||
            ((i < stack.length - 1 || frame.status !== "running") &&
              JSON.stringify(frame.locals) !== JSON.stringify(prior.locals))
          );
        })
      )
        errors.push(`Stack changed without event ${index}`);
    } else {
      let valid = false;
      switch (event.kind) {
        case "push":
          valid =
            stack.length === previous.length + 1 &&
            prefix(previous.length) &&
            top?.id === event.frameId &&
            top.status === "running" &&
            !seen.has(top.id) &&
            (!priorTop || priorTop.status === "running");
          if (top) seen.add(top.id);
          break;
        case "base":
          valid =
            stack.length === previous.length &&
            prefix(stack.length) &&
            top?.id === event.frameId &&
            top.status === "running" &&
            priorTop?.status === "running";
          break;
        case "return":
          valid =
            stack.length === previous.length &&
            prefix(stack.length) &&
            top?.id === event.frameId &&
            top.status === "returned" &&
            priorTop?.status === "running";
          break;
        case "pop":
          valid =
            previous.length === stack.length + 1 &&
            prefix(stack.length) &&
            priorTop?.id === event.frameId &&
            priorTop.status === "returned" &&
            (!top || top.status === "running");
          break;
      }
      // A suspended caller's locals cannot change while a deeper invocation runs.
      const unchangedCount =
        event.kind === "pop"
          ? Math.max(0, stack.length - 1)
          : event.kind === "push"
            ? previous.length
            : Math.max(0, stack.length - 1);
      if (
        !valid ||
        stack
          .slice(0, unchangedCount)
          .some(
            (f, i) =>
              JSON.stringify(f.locals) !== JSON.stringify(previous[i]?.locals),
          )
      )
        errors.push(`Invalid stack transition ${index}`);
    }
    previous = stack;
  });
  if (previous.length) errors.push("Unfinished stack");
  return errors;
}
