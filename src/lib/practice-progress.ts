import { cppExercises, type CodingExercise } from "@/content/cpp-exercises";
import {
  INPUT_LIMIT,
  SOURCE_LIMIT,
  type ExecutionKind,
} from "./execution/types";

export const PRACTICE_KEY = "cs-fundamentals:practice:v1";
export const HISTORY_LIMIT = 20;
export type PracticeAttempt = {
  at: string;
  mode: "run" | "submit";
  kind: ExecutionKind;
  passed: number;
  total: number;
};
export type PracticeEntry = {
  revision: number;
  source: string;
  stdin: string;
  attempts: PracticeAttempt[];
  completedAt?: string;
};
export type PracticeProgress = Record<string, PracticeEntry>;
const kinds = new Set([
  "success",
  "compilation-error",
  "runtime-error",
  "timeout",
  "output-limit",
  "cancelled",
  "loading-error",
  "source-limit",
  "incorrect-output",
]);
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const timestamp = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length <= 30 &&
  Number.isFinite(Date.parse(value));
export const defaultPractice = (exercise: CodingExercise): PracticeEntry => ({
  revision: exercise.revision,
  source: exercise.starter,
  stdin: exercise.examples[0].stdin,
  attempts: [],
});

export function parsePractice(raw: string | null): PracticeProgress {
  if (!raw || raw.length > 600000) return {};
  try {
    const data: unknown = JSON.parse(raw);
    if (!record(data) || data.version !== 1 || !record(data.exercises))
      return {};
    const entries: PracticeProgress = {};
    for (const exercise of cppExercises) {
      const entry = data.exercises[exercise.id];
      if (
        !record(entry) ||
        entry.revision !== exercise.revision ||
        typeof entry.source !== "string" ||
        entry.source.length > SOURCE_LIMIT ||
        typeof entry.stdin !== "string" ||
        entry.stdin.length > INPUT_LIMIT ||
        !Array.isArray(entry.attempts)
      )
        continue;
      const attempts = entry.attempts
        .slice(-HISTORY_LIMIT)
        .filter(
          (row): row is PracticeAttempt =>
            record(row) &&
            timestamp(row.at) &&
            (row.mode === "run" || row.mode === "submit") &&
            kinds.has(String(row.kind)) &&
            Number.isInteger(row.passed) &&
            Number.isInteger(row.total) &&
            Number(row.passed) >= 0 &&
            Number(row.passed) <= Number(row.total) &&
            row.total === (row.mode === "submit" ? exercise.tests.length : 0) &&
            (row.kind === "success" ||
              row.passed !== row.total ||
              row.total === 0),
        )
        .map(({ at, mode, kind, passed, total }) => ({
          at,
          mode,
          kind,
          passed,
          total,
        }));
      entries[exercise.id] = {
        revision: exercise.revision,
        source: entry.source,
        stdin: entry.stdin,
        attempts,
        completedAt: timestamp(entry.completedAt)
          ? entry.completedAt
          : undefined,
      };
    }
    return entries;
  } catch {
    return {};
  }
}
export function serializePractice(exercises: PracticeProgress) {
  return JSON.stringify({
    version: 1,
    exercises: parsePractice(JSON.stringify({ version: 1, exercises })),
  });
}
export function practiceSummary(progress: PracticeProgress, topicId?: string) {
  const exercises = cppExercises.filter(
    (exercise) => !topicId || exercise.topicId === topicId,
  );
  return {
    total: exercises.length,
    completed: exercises.filter(
      (exercise) => !!progress[exercise.id]?.completedAt,
    ).length,
  };
}
