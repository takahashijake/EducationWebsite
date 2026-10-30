import { describe, expect, it } from "vitest";
import {
  generateDpTrace,
  validateDpInput,
  type DpInput,
} from "@/lib/dynamic-programming-steps";
import { dpCodingExercises } from "@/content/dp-coding-exercises";
import { dpSolutions } from "@/content/dp-solutions";
import { spawnSync } from "node:child_process";

const stairs = (n: number): number =>
  n <= 1 ? 1 : stairs(n - 1) + stairs(n - 2);
const coinOracle = (coins: number[], target: number): number | null => {
  const visited = new Set([0]),
    queue: [number, number][] = [[0, 0]];
  for (let i = 0; i < queue.length; i++) {
    const [sum, count] = queue[i];
    if (sum === target) return count;
    for (const coin of coins) {
      const next = sum + coin;
      if (next <= target && !visited.has(next)) {
        visited.add(next);
        queue.push([next, count + 1]);
      }
    }
  }
  return null;
};
const knapOracle = (
  items: { id: string; weight: number; value: number }[],
  capacity: number,
): number => {
  let best = 0;
  for (let bits = 0; bits < 1 << items.length; bits++) {
    let weight = 0,
      value = 0;
    items.forEach((item, i) => {
      if (bits & (1 << i)) {
        weight += item.weight;
        value += item.value;
      }
    });
    if (weight <= capacity) best = Math.max(best, value);
  }
  return best;
};
const random = () => {
  let seed = 71027;
  return (max: number) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed % max;
  };
};
describe("pure dynamic programming traces", () => {
  it("matches staircase bases and instrumented call counts", () => {
    for (let n = 0; n <= 15; n++) {
      const trace = generateDpTrace({ mode: "staircase", n });
      expect(trace.answer).toBe(stairs(n));
      expect(trace.metrics?.memoUnique).toBe(n <= 1 ? 1 : n + 1);
      expect(trace.metrics?.memoCalls).toBe(
        trace.metrics!.memoUnique + trace.metrics!.cacheHits,
      );
      expect(trace.steps.at(-1)?.answer).toBe(trace.answer);
    }
    expect(generateDpTrace({ mode: "staircase", n: 4 }).metrics).toMatchObject({
      naiveCalls: 9,
      naiveUnique: 5,
    });
  });
  it("matches an independent breadth-first coin oracle and reconstructs optimum", () => {
    const r = random();
    for (let i = 0; i < 200; i++) {
      const coins = Array.from({ length: 1 + r(6) }, () => 1 + r(10)),
        target = r(21);
      const trace = generateDpTrace({ mode: "coin", coins, target });
      const optimum = coinOracle(coins, target);
      expect(trace.answer).toBe(optimum);
      if (optimum === null) expect(trace.solution).toBeNull();
      else {
        const solution = trace.solution!.map(Number);
        expect(solution).toHaveLength(optimum);
        expect(solution.reduce((a, b) => a + b, 0)).toBe(target);
        expect(solution.every((c) => coins.includes(c))).toBe(true);
      }
    }
    expect(
      generateDpTrace({ mode: "coin", coins: [4, 1, 3], target: 6 }).solution,
    ).toEqual(["3", "3"]);
    expect(
      generateDpTrace({ mode: "coin", coins: [6, 4], target: 7 }).answer,
    ).toBeNull();
    expect(
      generateDpTrace({ mode: "coin", coins: [6, 4], target: 0 }).solution,
    ).toEqual([]);
    const ties = generateDpTrace({ mode: "coin", coins: [2, 4], target: 6 });
    expect(
      ties.steps.some(
        (step) =>
          step.phase === "candidate" &&
          step.state === "amount 6" &&
          step.choice === "4" &&
          step.narration.includes("ties the current") &&
          step.improved === false,
      ),
    ).toBe(true);
  });
  it("matches brute-force subsets and preserves unique item identities", () => {
    const r = random();
    for (let k = 0; k < 160; k++) {
      const items = Array.from({ length: r(7) }, (_, i) => ({
          id: String.fromCharCode(65 + i),
          weight: 1 + r(8),
          value: r(20),
        })),
        capacity = r(16);
      const trace = generateDpTrace({ mode: "knapsack", items, capacity });
      expect(trace.answer).toBe(knapOracle(items, capacity));
      const selection = trace.solution!;
      expect(new Set(selection).size).toBe(selection.length);
      expect(
        selection.reduce(
          (sum, id) => sum + items.find((item) => item.id === id)!.weight,
          0,
        ),
      ).toBeLessThanOrEqual(capacity);
      expect(
        selection.reduce(
          (sum, id) => sum + items.find((item) => item.id === id)!.value,
          0,
        ),
      ).toBe(trace.answer);
    }
    expect(
      generateDpTrace({
        mode: "knapsack",
        items: [
          { id: "A", weight: 2, value: 3 },
          { id: "B", weight: 2, value: 3 },
        ],
        capacity: 2,
      }).solution,
    ).toEqual(["A"]);
  });
  it("rejects malformed input, freezes snapshots, and bounds traces", () => {
    for (const input of [
      { mode: "staircase", n: -1 },
      { mode: "staircase", n: 16 },
      { mode: "staircase", n: 1.5 },
      { mode: "coin", coins: [], target: 0 },
      { mode: "coin", coins: [0], target: 5 },
      { mode: "coin", coins: [1, 2, 3, 4, 5, 6, 7], target: 5 },
      { mode: "coin", coins: [1], target: 21 },
      { mode: "knapsack", capacity: 16, items: [] },
      {
        mode: "knapsack",
        capacity: 2,
        items: [{ id: "A", weight: 0, value: 2 }],
      },
      {
        mode: "knapsack",
        capacity: 2,
        items: [
          { id: "A", weight: 1, value: 2 },
          { id: "A", weight: 2, value: 4 },
        ],
      },
    ] as DpInput[])
      expect(() => validateDpInput(input)).toThrow();
    const input: DpInput = { mode: "coin", coins: [4, 1, 3, 3], target: 6 };
    const trace = generateDpTrace(input);
    expect(trace.input).toEqual({ mode: "coin", coins: [1, 3, 4], target: 6 });
    expect(input.coins).toEqual([4, 1, 3, 3]);
    expect(Object.isFrozen(trace.steps)).toBe(true);
    expect(Object.isFrozen(trace.steps[0].table[0])).toBe(true);
    expect(trace.steps.length).toBeLessThanOrEqual(450);
    expect(generateDpTrace(input)).toEqual(trace);
    for (const bounded of [
      { mode: "staircase", n: 15 },
      { mode: "coin", target: 20, coins: [1, 2, 3, 4, 5, 6] },
      {
        mode: "knapsack",
        capacity: 15,
        items: Array.from({ length: 6 }, (_, i) => ({
          id: String.fromCharCode(65 + i),
          weight: i + 1,
          value: 10 + i,
        })),
      },
    ] as DpInput[])
      expect(generateDpTrace(bounded).steps.length).toBeLessThanOrEqual(450);
  });
});
it("executes all six Python references and confirms defective starters fail public checks", () => {
  expect(dpCodingExercises).toHaveLength(6);
  const regressions: Record<string, string> = {
    "dp-repeated": "assert staircase_naive(5) == (8,15,6)\n",
    "dp-memo": "assert staircase_memo(6) == (13,11,4)\n",
    "dp-table": "assert staircase_table(2) == [1,1,2]\n",
    "dp-coin-count":
      "assert min_coin_count([4,4,6],8) == 2 and min_coin_count([5],0) == 0\n",
    "dp-coin-solution":
      "assert min_coin_solution([2,4],6) == [2,4]\nassert sum(min_coin_solution([1,3,4],6)) == 6\n",
    "dp-knapsack":
      "assert knapsack([],5) == (0,[]) and knapsack([('A',2,3),('B',3,4),('C',4,5)],5) == (7,['A','B'])\n",
  };
  for (const lab of dpCodingExercises) {
    const reference = dpSolutions[lab.id];
    expect(reference).toBeTruthy();
    const checks = lab.tests.map((test) => test.code).join("\n");
    const run = (source: string, trusted = "") =>
      spawnSync("python3", ["-I", "-"], {
        input: `${source}\n${checks}\n${trusted}`,
        encoding: "utf8",
        timeout: 3000,
      });
    const valid = run(reference, regressions[lab.id]);
    expect(valid.status, `${lab.id}: ${valid.stderr}`).toBe(0);
    const defective = run(lab.starter);
    expect(defective.status, lab.id).not.toBe(0);
  }
});
