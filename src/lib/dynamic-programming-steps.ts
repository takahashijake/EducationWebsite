/** Deterministic bounded traces. In coin mode, a finalized null cell is unreachable; earlier null cells are unfilled. */
export type DpItem = Readonly<{ id: string; weight: number; value: number }>;
export type DpInput =
  | Readonly<{ mode: "staircase"; n: number }>
  | Readonly<{ mode: "coin"; target: number; coins: readonly number[] }>
  | Readonly<{ mode: "knapsack"; capacity: number; items: readonly DpItem[] }>;
export type DpPhase =
  | "initial"
  | "memo-miss"
  | "memo-hit"
  | "memo-store"
  | "dependency"
  | "candidate"
  | "update"
  | "row"
  | "reconstruct"
  | "complete";
export type DpCall = Readonly<{
  id: number;
  parent: number | null;
  n: number;
  repeated: boolean;
}>;
export type DpMetrics = Readonly<{
  naiveCalls: number | null;
  naiveUnique: number | null;
  memoCalls: number;
  memoUnique: number;
  cacheHits: number;
  naiveTree: readonly DpCall[];
}>;
export type DpStep = Readonly<{
  mode: DpInput["mode"];
  phase: DpPhase;
  state: string;
  row: number | null;
  column: number | null;
  dependencies: readonly string[];
  candidate: number | null;
  choice: string | null;
  improved: boolean | null;
  table: readonly (readonly (number | null)[])[];
  memo: readonly (readonly [number, number])[];
  selected: readonly string[];
  narration: string;
  answer: number | null;
  solution: readonly string[] | null;
}>;
export type DpTrace = Readonly<{
  input: DpInput;
  steps: readonly DpStep[];
  answer: number | null;
  solution: readonly string[] | null;
  metrics: DpMetrics | null;
}>;
export const dpScenarios: ReadonlyArray<{
  id: string;
  label: string;
  input: DpInput;
  purpose: string;
}> = [
  {
    id: "stairs-four",
    label: "Staircase: repeated calls",
    input: { mode: "staircase", n: 4 },
    purpose: "Compare repeated recursion with cached states.",
  },
  {
    id: "stairs-zero",
    label: "Staircase: empty base case",
    input: { mode: "staircase", n: 0 },
    purpose: "The empty staircase has one do-nothing arrangement.",
  },
  {
    id: "stairs-eight",
    label: "Staircase: larger table",
    input: { mode: "staircase", n: 8 },
    purpose: "Watch cache reuse and bottom-up fill order.",
  },
  {
    id: "coin-greedy",
    label: "Coins: greedy fails",
    input: { mode: "coin", target: 6, coins: [1, 3, 4] },
    purpose: "Two 3-coins beat the greedy 4+1+1 choice.",
  },
  {
    id: "coin-unreachable",
    label: "Coins: unreachable target",
    input: { mode: "coin", target: 7, coins: [4, 6] },
    purpose: "Unreachable is different from zero coins.",
  },
  {
    id: "coin-tie",
    label: "Coins: equal optimum",
    input: { mode: "coin", target: 6, coins: [2, 4] },
    purpose: "A tie keeps the smaller denomination first.",
  },
  {
    id: "knap-choice",
    label: "Knapsack: include or exclude",
    input: {
      mode: "knapsack",
      capacity: 5,
      items: [
        { id: "A", weight: 2, value: 3 },
        { id: "B", weight: 3, value: 4 },
        { id: "C", weight: 4, value: 5 },
      ],
    },
    purpose: "A and B together beat C alone.",
  },
  {
    id: "knap-tie",
    label: "Knapsack: distinct equal items",
    input: {
      mode: "knapsack",
      capacity: 2,
      items: [
        { id: "A", weight: 2, value: 3 },
        { id: "B", weight: 2, value: 3 },
      ],
    },
    purpose: "Equal value excludes the later item.",
  },
];
function integer(value: unknown, min: number, max: number, name: string) {
  if (
    !Number.isSafeInteger(value) ||
    (value as number) < min ||
    (value as number) > max
  )
    throw new Error(`${name} must be an integer from ${min} to ${max}.`);
}
export function validateDpInput(input: DpInput): DpInput {
  if (!input || typeof input !== "object")
    throw new Error("Choose a dynamic-programming problem.");
  if (input.mode === "staircase") {
    integer(input.n, 0, 15, "Staircase target");
    return Object.freeze({ mode: "staircase", n: input.n });
  }
  if (input.mode === "coin") {
    integer(input.target, 0, 20, "Coin target");
    if (
      !Array.isArray(input.coins) ||
      input.coins.length < 1 ||
      input.coins.length > 6
    )
      throw new Error("Use 1–6 denominations.");
    for (const coin of input.coins) integer(coin, 1, 20, "Denomination");
    return Object.freeze({
      mode: "coin",
      target: input.target,
      coins: Object.freeze([...new Set(input.coins)].sort((a, b) => a - b)),
    });
  }
  if (input.mode === "knapsack") {
    integer(input.capacity, 0, 15, "Knapsack capacity");
    if (!Array.isArray(input.items) || input.items.length > 6)
      throw new Error("Use at most six items.");
    const ids = new Set<string>();
    for (const item of input.items) {
      if (
        !item ||
        typeof item.id !== "string" ||
        !/^[A-Za-z][A-Za-z0-9]{0,11}$/.test(item.id) ||
        ids.has(item.id)
      )
        throw new Error(
          "Use distinct item IDs of 1–12 letters or digits, starting with a letter.",
        );
      ids.add(item.id);
      integer(item.weight, 1, 15, "Item weight");
      integer(item.value, 0, 30, "Item value");
    }
    return Object.freeze({
      mode: "knapsack",
      capacity: input.capacity,
      items: Object.freeze(
        input.items.map((item) => Object.freeze({ ...item })),
      ),
    });
  }
  throw new Error("Unknown dynamic-programming mode.");
}
export function generateDpTrace(raw: DpInput): DpTrace {
  const input = validateDpInput(raw),
    steps: DpStep[] = [];
  const table: (number | null)[][] = [];
  const memo = new Map<number, number>();
  let answer: number | null = null,
    solution: string[] | null = null,
    selected: string[] = [];
  let metrics: DpMetrics | null = null;
  const add = (
    phase: DpPhase,
    state: string,
    narration: string,
    opts: Partial<
      Pick<
        DpStep,
        "row" | "column" | "dependencies" | "candidate" | "choice" | "improved"
      >
    > = {},
  ) => {
    if (steps.length >= 450) throw new Error("DP trace exceeds 450 snapshots.");
    steps.push(
      Object.freeze({
        mode: input.mode,
        phase,
        state,
        narration,
        row: opts.row ?? null,
        column: opts.column ?? null,
        dependencies: Object.freeze([...(opts.dependencies ?? [])]),
        candidate: opts.candidate ?? null,
        choice: opts.choice ?? null,
        improved: opts.improved ?? null,
        table: Object.freeze(table.map((row) => Object.freeze([...row]))),
        memo: Object.freeze(
          [...memo.entries()]
            .sort((a, b) => a[0] - b[0])
            .map((pair) => Object.freeze(pair)),
        ),
        selected: Object.freeze([...selected]),
        answer: phase === "complete" ? answer : null,
        solution:
          phase === "complete" && solution
            ? Object.freeze([...solution])
            : null,
      }),
    );
  };
  if (input.mode === "staircase") {
    const calls: DpCall[] = [],
      seen = new Set<number>();
    let naiveCalls = 0;
    const naive = (n: number, parent: number | null): number => {
      const id = ++naiveCalls;
      calls.push(Object.freeze({ id, parent, n, repeated: seen.has(n) }));
      seen.add(n);
      return n <= 1 ? 1 : naive(n - 1, id) + naive(n - 2, id);
    };
    const naiveAnswer = input.n <= 10 ? naive(input.n, null) : null;
    let memoCalls = 0,
      hits = 0;
    table.push(Array(input.n + 1).fill(null));
    add(
      "initial",
      "ways(0)=ways(1)=1",
      "Define ways(n) as the number of 1- or 2-step arrangements; the empty staircase has one do-nothing arrangement.",
    );
    const visit = (n: number): number => {
      memoCalls++;
      if (memo.has(n)) {
        hits++;
        add(
          "memo-hit",
          `ways(${n})`,
          `Cache hit: reuse ways(${n}) = ${memo.get(n)}.`,
          { row: 0, column: n },
        );
        return memo.get(n)!;
      }
      add(
        "memo-miss",
        `ways(${n})`,
        `Cache miss: solve ways(${n}) from its base case or smaller states.`,
        {
          row: 0,
          column: n,
          dependencies: n <= 1 ? [] : [`ways(${n - 1})`, `ways(${n - 2})`],
        },
      );
      const value = n <= 1 ? 1 : visit(n - 1) + visit(n - 2);
      memo.set(n, value);
      add(
        "memo-store",
        `ways(${n})`,
        `Store ways(${n}) = ${value}; later calls reuse it.`,
        { row: 0, column: n, candidate: value },
      );
      return value;
    };
    const memoAnswer = visit(input.n);
    for (let n = 0; n <= input.n; n++) {
      const deps = n <= 1 ? [] : [`ways(${n - 1})`, `ways(${n - 2})`];
      add(
        "dependency",
        `ways(${n})`,
        n <= 1
          ? `Base state ways(${n}) is 1.`
          : `Read ${deps.join(" and ")} before filling ways(${n}).`,
        {
          row: 0,
          column: n,
          dependencies: deps,
          candidate:
            n <= 1 ? 1 : (table[0][n - 1] ?? 0) + (table[0][n - 2] ?? 0),
        },
      );
      table[0][n] =
        n <= 1 ? 1 : (table[0][n - 1] ?? 0) + (table[0][n - 2] ?? 0);
      add("update", `ways(${n})`, `Set ways(${n}) = ${table[0][n]}.`, {
        row: 0,
        column: n,
        candidate: table[0][n],
      });
    }
    answer = table[0][input.n];
    if (
      answer !== memoAnswer ||
      (naiveAnswer !== null && answer !== naiveAnswer)
    )
      throw new Error("Staircase methods disagree.");
    metrics = Object.freeze({
      naiveCalls: naiveAnswer === null ? null : naiveCalls,
      naiveUnique: naiveAnswer === null ? null : seen.size,
      memoCalls,
      memoUnique: memo.size,
      cacheHits: hits,
      naiveTree: Object.freeze(calls),
    });
    add(
      "complete",
      `ways(${input.n})`,
      `Memoization and tabulation agree: ${answer} arrangements.`,
      { row: 0, column: input.n },
    );
  } else if (input.mode === "coin") {
    const coins = [...input.coins],
      target = input.target,
      parent: (number | null)[] = Array(target + 1).fill(null);
    table.push(Array(target + 1).fill(null));
    table[0][0] = 0;
    add(
      "initial",
      "minCoins(0)=0",
      "Zero amount needs zero coins. null means unreachable, not zero.",
      { row: 0, column: 0 },
    );
    for (let amount = 1; amount <= target; amount++) {
      for (const coin of coins) {
        const prior = amount - coin,
          previous = prior >= 0 ? table[0][prior] : null,
          candidate = previous === null ? null : previous + 1,
          current = table[0][amount];
        const comparison =
          candidate === null
            ? ""
            : current === null
              ? " This is the first reachable choice, so it improves the amount."
              : candidate < current
                ? ` This strictly improves the current ${current}-coin choice.`
                : candidate === current
                  ? ` This ties the current ${current}-coin choice; keep the earlier, smaller denomination.`
                  : ` This is worse than the current ${current}-coin choice, so keep it.`;
        add(
          "candidate",
          `amount ${amount}`,
          prior < 0
            ? `Coin ${coin} does not fit amount ${amount}.`
            : previous === null
              ? `Coin ${coin} leaves unreachable amount ${prior}.`
              : `Coin ${coin} offers ${previous}+1=${candidate} coins from amount ${prior}.${comparison}`,
          {
            row: 0,
            column: amount,
            dependencies: prior >= 0 ? [`amount ${prior}`] : [],
            candidate,
            choice: String(coin),
            improved:
              candidate !== null && (current === null || candidate < current),
          },
        );
        if (candidate !== null && (current === null || candidate < current)) {
          table[0][amount] = candidate;
          parent[amount] = coin;
          add(
            "update",
            `amount ${amount}`,
            `Strict improvement: amount ${amount} uses ${candidate} coins, ending with ${coin}. Equal costs keep the earlier, smaller coin.`,
            {
              row: 0,
              column: amount,
              candidate,
              choice: String(coin),
              improved: true,
            },
          );
        }
      }
      add(
        "row",
        `amount ${amount}`,
        table[0][amount] === null
          ? `Amount ${amount} remains unreachable.`
          : `Amount ${amount} is finalized at ${table[0][amount]} coins.`,
        { row: 0, column: amount },
      );
    }
    answer = table[0][target];
    if (answer !== null) {
      const chosen: string[] = [];
      let amount = target;
      while (amount > 0) {
        const coin = parent[amount];
        if (coin === null || coin > amount || chosen.length > target)
          throw new Error("Invalid coin predecessor.");
        chosen.push(String(coin));
        amount -= coin;
        selected = [...chosen];
        add(
          "reconstruct",
          `amount ${amount}`,
          `Choose coin ${coin}; remaining amount ${amount}.`,
          { row: 0, column: amount, choice: String(coin) },
        );
      }
      solution = chosen;
    }
    add(
      "complete",
      `amount ${target}`,
      answer === null
        ? `Amount ${target} is unreachable with these denominations.`
        : `Minimum ${answer} coins: ${solution!.join(" + ") || "empty selection"}.`,
      { row: 0, column: target },
    );
  } else {
    const { items, capacity } = input;
    for (let i = 0; i <= items.length; i++)
      table.push(Array(capacity + 1).fill(null));
    for (let c = 0; c <= capacity; c++) table[0][c] = 0;
    add(
      "initial",
      "row 0",
      "With zero items, every capacity has value 0; zero is a valid optimum.",
    );
    for (let i = 1; i <= items.length; i++) {
      const item = items[i - 1];
      table[i][0] = 0;
      for (let c = 1; c <= capacity; c++) {
        const exclude = table[i - 1][c]!,
          fits = item.weight <= c,
          include = fits ? item.value + table[i - 1][c - item.weight]! : null;
        add(
          "candidate",
          `item ${item.id}, capacity ${c}`,
          fits
            ? `Exclude ${item.id}: ${exclude}. Include it once: ${item.value} + previous row at capacity ${c - item.weight} = ${include}.`
            : `${item.id} weighs ${item.weight}, so it does not fit capacity ${c}; exclude value ${exclude}.`,
          {
            row: i,
            column: c,
            dependencies: fits
              ? [
                  `row ${i - 1}, capacity ${c}`,
                  `row ${i - 1}, capacity ${c - item.weight}`,
                ]
              : [`row ${i - 1}, capacity ${c}`],
            candidate: include,
            choice: item.id,
            improved: include !== null && include > exclude,
          },
        );
        const take = include !== null && include > exclude;
        table[i][c] = take ? include : exclude;
        add(
          "update",
          `item ${item.id}, capacity ${c}`,
          take
            ? `Include ${item.id} for value ${include}. The previous-row dependency prevents reuse.`
            : `Exclude ${item.id} for value ${exclude}${include === exclude ? "; ties exclude the later item" : ""}.`,
          {
            row: i,
            column: c,
            candidate: table[i][c],
            choice: take ? "include" : "exclude",
            improved: take,
          },
        );
      }
      add(
        "row",
        `after item ${item.id}`,
        `Row ${i} is complete; all capacities use only the first ${i} items.`,
        { row: i },
      );
    }
    answer = table[items.length][capacity];
    let c = capacity;
    for (let i = items.length; i > 0; i--) {
      const item = items[i - 1],
        take = table[i][c] !== table[i - 1][c];
      if (take) {
        selected.unshift(item.id);
        c -= item.weight;
      }
      add(
        "reconstruct",
        `item ${item.id}`,
        take
          ? `Select ${item.id}; remaining capacity ${c}.`
          : `Skip ${item.id}; the previous row gives the same optimum.`,
        { row: i, column: c, choice: take ? "include" : "exclude" },
      );
    }
    solution = [...selected];
    add(
      "complete",
      `capacity ${capacity}`,
      `Maximum value ${answer}; selected items ${solution.join(", ") || "none"}.`,
      { row: items.length, column: capacity },
    );
  }
  return Object.freeze({
    input,
    steps: Object.freeze(steps),
    answer,
    solution: solution ? Object.freeze(solution) : null,
    metrics,
  });
}
