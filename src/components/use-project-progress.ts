"use client";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import type { GuidedProject } from "@/content/project-types";
import {
  parseProjectProgress,
  projectProgressKey,
  serializeProjectProgress,
  type ProjectProgress,
} from "@/lib/project-progress";

const eventName = "cs-project-progress-change";
const sessionFallback = new Map<string, string>();
function snapshot(key: string) {
  if (sessionFallback.has(key)) return sessionFallback.get(key)!;
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(eventName, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(eventName, callback);
  };
}
const serverSnapshot = () => null;
export function useProjectProgress(project: GuidedProject) {
  const key = projectProgressKey(project.id);
  const read = useCallback(() => snapshot(key), [key]);
  const raw = useSyncExternalStore(subscribe, read, serverSnapshot);
  const progress = useMemo(
    () => parseProjectProgress(raw, project),
    [raw, project],
  );
  const [storageError, setStorageError] = useState(false);
  const update = useCallback(
    (change: (current: ProjectProgress) => ProjectProgress) => {
      const next = serializeProjectProgress(
        change(parseProjectProgress(snapshot(key), project)),
        project,
      );
      try {
        window.localStorage.setItem(key, next);
        sessionFallback.delete(key);
        setStorageError(false);
      } catch {
        sessionFallback.set(key, next);
        setStorageError(true);
      }
      window.dispatchEvent(new Event(eventName));
    },
    [project, key],
  );
  return {
    progress,
    update,
    ready: raw !== null,
    storageError: storageError || sessionFallback.has(key),
  };
}
