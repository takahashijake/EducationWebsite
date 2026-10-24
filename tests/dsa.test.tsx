import { spawnSync } from "node:child_process";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AlgorithmVisualizer } from "@/components/algorithm-visualizer";
import {
  generateAlgorithmSteps,
  moveStep,
  scenarios,
} from "@/lib/algorithm-steps";
import { dsaCodingExercises } from "@/content/dsa-coding-exercises";
import { dsaRetrievalQuestions } from "@/content/dsa-catalog";
import { activities, skills } from "@/content/learning-catalog";
import { diagnose, makeEvidence, recommend } from "@/lib/learning-evidence";
const solutions: Record<string, string> = {
  "arrays-safe-traverse":
    "def copy_values(values):\n    result = []\n    for index in range(len(values)):\n        result.append(values[index])\n    return result",
  "arrays-indexed-sum":
    "def sum_even_indices(values):\n    total = 0\n    for index in range(0, len(values), 2):\n        total += values[index]\n    return total",
  "arrays-empty-first":
    "def first_or_none(values):\n    if not values:\n        return None\n    return values[0]",
  "arrays-repair-boundary":
    "def last_or_none(values):\n    if len(values) == 0:\n        return None\n    return values[len(values) - 1]",
  "search-linear":
    "def linear_search(values, target):\n    for index, value in enumerate(values):\n        if value == target:\n            return index\n    return -1",
  "search-binary":
    "def binary_search(values, target):\n    low, high = 0, len(values) - 1\n    while low <= high:\n        mid = low + (high - low) // 2\n        if values[mid] == target:\n            return mid\n        if values[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1",
  "search-boundary-debug":
    "def find_sorted(values, target):\n    low, high = 0, len(values) - 1\n    while low <= high:\n        mid = low + (high - low) // 2\n        if values[mid] == target:\n            return mid\n        if values[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1",
};
function python(source: string, check: string, timeout = 1000) {
  return spawnSync("python3", ["-I", "-"], {
    input: `${source}\n${check}\n`,
    encoding: "utf8",
    timeout,
  });
}
describe("array algorithm traces", () => {
  it("traverses empty and singleton inputs without comparison claims", () => {
    expect(
      generateAlgorithmSteps("traversal", scenarios.traversal[1]).map(
        (step) => step.inspected,
      ),
    ).toEqual([null, null]);
    expect(
      generateAlgorithmSteps("traversal", scenarios.traversal[2]).map(
        (step) => step.inspected,
      ),
    ).toEqual([null, 0, null]);
  });
  it("visits exact zero-based indices and keeps the input unchanged", () => {
    const scenario = { id: "order", label: "Order", values: [8, 3, 9, 2] };
    const steps = generateAlgorithmSteps("traversal", scenario);
    expect(steps.map((step) => step.inspected)).toEqual([
      null,
      0,
      1,
      2,
      3,
      null,
    ]);
    expect(steps.map((step) => step.comparisons)).toEqual([0, 0, 0, 0, 0, 0]);
    expect(steps.every((step) => step.values.join() === "8,3,9,2")).toBe(true);
    expect(scenario.values).toEqual([8, 3, 9, 2]);
  });
  it("follows inclusive binary intervals and the reference comparison count", () => {
    const found = generateAlgorithmSteps(
      "binary-search",
      scenarios["binary-search"][0],
    );
    expect(
      found
        .filter((step) => step.inspected !== null)
        .map((step) => [step.inspected, step.low, step.high, step.comparisons]),
    ).toEqual([
      [2, 0, 5, 2],
      [4, 3, 5, 4],
      [5, 5, 5, 5],
    ]);
    expect(found.at(-1)?.outcome).toBe("Found at index 5");
    const missing = generateAlgorithmSteps(
      "binary-search",
      scenarios["binary-search"][2],
    );
    expect(
      missing
        .filter((step) => step.inspected !== null)
        .map((step) => step.inspected),
    ).toEqual([2, 3]);
    expect(missing.at(-1)).toMatchObject({
      low: null,
      high: null,
      comparisons: 4,
      outcome: "Not found (-1)",
    });
    const singleton = generateAlgorithmSteps("binary-search", {
      id: "one-miss",
      label: "One miss",
      values: [7],
      target: 8,
    });
    expect(
      singleton
        .filter((step) => step.inspected !== null)
        .map((step) => step.inspected),
    ).toEqual([0]);
    expect(singleton.at(-1)).toMatchObject({
      comparisons: 2,
      outcome: "Not found (-1)",
    });
  });
  for (const algorithm of ["linear", "binary-search"] as const) {
    it(`${algorithm} agrees with Python's search result contract across scenarios`, () => {
      for (const scenario of scenarios[algorithm]) {
        const steps = generateAlgorithmSteps(algorithm, scenario);
        expect(
          steps.every((step) => step.values.join() === scenario.values.join()),
        ).toBe(true);
        expect(
          steps.every(
            (step) =>
              step.highlightedIndices.length ===
              (step.inspected === null ? 0 : 1),
          ),
        ).toBe(true);
        expect(steps[0].values).not.toBe(scenario.values);
        const final = steps.at(-1)!;
        const index = final.outcome?.startsWith("Found at index ")
          ? Number(final.outcome.slice(15))
          : -1;
        if (index >= 0) expect(scenario.values[index]).toBe(scenario.target);
        else expect(scenario.values).not.toContain(scenario.target);
        expect(steps[0].comparisons).toBe(0);
        expect(
          steps.every(
            (step, i) =>
              i === 0 || step.comparisons >= steps[i - 1].comparisons,
          ),
        ).toBe(true);
        expect(final.comparisons).toBe(
          steps
            .filter((step) => step.operation.startsWith("Compare"))
            .reduce(
              (total, step) =>
                total +
                (algorithm === "binary-search" && !step.outcome ? 2 : 1),
              0,
            ),
        );
        for (const step of steps)
          if (step.inspected !== null) {
            expect(step.inspected).toBeGreaterThanOrEqual(step.low!);
            expect(step.inspected).toBeLessThanOrEqual(step.high!);
          }
      }
    });
  }
  it("makes duplicate behavior and sorted precondition explicit", () => {
    expect(
      generateAlgorithmSteps("linear", scenarios.linear[4]).at(-1)?.outcome,
    ).toBe("Found at index 0");
    expect(
      generateAlgorithmSteps("binary-search", scenarios["binary-search"][4]).at(
        -1,
      )?.outcome,
    ).toBe("Found at index 2");
    expect(() =>
      generateAlgorithmSteps("binary-search", {
        id: "bad",
        label: "Bad",
        values: [3, 1],
        target: 1,
      }),
    ).toThrow(/sorted/);
    expect(() =>
      generateAlgorithmSteps("binary-search", {
        id: "unordered",
        label: "Unordered",
        values: [1, Number.NaN],
        target: 1,
      }),
    ).toThrow(/finite/);
  });
  it("clamps navigation and reset", () => {
    expect(moveStep(0, 3, "previous")).toBe(0);
    expect(moveStep(2, 3, "next")).toBe(2);
    expect(moveStep(2, 3, "reset")).toBe(0);
    expect(moveStep(0, 0, "next")).toBe(0);
  });
  it("steps, changes scenario, and resets in the rendered player", () => {
    render(
      <AlgorithmVisualizer algorithm="binary-search" caption="Practice" />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Next step" }));
    expect(screen.getByText(/Step 2 of/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Choose input scenario"), {
      target: { value: "empty" },
    });
    expect(screen.getByText(/Step 1 of/)).toBeInTheDocument();
    expect(
      screen.getByText("No elements in this scenario."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Next step" }));
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(screen.getByText(/Step 1 of/)).toBeInTheDocument();
  });
  it("stops playback at the final step and cancels it when the scenario changes", () => {
    vi.useFakeTimers();
    try {
      const view = render(
        <AlgorithmVisualizer algorithm="traversal" caption="Practice" />,
      );
      fireEvent.click(screen.getByRole("button", { name: "Play" }));
      fireEvent.change(screen.getByLabelText("Choose input scenario"), {
        target: { value: "singleton" },
      });
      act(() => vi.advanceTimersByTime(1000));
      expect(screen.getByText(/Step 1 of/)).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Play" }));
      act(() => vi.advanceTimersByTime(900));
      expect(screen.getByText(/Step 2 of/)).toBeInTheDocument();
      act(() => vi.advanceTimersByTime(900));
      expect(screen.getByText(/Step 3 of/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Play" })).toBeDisabled();
      view.unmount();
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
describe("DSA practice and evidence", () => {
  it("runs every reference against every authored Python check", () => {
    for (const lab of dsaCodingExercises)
      for (const check of lab.tests) {
        const result = python(solutions[lab.id], check.code);
        expect(result.error, `${lab.id}/${check.id}`).toBeUndefined();
        expect(result.status, `${lab.id}/${check.id}: ${result.stderr}`).toBe(
          0,
        );
      }
  });
  it("matches the Python references on every predefined search scenario", () => {
    for (const [algorithm, exerciseId, functionName] of [
      ["linear", "search-linear", "linear_search"],
      ["binary-search", "search-binary", "binary_search"],
    ] as const) {
      for (const scenario of scenarios[algorithm]) {
        const trace = generateAlgorithmSteps(algorithm, scenario);
        const outcome = trace.at(-1)!.outcome!;
        const index = outcome.startsWith("Found at index ")
          ? Number(outcome.slice("Found at index ".length))
          : -1;
        const result = python(
          solutions[exerciseId],
          `print(${functionName}(${JSON.stringify(scenario.values)}, ${scenario.target}))`,
        );
        expect(result.error).toBeUndefined();
        expect(result.status, result.stderr).toBe(0);
        expect(Number(result.stdout.trim())).toBe(index);
      }
    }
  });
  it("rejects key incorrect boundaries and missing results", () => {
    for (const id of [
      "arrays-safe-traverse",
      "arrays-indexed-sum",
      "arrays-empty-first",
      "arrays-repair-boundary",
      "search-linear",
      "search-binary",
    ]) {
      const lab = dsaCodingExercises.find((item) => item.id === id)!;
      expect(
        lab.tests.some((check) => {
          const result = python(lab.starter, check.code);
          return result.status !== 0;
        }),
      ).toBe(true);
    }
    const broken = dsaCodingExercises.find(
      (item) => item.id === "search-boundary-debug",
    )!;
    const result = python(broken.starter, broken.tests[0].code, 200);
    expect((result.error as NodeJS.ErrnoException)?.code).toBe("ETIMEDOUT");
  });
  it("maps two focused authored retrievals per new skill and preserves old evidence", () => {
    const newSkills = skills.filter((skill) =>
      ["arrays-strings", "searching"].includes(skill.topicId),
    );
    expect(newSkills).toHaveLength(8);
    for (const skill of newSkills) {
      expect(
        dsaRetrievalQuestions.filter(
          (q) => q.skillIds.length === 1 && q.skillIds[0] === skill.id,
        ),
      ).toHaveLength(2);
      expect(
        activities.find(
          (activity) =>
            activity.id ===
            dsaRetrievalQuestions.find((q) => q.skillIds[0] === skill.id)?.id,
        )?.href,
      ).toContain("/practice/retrieval");
    }
    const old = makeEvidence(
      "variables-q2",
      true,
      "old-0001",
      "2026-01-01T00:00:00.000Z",
    );
    const miss = makeEvidence(
      "searching-q1",
      false,
      "new-0001",
      "2026-01-02T00:00:00.000Z",
    );
    const now = Date.parse("2026-01-02T01:00:00.000Z");
    expect(
      diagnose([old, miss], now).find((item) => item.skillId === "assignment")
        ?.state,
    ).toBe("Practicing");
    expect(
      diagnose([old, miss], now).find(
        (item) => item.skillId === "sorted-precondition",
      )?.state,
    ).toBe("Needs review");
    expect(
      recommend([old, miss], now).find(
        (item) => item.skillId === "sorted-precondition",
      )?.href,
    ).toContain("/practice/retrieval");
    expect(recommend([old, miss], now)).toEqual(recommend([old, miss], now));
  });
});
