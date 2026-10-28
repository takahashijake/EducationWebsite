/** Authored templates only. Generation never evaluates source text as code. */
export { adaptiveSkillIds } from "./adaptive-skills";
import { sortingAdaptiveFamilies } from "./sorting-adaptive-families";
import { linkedListAdaptiveFamilies } from "./linked-list-adaptive-families";
import { stackQueueAdaptiveFamilies } from "./stack-queue-adaptive-families";
import { graphAdaptiveFamilies } from "./graph-adaptive-families";
import { treeAdaptiveFamilies } from "./tree-adaptive-families";
export type AdaptiveDifficulty = "foundation" | "application";
export type AdaptiveOption = { text: string; misconception?: string };
export type AdaptiveInstance = {
  id: string;
  familyId: string;
  revision: number;
  seed: number;
  skillId: string;
  topicId: string;
  difficulty: AdaptiveDifficulty;
  reviewHref: string;
  prompt: string;
  context: string;
  options: AdaptiveOption[];
  correctIndex: number;
  explanation: string;
  hints: [string, string];
  workedStep: string;
};
type Choice = AdaptiveOption & { correct?: true };
type Draft = Pick<
  AdaptiveInstance,
  "prompt" | "context" | "explanation" | "hints" | "workedStep"
> & { choices: [Choice, Choice, Choice] };
type Random = {
  int: (min: number, max: number) => number;
  pick: <T>(items: readonly T[]) => T;
};
export type AdaptiveFamily = {
  id: string;
  revision: number;
  skillId: string;
  topicId: string;
  difficulty: AdaptiveDifficulty;
  reviewHref: string;
  generate: (random: Random) => Draft;
};
const right = (text: string): Choice => ({ text, correct: true });
const wrong = (text: string, misconception: string): Choice => ({
  text,
  misconception,
});
const range = (start: number, stop: number, step = 1) => {
  const values: number[] = [];
  for (let i = start; i < stop; i += step) values.push(i);
  return values;
};
const shown = (values: number[]) => `[${values.join(", ")}]`;
const list = (random: Random, length: number) =>
  Array.from({ length }, () => random.int(0, 9));
const family = (
  id: string,
  skillId: string,
  topicId: string,
  difficulty: AdaptiveDifficulty,
  generate: AdaptiveFamily["generate"],
): AdaptiveFamily => ({
  id,
  revision: 1,
  skillId,
  topicId,
  difficulty,
  reviewHref: `/lessons/${topicId}`,
  generate,
});

export const adaptiveFamilies: AdaptiveFamily[] = [
  ...sortingAdaptiveFamilies,
  ...linkedListAdaptiveFamilies,
  ...stackQueueAdaptiveFamilies,
  ...graphAdaptiveFamilies,
  ...treeAdaptiveFamilies,
  family(
    "comparison-branch",
    "comparisons",
    "conditionals",
    "foundation",
    (r) => {
      const boundary = r.int(3, 25);
      const value = boundary + r.int(-1, 1);
      const inclusive = r.int(0, 1) === 1;
      const operator = inclusive ? ">=" : ">";
      const runs = inclusive ? value >= boundary : value > boundary;
      const noun = r.pick(["score", "temperature", "stock"]);
      return {
        prompt: "Which branch runs?",
        context: `${noun} = ${value}\nif ${noun} ${operator} ${boundary}:\n    print('accept')\nelse:\n    print('wait')`,
        choices: [
          runs
            ? right("Prints accept")
            : wrong(
                "Prints accept",
                `At ${value}, ${operator} ${boundary} is false; the boundary rule matters.`,
              ),
          runs
            ? wrong(
                "Prints wait",
                `At ${value}, ${operator} ${boundary} is true; the if branch runs.`,
              )
            : right("Prints wait"),
          wrong(
            "Raises an error",
            "Both comparisons and print calls are valid Python here.",
          ),
        ],
        explanation: `${value} ${operator} ${boundary} is ${runs ? "true" : "false"}, so the ${runs ? "if" : "else"} branch runs.`,
        hints: [
          "Compare the two numbers before considering the branches.",
          `Equality ${inclusive ? "does" : "does not"} satisfy ${operator}.`,
        ],
        workedStep: `Evaluate ${value} ${operator} ${boundary} first; it is ${runs ? "true" : "false"}.`,
      };
    },
  ),
  family(
    "comparison-policy",
    "comparisons",
    "conditionals",
    "application",
    (r) => {
      const boundary = r.int(2, 30);
      const inclusive = r.int(0, 1) === 1;
      const noun = r.pick(["age", "score", "quantity"]);
      return {
        prompt: `Which test implements “${noun} is ${inclusive ? "at least" : "greater than"} ${boundary}”?`,
        context: `Choose the condition for an if statement. The boundary value ${boundary} must ${inclusive ? "pass" : "fail"}.`,
        choices: [
          inclusive
            ? right(`${noun} >= ${boundary}`)
            : wrong(
                `${noun} >= ${boundary}`,
                "This includes equality, contrary to a strictly greater-than rule.",
              ),
          inclusive
            ? wrong(
                `${noun} > ${boundary}`,
                "This excludes the boundary, although ‘at least’ includes equality.",
              )
            : right(`${noun} > ${boundary}`),
          wrong(
            `${noun} == ${boundary}`,
            "Equality alone excludes values above the boundary.",
          ),
        ],
        explanation: `${inclusive ? "At least includes" : "Greater than excludes"} the boundary, so use ${noun} ${inclusive ? ">=" : ">"} ${boundary}.`,
        hints: [
          "Test the proposed condition at the exact boundary.",
          `Then test a value one greater than ${boundary}.`,
        ],
        workedStep: `At ${noun} = ${boundary}, the policy says ${inclusive ? "pass" : "fail"}.`,
      };
    },
  ),
  family("loop-values", "loop-boundaries", "loops", "foundation", (r) => {
    const start = r.int(0, 7);
    const stop = start + r.int(0, 6);
    const actual = shown(range(start, stop));
    return {
      prompt: "Which indices are printed, in order?",
      context: `for index in range(${start}, ${stop}):\n    print(index)`,
      choices: [
        right(actual),
        wrong(
          shown(range(start, stop + 1)),
          "The stop argument is excluded, even when the range is empty.",
        ),
        wrong(
          shown(range(start + 1, stop + 2)),
          "The start argument is included; shifting both ends skips it.",
        ),
      ],
      explanation: `range(${start}, ${stop}) includes ${start} when possible and stops before ${stop}, producing ${actual}.`,
      hints: [
        "The stop value is never produced.",
        "Check whether the start is already at or past the stop.",
      ],
      workedStep: `Begin at ${start}; keep values strictly less than ${stop}.`,
    };
  }),
  family("loop-step-count", "loop-boundaries", "loops", "application", (r) => {
    const start = r.int(0, 5);
    const step = r.int(1, 3);
    const stop = start + r.int(0, 12);
    const count = range(start, stop, step).length;
    return {
      prompt: "How many times does the loop body execute?",
      context: `for index in range(${start}, ${stop}, ${step}):\n    print(index)`,
      choices: [
        right(`${count} times`),
        wrong(
          `${count + 1} times`,
          "This counts a value at or beyond the exclusive stop.",
        ),
        wrong(
          `${count === 0 ? 2 : count - 1} times`,
          "This omits a valid starting or final value; enumerate while index < stop.",
        ),
      ],
      explanation: `The visited indices are ${shown(range(start, stop, step))}, so the body runs ${count} times.`,
      hints: [
        "Start at the first argument, then add the step each time.",
        `Stop before ${stop}, not after reaching it.`,
      ],
      workedStep: `The first possible index is ${start}; each next index adds ${step}.`,
    };
  }),
  family(
    "sequence-last-index",
    "sequence-boundaries",
    "arrays-strings",
    "foundation",
    (r) => {
      const length = r.int(0, 7);
      const values = list(r, length);
      const answer = length
        ? `Index ${length - 1}`
        : "No valid nonnegative index";
      return {
        prompt: "What is the highest valid nonnegative index?",
        context: `values = ${shown(values)}\nlen(values) == ${length}`,
        choices:
          length === 0
            ? [
                right(answer),
                wrong("Index 0", "An empty list has no element at index 0."),
                wrong(
                  "Index -1",
                  "Negative indexing also fails on an empty list; the question asks for a nonnegative index.",
                ),
              ]
            : length === 1
              ? [
                  right(answer),
                  wrong("Index 1", "Length 1 is a count, not a valid index."),
                  wrong(
                    "No valid nonnegative index",
                    "A singleton still has index 0.",
                  ),
                ]
              : [
                  right(answer),
                  wrong(
                    `Index ${length}`,
                    "The length itself is one past the final index.",
                  ),
                  wrong(
                    "Index 0",
                    "Index 0 is valid but is not the highest valid index here.",
                  ),
                ],
        explanation: length
          ? `Length ${length} means indices 0 through ${length - 1}.`
          : "An empty list has no valid index.",
        hints: [
          "A length is a count of elements.",
          "Subtract one only when the list is nonempty.",
        ],
        workedStep: length
          ? `Count ${length} positions starting at zero: the last is ${length - 1}.`
          : "There is no first position to count.",
      };
    },
  ),
  family(
    "sequence-direct-read",
    "sequence-boundaries",
    "arrays-strings",
    "application",
    (r) => {
      const length = r.int(0, 5);
      const values = list(r, length);
      const last = r.int(0, 1) === 1;
      const access = last ? "values[len(values) - 1]" : "values[0]";
      const value = last ? values.at(-1) : values[0];
      return {
        prompt: "What happens when the return statement runs?",
        context: `def read_position(values):\n    return ${access}\nread_position(${shown(values)})`,
        choices:
          length === 0
            ? [
                right("Raises IndexError"),
                wrong(
                  "Returns None",
                  "Direct indexing does not supply a default for an empty list.",
                ),
                wrong(
                  "Returns 0",
                  "No element exists to return, even at index zero.",
                ),
              ]
            : [
                right(`Returns ${value}`),
                wrong(
                  "Raises IndexError",
                  "The list is nonempty, so this first or final index exists.",
                ),
                wrong(
                  "Returns None",
                  "The selected element is returned; no empty guard produces None here.",
                ),
              ],
        explanation: length
          ? `${access} is a valid index on this ${length}-element list and reads ${value}.`
          : `${access} attempts to read an element of an empty list, raising IndexError.`,
        hints: [
          "Check whether values contains any elements before indexing.",
          length
            ? `For ${length} elements, the final index is ${length - 1}.`
            : "An empty list has no final index.",
        ],
        workedStep: length
          ? `Valid indices are 0 through ${length - 1}.`
          : "No index is valid for this empty list.",
      };
    },
  ),
  family(
    "traversal-indices",
    "sequence-traversal",
    "arrays-strings",
    "foundation",
    (r) => {
      const values = list(r, r.int(0, 6));
      const length = values.length;
      return {
        prompt: "Which indices does the loop visit?",
        context: `values = ${shown(values)}\nfor index in range(len(values)):\n    print(index, values[index])`,
        choices: [
          right(shown(range(0, length))),
          wrong(
            shown(range(0, length + 1)),
            "Index len(values) is included here, but it is outside the list.",
          ),
          wrong(
            shown(range(1, length + 2)),
            "The loop begins at zero, not one.",
          ),
        ],
        explanation: `range(${length}) produces ${shown(range(0, length))}; no element is read when the list is empty.`,
        hints: [
          "range(len(values)) starts at index zero.",
          "Its stop is excluded, so index len(values) is never visited.",
        ],
        workedStep: `The list has ${length} elements, with valid indices ${shown(range(0, length))}.`,
      };
    },
  ),
  family(
    "traversal-enumerate",
    "sequence-traversal",
    "arrays-strings",
    "application",
    (r) => {
      const values = list(r, r.int(0, 6));
      const last = r.int(0, 1) === 1;
      const index = last ? values.length - 1 : 0;
      const value = values[index];
      return {
        prompt: `What ${last ? "last" : "first"} (index, value) pair does enumerate produce?`,
        context: `values = ${shown(values)}\nfor index, value in enumerate(values):\n    print(index, value)`,
        choices:
          values.length === 0
            ? [
                right("No pair is produced"),
                wrong("(0, 0)", "An empty list has no first element or pair."),
                wrong(
                  "(1, 0)",
                  "Enumerate does not invent an element for an empty list.",
                ),
              ]
            : [
                right(`(${index}, ${value})`),
                wrong(
                  `(${index + 1}, ${value})`,
                  "Enumerate uses zero-based indices and does not shift this position.",
                ),
                wrong(
                  `(${index}, ${value + 1})`,
                  "Enumerate returns the stored value without adding one.",
                ),
              ],
        explanation: values.length
          ? `The selected pair is (${index}, ${value}); enumerate pairs each stored value with its zero-based index.`
          : "The loop has no iterations, so enumerate produces no pair.",
        hints: [
          "Enumerate starts its index at zero by default.",
          "It does not alter the value stored in the list.",
        ],
        workedStep: values.length
          ? `The list's ${last ? "last" : "first"} position is ${index}, holding ${value}.`
          : "There is no position to pair with a value.",
      };
    },
  ),
  family(
    "linear-first-match",
    "linear-search",
    "searching",
    "foundation",
    (r) => {
      const mode = r.int(0, 5);
      const length = mode === 0 ? 0 : mode === 1 ? 1 : r.int(3, 7);
      const values = list(r, length);
      const target = r.int(1, 8);
      if (mode === 1 || mode === 2) values[0] = target;
      if (mode === 2) values[length - 1] = target;
      if (mode === 3) {
        values.fill(target + 1);
        values[length - 1] = target;
      }
      if (mode === 4) values.fill(target + 1);
      const result = values.indexOf(target);
      const alternatives = [length, -1, 0, length - 1, 1, 2]
        .filter(
          (value, index, all) =>
            value !== result && all.indexOf(value) === index,
        )
        .slice(0, 2);
      const label = (index: number) => `Return ${index}`;
      const wrongIndexReason = (index: number) => {
        if (index === length)
          return "Length is one past the last index and is not the missing sentinel.";
        if (index === -1)
          return "A matching value is present; the scan returns when it first reaches it.";
        if (index >= length) return "That index is outside the collection.";
        if (result === -1)
          return "No element matches the target, so no index can be returned.";
        if (values[index] === target)
          return "This is a later duplicate; the scan already returned the earlier match.";
        return "The value at this index does not equal the target.";
      };
      return {
        prompt: "What does a left-to-right linear search return?",
        context: `values = ${shown(values)}\ntarget = ${target}\n# Return the first matching index, or -1 after a complete miss.`,
        choices: [
          right(label(result)),
          wrong(label(alternatives[0]), wrongIndexReason(alternatives[0])),
          wrong(label(alternatives[1]), wrongIndexReason(alternatives[1])),
        ],
        explanation:
          result === -1
            ? `No value equals ${target}; a complete scan returns -1.`
            : `The first ${target} appears at index ${result}, so the scan returns there.`,
        hints: [
          "Start at index zero and compare each value with the target.",
          "Stop as soon as equality occurs; a miss returns -1 only after the scan.",
        ],
        workedStep:
          result === -1
            ? `None of ${shown(values)} equals ${target}.`
            : `Indices before ${result} do not return the target; index ${result} does.`,
      };
    },
  ),
  family(
    "linear-comparison-count",
    "linear-search",
    "searching",
    "application",
    (r) => {
      const length = r.int(0, 7);
      const values = list(r, length);
      const target = r.int(1, 8);
      const mode = r.int(0, 3);
      if (length && mode === 0) values[0] = target;
      if (length && mode === 1) {
        values.fill(target + 1);
        values[length - 1] = target;
      }
      if (mode === 2) values.fill(target + 1);
      const first = values.indexOf(target);
      const count = first === -1 ? length : first + 1;
      return {
        prompt: "How many value-to-target equality checks occur before return?",
        context: `values = ${shown(values)}\ntarget = ${target}\n# Scan left to right; return on the first match, or -1 after the loop.`,
        choices: [
          right(`${count} checks`),
          wrong(
            `${count + 1} checks`,
            "This counts one comparison after the algorithm has already returned or exhausted the list.",
          ),
          wrong(
            `${count === 0 ? 2 : count - 1} checks`,
            count === 0
              ? "An empty list makes no equality checks."
              : "This stops before the first match or before checking the last candidate.",
          ),
        ],
        explanation:
          first === -1
            ? `All ${length} elements are checked; the target is absent.`
            : `The match is at index ${first}, after ${first + 1} equality checks.`,
        hints: [
          "One equality test occurs for each inspected element.",
          "A match returns immediately; an empty list inspects none.",
        ],
        workedStep:
          first === -1
            ? `The scan checks ${length} elements without a match.`
            : `The scan checks indices 0 through ${first}.`,
      };
    },
  ),
  family(
    "binary-next-interval",
    "binary-invariants",
    "searching",
    "application",
    (r) => {
      const length = r.int(3, 8);
      const base = r.int(0, 12);
      const values = Array.from({ length }, (_, i) => base + i * 2);
      const mid = Math.floor((length - 1) / 2);
      const mode = r.int(0, 2);
      if (mode === 0 && r.int(0, 1) === 1) values[mid + 1] = values[mid];
      const target = values[mid] + (mode === 0 ? 0 : mode === 1 ? 1 : -1);
      const correct =
        mode === 0
          ? `Return index ${mid}`
          : mode === 1
            ? `Keep [${mid + 1}, ${length - 1}]`
            : `Keep [0, ${mid - 1}]`;
      return {
        prompt: "What is the justified next action for inclusive bounds?",
        context: `values = ${shown(values)}  # ascending\ntarget = ${target}\nlow = 0; high = ${length - 1}; mid = ${mid}`,
        choices:
          mode === 0
            ? [
                right(correct),
                wrong(
                  `Keep [0, ${mid - 1}]`,
                  "Equality already found a valid midpoint; discarding it loses the answer.",
                ),
                wrong(
                  `Keep [${mid + 1}, ${length - 1}]`,
                  "Equality returns immediately under this first-midpoint contract.",
                ),
              ]
            : mode === 1
              ? [
                  right(correct),
                  wrong(
                    `Keep [${mid}, ${length - 1}]`,
                    "The midpoint was rejected and must be excluded to guarantee progress.",
                  ),
                  wrong(
                    `Keep [0, ${mid - 1}]`,
                    "The target is larger than the midpoint value, so the left side is ruled out.",
                  ),
                ]
              : [
                  right(correct),
                  wrong(
                    `Keep [0, ${mid}]`,
                    "The rejected midpoint must be excluded; retaining it can prevent progress.",
                  ),
                  wrong(
                    `Keep [${mid + 1}, ${length - 1}]`,
                    "The target is smaller than the midpoint value, so the right side is ruled out.",
                  ),
                ],
        explanation:
          mode === 0
            ? `values[${mid}] equals ${target}; return ${mid}.`
            : `values[${mid}] is ${values[mid]}, ${mode === 1 ? "less" : "greater"} than ${target}. Sorted order rules out the midpoint and the ${mode === 1 ? "left" : "right"} side, leaving ${correct.slice(5)}.`,
        hints: [
          "First compare the midpoint value with the target.",
          "Sorted order justifies excluding the rejected midpoint and one side.",
        ],
        workedStep: `The midpoint value is ${values[mid]}; ${values[mid] === target ? "it matches" : values[mid] < target ? "the target can only be to its right" : "the target can only be to its left"}.`,
      };
    },
  ),
  family(
    "binary-progress-repair",
    "binary-invariants",
    "searching",
    "application",
    (r) => {
      const length = r.int(3, 8);
      const base = r.int(0, 12);
      const values = Array.from({ length }, (_, i) => base + i * 2);
      const mid = Math.floor((length - 1) / 2);
      const tooSmall = r.int(0, 1) === 1;
      const target = values[mid] + (tooSmall ? 1 : -1);
      const fix = tooSmall ? "low = mid + 1" : "high = mid - 1";
      return {
        prompt: "Which replacement guarantees a smaller valid search interval?",
        context: `values = ${shown(values)}  # ascending\ntarget = ${target}; low = 0; high = ${length - 1}; mid = ${mid}\n# Buggy update after values[mid] != target: ${tooSmall ? "low = mid" : "high = mid"}`,
        choices: tooSmall
          ? [
              right(fix),
              wrong(
                "low = mid",
                "This keeps the rejected midpoint and can loop forever on one candidate.",
              ),
              wrong(
                "high = mid - 1",
                "This discards the side that could contain a larger target.",
              ),
            ]
          : [
              right(fix),
              wrong(
                "high = mid",
                "This keeps the rejected midpoint and can loop forever on one candidate.",
              ),
              wrong(
                "low = mid + 1",
                "This discards the side that could contain a smaller target.",
              ),
            ],
        explanation: `${values[mid]} is ${tooSmall ? "less" : "greater"} than ${target}; ${fix} excludes the known mismatch and preserves only plausible candidates.`,
        hints: [
          "The midpoint has already failed equality.",
          "Move the relevant bound past mid, not onto mid.",
        ],
        workedStep: `Because ${values[mid]} ${tooSmall ? "<" : ">"} ${target}, exclude index ${mid} and the ${tooSmall ? "left" : "right"} side.`,
      };
    },
  ),
  family(
    "sorted-input-check",
    "sorted-precondition",
    "searching",
    "application",
    (r) => {
      const length = r.int(3, 8);
      const base = r.int(0, 12);
      const values = Array.from({ length }, (_, i) => base + 2 * i);
      const mode = r.int(0, 2);
      if (mode === 1) [values[1], values[2]] = [values[2], values[1]];
      if (mode === 2) values[1] = values[0];
      const sorted = mode !== 1;
      return {
        prompt:
          "Can ascending binary search safely discard half after comparing a midpoint?",
        context: `values = ${shown(values)}\n# Indexed numeric input; duplicates are allowed.`,
        choices: [
          sorted
            ? right("Yes, the values are in ascending order")
            : wrong(
                "Yes, the values are in ascending order",
                "A reversed neighboring pair breaks ascending order, so midpoint elimination is unjustified.",
              ),
          sorted
            ? wrong(
                "No, the order is broken",
                "Equal neighbors are allowed in ascending sorted input; check whether any value decreases.",
              )
            : right("No, the order is broken"),
          wrong(
            "Only if every value is unique",
            "Uniqueness is not required; sorted duplicates can be searched by midpoint.",
          ),
        ],
        explanation: sorted
          ? "Every next value is at least the previous one, so ascending order supports midpoint elimination. Duplicates are allowed."
          : "One value decreases from its predecessor, so binary search could discard a half containing the target.",
        hints: [
          "Compare each neighboring pair from left to right.",
          "Equal neighbors are fine; a decrease breaks ascending order.",
        ],
        workedStep: sorted
          ? "No neighboring pair decreases."
          : `The pair ${values[1]}, ${values[2]} decreases, breaking the precondition.`,
      };
    },
  ),
];

export const adaptiveFamilyById = Object.fromEntries(
  adaptiveFamilies.map((item) => [item.id, item]),
) as Record<string, AdaptiveFamily>;
function randomFor(
  id: string,
  revision: number,
  seed: number,
): Random & { shuffle: <T>(items: T[]) => T[] } {
  let state = (seed ^ (revision * 0x9e3779b9)) >>> 0;
  for (const char of id)
    state = Math.imul(state ^ char.charCodeAt(0), 16777619) >>> 0;
  if (state === 0) state = 1;
  const next = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return state >>> 0;
  };
  const int = (min: number, max: number) => min + (next() % (max - min + 1));
  return {
    int,
    pick: <T>(items: readonly T[]) => items[int(0, items.length - 1)],
    shuffle: <T>(items: T[]) => {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = int(0, i);
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
  };
}

/** Reproducible, bounded instance generation. Invalid input never reaches an author template. */
export function generateAdaptiveInstance(
  familyId: string,
  revision: number,
  seed: number,
): AdaptiveInstance | null {
  const item = adaptiveFamilyById[familyId];
  if (
    !item ||
    item.revision !== revision ||
    !Number.isSafeInteger(seed) ||
    seed < 0 ||
    seed > 0x7fffffff
  )
    return null;
  const random = randomFor(familyId, revision, seed);
  const draft = item.generate(random);
  const choices = random.shuffle(draft.choices);
  const correctIndex = choices.findIndex((choice) => choice.correct);
  if (
    choices.length !== 3 ||
    choices.filter((choice) => choice.correct).length !== 1 ||
    new Set(choices.map((choice) => choice.text)).size !== 3 ||
    choices.some(
      (choice) =>
        !choice.text.trim() ||
        (!choice.correct && !choice.misconception?.trim()),
    )
  )
    throw new Error(`Invalid authored adaptive family ${familyId}`);
  return {
    id: `adaptive-${familyId}:r${revision}:s${seed}`,
    familyId,
    revision,
    seed,
    skillId: item.skillId,
    topicId: item.topicId,
    difficulty: item.difficulty,
    reviewHref: item.reviewHref,
    prompt: draft.prompt,
    context: draft.context,
    options: choices.map(({ text, misconception }) => ({
      text,
      misconception,
    })),
    correctIndex,
    explanation: draft.explanation,
    hints: draft.hints,
    workedStep: draft.workedStep,
  };
}

/** Evaluates a generated multiple-choice instance; malformed answers are ignored. */
export function evaluateAdaptiveAnswer(
  instance: AdaptiveInstance,
  answer: number,
) {
  if (!Number.isSafeInteger(answer) || answer < 0 || answer >= 3) return null;
  const canonical = generateAdaptiveInstance(
    instance.familyId,
    instance.revision,
    instance.seed,
  );
  if (
    !canonical ||
    canonical.id !== instance.id ||
    JSON.stringify(canonical.options) !== JSON.stringify(instance.options)
  )
    return null;
  return {
    correct: answer === canonical.correctIndex,
    chosen: canonical.options[answer].text,
    correctAnswer: canonical.options[canonical.correctIndex].text,
    misconception: canonical.options[answer].misconception,
  };
}
