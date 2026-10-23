import type { CodingExercise } from "@/content/coding-types";
import type { Topic } from "@/content/types";
import { SOURCE_LIMIT } from "./execution/python-types";
/** Authoring validation; Python assertions are separately executed by the authoring suite. */
export function validateCodingExercises(
  exercises: CodingExercise[],
  topics: Topic[],
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const tests = new Set<string>();
  const published = (id: string) =>
    topics.some((t) => t.id === id && t.status === "available");
  const identity = (id: string) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id);
  for (const exercise of exercises) {
    if (!identity(exercise.id) || ids.has(exercise.id))
      errors.push(`Invalid or duplicate coding ID: ${exercise.id}`);
    ids.add(exercise.id);
    if (
      !published(exercise.topicId) ||
      !exercise.conceptIds.length ||
      exercise.conceptIds.some((id) => !published(id))
    )
      errors.push(`Invalid coding topic: ${exercise.id}`);
    if (
      ![
        exercise.title,
        exercise.starter,
        exercise.expectedBehavior,
        exercise.explanation,
        exercise.reflection,
      ].every((text) => !!text.trim()) ||
      !exercise.instructions.length ||
      exercise.instructions.some((text) => !text.trim()) ||
      exercise.starter.length > SOURCE_LIMIT ||
      !exercise.tests.length
    )
      errors.push(`Incomplete coding exercise: ${exercise.id}`);
    for (const test of exercise.tests) {
      if (!identity(test.id) || tests.has(test.id))
        errors.push(`Invalid or duplicate coding test: ${test.id}`);
      tests.add(test.id);
      if (
        ![test.label, test.code, test.expectedBehavior, test.guidance].every(
          (text) => !!text.trim(),
        ) ||
        !test.conceptIds.length ||
        test.conceptIds.some((id) => !published(id))
      )
        errors.push(`Incomplete coding test: ${test.id}`);
    }
  }
  return errors;
}
