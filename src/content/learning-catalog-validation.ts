import { topics, topicHref } from "./curriculum";
import { lessons } from "./lessons";
import { fundamentalsAssessment } from "./assessments";
import { codingExercises } from "./coding-exercises";
import { dsaCodingExercises } from "./dsa-coding-exercises";
import { sortingCodingExercises } from "./sorting-coding-exercises";
import { linkedListCodingExercises } from "./linked-list-coding-exercises";
import { adaptiveFamilies } from "./adaptive-families";
import { adaptiveSkillIds } from "./adaptive-skills";
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
    ...sortingCodingExercises,
    ...linkedListCodingExercises,
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
    ["arrays-strings", "searching", "sorting", "linked-lists"].includes(
      item.topicId,
    ),
  )) {
    if (
      retrievalQuestions.filter(
        (question) =>
          question.skillIds.length === 1 && question.skillIds[0] === skill.id,
      ).length < 2
    )
      errors.push(`Insufficient focused retrieval ${skill.id}`);
  }
  const familyIds = new Set<string>();
  for (const family of adaptiveFamilies) {
    if (familyIds.has(family.id))
      errors.push(`Duplicate adaptive family ${family.id}`);
    familyIds.add(family.id);
    const skill = registry.find((item) => item.id === family.skillId);
    const topic = topics.find((item) => item.id === family.topicId);
    if (
      !skill ||
      skill.topicId !== family.topicId ||
      topic?.status !== "available"
    )
      errors.push(`Invalid adaptive skill or topic ${family.id}`);
    if (topic && family.reviewHref !== topicHref(topic))
      errors.push(`Invalid adaptive review destination ${family.id}`);
    const activity = catalog.find(
      (item) => item.id === `adaptive-${family.id}`,
    );
    if (
      !activity ||
      activity.source !== "retrieval" ||
      activity.revision !== family.revision ||
      activity.skillIds.join() !== family.skillId ||
      activity.href !== `/practice/adaptive?skill=${family.skillId}`
    )
      errors.push(`Invalid adaptive activity ${family.id}`);
  }
  if (
    new Set(adaptiveSkillIds).size !== adaptiveSkillIds.length ||
    adaptiveSkillIds.some(
      (id) => !adaptiveFamilies.some((family) => family.skillId === id),
    ) ||
    adaptiveFamilies.some(
      (family) => !adaptiveSkillIds.includes(family.skillId),
    )
  )
    errors.push("Adaptive skill navigation does not match authored families");
  for (const skillId of [
    "comparisons",
    "loop-boundaries",
    "sequence-boundaries",
    "sequence-traversal",
    "linear-search",
    "binary-invariants",
  ])
    if (
      adaptiveFamilies.filter((family) => family.skillId === skillId).length < 2
    )
      errors.push(`Insufficient adaptive families ${skillId}`);
  const sortingFamilies = adaptiveFamilies.filter(
    (family) => family.topicId === "sorting",
  );
  if (sortingFamilies.length < 8)
    errors.push("Insufficient adaptive sorting families");
  for (const skill of registry.filter((item) => item.topicId === "sorting"))
    if (!sortingFamilies.some((family) => family.skillId === skill.id))
      errors.push(`Missing adaptive sorting coverage ${skill.id}`);
  const linkedFamilies = adaptiveFamilies.filter(
    (family) => family.topicId === "linked-lists",
  );
  if (linkedFamilies.length < 8)
    errors.push("Insufficient adaptive linked-list families");
  for (const skill of registry.filter(
    (item) => item.topicId === "linked-lists",
  ))
    if (!linkedFamilies.some((family) => family.skillId === skill.id))
      errors.push(`Missing adaptive linked-list coverage ${skill.id}`);
  return errors;
}
