import type { Lesson } from "./types";
import { dpCodingExercises } from "./dp-coding-exercises";

export const dpLesson: Lesson = {
  topicId: "dynamic-programming",
  minutes: 85,
  objectives: [
    "Recognize overlapping subproblems and derive a state, base cases, recurrence, and dependency order.",
    "Compare naive recursion, memoization, and tabulation using measured calls and space costs.",
    "Solve minimum coin change and reconstruct a valid optimal combination.",
    "Build and backtrack a zero-one knapsack table without reusing items.",
  ],
  introduction: [
    "Dynamic programming (DP) stores answers to smaller questions so a larger question can reuse them. Start by stating exactly what one answer means. Then identify base cases and which smaller answers it depends on. A template cannot substitute for that reasoning.",
    "This lesson builds on recursion, arrays, and Big O. Python dictionaries hold memoized answers here; understanding their internal hash-table implementation is not required.",
  ],
  concept: {
    title: "Recognize and define the subproblem",
    paragraphs: [
      "A problem has overlapping subproblems when different branches ask the same smaller question. Ordinary recursion may solve it again and again. DP helps when those answers are reusable and the state captures all information needed for future decisions. When calls do not overlap, or the input is tiny, caching may add complexity without benefit.",
      "For a staircase of n steps, take either one or two steps first. Define ways(n) as the number of arrangements that reach exactly n. The empty staircase has one arrangement: do nothing. Thus ways(0)=1, ways(1)=1, and ways(n)=ways(n−1)+ways(n−2) for n≥2. The two choices partition all arrangements, so the recurrence counts each once.",
      "Finding an optimal value and producing an optimal solution are separate tasks. A table entry can tell us that an amount needs two coins or that a knapsack is worth seven; reconstruction must remember or retrace the choices that produced it.",
    ],
  },
  demonstration: {
    kind: "dynamic-programming",
    caption:
      "Compare measured recursion and memoization calls, predict table entries, inspect coin decisions and a two-dimensional knapsack, then reconstruct choices.",
  },
  sections: [
    {
      title: "Top-down memoization",
      paragraphs: [
        "Write a function for one state and its base cases. Before recursive work, check whether that state has already been cached. On a miss, solve its dependencies, store the result, and return it. On a hit, return immediately. For staircase n, there are n+1 distinct states, so memoization takes O(n) time and O(n) cache plus recursion-stack space. Naive recursion branches repeatedly and takes exponential time.",
        "Count function invocations separately from distinct computed states: cache hits are invocations, but do not recompute their descendants. The player measures these counts from instrumented calls, rather than using a formula for its display.",
      ],
    },
    {
      title: "Bottom-up tabulation",
      paragraphs: [
        "Choose one cell for every state 0 through n. Set table[0]=1 and, if present, table[1]=1. Fill increasing indices because each cell depends on the two earlier cells. Read table[n]. Tabulation takes O(n) time and O(n) table space, without a recursive stack.",
        "If only the final staircase count is needed, two running values can replace the table for O(1) auxiliary space. Retain the table when you need all intermediate states or a reconstruction parent record. The valid fill order comes from the recurrence dependencies, not from a memorized loop pattern.",
      ],
    },
    {
      title: "Minimum coin change: an unbounded choice",
      paragraphs: [
        "For positive denominations and target T, let best[a] be the fewest coins for amount a, or unreachable if no combination exists. best[0]=0. For a>0, inspect each coin c≤a whose best[a−c] is reachable; candidate=best[a−c]+1. Take the minimum. A coin may be used again because best[a−c] can already contain that denomination. Duplicate denominations add no new choice, so normalize them.",
        "Zero coins for amount zero is a valid answer; unreachable is a different state. For [1,3,4] and target 6, greedy takes 4+1+1, three coins, while the DP finds 3+3, two coins. Save the chosen coin on a strict improvement, then repeatedly subtract it to reconstruct an optimal combination. This takes O(TK) time and O(T) space for K denominations. Equal counts keep the smaller denomination in the player.",
      ],
    },
    {
      title: "Zero-one knapsack: a two-dimensional decision",
      paragraphs: [
        "Each item has a unique identity, positive integer weight, and nonnegative value. Define table[i][c] as the maximum value using only the first i items within capacity c. The base row i=0 is zero for every c. For item i, compare excluding it, table[i−1][c], with including it, value[i]+table[i−1][c−weight[i]], when it fits. Both candidates read the previous row, so the same item cannot be used twice.",
        "Fill item rows in order and capacities within each row. Backtrack from table[n][C]: if the cell equals the previous row, exclude the later item on a tie; otherwise record its identity, reduce capacity, and move to the previous row. Reverse recorded identities to restore input order. Equal weights and values still belong to distinct items.",
        "A full table costs O(nC) time and O(nC) space. Value-only computation can use O(C) space with descending capacity updates, but reconstruction then needs additional choice information or a retained table. O(nC) is pseudo-polynomial: C may be exponentially large in the number of bits used to encode it.",
      ],
    },
  ],
  workedExample: {
    title: "Derive before filling",
    introduction:
      "Staircase n=4, coin target 6 with [1,3,4], and items A(2,3), B(3,4), C(4,5) with capacity 5.",
    steps: [
      "State ways(k) counts arrangements for exactly k steps. Base states are 1 and 1; later cells become 2, 3, 5. Naive calls repeat ways(2), while memoization computes each state once.",
      "State best[a] is minimum coin count for a. At amount 6, coin 3 uses best[3]=1 to offer 2. Coin 4 uses best[2]=2 to offer 3. Save coin 3 and backtrack to [3,3].",
      "State table[i][c] uses the first i items. At capacity 5, A+B yields value 7, beating C alone at 5. Backtracking selects A and B, each once.",
    ],
  },
  code: {
    language: "Python 3",
    title: "Derive a recurrence, then cache it",
    source: `def staircase(n):
    if not isinstance(n, int) or isinstance(n, bool) or n < 0:
        raise ValueError("n must be nonnegative")
    cache = {}
    def ways(k):
        if k in cache:
            return cache[k]
        if k <= 1:
            result = 1
        else:
            result = ways(k - 1) + ways(k - 2)
        cache[k] = result
        return result
    return ways(n)

print(staircase(4))  # 5`,
    explanation:
      "The cache key is the complete state k. Both base cases return one; every distinct state is computed once. The six Code Labs extend this reasoning to tables, coin reconstruction, and item identities.",
  },
  misconceptions: [
    {
      belief: "ways(0) must be zero because there are no steps.",
      correction:
        "There is one empty arrangement: take no moves. The count is one.",
    },
    {
      belief:
        "Memoization means writing values into a dictionary but still recursing on a hit.",
      correction: "A cache hit returns the stored result immediately.",
    },
    {
      belief: "Any table order works.",
      correction:
        "Each dependency must be available before its dependent cell is computed.",
    },
    {
      belief: "Greedy always minimizes the coin count.",
      correction:
        "For [1,3,4] and target 6, greedy uses three coins; two 3-coins suffice.",
    },
    {
      belief: "Unreachable means zero coins.",
      correction:
        "Zero is the valid count for target zero; unreachable needs a distinct marker.",
    },
    {
      belief: "The knapsack include case can use the current row.",
      correction:
        "Current-row reuse can select the same item more than once. Use the previous row for zero-one choices.",
    },
  ],
  takeaways: [
    "Name the state, base cases, recurrence, dependencies, and final answer before writing loops.",
    "Memoization avoids recomputing overlapping recursive states; tabulation fills them in dependency order.",
    "A minimum value does not itself provide a concrete solution: save or retrace decisions.",
    "Coin change permits denomination reuse; zero-one knapsack permits each item identity once.",
  ],
  questions: [
    {
      id: "dp-q1",
      prompt: "Under this lesson’s staircase convention, what is ways(0)?",
      options: [
        "1, the empty arrangement",
        "0, because there are no moves",
        "2, because two moves are allowed",
      ],
      correctIndex: 0,
      explanation:
        "Doing nothing is one valid arrangement, giving the recurrence a meaningful base.",
    },
    {
      id: "dp-q2",
      prompt: "For coins [1,3,4] and target 6, what is the minimum count?",
      options: [
        "2 via 3+3",
        "3 via 4+1+1",
        "0 because the target is unreachable",
      ],
      correctIndex: 0,
      explanation:
        "The subproblem best[3]=1 gives a two-coin solution using another 3.",
    },
    {
      id: "dp-q3",
      prompt:
        "Which table entry prevents reusing the current zero-one knapsack item?",
      options: [
        "The previous item row for the include candidate",
        "The current row for the include candidate",
        "The base row after every item",
      ],
      correctIndex: 0,
      explanation:
        "The previous row includes only earlier items, so the current one appears at most once.",
    },
  ],
  relatedTopicIds: ["recursion", "arrays-strings", "big-o-notation"],
  codingExercises: dpCodingExercises,
  nextStep:
    "Derive a new state and recurrence yourself, then solve the six Python labs and review missed ideas in adaptive practice.",
};
