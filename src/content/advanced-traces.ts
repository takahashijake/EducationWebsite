import type { CodeTrace, TraceFrame, TraceProgram, TraceStep } from "./types";

// A finite family of authored examples, not an interpreter. Each snapshot is copied.
function factorialProgram(input: number): TraceProgram {
  const source = `def factorial(n):\n    if n == 0:\n        return 1\n    return n * factorial(n - 1)\n\nresult = factorial(${input})\nprint(result)`;
  const frames: TraceFrame[] = [
    {
      id: "module",
      name: "Caller (module)",
      scope: "global",
      status: "active",
    },
  ];
  const variables: TraceStep["variables"] = [];
  const steps: TraceStep[] = [];
  function snapshot(line: number, explanation: string, output: string[] = []) {
    steps.push({
      lines: [line],
      explanation,
      frames: frames.map((f) => ({ ...f })),
      variables: variables.map((v) => ({ ...v })),
      output: [...output],
    });
  }
  snapshot(
    1,
    "Define factorial. The body does not run until a call; result is not yet assigned.",
  );
  function call(n: number): number {
    const caller = frames.at(-1)!;
    caller.status = "suspended";
    caller.resumeLine = frames.length === 1 ? 6 : 4;
    const scope = `factorial-${input - n}`;
    const frame: TraceFrame = {
      id: scope,
      name: `factorial(${n})`,
      scope,
      status: "active",
    };
    frames.push(frame);
    variables.push({ name: "n", value: n, scope });
    snapshot(
      caller.resumeLine,
      `Call factorial(${n}): create a new frame with its own n = ${n}. The caller waits; its n does not change.`,
    );
    snapshot(
      2,
      `Test n == 0: ${n === 0 ? "True; take the base case" : "False; use the recursive case"}.`,
    );
    let value = 1;
    if (n > 0) {
      const child = call(n - 1);
      snapshot(
        4,
        `Resume factorial(${n}) with child result ${child}. Its local n is still ${n}; multiply ${n} × ${child}.`,
      );
      value = n * child;
    }
    frame.status = "returning";
    frame.returnValue = value;
    snapshot(
      n === 0 ? 3 : 4,
      `Return ${value} from factorial(${n}). This teaching pause keeps the returning frame visible before removal.`,
    );
    frames.pop();
    variables.splice(
      variables.findIndex((v) => v.scope === scope),
      1,
    );
    caller.status = "active";
    delete caller.resumeLine;
    return value;
  }
  const value = call(input);
  variables.push({ name: "result", value, scope: "global" });
  snapshot(
    6,
    `Restore the module. Only now assign the returned value ${value} to result.`,
  );
  snapshot(7, `Print result after all recursive frames have unwound.`, [
    String(value),
  ]);
  return {
    source,
    steps,
    result: `factorial(${input}) is ${value}. Every call returns to its immediate caller.`,
  };
}
export const recursionTrace: CodeTrace = {
  kind: "trace",
  title: "Build and unwind the factorial call stack",
  caption:
    "For nonnegative integer inputs, each call reduces n by one. Inspect separate local bindings and the pending multiplication in each suspended caller.",
  ...factorialProgram(3),
  inputLabel: "Choose a factorial input",
  defaultLabel: "n = 3",
  scenarios: [0, 1, 4].map((n) => ({
    id: `n-${n}`,
    label: `n = ${n}`,
    ...factorialProgram(n),
  })),
};

function boundaryProgram(corrected: boolean, n: number): TraceProgram {
  const stop = corrected ? "n + 1" : "n";
  const source = `n = ${n}\ntotal = 0\nfor value in range(1, ${stop}):\n    total += value\nprint(total)`;
  const steps: TraceStep[] = [];
  let total = 0;
  let value: number | undefined;
  function snapshot(line: number, explanation: string, output: string[] = []) {
    steps.push({
      lines: [line],
      explanation,
      variables: [
        { name: "n", value: n, scope: "global" },
        ...(line === 1
          ? []
          : [{ name: "total", value: total, scope: "global" }]),
        ...(value === undefined
          ? []
          : [{ name: "value", value, scope: "global" }]),
      ],
      output,
    });
  }
  snapshot(
    1,
    `Set the requirement: add the integers from 1 through ${n}, inclusive.`,
  );
  snapshot(2, "Initialize total to 0 before examining the range.");
  for (let current = 1; current < n + (corrected ? 1 : 0); current++) {
    value = current;
    snapshot(
      3,
      `Bind value = ${value}. range excludes its stop ${n + (corrected ? 1 : 0)}.`,
    );
    total += value;
    snapshot(
      4,
      `Add ${value}; total becomes ${total}. Compare this state with your prediction.`,
    );
  }
  snapshot(
    3,
    `Range exhausted. ${corrected ? `The final value ${n} was included.` : `The required value ${n} was never included: this is the first incorrect assumption.`}`,
  );
  snapshot(
    5,
    `Print ${total}. Expected ${(n * (n + 1)) / 2}; ${corrected ? "the boundary repair satisfies this case" : "no exception is raised, but the requirement is violated"}.`,
    [String(total)],
  );
  return {
    source,
    steps,
    result: `${corrected ? "Fixed" : "Buggy"} boundary: expected ${(n * (n + 1)) / 2}, observed ${total}.`,
  };
}
export const debuggingTrace: CodeTrace = {
  kind: "trace",
  title: "Find the first divergence, then test a focused repair",
  caption:
    "The requirement is an inclusive sum. Compare the buggy and fixed versions on a small input and the smallest positive boundary.",
  ...boundaryProgram(false, 3),
  inputLabel: "Choose a debugging case",
  defaultLabel: "Buggy · n = 3",
  scenarios: [
    { id: "fixed-3", label: "Fixed · n = 3", ...boundaryProgram(true, 3) },
    { id: "buggy-1", label: "Buggy · n = 1", ...boundaryProgram(false, 1) },
    { id: "fixed-1", label: "Fixed · n = 1", ...boundaryProgram(true, 1) },
  ],
};
