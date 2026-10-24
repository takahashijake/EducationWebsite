import { topics, topicHref } from "./curriculum";
import { lessons } from "./lessons";
import { fundamentalsAssessment } from "./assessments";
import { codingExercises } from "./coding-exercises";
import { dsaCodingExercises } from "./dsa-coding-exercises";
import {
  activities,
  retrievalQuestions,
  skills,
  type Activity,
  type Skill,
} from "./learning-catalog";

export function validateLearningCatalog(
  registry: Skill[] = skills,
  catalog: Activity[] = activities,
) {
  const errors: string[] = [];
  const ids = new Set<string>();
  const registryById: Record<string, Skill> = {};
  for (const skill of registry) registryById[skill.id] ??= skill;
  for (const skill of registry) {
    if (ids.has(skill.id)) errors.push(`Duplicate skill ${skill.id}`);
    ids.add(skill.id);
    if (
      !topics.some(
        (topic) => topic.id === skill.topicId && topic.status === "available",
      ) ||
      !lessons[skill.topicId]
    )
      errors.push(`Unavailable topic ${skill.topicId}`);
    if (!skill.reviewHref || !skill.reviewHref.startsWith("/lessons/"))
      errors.push(`Missing review destination ${skill.id}`);
    for (const id of skill.prerequisites)
      if (!registry.some((candidate) => candidate.id === id))
        errors.push(`Missing prerequisite ${id}`);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(id: string) {
    if (visiting.has(id)) {
      errors.push(`Cyclic prerequisite ${id}`);
      return;
    }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const next of registryById[id]?.prerequisites ?? []) visit(next);
    visiting.delete(id);
    visited.add(id);
  }
  for (const skill of registry) visit(skill.id);
  const activityIds = new Set<string>();
  for (const activity of catalog) {
    if (activityIds.has(activity.id))
      errors.push(`Duplicate activity ${activity.id}`);
    activityIds.add(activity.id);
    if (
      !activity.skillIds.length ||
      activity.skillIds.some((id) => !ids.has(id))
    )
      errors.push(`Invalid skill mapping ${activity.id}`);
    if (!Number.isSafeInteger(activity.revision) || activity.revision < 1)
      errors.push(`Invalid revision ${activity.id}`);
    if (!activity.href.startsWith("/"))
      errors.push(`Invalid activity destination ${activity.id}`);
  }
  for (const question of fundamentalsAssessment.questions)
    if (!activityIds.has(question.id))
      errors.push(`Unmapped assessment ${question.id}`);
  for (const lesson of Object.values(lessons).filter((item) =>
    registry.some((skill) => skill.topicId === item.topicId),
  ))
    for (const question of lesson.questions) {
      if (!activityIds.has(question.id))
        errors.push(`Unmapped lesson question ${question.id}`);
      const activity = catalog.find((item) => item.id === question.id);
      const topic = topics.find((item) => item.id === lesson.topicId)!;
      if (
        activity &&
        (activity.source !== "lesson" ||
          activity.href !== `${topicHref(topic)}#knowledge-check`)
      )
        errors.push(`Incorrect lesson destination ${question.id}`);
    }
  for (const exercise of [
    ...Object.values(codingExercises),
    ...dsaCodingExercises,
  ]) {
    if (!activityIds.has(exercise.id))
      errors.push(`Unmapped Python lab ${exercise.id}`);
    const activity = catalog.find((item) => item.id === exercise.id);
    if (
      activity &&
      (activity.source !== "python" ||
        activity.title !== exercise.title ||
        activity.href !== `/lessons/${exercise.topicId}#code-lab` ||
        activity.revision !== (exercise.revision ?? 1))
    )
      errors.push(`Incorrect Python metadata ${exercise.id}`);
  }
  for (const question of retrievalQuestions) {
    const activity = catalog.find((item) => item.id === question.id);
    if (
      !activity ||
      activity.source !== "retrieval" ||
      activity.revision !== question.revision ||
      activity.skillIds.join() !== question.skillIds.join()
    )
      errors.push(`Incorrect retrieval mapping ${question.id}`);
    if (
      question.options.length < 2 ||
      question.correctIndex < 0 ||
      question.correctIndex >= question.options.length ||
      !question.explanation
    )
      errors.push(`Invalid retrieval ${question.id}`);
    if (
      !topics.some(
        (topic) =>
          topic.id === question.topicId && topic.status === "available",
      )
    )
      errors.push(`Unavailable retrieval topic ${question.topicId}`);
  }
  for (const skill of registry.filter((item) =>
    ["arrays-strings", "searching"].includes(item.topicId),
  )) {
    if (
      retrievalQuestions.filter(
        (question) =>
          question.skillIds.length === 1 && question.skillIds[0] === skill.id,
      ).length < 2
    )
      errors.push(`Insufficient focused retrieval ${skill.id}`);
  }
  return errors;
}
