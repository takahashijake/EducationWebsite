import type { CodeTrace, Lesson, StackFrame, TraceStep } from "./types";

export const factorialSource = `def factorial(n):
    if n == 0:
        return 1
    smaller = factorial(n - 1)
    return n * smaller

print(factorial(3))`;
const f = (
  n: number,
  status: StackFrame["status"] = "running",
  smaller?: number,
  returnValue?: number,
): StackFrame => ({
  id: `factorial-${n}`,
  functionName: "factorial",
  arguments: [{ name: "n", value: n }],
  locals: [
    { name: "n", value: n },
    ...(smaller === undefined ? [] : [{ name: "smaller", value: smaller }]),
  ],
  status,
  ...(returnValue === undefined ? {} : { returnValue }),
});
const step = (
  lines: number[],
  explanation: string,
  stack: StackFrame[],
  stackEvent?: TraceStep["stackEvent"],
  output: string[] = [],
): TraceStep => ({
  lines,
  explanation,
  stack,
  stackEvent,
  output,
  variables: [],
});
export const recursionTrace: CodeTrace = {
  kind: "trace",
  title: "Factorial: descend, then return",
  caption:
    "factorial(3) multiplies 3 × 2 × 1; factorial(0) supplies the stopping value 1. Follow each separate n, then the waiting multiplication.",
  source: factorialSource,
  steps: [
    step([1], "Define factorial. Its body does not run until called.", []),
    step([7], "Push factorial(3). This invocation owns n = 3.", [f(3)], {
      kind: "push",
      frameId: "factorial-3",
    }),
    step(
      [4],
      "3 is not zero. Suspend factorial(3) at line 4 and push factorial(2). smaller has no value yet in the caller.",
      [f(3, "waiting"), f(2)],
      { kind: "push", frameId: "factorial-2" },
    ),
    step(
      [4],
      "2 is not zero. Suspend factorial(2) and push factorial(1). The caller's n stays 2.",
      [f(3, "waiting"), f(2, "waiting"), f(1)],
      { kind: "push", frameId: "factorial-1" },
    ),
    step(
      [4],
      "1 is not zero. Suspend factorial(1) and push factorial(0). Four invocations now exist, each with its own n.",
      [f(3, "waiting"), f(2, "waiting"), f(1, "waiting"), f(0)],
      { kind: "push", frameId: "factorial-0" },
    ),
    step(
      [2],
      "Base case: n == 0 is True. Select return 1; make no further recursive call.",
      [f(3, "waiting"), f(2, "waiting"), f(1, "waiting"), f(0)],
      { kind: "base", frameId: "factorial-0" },
    ),
    step(
      [3],
      "factorial(0) returns 1. Keep its completed frame visible for this authored state so you can inspect the return value.",
      [
        f(3, "waiting"),
        f(2, "waiting"),
        f(1, "waiting"),
        f(0, "returned", undefined, 1),
      ],
      { kind: "return", frameId: "factorial-0" },
    ),
    step(
      [4],
      "Pop factorial(0). Control returns to factorial(1); assign the returned 1 to its smaller. Its own n is still 1.",
      [f(3, "waiting"), f(2, "waiting"), f(1, "running", 1)],
      { kind: "pop", frameId: "factorial-0" },
    ),
    step(
      [5],
      "factorial(1) computes 1 * 1 and returns 1. Returning ends this invocation.",
      [f(3, "waiting"), f(2, "waiting"), f(1, "returned", 1, 1)],
      { kind: "return", frameId: "factorial-1" },
    ),
    step(
      [4],
      "Pop factorial(1). Resume factorial(2) and store smaller = 1 in that caller's frame.",
      [f(3, "waiting"), f(2, "running", 1)],
      { kind: "pop", frameId: "factorial-1" },
    ),
    step(
      [5],
      "factorial(2) computes 2 * 1 and returns 2.",
      [f(3, "waiting"), f(2, "returned", 1, 2)],
      { kind: "return", frameId: "factorial-2" },
    ),
    step(
      [4],
      "Pop factorial(2). Resume factorial(3) and store smaller = 2. Only this frame remains.",
      [f(3, "running", 2)],
      { kind: "pop", frameId: "factorial-2" },
    ),
    step(
      [5],
      "factorial(3) computes 3 * 2 and returns 6 to the outer print call.",
      [f(3, "returned", 2, 6)],
      { kind: "return", frameId: "factorial-3" },
    ),
    step(
      [7],
      "Pop factorial(3). Its result 6 is now available to print in the outer caller.",
      [],
      { kind: "pop", frameId: "factorial-3" },
    ),
    step(
      [7],
      "print displays the final returned value. No factorial frames remain.",
      [],
      undefined,
      ["6"],
    ),
  ],
  result:
    "The output is 6. Maximum factorial stack depth is 4, including the base case.",
};

export const recursionLesson: Lesson = {
  topicId: "recursion",
  minutes: 30,
  objectives: [
    "Identify a base case and explain why each recursive call moves toward it.",
    "Trace separate local variables in four stack frames during descent and return.",
    "Predict the return value of a short recursive function, including its empty input.",
    "Compare the time and extra stack space of recursive and iterative solutions.",
  ],
  introduction: [
    "Recursion means solving a problem using a smaller instance of the same problem. In a program, a recursive function calls itself. The name may be the same, but a call is a new invocation: a fresh execution context with its own parameters, local names, and a place to return to. Think of leaving yourself a note: finish this multiplication after the smaller answer comes back.",
    "We already know functions can call other functions and return results. Recursion uses those same rules. The two extra responsibilities are to stop on a simple input (the base case) and to make progress toward that input on every recursive path. We will first follow calls going down, then follow values coming back up. Both directions are necessary to understand the result.",
  ],
  concept: {
    title: "A stopping rule and a smaller task",
    paragraphs: [
      "A base case is an input for which the function can give an answer directly, without another recursive call. A recursive case reduces the problem and uses the smaller result to finish the current task. For nonnegative integer n, factorial(n) is the product of the whole numbers from 1 through n. We define factorial(0) as 1, so factorial(1) can return 1 * factorial(0). You do not need advanced mathematics: factorial(3) simply means 3 * 2 * 1.",
      "The function below has the input contract n is a nonnegative integer. When n is zero, return 1. Otherwise, ask factorial(n - 1) for the smaller product and multiply that answer by this call's n. Subtracting one from a positive integer must eventually reach zero. A base case written in the source is not enough: the actual call sequence must reach it. Calling this unguarded function with -1 moves away from zero and violates the input contract.",
      "The call stack records unfinished function invocations. A stack frame holds an invocation's parameters, local names, and return location. The newest call runs while its caller waits. In factorial(3), n does not globally change from 3 to 2 to 1: separate frames have those values at the same time. The name smaller is not assigned until the child call returns. Returning a value is different from printing it; only the final print in this program produces output.",
      "Stack unwinding is the process of returning through the waiting callers. The base case returns 1 to factorial(1), which returns 1 to factorial(2), which returns 2 to factorial(3), which returns 6. Each caller resumes exactly where it was waiting. The walkthrough briefly retains a returning frame, then shows its removal separately; these are teaching snapshots of one call/return process, not extra Python instructions.",
    ],
  },
  demonstration: recursionTrace,
  sections: [
    {
      title: "Worked example 2: sum a sequence without copying it",
      paragraphs: [
        "A sequence is an ordered collection; here we use a Python list such as [4, 1, 3]. Index 0 selects 4, index 1 selects 1, and len(values) is 3. The parameter index tells us which item remains to be included. Each recursive call advances index by one while sharing the same input list. We never modify the list.",
        "For sum_from([4, 1, 3]), index 0 waits for the sum starting at 1; index 1 waits for index 2; index 2 waits for index 3. At index 3 there are no items left, so return 0. On the way back, return 3 + 0 = 3, then 1 + 3 = 4, then 4 + 4 = 8. For an empty list the initial index already equals its length, so the result is 0 with just one frame.",
        "The contract is a list of numbers and an index from 0 through its length. The default argument index=0 lets callers omit the starting position. The remaining problem size is len(values) - index, which decreases by one. Moving the index avoids making a fresh list slice at each level. A slice-based version would add copying work and memory that this version does not need.",
      ],
      code: `def sum_from(values, index=0):
    if index == len(values):
        return 0
    rest = sum_from(values, index + 1)
    return values[index] + rest

print(sum_from([4, 1, 3]))  # 8
print(sum_from([]))        # 0`,
    },
    {
      title: "When the stopping rule fails",
      paragraphs: [
        "If we recurse with n instead of n - 1, the input never shrinks. If we remove the base case, even a shrinking input cannot stop the calls. These are different defects: one breaks progress, the other breaks stopping. Python limits recursion depth; unbounded recursive calls normally raise RecursionError rather than literally running forever. Increasing that limit does not repair the algorithm.",
        "Before running a recursive function, name its accepted inputs, its stopping input, and a nonnegative measure that gets smaller on every recursive call. For factorial that measure is n; for sum_from it is the number of items remaining. The examples assume small valid inputs. If your application accepts negative or noninteger factorial inputs, reject them before calling the function; do not silently invent an answer.",
      ],
    },
    {
      title: "Final comparison: recursion and iteration",
      paragraphs: [
        "The iterative factorial below starts with product = 1 and repeatedly multiplies by the next number. range(1, n + 1) includes n because range excludes its stop. When n is zero the loop is empty, leaving product at 1. Both versions therefore agree for every valid input in their contract.",
        "For n, recursive factorial makes n + 1 calls, including zero, and its maximum factorial depth is n + 1. Iteration makes n multiplications in one invocation. In a simplified model counting arithmetic operations, both take linear time, O(n): doubling n roughly doubles the steps. Recursion uses O(n) extra stack space; iteration uses O(1) extra control state. Real Python integers grow with the result, so these are not constant-bit memory or arithmetic claims.",
        "The sum example likewise visits each of m items once with m + 1 frames. A loop can accumulate the same sum without growing the stack. Recursion can express a shrinking problem clearly, but it is not automatically faster. Python does not eliminate these recursive frames, even if a recursive call is the last operation. For long flat sequences prefer a loop; later, branching structures can make recursion especially natural.",
      ],
      code: `def factorial_iterative(n):
    product = 1
    for number in range(1, n + 1):
        product = product * number
    return product

print(factorial_iterative(3))  # 6
print(factorial_iterative(0))  # 1`,
    },
  ],
  workedExample: {
    title: "Work through factorial(3) in both directions",
    introduction:
      "Write a separate row for each invocation. Do not replace the caller's n with the child's n.",
    steps: [
      "Descent: factorial(3) cannot finish n * smaller until factorial(2) returns. Its frame waits with n = 3 and no smaller yet.",
      "Continue: factorial(2) waits for factorial(1), which waits for factorial(0). The four frames contain n = 3, 2, 1, and 0 respectively.",
      "Stop: factorial(0) takes the base branch and returns 1. There is no call with -1 on this valid path.",
      "Unwind: factorial(1) stores smaller = 1 and returns 1. factorial(2) stores smaller = 1 and returns 2. factorial(3) stores smaller = 2 and returns 6.",
      "The outer print receives 6. All factorial invocations have finished, and the maximum depth was four factorial frames, not three.",
    ],
  },
  code: {
    language: "Python 3",
    title: "Run the recursive factorial",
    source: factorialSource,
    explanation:
      "Save as recursion.py and run python3 recursion.py locally. It prints 6. Try inputs 0 and 1 before 4; their results are 1, 1, and 24. Use nonnegative integers only. The walkthrough replays authored states; it does not run Python in your browser.",
  },
  exercises: [
    {
      id: "recursion-predict-return",
      source: factorialSource,
      prompt: "What does this program print?",
      options: ["3", "6", "1"],
      correctIndex: 1,
      explanation:
        "6: the base returns 1, then the callers return 1, 2, and 6. 3 is the initial argument, not the computed product; 1 is only the base and first caller's result.",
    },
    {
      id: "recursion-predict-depth",
      source: factorialSource,
      prompt:
        "At the base case, how many factorial frames exist, and what is n in the oldest one?",
      options: ["3 frames; n is 0", "4 frames; n is 3", "1 frame; n is 0"],
      correctIndex: 1,
      explanation:
        "Four frames hold n = 3, 2, 1, 0. The oldest frame keeps n = 3 while it waits. Three forgets the base invocation; one treats all calls as a shared context.",
    },
    {
      id: "recursion-predict-empty",
      source: `def sum_from(values, index=0):
    if index == len(values):
        return 0
    return values[index] + sum_from(values, index + 1)

print(sum_from([]))`,
      prompt: "What happens for this empty input?",
      options: ["IndexError", "None", "Prints 0"],
      correctIndex: 2,
      explanation:
        "The initial index 0 equals len([]), so the base returns 0 before any indexing. No IndexError occurs because values[index] is skipped. None would require falling through without a return.",
    },
  ],
  misconceptions: [
    {
      belief: "The recursive call overwrites the caller's local variables.",
      correction:
        "Each invocation has its own local bindings. The factorial(3) frame still owns n = 3 while factorial(2) runs. These examples use immutable numbers; separate frames do not mean that a shared mutable list is copied.",
    },
    {
      belief: "Writing a base case guarantees that recursion stops.",
      correction:
        "Only a reachable base case stops the call chain. Check progress and input contracts. Subtracting one from -1 will never reach zero.",
    },
    {
      belief: "The base case is the final answer to the original problem.",
      correction:
        "The base provides a small answer to its caller. Waiting callers must still combine results. Returning 1 from factorial(0) leads eventually to 6 for factorial(3).",
    },
    {
      belief: "Recursion saves memory because the function body is reused.",
      correction:
        "The source is reused, but unfinished invocations need distinct frames. The iterative version avoids this growing stack.",
    },
  ],
  takeaways: [
    "Use a reachable base case and shrink the remaining task.",
    "Keep separate rows for separate invocations and trace both descent and unwinding.",
    "Return values resume waiting callers; print is an independent operation.",
    "Compare clarity, operation counts, and stack space before choosing recursion.",
  ],
  questions: [
    {
      id: "recursion-q-base",
      prompt: "Why must the recursive case reduce the remaining problem?",
      options: [
        "To make the base case reachable for valid inputs",
        "To print each intermediate answer",
        "To reuse one frame for every invocation",
      ],
      correctIndex: 0,
      explanation:
        "Progress connects the accepted input to the stopping rule. Printing does not ensure termination, and Python creates separate frames rather than replacing the caller.",
    },
    {
      id: "recursion-q-local",
      prompt:
        "While factorial(2) runs inside factorial(3), what is n in the waiting caller?",
      options: ["2", "3", "Undefined"],
      correctIndex: 1,
      explanation:
        "The caller keeps its own n = 3. Passing 2 creates a parameter binding in a different invocation; it does not change or delete the caller's binding.",
    },
    {
      id: "recursion-q-space",
      prompt:
        "Under a fixed-size arithmetic model, how does the iterative factorial compare with this recursive one?",
      options: [
        "Both need a growing call stack",
        "Recursion always takes less time",
        "Both use linear arithmetic steps; iteration avoids linear stack growth",
      ],
      correctIndex: 2,
      explanation:
        "Both multiply through the same sequence, but only recursion leaves n + 1 invocations on the stack. Source brevity cannot establish a speed advantage.",
    },
  ],
  nextStep:
    "Continue to Basic Debugging to investigate program behavior systematically. Debugging uses functions, conditionals, and loops; it does not depend on recursion.",
};
