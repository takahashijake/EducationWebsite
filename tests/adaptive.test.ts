import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  adaptiveFamilies,
  evaluateAdaptiveAnswer,
  generateAdaptiveInstance,
} from "@/content/adaptive-families";
import { sortingAdaptiveFamilies } from "@/content/sorting-adaptive-families";
import { activities, skills } from "@/content/learning-catalog";
import { validateLearningCatalog } from "@/content/learning-catalog-validation";
import { parseEvidence, makeEvidence, diagnose } from "@/lib/learning-evidence";
import {
  relatedAdaptiveSkill,
  selectAdaptiveProblem,
} from "@/lib/adaptive-selection";
import {
  emptyAdaptiveSession,
  parseAdaptiveSession,
  presentAdaptiveInstance,
  recordAdaptiveOutcome,
  restartAdaptiveSession,
  validAdaptiveInstanceId,
} from "@/lib/adaptive-session";

const now = Date.parse("2026-10-24T12:00:00.000Z");
const at = (daysAgo: number) =>
  new Date(now - daysAgo * 86_400_000).toISOString();
const evidence = (id: string, correct: boolean, daysAgo = 0, suffix = "0001") =>
  makeEvidence(id, correct, `attempt-${suffix}`, at(daysAgo));
const instance = (id: string, seed: number) =>
  generateAdaptiveInstance(id, 1, seed)!;
describe("authored adaptive families", () => {
  it("registers two distinct families per required focused skill with stable activities", () => {
    expect(validateLearningCatalog()).toEqual([]);
    expect(sortingAdaptiveFamilies.length).toBeGreaterThanOrEqual(8);
    expect(new Set(adaptiveFamilies.map((item) => item.id)).size).toBe(adaptiveFamilies.length);
    for (const id of [
      "comparisons",
      "loop-boundaries",
      "sequence-boundaries",
      "sequence-traversal",
      "linear-search",
      "binary-invariants",
    ]) {
      const related = adaptiveFamilies.filter((item) => item.skillId === id);
      expect(related).toHaveLength(2);
      for (const family of related) {
        expect(skills.find((item) => item.id === id)?.topicId).toBe(
          family.topicId,
        );
        expect(
          activities.find((item) => item.id === `adaptive-${family.id}`),
        ).toMatchObject({ source: "retrieval", revision: 1, skillIds: [id] });
      }
    }
  });
  it("is reproducible, finite, varied, and unambiguous over many seeds", () => {
    const original = adaptiveFamilies.map((item) => ({
      id: item.id,
      skillId: item.skillId,
      revision: item.revision,
    }));
    for (const family of adaptiveFamilies) {
      const signatures = new Set<string>();
      for (let seed = 0; seed < 160; seed++) {
        const question = generateAdaptiveInstance(
          family.id,
          family.revision,
          seed,
        )!;
        expect(question).toEqual(
          generateAdaptiveInstance(family.id, family.revision, seed),
        );
        expect(question.id).toBe(`adaptive-${family.id}:r1:s${seed}`);
        expect(question.options).toHaveLength(3);
        expect(new Set(question.options.map((item) => item.text)).size).toBe(3);
        expect(
          question.options[question.correctIndex].misconception,
        ).toBeUndefined();
        expect(
          question.options.filter((item) => item.misconception),
        ).toHaveLength(2);
        expect(question.explanation.length).toBeGreaterThan(20);
        expect(question.hints.every(Boolean)).toBe(true);
        signatures.add(
          `${question.prompt}|${question.context}|${question.options[question.correctIndex].text}`,
        );
      }
      expect(signatures.size, family.id).toBeGreaterThanOrEqual(20);
    }
    expect(
      adaptiveFamilies.map((item) => ({
        id: item.id,
        skillId: item.skillId,
        revision: item.revision,
      })),
    ).toEqual(original);
  });
  it("rejects unknown IDs, stale revisions, malformed and oversized seeds", () => {
    for (const [id, revision, seed] of [
      ["unknown", 1, 0],
      [adaptiveFamilies[0].id, 2, 0],
      [adaptiveFamilies[0].id, 1, -1],
      [adaptiveFamilies[0].id, 1, Number.NaN],
      [adaptiveFamilies[0].id, 1, 0x80000000],
    ] as const)
      expect(generateAdaptiveInstance(id, revision, seed)).toBeNull();
    const valid = instance("comparison-branch", 7);
    expect(evaluateAdaptiveAnswer(valid, valid.correctIndex)?.correct).toBe(
      true,
    );
    expect(
      evaluateAdaptiveAnswer(
        valid,
        valid.options.findIndex((_, index) => index !== valid.correctIndex),
      )?.misconception,
    ).toBeTruthy();
    expect(evaluateAdaptiveAnswer(valid, -1)).toBeNull();
    expect(evaluateAdaptiveAnswer(valid, Number.NaN)).toBeNull();
    expect(
      evaluateAdaptiveAnswer(
        { ...valid, options: [...valid.options].reverse() },
        0,
      ),
    ).toBeNull();
  });
  it("covers empty, singleton, duplicate, absent, odd, even, and both binary directions", () => {
    const texts = (id: string) =>
      Array.from({ length: 400 }, (_, seed) => instance(id, seed));
    const boundary = texts("sequence-direct-read");
    expect(
      boundary.some((item) => item.context.includes("read_position([])")),
    ).toBe(true);
    expect(
      boundary.some((item) => item.context.includes("read_position([0])")),
    ).toBe(true);
    const linear = texts("linear-first-match");
    expect(linear.some((item) => item.context.includes("values = []"))).toBe(
      true,
    );
    expect(
      linear.some((item) => {
        const values = JSON.parse(
          /values = (\[[^\n]*\])/.exec(item.context)![1],
        ) as number[];
        const target = Number(/target = (\d+)/.exec(item.context)![1]);
        return (
          values.filter((value) => value === target).length > 1 &&
          item.options[item.correctIndex].text ===
            `Return ${values.indexOf(target)}`
        );
      }),
    ).toBe(true);
    expect(
      linear.some((item) => item.explanation.includes("No value equals")),
    ).toBe(true);
    const binary = texts("binary-next-interval");
    expect(binary.some((item) => item.context.includes("high = 4"))).toBe(true);
    expect(binary.some((item) => item.context.includes("high = 5"))).toBe(true);
    expect(binary.some((item) => item.explanation.includes("left side"))).toBe(
      true,
    );
    expect(binary.some((item) => item.explanation.includes("right side"))).toBe(
      true,
    );
    expect(binary.some((item) => item.explanation.includes("return"))).toBe(
      true,
    );
    const repair = texts("binary-progress-repair");
    expect(
      repair.some((item) => item.explanation.includes("low = mid + 1")),
    ).toBe(true);
    expect(
      repair.some((item) => item.explanation.includes("high = mid - 1")),
    ).toBe(true);
    const sorted = texts("sorted-input-check");
    expect(
      sorted.some((item) =>
        item.options[item.correctIndex].text.startsWith("Yes"),
      ),
    ).toBe(true);
    expect(
      sorted.some((item) =>
        item.options[item.correctIndex].text.startsWith("No"),
      ),
    ).toBe(true);
    expect(
      binary.some((item) => {
        const values = JSON.parse(
          /values = (\[[^\n]*\])/.exec(item.context)![1],
        ) as number[];
        return new Set(values).size < values.length;
      }),
    ).toBe(true);
  });
  it("agrees with independent Python range results", () => {
    const cases = Array.from({ length: 45 }, (_, seed) =>
      ["loop-values", "loop-step-count", "traversal-indices"].map((id) =>
        instance(id, seed),
      ),
    ).flat();
    const parsed = cases.map((question) => {
      if (question.familyId === "traversal-indices")
        return [
          (
            JSON.parse(
              /values = (\[[^\n]*\])/.exec(question.context)![1],
            ) as number[]
          ).length,
        ];
      const match = /range\((\d+)(?:, (\d+))?(?:, (\d+))?\)/.exec(
        question.context,
      )!;
      return match.slice(1).filter(Boolean).map(Number);
    });
    const result = spawnSync(
      "python3",
      [
        "-c",
        "import json,sys\nprint(json.dumps([list(range(*args)) for args in json.loads(sys.stdin.read())]))",
      ],
      { input: JSON.stringify(parsed), encoding: "utf8", timeout: 5000 },
    );
    expect(result.status, result.stderr).toBe(0);
    const reference = JSON.parse(result.stdout) as number[][];
    cases.forEach((question, index) => {
      const expected =
        question.familyId === "loop-step-count"
          ? `${reference[index].length} times`
          : `[${reference[index].join(", ")}]`;
      expect(question.options[question.correctIndex].text, question.id).toBe(
        expected,
      );
    });
  });
  it("executes generated direct-index examples with Python", () => {
    const cases = Array.from({ length: 60 }, (_, seed) =>
      instance("sequence-direct-read", seed),
    );
    const script = `import json,sys
out=[]
for source in json.loads(sys.stdin.read()):
    scope={}
    lines=source.splitlines()
    exec("\\n".join(lines[:-1]), scope)
    try:
        out.append("Returns " + str(eval(lines[-1], scope)))
    except IndexError:
        out.append("Raises IndexError")
print(json.dumps(out))`;
    const result = spawnSync("python3", ["-c", script], {
      input: JSON.stringify(cases.map((item) => item.context)),
      encoding: "utf8",
      timeout: 5000,
    });
    expect(result.status, result.stderr).toBe(0);
    const outputs = JSON.parse(result.stdout) as string[];
    cases.forEach((item, index) =>
      expect(item.options[item.correctIndex].text).toBe(outputs[index]),
    );
  });
  it("matches independent search and boundary oracles on generated cases", () => {
    for (let seed = 0; seed < 120; seed++) {
      const linear = instance("linear-first-match", seed);
      const values = JSON.parse(
        /values = (\[[^\n]*\])/.exec(linear.context)![1],
      ) as number[];
      const target = Number(/target = (\d+)/.exec(linear.context)![1]);
      expect(linear.options[linear.correctIndex].text).toBe(
        `Return ${values.indexOf(target)}`,
      );
      const count = instance("linear-comparison-count", seed);
      const secondValues = JSON.parse(
        /values = (\[[^\n]*\])/.exec(count.context)![1],
      ) as number[];
      const secondTarget = Number(/target = (\d+)/.exec(count.context)![1]);
      const match = secondValues.indexOf(secondTarget);
      expect(count.options[count.correctIndex].text).toBe(
        `${match < 0 ? secondValues.length : match + 1} checks`,
      );
      const boundary = instance("sequence-last-index", seed);
      const length = Number(
        /len\(values\) == (\d+)/.exec(boundary.context)![1],
      );
      expect(boundary.options[boundary.correctIndex].text).toBe(
        length ? `Index ${length - 1}` : "No valid nonnegative index",
      );
      const binary = instance("binary-next-interval", seed);
      const bValues = JSON.parse(
        /values = (\[[^\n]*\])/.exec(binary.context)![1],
      ) as number[];
      const bTarget = Number(/target = (\d+)/.exec(binary.context)![1]);
      const mid = Math.floor((bValues.length - 1) / 2);
      const expected =
        bValues[mid] === bTarget
          ? `Return index ${mid}`
          : bValues[mid] < bTarget
            ? `Keep [${mid + 1}, ${bValues.length - 1}]`
            : `Keep [0, ${mid - 1}]`;
      expect(binary.options[binary.correctIndex].text).toBe(expected);
    }
  });
  it("matches branch, enumerate, sortedness, and boundary-repair reasoning", () => {
    for (let seed = 0; seed < 120; seed++) {
      const branch = instance("comparison-branch", seed);
      const comparison =
        /(?:score|temperature|stock) = (\d+)\nif \w+ (>=|>) (\d+)/.exec(
          branch.context,
        )!;
      const runs =
        comparison[2] === ">="
          ? Number(comparison[1]) >= Number(comparison[3])
          : Number(comparison[1]) > Number(comparison[3]);
      expect(branch.options[branch.correctIndex].text).toBe(
        runs ? "Prints accept" : "Prints wait",
      );
      const policy = instance("comparison-policy", seed);
      expect(policy.options[policy.correctIndex].text).toContain(
        policy.prompt.includes("at least") ? ">=" : ">",
      );
      const traversal = instance("traversal-enumerate", seed);
      const values = JSON.parse(
        /values = (\[[^\n]*\])/.exec(traversal.context)![1],
      ) as number[];
      const index = traversal.prompt.includes("last") ? values.length - 1 : 0;
      expect(traversal.options[traversal.correctIndex].text).toBe(
        values.length ? `(${index}, ${values[index]})` : "No pair is produced",
      );
      const sorted = instance("sorted-input-check", seed);
      const ordered = JSON.parse(
        /values = (\[[^\n]*\])/.exec(sorted.context)![1],
      ) as number[];
      const legal = ordered.every(
        (value, i) => i === 0 || value >= ordered[i - 1],
      );
      expect(sorted.options[sorted.correctIndex].text.startsWith("Yes")).toBe(
        legal,
      );
      const repair = instance("binary-progress-repair", seed);
      const midpoint = Number(/mid = (\d+)/.exec(repair.context)![1]);
      const target = Number(/target = (\d+)/.exec(repair.context)![1]);
      const numbers = JSON.parse(
        /values = (\[[^\n]*\])/.exec(repair.context)![1],
      ) as number[];
      expect(repair.options[repair.correctIndex].text).toBe(
        numbers[midpoint] < target ? "low = mid + 1" : "high = mid - 1",
      );
    }
  });
});

describe("adaptive selection and persistence", () => {
  it("accepts only authored instance IDs and rejects command-like storage input", () => {
    const id = instance("linear-first-match", 7).id;
    expect(validAdaptiveInstanceId(id)).toBe(true);
    for (const malformed of [
      `${id}; touch /tmp/unwanted`,
      `${id}$(echo unsafe)`,
      `adaptive-../linear-first-match:r1:s7`,
      `adaptive-linear-first-match:r1:s7\nextra`,
    ]) expect(validAdaptiveInstanceId(malformed)).toBe(false);
  });
  it("starts without history, follows focused misses, and holds a coherent current skill", () => {
    const start = selectAdaptiveProblem({ records: [], now, seed: 0 })!;
    expect(start.skillId).toBe("comparisons");
    expect(start.reason).toMatch(/no focused/i);
    const missed = [evidence("searching-q2", false)];
    expect(
      selectAdaptiveProblem({ records: missed, now, seed: 0 })?.skillId,
    ).toBe("linear-search");
    expect(
      selectAdaptiveProblem({
        records: [],
        now,
        seed: 1,
        currentSkill: "sequence-boundaries",
      })?.skillId,
    ).toBe("sequence-boundaries");
    expect(
      selectAdaptiveProblem({
        records: [evidence("adaptive-comparison-branch", true, 0)],
        now,
        seed: 3,
        currentSkill: "comparisons",
      })?.skillId,
    ).toBe("comparisons");
  });
  it("prioritizes due review, qualifies combined misses, and follows weak prerequisites", () => {
    const due = [evidence("adaptive-comparison-branch", true, 2)];
    expect(
      selectAdaptiveProblem({ records: due, now, seed: 3 })?.reason,
    ).toMatch(/scheduled/i);
    const mixed = [evidence("fundamentals-loop", false)];
    expect(
      selectAdaptiveProblem({ records: mixed, now, seed: 3 })?.reason,
    ).toMatch(/combined.*does not isolate/i);
    const prereq = [evidence("arrays-q1", false)];
    const selected = selectAdaptiveProblem({ records: prereq, now, seed: 3 })!;
    expect(selected.skillId).toBe("sequence-boundaries");
    expect(selected.reason).toMatch(/Array indexing needs review/);
  });
  it("uses manual choice, related skill, distinct families, and recent variants deterministically", () => {
    expect(relatedAdaptiveSkill("sequence-boundaries")).toBe(
      "sequence-traversal",
    );
    const first = selectAdaptiveProblem({
      records: [],
      now,
      seed: 4,
      manualSkill: "linear-search",
    })!;
    const second = selectAdaptiveProblem({
      records: [],
      now,
      seed: 4,
      manualSkill: "linear-search",
      recent: [first.instance.id],
    })!;
    expect(second.instance.id).not.toBe(first.instance.id);
    expect(second.instance.familyId).not.toBe(first.instance.familyId);
    expect(second).toEqual(
      selectAdaptiveProblem({
        records: [],
        now,
        seed: 4,
        manualSkill: "linear-search",
        recent: [first.instance.id],
      }),
    );
    const pool = Array.from(
      { length: 64 },
      (_, seed) => instance(first.instance.familyId, seed).id,
    );
    expect(
      selectAdaptiveProblem({
        records: [],
        now,
        seed: 0,
        manualSkill: "linear-search",
        recent: pool,
      }),
    ).not.toBeNull();
    const practiced = [
      evidence("adaptive-linear-first-match", true, 2),
      evidence("adaptive-linear-comparison-count", true, 1, "0002"),
    ];
    expect(
      selectAdaptiveProblem({
        records: practiced,
        now,
        seed: 6,
        manualSkill: "linear-search",
        recent: [first.instance.id, second.instance.id],
      })?.instance.id,
    ).not.toBe(first.instance.id);
  });
  it("ignores future and malformed evidence without changing old meanings", () => {
    const old = evidence("variables-q2", true, 1);
    const fresh = evidence("adaptive-comparison-branch", false, 0, "0002");
    const future = evidence("searching-q2", false, -2, "0003");
    const parsed = parseEvidence(
      JSON.stringify({ version: 1, records: [old, fresh, future] }),
    );
    expect(parsed.records).toHaveLength(3);
    expect(
      diagnose(parsed.records, now).find(
        (item) => item.skillId === "assignment",
      )?.state,
    ).toBe("Practicing");
    expect(
      diagnose(parsed.records, now).find(
        (item) => item.skillId === "comparisons",
      )?.state,
    ).toBe("Needs review");
    expect(
      selectAdaptiveProblem({ records: parsed.records, now, seed: 5 })?.skillId,
    ).toBe("comparisons");
    expect(
      selectAdaptiveProblem({ records: [], now, seed: Number.NaN }),
    ).toBeNull();
    expect(
      selectAdaptiveProblem({
        records: null as never,
        now,
        seed: 2,
        recent: null as never,
      }),
    ).not.toBeNull();
    expect(
      parseEvidence(
        JSON.stringify({ version: 1, records: [{ ...fresh, revision: 2 }] }),
      ).records,
    ).toEqual([]);
  });
  it("does not turn variants of one family into distinct activities or assisted successes into V1 evidence", () => {
    const one = evidence("adaptive-comparison-branch", true, 3);
    const two = evidence("adaptive-comparison-branch", true, 1, "0002");
    expect(
      diagnose([one, two], now).find((item) => item.skillId === "comparisons")
        ?.state,
    ).toBe("Practicing");
    const id = instance("comparison-branch", 3).id;
    const store = recordAdaptiveOutcome(
      emptyAdaptiveSession(),
      id,
      "comparisons",
      "assisted-correct",
      true,
    );
    expect(store.session).toMatchObject({
      total: 1,
      independentCorrect: 0,
      assistedCorrect: 1,
      hinted: 1,
    });
    expect(
      recordAdaptiveOutcome(
        store,
        id,
        "comparisons",
        "independent-correct",
        false,
      ),
    ).toBe(store);
    expect(
      recordAdaptiveOutcome(
        emptyAdaptiveSession(),
        id,
        "linear-search",
        "independent-correct",
        false,
      ),
    ).toEqual(emptyAdaptiveSession());
  });
  it("defensively parses bounded local state and keeps session counters separate", () => {
    const id = instance("linear-first-match", 7).id;
    const first = presentAdaptiveInstance(emptyAdaptiveSession(), id);
    const answered = recordAdaptiveOutcome(
      first,
      id,
      "linear-search",
      "incorrect",
      false,
    );
    expect(answered).toMatchObject({
      counter: 1,
      session: { total: 1, incorrect: 1 },
    });
    expect(parseAdaptiveSession(JSON.stringify(answered))).toEqual(answered);
    expect(restartAdaptiveSession(answered)).toMatchObject({
      counter: 1,
      session: { total: 0 },
    });
    expect(
      parseAdaptiveSession(
        JSON.stringify({
          ...answered,
          recent: [
            id,
            "adaptive-missing:r1:s0",
            "adaptive-linear-first-match:r2:s0",
          ],
        }),
      ).recent,
    ).toEqual([id]);
    expect(
      parseAdaptiveSession(JSON.stringify({ ...answered, version: 2 })),
    ).toEqual(emptyAdaptiveSession());
    expect(parseAdaptiveSession("x".repeat(6001))).toEqual(
      emptyAdaptiveSession(),
    );
  });
});
