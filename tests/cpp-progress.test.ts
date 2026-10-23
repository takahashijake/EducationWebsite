import { describe, expect, it } from "vitest";
import { cppExercises } from "@/content/cpp-exercises";
import {
  defaultPractice,
  HISTORY_LIMIT,
  parsePractice,
  practiceSummary,
  serializePractice,
} from "@/lib/practice-progress";

describe("practice storage validation", () => {
  const exercise = cppExercises[0];
  const at = "2026-10-23T01:00:00.000Z";
  it("round trips a bounded workspace and attempts without changing reading records", () => {
    const progress = {
      [exercise.id]: {
        ...defaultPractice(exercise),
        source: "",
        completedAt: at,
        attempts: [
          {
            at,
            mode: "submit" as const,
            kind: "success" as const,
            passed: exercise.tests.length,
            total: exercise.tests.length,
          },
        ],
      },
    };
    const parsed = parsePractice(serializePractice(progress));
    expect(parsed).toEqual(progress);
    expect(practiceSummary(parsed)).toEqual({ completed: 1, total: 8 });
    expect(practiceSummary(parsed, "variables-data-types")).toEqual({
      completed: 1,
      total: 1,
    });
  });
  it("rejects malformed, unsupported, oversized, and foreign entries", () => {
    for (const raw of [
      null,
      "bad",
      "[]",
      '{"version":2,"exercises":{}}',
      "x".repeat(600001),
    ])
      expect(parsePractice(raw)).toEqual({});
    const entry = defaultPractice(exercise);
    const raw = (value: unknown, id = exercise.id) =>
      JSON.stringify({ version: 1, exercises: { [id]: value } });
    expect(parsePractice(raw(entry, "foreign"))).toEqual({});
    expect(parsePractice(raw({ ...entry, revision: 99 }))).toEqual({});
    expect(parsePractice(raw({ ...entry, source: "x".repeat(24001) }))).toEqual(
      {},
    );
    expect(parsePractice(raw({ ...entry, stdin: "x".repeat(4001) }))).toEqual(
      {},
    );
    expect(
      parsePractice(
        raw({
          ...entry,
          attempts: [
            { at, mode: "submit", kind: "success", passed: 99, total: 99 },
            { at: "bad", mode: "run" },
          ],
        }),
      )[exercise.id].attempts,
    ).toEqual([]);
  });
  it("keeps only the most recent attempts and excludes unknown data", () => {
    const entry = {
      ...defaultPractice(exercise),
      attempts: Array.from({ length: 100 }, () => ({
        at,
        mode: "run" as const,
        kind: "success" as const,
        passed: 0,
        total: 0,
        secret: "discard",
      })),
    };
    const result = parsePractice(serializePractice({ [exercise.id]: entry }));
    expect(result[exercise.id].attempts).toHaveLength(HISTORY_LIMIT);
    expect(result[exercise.id].attempts[0]).not.toHaveProperty("secret");
  });
});
