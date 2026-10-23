import { topics, topicHref } from "./curriculum";
import { lessons } from "./lessons";
import { fundamentalsAssessment } from "./assessments";
import { codingExercises } from "./coding-exercises";
import type { Question } from "./types";

export type Skill = {
  id: string;
  title: string;
  description: string;
  topicId: string;
  prerequisites: string[];
  reviewHref: string;
};
const define = (
  id: string,
  title: string,
  description: string,
  topicId: string,
  prerequisites: string[] = [],
): Skill => ({
  id,
  title,
  description,
  topicId,
  prerequisites,
  reviewHref: topicHref(topics.find((topic) => topic.id === topicId)!),
});
export const skills: Skill[] = [
  define(
    "assignment",
    "Assignment and reassignment",
    "Trace stored values when a name is assigned again.",
    "variables-data-types",
  ),
  define(
    "types",
    "Numeric and string values",
    "Distinguish numeric operations from string operations and conversions.",
    "variables-data-types",
  ),
  define(
    "arithmetic",
    "Arithmetic expressions",
    "Evaluate arithmetic in precedence order.",
    "operators-expressions",
    ["types"],
  ),
  define(
    "comparisons",
    "Inclusive comparisons",
    "Reason about < versus <= at a boundary.",
    "conditionals",
    ["arithmetic"],
  ),
  define(
    "boolean",
    "Boolean conjunction and disjunction",
    "Combine conditions with and and or.",
    "operators-expressions",
    ["comparisons"],
  ),
  define(
    "branches",
    "Conditional branches",
    "Trace which branch executes and why.",
    "conditionals",
    ["comparisons"],
  ),
  define(
    "loop-boundaries",
    "Exclusive loop boundaries",
    "Determine values included by range and its exclusive stop.",
    "loops",
    ["comparisons"],
  ),
  define(
    "loop-termination",
    "Loop iteration and termination",
    "Track repeated updates and stopping tests.",
    "loops",
    ["branches"],
  ),
  define(
    "parameters",
    "Function parameters",
    "Separate caller values from local parameters.",
    "functions",
    ["assignment"],
  ),
  define(
    "calls",
    "Function calls and execution",
    "Identify when a function body runs and what the caller does next.",
    "functions",
    ["parameters"],
  ),
  define(
    "returns",
    "Function return values",
    "Trace values passed back to a caller.",
    "functions",
    ["calls"],
  ),
  define(
    "base-cases",
    "Recursive base cases",
    "Identify where recursive calls stop.",
    "recursion",
    ["returns"],
  ),
  define(
    "unwinding",
    "Recursive stack unwinding",
    "Trace values returned through waiting calls.",
    "recursion",
    ["base-cases"],
  ),
  define(
    "error-types",
    "Runtime versus logical errors",
    "Distinguish a raised exception from valid code with wrong behavior.",
    "debugging",
    ["branches"],
  ),
  define(
    "debug-boundaries",
    "Debugging boundary cases",
    "Choose a small test that exposes a boundary defect.",
    "debugging",
    ["loop-boundaries"],
  ),
];
export type Activity = {
  id: string;
  source: "assessment" | "lesson" | "retrieval" | "python";
  skillIds: string[];
  revision: number;
  href: string;
  title: string;
};
const assessmentMap: Record<string, string[]> = {
  "fundamentals-expression": ["assignment", "arithmetic"],
  "fundamentals-boolean": ["boolean"],
  "fundamentals-branch": ["comparisons", "branches"],
  "fundamentals-loop": ["loop-boundaries", "branches"],
  "fundamentals-while": ["loop-termination"],
  "fundamentals-local": ["parameters", "returns"],
  "fundamentals-composition": ["returns", "loop-boundaries", "branches"],
  "fundamentals-recursive-return": ["unwinding"],
  "fundamentals-recursive-depth": ["base-cases"],
  "fundamentals-debug-return": ["returns", "error-types"],
  "fundamentals-edge": ["debug-boundaries", "loop-boundaries"],
  "fundamentals-game": ["debug-boundaries", "branches"],
};
const lessonMap: Record<string, string[]> = {
  "variables-q1": ["types"],
  "variables-q2": ["assignment"],
  "variables-q3": ["types"],
  "operators-q1": ["comparisons"],
  "operators-q2": ["arithmetic"],
  "operators-q3": ["boolean"],
  "conditionals-q1": ["branches"],
  "conditionals-q2": ["boolean"],
  "conditionals-q3": ["branches"],
  "loops-q1": ["loop-boundaries"],
  "loops-q2": ["loop-termination"],
  "loops-q3": ["loop-termination"],
  "functions-q1": ["parameters"],
  "functions-q2": ["returns"],
  "functions-q3": ["calls"],
  "recursion-q1": ["base-cases"],
  "recursion-q2": ["unwinding"],
  "recursion-q3": ["unwinding"],
  "debugging-q1": ["error-types"],
  "debugging-q2": ["error-types"],
  "debugging-q3": ["debug-boundaries"],
};
export const assessmentActivities: Activity[] =
  fundamentalsAssessment.questions.map((q) => ({
    id: q.id,
    source: "assessment",
    skillIds: assessmentMap[q.id] ?? [],
    revision: 1,
    href: "/assessments/programming-fundamentals",
    title: q.prompt,
  }));
export const lessonActivities: Activity[] = Object.values(lessons).flatMap(
  (lesson) =>
    lesson.questions
      .filter((q) => lessonMap[q.id])
      .map((q) => ({
        id: q.id,
        source: "lesson" as const,
        skillIds: lessonMap[q.id],
        revision: 1,
        href: `${topicHref(topics.find((topic) => topic.id === lesson.topicId)!)}#knowledge-check`,
        title: q.prompt,
      })),
);
export type RetrievalQuestion = Question & {
  skillIds: string[];
  topicId: string;
  revision: number;
};
const q = (
  id: string,
  topicId: string,
  skillIds: string[],
  prompt: string,
  source: string,
  options: string[],
  correctIndex: number,
  explanation: string,
): RetrievalQuestion => ({
  id,
  topicId,
  skillIds,
  prompt,
  source,
  options,
  correctIndex,
  explanation,
  revision: 1,
});
export const retrievalQuestions: RetrievalQuestion[] = [
  q(
    "retrieve-assignment-a",
    "variables-data-types",
    ["assignment"],
    "What is printed?",
    "x = 3\ny = x\nx = 8\nprint(y)",
    ["3", "8", "11"],
    0,
    "y stored 3 when assigned; changing x does not change y.",
  ),
  q(
    "retrieve-assignment-b",
    "variables-data-types",
    ["assignment"],
    "What is printed?",
    "count = 2\ncount = count + 3\nprint(count)",
    ["2", "3", "5"],
    2,
    "The right side uses the old value 2, then stores 5.",
  ),
  q(
    "retrieve-types-a",
    "variables-data-types",
    ["types"],
    "Which expression produces the string 42?",
    "",
    ["4 + 2", "str(4) + str(2)", "int('4') + 2"],
    1,
    "Converting each number to text makes + concatenate.",
  ),
  q(
    "retrieve-types-b",
    "variables-data-types",
    ["types"],
    "What does this print?",
    "print(type(4.0).__name__)",
    ["int", "float", "str"],
    1,
    "A decimal numeric literal is a float, even if its fractional part is zero.",
  ),
  q(
    "retrieve-arithmetic-a",
    "operators-expressions",
    ["arithmetic"],
    "What is printed?",
    "print(2 + 3 * 4)",
    ["20", "14", "24"],
    1,
    "Multiplication occurs before addition.",
  ),
  q(
    "retrieve-arithmetic-b",
    "operators-expressions",
    ["arithmetic"],
    "What is the remainder?",
    "print(14 % 4)",
    ["2", "3", "3.5"],
    0,
    "Four fits into fourteen three times with two left over.",
  ),
  q(
    "retrieve-boolean-a",
    "operators-expressions",
    ["boolean"],
    "What does this print?",
    "print(False or (3 < 5 and 2 > 4))",
    ["True", "False", "Error"],
    1,
    "The conjunction is false; false or false is false.",
  ),
  q(
    "retrieve-boolean-b",
    "operators-expressions",
    ["boolean"],
    "When is the second check skipped?",
    "ready = False\nprint(ready and expensive_check())",
    ["Always", "Because ready is False", "Never"],
    1,
    "and short-circuits when its left operand is false.",
  ),
  q(
    "retrieve-comparison-a",
    "conditionals",
    ["comparisons"],
    "Which check includes age 18?",
    "",
    ["age > 18", "age >= 18", "age < 18"],
    1,
    ">= includes equality at the boundary.",
  ),
  q(
    "retrieve-comparison-b",
    "conditionals",
    ["comparisons"],
    "Which values pass this check?",
    "score = 10\nprint(score < 10)",
    ["True at 10", "False at 10", "Raises an error"],
    1,
    "The strict comparison excludes equality.",
  ),
  q(
    "retrieve-branches-a",
    "conditionals",
    ["branches"],
    "What prints?",
    "x = 0\nif x > 0:\n    print('positive')\nelif x == 0:\n    print('zero')\nelse:\n    print('negative')",
    ["positive", "zero", "negative"],
    1,
    "The first condition is false and the elif matches zero.",
  ),
  q(
    "retrieve-loop-boundary-a",
    "loops",
    ["loop-boundaries"],
    "Which values appear?",
    "print(list(range(1, 6, 2)))",
    ["[1, 3, 5]", "[1, 3, 5, 7]", "[2, 4, 6]"],
    0,
    "The step adds two each time; 1, 3, and 5 appear before the excluded stop 6.",
  ),
  q(
    "retrieve-loop-boundary-b",
    "loops",
    ["loop-boundaries"],
    "How many iterations?",
    "for n in range(0):\n    print(n)",
    ["0", "1", "Infinite"],
    0,
    "range(0) is empty; the loop body does not run.",
  ),
  q(
    "retrieve-loop-termination-a",
    "loops",
    ["loop-termination"],
    "What prints?",
    "n = 1\nwhile n < 5:\n    n += 2\nprint(n)",
    ["3", "5", "7"],
    1,
    "The values after updates are 3 and 5; then the condition is false.",
  ),
  q(
    "retrieve-parameters-a",
    "functions",
    ["parameters"],
    "What prints?",
    "def change(n):\n    n = 9\nx = 2\nchange(x)\nprint(x)",
    ["2", "9", "None"],
    0,
    "Rebinding the local parameter does not rebind x.",
  ),
  q(
    "retrieve-calls-a",
    "functions",
    ["calls"],
    "In what order does the output appear?",
    "def greet():\n    print('hi')\nprint('ready')\ngreet()",
    ["hi then ready", "ready then hi", "hi only"],
    1,
    "Defining greet stores its body; the first print runs immediately, and the call runs greet afterward.",
  ),
  q(
    "retrieve-returns-a",
    "functions",
    ["returns"],
    "What is result?",
    "def triple(n):\n    return n * 3\nresult = triple(4)",
    ["4", "12", "None"],
    1,
    "The caller receives the returned product 12.",
  ),
  q(
    "retrieve-returns-b",
    "functions",
    ["returns"],
    "What does this call return?",
    "def greet():\n    print('hi')\nresult = greet()",
    ["'hi'", "None", "True"],
    1,
    "Printing produces output, but no return statement means the call returns None.",
  ),
  q(
    "retrieve-base-a",
    "recursion",
    ["base-cases"],
    "Which base case lets sum_to(0) stop correctly?",
    "def sum_to(n):\n    # base case here\n    return n + sum_to(n - 1)",
    ["if n == 0: return 0", "if n > 0: return 0", "if n == 0: return 1"],
    0,
    "Zero contributes zero and stops further calls.",
  ),
  q(
    "retrieve-base-b",
    "recursion",
    ["base-cases"],
    "Which change makes recursive calls approach the base case?",
    "def countdown(n):\n    if n == 0: return 0\n    return countdown(n + 1)",
    [
      "Use countdown(n - 1) for nonnegative n",
      "Use countdown(n + 2)",
      "Remove the base case",
    ],
    0,
    "Subtracting one moves a nonnegative n toward zero.",
  ),
  q(
    "retrieve-unwind-a",
    "recursion",
    ["unwinding"],
    "What returns to the original caller?",
    "def f(n):\n    if n == 0: return 1\n    return 2 * f(n - 1)\nprint(f(2))",
    ["1", "2", "4"],
    2,
    "The base returns 1; waiting calls multiply to 2 and then 4.",
  ),
  q(
    "retrieve-unwind-b",
    "recursion",
    ["unwinding"],
    "What does this print?",
    "def f(n):\n    if n == 0: return 0\n    return n + f(n - 1)\nprint(f(2))",
    ["0", "2", "3"],
    2,
    "The waiting calls add 1 then 2 after the base returns zero.",
  ),
  q(
    "retrieve-errors-a",
    "debugging",
    ["error-types"],
    "What kind of defect is this?",
    "def half(n):\n    return n / 0",
    ["Syntax error", "Runtime error", "Logical error only"],
    1,
    "Division by zero raises ZeroDivisionError when called.",
  ),
  q(
    "retrieve-debug-a",
    "debugging",
    ["debug-boundaries"],
    "Which test exposes the omitted upper limit?",
    "def total(limit):\n    return sum(range(1, limit))",
    ["limit=0, expect 0", "limit=1, expect 1", "limit=1, expect 0"],
    1,
    "At 1 the exclusive stop makes an empty range, though the requirement includes 1.",
  ),
  q(
    "retrieve-debug-b",
    "debugging",
    ["debug-boundaries"],
    "What fix handles empty input?",
    "def average(values):\n    return sum(values) / len(values)",
    [
      "Return 0 when values is empty, if that is the agreed contract",
      "Always divide by 1",
      "Remove the return",
    ],
    0,
    "Check the empty boundary and choose behavior consistent with the function contract.",
  ),
];
export const retrievalActivities: Activity[] = retrievalQuestions.map(
  (question) => ({
    id: question.id,
    source: "retrieval",
    skillIds: question.skillIds,
    revision: question.revision,
    href: `/practice/retrieval?question=${question.id}`,
    title: question.prompt,
  }),
);
const pythonSkills: Record<string, string[]> = {
  "variables-conversion": ["types", "arithmetic"],
  "operators-range": ["boolean", "comparisons"],
  "conditionals-threshold": ["comparisons", "branches"],
  "loops-inclusive-sum": ["loop-boundaries"],
  "functions-return": ["parameters", "returns"],
  "recursion-factorial": ["base-cases", "unwinding"],
  "debugging-safe-average": ["error-types", "debug-boundaries"],
};
export const pythonActivities: Activity[] = Object.values(codingExercises).map(
  (exercise) => ({
    id: exercise.id,
    source: "python",
    skillIds: pythonSkills[exercise.id] ?? [],
    revision: exercise.revision ?? 1,
    href: `/lessons/${exercise.topicId}#code-lab`,
    title: exercise.title,
  }),
);
export const transferActivity: Activity = {
  id: "python-expense-summary",
  source: "python",
  skillIds: [
    "arithmetic",
    "comparisons",
    "loop-boundaries",
    "returns",
    "debug-boundaries",
  ],
  revision: 1,
  href: "/practice/transfer",
  title: "Expense summary transfer challenge",
};
export const activities = [
  ...assessmentActivities,
  ...lessonActivities,
  ...retrievalActivities,
  ...pythonActivities,
  transferActivity,
];
export const activityById = Object.fromEntries(
  activities.map((activity) => [activity.id, activity]),
) as Record<string, Activity>;
export function validateLearningCatalog(
  registry: Skill[] = skills,
  catalog: Activity[] = activities,
) {
  const errors: string[] = [];
  const ids = new Set<string>();
  const registryById: Record<string, Skill> = {};
  for (const skill of registry) registryById[skill.id] ??= skill;
  for (const skill of registry) {
    if (ids.has(skill.id)) errors.push(`Duplicate skill ${skill.id}`);
    ids.add(skill.id);
    if (
      !topics.some(
        (topic) => topic.id === skill.topicId && topic.status === "available",
      ) ||
      !lessons[skill.topicId]
    )
      errors.push(`Unavailable topic ${skill.topicId}`);
    if (!skill.reviewHref || !skill.reviewHref.startsWith("/lessons/"))
      errors.push(`Missing review destination ${skill.id}`);
    for (const id of skill.prerequisites)
      if (!registry.some((candidate) => candidate.id === id))
        errors.push(`Missing prerequisite ${id}`);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(id: string) {
    if (visiting.has(id)) {
      errors.push(`Cyclic prerequisite ${id}`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const next of registryById[id]?.prerequisites ?? []) visit(next);
    visiting.delete(id);
    visited.add(id);
  }
  for (const skill of registry) visit(skill.id);
  const activityIds = new Set<string>();
  for (const activity of catalog) {
    if (activityIds.has(activity.id))
      errors.push(`Duplicate activity ${activity.id}`);
    activityIds.add(activity.id);
    if (
      !activity.skillIds.length ||
      activity.skillIds.some((id) => !ids.has(id))
    )
      errors.push(`Invalid skill mapping ${activity.id}`);
    if (!Number.isSafeInteger(activity.revision) || activity.revision < 1)
      errors.push(`Invalid revision ${activity.id}`);
    if (!activity.href.startsWith("/"))
      errors.push(`Invalid activity destination ${activity.id}`);
  }
  for (const question of fundamentalsAssessment.questions)
    if (!activityIds.has(question.id))
      errors.push(`Unmapped assessment ${question.id}`);
  for (const lesson of Object.values(lessons).filter((item) =>
    registry.some((skill) => skill.topicId === item.topicId),
  ))
    for (const question of lesson.questions)
      if (!activityIds.has(question.id))
        errors.push(`Unmapped lesson question ${question.id}`);
  for (const exercise of Object.values(codingExercises))
    if (!activityIds.has(exercise.id))
      errors.push(`Unmapped Python lab ${exercise.id}`);
  for (const question of retrievalQuestions) {
    if (
      question.options.length < 2 ||
      question.correctIndex < 0 ||
      question.correctIndex >= question.options.length ||
      !question.explanation
    )
      errors.push(`Invalid retrieval ${question.id}`);
    if (
      !topics.some(
        (topic) =>
          topic.id === question.topicId && topic.status === "available",
      )
    )
      errors.push(`Unavailable retrieval topic ${question.topicId}`);
  }
  return errors;
}
