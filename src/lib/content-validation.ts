import type { Lesson, Topic } from "@/content/types";
import { validateTrace } from "./trace";
/** Authoring checks run against the actual catalog in the content test suite. */
export function validateContent(
  topics: Topic[],
  lessons: Record<string, Lesson>,
  path: string[],
): string[] {
  const errors: string[] = [];
  const ids = new Set(topics.map((t) => t.id));
  if (
    ids.size !== topics.length ||
    new Set(topics.map((t) => t.slug)).size !== topics.length
  )
    errors.push("Duplicate topic ID or slug");
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(id: string) {
    if (visiting.has(id)) {
      errors.push(`Prerequisite cycle: ${id}`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const prerequisite of topics.find((t) => t.id === id)?.prerequisites ??
      []) {
      if (!ids.has(prerequisite))
        errors.push(`Unknown prerequisite: ${prerequisite}`);
      else visit(prerequisite);
    }
    visiting.delete(id);
    visited.add(id);
  }
  topics.forEach((t) => visit(t.id));
  const questionIds = new Set<string>();
  for (const topic of topics) {
    const lesson = lessons[topic.id];
    if (topic.status !== "available") {
      if (lesson) errors.push(`Unpublished content: ${topic.id}`);
      continue;
    }
    if (!lesson || lesson.topicId !== topic.id) {
      errors.push(`Missing lesson: ${topic.id}`);
      continue;
    }
    if (
      lesson.objectives.length < 3 ||
      lesson.introduction.length < 2 ||
      !lesson.concept.title ||
      !lesson.concept.paragraphs.length ||
      !lesson.workedExample.title ||
      !lesson.workedExample.introduction ||
      lesson.workedExample.steps.length < 3 ||
      !lesson.code.source ||
      !lesson.code.explanation ||
      !lesson.demonstration.caption ||
      lesson.misconceptions.length < 2 ||
      lesson.takeaways.length < 3 ||
      lesson.questions.length !== 3
    )
      errors.push(`Incomplete lesson: ${topic.id}`);
    for (const question of [...lesson.questions, ...(lesson.exercises ?? [])]) {
      if (questionIds.has(question.id) || !question.id.trim())
        errors.push(`Duplicate or empty question ID: ${question.id}`);
      questionIds.add(question.id);
      if (
        !question.prompt.trim() ||
        !question.explanation.trim() ||
        question.options.length < 2 ||
        question.options.some((o) => !o.trim()) ||
        new Set(question.options).size !== question.options.length ||
        !Number.isInteger(question.correctIndex) ||
        question.correctIndex < 0 ||
        question.correctIndex >= question.options.length
      )
        errors.push(`Invalid answer: ${question.id}`);
    }
    if (lesson.exercises?.some((exercise) => !exercise.source.trim()))
      errors.push(`Missing exercise code: ${topic.id}`);
    if (lesson.demonstration.kind === "trace")
      errors.push(
        ...validateTrace(lesson.demonstration).map((e) => `${topic.id}: ${e}`),
      );
  }
  if (Object.keys(lessons).some((id) => !ids.has(id)))
    errors.push("Orphan lesson");
  if (new Set(path).size !== path.length) errors.push("Duplicate path member");
  path.forEach((id, index) => {
    const topic = topics.find((t) => t.id === id);
    const previous = topics.find((t) => t.id === path[index - 1]);
    if (
      !topic ||
      topic.status !== "available" ||
      topic.sectionId !== "programming" ||
      (index > 0 &&
        (!topic.prerequisites?.includes(path[index - 1]) ||
          !previous ||
          previous.order >= topic.order))
    )
      errors.push(`Invalid path order: ${id}`);
  });
  return errors;
}
