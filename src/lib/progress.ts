import { availableTopics, programmingPath } from "@/content/curriculum";
export const PROGRESS_KEY = "cs-fundamentals:progress:v1";
const availableIds = new Set(availableTopics.map((topic) => topic.id));
export type ProgressStorage = Pick<Storage, "getItem" | "setItem">;

export function parseProgress(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (
      typeof value !== "object" ||
      value === null ||
      !("version" in value) ||
      value.version !== 1 ||
      !("completed" in value) ||
      !Array.isArray(value.completed)
    )
      return [];
    return [
      ...new Set(
        value.completed.filter(
          (id): id is string => typeof id === "string" && availableIds.has(id),
        ),
      ),
    ];
  } catch {
    return [];
  }
}
export function serializeProgress(ids: string[]): string {
  return JSON.stringify({
    version: 1,
    completed: [...new Set(ids.filter((id) => availableIds.has(id)))],
  });
}
export function loadProgress(storage: ProgressStorage): string[] {
  try {
    return parseProgress(storage.getItem(PROGRESS_KEY));
  } catch {
    return [];
  }
}
export function saveProgress(storage: ProgressStorage, ids: string[]): boolean {
  try {
    storage.setItem(PROGRESS_KEY, serializeProgress(ids));
    return true;
  } catch {
    return false;
  }
}
export function progressSummary(ids: string[]) {
  const completed = new Set(ids.filter((id) => availableIds.has(id))).size;
  const available = availableTopics.length;
  return {
    completed,
    available,
    percentage: available ? Math.round((completed / available) * 100) : 0,
  };
}
export function toggleCompletion(ids: string[], id: string): string[] {
  const valid = ids.filter((value) => availableIds.has(value));
  if (!availableIds.has(id)) return [...new Set(valid)];
  return ids.includes(id)
    ? valid.filter((value) => value !== id)
    : [...new Set([...valid, id])];
}

export function pathProgress(ids: string[]) {
  const members = programmingPath.filter((id) => availableIds.has(id));
  const completed = members.filter((id) => ids.includes(id)).length;
  return {
    completed,
    available: members.length,
    percentage: members.length
      ? Math.round((completed / members.length) * 100)
      : 0,
    recommendedId: members.find((id) => !ids.includes(id)),
  };
}
