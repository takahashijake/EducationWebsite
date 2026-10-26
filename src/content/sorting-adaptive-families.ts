import type { AdaptiveFamily } from "./adaptive-families";
import {
  generateAlgorithmSteps,
  type SortingAlgorithm,
} from "@/lib/algorithm-steps";

type Random = Parameters<AdaptiveFamily["generate"]>[0];
type Draft = ReturnType<AdaptiveFamily["generate"]>;
type Choice = Draft["choices"][number];
const right = (text: string): Choice => ({ text, correct: true });
const wrong = (text: string, misconception: string): Choice => ({
  text,
  misconception,
});
const shown = (values: readonly number[]) => `[${values.join(", ")}]`;
const family = (
  id: string,
  skillId: string,
  difficulty: "foundation" | "application",
  generate: (random: Random) => Draft,
): AdaptiveFamily => ({
  id,
  revision: 1,
  skillId,
  topicId: "sorting",
  difficulty,
  reviewHref: "/lessons/sorting",
  generate,
});
const final = (algorithm: SortingAlgorithm, values: number[]) =>
  generateAlgorithmSteps(algorithm, {
    id: "adaptive",
    label: "Adaptive",
    values,
  }).at(-1)!;
const first = (
  algorithm: SortingAlgorithm,
  values: number[],
  operation: string,
) =>
  generateAlgorithmSteps(algorithm, {
    id: "adaptive",
    label: "Adaptive",
    values,
  }).find((step) => step.operation.startsWith(operation))!;

/** Pure authored templates; the same seed and revision always yield the same case. */
export const sortingAdaptiveFamilies: AdaptiveFamily[] = [
  family("sorting-order-result", "sorting-order", "foundation", (r) => {
    const b = r.int(-9, 9);
    const duplicate = r.int(0, 1) === 1;
    const values = duplicate
      ? [b + 3, b - 1, b + 1, b + 3]
      : [b + 3, b - 1, b + 1];
    const correct = [...values].sort((a, c) => a - c);
    return {
      prompt: "Which output is ascending and retains every input item?",
      context: `values = ${shown(values)}\n# Sort numerically in ascending order.`,
      choices: [
        right(shown(correct)),
        wrong(
          shown([...correct].reverse()),
          "This is descending, not ascending.",
        ),
        wrong(
          shown(correct.slice(0, -1)),
          "Sorting reorders items; it does not discard an item or duplicate.",
        ),
      ],
      explanation: `Ascending order is nondecreasing and preserves all ${values.length} items, giving ${shown(correct)}.`,
      hints: [
        "Keep the same number of items, including duplicates.",
        "Place smaller numbers before larger numbers.",
      ],
      workedStep: `The smallest item is ${correct[0]}; the largest is ${correct.at(-1)}.`,
    };
  }),
  family("sorting-bubble-pass", "bubble-invariant", "application", (r) => {
    const b = r.int(-8, 8);
    const mode = r.int(0, 1);
    const values = mode ? [b + 4, b + 1, b + 3, b] : [b + 4, b + 2, b + 3, b];
    const after = first("bubble-sort", values, "Finish pass 1").values;
    const sorted = final("bubble-sort", values).values;
    return {
      prompt: "What is the array after one complete left-to-right bubble pass?",
      context: `values = ${shown(values)}\n# Swap adjacent positions only when left > right.`,
      choices: [
        right(shown(after)),
        wrong(
          shown(values),
          "At least one adjacent inversion is swapped on this pass.",
        ),
        wrong(
          shown(sorted),
          "A single pass fixes the largest value at the right, but earlier values still need work here.",
        ),
      ],
      explanation: `The pass produces ${shown(after)}. Its last item is final because the largest unsorted value bubbled right.`,
      hints: [
        "Compare positions 0 and 1, then 1 and 2, then 2 and 3.",
        "Carry the changed array into each next comparison.",
      ],
      workedStep: `After adjacent comparisons, the largest value ${after.at(-1)} reaches the sorted suffix.`,
    };
  }),
  family("sorting-bubble-decision", "bubble-invariant", "foundation", (r) => {
    const b = r.int(-8, 8);
    const mode = r.int(0, 2);
    const left = b + (mode === 0 ? 2 : mode === 1 ? 0 : -2);
    const swap = left > b;
    return {
      prompt:
        "What should strict-greater bubble sort do at this adjacent comparison?",
      context: `values = ${shown([left, b, b + 5])}\n# Compare indices 0 and 1; the pass is still in progress.`,
      choices: [
        swap
          ? right("Swap positions 0 and 1")
          : wrong(
              "Swap positions 0 and 1",
              "The left value is not strictly greater, so swapping is unjustified.",
            ),
        swap
          ? wrong(
              "Keep positions 0 and 1",
              "The left value is greater, so this inversion needs an adjacent swap.",
            )
          : right("Keep positions 0 and 1"),
        wrong(
          "Finish the entire sort now",
          "One comparison cannot establish that the entire pass made no swaps or that later pairs are ordered.",
        ),
      ],
      explanation: `${left} ${swap ? "is" : "is not"} greater than ${b}; ${swap ? "swap the adjacent pair" : "keep this pair in order"}. Equal keys are never exchanged by this variant.`,
      hints: [
        "Compare the two current values, not their positions.",
        "This variant swaps only for a strict > result.",
      ],
      workedStep: `Evaluate ${left} > ${b}: ${swap ? "true" : "false"}.`,
    };
  }),
  family(
    "sorting-selection-minimum",
    "selection-invariant",
    "foundation",
    (r) => {
      const b = r.int(-8, 8);
      const mode = r.int(0, 2);
      const values =
        mode === 0
          ? [b - 2, b + 4, b + 1, b + 3]
          : mode === 1
            ? [b + 4, b + 3, b - 2, b + 1]
            : [b + 4, b + 3, b + 1, b - 2];
      const minimum = values.indexOf(Math.min(...values));
      return {
        prompt:
          "Which index is the minimum candidate after scanning the whole unsorted region?",
        context: `values = ${shown(values)}\n# Selection sort begins at i = 0.`,
        choices: [
          minimum === 0
            ? right("Index 0")
            : wrong(
                "Index 0",
                "The first value is not the smallest after scanning all candidates.",
              ),
          minimum === 2
            ? right("Index 2")
            : wrong(
                "Index 2",
                "Compare this value with every other candidate.",
              ),
          minimum === 3
            ? right("Index 3")
            : wrong(
                "Index 3",
                "Compare this value with every other candidate.",
              ),
        ],
        explanation: `${values[minimum]} at index ${minimum} is the smallest value in the unsorted region.`,
        hints: [
          "Track an index, not just the minimum value.",
          "Compare every later value with the current candidate.",
        ],
        workedStep: `The scan ends with minimum = ${minimum}; the next action places it at index 0.`,
      };
    },
  ),
  family(
    "sorting-selection-placement",
    "selection-invariant",
    "application",
    (r) => {
      const b = r.int(-8, 8);
      const values = r.int(0, 1)
        ? [b + 4, b + 3, b + 2, b]
        : [b + 4, b + 2, b, b + 3];
      const after = first(
        "selection-sort",
        values,
        "Finish placement 1",
      ).values;
      return {
        prompt:
          "What is the array after selection sort places its first minimum?",
        context: `values = ${shown(values)}\n# Scan indices 0 through 3, then exchange the minimum with index 0.`,
        choices: [
          right(shown(after)),
          wrong(
            shown(values),
            "The smallest value was not already at index 0, so the placement changes the array.",
          ),
          wrong(
            shown(final("selection-sort", values).values),
            "The first placement fixes only the first prefix value; later positions still need scanning.",
          ),
        ],
        explanation: `${Math.min(...values)} is placed at index 0, producing ${shown(after)}. The prefix of length one is final.`,
        hints: [
          "Find the smallest value in all four positions.",
          "Exchange its position with index 0; do not sort the rest yet.",
        ],
        workedStep: `After placement, index 0 holds ${after[0]}, the smallest input value.`,
      };
    },
  ),
  family(
    "sorting-insertion-shift",
    "insertion-invariant",
    "application",
    (r) => {
      const b = r.int(-8, 8);
      const gap = r.int(3, 5);
      const key = b + r.int(1, gap - 1);
      const values = [b, b + gap, b + gap + 2, key];
      const shifted = first(
        "insertion-sort",
        values,
        "Shift larger value",
      ).values;
      return {
        prompt:
          "What does the array show immediately after the first insertion shift?",
        context: `values = ${shown(values)}\n# Prefix indices 0..2 are sorted; key ${key} is held temporarily.`,
        choices: [
          right(shown(shifted)),
          wrong(
            shown(values),
            "A larger prefix value is copied right during the first shift.",
          ),
          wrong(
            shown(final("insertion-sort", values).values),
            "The first shift has not yet inserted the key or finished the prefix.",
          ),
        ],
        explanation: `The value ${b + gap + 2} moves right first, making ${shown(shifted)} while key ${key} remains temporary.`,
        hints: [
          "Start with the rightmost prefix value.",
          "Copy a larger value one position right before inserting the key.",
        ],
        workedStep: `Write ${b + gap + 2} into index 3; the temporary key is still ${key}.`,
      };
    },
  ),
  family(
    "sorting-insertion-prefix",
    "insertion-invariant",
    "foundation",
    (r) => {
      const b = r.int(-8, 8);
      const gap = r.int(2, 4);
      const values = [b + gap, b, b + gap + 2, b + 1];
      const after = first(
        "insertion-sort",
        values,
        "Finish insertion 1",
      ).values;
      return {
        prompt: "What is true after inserting the key at outer index 1?",
        context: `values = ${shown(values)}\n# Insertion sort has completed i = 1 only.`,
        choices: [
          right(
            `Prefix ${shown(after.slice(0, 2))} is sorted; the suffix is unprocessed`,
          ),
          wrong(
            "Only the last item is in final position",
            "Insertion grows a sorted prefix, not a sorted suffix.",
          ),
          wrong(
            `The entire array is ${shown(final("insertion-sort", values).values)}`,
            "Later positions have not yet been processed after i = 1.",
          ),
        ],
        explanation: `After insertion, ${shown(after)} has a sorted prefix ${shown(after.slice(0, 2))}; the right suffix still awaits insertion.`,
        hints: [
          "Insertion begins with a sorted prefix of length one.",
          "After processing index i, positions 0 through i are sorted.",
        ],
        workedStep: `Key ${b} moves before ${b + gap}; positions 0 and 1 become sorted.`,
      };
    },
  ),
  family(
    "sorting-selection-count",
    "sorting-complexity",
    "application",
    (r) => {
      const n = r.int(3, 8);
      const b = r.int(-8, 8);
      const values = Array.from({ length: n }, (_, i) => b + i);
      if (r.int(0, 1)) values.reverse();
      const count = final("selection-sort", values).comparisons;
      return {
        prompt:
          "How many value comparisons does this selection variant perform?",
        context: `values = ${shown(values)}\n# Scan every unsorted suffix; skip self-swaps.`,
        choices: [
          right(`${count} comparisons`),
          wrong(
            `${n - 1} comparisons`,
            "That counts outer placements but omits the repeated suffix scans.",
          ),
          wrong(
            `${n * (n - 1)} comparisons`,
            "Each unordered candidate pair is compared once in this scan, not twice.",
          ),
        ],
        explanation: `The scan performs ${n - 1} + ${n - 2} + ... + 1 = ${count} comparisons, regardless of initial order.`,
        hints: [
          "Count comparisons in each remaining suffix.",
          "Sum (n - 1) + (n - 2) + ... + 1.",
        ],
        workedStep: `For n = ${n}, n(n - 1)/2 = ${count}.`,
      };
    },
  ),
  family("sorting-bubble-count", "sorting-complexity", "application", (r) => {
    const n = r.int(3, 7);
    const b = r.int(-8, 8);
    const sorted = Array.from({ length: n }, (_, i) => b + i);
    const values = r.int(0, 1) ? sorted : [...sorted].reverse();
    const count = final("bubble-sort", values).comparisons;
    return {
      prompt:
        "How many value comparisons does optimized bubble sort perform here?",
      context: `values = ${shown(values)}\n# Stop after a full pass with no swaps.`,
      choices: [
        right(`${count} comparisons`),
        wrong(
          `${count + 1} comparisons`,
          "This adds a comparison that the algorithm never performs.",
        ),
        wrong(
          `${n * n} comparisons`,
          "The triangular pass lengths and possible early exit are both smaller than n squared here.",
        ),
      ],
      explanation: `This input needs ${count} adjacent ordering comparisons. A no-swap pass can terminate early on sorted input.`,
      hints: [
        "A pass of length n compares n - 1 adjacent pairs.",
        "If a whole pass has no swaps, stop; otherwise shorten the next pass.",
      ],
      workedStep: `The authored trace ends at ${count} comparisons for this ${n}-item input.`,
    };
  }),
  family("sorting-stability-order", "sorting-stability", "application", (r) => {
    const low = r.int(-8, 6);
    const high = low + r.int(1, 4);
    const algorithm = r.pick([
      "bubble-sort",
      "selection-sort",
      "insertion-sort",
    ] as const);
    const result = final(algorithm, [high, high, low]).sorting!.originalIndices;
    const aBeforeB = result.indexOf(0) < result.indexOf(1);
    return {
      prompt:
        "After sorting ascending by key, what is the order of equal-key records A and B?",
      context: `algorithm = ${algorithm}\nrecords = [A(key=${high}), B(key=${high}), X(key=${low})]\n# Track identities; selection uses a distant minimum swap.`,
      choices: [
        aBeforeB
          ? right("A before B")
          : wrong(
              "A before B",
              "The distant selection swap moves A past B in this case.",
            ),
        aBeforeB
          ? wrong(
              "B before A",
              "Strict comparisons do not move equal keys past each other in this algorithm.",
            )
          : right("B before A"),
        wrong(
          "One equal-key record is discarded",
          "Sorting preserves every record, including duplicates.",
        ),
      ],
      explanation: `${algorithm} produces original record order ${result.map((id) => ["A", "B", "X"][id]).join(", ")}. ${aBeforeB ? "Equal keys retain their input order." : "The distant selection swap reverses A and B."}`,
      hints: [
        "Label the two equal-key records separately.",
        "Follow any distant exchange or strict-greater shift through to the final array.",
      ],
      workedStep: `The final original-position sequence is ${shown(result)}; A started at 0 and B at 1.`,
    };
  }),
];
