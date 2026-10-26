import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { topics, availableTopics } from "@/content/curriculum";
import { lessons } from "@/content/lessons";
import { sortingCodingExercises } from "@/content/sorting-coding-exercises";
import { sortingRetrievalQuestions } from "@/content/sorting-catalog";
import {
  adaptiveFamilies,
  generateAdaptiveInstance,
} from "@/content/adaptive-families";
import { skills, activities } from "@/content/learning-catalog";
import { validateLearningCatalog } from "@/content/learning-catalog-validation";
import { diagnose, makeEvidence, parseEvidence } from "@/lib/learning-evidence";
import { selectAdaptiveProblem } from "@/lib/adaptive-selection";
import {
  emptyAdaptiveSession,
  parseAdaptiveSession,
  recordAdaptiveOutcome,
} from "@/lib/adaptive-session";
import {
  generateAlgorithmSteps,
  sortingAlgorithms,
  sortingScenarios,
  type SortingAlgorithm,
} from "@/lib/algorithm-steps";
import { sortingSolutions } from "./sorting-solutions";

const trace = (algorithm: SortingAlgorithm, values: number[]) =>
  generateAlgorithmSteps(algorithm, { id: "test", label: "Test", values });
const inversions = (values: number[]) =>
  values.reduce(
    (count, value, i) =>
      count + values.slice(i + 1).filter((later) => value > later).length,
    0,
  );
const python = (source: string, check: string) =>
  spawnSync("python3", ["-I", "-"], {
    input: `${source}\n${check}\n`,
    encoding: "utf8",
    timeout: 1500,
  });

describe("sorting step contracts", () => {
  it("sorts every predefined and many generated arrays without mutating inputs", () => {
    let state = 17;
    const arrays = sortingScenarios.map((s) => s.values);
    for (let caseIndex = 0; caseIndex < 240; caseIndex++) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      const length = state % 9;
      const values: number[] = [];
      for (let i = 0; i < length; i++) {
        state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
        values.push((state % 11) - 5);
      }
      arrays.push(values);
    }
    for (const values of arrays) {
      const original = [...values];
      const expected = [...values].sort((a, b) => a - b);
      for (const algorithm of sortingAlgorithms) {
        const steps = trace(algorithm, values);
        expect(steps[0].values).toEqual(original);
        expect(steps[0].values).not.toBe(values);
        expect(steps.at(-1)?.values, `${algorithm}/${original}`).toEqual(
          expected,
        );
        expect(
          steps
            .at(-1)
            ?.sorting?.originalIndices.slice()
            .sort((a, b) => a - b),
        ).toEqual(values.map((_, i) => i));
        expect(steps.length).toBeLessThan(300);
      }
      expect(values).toEqual(original);
    }
  });
  it("counts exact operations and records truthful transitions", () => {
    for (const values of sortingScenarios.map((s) => s.values)) {
      for (const algorithm of sortingAlgorithms) {
        const steps = trace(algorithm, values);
        for (let i = 1; i < steps.length; i++) {
          const before = steps[i - 1],
            after = steps[i];
          expect(after.comparisons).toBeGreaterThanOrEqual(before.comparisons);
          expect(after.sorting!.swaps).toBeGreaterThanOrEqual(
            before.sorting!.swaps,
          );
          expect(after.sorting!.writes).toBeGreaterThanOrEqual(
            before.sorting!.writes,
          );
          if (after.operation.startsWith("Compare")) {
            expect(after.comparisons).toBe(before.comparisons + 1);
            expect(after.values).toEqual(before.values);
            expect(after.sorting!.originalIndices).toEqual(
              before.sorting!.originalIndices,
            );
          }
          if (
            after.operation.startsWith("Swap") ||
            after.operation === "Place selected minimum"
          ) {
            expect(after.sorting!.swaps).toBe(before.sorting!.swaps + 1);
            expect(after.sorting!.writes).toBe(before.sorting!.writes + 2);
          }
          if (
            after.operation === "Shift larger value" ||
            after.operation === "Insert key"
          )
            expect(after.sorting!.writes).toBe(before.sorting!.writes + 1);
        }
        const result = steps.at(-1)!;
        expect(result.sorting!.writes).toBeGreaterThanOrEqual(
          result.sorting!.swaps * 2,
        );
      }
      expect(trace("bubble-sort", values).at(-1)!.sorting!.swaps).toBe(
        inversions(values),
      );
      expect(trace("selection-sort", values).at(-1)!.comparisons).toBe(
        values.length < 2 ? 0 : (values.length * (values.length - 1)) / 2,
      );
      const insertionWrites =
        inversions(values) +
        values
          .slice(1)
          .filter((value, i) =>
            values.slice(0, i + 1).some((earlier) => earlier > value),
          ).length;
      expect(trace("insertion-sort", values).at(-1)!.sorting!.writes).toBe(
        insertionWrites,
      );
    }
    for (const algorithm of sortingAlgorithms) {
      const sorted = trace(algorithm, [1, 2, 3, 4]).at(-1)!;
      const reverse = trace(algorithm, [4, 3, 2, 1]).at(-1)!;
      expect(sorted.comparisons).toBe(algorithm === "selection-sort" ? 6 : 3);
      expect(reverse.comparisons).toBe(6);
      if (algorithm !== "selection-sort")
        expect(sorted.sorting!.writes).toBe(0);
    }
  });
  it("marks real sorted regions and tracks decorated equal-key identities", () => {
    for (const algorithm of sortingAlgorithms) {
      const values = [4, 2, 3, 1];
      const expected = [...values].sort((a, b) => a - b);
      for (const step of trace(algorithm, values)) {
        if (step.operation.startsWith("Finish placement"))
          expect(step.sorting!.minimumIndex).toBeNull();
        const range = step.sorting!.sortedRange;
        if (!range) continue;
        const region = step.values.slice(range[0], range[1] + 1);
        expect(region).toEqual([...region].sort((a, b) => a - b));
        if (algorithm !== "insertion-sort")
          expect(region).toEqual(expected.slice(range[0], range[1] + 1));
      }
    }
    for (const algorithm of ["bubble-sort", "insertion-sort"] as const) {
      const final = trace(algorithm, [2, 2, 1]).at(-1)!;
      expect(final.sorting!.originalIndices).toEqual([2, 0, 1]);
    }
    expect(
      trace("selection-sort", [2, 2, 1]).at(-1)!.sorting!.originalIndices,
    ).toEqual([2, 1, 0]);
    expect(
      trace("bubble-sort", [1, 2, 3, 4]).some(
        (step) => step.operation === "Finish early after pass 1",
      ),
    ).toBe(true);
    expect(
      trace("bubble-sort", [4, 3, 2, 1]).some((step) =>
        step.operation.startsWith("Finish early"),
      ),
    ).toBe(false);
  });
  it("rejects invalid numeric data and bounds generated output", () => {
    for (const value of [NaN, Infinity, -Infinity])
      expect(() => trace("bubble-sort", [value])).toThrow(/finite/);
    expect(() => trace("selection-sort", Array(17).fill(1))).toThrow(
      /at most 16/,
    );
    expect(() => trace("bubble-sort", Array(3))).toThrow(/finite/);
    expect(() => trace("bubble-sort", Array(100_000).fill(1))).toThrow(
      /at most 16/,
    );
  });
});

describe("sorting curriculum, Python, and evidence", () => {
  it("publishes the stable topic and complete lesson without changing older IDs", () => {
    const topic = topics.find((item) => item.id === "sorting")!;
    expect(topic).toMatchObject({
      slug: "sorting",
      status: "available",
      prerequisites: ["arrays-strings", "big-o-notation"],
    });
    expect(availableTopics).toContain(topic);
    expect(lessons.sorting.demonstrations).toHaveLength(3);
    expect(lessons.sorting.codingExercises).toHaveLength(5);
    expect(
      lessons.sorting.sections?.map((item) => item.title).join(" "),
    ).toMatch(/Bubble.*Selection.*Insertion.*compare costs/);
    expect(validateLearningCatalog()).toEqual([]);
  });
  it("executes every authored Python reference and rejects a meaningful broken starter", () => {
    for (const lab of sortingCodingExercises) {
      expect(sortingSolutions[lab.id]).toBeTruthy();
      for (const check of lab.tests) {
        const result = python(sortingSolutions[lab.id], check.code);
        expect(result.error, `${lab.id}/${check.id}`).toBeUndefined();
        expect(result.status, `${lab.id}/${check.id}: ${result.stderr}`).toBe(
          0,
        );
      }
      expect(
        lab.tests.some((check) => python(lab.starter, check.code).status !== 0),
        lab.id,
      ).toBe(true);
    }
  });
  it("maps six focused skills, preserves V1 records, and supports sorting remediation", () => {
    const sortingSkills = skills.filter((skill) => skill.topicId === "sorting");
    expect(sortingSkills).toHaveLength(6);
    expect(sortingRetrievalQuestions).toHaveLength(sortingSkills.length * 2);
    for (const skill of sortingSkills) {
      expect(
        sortingRetrievalQuestions.filter((q) => q.skillIds.join() === skill.id),
      ).toHaveLength(2);
      expect(
        adaptiveFamilies.some((family) => family.skillId === skill.id),
      ).toBe(true);
    }
    const old = makeEvidence(
      "searching-q2",
      true,
      "old-0001",
      "2026-10-24T12:00:00.000Z",
    );
    const miss = makeEvidence(
      "retrieve-sorting-bubble-a",
      false,
      "new-0001",
      "2026-10-24T12:00:00.000Z",
    );
    expect(
      parseEvidence(JSON.stringify({ version: 1, records: [old, miss] }))
        .records,
    ).toEqual([old, miss]);
    expect(
      diagnose([old, miss], Date.parse("2026-10-24T12:01:00.000Z")).find(
        (d) => d.skillId === "bubble-invariant",
      )?.state,
    ).toBe("Needs review");
    expect(
      selectAdaptiveProblem({
        records: [old, miss],
        now: Date.parse("2026-10-24T12:01:00.000Z"),
        seed: 9,
      })?.skillId,
    ).toBe("bubble-invariant");
  });
  it("keeps sorting variants within one activity and assisted work outside positive evidence", () => {
    const families = adaptiveFamilies.filter(
      (item) => item.topicId === "sorting",
    );
    expect(families).toHaveLength(10);
    for (const family of families) {
      const one = generateAdaptiveInstance(family.id, 1, 2)!;
      const two = generateAdaptiveInstance(family.id, 1, 3)!;
      expect(one.id).not.toBe(two.id);
      expect(
        activities.filter((a) => a.id === `adaptive-${family.id}`),
      ).toHaveLength(1);
      expect(generateAdaptiveInstance(family.id, 2, 2)).toBeNull();
      expect(one.options[one.correctIndex].misconception).toBeUndefined();
      expect(one.options.filter((o) => o.misconception)).toHaveLength(2);
    }
    const id = generateAdaptiveInstance("sorting-bubble-pass", 1, 8)!.id;
    const assisted = recordAdaptiveOutcome(
      emptyAdaptiveSession(),
      id,
      "bubble-invariant",
      "assisted-correct",
      true,
    );
    expect(assisted.session).toMatchObject({
      total: 1,
      assistedCorrect: 1,
      independentCorrect: 0,
    });
    expect(parseAdaptiveSession(JSON.stringify(assisted))).toEqual(assisted);
  });
  it("agrees with algorithm and independent oracles across generated sorting questions", () => {
    const valuesOf = (context: string) =>
      JSON.parse(context.match(/values = (\[[^\n]+\])/)![1]) as number[];
    const answerOf = (id: string, seed: number) => {
      const item = generateAdaptiveInstance(id, 1, seed)!;
      return { item, answer: item.options[item.correctIndex].text };
    };
    for (let seed = 0; seed < 100; seed++) {
      const order = answerOf("sorting-order-result", seed);
      expect(order.answer).toBe(
        JSON.stringify(
          valuesOf(order.item.context).sort((a, b) => a - b),
        ).replaceAll(",", ", "),
      );
      const bubble = answerOf("sorting-bubble-pass", seed);
      expect(bubble.answer).toBe(
        `[${trace("bubble-sort", valuesOf(bubble.item.context))
          .find((step) => step.operation === "Finish pass 1")!
          .values.join(", ")}]`,
      );
      const selection = answerOf("sorting-selection-placement", seed);
      expect(selection.answer).toBe(
        `[${trace("selection-sort", valuesOf(selection.item.context))
          .find((step) => step.operation === "Finish placement 1")!
          .values.join(", ")}]`,
      );
      const insertion = answerOf("sorting-insertion-shift", seed);
      expect(insertion.answer).toBe(
        `[${trace("insertion-sort", valuesOf(insertion.item.context))
          .find((step) => step.operation === "Shift larger value")!
          .values.join(", ")}]`,
      );
      const count = answerOf("sorting-selection-count", seed);
      const length = valuesOf(count.item.context).length;
      expect(count.answer).toBe(`${(length * (length - 1)) / 2} comparisons`);
      const bubbleCount = answerOf("sorting-bubble-count", seed);
      expect(bubbleCount.answer).toBe(
        `${trace("bubble-sort", valuesOf(bubbleCount.item.context)).at(-1)!.comparisons} comparisons`,
      );
      const stable = answerOf("sorting-stability-order", seed);
      const algorithm = stable.item.context.match(
        /algorithm = (bubble-sort|selection-sort|insertion-sort)/,
      )![1] as SortingAlgorithm;
      const keys = stable.item.context.match(
        /A\(key=(-?\d+)\).*X\(key=(-?\d+)\)/,
      )!;
      const origins = trace(algorithm, [
        Number(keys[1]),
        Number(keys[1]),
        Number(keys[2]),
      ]).at(-1)!.sorting!.originalIndices;
      expect(stable.answer).toBe(
        origins.indexOf(0) < origins.indexOf(1) ? "A before B" : "B before A",
      );
    }
  });
});
