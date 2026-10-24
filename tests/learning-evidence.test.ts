import { validateLearningCatalog } from "@/content/learning-catalog-validation";
import { describe, expect, it } from "vitest";
import {
  activities,
  retrievalQuestions,
  skills,
} from "@/content/learning-catalog";
import {
  EVIDENCE_LIMIT,
  addEvidence,
  diagnose,
  emptyEvidence,
  makeEvidence,
  parseEvidence,
  recommend,
} from "@/lib/learning-evidence";
import { parseProgress, PROGRESS_KEY } from "@/lib/progress";
const start = Date.parse("2026-01-01T12:00:00.000Z");
const at = (days: number) => new Date(start + days * 86_400_000).toISOString();
const entry = (id: string, correct: boolean, attempt: number, days: number) =>
  makeEvidence(
    id,
    correct,
    `attempt-${String(attempt).padStart(3, "0")}`,
    at(days),
  );
describe("learning catalog", () => {
  it("has valid available destinations, stable unique activities and nine-topic retrieval coverage", () => {
    expect(validateLearningCatalog()).toEqual([]);
    expect(retrievalQuestions[0].id).toBe("retrieve-assignment-a");
    expect(new Set(activities.map((a) => a.id)).size).toBe(activities.length);
    expect(new Set(retrievalQuestions.map((q) => q.topicId)).size).toBe(9);
    expect(
      skills.every(
        (skill) =>
          !!skill.reviewHref &&
          !!retrievalQuestions.find((q) => q.skillIds.includes(skill.id)),
      ),
    ).toBe(true);
  });
  it("detects duplicate IDs, unavailable topics, missing references and cycles", () => {
    const broken = [
      { ...skills[0], prerequisites: [skills[1].id] },
      { ...skills[1], prerequisites: [skills[0].id] },
      {
        ...skills[0],
        topicId: "unpublished-topic",
        prerequisites: ["missing-skill"],
      },
      { ...skills[0] },
    ];
    const errors = validateLearningCatalog(broken, [
      activities[0],
      { ...activities[0], revision: 0 },
    ]);
    expect(errors.some((error) => error.includes("Duplicate skill"))).toBe(
      true,
    );
    expect(errors.some((error) => error.includes("Unavailable topic"))).toBe(
      true,
    );
    expect(errors.some((error) => error.includes("Missing prerequisite"))).toBe(
      true,
    );
    expect(errors.some((error) => error.includes("Cyclic prerequisite"))).toBe(
      true,
    );
    expect(errors.some((error) => error.includes("Duplicate activity"))).toBe(
      true,
    );
    expect(errors.some((error) => error.includes("Invalid revision"))).toBe(
      true,
    );
  });
});
describe("evidence and diagnosis", () => {
  it("separates a single success, repeated success, and delayed retrieval", () => {
    const first = entry("variables-q2", true, 1, 0);
    expect(diagnose([first], start)[0].state).toBe("Practicing");
    expect(diagnose([first], start)[0].dueAt).toBe(at(1));
    const second = entry("retrieve-assignment-a", true, 2, 0.5);
    expect(diagnose([first, second], start + 0.5 * 86_400_000)[0].state).toBe(
      "Practicing",
    );
    const delayed = entry("retrieve-assignment-b", true, 3, 2);
    expect(
      diagnose([first, second, delayed], start + 2 * 86_400_000)[0].state,
    ).toBe("Reinforced through repeated evidence");
    expect(
      diagnose(
        [first, second, delayed, entry("retrieve-assignment-a", false, 4, 3)],
        start + 3 * 86_400_000,
      )[0].state,
    ).toBe("Needs review");
    const recovered = diagnose(
      [
        first,
        second,
        delayed,
        entry("retrieve-assignment-a", false, 4, 3),
        entry("retrieve-assignment-b", true, 5, 3.5),
      ],
      start + 3.5 * 86_400_000,
    )[0];
    expect(recovered.state).toBe("Practicing");
    expect(recovered.dueAt).toBe(at(4.5));
  });
  it("advances reviews only when the prior interval has elapsed", () => {
    const initial = entry("variables-q2", true, 20, 0);
    const dayOne = entry("retrieve-assignment-a", true, 21, 1);
    const rapidOne = entry("retrieve-assignment-a", true, 22, 1 + 2 / 1440);
    const rapidTwo = entry("retrieve-assignment-b", true, 23, 1 + 5 / 1440);
    const rapid = [initial, dayOne, rapidOne, rapidTwo];
    expect(diagnose(rapid, Date.parse(at(2)))[0].dueAt).toBe(at(4));
    expect(diagnose([...rapid].reverse(), Date.parse(at(2)))[0].dueAt).toBe(
      at(4),
    );
    expect(diagnose([...rapid, dayOne], Date.parse(at(2)))[0].dueAt).toBe(
      at(4),
    );
    const dayFour = entry("retrieve-assignment-b", true, 24, 4);
    expect(diagnose([...rapid, dayFour], Date.parse(at(4)))[0].dueAt).toBe(
      at(11),
    );
    expect(
      diagnose(
        [
          ...rapid,
          dayFour,
          entry("retrieve-assignment-a", true, 25, 4 + 1 / 1440),
        ],
        Date.parse(at(5)),
      )[0].dueAt,
    ).toBe(at(11));
  });
  it("resets the interval after a mistaken delayed review and restarts after recovery", () => {
    const initial = entry("variables-q2", true, 30, 0);
    const review = entry("retrieve-assignment-a", true, 31, 1);
    const mistake = entry("retrieve-assignment-b", false, 32, 4);
    expect(
      diagnose([initial, review, mistake], Date.parse(at(4)))[0].dueAt,
    ).toBe(at(4));
    const recovery = entry("retrieve-assignment-b", true, 33, 4 + 2 / 1440);
    const state = diagnose(
      [initial, review, mistake, recovery],
      Date.parse(at(5)),
    )[0];
    expect(state.state).toBe("Practicing");
    expect(state.dueAt).toBe(at(5 + 2 / 1440));
  });
  it("treats combined misses as clues and recommends focused review", () => {
    const records = [entry("fundamentals-expression", false, 1, 0)];
    const assignment = diagnose(records, start)[0];
    expect(assignment.state).toBe("Not yet assessed");
    expect(assignment.recentCombinedMiss).toBe(true);
    expect(assignment.partialIncorrect).toBe(1);
    expect(recommend(records, start)[0].priority).toBe(0);
    expect(recommend(records, start)[0].href).toContain("/practice/retrieval");
    const earlier = [
      entry("variables-q2", true, 2, 0),
      entry("retrieve-assignment-a", true, 3, 2),
    ];
    expect(diagnose(earlier, start + 2 * 86_400_000)[0].state).toBe(
      "Reinforced through repeated evidence",
    );
    expect(
      diagnose(
        [...earlier, entry("fundamentals-expression", false, 4, 3)],
        start + 3 * 86_400_000,
      )[0].state,
    ).toBe("Practicing");
  });
  it("orders recent errors, due review, prerequisites, then first checks", () => {
    const records = [
      entry("retrieve-assignment-a", true, 1, 0),
      entry("retrieve-comparison-a", false, 2, 0.2),
    ];
    const ranked = recommend(records, start + 2 * 86_400_000);
    expect(ranked[0].skillId).toBe("comparisons");
    expect(ranked.find((r) => r.skillId === "assignment")?.priority).toBe(1);
    expect(ranked.find((r) => r.skillId === "branches")?.priority).toBe(2);
    expect(recommend([], start)[0].priority).toBe(3);
  });
  it("ignores future clocks, malformed timestamps and revised content", () => {
    const future = entry("variables-q2", true, 1, 10);
    expect(diagnose([future], start)[0].state).toBe("Not yet assessed");
    expect(recommend([future], start)).toEqual(recommend([], start));
    expect(diagnose([future], Number.NaN)[0].state).toBe("Not yet assessed");
    expect(recommend([future], Number.NaN)).toEqual(
      recommend([future], Number.NaN),
    );
    expect(
      parseEvidence(
        JSON.stringify({
          version: 1,
          records: [
            { ...future, at: "bad" },
            { ...future, revision: 2 },
          ],
        }),
      ).records,
    ).toEqual([]);
  });
  it("deduplicates attempts and bounds the history", () => {
    const first = entry("variables-q2", true, 1, 0);
    expect(
      addEvidence(addEvidence(emptyEvidence(), [first]), [first]).records,
    ).toHaveLength(1);
    const many = Array.from({ length: EVIDENCE_LIMIT + 30 }, (_, i) =>
      entry("variables-q2", true, i + 10, 0),
    );
    expect(addEvidence(emptyEvidence(), many).records).toHaveLength(
      EVIDENCE_LIMIT,
    );
    expect(
      parseEvidence(JSON.stringify({ version: 1, records: many })).records,
    ).toHaveLength(0);
  });
  it("rejects unsupported or oversized payloads and leaves V1 reading progress independent", () => {
    expect(parseEvidence("{").records).toEqual([]);
    expect(
      parseEvidence(JSON.stringify({ version: 2, records: [] })).records,
    ).toEqual([]);
    expect(parseEvidence("x".repeat(100_001)).records).toEqual([]);
    const old = JSON.stringify({
      version: 1,
      completed: ["variables-data-types"],
    });
    localStorage.setItem(PROGRESS_KEY, old);
    localStorage.setItem(
      "cs-fundamentals:evidence:v1",
      JSON.stringify(
        addEvidence(emptyEvidence(), [entry("variables-q2", true, 1, 0)]),
      ),
    );
    expect(localStorage.getItem(PROGRESS_KEY)).toBe(old);
    expect(parseProgress(old)).toContain("variables-data-types");
  });
  it("strips unknown fields including attempted source-code fields", () => {
    const record = {
      ...entry("variables-q2", true, 1, 0),
      sourceCode: "print('secret')",
    };
    expect(
      parseEvidence(JSON.stringify({ version: 1, records: [record] }))
        .records[0],
    ).not.toHaveProperty("sourceCode");
    expect(
      addEvidence(emptyEvidence(), [record]).records[0],
    ).not.toHaveProperty("sourceCode");
  });
});
