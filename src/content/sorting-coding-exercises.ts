import type { CodingExercise, CodingTest } from "./coding-types";

const topicId = "sorting";
const check = (
  id: string,
  label: string,
  code: string,
  guidance: string,
): CodingTest => ({
  id,
  label,
  code,
  expectedBehavior: label,
  guidance,
  conceptIds: [topicId],
});
const lab = (
  id: string,
  title: string,
  instructions: string[],
  starter: string,
  expectedBehavior: string,
  tests: CodingTest[],
  hints: string[],
  explanation: string,
  reflection: string,
): CodingExercise => ({
  id,
  topicId,
  title,
  instructions,
  starter,
  expectedBehavior,
  tests: tests.map((item) => ({ ...item, id: `${id}-${item.id}` })),
  hints,
  explanation,
  reflection,
  conceptIds: [topicId],
});
const identity = (name: string) =>
  `items = [3, 1, 2]\nresult = ${name}(items)\nassert result is items\nassert items == [1, 2, 3]`;
const boundaries = (name: string) =>
  `assert ${name}([]) == []\nassert ${name}([7]) == [7]\nassert ${name}([2, 2, 2]) == [2, 2, 2]`;
const varied = (name: string) =>
  `assert ${name}([4, 3, 2, 1]) == [1, 2, 3, 4]\nassert ${name}([-2, 5, 0, -4]) == [-4, -2, 0, 5]\nassert ${name}([3, 1, 3, 2]) == [1, 2, 3, 3]`;

export const sortingCodingExercises: CodingExercise[] = [
  lab(
    "sorting-bubble",
    "Implement optimized bubble sort",
    [
      "Sort a mutable list in ascending order in place and return the same list object.",
      "Compare adjacent values, swap only when left > right, and stop after a pass with no swaps.",
    ],
    "def bubble_sort(values):\n    # Grow a sorted suffix; finish the adjacent comparisons.\n    for end in range(len(values) - 1, 0, -1):\n        changed = False\n        for j in range(end):\n            pass  # compare and swap if needed\n        if not changed:\n            break\n    return values",
    "The same list is returned in ascending order; empty and equal-key inputs remain valid.",
    [
      check(
        "identity",
        "Mutates and returns the same list",
        identity("bubble_sort"),
        "Return values, not a new sorted copy.",
      ),
      check(
        "boundaries",
        "Empty, singleton, and equal values",
        boundaries("bubble_sort"),
        "The inner loop may have zero iterations.",
      ),
      check(
        "varied",
        "Reverse, signed, and duplicate cases",
        varied("bubble_sort"),
        "A full pass moves the largest unsorted value right.",
      ),
      check(
        "strict-early",
        "Stable strict comparisons and early exit",
        "class Key:\n    comparisons = 0\n    def __init__(self, value, tag):\n        self.value, self.tag = value, tag\n    def __gt__(self, other):\n        Key.comparisons += 1\n        return self.value > other.value\nitems = [Key(2, 'A'), Key(1, 'X'), Key(2, 'B')]\nassert bubble_sort(items) is items\nassert [item.tag for item in items] == ['X', 'A', 'B']\nKey.comparisons = 0\nbubble_sort([Key(1, 'a'), Key(2, 'b'), Key(3, 'c')])\nassert Key.comparisons == 2",
        "Swap only on strict >; after a no-swap pass, do not perform later comparisons.",
      ),
    ],
    [
      "Compare values[j] with values[j + 1].",
      "On a strict inversion, exchange them and mark changed = True.",
    ],
    "The adjacent pass grows a sorted suffix. A no-swap pass proves the whole list is ordered. See the full bubble reference in the lesson above.",
    "Why does a no-swap pass justify early termination?",
  ),
  lab(
    "sorting-selection",
    "Implement selection sort",
    [
      "Sort the supplied mutable list in place and return that same list.",
      "For each position, scan the remaining suffix for its minimum; keep the earlier candidate on a tie and skip self-swaps.",
    ],
    "def selection_sort(values):\n    for i in range(len(values) - 1):\n        minimum = i\n        for j in range(i + 1, len(values)):\n            pass  # update minimum for a strictly smaller value\n        if minimum != i:\n            values[i], values[minimum] = values[minimum], values[i]\n    return values",
    "The smallest remaining value is placed at each prefix position, while the same list object is returned.",
    [
      check(
        "identity",
        "Mutates and returns the same list",
        identity("selection_sort"),
        "Track a minimum index and exchange only after scanning.",
      ),
      check(
        "boundaries",
        "Empty, singleton, and equal values",
        boundaries("selection_sort"),
        "An empty unsorted suffix needs no comparison.",
      ),
      check(
        "varied",
        "Reverse, signed, and duplicate cases",
        varied("selection_sort"),
        "Compare each later candidate with values[minimum].",
      ),
      check(
        "scan-count",
        "Complete scan and no self-swaps",
        "class Key:\n    comparisons = 0\n    def __init__(self, value):\n        self.value = value\n    def __lt__(self, other):\n        Key.comparisons += 1\n        return self.value < other.value\nclass CountingList(list):\n    writes = 0\n    def __setitem__(self, index, value):\n        self.writes += 1\n        super().__setitem__(index, value)\nitems = CountingList([Key(1), Key(2), Key(3), Key(4)])\nassert selection_sort(items) is items\nassert Key.comparisons == 6\nassert items.writes == 0",
        "Scan every remaining suffix even on sorted input, but do not exchange a position with itself.",
      ),
    ],
    [
      "Start minimum at i.",
      "If values[j] < values[minimum], update the index; then place the minimum after the scan.",
    ],
    "This version always scans the suffix, so its comparison count is quadratic even when no swap is needed. See the full selection reference in the lesson above.",
    "Why can a final exchange change the order of equal-key records?",
  ),
  lab(
    "sorting-insertion",
    "Implement insertion sort",
    [
      "Sort in place and return the same list object.",
      "Save each key, shift only strictly larger earlier values to the right, then insert the key in the gap.",
    ],
    "def insertion_sort(values):\n    for i in range(1, len(values)):\n        key = values[i]\n        j = i - 1\n        while j >= 0 and values[j] > key:\n            break  # replace with a shift and decrease j\n        if j + 1 != i:\n            values[j + 1] = key\n    return values",
    "The processed prefix stays sorted, including duplicate keys in their original order.",
    [
      check(
        "identity",
        "Mutates and returns the same list",
        identity("insertion_sort"),
        "A shifted value is written to j + 1; the key stays temporary.",
      ),
      check(
        "boundaries",
        "Empty, singleton, and equal values",
        boundaries("insertion_sort"),
        "No shift is needed for equal keys.",
      ),
      check(
        "varied",
        "Reverse, signed, and duplicate cases",
        varied("insertion_sort"),
        "Decrease j after each shift so the gap moves left.",
      ),
      check(
        "stable-writes",
        "Stable keys and zero writes on sorted input",
        "class Key:\n    comparisons = 0\n    def __init__(self, value, tag):\n        self.value, self.tag = value, tag\n    def __gt__(self, other):\n        Key.comparisons += 1\n        return self.value > other.value\nclass CountingList(list):\n    writes = 0\n    def __setitem__(self, index, value):\n        self.writes += 1\n        super().__setitem__(index, value)\nitems = CountingList([Key(1, 'a'), Key(2, 'b'), Key(3, 'c')])\nassert insertion_sort(items) is items\nassert Key.comparisons == 2 and items.writes == 0\nrecords = [Key(2, 'A'), Key(1, 'X'), Key(2, 'B')]\nassert [item.tag for item in insertion_sort(records)] == ['X', 'A', 'B']",
        "Strict > shifts only larger keys; skip a redundant key write when no shift occurred.",
      ),
    ],
    [
      "Before the while loop, save values[i] as key.",
      "Set values[j + 1] = values[j] and then j -= 1 while values[j] > key.",
    ],
    "Shifts move larger records without swapping the key repeatedly. Strict > preserves equal-key input order. See the full insertion reference in the lesson above.",
    "How many shifts does already sorted input require?",
  ),
  lab(
    "sorting-bubble-boundary",
    "Repair a bubble pass boundary",
    [
      "Predict the failure caused by skipping the final adjacent pair of each pass.",
      "Repair the loop bound. Keep the ascending, in-place, same-object contract and no-swap early exit.",
    ],
    "def repair_bubble(values):\n    for end in range(len(values) - 1, 0, -1):\n        changed = False\n        for j in range(end - 1):  # last adjacent pair is skipped\n            if values[j] > values[j + 1]:\n                values[j], values[j + 1] = values[j + 1], values[j]\n                changed = True\n        if not changed:\n            break\n    return values",
    "Even a two-element inversion must be compared and repaired; return the original list.",
    [
      check(
        "pair",
        "Two-element inversion",
        "items = [2, 1]\nassert repair_bubble(items) is items\nassert items == [1, 2]",
        "The inner range must include j = 0 when end = 1.",
      ),
      check(
        "edges",
        "Empty, singleton, and sorted",
        "assert repair_bubble([]) == []\nassert repair_bubble([7]) == [7]\nassert repair_bubble([1, 2, 3]) == [1, 2, 3]",
        "Keep the early-exit behavior.",
      ),
      check(
        "varied",
        "Reverse and duplicates",
        varied("repair_bubble"),
        "The final compared pair uses positions end - 1 and end.",
      ),
    ],
    [
      "For [2, 1], end is 1. What values does range(end - 1) visit?",
      "The correct inner stop is end, which is excluded by range.",
    ],
    "A pass through index end needs comparisons j = 0 through end - 1. Changing range(end - 1) to range(end) restores that boundary.",
    "Why can early exit conceal the missing-pair defect?",
  ),
  lab(
    "sorting-insertion-stability",
    "Repair an insertion stability defect",
    [
      "The current algorithm sorts numbers but shifts equal keys and can reverse equal-key records.",
      "Repair the comparison while preserving in-place ascending order and the same-list return contract.",
    ],
    "def stable_insertion(values):\n    for i in range(1, len(values)):\n        key = values[i]\n        j = i - 1\n        while j >= 0 and values[j] >= key:  # equal keys shift incorrectly\n            values[j + 1] = values[j]\n            j -= 1\n        if j + 1 != i:\n            values[j + 1] = key\n    return values",
    "Equal-key records retain their original relative order while all keys ascend.",
    [
      check(
        "numbers",
        "Ascending numeric result",
        varied("stable_insertion"),
        "The numerical result alone cannot prove stability.",
      ),
      check(
        "identity",
        "Same mutable list",
        identity("stable_insertion"),
        "Return the supplied list after mutation.",
      ),
      check(
        "stable-records",
        "Decorated equal-key records",
        "class Record:\n    def __init__(self, key, tag):\n        self.key, self.tag = key, tag\n    def __gt__(self, other):\n        return self.key > other.key\n    def __ge__(self, other):\n        return self.key >= other.key\nitems = [Record(2, 'A'), Record(1, 'X'), Record(2, 'B')]\nassert stable_insertion(items) is items\nassert [record.tag for record in items] == ['X', 'A', 'B']",
        "Equal keys must not shift past one another.",
      ),
      check(
        "boundaries",
        "Empty and singleton",
        "assert stable_insertion([]) == []\nassert stable_insertion([7]) == [7]",
        "These cases have no adjacent key comparison.",
      ),
    ],
    [
      "Numeric equality hides record identity; follow A and B with the same key.",
      "Use strict > rather than >= in the shift condition.",
    ],
    "Strict greater-than shifts only larger keys. The saved equal key remains after earlier equal records, preserving their input order.",
    "Why can [1, 2, 2] look correct even if equal-key records were reversed?",
  ),
];
