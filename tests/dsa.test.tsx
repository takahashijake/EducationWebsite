import { spawnSync } from "node:child_process";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
  });
  it("clamps navigation and reset", () => {
    expect(moveStep(0, 3, "previous")).toBe(0);
    expect(moveStep(2, 3, "next")).toBe(2);
    expect(moveStep(2, 3, "reset")).toBe(0);
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
  it("rejects key incorrect boundaries and missing results", () => {
    for (const id of [
      "arrays-safe-traverse",
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
    expect(
      python(broken.starter, broken.tests[0].code, 200).error,
    ).toBeDefined();
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
