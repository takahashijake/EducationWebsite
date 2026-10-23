import type { CodingExercise } from "./coding-types";
// Public checks are practice feedback, not trusted grading.
export const transferChallenge: CodingExercise = {
  id: "python-expense-summary",
  topicId: "functions",
  title: "Expense summary: transfer challenge",
  revision: 1,
  instructions: [
    "Implement summarize_expenses(amounts, limit). Each amount is an integer number of cents. Reject a negative limit or any negative amount by raising ValueError.",
    "Return a pair (total, over_limit), where total is the sum of all amounts and over_limit is True only when total is strictly greater than limit. An empty list totals zero. Do not print from the function.",
    "Use a loop to process every amount and a return value so callers can reuse the result. Think through an empty list, equality with the limit, and a negative item before running tests.",
  ],
  starter:
    "def summarize_expenses(amounts, limit):\n    # Validate inputs, accumulate amounts, and return (total, over_limit).\n    pass\n\n# Optional manual experiment:\n# print(summarize_expenses([125, 75], 200))",
  expectedBehavior:
    "summarize_expenses([125, 75], 200) returns (200, False); a total over the limit returns True.",
  tests: [
    {
      id: "empty",
      label: "Empty input",
      code: "assert summarize_expenses([], 0) == (0, False)\nassert summarize_expenses([], 100) == (0, False)",
      expectedBehavior: "Empty input totals zero.",
      guidance:
        "Start the accumulator at zero and let an empty loop leave it unchanged.",
      conceptIds: ["loops", "functions"],
    },
    {
      id: "equal",
      label: "Exact limit",
      code: "assert summarize_expenses([125, 75], 200) == (200, False)\nassert summarize_expenses([1, 2, 3], 6) == (6, False)",
      expectedBehavior: "Equality is not over the limit.",
      guidance: "Use > rather than >= for the over-limit test.",
      conceptIds: ["operators-expressions", "conditionals"],
    },
    {
      id: "over",
      label: "Over limit",
      code: "assert summarize_expenses([125, 76], 200) == (201, True)\nassert summarize_expenses([0, 0, 1], 0) == (1, True)",
      expectedBehavior: "All items are included and an excess is detected.",
      guidance:
        "Update the total for each amount before comparing it to the limit.",
      conceptIds: ["loops", "conditionals"],
    },
    {
      id: "invalid-item",
      label: "Negative amount",
      code: "try:\n    summarize_expenses([5, -1, 4], 100)\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError('Negative amount must raise ValueError')",
      expectedBehavior: "A negative amount raises ValueError.",
      guidance: "Check every item, including one after a valid first item.",
      conceptIds: ["loops", "debugging"],
    },
    {
      id: "invalid-limit",
      label: "Negative limit",
      code: "try:\n    summarize_expenses([], -1)\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError('Negative limit must raise ValueError')",
      expectedBehavior:
        "A negative limit raises ValueError even for empty amounts.",
      guidance: "Validate the limit before processing the collection.",
      conceptIds: ["conditionals", "debugging"],
    },
  ],
  explanation:
    "Each public group covers a few stated cases. Passing them supports practice on these cases; it cannot prove correctness for every input or authorship of the solution.",
  reflection:
    "Self-explanation: identify your loop invariant, explain why equality is allowed, and trace how negative input is rejected. Then invent another boundary test.",
  hints: [
    "Begin with total = 0. Think about what it should mean after zero items have been processed.",
    "Reject a negative limit before the loop. Inside the loop, reject a negative amount before adding it to total.",
    "Return (total, total > limit). Equality is allowed by the stated contract.",
  ],
  conceptIds: [
    "variables-data-types",
    "operators-expressions",
    "conditionals",
    "loops",
    "functions",
    "debugging",
  ],
};
