import type { CodingExercise, CodingTest } from "./coding-types";

function check(
  id: string,
  label: string,
  code: string,
  expectedBehavior: string,
  guidance: string,
  conceptIds: string[],
): CodingTest {
  return { id, label, code, expectedBehavior, guidance, conceptIds };
}
export const codingExercises: Record<string, CodingExercise> = {
  "variables-data-types": {
    id: "variables-conversion",
    topicId: "variables-data-types",
    title: "Convert before calculating",
    instructions: [
      "Predict what happens when text is combined with a number. Run this mistaken program and inspect its output, then repair the conversion.",
      "Keep price_text as text. Assign price as a float and total as the price of three notebooks. Print total so you can compare your prediction with execution.",
    ],
    starter:
      "price_text = '4.50'\nquantity = 3\nprice = price_text\ntotal = price * quantity\nprint(total)",
    expectedBehavior:
      "price_text stays '4.50', price is 4.5, and total is the number 13.5 rather than repeated text.",
    tests: [
      check(
        "numeric-price",
        "Convert text to a number",
        "assert isinstance(price, float), f'Expected float price, observed {type(price).__name__}: {price!r}'\nassert price == 4.5, f'Expected 4.5, observed {price!r}'",
        "price is the float 4.5.",
        "Multiplying text repeats it. Inspect the type before performing arithmetic; an explicit float conversion preserves the decimal part.",
        ["variables-data-types"],
      ),
      check(
        "basket-total",
        "Calculate a numeric total",
        "assert price_text == '4.50', 'Keep the original text for comparison'\nassert isinstance(total, (int, float)) and total == 13.5, f'Expected numeric 13.5, observed {total!r}'",
        "The total of three notebooks is 13.5.",
        "Trace the right-hand expression using the converted price and the integer quantity.",
        ["operators-expressions", "variables-data-types"],
      ),
    ],
    explanation:
      "Run shows the program's current output. Tests additionally check values and types; printing the expected digits alone cannot satisfy that contract.",
    reflection:
      "Why can repeated text look plausible while still having the wrong type?",
    conceptIds: ["variables-data-types", "operators-expressions"],
  },
  "operators-expressions": {
    id: "operators-range",
    topicId: "operators-expressions",
    title: "Repair a range condition",
    instructions: [
      "A valid score is at least 0 and at most 100. Predict whether the current or expression rejects any integer.",
      "Repair valid_score(score) to return a boolean representing the full inclusive interval.",
    ],
    starter:
      "def valid_score(score):\n    return score >= 0 or score <= 100\n\nprint(valid_score(-1))",
    expectedBehavior: "0, 50, and 100 are valid; -1 and 101 are invalid.",
    tests: [
      check(
        "score-endpoints",
        "Accept both endpoints",
        "for score in [0, 50, 100]:\n    actual = valid_score(score)\n    assert actual is True, f'Expected True for {score}, observed {actual!r}'",
        "Include 0 and 100.",
        "Check whether both comparisons hold at equality. The endpoints belong to the interval.",
        ["operators-expressions"],
      ),
      check(
        "score-outside",
        "Reject neighboring outside values",
        "for score in [-1, 101]:\n    actual = valid_score(score)\n    assert actual is False, f'Expected False for {score}, observed {actual!r}'",
        "Reject -1 and 101.",
        "Both bounds must hold at once. With or, every integer satisfies at least one side.",
        ["operators-expressions", "conditionals"],
      ),
    ],
    explanation:
      "Boundary neighbors distinguish the intended interval from a condition that is true for every number.",
    reflection:
      "Which comparison remains true for -1, and why did or accept it?",
    conceptIds: ["operators-expressions", "conditionals"],
  },
  conditionals: {
    id: "conditionals-threshold",
    topicId: "conditionals",
    title: "Implement an inclusive decision",
    instructions: [
      "Implement status(score): return 'pass' for scores of at least 60 and 'retry' otherwise.",
      "Before running the tests, predict the branches selected by 59, 60, and 61.",
    ],
    starter:
      "def status(score):\n    # TODO: select one message and return it\n    pass\n\nprint(status(60))",
    expectedBehavior: "59 returns 'retry'; 60 and 61 return 'pass'.",
    tests: [
      check(
        "threshold-below",
        "Below the threshold",
        "actual = status(59)\nassert actual == 'retry', f'Expected retry for 59, observed {actual!r}'",
        "59 must retry.",
        "Trace the false branch as well as the successful one. Print is a side effect; the contract needs a returned string.",
        ["conditionals", "functions"],
      ),
      check(
        "threshold-at",
        "At and above the threshold",
        "for score in [60, 61]:\n    actual = status(score)\n    assert actual == 'pass', f'Expected pass for {score}, observed {actual!r}'",
        "60 and 61 must pass.",
        "At least includes equality. Compare the selected branch for > and >= at exactly 60.",
        ["conditionals", "operators-expressions"],
      ),
    ],
    explanation:
      "Three neighboring scores isolate the threshold decision without introducing unrelated inputs.",
    reflection:
      "How would the tests change if the rule said strictly greater than 60?",
    conceptIds: ["conditionals", "operators-expressions"],
  },
  loops: {
    id: "loops-inclusive-sum",
    topicId: "loops",
    title: "Repair an off-by-one sum",
    instructions: [
      "The function should sum integers 1 through n inclusive, for nonnegative integer n.",
      "Predict the smallest failing input for this range, run it, and repair the boundary.",
    ],
    starter:
      "def inclusive_sum(n):\n    total = 0\n    for value in range(1, n):\n        total += value\n    return total\n\nprint(inclusive_sum(1))",
    expectedBehavior:
      "inclusive_sum(0) is 0, inclusive_sum(1) is 1, and inclusive_sum(3) is 6.",
    tests: [
      check(
        "sum-empty",
        "Zero iterations",
        "actual = inclusive_sum(0)\nassert actual == 0, f'Expected 0 for n=0, observed {actual!r}'",
        "An empty sum is 0.",
        "Initialize the accumulator before the loop; an empty range never binds its loop variable.",
        ["loops"],
      ),
      check(
        "sum-boundary",
        "Smallest positive and typical input",
        "for n, expected in [(1, 1), (2, 3), (3, 6)]:\n    actual = inclusive_sum(n)\n    assert actual == expected, f'Expected {expected} for n={n}, observed {actual!r}'",
        "Include n in every nonempty sum.",
        "Inspect range's exclusive stop. A repair must include the last value without adding an unrelated constant.",
        ["loops", "debugging"],
      ),
    ],
    explanation:
      "A program can run without exceptions yet violate its boundary contract. Compare the first diverging iteration with the authored trace.",
    reflection: "Why is n=1 a clearer counterexample than n=100?",
    conceptIds: ["loops", "debugging"],
  },
  functions: {
    id: "functions-return",
    topicId: "functions",
    title: "Return a reusable result",
    instructions: [
      "Implement add_fee(amount, fee=2). Return the sum rather than only printing it.",
      "The default fee applies when the caller omits that argument. Test an explicit zero fee as well.",
    ],
    starter:
      "def add_fee(amount, fee=2):\n    # TODO: return a value the caller can use\n    pass\n\nresult = add_fee(10)\nprint(result)",
    expectedBehavior:
      "add_fee(10) returns 12; add_fee(10, 0) returns 10; add_fee(0, 3) returns 3.",
    tests: [
      check(
        "fee-default",
        "Default argument and return value",
        "actual = add_fee(10)\nassert actual == 12, f'Expected returned 12, observed {actual!r}'",
        "Return 12 for the default fee.",
        "A printed number is not the function result. A function that reaches the end without return yields None.",
        ["functions"],
      ),
      check(
        "fee-explicit",
        "Explicit zero and alternate fee",
        "for amount, fee, expected in [(10, 0, 10), (0, 3, 3)]:\n    actual = add_fee(amount, fee)\n    assert actual == expected, f'Expected {expected}, observed {actual!r}'",
        "Honor explicit arguments, including zero.",
        "Use the supplied fee rather than a hardcoded constant. Zero is a valid value, not a missing argument.",
        ["functions", "variables-data-types"],
      ),
    ],
    explanation:
      "Testing returned values checks the interface between the function and its callers.",
    reflection:
      "Where can the caller use the returned result that it could not use printed output?",
    conceptIds: ["functions"],
  },
  recursion: {
    id: "recursion-factorial",
    topicId: "recursion",
    title: "Repair the factorial base case",
    instructions: [
      "For nonnegative integers, factorial(0) must be 1. Predict how the mistaken base value changes all callers' results.",
      "Repair the base case without replacing recursion with a lookup table. Reject negative integer input with ValueError.",
    ],
    starter:
      "def factorial(n):\n    if n < 0:\n        raise ValueError('n must be nonnegative')\n    if n == 0:\n        return 0\n    return n * factorial(n - 1)\n\nprint(factorial(3))",
    expectedBehavior:
      "0 and 1 produce 1; 3 produces 6; 4 produces 24. Negative integer input is rejected.",
    tests: [
      check(
        "factorial-base",
        "Base case and one recursive step",
        "for n in [0, 1]:\n    actual = factorial(n)\n    assert actual == 1, f'Expected 1 for factorial({n}), observed {actual!r}'",
        "The base result is multiplicative identity 1.",
        "Each caller multiplies the child's answer. A base value of zero propagates zero through every pending multiplication.",
        ["recursion", "functions"],
      ),
      check(
        "factorial-calls",
        "Several calls and rejected input",
        "for n, expected in [(3, 6), (4, 24)]:\n    actual = factorial(n)\n    assert actual == expected, f'Expected {expected}, observed {actual!r}'\ntry:\n    factorial(-1)\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError('Negative input must raise ValueError')",
        "Calls unwind to 6 and 24, while negatives are rejected.",
        "Keep a decreasing argument and propagate the child's return value. Use the call-stack demonstration to explain the order.",
        ["recursion", "debugging"],
      ),
    ],
    explanation:
      "Passing these finite cases gives evidence about behavior, not a proof of recursion or all inputs. Explain the decreasing measure separately.",
    reflection:
      "Why does the base case need 1 for multiplication but 0 for recursive summation?",
    conceptIds: ["recursion", "functions"],
  },
  debugging: {
    id: "debugging-safe-average",
    topicId: "debugging",
    title: "Diagnose an empty average",
    instructions: [
      "Run average([]) and read the innermost traceback frame. Write a hypothesis before editing.",
      "The contract says an empty collection has no average: return None. For nonempty numeric lists, return total divided by count. Repair the function and test both paths.",
    ],
    starter:
      "def average(values):\n    return sum(values) / len(values)\n\nprint(average([]))",
    expectedBehavior:
      "[] returns None, [4] returns 4, [2, 4] returns 3, and [0, 0] returns 0.",
    tests: [
      check(
        "average-empty",
        "Empty input without division",
        "actual = average([])\nassert actual is None, f'Expected None for empty input, observed {actual!r}'",
        "An empty list returns None without division.",
        "Inspect the denominator and the stated empty-input contract. Decide before dividing; catching every exception would hide unrelated bugs.",
        ["debugging", "conditionals"],
      ),
      check(
        "average-values",
        "Nonempty and zero-valued input",
        "for values, expected in [([4], 4), ([2, 4], 3), ([0, 0], 0)]:\n    actual = average(values)\n    assert actual == expected, f'Expected {expected} for {values!r}, observed {actual!r}'",
        "Nonempty values produce the arithmetic mean, including zero.",
        "An average of zero is a legitimate result. Distinguish no values from values whose sum is zero.",
        ["debugging", "functions"],
      ),
    ],
    explanation:
      "An exception locates a symptom. The contract determines the repair; returning an arbitrary zero for empty input changes its meaning.",
    reflection:
      "How do the empty-input and zero-valued tests challenge different assumptions?",
    conceptIds: ["debugging", "conditionals", "functions"],
  },
};
