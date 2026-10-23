import type { GuidedProject } from "@/content/project-types";
import { evaluateAnswer } from "./quiz";

export type ProjectProgress = {
  version: 1;
  projectId: string;
  answers: Record<string, number>;
  checked: string[];
};
export const projectProgressKey = (id: string) =>
  `cs-fundamentals:project:v1:${id}`;
export function emptyProjectProgress(project: GuidedProject): ProjectProgress {
  return { version: 1, projectId: project.id, answers: {}, checked: [] };
}
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
export function parseProjectProgress(
  raw: string | null,
  project: GuidedProject,
): ProjectProgress {
  const empty = emptyProjectProgress(project);
  if (!raw) return empty;
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !record(value) ||
      value.version !== 1 ||
      value.projectId !== project.id ||
      !record(value.answers) ||
      !Array.isArray(value.checked)
    )
      return empty;
    const answers: Record<string, number> = {};
    for (const { question } of project.milestones) {
      const answer = value.answers[question.id];
      if (
        typeof answer === "number" &&
        Number.isInteger(answer) &&
        answer >= 0 &&
        answer < question.options.length
      )
        answers[question.id] = answer;
    }
    const validChecks = new Set(
      project.milestones.flatMap((m) => m.checklist.map((c) => c.id)),
    );
    const checked = [
      ...new Set(
        value.checked.filter(
          (id): id is string => typeof id === "string" && validChecks.has(id),
        ),
      ),
    ];
    return { ...empty, answers, checked };
  } catch {
    return empty;
  }
}
export function serializeProjectProgress(
  progress: ProjectProgress,
  project: GuidedProject,
): string {
  return JSON.stringify(
    parseProjectProgress(JSON.stringify(progress), project),
  );
}
export function projectStages(
  project: GuidedProject,
  progress: ProjectProgress,
) {
  let previousComplete = true;
  return project.milestones.map((milestone) => {
    const unlocked = previousComplete;
    const correct = evaluateAnswer(
      milestone.question,
      progress.answers[milestone.question.id],
    );
    const complete =
      unlocked &&
      correct &&
      milestone.checklist.every((c) => progress.checked.includes(c.id));
    previousComplete = complete;
    return { unlocked, correct, complete };
  });
}
