import type { Lesson } from "./types";
export const dsaLessons: Record<string, Lesson> = {
  "arrays-strings": {
    topicId: "arrays-strings",
    minutes: 24,
    objectives: [
      "Read and update zero-based indexed sequences safely.",
      "Trace traversal, including empty and singleton inputs.",
      "Compare access, traversal, insertion, and deletion costs in Python lists and strings.",
    ],
    introduction: [
      "A sequence puts values in an order. Every position has an index: in Python, the first is 0, the next is 1, and the last is len(values) - 1. The length is a count, not the final valid index. An empty sequence has length 0 and no valid index.",
      "Python lists are mutable dynamic arrays: an indexed element can be replaced. Python strings are immutable sequences of characters: reading text[0] works, but text[0] = 'X' raises TypeError. A new string must be constructed instead. Other languages use different representations and mutation rules, so reason from the actual collection contract.",
    ],
    concept: {
      title: "Positions, boundaries, and costs",
      paragraphs: [
        "For values = [4, 7, 2], values[0] is 4, values[2] is 2, and values[3] raises IndexError. Python also permits negative indices: values[-1] is 2. That convenience does not make index len(values) valid. Before reading the first item, ask whether the collection is empty. A singleton has one valid nonnegative index: 0.",
        "A for loop over values visits each item without manually advancing an index. Use enumerate(values) when you also need its position. A manual loop with range(len(values)) visits exactly 0 through len(values) - 1; range(len(values) + 1) visits an invalid final index. Predict the indices before running code, especially for empty and one-element inputs.",
        "With a Python list, indexed access and replacement are O(1) under the standard cost model. Reading every element is O(n), where n is the number of elements. Inserting or deleting at the front or middle shifts following references, so it is O(n). Appending at the end is amortized O(1), though a resize can make one append O(n). These are operation costs, not claims that the collection itself is O(n) time.",
        "Indexing a Python string also reads a character, but strings cannot be changed in place. Building a modified string copies characters and generally takes O(n). Character comparisons and copying can have costs beyond the simplified constant-size-value model. A language's fixed-size array, linked list, and Python list need separate analyses; they are not interchangeable merely because each stores a sequence.",
      ],
    },
    demonstration: {
      kind: "algorithm",
      algorithm: "traversal",
      caption:
        "Step through every index. The empty case finishes without touching index 0.",
    },
    sections: [
      {
        title: "Prediction: the boundary before execution",
        paragraphs: [
          "For [5, 8, 1], predict the indices produced by range(len(values)): 0, 1, 2. Now predict range(len(values) + 1): 0, 1, 2, 3. The final index is invalid. For [], the safe range is empty; for [5], it yields only 0.",
        ],
        code: "values = [5, 8, 1]\nfor index in range(len(values)):\n    print(index, values[index])\n# 0 5; 1 8; 2 1",
      },
      {
        title: "Mutation and representation",
        paragraphs: [
          "Assigning values[1] = 9 replaces one list element. Calling values.insert(0, 6) must move existing list references right. To change the first character in text = 'cat', construct 'b' + text[1:] and bind the result; the original string is unchanged. The cost of an operation depends on its position and representation.",
        ],
        code: "values = [4, 7, 2]\nvalues[1] = 9\nvalues.insert(0, 6)\ntext = 'cat'\nchanged = 'b' + text[1:]\nprint(values, text, changed)",
      },
    ],
    workedExample: {
      title: "Find the sum at even indices",
      introduction:
        "Compute the sum of elements at indices 0, 2, 4, and so on, including an empty list.",
      steps: [
        "For [5, 8, 1, 4], the valid indices are 0 through 3. The selected indices are 0 and 2.",
        "Start total at 0. Add values[0] = 5, then values[2] = 1. The result is 6.",
        "For [], range(0, 0, 2) visits nothing and the result remains 0. For [5], only index 0 is visited.",
        "The loop visits about half the elements, still O(n) time. It uses O(1) additional space, excluding the input.",
      ],
    },
    code: {
      language: "Python 3",
      title: "Traverse without crossing the boundary",
      source:
        "def sum_even_indices(values):\n    total = 0\n    for index in range(0, len(values), 2):\n        total += values[index]\n    return total\n\nprint(sum_even_indices([5, 8, 1, 4]))  # 6\nprint(sum_even_indices([]))            # 0",
      explanation:
        "The stop len(values) is excluded, so every visited index is valid. This counts selected positions, not even-valued elements.",
    },
    misconceptions: [
      {
        belief: "The last index is len(values).",
        correction:
          "The length counts elements; the last nonnegative index is len(values) - 1 only when the collection is nonempty.",
      },
      {
        belief: "Every insertion into a Python list is O(1).",
        correction:
          "Insertion in the middle shifts later references and takes O(n); end append is amortized O(1).",
      },
      {
        belief: "Python strings can be updated like lists.",
        correction:
          "Strings are immutable. Build a new string instead of assigning to one character.",
      },
    ],
    takeaways: [
      "Check empty input before direct indexing.",
      "range(len(values)) visits exactly the valid nonnegative indices.",
      "Name the operation and collection representation before stating its cost.",
    ],
    exercises: [
      {
        id: "arrays-p1",
        source:
          "values = [10]\nfor i in range(len(values) + 1):\n    print(values[i])",
        prompt: "Predict where this program fails.",
        options: [
          "It prints 10 and stops",
          "It raises IndexError at index 1",
          "It fails at index 0",
        ],
        correctIndex: 1,
        explanation:
          "range(2) includes 0 and 1, but a singleton has only index 0. The extra iteration raises IndexError.",
      },
    ],
    questions: [
      {
        id: "arrays-q1",
        prompt:
          "What is the first valid nonnegative index of a nonempty Python list?",
        options: ["0", "1", "len(values)"],
        correctIndex: 0,
        explanation:
          "Python sequences use zero-based indexing: the first element is at index 0, independent of length.",
      },
      {
        id: "arrays-q2",
        prompt: "What indices does range(len([])) produce?",
        options: ["0", "0 and 1", "None"],
        correctIndex: 2,
        explanation:
          "The empty list has length zero, so range(0) contains no indices and the loop body never runs.",
      },
      {
        id: "arrays-q3",
        prompt:
          "Which cost is typical for insertion at the front of a Python list of n elements?",
        options: [
          "O(1), always",
          "O(n), due to shifting",
          "O(log n), due to halving",
        ],
        correctIndex: 1,
        explanation:
          "Existing references must shift one position to make room, so the work grows linearly with n.",
      },
    ],
    nextStep:
      "Searching uses these same indices and boundaries to locate a value. Review Introduction to Big O to compare the work done by each search.",
  },
  searching: {
    topicId: "searching",
    minutes: 28,
    objectives: [
      "Implement linear search and return -1 when a value is missing.",
      "Maintain inclusive low and high bounds during binary search on sorted data.",
      "Explain O(n) versus O(log n) worst-case comparisons.",
    ],
    introduction: [
      "Searching asks whether and where a target appears. In the Arrays and Strings lesson, a list gave us indexed access and safe traversal. In Introduction to Big O, we counted how work grows with input size. Here we use both ideas to compare two search strategies.",
      "Linear search checks elements in order and works on unsorted input. Binary search compares the middle element of a correctly ascending sorted input, then rules out one half. Sorting first has its own cost; binary search alone does not make an unsorted collection searchable by halves.",
    ],
    concept: {
      title: "Maintain a region that may still contain the target",
      paragraphs: [
        "Linear search examines index 0, then 1, and so on. Return as soon as an element equals the target; otherwise return -1 after the loop. An empty list performs zero comparisons. With duplicates it returns the leftmost match because earlier indices are checked first. Its worst case is n comparisons: O(n) time.",
        "For binary search, maintain inclusive bounds low = 0 and high = len(values) - 1. The loop invariant is: if the target is present, at least one matching index lies inside [low, high]. Compute mid = low + (high - low) // 2. If values[mid] is smaller than the target, discard indices through mid by setting low = mid + 1. If larger, set high = mid - 1. Equality returns mid. When low > high, the interval is empty and -1 is correct.",
        "The order must support the comparison: ascending numeric values here. If input is unsorted, discarding half is unjustified and a match can be lost. With duplicates, this implementation returns the first matching midpoint encountered, not necessarily the leftmost matching index. That contract is different from linear search and should be tested explicitly.",
        "Each unsuccessful binary comparison removes roughly half the remaining candidates. After k comparisons, at most about n / 2^k remain; reaching one candidate takes roughly log₂ n halvings. Thus worst-case comparisons grow O(log n), including a final failure check. Empty input takes zero comparisons. This bound assumes indexed access is O(1); it would not transfer unchanged to a linked list.",
      ],
    },
    demonstration: {
      kind: "algorithm",
      algorithm: "binary-search",
      caption:
        "Follow the inclusive candidate interval. Choose a missing or duplicate scenario to test the invariant.",
    },
    demonstrations: [
      {
        kind: "algorithm",
        algorithm: "linear",
        caption:
          "Scan each value in order; compare the same boundary scenarios with binary search.",
      },
    ],
    sections: [
      {
        title: "Compare with a linear scan",
        paragraphs: [
          "Use the linear search stepper below on an unsorted list. Compare the first, last, missing, empty, and duplicate scenarios. Count only actual element-to-target comparisons; the displayed counts are not timing measurements.",
        ],
        code: "def linear_search(values, target):\n    for index, value in enumerate(values):\n        if value == target:\n            return index\n    return -1",
      },
      {
        title: "Check the invariant at each boundary",
        paragraphs: [
          "For [1, 3, 5, 7, 9, 11] and target 11, start with [0, 5]. Midpoint 2 holds 5, so the new interval is [3, 5]. Midpoint 4 holds 9, leaving [5, 5]. The final midpoint 5 holds 11. Each discarded region is guaranteed too small because the input is ordered.",
        ],
      },
    ],
    workedExample: {
      title: "Find a missing value",
      introduction: "Search sorted [1, 3, 5, 7, 9] for 6.",
      steps: [
        "Start low = 0, high = 4. Midpoint 2 contains 5. Since 5 < 6, indices 0 through 2 cannot contain 6; set low = 3.",
        "Now [3, 4] remains. Midpoint 3 contains 7. Since 7 > 6, discard 3 and 4 by setting high = 2.",
        "low = 3 is greater than high = 2. The interval is empty, so return -1 after two element comparisons.",
        "For an unsorted input, either discard could lose 6. Check the precondition before using this reasoning.",
      ],
    },
    code: {
      language: "Python 3",
      title: "Binary search on ascending values",
      source:
        "def binary_search(values, target):\n    low, high = 0, len(values) - 1\n    while low <= high:\n        mid = low + (high - low) // 2\n        if values[mid] == target:\n            return mid\n        if values[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1\n\nprint(binary_search([1, 3, 5, 7, 9], 7))  # 3\nprint(binary_search([1, 3, 5, 7, 9], 6))  # -1",
      explanation:
        "The bounds are inclusive. Updating past mid makes progress even for a one-element interval. The midpoint form also avoids overflow in fixed-width integer languages, though Python integers grow as needed.",
    },
    misconceptions: [
      {
        belief: "Binary search works on any list.",
        correction:
          "Without correct ordering, comparing the midpoint does not justify discarding either half.",
      },
      {
        belief: "When a midpoint is too small, set low = mid.",
        correction:
          "That retains a known mismatch and can loop forever on a one-element interval; use mid + 1.",
      },
      {
        belief: "Binary search always returns the first duplicate.",
        correction:
          "This implementation returns the first matching midpoint encountered. A leftmost-match version needs a different invariant.",
      },
    ],
    takeaways: [
      "Linear search handles unsorted data and returns the first duplicate.",
      "Binary search requires ordered, indexed input and an invariant over its candidate interval.",
      "Worst-case comparison counts grow O(n) for linear search and O(log n) for binary search.",
    ],
    exercises: [
      {
        id: "searching-p1",
        source:
          "values = [1, 3, 5, 7]\nlow, high = 0, 3\n# target is 7; mid is 1",
        prompt:
          "After comparing midpoint value 3 with target 7, what are the inclusive bounds?",
        options: ["[1, 3]", "[2, 3]", "[0, 1]"],
        correctIndex: 1,
        explanation:
          "The midpoint and everything to its left are smaller than 7. Set low to mid + 1 = 2; high remains 3.",
      },
    ],
    questions: [
      {
        id: "searching-q1",
        prompt: "Which input condition is required by this binary search?",
        options: [
          "Ascending sorted values",
          "Unique values",
          "An even number of values",
        ],
        correctIndex: 0,
        explanation:
          "Only sorted order justifies discarding a half based on its midpoint; duplicates and odd lengths are allowed.",
      },
      {
        id: "searching-q2",
        prompt: "What does linear search return for target 4 in [4, 2, 4]?",
        options: ["0", "2", "-1"],
        correctIndex: 0,
        explanation:
          "It checks indices from left to right and returns immediately at the first matching index 0.",
      },
      {
        id: "searching-q3",
        prompt:
          "Why is binary search O(log n) in the worst case on indexed sorted input?",
        options: [
          "It compares all n elements",
          "It halves the possible interval after each mismatch",
          "It sorts the input while searching",
        ],
        correctIndex: 1,
        explanation:
          "Every unsuccessful midpoint comparison discards roughly half the candidates, so the number of rounds grows logarithmically.",
      },
    ],
    nextStep:
      "Practice both searches in Python, then revisit the Big O introduction to explain your comparison counts.",
  },
};
