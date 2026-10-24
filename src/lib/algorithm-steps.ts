/** Pure, deterministic traces. Bounds are inclusive; duplicate searches return the first match seen. */
export type Algorithm = "traversal" | "linear" | "binary-search";
export type AlgorithmScenario = {
  id: string;
  label: string;
  values: number[];
  target?: number;
};
export type AlgorithmStep = {
  /** Complete array state after this operation; future sorting steps may change it. */
  values: number[];
  /** One or more elements involved in the operation. */
  highlightedIndices: number[];
  highlightLabel: string;
  operation: string;
  explanation: string;
  inspected: number | null;
  activeIndex: number | null;
  low: number | null;
  high: number | null;
  comparisons: number;
  outcome: string | null;
};
export const scenarios: Record<Algorithm, AlgorithmScenario[]> = {
  traversal: [
    { id: "typical", label: "Four elements", values: [8, 3, 9, 2] },
    { id: "empty", label: "Empty list", values: [] },
    { id: "singleton", label: "One element", values: [7] },
  ],
  linear: [
    {
      id: "last",
      label: "Match at last index",
      values: [8, 3, 9, 2],
      target: 2,
    },
    {
      id: "first",
      label: "Match at first index",
      values: [8, 3, 9, 2],
      target: 8,
    },
    { id: "missing", label: "Missing target", values: [8, 3, 9, 2], target: 5 },
    { id: "empty", label: "Empty list", values: [], target: 5 },
    {
      id: "duplicate",
      label: "Duplicate target",
      values: [4, 2, 4, 4],
      target: 4,
    },
    { id: "singleton", label: "One element", values: [7], target: 7 },
  ],
  "binary-search": [
    {
      id: "even",
      label: "Even length, last match",
      values: [1, 3, 5, 7, 9, 11],
      target: 11,
    },
    {
      id: "odd",
      label: "Odd length, first match",
      values: [1, 3, 5, 7, 9],
      target: 1,
    },
    {
      id: "missing",
      label: "Missing target",
      values: [1, 3, 5, 7, 9],
      target: 6,
    },
    { id: "empty", label: "Empty list", values: [], target: 5 },
    {
      id: "duplicate",
      label: "Duplicate target",
      values: [1, 2, 2, 2, 3],
      target: 2,
    },
    { id: "singleton", label: "One element", values: [7], target: 7 },
  ],
};
export function generateAlgorithmSteps(
  algorithm: Algorithm,
  scenario: AlgorithmScenario,
): AlgorithmStep[] {
  const { values, target } = scenario;
  if (values.some((value) => !Number.isFinite(value)))
    throw new Error("Visualization requires finite numeric values");
  if (
    algorithm === "binary-search" &&
    values.some((value, i) => i > 0 && value < values[i - 1])
  )
    throw new Error("Binary search requires ascending sorted input");
  const steps: AlgorithmStep[] = [];
  let comparisons = 0;
  const add = (
    operation: string,
    explanation: string,
    inspected: number | null,
    activeIndex: number | null,
    low: number | null,
    high: number | null,
    outcome: string | null = null,
    snapshot: number[] = values,
    highlightedIndices: number[] = inspected === null ? [] : [inspected],
    highlightLabel = algorithm === "traversal" ? "Visited" : "Compared",
  ) =>
    steps.push({
      values: [...snapshot],
      highlightedIndices: [...highlightedIndices],
      highlightLabel,
      operation,
      explanation,
      inspected,
      activeIndex,
      low,
      high,
      comparisons,
      outcome,
    });
  add(
    "Initialize",
    values.length
      ? `Begin with ${values.length} indexed elements.`
      : "The collection is empty; no element can be inspected.",
    null,
    null,
    values.length ? 0 : null,
    values.length ? values.length - 1 : null,
  );
  if (algorithm === "traversal") {
    for (let index = 0; index < values.length; index++)
      add(
        `Visit index ${index}`,
        `Read ${values[index]} at index ${index}; the next index is ${index + 1}.`,
        index,
        index,
        index,
        values.length - 1,
      );
    add(
      "Finish traversal",
      `Visited ${values.length} element${values.length === 1 ? "" : "s"}. Reading every element takes O(n) operations.`,
      null,
      null,
      null,
      null,
      `Visited ${values.length} elements`,
    );
    return steps;
  }
  if (target === undefined || !Number.isFinite(target))
    throw new Error("Search target must be a finite number");
  if (algorithm === "linear") {
    for (let index = 0; index < values.length; index++) {
      comparisons++;
      const found = values[index] === target;
      add(
        `Compare index ${index}`,
        `${values[index]} ${found ? "equals" : "does not equal"} ${target}. ${found ? "Return this first matching index." : "Continue to the next index."}`,
        index,
        index,
        index,
        values.length - 1,
        found ? `Found at index ${index}` : null,
      );
      if (found) return steps;
    }
  } else {
    let low = 0;
    let high = values.length - 1;
    while (low <= high) {
      const midpoint = low + Math.floor((high - low) / 2);
      comparisons++;
      const value = values[midpoint];
      const found = value === target;
      // The lesson's Python reference first checks equality, then ordering after a miss.
      const smaller = !found && value < target;
      if (!found) comparisons++;
      const decision = found
        ? "Return this midpoint; duplicates may have another valid index."
        : smaller
          ? "Discard the left half including this midpoint."
          : "Discard the right half including this midpoint.";
      add(
        `Compare midpoint ${midpoint}`,
        `${value} ${found ? "equals" : smaller ? "is less than" : "is greater than"} ${target}. ${decision}`,
        midpoint,
        midpoint,
        low,
        high,
        found ? `Found at index ${midpoint}` : null,
      );
      if (found) return steps;
      if (smaller) low = midpoint + 1;
      else high = midpoint - 1;
      add(
        "Narrow interval",
        low <= high
          ? `Only indices ${low} through ${high} can still contain ${target}.`
          : "The search interval is empty.",
        null,
        null,
        low <= high ? low : null,
        low <= high ? high : null,
      );
    }
  }
  add(
    "Finish search",
    `${target} was not found. Return -1.`,
    null,
    null,
    null,
    null,
    "Not found (-1)",
  );
  return steps;
}
export function moveStep(
  position: number,
  count: number,
  action: "next" | "previous" | "reset",
) {
  if (action === "reset" || count <= 0) return 0;
  return Math.max(
    0,
    Math.min(count - 1, position + (action === "next" ? 1 : -1)),
  );
}
