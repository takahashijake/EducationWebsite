import type { GuidedProject } from "@/content/project-types";
import type { Topic } from "@/content/types";
export function validateProjects(
  projects: GuidedProject[],
  topics: Topic[],
  assessmentIds: string[] = [],
): string[] {
  const errors: string[] = [];
  const unique = (values: string[]) =>
    values.every((value) => !!value.trim()) &&
    new Set(values).size === values.length;
  if (
    !unique(projects.map((p) => p.id)) ||
    !unique(projects.map((p) => p.slug))
  )
    errors.push("Duplicate or empty project identity");
  const questions = new Set(assessmentIds);
  for (const project of projects) {
    const checks = project.milestones.flatMap((m) =>
      m.checklist.map((c) => c.id),
    );
    if (!unique(project.milestones.map((m) => m.id)) || !unique(checks))
      errors.push(`Duplicate milestone or checklist: ${project.id}`);
    const published = (id: string) =>
      topics.some((t) => t.id === id && t.status === "available");
    if (
      !project.prerequisites.length ||
      !unique(project.prerequisites) ||
      project.prerequisites.some((id) => !published(id))
    )
      errors.push(`Invalid project prerequisite: ${project.id}`);
    if (
      project.objectives.length < 3 ||
      project.introduction.length < 2 ||
      !project.reference.trim() ||
      !project.referenceExplanation.trim() ||
      project.reflections.length < 3 ||
      project.milestones.length < 2
    )
      errors.push(`Incomplete project: ${project.id}`);
    for (const m of project.milestones) {
      if (
        ![
          m.title,
          m.goal,
          m.starter,
          m.expectedBehavior,
          m.solution,
          m.explanation,
        ].every((s) => s.trim()) ||
        !m.hints.length ||
        m.hints.some((s) => !s.trim()) ||
        !m.checklist.length ||
        m.checklist.some((c) => !c.text.trim()) ||
        !m.tests.length ||
        m.tests.some((t) => !t.label.trim() || !t.code.trim()) ||
        !m.connections.length ||
        m.connections.some(
          (c) => !published(c.topicId) || !c.explanation.trim(),
        )
      )
        errors.push(`Incomplete milestone: ${m.id}`);
      const q = m.question;
      if (
        !q.id.trim() ||
        questions.has(q.id) ||
        !q.prompt.trim() ||
        !q.explanation.trim() ||
        q.options.length < 3 ||
        !unique(q.options) ||
        !Number.isInteger(q.correctIndex) ||
        q.correctIndex < 0 ||
        q.correctIndex >= q.options.length
      )
        errors.push(`Invalid project assessment: ${q.id}`);
      questions.add(q.id);
    }
  }
  return errors;
}
