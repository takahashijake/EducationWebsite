import type { Lesson } from "./types";
import { debuggingTrace, recursionTrace } from "./advanced-traces";

export const advancedLessons: Record<string, Lesson> = {
  debugging: {
    topicId: "debugging",
    minutes: 25,
    objectives: [
      "Distinguish parsing failures, runtime exceptions, and wrong results using evidence.",
      "Read a traceback and trace the values that caused the failure.",
      "Challenge an assumption with a small test, repair the cause, and test boundaries again.",
    ],
    introduction: [
      "A bug is a disagreement between intended behavior and actual behavior. Before changing code, write down the requirement, the exact input, the expected result, and the observed result. Without an expectation, a program that runs successfully can still quietly do the wrong thing.",
      "Debugging applies the tracing skills from Variables, Conditionals, Loops, and Functions to an investigation. Make one hypothesis, predict what evidence would support it, and run a small experiment. A focused repair is easier to explain and verify than a series of unrelated edits that happen to remove the symptom.",
    ],
    concept: {
      title: "Classify the evidence before choosing a strategy",
      paragraphs: [
        "A syntax error means Python cannot parse the source. For example, if score >= 60 without a trailing colon is incomplete syntax. In a script, Python parses the module before executing it, so even earlier statements in that module do not run. Read the file name, line, and caret, but also inspect the preceding line: an unclosed parenthesis can make the parser complain later than the actual mistake.",
        "A runtime error occurs while executing valid syntax. Calling int('cat') raises ValueError because the text is not an integer representation; '3' + 2 raises TypeError because these operand types do not support that addition. Earlier statements may already have run. The final traceback line names the exception and gives a message; the frames above show how execution reached the failing operation.",
        "A logical error produces behavior that violates the requirement without necessarily raising an exception. range(1, n) excludes n, so it cannot compute a sum through n inclusive. This is not a Python malfunction: the incorrect assumption is that the stop is included. A failing test supplies evidence even when there is no error message.",
        "Classifications describe the observed failure, not the entire cause. A wrong assumption about valid input can cause an exception; suppressing that exception does not repair the assumption. Follow values from the input to the earliest point where actual state diverges from expected state, then fix that cause.",
      ],
    },
    demonstration: debuggingTrace,
    sections: [
      {
        title: "Read a traceback from the failure back to its caller",
        paragraphs: [
          "Consider a two-line function: def average(total, count): followed by return total / count. A call average(10, 0) raises ZeroDivisionError. A typical traceback lists the module's call first and the division inside average last, followed by the exception message. Read the last line to identify the failure, then inspect the innermost frame and work outward to find where count became zero. File paths, caret detail, and message wording can vary by Python version.",
          "The division is where the symptom appears, but the contract is the question to resolve. Is zero count invalid and worth rejecting, or should an empty collection produce a special result? Returning 0 just to silence the error invents a meaning. Here we choose to reject an empty average explicitly with ValueError. Catching a specific expected exception at the input boundary is different from hiding every exception in a broad handler.",
          "A traceback for this example has this shape: File 'average.py', line 3, in <module> → average(10, 0); File 'average.py', line 2, in average → return total / count; ZeroDivisionError: division by zero. The lowest source frame locates the operation, while the caller tells you which arguments reached it.",
        ],
        code: "def average(total, count):\n    if count == 0:\n        raise ValueError('count must be positive')\n    return total / count\n\ntry:\n    average(10, 0)\nexcept ValueError as error:\n    print(error)",
      },
      {
        title: "Trace state and challenge one assumption",
        paragraphs: [
          "For the buggy inclusive sum with n = 3, predict total after each addition: 1, 3, 6. Now inspect the trace: the actual updates stop at 1 and 3. The first divergence is the missing iteration for value = 3, not the final print. Inspect range's stop instead of adding a compensating constant to the output.",
          "Shrink the case to n = 1: the expected sum is 1 but range(1, 1) is empty and leaves total at 0. This counterexample isolates the boundary with no distracting iterations. Changing the stop to n + 1 includes n. Also check n = 0 (empty sum 0), n = 2 (3), and n = 3 (6); a repair that only adds 3 would fail these neighboring cases.",
          "Use a table on paper or temporary print statements to record input, branch choice, loop variable, and accumulator before and after updates. In functions, name the scope too. If a value is correct when returned but incorrect after assignment, continue tracing in the caller instead of rewriting the function.",
        ],
      },
      {
        title: "Boundary tests and a repeatable debugging loop",
        paragraphs: [
          "At a threshold of 60, test 59, 60, and 61. At a loop boundary, test zero iterations, one iteration, and several. For input conversion, test empty text, nonnumeric text, a valid value, and both range endpoints. Pick tests from the contract, rather than only from values that already work.",
          "Repeat this loop: reproduce a failure exactly; minimize its input; state a hypothesis; inspect evidence; change one cause; rerun the failing test and nearby cases. Keep the original failing test as a regression test so the bug cannot quietly return. If evidence contradicts the hypothesis, revise it instead of making more speculative edits.",
          "The following assertions encode the inclusive-sum contract. An assertion does not prove correctness for every input, but it gives repeatable evidence for empty, smallest, and typical cases. Here n is a nonnegative integer; input validation belongs at the program boundary.",
        ],
        code: "def inclusive_sum(n):\n    total = 0\n    for value in range(1, n + 1):\n        total += value\n    return total\n\nassert inclusive_sum(0) == 0\nassert inclusive_sum(1) == 1\nassert inclusive_sum(3) == 6\nprint('boundary tests passed')",
      },
    ],
    workedExample: {
      title: "Repair a threshold without breaking its neighbors",
      introduction:
        "A course accepts scores of 60 or higher. A student with 60 is rejected by score > 60.",
      steps: [
        "Reproduce: input 60, expected accepted, observed rejected. Record that this is a wrong result with no exception.",
        "Predict both sides: 59 must fail, 60 must pass, 61 must pass. Trace the comparison: 60 > 60 is False.",
        "Identify the assumption: the rule is inclusive, but > excludes equality. Change it to >= rather than changing the threshold to 59.",
        "Run all three tests and keep them. Explain why the new expression directly represents the requirement.",
      ],
    },
    code: {
      language: "Python",
      title: "Keep a failing case as a regression test",
      source:
        "def accepted(score):\n    return score >= 60\n\nfor score, expected in [(59, False), (60, True), (61, True)]:\n    assert accepted(score) == expected\n    print(score, accepted(score))",
      explanation:
        "Each pair stores an input and its expected result. The assert statement fails if the observed result differs; checking equality and both neighbors guards the exact rule.",
    },
    misconceptions: [
      {
        belief: "No exception means the program is correct.",
        correction:
          "Correctness depends on the requirement. An exclusive range can return the wrong sum without raising anything.",
      },
      {
        belief: "The traceback's last source line must contain the root cause.",
        correction:
          "It locates the failing operation. Follow callers and arguments to discover which earlier assumption caused it.",
      },
      {
        belief: "A fix is done when the original example passes.",
        correction:
          "Check adjacent boundaries and unrelated successful cases too. A hardcoded correction can pass one example and fail the contract.",
      },
    ],
    takeaways: [
      "Write expected and observed behavior before editing.",
      "Locate the first state divergence with a small input.",
      "Test a focused repair at boundaries and retain the regression case.",
    ],
    exercises: [
      {
        id: "debugging-p1",
        source:
          "total = 0\nfor n in range(1, 3):\n    total += n\nprint(total)",
        prompt:
          "The requirement is to add 1 through 3 inclusive. Which diagnosis and repair fit the evidence?",
        options: [
          "Runtime error: catch ValueError",
          "Logical error: change the stop to 4",
          "Syntax error: add a colon",
        ],
        correctIndex: 1,
        explanation:
          "This valid program prints 3, not the required 6. range excludes 3. A stop of 4 includes it; exception handling does not change which values are visited.",
      },
      {
        id: "debugging-p2",
        source:
          "def label(score):\n    if score > 60:\n        return 'pass'\n    return 'retry'\n\nprint(label(60))",
        prompt:
          "A score of at least 60 should pass. Which tests best expose and protect the boundary repair?",
        options: ["Only 100", "Only 0 and 100", "59, 60, and 61"],
        correctIndex: 2,
        explanation:
          "The current output is retry because 60 > 60 is False. Tests immediately below, at, and above 60 distinguish > from >= and guard both branches.",
      },
      {
        id: "debugging-p3",
        source:
          "def average(total, count):\n    return total / count\n\nprint(average(10, 0))",
        prompt:
          "The traceback ends with ZeroDivisionError inside average. What is the most useful next investigation?",
        options: [
          "Inspect how count became zero and decide the empty-input contract",
          "Rename total",
          "Catch every exception and return zero",
        ],
        correctIndex: 0,
        explanation:
          "The failing division locates the symptom; the caller supplies count = 0. Decide what an empty average should mean and validate that contract. Silencing all exceptions hides evidence and can invent an incorrect result.",
      },
    ],
    questions: [
      {
        id: "debugging-q1",
        prompt: "A script is missing a colon after if. When is this detected?",
        options: [
          "While parsing, before the module executes",
          "Only if that branch runs",
          "Only after printing",
        ],
        correctIndex: 0,
        explanation:
          "Python must parse a script before executing its statements. A missing colon is invalid syntax even in a branch that would not be selected.",
      },
      {
        id: "debugging-q2",
        prompt:
          "What does the last line of an ordinary unhandled-exception traceback tell you?",
        options: [
          "Every variable value",
          "The exception type and message",
          "The repair to apply",
        ],
        correctIndex: 1,
        explanation:
          "The type and message describe the failure. Inspect source frames, inputs, and state to discover the cause; the traceback cannot infer the intended behavior.",
      },
      {
        id: "debugging-q3",
        prompt: "Why retain the smallest failing test after a fix?",
        options: [
          "It proves every input is correct",
          "It replaces the requirement",
          "It catches that failure if a later change reintroduces it",
        ],
        correctIndex: 2,
        explanation:
          "A regression test protects a known behavior. It supplies repeatable evidence but does not prove all possible inputs or replace broader boundary testing.",
      },
    ],
    nextStep:
      "Apply the complete programming path in the number guessing project: isolate input conversion, compare guesses, and test a bounded game loop before adding a terminal interface.",
  },
  recursion: {
    topicId: "recursion",
    minutes: 28,
    objectives: [
      "Define a base case and a recursive case with a decreasing measure.",
      "Trace distinct stack frames, suspended work, and returned values.",
      "Compare recursive and iterative solutions and diagnose missing returns or nontermination.",
    ],
    introduction: [
      "Some problems can be described using smaller instances of themselves. A sum through n is n plus the sum through n − 1. This definition becomes a program when we also state the smallest answer directly: the sum through 0 is 0. Recursion means a function calls itself, directly or through other functions.",
      "You already know from Functions that a call creates local bindings and returns a value to a waiting caller. Recursion uses exactly that mechanism repeatedly. There is no shared magical n: factorial(3), factorial(2), and factorial(1) each have their own parameter. The trace makes those waiting frames visible so you can reason about both the descent and the return.",
    ],
    concept: {
      title: "A definition needs an answer and a route to it",
      paragraphs: [
        "For nonnegative integers, factorial is defined by factorial(0) = 1 and factorial(n) = n × factorial(n − 1) for n > 0. The base case returns a known answer without another recursive call. The recursive case solves a smaller subproblem and combines its answer with the current n. The factor 1 is the identity for multiplication; choosing 0 would make every factorial result zero.",
        "To justify termination, name a measure that decreases and is bounded below. Here n starts as a nonnegative integer, decreases by one, and eventually reaches zero. A base case alone is insufficient: calling factorial(n + 1) moves away from it. Calling this version with a negative number also moves away from zero, so our public example below rejects negative inputs before recursing.",
        "When evaluating return n * factorial(n - 1), Python evaluates the recursive call before it can finish the multiplication. The caller is suspended with its own n and pending work. Reaching the base case returns 1 to its immediate caller; that caller multiplies and returns to the next caller. Unwinding happens in reverse call order, not by jumping directly to the first call.",
        "Each active invocation needs a stack frame. For input n this factorial creates n + 1 function frames including the base case, as well as its module caller. Python limits recursion depth and raises RecursionError if calls go too deep. Even a mathematically terminating recursion can exceed this limit on large inputs. Python does not optimize these recursive calls into a constant-space loop.",
      ],
    },
    demonstration: recursionTrace,
    sections: [
      {
        title: "Worked example: recursive summation",
        paragraphs: [
          "Define sum_to(0) as 0 and sum_to(n) as n + sum_to(n − 1). For n = 3, expand 3 + (2 + (1 + 0)); then unwind: 0 returns to n = 1, which returns 1; n = 2 returns 3; n = 3 returns 6. Addition uses 0 as its base identity, whereas factorial uses 1.",
          "The iterative version keeps one accumulator in one function frame. Both versions visit n positive integers, but the recursive version uses a growing call stack while the loop's auxiliary state stays constant. For these simple linear problems a loop is usually more practical in Python. Recursion is especially useful when a problem's branching or nested structure follows a recursive definition.",
        ],
        code: "def sum_to(n):\n    if n < 0:\n        raise ValueError('n must be nonnegative')\n    if n == 0:\n        return 0\n    return n + sum_to(n - 1)\n\ndef sum_iterative(n):\n    total = 0\n    for value in range(1, n + 1):\n        total += value\n    return total\n\nprint(sum_to(3), sum_iterative(3))\nprint(sum_to(0))",
      },
      {
        title: "Worked example: search a sequence one position at a time",
        paragraphs: [
          "A list is an ordered sequence; items[index] reads one position and len(items) gives its length. first_index searches from a nonnegative starting index. Its first base case is an exhausted sequence: index >= len(items) returns −1 before any indexing. Its second base case returns index when the current item equals the target. Otherwise the recursive case searches from index + 1.",
          "The decreasing measure is the number of positions remaining, len(items) − index, rather than index itself. Searching [4, 7, 9] for 7 checks position 0, calls position 1, and returns 1 back through the caller. The outer call must return the result of that recursive call. Forgetting return makes a successful inner search disappear: Python falls off the outer function and returns None.",
          "An empty list must immediately return −1. A target at the final index must be checked before exhaustion. A missing target checks every position and then returns −1. The function does not slice or copy the list, but its depth still grows with the number of positions searched; use a loop for long sequences in Python.",
        ],
        code: "def first_index(items, target, index=0):\n    if index >= len(items):\n        return -1\n    if items[index] == target:\n        return index\n    return first_index(items, target, index + 1)\n\nprint(first_index([4, 7, 9], 7))\nprint(first_index([4, 7, 9], 9))\nprint(first_index([], 7))\nprint(first_index([4, 7, 9], 5))",
      },
      {
        title: "Diagnose recursion with three questions",
        paragraphs: [
          "First: does every valid smallest input reach a base case before making another call? Placing the base-case check after the recursive call is too late. Second: does every recursive path reduce a measure toward that base case? Reusing n unchanged never makes progress. Third: is the returned answer propagated and combined correctly? A missing return can terminate successfully yet yield None.",
          "Trace a smallest input, one recursive step, and several steps. For factorial use 0, 1, and 3; for search use empty, first, last, and missing. State the supported domain explicitly. In this lesson arithmetic examples accept nonnegative integers; floats and negative values are outside the trace contract. Raising the recursion limit is not a repair for a missing base case or a step that moves the wrong way.",
        ],
      },
    ],
    workedExample: {
      title: "Account for every pending multiplication",
      introduction:
        "Predict factorial(3) before stepping. Count function frames separately from the module caller.",
      steps: [
        "Call factorial(3), then factorial(2), factorial(1), and factorial(0). Four function frames exist at the deepest point, each with its own n.",
        "The base case returns 1; factorial(1) resumes and computes 1 × 1 = 1. That frame returns and is removed.",
        "factorial(2) resumes with 1 and returns 2. factorial(3) resumes with 2 and returns 6. No caller changes its own n while waiting.",
        "Only after the final return does the module bind result = 6 and print it. Choosing n = 0 in the trace shows a direct base-case return with no multiplication.",
      ],
    },
    code: {
      language: "Python",
      title: "Factorial with a domain guard",
      source:
        "def factorial(n):\n    if n < 0:\n        raise ValueError('n must be nonnegative')\n    if n == 0:\n        return 1\n    return n * factorial(n - 1)\n\nprint(factorial(0))\nprint(factorial(1))\nprint(factorial(3))",
      explanation:
        "Assume integer input. The guard rejects negative integers; the trace omits that guard because all its selectable inputs satisfy the contract. The recursive call finishes before the multiplication returns.",
    },
    misconceptions: [
      {
        belief: "All calls share one variable named n.",
        correction:
          "Every invocation has its own local n. A child binds a new parameter without changing its suspended caller.",
      },
      {
        belief: "A base case guarantees termination.",
        correction:
          "Every recursive path must approach it for the supported input domain. A call with unchanged or increasing n may never reach zero.",
      },
      {
        belief: "The innermost return automatically becomes the outer result.",
        correction:
          "Each caller must return or combine the child's result. A caller that falls through returns None even if a deeper call found the answer.",
      },
    ],
    takeaways: [
      "Define the domain, base answer, recursive step, and decreasing measure.",
      "Separate call creation from reverse-order unwinding.",
      "Propagate return values and choose iteration when stack growth is unnecessary.",
    ],
    exercises: [
      {
        id: "recursion-p1",
        source:
          "def sum_to(n):\n    if n == 0:\n        return 0\n    return n + sum_to(n - 1)\n\nprint(sum_to(3))",
        prompt: "What is printed after all frames return?",
        options: ["3", "6", "0"],
        correctIndex: 1,
        explanation:
          "The base returns 0, then callers return 1, 3, and 6. The base value starts unwinding; it does not replace each caller's pending addition.",
      },
      {
        id: "recursion-p2",
        source:
          "def find(items, target, i=0):\n    if i >= len(items):\n        return -1\n    if items[i] == target:\n        return i\n    find(items, target, i + 1)\n\nprint(find([4, 7], 7))",
        prompt: "Why does this print None even though the inner call finds 7?",
        options: [
          "Lists cannot be searched recursively",
          "The base case is never reached",
          "The outer call discards the recursive result; add return before find",
        ],
        correctIndex: 2,
        explanation:
          "The call at i = 1 returns 1, but the caller at i = 0 ignores it and falls off its body, returning None. Returning the recursive result propagates the found index.",
      },
    ],
    questions: [
      {
        id: "recursion-q1",
        prompt: "What must accompany a base case to justify termination?",
        options: [
          "A print statement",
          "A measure that approaches the base case on every recursive path",
          "A larger recursion limit",
        ],
        correctIndex: 1,
        explanation:
          "A reachable base case and a decreasing measure over the valid domain explain termination. A base case alone does not help if each call moves away from it.",
      },
      {
        id: "recursion-q2",
        prompt:
          "While factorial(3) waits for factorial(2), what happens to the caller's n?",
        options: [
          "It becomes 2",
          "It is deleted",
          "It remains 3 in its own frame",
        ],
        correctIndex: 2,
        explanation:
          "Arguments bind in a new invocation. The suspended factorial(3) retains its local n = 3 and later multiplies that value by the returned result.",
      },
      {
        id: "recursion-q3",
        prompt: "Why prefer a loop for summing a very long sequence in Python?",
        options: [
          "It avoids a growing recursive call stack",
          "Recursion cannot add numbers",
          "Loops always do fewer additions",
        ],
        correctIndex: 0,
        explanation:
          "Both approaches can perform the same additions, but recursive calls consume stack depth and can exceed Python's recursion limit. An accumulator loop avoids that growth.",
      },
    ],
    nextStep:
      "Use Basic Debugging to turn suspected failures into reproducible tests. Then apply functions, loops, validation, and testing in the guided number guessing project.",
  },
};
