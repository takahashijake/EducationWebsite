import type { CodeTrace, TraceProgram, TraceStep } from "./types";

export const operatorsTrace: CodeTrace = {
  kind: "trace",
  title: "Trace a notebook bill",
  caption:
    "Follow the highlighted instructions and compare each resulting state.",
  source:
    "price = 8\nquantity = 3\ntotal = price * quantity + 2\naffordable = total <= 25\nprint(total, affordable)",
  steps: [
    {
      lines: [1],
      explanation: "Bind price to 8.",
      variables: [
        {
          name: "price",
          value: 8,
          scope: "global",
        },
      ],
      output: [],
    },
    {
      lines: [2],
      explanation: "Bind quantity to 3.",
      variables: [
        {
          name: "price",
          value: 8,
          scope: "global",
        },
        {
          name: "quantity",
          value: 3,
          scope: "global",
        },
      ],
      output: [],
    },
    {
      lines: [3],
      explanation:
        "Read price as 8 and quantity as 3. Multiply first: 8 * 3 is 24. The addition and assignment are still pending.",
      variables: [
        { name: "price", value: 8, scope: "global" },
        { name: "quantity", value: 3, scope: "global" },
      ],
      output: [],
      detail: "Intermediate expression: 24 + 2 · total is not bound yet",
    },
    {
      lines: [3],
      explanation: "Evaluate 8 * 3 + 2: 24 + 2 becomes 26, then assign total.",
      variables: [
        {
          name: "price",
          value: 8,
          scope: "global",
        },
        {
          name: "quantity",
          value: 3,
          scope: "global",
        },
        {
          name: "total",
          value: 26,
          scope: "global",
        },
      ],
      output: [],
      detail: "Expression: 8 * 3 + 2 → 24 + 2 → 26",
    },
    {
      lines: [4],
      explanation: "26 <= 25 is False; assign the boolean to affordable.",
      variables: [
        {
          name: "price",
          value: 8,
          scope: "global",
        },
        {
          name: "quantity",
          value: 3,
          scope: "global",
        },
        {
          name: "total",
          value: 26,
          scope: "global",
        },
        {
          name: "affordable",
          value: false,
          scope: "global",
        },
      ],
      output: [],
    },
    {
      lines: [5],
      explanation: "print displays the two values separated by a space.",
      variables: [
        {
          name: "price",
          value: 8,
          scope: "global",
        },
        {
          name: "quantity",
          value: 3,
          scope: "global",
        },
        {
          name: "total",
          value: 26,
          scope: "global",
        },
        {
          name: "affordable",
          value: false,
          scope: "global",
        },
      ],
      output: ["26 False"],
    },
  ],
  result: "The bill is 26 and exceeds the 25-credit budget.",
};

// Only these fixed inputs are selectable. No learner code is evaluated.
function scoreProgram(
  score: number,
  branch: "advanced" | "ready" | "review",
): TraceProgram {
  const variables = [{ name: "score", value: score, scope: "global" }];
  const steps: TraceStep[] = [
    {
      lines: [1],
      explanation: `Assign score ${score}.`,
      variables,
      output: [],
    },
  ];
  steps.push({
    lines: [2],
    explanation: `${score} >= 80 is ${branch === "advanced" ? "True. Select the if body; do not evaluate elif." : "False. Skip the advanced body on line 3."}`,
    detail:
      branch === "advanced"
        ? "Selected branch: if score >= 80"
        : "First condition: False · branch skipped",
    variables,
    output: [],
  });
  if (branch !== "advanced")
    steps.push({
      lines: [4],
      explanation: `${score} >= 60 is ${branch === "ready" ? "True. Choose the elif body." : "False. Neither condition matched, so choose else."}`,
      detail:
        branch === "ready"
          ? "Selected branch: elif score >= 60"
          : "Selected branch: else",
      variables,
      output: [],
    });
  const finalVariables = [
    ...variables,
    { name: "grade", value: branch, scope: "global" },
  ];
  steps.push({
    lines: [branch === "advanced" ? 3 : branch === "ready" ? 5 : 7],
    explanation: `Assign ${branch}. Skip every remaining body in this chain.`,
    variables: finalVariables,
    output: [],
  });
  steps.push({
    lines: [8],
    explanation: "After the chain, print the selected recommendation.",
    variables: finalVariables,
    output: [branch],
  });
  return {
    source: `score = ${score}\nif score >= 80:\n    grade = "advanced"\nelif score >= 60:\n    grade = "ready"\nelse:\n    grade = "review"\nprint(grade)`,
    steps,
    result: `Score ${score} selects ${branch}; exactly one branch executes.`,
  };
}
export const conditionalsTrace: CodeTrace = {
  kind: "trace",
  title: "Trace a score recommendation",
  caption:
    "Choose an input, then follow the conditions in order. Compare both sides of each threshold.",
  ...scoreProgram(72, "ready"),
  inputLabel: "Choose a quiz score",
  defaultLabel: "72 · middle interval",
  scenarios: [
    { id: "below-60", label: "59 · below 60", ...scoreProgram(59, "review") },
    {
      id: "at-60",
      label: "60 · at the lower threshold",
      ...scoreProgram(60, "ready"),
    },
    { id: "below-80", label: "79 · below 80", ...scoreProgram(79, "ready") },
    {
      id: "at-80",
      label: "80 · at the upper threshold",
      ...scoreProgram(80, "advanced"),
    },
    {
      id: "above-80",
      label: "90 · both comparisons would be true",
      ...scoreProgram(90, "advanced"),
    },
  ],
};

export const loopsTrace: CodeTrace = {
  kind: "trace",
  title: "Trace an accumulator",
  caption:
    "Follow the highlighted instructions and compare each resulting state.",
  source: "total = 0\nfor i in range(1, 4):\n    total += i\nprint(total)",
  steps: [
    {
      lines: [1],
      explanation: "Initialize the accumulator once.",
      variables: [
        {
          name: "total",
          value: 0,
          scope: "global",
        },
      ],
      output: [],
    },
    {
      lines: [2],
      explanation: "Get the first item, 1, from the range.",
      variables: [
        {
          name: "total",
          value: 0,
          scope: "global",
        },
        {
          name: "i",
          value: 1,
          scope: "global",
        },
      ],
      output: [],
      detail: "Iteration 1 · next item exists",
    },
    {
      lines: [3],
      explanation: "Read total 0 and i 1, then store 1.",
      variables: [
        {
          name: "total",
          value: 1,
          scope: "global",
        },
        {
          name: "i",
          value: 1,
          scope: "global",
        },
      ],
      output: [],
      detail: "Iteration 1 complete",
    },
    {
      lines: [2],
      explanation: "Get the next item, 2. Retain total 1.",
      variables: [
        {
          name: "total",
          value: 1,
          scope: "global",
        },
        {
          name: "i",
          value: 2,
          scope: "global",
        },
      ],
      output: [],
      detail: "Iteration 2 · next item exists",
    },
    {
      lines: [3],
      explanation: "1 + 2 = 3, so total becomes 3.",
      variables: [
        {
          name: "total",
          value: 3,
          scope: "global",
        },
        {
          name: "i",
          value: 2,
          scope: "global",
        },
      ],
      output: [],
      detail: "Iteration 2 complete",
    },
    {
      lines: [2],
      explanation: "Get the next item, 3.",
      variables: [
        {
          name: "total",
          value: 3,
          scope: "global",
        },
        {
          name: "i",
          value: 3,
          scope: "global",
        },
      ],
      output: [],
      detail: "Iteration 3 · next item exists",
    },
    {
      lines: [3],
      explanation: "3 + 3 = 6, so total becomes 6.",
      variables: [
        {
          name: "total",
          value: 6,
          scope: "global",
        },
        {
          name: "i",
          value: 3,
          scope: "global",
        },
      ],
      output: [],
      detail: "Iteration 3 complete",
    },
    {
      lines: [2],
      explanation:
        "The range is exhausted: 4 is excluded. Exit the loop without changing i.",
      variables: [
        {
          name: "total",
          value: 6,
          scope: "global",
        },
        {
          name: "i",
          value: 3,
          scope: "global",
        },
      ],
      output: [],
      detail: "Termination · no next item",
    },
    {
      lines: [4],
      explanation: "The unindented print runs once after the loop.",
      variables: [
        {
          name: "total",
          value: 6,
          scope: "global",
        },
        {
          name: "i",
          value: 3,
          scope: "global",
        },
      ],
      output: ["6"],
    },
  ],
  result: "Three iterations accumulate 6; the range is exhausted.",
};

export const functionsTrace: CodeTrace = {
  kind: "trace",
  title: "Trace arguments, local state, and a return",
  caption:
    "Follow the highlighted instructions and compare each resulting state.",
  source:
    "def add_fee(amount, fee):\n    total = amount + fee\n    return total\n\nprice = 10\nresult = add_fee(price, 2)\nprint(result)",
  steps: [
    {
      lines: [1],
      explanation:
        "Define add_fee. The body on lines 2–3 does not execute yet.",
      variables: [],
      output: [],
      detail: "Definition · no call yet",
    },
    {
      lines: [5],
      explanation: "Assign global price 10.",
      variables: [
        {
          name: "price",
          value: 10,
          scope: "global",
        },
      ],
      output: [],
    },
    {
      lines: [6],
      explanation:
        "Evaluate arguments 10 and 2 and enter add_fee. result is not assigned yet.",
      variables: [
        {
          name: "price",
          value: 10,
          scope: "global",
        },
        {
          name: "amount",
          value: 10,
          scope: "add_fee call",
        },
        {
          name: "fee",
          value: 2,
          scope: "add_fee call",
        },
      ],
      output: [],
      detail: "Call · amount ← 10; fee ← 2",
    },
    {
      lines: [2],
      explanation: "In the call, compute local total 12.",
      variables: [
        {
          name: "price",
          value: 10,
          scope: "global",
        },
        {
          name: "amount",
          value: 10,
          scope: "add_fee call",
        },
        {
          name: "fee",
          value: 2,
          scope: "add_fee call",
        },
        {
          name: "total",
          value: 12,
          scope: "add_fee call",
        },
      ],
      output: [],
      detail: "Local computation",
    },
    {
      lines: [3],
      explanation:
        "Return 12. Pause to inspect the returning frame before removing it; the caller has not resumed yet.",
      variables: [
        {
          name: "price",
          value: 10,
          scope: "global",
        },
      ],
      output: [],
      detail: "Return · 12 goes to the caller",
    },
    {
      lines: [6],
      explanation: "Resume the caller and bind the returned 12 to result.",
      variables: [
        {
          name: "price",
          value: 10,
          scope: "global",
        },
        {
          name: "result",
          value: 12,
          scope: "global",
        },
      ],
      output: [],
      detail: "Caller resumes · result ← 12",
    },
    {
      lines: [7],
      explanation: "Print the caller’s result.",
      variables: [
        {
          name: "price",
          value: 10,
          scope: "global",
        },
        {
          name: "result",
          value: 12,
          scope: "global",
        },
      ],
      output: ["12"],
    },
  ],
  result: "Arguments 10 and 2 yield returned value 12; output is 12.",
};

// Frame snapshots share the scoped variable table; no local binding is duplicated.
functionsTrace.steps = functionsTrace.steps.map((step, index, steps) => ({
  ...step,
  variables: index === 4 ? steps[3].variables : step.variables,
  frames: [
    {
      id: "module",
      name: "Caller (module)",
      scope: "global",
      status: index >= 2 && index <= 4 ? "suspended" : "active",
      ...(index >= 2 && index <= 4 ? { resumeLine: 6 } : {}),
    },
    ...(index >= 2 && index <= 4
      ? [
          {
            id: "add-fee-1",
            name: "add_fee(10, 2)",
            scope: "add_fee call",
            status: index === 4 ? ("returning" as const) : ("active" as const),
            ...(index === 4 ? { returnValue: 12 } : {}),
          },
        ]
      : []),
  ],
}));
