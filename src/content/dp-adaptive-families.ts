import type { AdaptiveFamily } from "./adaptive-families";
type R = Parameters<AdaptiveFamily["generate"]>[0];
type Draft = ReturnType<AdaptiveFamily["generate"]>;
type Choice = Draft["choices"][number];
const good = (text: string): Choice => ({ text, correct: true });
const bad = (text: string, misconception: string): Choice => ({
  text,
  misconception,
});
const f = (
  id: string,
  skillId: string,
  difficulty: "foundation" | "application",
  generate: (r: R) => Draft,
): AdaptiveFamily => ({
  id: `dp-${id}`,
  skillId,
  difficulty,
  revision: 1,
  topicId: "dynamic-programming",
  reviewHref: "/lessons/dynamic-programming",
  generate,
});
const d = (
  prompt: string,
  context: string,
  choices: [Choice, Choice, Choice],
  explanation: string,
  hint: string,
): Draft => ({
  prompt,
  context,
  choices,
  explanation,
  hints: [hint, explanation],
  workedStep: explanation,
});
const ways = (n: number): number => {
  let a = 1,
    b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return n === 0 ? 1 : b;
};
export const dpAdaptiveFamilies: AdaptiveFamily[] = [
  f("overlap-branches", "dp-overlapping-subproblems", "foundation", (r) => {
    const n = r.int(5, 30);
    return d(
      "Which state is recomputed in this naive call tree?",
      `ways(${n}) calls ways(${n - 1}) and ways(${n - 2}); ways(${n - 1}) also calls ways(${n - 2}).`,
      [
        good(`ways(${n - 2})`),
        bad(
          `ways(${n})`,
          "The root is invoked once; look for a child reached by two branches.",
        ),
        bad(
          `ways(${n + 1})`,
          "The recurrence only moves toward smaller arguments.",
        ),
      ],
      `Both branches request ways(${n - 2}), so caching that state avoids repeated work.`,
      "Find a state reachable by two call paths.",
    );
  }),
  f("overlap-benefit", "dp-overlapping-subproblems", "application", (r) => {
    const n = r.int(7, 30),
      repeat = r.int(2, 8);
    return d(
      "When does caching help this state?",
      `A recursive task asks for state S(${n}) ${repeat} times, and each computation has the same result.`,
      [
        good(`Compute S(${n}) once and reuse it ${repeat - 1} times`),
        bad(
          `Compute S(${n}) ${repeat} times`,
          "This repeats the expensive work despite identical states.",
        ),
        bad(
          "Replace every base case with zero",
          "Caching does not change the recurrence or base cases.",
        ),
      ],
      `The same state S(${n}) is reusable, so one miss and ${repeat - 1} hits avoid redundant computation.`,
      "Count distinct states separately from calls.",
    );
  }),
  f("staircase-base", "dp-state-recurrence", "foundation", (r) => {
    const n = r.int(2, 40);
    return d(
      "Which base convention supports this staircase recurrence?",
      `To compute ways(${n}), use ways(k)=ways(k−1)+ways(k−2) for k≥2.`,
      [
        good("ways(0)=1 and ways(1)=1"),
        bad(
          "ways(0)=0 and ways(1)=1",
          "The empty sequence is one valid arrangement; zero would undercount.",
        ),
        bad(
          "ways(0)=1 and ways(1)=0",
          "One step has one arrangement: take one step.",
        ),
      ],
      "There is one empty arrangement and one one-step arrangement, so both base values equal one.",
      "Count arrangements for exactly zero and one steps.",
    );
  }),
  f("staircase-transition", "dp-state-recurrence", "application", (r) => {
    const n = r.int(3, 35),
      a = ways(n - 1),
      b = ways(n - 2);
    return d(
      "What value fills the next staircase state?",
      `ways(${n - 1})=${a} and ways(${n - 2})=${b}; moves are 1 or 2 steps.`,
      [
        good(`${a + b}`),
        bad(`${a}`, "The two-step-first arrangements also contribute."),
        bad(
          `${a + b + 1}`,
          "The two branches already partition all arrangements; do not add an extra one.",
        ),
      ],
      `ways(${n})=${a}+${b}=${a + b} by combining disjoint first-move choices.`,
      "Add both smaller state counts.",
    );
  }),
  f("memo-hit", "dp-memoization", "foundation", (r) => {
    const n = r.int(3, 30),
      v = r.int(2, 50);
    return d(
      "What does a memoized call do on a hit?",
      `cache[${n}]=${v}; ways(${n}) is called again.`,
      [
        good(`Return ${v} without descending`),
        bad(
          `Recurse again then return ${v}`,
          "A cache hit should avoid recomputing its dependencies.",
        ),
        bad("Return 0", "The stored answer is the result for this state."),
      ],
      `The cache already holds the computed result ${v}; return it immediately.`,
      "A hit ends the call's work.",
    );
  }),
  f("memo-distinct", "dp-memoization", "application", (r) => {
    const n = r.int(5, 40);
    return d(
      "How many distinct staircase states can a cache compute?",
      `ways(${n}) may ask for every integer argument 0 through ${n}.`,
      [
        good(`${n + 1} states`),
        bad(`${n} states`, "Include state zero as well as positive arguments."),
        bad(
          `${2 * n + 1} states`,
          "Count unique arguments, not calls in the recursion tree.",
        ),
      ],
      `Arguments 0 through ${n} inclusive give ${n + 1} distinct states, each computed once.`,
      "Count the inclusive integer range.",
    );
  }),
  f("tabulation-next", "dp-tabulation-order", "foundation", (r) => {
    const n = r.int(3, 35),
      a = ways(n - 1),
      b = ways(n - 2);
    return d(
      "Which dependency pair is ready for this cell?",
      `Fill table[${n}] under the staircase recurrence; earlier cells are already filled.`,
      [
        good(`table[${n - 1}] and table[${n - 2}]`),
        bad(
          `table[${n + 1}] and table[${n - 1}]`,
          "A later cell has not been computed in increasing order.",
        ),
        bad(
          `table[${n}] and table[${n - 1}]`,
          "The current cell cannot depend on its own unfinished value.",
        ),
      ],
      `table[${n}] reads the two earlier states, whose values are ${a} and ${b}.`,
      "Use the recurrence's smaller arguments.",
    );
  }),
  f("tabulation-value", "dp-tabulation-order", "application", (r) => {
    const n = r.int(3, 35),
      a = ways(n - 1),
      b = ways(n - 2);
    return d(
      "What should the next table cell contain?",
      `table[${n - 2}]=${b}; table[${n - 1}]=${a}; fill table[${n}].`,
      [
        good(`${a + b}`),
        bad(`${a}`, "This omits the two-step predecessor."),
        bad(
          `${a + b + 1}`,
          "The base arrangement was already included in earlier cells.",
        ),
      ],
      `Fill left to right: table[${n}]=${a}+${b}=${a + b}.`,
      "Both dependencies are already solved.",
    );
  }),
  f("coin-unreachable", "dp-coin-change", "foundation", (r) => {
    const c = r.int(2, 35),
      target = 2 * c + 1;
    return d(
      "How should this amount be represented?",
      `Only denomination ${2 * c} is available; target is ${target}.`,
      [
        good("Unreachable (None)"),
        bad(
          "0 coins",
          "Zero is the valid count for amount zero, not this positive amount.",
        ),
        bad("1 coin", "One coin cannot equal the target amount."),
      ],
      `No nonnegative number of ${2 * c}-coins sums to ${target}; use a separate unreachable marker.`,
      "Check whether any combination can form the amount.",
    );
  }),
  f("coin-greedy", "dp-coin-change", "application", (r) => {
    const unit = r.int(2, 35),
      coins = [unit, 3 * unit, 4 * unit],
      target = 6 * unit;
    return d(
      "Which combination is optimal?",
      `Unlimited coins ${JSON.stringify(coins)}; target ${target}.`,
      [
        good(`Two ${3 * unit}-coins`),
        bad(
          `One ${4 * unit}-coin and two ${unit}-coins`,
          "This greedy first choice uses three coins, more than the optimal pair.",
        ),
        bad(
          "Zero coins",
          "A positive target needs a positive number of coins.",
        ),
      ],
      `Two ${3 * unit}-coins sum to ${target}, beating the three-coin greedy choice.`,
      "Compare full solutions, not just the largest first coin.",
    );
  }),
  f("knapsack-row", "dp-knapsack-reconstruction", "foundation", (r) => {
    const i = r.int(2, 30),
      w = r.int(1, 10),
      c = w + r.int(0, 12);
    return d(
      "Which cell supplies the include candidate?",
      `Item ${i} has weight ${w}; current capacity ${c}; use a zero-one table.`,
      [
        good(`Previous row ${i - 1}, capacity ${c - w}`),
        bad(
          `Current row ${i}, capacity ${c - w}`,
          "The current row could already include this item, allowing reuse.",
        ),
        bad(
          `Previous row ${i - 1}, capacity ${c}`,
          "That is the exclude candidate, not include.",
        ),
      ],
      `Adding item ${i} leaves capacity ${c - w} and must use the first ${i - 1} items only.`,
      "Move to the previous item row before adding this item.",
    );
  }),
  f("knapsack-tie", "dp-knapsack-reconstruction", "application", (r) => {
    const i = r.int(2, 30),
      c = r.int(2, 15),
      v = r.int(1, 30);
    return d(
      "Which decision follows the documented tie rule?",
      `At item ${i}, capacity ${c}, include and exclude both yield value ${v}.`,
      [
        good(`Exclude item ${i}; keep the earlier selection`),
        bad(
          `Include item ${i} twice`,
          "A zero-one item cannot be reused, and the tie policy excludes it.",
        ),
        bad(
          "Report unreachable",
          "Zero-one knapsack always has the empty selection as a feasible option.",
        ),
      ],
      `Equal candidates keep the previous-row answer, so backtracking excludes later item ${i}.`,
      "A tie is not a strict improvement.",
    );
  }),
];
