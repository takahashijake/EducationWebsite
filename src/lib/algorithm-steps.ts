/** Pure, deterministic traces. Bounds are inclusive; duplicate searches return the first match seen. */
export type SortingAlgorithm =
  "bubble-sort" | "selection-sort" | "insertion-sort";
export type Algorithm =
  "traversal" | "linear" | "binary-search" | SortingAlgorithm;
export const sortingAlgorithms: readonly SortingAlgorithm[] = [
  "bubble-sort",
  "selection-sort",
  "insertion-sort",
];
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
  /** Present only for sorting. Ranges are inclusive; identities reveal equal-key order. */
  sorting?: {
    iteration: number;
    sortedRange: [number, number] | null;
    minimumIndex: number | null;
    key: number | null;
    originalIndices: number[];
    swaps: number;
    writes: number;
  };
};
export const sortingScenarios: AlgorithmScenario[] = [
  { id: "typical", label: "Typical unsorted", values: [5, 2, 4, 1] },
  { id: "empty", label: "Empty", values: [] },
  { id: "singleton", label: "Singleton", values: [7] },
  { id: "sorted", label: "Already sorted", values: [1, 2, 3, 4] },
  { id: "reverse", label: "Reverse sorted", values: [4, 3, 2, 1] },
  { id: "duplicates", label: "Duplicates", values: [3, 1, 3, 2] },
  { id: "equal", label: "All equal", values: [2, 2, 2, 2] },
  { id: "signed", label: "Positive and negative", values: [3, -2, 0, -4] },
];
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
  "bubble-sort": sortingScenarios,
  "selection-sort": sortingScenarios,
  "insertion-sort": sortingScenarios,
};
export function generateAlgorithmSteps(
  algorithm: Algorithm,
  scenario: AlgorithmScenario,
): AlgorithmStep[] {
  const { values, target } = scenario;
  if (!Array.isArray(values))
    throw new Error("Visualization requires a numeric array");
  if (sortingAlgorithms.includes(algorithm as SortingAlgorithm)) {
    if (values.length > 16)
      throw new Error("Sorting visualization supports at most 16 values");
    for (let index = 0; index < values.length; index++)
      if (!Number.isFinite(values[index]))
        throw new Error("Visualization requires finite numeric values");
    return generateSortingSteps(algorithm as SortingAlgorithm, values);
  }
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
/**
 * Sorting cost model: one ordering test is one comparison; an exchange of two
 * distinct positions is one swap and two array writes; a shift or insertion
 * is one array write. Assignments to local variables are excluded. Equal keys
 * are never moved by bubble/insertion comparisons. Redundant self-writes are
 * omitted by selection and insertion.
 */
function generateSortingSteps(
  algorithm: SortingAlgorithm,
  input: readonly number[],
): AlgorithmStep[] {
  if (input.length > 16)
    throw new Error("Sorting visualization supports at most 16 values");
  const items = input.map((value, originalIndex) => ({ value, originalIndex }));
  const steps: AlgorithmStep[] = [];
  let comparisons = 0;
  let swaps = 0;
  let writes = 0;
  let iteration = 0;
  let sortedRange: [number, number] | null = null;
  let minimumIndex: number | null = null;
  let key: number | null = null;
  const add = (
    operation: string,
    explanation: string,
    highlightedIndices: number[] = [],
    highlightLabel = "Compared",
    outcome: string | null = null,
  ) => {
    steps.push({
      values: items.map((item) => item.value),
      highlightedIndices,
      highlightLabel,
      operation,
      explanation,
      inspected: highlightedIndices[0] ?? null,
      activeIndex: highlightedIndices[0] ?? null,
      low: null,
      high: null,
      comparisons,
      outcome,
      sorting: {
        iteration,
        sortedRange: sortedRange ? [...sortedRange] : null,
        minimumIndex,
        key,
        originalIndices: items.map((item) => item.originalIndex),
        swaps,
        writes,
      },
    });
  };
  add(
    "Initialize",
    `Begin with ${items.length} values. The input is copied before sorting.`,
  );
  const n = items.length;
  if (algorithm === "bubble-sort") {
    for (let end = n - 1; end > 0; end--) {
      iteration = n - end;
      let changed = false;
      for (let j = 0; j < end; j++) {
        comparisons++;
        const shouldSwap = items[j].value > items[j + 1].value;
        add(
          `Compare positions ${j} and ${j + 1}`,
          `${items[j].value} ${shouldSwap ? "is greater than" : "is not greater than"} ${items[j + 1].value}. ${shouldSwap ? "Swap the adjacent values." : "Keep their order; equal keys stay in input order."}`,
          [j, j + 1],
        );
        if (shouldSwap) {
          [items[j], items[j + 1]] = [items[j + 1], items[j]];
          swaps++;
          writes += 2;
          changed = true;
          add(
            "Swap adjacent values",
            `The larger value moved one position right.`,
            [j, j + 1],
            "Swapped",
          );
        }
      }
      sortedRange = changed ? [end, n - 1] : [0, n - 1];
      add(
        changed
          ? `Finish pass ${iteration}`
          : `Finish early after pass ${iteration}`,
        changed
          ? `Positions ${end} through ${n - 1} form a sorted suffix: each contains a final largest value.`
          : "No swap occurred. Every adjacent pair is ordered, so the entire array is sorted.",
      );
      if (!changed) break;
    }
  } else if (algorithm === "selection-sort") {
    for (let i = 0; i < n - 1; i++) {
      iteration = i + 1;
      minimumIndex = i;
      for (let j = i + 1; j < n; j++) {
        comparisons++;
        const smaller = items[j].value < items[minimumIndex].value;
        add(
          `Compare candidate ${j} with minimum ${minimumIndex}`,
          `${items[j].value} ${smaller ? "is smaller than" : "is not smaller than"} ${items[minimumIndex].value}. ${smaller ? "Update the minimum candidate." : "Retain the earlier candidate on a tie."}`,
          [minimumIndex, j],
        );
        if (smaller) {
          minimumIndex = j;
          add(
            "Update minimum candidate",
            `Index ${j} now holds the smallest value seen in the unsorted region.`,
            [j],
            "Minimum",
          );
        }
      }
      if (minimumIndex !== i) {
        const chosenIndex = minimumIndex;
        [items[i], items[chosenIndex]] = [items[chosenIndex], items[i]];
        swaps++;
        writes += 2;
        minimumIndex = null;
        add(
          "Place selected minimum",
          `Exchange positions ${i} and ${chosenIndex}. This swap can reorder equal-key records.`,
          [i, chosenIndex],
          "Swapped",
        );
      }
      minimumIndex = null;
      sortedRange = [0, i];
      add(
        `Finish placement ${iteration}`,
        `Positions 0 through ${i} contain the smallest ${i + 1} values in final sorted order.`,
      );
    }
  } else {
    for (let i = 1; i < n; i++) {
      iteration = i;
      const current = items[i];
      key = current.value;
      let j = i - 1;
      let shifted = false;
      while (j >= 0) {
        comparisons++;
        const larger = items[j].value > current.value;
        add(
          `Compare key with position ${j}`,
          `${items[j].value} ${larger ? "is greater than" : "is not greater than"} key ${current.value}. ${larger ? "Shift it right." : "Stop shifting; equal keys keep their order."}`,
          [j, j + 1],
        );
        if (!larger) break;
        items[j + 1] = items[j];
        writes++;
        shifted = true;
        add(
          "Shift larger value",
          `Copy ${items[j].value} from position ${j} to ${j + 1}; the key remains in a temporary variable.`,
          [j, j + 1],
          "Shifted",
        );
        j--;
      }
      if (shifted) {
        items[j + 1] = current;
        writes++;
        add(
          "Insert key",
          `Write key ${current.value} at position ${j + 1}.`,
          [j + 1],
          "Inserted",
        );
      }
      sortedRange = [0, i];
      key = null;
      add(
        `Finish insertion ${iteration}`,
        `Positions 0 through ${i} are a sorted prefix; unprocessed values remain to the right.`,
      );
    }
  }
  sortedRange = n ? [0, n - 1] : null;
  minimumIndex = null;
  key = null;
  add(
    "Finish sorting",
    `Ascending result: [${items.map((item) => item.value).join(", ")}]. Counts describe this authored implementation and input, not elapsed time.`,
    [],
    "Sorted",
    `Sorted [${items.map((item) => item.value).join(", ")}]`,
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
