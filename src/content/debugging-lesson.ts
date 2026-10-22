import type { Lesson } from "./types";

export const inclusiveBug = `def sum_through(limit):
    total = 0
    for number in range(1, limit):
        total = total + number
    return total

print(sum_through(3))`;
export const inclusiveFixed = `def sum_through(limit):
    total = 0
    for number in range(1, limit + 1):
        total = total + number
    return total

print(sum_through(3))  # 6
print(sum_through(1))  # 1
print(sum_through(0))  # 0`;
export const debuggingLesson: Lesson = {
  topicId: "debugging",
  minutes: 30,
  objectives: [
    "Classify syntax, runtime, and logical errors using observed evidence.",
    "Use Observe → Reproduce → Hypothesize → Inspect → Fix → Verify to investigate a failure.",
    "Read a traceback and inspect local state to locate a cause rather than hide a symptom.",
    "Verify a fix with normal, boundary, and regression cases.",
  ],
  introduction: [
    "A bug is a mismatch between intended and actual behavior. Before changing code, make the intended behavior specific. If a function should sum every whole number from 1 through a limit, the input 3 should give 6. A result of 3 is evidence of a failure, but it does not yet tell us whether the defect is in the loop, the arithmetic, or our expectation.",
    "Debugging is a reasoning process, not a contest to make an error disappear. Use Observe → Reproduce → Hypothesize → Inspect → Fix → Verify. Small programs let us practice this process with variables, expressions, conditionals, loops, and functions that you already know. Recursion is not required. Write down the input, expected result, actual result, and the evidence for your next change.",
  ],
  concept: {
    title: "Different failures need different evidence",
    paragraphs: [
      "A syntax error means Python cannot parse the program as valid instructions. A missing colon after if, or inconsistent indentation, can prevent a file from starting at all. Read the error type and highlighted location, then inspect nearby lines too: a missing closing parenthesis may make the next line look wrong. Syntax errors are not incorrect return values because the intended program has not executed.",
      "A runtime error occurs while a syntactically valid program executes. Dividing by zero raises ZeroDivisionError; looking up a list index that does not exist raises IndexError. An exception is Python's way to signal such a failure. A traceback lists the chain of calls leading to it. Read the final line for the exception type and message, then the last listed frame for where it was raised; work upward to understand how that operation received its input.",
      "A logical error can finish normally with the wrong result. Python cannot know that your policy grants entry at age 18 if you wrote age > 18. You need an explicit specification and examples to recognize the defect. Crashing, printing an unexpected result, and failing to terminate are observations, not interchangeable diagnoses. Correct code for one specification may be wrong for another.",
      "A hypothesis is a testable explanation, such as 'the stop of range is excluded, so the final number is never added.' Predict what you should see before inspecting state. If number never becomes 3, that supports the hypothesis; if it does, look elsewhere. Make one focused change after collecting evidence, then run the original failing case and nearby cases. Keeping earlier tests is regression testing: it detects whether a change breaks behavior that already worked.",
    ],
  },
  demonstration: {
    kind: "trace",
    title: "Inspect an off-by-one failure",
    caption:
      "The program runs successfully but violates the stated requirement: include the limit itself. Watch which numbers are visited.",
    source: inclusiveBug,
    steps: [
      {
        lines: [2],
        explanation: "Call sum_through(3). Initialize total to 0.",
        variables: [
          { name: "limit", value: 3, scope: "sum_through" },
          { name: "total", value: 0, scope: "sum_through" },
        ],
        output: [],
      },
      {
        lines: [3, 4],
        explanation: "range(1, 3) supplies 1 first. total becomes 0 + 1 = 1.",
        variables: [
          { name: "limit", value: 3, scope: "sum_through" },
          { name: "number", value: 1, scope: "sum_through" },
          { name: "total", value: 1, scope: "sum_through" },
        ],
        output: [],
      },
      {
        lines: [3, 4],
        explanation: "The next number is 2. total becomes 1 + 2 = 3.",
        variables: [
          { name: "limit", value: 3, scope: "sum_through" },
          { name: "number", value: 2, scope: "sum_through" },
          { name: "total", value: 3, scope: "sum_through" },
        ],
        output: [],
      },
      {
        lines: [3, 5],
        explanation:
          "The stop 3 is excluded. The loop ends without visiting 3, and the function returns 3.",
        detail: "Hypothesis supported: missing final iteration",
        variables: [
          { name: "limit", value: 3, scope: "sum_through" },
          { name: "number", value: 2, scope: "sum_through" },
          { name: "total", value: 3, scope: "sum_through" },
        ],
        output: [],
      },
      {
        lines: [7],
        explanation:
          "The outer print displays 3, although our requirement predicts 6. There is no Python exception: this is a logical error.",
        variables: [],
        output: ["3"],
      },
    ],
    result:
      "Actual output 3 differs from expected 6 because range excludes its stop.",
  },
  sections: [
    {
      title: "Read a traceback from the bottom up",
      paragraphs: [
        "Run this example in a file named average.py. Python reports ZeroDivisionError: division by zero. The innermost frame points to return total / count inside average, and the caller frame points to print(average(10, 0)). File paths and caret formatting vary, but the call chain and exception type identify the same failure. The runtime reaches this operation with count = 0.",
        "Now decide the function's contract. If count must be positive, fix the caller and validate that requirement. If an empty collection is legitimate, decide explicitly how its undefined average should be represented. Returning 0 without a stated policy would hide the difference between 'no data' and 'average is zero.' Catching every exception or deleting the print merely hides evidence; neither explains the invalid division.",
      ],
      code: `def average(total, count):
    return total / count

print(average(10, 0))  # Deliberate runtime failure: ZeroDivisionError`,
    },
    {
      title: "Inspect state with prints, breakpoints, and stepping",
      paragraphs: [
        "First reproduce the sum failure with the exact same input. Temporarily add print('before', number, total) inside the loop before the assignment and print('after', total) after it. For limit 3, the before states are (1, 0) and (2, 1); the after totals are 1 and 3. These observations show the loop visits no 3. Put inspection prints where competing hypotheses predict different values, not everywhere at once.",
        "A breakpoint pauses execution at a selected line without editing the algorithm. In a local debugger, break on the total assignment, inspect limit, number, and total, then step over the assignment to see the new total. Step into enters a called function; step out finishes that invocation and returns to its caller. Continue runs until another breakpoint or termination. Editor controls differ; Python's local debugger can be started with python3 -m pdb sum_demo.py, using n to step over, s to step into, p total to inspect, and c to continue. The browser trace only replays authored states.",
        "After diagnosis, remove temporary diagnostic prints and retain repeatable tests. Prints can change observable output, so do not mistake debug output for the program's required result. When a failure seems intermittent, preserve the inputs and starting state that trigger it. The project uses a fixed secret and guesses so that each attempt is reproducible.",
      ],
    },
    {
      title: "Boundary conditions expose assumptions",
      paragraphs: [
        "An off-by-one error includes one too many or one too few values. Check both sides of a decision and the exact boundary: 17, 18, and 19 for an age threshold of 18; 0, 1, and 3 for a nonnegative inclusive sum. Empty input and a correct guess on the last allowed attempt reveal failures that a typical case can miss.",
        "Do not repair the sum by adding 3 to every result. That makes input 3 pass but breaks 0 and 1. Changing the range stop to limit + 1 fixes the cause: the loop now visits every required number. This contract accepts nonnegative integer limits. Handling arbitrary strings or negative values is a separate input-validation decision, not something these tests prove.",
      ],
    },
  ],
  workedExample: {
    title: "A complete debugging investigation",
    introduction:
      "Requirement: sum_through(limit) returns the sum from 1 through a nonnegative integer limit, including the limit. The empty sum for limit 0 is 0.",
    steps: [
      "Observe: sum_through(3) returns 3; expected 1 + 2 + 3 = 6. Record the mismatch. The function runs, so this observation is a logical error, not a syntax error.",
      "Reproduce: run the unchanged function again with 3. It returns 3 consistently. Also try 1, which returns 0 instead of 1.",
      "Hypothesize: range(1, limit) excludes limit. Predict that number takes 1 and 2 for limit 3, but never 3.",
      "Inspect: step through or print number inside the loop. Observe 1 then 2. total updates correctly on each visited item, so addition is not the cause.",
      "Fix: change only the stop to limit + 1. Now range(1, 4) supplies 1, 2, and 3.",
      "Verify: rerun 3 → 6 and 1 → 1, then the boundary 0 → 0 and another normal case 4 → 10. Preserve all four as regression tests; a passing example alone cannot prove general correctness.",
    ],
  },
  code: {
    language: "Python 3",
    title: "After the focused fix",
    source: inclusiveFixed,
    explanation:
      "Save this corrected program as sum_demo.py and run python3 sum_demo.py. It prints 6, 1, and 0 on separate lines. Compare with the buggy trace, which prints 3. These are measured behaviors with a defined input contract, not evidence that every possible program input is valid.",
  },
  exercises: [
    {
      id: "debugging-boundary",
      source: `def can_enter(age):
    return age > 18

print(can_enter(18))`,
      prompt:
        "Policy: people aged 18 or older may enter. Which diagnosis and fix address the cause?",
      options: [
        "False is a syntax error; remove return",
        "The comparison excludes 18; use age >= 18",
        "Always return True so 18 passes",
      ],
      correctIndex: 1,
      explanation:
        "The current output is False, a logical boundary error. >= includes 18 while still rejecting 17. Removing return produces None rather than the required boolean. Always True hides the failing example but wrongly admits 17. Test 17 → False, 18 → True, and 19 → True.",
    },
    {
      id: "debugging-loop-fix",
      source: inclusiveBug,
      prompt:
        "Requirement: include limit. Which fix works for all nonnegative integer limits?",
      options: [
        "Change range(1, limit) to range(1, limit + 1)",
        "Add 3 to total just before return",
        "Print 6 instead of calling the function",
      ],
      correctIndex: 0,
      explanation:
        "Increasing the exclusive stop includes limit and keeps the empty sum at 0. Adding 3 only compensates for the missing item when limit is exactly 3; for 1 it returns 3 instead of 1. Printing 6 bypasses the function and cannot answer other inputs. Verify limits 0, 1, 3, and 4.",
    },
    {
      id: "debugging-function-return",
      source: `def add_fee(amount):
    total = amount + 2
    print(total)

bill = add_fee(5)
print(bill)`,
      prompt: "The caller needs bill to hold 7. What fixes the root cause?",
      options: [
        "Delete print(bill)",
        "Rename total to bill inside the function",
        "Replace print(total) with return total",
      ],
      correctIndex: 2,
      explanation:
        "The original prints 7 then None: falling off a function returns None. return total passes 7 to the caller; the fixed program prints only 7 from print(bill). Deleting that print conceals the None without fixing bill. Renaming a local cannot assign the caller's variable. Test add_fee(0) → 2 as well as add_fee(5) → 7.",
    },
  ],
  misconceptions: [
    {
      belief: "The last line of a traceback always identifies the whole cause.",
      correction:
        "It names the exception. Inspect the innermost frame and the callers to learn how the failing operation received invalid state. A division can be correct for its contract while the caller supplies zero.",
    },
    {
      belief: "If the error message disappears, the bug is fixed.",
      correction:
        "A deleted call or blanket exception handler may hide the symptom. A genuine fix must satisfy the original behavior and relevant boundaries.",
    },
    {
      belief: "One successful test proves the fix.",
      correction:
        "A workaround can pass one example. Retest the original failure, adjacent boundaries, and previously working cases to build evidence against regressions.",
    },
  ],
  takeaways: [
    "Make the expected behavior explicit before editing.",
    "Use Observe → Reproduce → Hypothesize → Inspect → Fix → Verify.",
    "Distinguish parsing failures, runtime exceptions, and incorrect results.",
    "Keep boundary cases and earlier successes as regression tests.",
  ],
  questions: [
    {
      id: "debugging-q-syntax",
      prompt:
        "Python points at if ready with a missing colon before any code runs. What kind of failure is this?",
      options: [
        "Logical error",
        "Syntax error",
        "Successful execution with False",
      ],
      correctIndex: 1,
      explanation:
        "The parser cannot form valid instructions, so this is a syntax error. A logical error executes valid code with unintended behavior; no boolean result has been produced here.",
    },
    {
      id: "debugging-q-hypothesis",
      prompt:
        "A loop total is too small. What is the most useful next step after reproducing it?",
      options: [
        "Add a constant until the example passes",
        "Catch every exception",
        "Predict which iteration might be missing, then inspect loop values",
      ],
      correctIndex: 2,
      explanation:
        "A testable hypothesis guides inspection and can be disproved by evidence. Adding a constant guesses at a symptom, and catching exceptions does nothing to explain a wrong total.",
    },
    {
      id: "debugging-q-regression",
      prompt: "Why rerun previously passing tests after a fix?",
      options: [
        "To detect behavior the change may have broken",
        "To prove that all possible inputs work",
        "To avoid checking the original failing case",
      ],
      correctIndex: 0,
      explanation:
        "Regression tests check that earlier behavior still works. They supplement the original failing case and new boundaries; a finite test set does not prove every possible input.",
    },
  ],
  nextStep:
    "Apply the same investigation process in Build a Number Guessing Game, then use the integrated fundamentals assessment to choose what to review.",
};
