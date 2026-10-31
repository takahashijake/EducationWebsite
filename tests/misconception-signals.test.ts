import { describe, expect, it } from "vitest";
import { generateAdaptiveInstance } from "@/content/adaptive-families";
import {
  possibleMisconception,
  misconceptions,
} from "@/content/misconceptions";
import { validateLearningCatalog } from "@/content/learning-catalog-validation";
import { selectAdaptiveProblem } from "@/lib/adaptive-selection";
import {
  addCounterevidence,
  addMisconception,
  emptyMisconceptions,
  MISCONCEPTION_LIMIT,
  MISCONCEPTION_MAX_CHARS,
  parseMisconceptions,
} from "@/lib/misconception-signals";

const at = "2026-10-31T12:00:00.000Z";
const problem = (seed: number) =>
  generateAdaptiveInstance("comparison-policy", 1, seed)!;
const signal = (seed: number) => {
  const question = problem(seed);
  const choiceIndex = question.options.findIndex(
    (option) => !!option.misconceptionId,
  );
  return {
    misconceptionId: question.options[choiceIndex].misconceptionId!,
    revision: 1,
    activityId: "adaptive-comparison-policy",
    attemptId: `attempt-${seed}`,
    instanceId: question.id,
    choiceIndex,
    at,
  };
};

describe("authored misconception recovery", () => {
  it("maps only two supported boundary errors and leaves equality-only ambiguous", () => {
    expect(validateLearningCatalog()).toEqual([]);
    const found = new Set<string>();
    for (let seed = 0; seed < 60; seed++) {
      const q = problem(seed);
      for (let index = 0; index < q.options.length; index++) {
        const possible = possibleMisconception(q, index);
        if (possible) found.add(possible.id);
        if (q.options[index].text.includes("==") || index === q.correctIndex)
          expect(possible).toBeNull();
      }
    }
    expect(found).toEqual(new Set(Object.keys(misconceptions)));
    expect(misconceptions["comparison-includes-equality"].contrast).toContain(
      "score 10 fails",
    );
    expect(misconceptions["comparison-excludes-equality"].contrast).toContain(
      "score 10 passes",
    );
  });
  it("selects a genuinely different family for an independent check", () => {
    const next = selectAdaptiveProblem({
      records: [],
      now: Date.parse(at),
      seed: 7,
      manualSkill: "comparisons",
      excludeFamilyId: "comparison-policy",
      requiredCaseTag: "equality-boundary",
    });
    expect(next?.instance.familyId).toBe("comparison-branch");
    expect(next?.instance.skillId).toBe("comparisons");
    expect(next?.instance.caseTag).toBe("equality-boundary");
  });
  it("stores bounded validated signals and rejects stale, malformed and obsolete records", () => {
    let store = emptyMisconceptions();
    for (let seed = 0; seed < MISCONCEPTION_LIMIT + 4; seed++)
      store = addMisconception(store, signal(seed));
    expect(store.records).toHaveLength(MISCONCEPTION_LIMIT);
    expect(store.records[0].instanceId).toBe(problem(4).id);
    expect(addMisconception(store, signal(4))).toBe(store);
    expect(parseMisconceptions(JSON.stringify(store))).toEqual(store);
    let large = emptyMisconceptions();
    for (let seed = 0; seed < 45; seed++)
      large = addMisconception(large, {
        ...signal(seed),
        attemptId: `attempt-${"x".repeat(70)}`,
      });
    expect(JSON.stringify(large).length).toBeLessThanOrEqual(
      MISCONCEPTION_MAX_CHARS,
    );
    expect(parseMisconceptions(JSON.stringify(large))).toEqual(large);
    expect(parseMisconceptions("invalid")).toEqual(emptyMisconceptions());
    expect(parseMisconceptions("x".repeat(12001))).toEqual(
      emptyMisconceptions(),
    );
    expect(
      parseMisconceptions(
        JSON.stringify({
          version: 1,
          records: [
            { ...signal(0), misconceptionId: "removed" },
            { ...signal(1), revision: 2 },
          ],
        }),
      ).records,
    ).toEqual([]);
  });
  it("records only a later, different-family counterexample and retains uncertainty", () => {
    const source = addMisconception(emptyMisconceptions(), signal(1));
    const follow = selectAdaptiveProblem({
      records: [],
      now: Date.parse(at),
      seed: 9,
      manualSkill: "comparisons",
      excludeFamilyId: "comparison-policy",
      requiredCaseTag: "equality-boundary",
    })!.instance;
    expect(addCounterevidence(source, problem(1).id, problem(2).id, at)).toBe(
      source,
    );
    const ordinary = Array.from({ length: 40 }, (_, seed) =>
      generateAdaptiveInstance("comparison-branch", 1, seed),
    ).find((question) => question?.caseTag !== "equality-boundary")!;
    expect(
      addCounterevidence(
        source,
        problem(1).id,
        ordinary.id,
        "2026-11-01T12:00:00.000Z",
      ),
    ).toBe(source);
    const updated = addCounterevidence(
      source,
      problem(1).id,
      follow.id,
      "2026-11-01T12:00:00.000Z",
    );
    expect(updated.records[0].counterevidenceInstanceId).toBe(follow.id);
    expect(updated.records[0].misconceptionId).toBe(signal(1).misconceptionId);
    expect(parseMisconceptions(JSON.stringify(updated))).toEqual(updated);
  });
});
