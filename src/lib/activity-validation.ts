import type { Assessment, Lesson, Question, Topic } from "@/content/types";
import type { GuidedProject } from "@/content/project-types";

/** Catalog checks, never a claim that learner Python was executed. */
export function validateActivities(
  topics: Topic[],
  lessons: Record<string, Lesson>,
  projects: GuidedProject[],
  assessments: Assessment[],
) {
  const errors: string[] = [];
  const known = new Map(topics.map((t) => [t.id, t]));
  const identifiers = new Set(topics.map((t) => t.id));
  Object.values(lessons).forEach((l) =>
    [...l.questions, ...(l.exercises ?? [])].forEach((q) =>
      identifiers.add(q.id),
    ),
  );
  const unique = (id: string) => {
    if (!id.trim() || identifiers.has(id))
      errors.push(`Duplicate or empty activity ID: ${id}`);
    identifiers.add(id);
  };
  const references = (ids: string[]) => {
    if (
      !ids.length ||
      new Set(ids).size !== ids.length ||
      ids.some((id) => known.get(id)?.status !== "available")
    )
      errors.push("Invalid activity topic references");
  };
  const question = (q: Question) => {
    unique(q.id);
    if (
      !q.prompt.trim() ||
      !q.explanation.trim() ||
      !q.source?.trim() ||
      q.options.length < 3 ||
      q.options.some((o) => !o.trim()) ||
      new Set(q.options).size !== q.options.length ||
      !Number.isInteger(q.correctIndex) ||
      q.correctIndex < 0 ||
      q.correctIndex >= q.options.length
    )
      errors.push(`Invalid activity answer: ${q.id}`);
  };
  projects.forEach((project) => {
    unique(project.id);
    project.milestones.forEach((milestone) => unique(milestone.question.id));
  });
  for (const assessment of assessments) {
    unique(assessment.id);
    if (
      !assessment.title.trim() ||
      assessment.questions.length < 10 ||
      assessment.questions.length > 12
    )
      errors.push(`Incomplete assessment: ${assessment.id}`);
    const covered = new Set<string>();
    assessment.questions.forEach((q) => {
      question(q);
      references(q.topicIds);
      q.topicIds.forEach((id) => covered.add(id));
    });
    if (
      topics.some(
        (t) =>
          t.sectionId === "programming" &&
          t.status === "available" &&
          !covered.has(t.id),
      )
    )
      errors.push(`Missing assessment topic coverage: ${assessment.id}`);
  }
  return errors;
}
