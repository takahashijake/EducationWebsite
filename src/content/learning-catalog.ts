import { topics, topicHref } from "./curriculum";
import { fundamentalsAssessment } from "./assessments";
import type { Question } from "./types";
import {
  dsaLessonMap,
  dsaPythonMap,
  dsaRetrievalQuestions,
} from "./dsa-catalog";
import { dsaCodingExercises } from "./dsa-coding-exercises";
import { sortingCodingExercises } from "./sorting-coding-exercises";
import {
  sortingLessonMap,
  sortingPythonMap,
  sortingRetrievalQuestions,
} from "./sorting-catalog";
import {
  linkedListLessonMap,
  linkedListPythonMap,
  linkedListRetrievalQuestions,
} from "./linked-list-catalog";
import { linkedListCodingExercises } from "./linked-list-coding-exercises";
import { stackQueueCodingExercises } from "./stack-queue-coding-exercises";
import { graphCodingExercises } from "./graph-coding-exercises";
import { weightedCodingExercises } from "./weighted-coding-exercises";
import { bellmanCodingExercises } from "./bellman-coding-exercises";
import { dpCodingExercises } from "./dp-coding-exercises";
import { dpLessonMap, dpPythonMap, dpRetrievalQuestions } from "./dp-catalog";
import {
  bellmanLessonMap,
  bellmanPythonMap,
  bellmanRetrievalQuestions,
} from "./bellman-catalog";
import {
  weightedLessonMap,
  weightedPythonMap,
  weightedRetrievalQuestions,
} from "./weighted-catalog";
import { treeCodingExercises } from "./tree-coding-exercises";
import {
  treeLessonMap,
  treePythonMap,
  treeRetrievalQuestions,
} from "./tree-catalog";
import {
  graphLessonMap,
  graphPythonMap,
  graphRetrievalQuestions,
} from "./graph-catalog";
import {
  stackQueueLessonMap,
  stackQueuePythonMap,
  stackQueueRetrievalQuestions,
} from "./stack-queue-catalog";
import { adaptiveFamilies } from "./adaptive-families";

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
  define(
    "array-indexing",
    "Array indexing",
    "Read and replace a value at a zero-based position.",
    "arrays-strings",
    ["assignment"],
  ),
  define(
    "sequence-boundaries",
    "Sequence boundaries",
    "Handle empty, singleton, and final-index cases.",
    "arrays-strings",
    ["loop-boundaries", "array-indexing"],
  ),
  define(
    "sequence-traversal",
    "Sequence traversal",
    "Visit every element without crossing its boundary.",
    "arrays-strings",
    ["loop-termination", "sequence-boundaries"],
  ),
  define(
    "sequence-operation-cost",
    "Mutation and operation cost",
    "Distinguish list access, shifting, and immutable-string rebuilding.",
    "arrays-strings",
    ["array-indexing"],
  ),
  define(
    "linear-search",
    "Linear search",
    "Scan in order and handle matches and absence.",
    "searching",
    ["sequence-traversal"],
  ),
  define(
    "binary-invariants",
    "Binary search invariants",
    "Maintain inclusive candidate bounds while halving.",
    "searching",
    ["sequence-boundaries", "comparisons"],
  ),
  define(
    "sorted-precondition",
    "Sorted-input precondition",
    "Know when midpoint elimination is justified.",
    "searching",
    ["binary-invariants"],
  ),
  define(
    "search-complexity",
    "Search complexity",
    "Explain linear and logarithmic worst-case comparison growth.",
    "searching",
    ["linear-search", "binary-invariants"],
  ),
  define(
    "sorting-order",
    "Sorting order and contracts",
    "Recognize ascending order, retained items, and in-place mutation.",
    "sorting",
    ["sequence-traversal"],
  ),
  define(
    "bubble-invariant",
    "Bubble sorted suffix",
    "Trace adjacent comparisons, swaps, and early termination.",
    "sorting",
    ["sorting-order", "loop-boundaries"],
  ),
  define(
    "selection-invariant",
    "Selection sorted prefix",
    "Track the minimum candidate and place it after a complete suffix scan.",
    "sorting",
    ["sorting-order"],
  ),
  define(
    "insertion-invariant",
    "Insertion sorted prefix",
    "Trace the saved key and rightward shifts of larger values.",
    "sorting",
    ["sorting-order"],
  ),
  define(
    "sorting-complexity",
    "Sorting operation costs",
    "Separate comparisons, swaps, writes, and asymptotic growth.",
    "sorting",
    ["sorting-order", "sequence-operation-cost"],
  ),
  define(
    "sorting-stability",
    "Equal-key stability",
    "Track record identities through strict comparisons and selection swaps.",
    "sorting",
    ["sorting-order", "insertion-invariant"],
  ),
  define(
    "linked-node-identity",
    "Node identity and values",
    "Distinguish a node object from its stored value and a list position.",
    "linked-lists",
    ["assignment"],
  ),
  define(
    "linked-traversal",
    "Reference traversal",
    "Follow next references through the reachable chain until null.",
    "linked-lists",
    ["linked-node-identity", "loop-termination"],
  ),
  define(
    "linked-head-insertion",
    "Head insertion",
    "Link a new node to the old head before moving head.",
    "linked-lists",
    ["linked-node-identity"],
  ),
  define(
    "linked-deletion",
    "Reference rewiring and deletion",
    "Bypass the first matched node without losing unaffected nodes.",
    "linked-lists",
    ["linked-traversal", "linked-head-insertion"],
  ),
  define(
    "linked-complexity",
    "Linked-list operation costs",
    "Separate finding a node from changing a known link.",
    "linked-lists",
    ["linked-traversal", "sequence-operation-cost"],
  ),
  define(
    "linked-aliasing",
    "Reference aliasing and preservation",
    "Predict how shared node references affect the reachable structure.",
    "linked-lists",
    ["linked-node-identity", "linked-head-insertion"],
  ),
  define(
    "stack-lifo",
    "Stack LIFO reasoning",
    "Predict which pushed item leaves next.",
    "stacks-queues",
    ["sequence-traversal"],
  ),
  define(
    "stack-boundaries",
    "Stack top and empty cases",
    "Maintain top and handle empty operations.",
    "stacks-queues",
    ["stack-lifo", "linked-node-identity"],
  ),
  define(
    "queue-fifo",
    "Queue FIFO reasoning",
    "Predict front and removal order.",
    "stacks-queues",
    ["sequence-traversal"],
  ),
  define(
    "queue-references",
    "Queue endpoint invariants",
    "Maintain head and tail across empty and singleton transitions.",
    "stacks-queues",
    ["queue-fifo", "linked-node-identity"],
  ),
  define(
    "structure-complexity",
    "Stack and queue representation costs",
    "Compare list, deque, and linked operations accurately.",
    "stacks-queues",
    ["sequence-operation-cost", "linked-complexity"],
  ),
  define(
    "structure-transfer",
    "Applied stack and queue transfer",
    "Use LIFO or FIFO to solve nesting and task-order problems.",
    "stacks-queues",
    ["stack-lifo", "queue-fifo"],
  ),
  define(
    "tree-structure",
    "Tree relationships and height",
    "Identify roots, children, leaves, depth, and edge-based height.",
    "trees",
    ["linked-node-identity"],
  ),
  define(
    "tree-traversal",
    "Tree traversal orders",
    "Trace recursive depth-first orders and FIFO level-order.",
    "trees",
    ["tree-structure", "unwinding", "queue-fifo"],
  ),
  define(
    "tree-ordering",
    "Global BST ordering",
    "Apply strict ordering across complete subtrees.",
    "trees",
    ["tree-structure"],
  ),
  define(
    "bst-search",
    "BST search paths",
    "Choose one branch and recognize absent keys.",
    "trees",
    ["tree-ordering"],
  ),
  define(
    "bst-mutations",
    "BST insertion and deletion",
    "Rewire references while preserving node identity.",
    "trees",
    ["bst-search", "tree-ordering"],
  ),
  define(
    "tree-complexity",
    "BST height and costs",
    "Compare balanced and skewed paths and memory costs.",
    "trees",
    ["tree-structure", "structure-complexity"],
  ),
  define(
    "weighted-path-costs",
    "Weighted path costs",
    "Sum directed edge weights, including zero.",
    "weighted-shortest-paths",
    ["graph-adjacency", "structure-complexity"],
  ),
  define(
    "weighted-hops-cost",
    "Minimum hops versus cost",
    "Compare edge count with total weight.",
    "weighted-shortest-paths",
    ["graph-bfs", "weighted-path-costs"],
  ),
  define(
    "weighted-relaxation",
    "Edge relaxation",
    "Improve tentative estimates and predecessors strictly.",
    "weighted-shortest-paths",
    ["weighted-path-costs", "graph-direction"],
  ),
  define(
    "weighted-priority-queue",
    "Priority-queue selection",
    "Select the minimum and skip stale entries.",
    "weighted-shortest-paths",
    ["weighted-relaxation", "structure-complexity"],
  ),
  define(
    "weighted-settled-invariant",
    "Settled-distance invariant",
    "Justify greedy settling with nonnegative edges.",
    "weighted-shortest-paths",
    ["weighted-priority-queue"],
  ),
  define(
    "weighted-complexity-limits",
    "Complexity and limitations",
    "State heap assumptions and choose algorithms by weight rules.",
    "weighted-shortest-paths",
    ["weighted-settled-invariant", "graph-complexity"],
  ),
  define(
    "bellman-negative-costs",
    "Negative path costs",
    "Add signed weights and distinguish a negative edge from a cycle.",
    "bellman-ford",
    ["weighted-path-costs", "graph-direction"],
  ),
  define(
    "bellman-rounds",
    "Relaxation rounds and invariants",
    "Trace repeated complete edge scans and the V−1 bound.",
    "bellman-ford",
    ["weighted-relaxation", "bellman-negative-costs"],
  ),
  define(
    "bellman-convergence",
    "Early stopping and convergence",
    "Stop only after a complete unchanged pass.",
    "bellman-ford",
    ["bellman-rounds"],
  ),
  define(
    "bellman-cycle-detection",
    "Reachable negative-cycle detection",
    "Test reachable strict improvements after V−1 passes.",
    "bellman-ford",
    ["bellman-rounds", "graph-reachability"],
  ),
  define(
    "bellman-cycle-impact",
    "Cycle impact and path validity",
    "Propagate cycle influence and report only valid finite paths.",
    "bellman-ford",
    ["bellman-cycle-detection", "graph-reachability"],
  ),
  define(
    "bellman-algorithm-choice",
    "Algorithm selection and complexity",
    "Choose BFS, Dijkstra, or Bellman–Ford and state their assumptions.",
    "bellman-ford",
    ["bellman-cycle-impact", "weighted-complexity-limits"],
  ),
  define(
    "dp-overlapping-subproblems",
    "Overlapping subproblems",
    "Identify repeated states and when caching helps.",
    "dynamic-programming",
    ["base-cases", "sequence-traversal"],
  ),
  define(
    "dp-state-recurrence",
    "State and recurrence",
    "Derive base cases and dependencies from a state definition.",
    "dynamic-programming",
    ["dp-overlapping-subproblems"],
  ),
  define(
    "dp-memoization",
    "Top-down memoization",
    "Cache complete states and return immediately on a hit.",
    "dynamic-programming",
    ["dp-state-recurrence"],
  ),
  define(
    "dp-tabulation-order",
    "Bottom-up tabulation",
    "Fill cells only after their dependencies exist.",
    "dynamic-programming",
    ["dp-state-recurrence", "sequence-boundaries"],
  ),
  define(
    "dp-coin-change",
    "Minimum coin change",
    "Distinguish unreachable states, compare candidates, and reconstruct coins.",
    "dynamic-programming",
    ["dp-tabulation-order"],
  ),
  define(
    "dp-knapsack-reconstruction",
    "Zero-one knapsack",
    "Use previous-row dependencies and reconstruct unique item identities.",
    "dynamic-programming",
    ["dp-tabulation-order"],
  ),
  define(
    "graph-adjacency",
    "Graph adjacency and representation",
    "Build neighbor lists and compare sparse storage.",
    "graphs",
    ["sequence-traversal"],
  ),
  define(
    "graph-direction",
    "Directed and undirected edges",
    "Follow arrows and represent two-way edges correctly.",
    "graphs",
    ["graph-adjacency"],
  ),
  define(
    "graph-bfs",
    "Breadth-first frontier",
    "Predict FIFO discovery and mark on enqueue.",
    "graphs",
    ["queue-fifo", "graph-adjacency"],
  ),
  define(
    "graph-dfs",
    "Depth-first frames",
    "Trace recursive descent and backtracking.",
    "graphs",
    ["unwinding", "graph-adjacency"],
  ),
  define(
    "graph-reachability",
    "Reachability and shortest paths",
    "Separate unreachable vertices from minimum-edge routes.",
    "graphs",
    ["graph-bfs", "graph-dfs"],
  ),
  define(
    "graph-complexity",
    "Graph traversal costs and transfer",
    "Compare list and matrix scans and reason about dependencies.",
    "graphs",
    ["graph-adjacency", "structure-complexity"],
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
  ...dsaLessonMap,
  ...sortingLessonMap,
  ...linkedListLessonMap,
  ...stackQueueLessonMap,
  ...graphLessonMap,
  ...weightedLessonMap,
  ...bellmanLessonMap,
  ...dpLessonMap,
  ...treeLessonMap,
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
const lessonTopics: Record<string, string> = {
  arrays: "arrays-strings",
  searching: "searching",
  sorting: "sorting",
  linked: "linked-lists",
  stackqueue: "stacks-queues",
  graphs: "graphs",
  weighted: "weighted-shortest-paths",
  bellman: "bellman-ford",
  dp: "dynamic-programming",
  trees: "trees",
  variables: "variables-data-types",
  operators: "operators-expressions",
  conditionals: "conditionals",
  loops: "loops",
  functions: "functions",
  recursion: "recursion",
  debugging: "debugging",
};
export const lessonActivities: Activity[] = Object.entries(lessonMap).map(
  ([id, skillIds]) => {
    const [prefix, number] = id.split("-q");
    const topic = topics.find((item) => item.id === lessonTopics[prefix])!;
    return {
      id,
      source: "lesson",
      skillIds,
      revision: 1,
      href: `${topicHref(topic)}#knowledge-check`,
      title: `${topic.title} knowledge check ${number}`,
    };
  },
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
  ...dsaRetrievalQuestions,
  ...sortingRetrievalQuestions,
  ...linkedListRetrievalQuestions,
  ...stackQueueRetrievalQuestions,
  ...graphRetrievalQuestions,
  ...weightedRetrievalQuestions,
  ...bellmanRetrievalQuestions,
  ...dpRetrievalQuestions,
  ...treeRetrievalQuestions,
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
// Keep lightweight authored metadata in the client catalog. The integrity
// validator compares these entries with full exercise definitions in tests.
const pythonMetadata: Array<{
  id: string;
  topicId: string;
  title: string;
  skillIds: string[];
}> = [
  {
    id: "variables-conversion",
    topicId: "variables-data-types",
    title: "Convert before calculating",
    skillIds: ["types", "arithmetic"],
  },
  {
    id: "operators-range",
    topicId: "operators-expressions",
    title: "Repair a range condition",
    skillIds: ["boolean", "comparisons"],
  },
  {
    id: "conditionals-threshold",
    topicId: "conditionals",
    title: "Implement an inclusive decision",
    skillIds: ["comparisons", "branches"],
  },
  {
    id: "loops-inclusive-sum",
    topicId: "loops",
    title: "Repair an off-by-one sum",
    skillIds: ["loop-boundaries"],
  },
  {
    id: "functions-return",
    topicId: "functions",
    title: "Return a reusable result",
    skillIds: ["parameters", "returns"],
  },
  {
    id: "recursion-factorial",
    topicId: "recursion",
    title: "Repair the factorial base case",
    skillIds: ["base-cases", "unwinding"],
  },
  {
    id: "debugging-safe-average",
    topicId: "debugging",
    title: "Diagnose an empty average",
    skillIds: ["error-types", "debug-boundaries"],
  },
];
export const pythonActivities: Activity[] = pythonMetadata.map((exercise) => ({
  id: exercise.id,
  source: "python",
  skillIds: exercise.skillIds,
  revision: 1,
  href: `/lessons/${exercise.topicId}#code-lab`,
  title: exercise.title,
}));
export const dsaPythonActivities: Activity[] = dsaCodingExercises.map(
  (exercise) => ({
    id: exercise.id,
    source: "python",
    skillIds: dsaPythonMap[exercise.id] ?? [],
    revision: exercise.revision ?? 1,
    href: `/lessons/${exercise.topicId}#code-lab`,
    title: exercise.title,
  }),
);
export const sortingPythonActivities: Activity[] = sortingCodingExercises.map(
  (exercise) => ({
    id: exercise.id,
    source: "python",
    skillIds: sortingPythonMap[exercise.id] ?? [],
    revision: exercise.revision ?? 1,
    href: `/lessons/${exercise.topicId}#code-lab`,
    title: exercise.title,
  }),
);
export const linkedListPythonActivities: Activity[] =
  linkedListCodingExercises.map((exercise) => ({
    id: exercise.id,
    source: "python",
    skillIds: linkedListPythonMap[exercise.id] ?? [],
    revision: exercise.revision ?? 1,
    href: `/lessons/${exercise.topicId}#code-lab`,
    title: exercise.title,
  }));
export const stackQueuePythonActivities: Activity[] =
  stackQueueCodingExercises.map((exercise) => ({
    id: exercise.id,
    source: "python",
    skillIds: stackQueuePythonMap[exercise.id] ?? [],
    revision: exercise.revision ?? 1,
    href: `/lessons/${exercise.topicId}#code-lab`,
    title: exercise.title,
  }));
export const graphPythonActivities: Activity[] = graphCodingExercises.map(
  (exercise) => ({
    id: exercise.id,
    source: "python",
    skillIds: graphPythonMap[exercise.id] ?? [],
    revision: exercise.revision ?? 1,
    href: "/lessons/graphs#code-lab",
    title: exercise.title,
  }),
);
export const weightedPythonActivities: Activity[] = weightedCodingExercises.map(
  (exercise) => ({
    id: exercise.id,
    source: "python",
    skillIds: weightedPythonMap[exercise.id] ?? [],
    revision: exercise.revision ?? 1,
    href: "/lessons/weighted-shortest-paths#code-lab",
    title: exercise.title,
  }),
);
export const bellmanPythonActivities: Activity[] = bellmanCodingExercises.map(
  (exercise) => ({
    id: exercise.id,
    source: "python",
    skillIds: bellmanPythonMap[exercise.id] ?? [],
    revision: exercise.revision ?? 1,
    href: "/lessons/bellman-ford#code-lab",
    title: exercise.title,
  }),
);
export const dpPythonActivities: Activity[] = dpCodingExercises.map(
  (exercise) => ({
    id: exercise.id,
    source: "python",
    skillIds: dpPythonMap[exercise.id] ?? [],
    revision: exercise.revision ?? 1,
    href: "/lessons/dynamic-programming#code-lab",
    title: exercise.title,
  }),
);
export const treePythonActivities: Activity[] = treeCodingExercises.map(
  (exercise) => ({
    id: exercise.id,
    source: "python",
    skillIds: treePythonMap[exercise.id] ?? [],
    revision: exercise.revision ?? 1,
    href: "/lessons/trees#code-lab",
    title: exercise.title,
  }),
);
export const transferActivity: Activity = {
  id: "python-expense-summary",
  source: "python",
  skillIds: [
    "assignment",
    "arithmetic",
    "comparisons",
    "loop-termination",
    "returns",
    "debug-boundaries",
  ],
  revision: 1,
  href: "/practice/transfer",
  title: "Expense summary transfer challenge",
};
export const adaptiveActivities: Activity[] = adaptiveFamilies.map((item) => ({
  id: `adaptive-${item.id}`,
  source: "retrieval",
  skillIds: [item.skillId],
  revision: item.revision,
  href: `/practice/adaptive?skill=${item.skillId}`,
  title: `${item.id.replaceAll("-", " ")} practice`,
}));
export const activities = [
  ...assessmentActivities,
  ...lessonActivities,
  ...retrievalActivities,
  ...pythonActivities,
  ...dsaPythonActivities,
  ...sortingPythonActivities,
  ...linkedListPythonActivities,
  ...stackQueuePythonActivities,
  ...graphPythonActivities,
  ...weightedPythonActivities,
  ...bellmanPythonActivities,
  ...dpPythonActivities,
  ...treePythonActivities,
  transferActivity,
  ...adaptiveActivities,
];
export const activityById = Object.fromEntries(
  activities.map((activity) => [activity.id, activity]),
) as Record<string, Activity>;
