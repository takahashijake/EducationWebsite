import { numberGuessingProject as project } from "@/content/projects";
import type { ProgressStorage } from "./progress";
export const PROJECT_PROGRESS_KEY = "cs-fundamentals:project-progress:v1";
const validIds = new Set(project.checkpoints.map((c) => c.id));
export function parseProjectProgress(raw: string | null): string[] {
  try {
    const value: unknown = JSON.parse(raw ?? "null");
    if (
      !value ||
      typeof value !== "object" ||
      !("version" in value) ||
      value.version !== 1 ||
      !("projectId" in value) ||
      value.projectId !== project.id ||
      !("completed" in value) ||
      !Array.isArray(value.completed)
    )
      return [];
    return [
      ...new Set(
        value.completed.filter(
          (id): id is string => typeof id === "string" && validIds.has(id),
        ),
      ),
    ];
  } catch {
    return [];
  }
}
export function serializeProjectProgress(ids: string[]) {
  return JSON.stringify({
    version: 1,
    projectId: project.id,
    completed: [...new Set(ids.filter((id) => validIds.has(id)))],
  });
}
export function loadProjectProgress(storage: ProgressStorage) {
  try {
    return parseProjectProgress(storage.getItem(PROJECT_PROGRESS_KEY));
  } catch {
    return [];
  }
}
export function saveProjectProgress(storage: ProgressStorage, ids: string[]) {
  try {
    storage.setItem(PROJECT_PROGRESS_KEY, serializeProjectProgress(ids));
    return true;
  } catch {
    return false;
  }
}
