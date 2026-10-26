import type { Lesson } from "./types";

export const sortingLesson: Lesson = {
  topicId: "sorting",
  minutes: 38,
  objectives: [
    "Trace bubble, selection, and insertion sort with their sorted-region invariants.",
    "Count value comparisons, swaps, and indexed array writes for a stated implementation.",
    "Implement ascending in-place sorting and reason about empty, duplicate, and nearly sorted inputs.",
    "Compare best, average, and worst-case growth, auxiliary space, and stability.",
  ],
  introduction: [
    "Sorting rearranges a collection according to an order. For ascending numbers, each value is no larger than the one after it; descending order reverses that comparison. An input contract states what values are accepted and whether the original list may change. An output contract states the order, whether all original items remain, and whether the function mutates the same list or returns a separate one. The three Python labs here sort a mutable list in place and return that same list.",
    "Sorted data supports tasks such as displaying ranked values and using binary search. Sorting first has a cost, however: one search after a quadratic sort is not automatically cheaper than one linear scan. We will use small arrays to make the mechanics visible, then use growth rates to reason about larger inputs. The visualizer follows authored algorithms, while the separate Python Code Lab executes your own code.",
  ],
  concept: {
    title: "Three ways to grow an ordered region",
    paragraphs: [
      "Bubble sort compares adjacent values and swaps only when the left value is strictly greater. At the end of a full pass, the largest value in the unsorted prefix has moved to its final position. That is the sorted-suffix invariant. A pass with no swaps proves the entire array is ordered, so this optimized variant stops early. A sorted input takes n - 1 value comparisons and O(n) time; reverse order still needs O(n²) comparisons and swaps.",
      "Selection sort scans the unsorted suffix for its smallest value, keeping the earliest candidate on a tie. It then exchanges that candidate with the first unsorted position, unless they are already the same position. After placement, the sorted prefix contains the smallest values in final order. For n values, this variant makes n(n - 1)/2 value comparisons regardless of input order. It performs at most n - 1 swaps, but a swap can move an equal-key record past another equal-key record, so conventional swap-based selection sort is not generally stable.",
      "Insertion sort treats the first value as a sorted prefix. For each later key, it compares the key with earlier values, shifts strictly larger values one position right, and writes the key into the gap. The processed prefix is sorted after each insertion. Equal values are not shifted past the key, preserving their relative order. This variant skips a redundant key write when no shift occurred. Already sorted input needs n - 1 comparisons and no array writes; reverse order needs O(n²) comparisons and shifts.",
      "A stable sort preserves the original order of records whose sort keys compare equal. Numeric output alone cannot show this: label equal-key records A and B to inspect their identities. This lesson's strict-greater bubble and insertion variants are stable. Swap-based selection can reorder equal records. All three use O(1) auxiliary array space here; a returned copy would need O(n) extra storage for the copy.",
    ],
  },
  demonstration: {
    kind: "algorithm",
    algorithm: "bubble-sort",
    caption:
      "Compare adjacent values, swap strict inversions, and watch the sorted suffix grow after each pass.",
  },
  demonstrations: [
    {
      kind: "algorithm",
      algorithm: "selection-sort",
      caption:
        "Scan for the minimum candidate, then place it at the front of the unsorted region.",
    },
    {
      kind: "algorithm",
      algorithm: "insertion-sort",
      caption:
        "Hold a key temporarily, shift larger values, and extend the sorted prefix.",
    },
    {
      kind: "sorting-comparison",
      caption: "Compare all three algorithms on one shared input.",
    },
  ],
  sections: [
    {
      title: "Bubble sort: a suffix becomes final",
      paragraphs: [
        "The inner loop ends before the current sorted suffix. Every adjacent comparison is counted, including those that do not swap. This variant swaps only on >, so equal-key records retain their order. If an entire pass makes no swap, all adjacent pairs are ordered and it stops immediately. Worst and average time are O(n²), best time is O(n), and auxiliary space is O(1).",
      ],
      code: "def bubble_sort(values):\n    for end in range(len(values) - 1, 0, -1):\n        changed = False\n        for j in range(end):\n            if values[j] > values[j + 1]:\n                values[j], values[j + 1] = values[j + 1], values[j]\n                changed = True\n        if not changed:\n            break\n    return values",
    },
    {
      title: "Selection sort: a prefix contains the smallest values",
      paragraphs: [
        "Each pass finds the minimum in indices i through n - 1. The strict < comparison retains the earliest equal minimum during that scan. The final exchange can still move a different equal record, so tie handling alone does not make this swap-based variant stable. Sorted input avoids swaps, yet the nested scan still performs n(n - 1)/2 comparisons. Best, average, and worst time are O(n²); auxiliary space is O(1).",
      ],
      code: "def selection_sort(values):\n    for i in range(len(values) - 1):\n        minimum = i\n        for j in range(i + 1, len(values)):\n            if values[j] < values[minimum]:\n                minimum = j\n        if minimum != i:\n            values[i], values[minimum] = values[minimum], values[i]\n    return values",
    },
    {
      title: "Insertion sort: a sorted prefix accepts one key",
      paragraphs: [
        "Save the next key in a temporary variable. While a preceding value is strictly larger, shift it right with one indexed write. Insert the key with one more indexed write only if at least one value shifted. Equal keys stop the shift, making this implementation stable. Best time is O(n), average and worst time are O(n²), and auxiliary space is O(1). Nearly sorted input often needs few shifts, though actual runtime also depends on language and machine costs.",
      ],
      code: "def insertion_sort(values):\n    for i in range(1, len(values)):\n        key = values[i]\n        j = i - 1\n        while j >= 0 and values[j] > key:\n            values[j + 1] = values[j]\n            j -= 1\n        if j + 1 != i:\n            values[j + 1] = key\n    return values",
    },
    {
      title: "How to compare costs responsibly",
      paragraphs: [
        "Our cost model counts one ordering comparison between two values or between a saved key and an array value. A swap exchanges distinct array positions and counts as two indexed writes. A shift or key insertion counts as one indexed write; temporary assignments and loop-bound tests are excluded. Counters in the player follow these exact rules and never represent measured runtime.",
        "All three methods here use O(1) auxiliary space and O(n²) average and worst-case time. Optimized bubble and insertion have O(n) best-case time; selection stays O(n²) because it scans every suffix. Bubble and insertion are stable under strict comparisons; conventional swap-based selection is not. A comparison can be cheap or expensive depending on the data, and Python interpreter overhead also matters. Small displayed counts cannot establish which method is fastest in production.",
        "For ordinary Python applications, use sorted(values) to return a new list or values.sort() to mutate a list. Python's built-in sort is stable, heavily engineered, and has O(n log n) worst-case comparison growth. Write these quadratic algorithms to understand invariants and boundaries, not to replace the production library.",
      ],
    },
  ],
  workedExample: {
    title: "Trace bubble sort on [4, 2, 4, 1]",
    introduction:
      "Predict each full pass before using the player. Equal 4 values must keep their input order.",
    steps: [
      "Pass 1 compares 4 with 2 and swaps, compares equal 4 values without swapping, then swaps 4 with 1. State: [2, 4, 1, 4]. The last 4 is final.",
      "Pass 2 compares 2 with 4 without swapping, then swaps 4 with 1. State: [2, 1, 4, 4]. The final two values form the sorted suffix.",
      "Pass 3 swaps 2 with 1. State: [1, 2, 4, 4]. The entire list is ascending, and every original item remains.",
      "For an already sorted [1, 2, 3, 4], the first pass makes three comparisons and no swaps; early termination avoids later passes.",
    ],
  },
  code: {
    language: "Python 3",
    title: "Bubble sort in place",
    source:
      "def bubble_sort(values):\n    for end in range(len(values) - 1, 0, -1):\n        changed = False\n        for j in range(end):\n            if values[j] > values[j + 1]:\n                values[j], values[j + 1] = values[j + 1], values[j]\n                changed = True\n        if not changed:\n            break\n    return values\n\nitems = [4, 2, 4, 1]\nresult = bubble_sort(items)\nprint(result, result is items)  # [1, 2, 4, 4] True",
    explanation:
      "The function mutates the supplied list and returns the same object. The comparison is strict, preserving equal-key input order. The visualizer follows this authored algorithm but does not trace the code you type in the lab.",
  },
  misconceptions: [
    {
      belief: "A pass that makes no swap must still be repeated.",
      correction:
        "If every adjacent pair was ordered during a full bubble pass, the whole array is sorted; the optimized variant stops.",
    },
    {
      belief:
        "Selection sort is linear on sorted input because it makes no swaps.",
      correction:
        "It still performs n(n - 1)/2 value comparisons while scanning each unsorted suffix.",
    },
    {
      belief: "Insertion sort repeatedly swaps the key with its neighbor.",
      correction:
        "This implementation saves the key, shifts larger values right, and inserts the key once into the gap.",
    },
    {
      belief: "Equal numbers prove a sort is stable.",
      correction:
        "Stability concerns the original order of equal-key records; track identities A and B, not just their equal numeric keys.",
    },
  ],
  takeaways: [
    "State the input, mutation, and output contract before implementing a sort.",
    "Bubble grows a sorted suffix; selection and insertion grow sorted prefixes by different operations.",
    "Separate comparisons, swaps, and writes, and state which variant is counted.",
    "Use decorated identities to reason about stability, and use Python's built-in sort for ordinary applications.",
  ],
  questions: [
    {
      id: "sorting-q1",
      prompt: "After one full bubble pass on [3, 1, 2], what is guaranteed?",
      options: [
        "The last value is final",
        "The first value is final",
        "Every value is final",
      ],
      correctIndex: 0,
      explanation:
        "The largest value moves right through adjacent exchanges, so the final position belongs to the sorted suffix after a pass.",
    },
    {
      id: "sorting-q2",
      prompt:
        "Why does selection sort still make quadratic comparisons on sorted input?",
      options: [
        "It always swaps every pair",
        "It scans each remaining suffix for a minimum",
        "It shifts every key right",
      ],
      correctIndex: 1,
      explanation:
        "The minimum scan compares each later candidate on every pass, totaling n(n - 1)/2 comparisons even with zero swaps.",
    },
    {
      id: "sorting-q3",
      prompt: "Which statement about these in-place variants is correct?",
      options: [
        "All three are stable",
        "Bubble and insertion are stable; swap-based selection need not be",
        "Selection is stable but insertion is not",
      ],
      correctIndex: 1,
      explanation:
        "Strict comparisons preserve equal-key order in bubble and insertion; selection's final swap may move an equal record past another.",
    },
  ],
  nextStep:
    "Use the Python Code Labs to implement each invariant, then try focused Sorting retrieval and adaptive variations in Learning Insights.",
};
