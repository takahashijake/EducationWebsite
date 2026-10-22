import { SOURCE_LIMIT } from "./execution/types";
export type Workspace = { version: 1; workspaceId: string; source: string };
export const workspaceKey = (id: string) =>
  `cs-fundamentals:workspace:v1:${id}`;
export const lessonWorkspaceId = (topicId: string, exerciseId: string) =>
  `lesson:${topicId}:${exerciseId}`;
export const projectWorkspaceId = (projectId: string, milestoneId: string) =>
  `project:${projectId}:${milestoneId}`;
export function parseWorkspace(
  raw: string | null,
  id: string,
): Workspace | undefined {
  if (!raw || raw.length > SOURCE_LIMIT * 6 + 1000) return;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null || Array.isArray(value))
      return;
    const stored = value as Record<string, unknown>;
    if (
      stored.version !== 1 ||
      stored.workspaceId !== id ||
      typeof stored.source !== "string" ||
      stored.source.length > SOURCE_LIMIT
    )
      return;
    return { version: 1, workspaceId: id, source: stored.source };
  } catch {
    return;
  }
}
export function serializeWorkspace(id: string, source: string): string {
  if (source.length > SOURCE_LIMIT)
    throw new Error(`Workspace exceeds ${SOURCE_LIMIT} characters`);
  return JSON.stringify({
    version: 1,
    workspaceId: id,
    source,
  } satisfies Workspace);
}
