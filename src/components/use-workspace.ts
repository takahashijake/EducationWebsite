"use client";
import { useCallback, useState, useSyncExternalStore } from "react";
import {
  parseWorkspace,
  serializeWorkspace,
  workspaceKey,
} from "@/lib/workspace";
const eventName = "cs-workspace-change";
const fallback = new Map<string, string>();
function read(key: string) {
  if (fallback.has(key)) return fallback.get(key)!;
  try {
    return window.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}
const serverSnapshot = () => null;
export function useWorkspace(id: string | undefined, starter: string) {
  const key = id ? workspaceKey(id) : "";
  const subscribe = useCallback(
    (callback: () => void) => {
      const storage = (event: StorageEvent) => {
        if (event.key === key || event.key === null) callback();
      };
      const local = (event: Event) => {
        if ((event as CustomEvent<string>).detail === key) callback();
      };
      window.addEventListener("storage", storage);
      window.addEventListener(eventName, local);
      return () => {
        window.removeEventListener("storage", storage);
        window.removeEventListener(eventName, local);
      };
    },
    [key],
  );
  const getSnapshot = useCallback(() => (key ? read(key) : ""), [key]);
  const raw = useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);
  const saved = id ? parseWorkspace(raw, id) : undefined;
  const [writeFailed, setWriteFailed] = useState(false);
  const save = useCallback(
    (source: string) => {
      if (!id) return;
      const value = serializeWorkspace(id, source);
      try {
        window.localStorage.setItem(key, value);
        fallback.delete(key);
        setWriteFailed(false);
      } catch {
        fallback.set(key, value);
        setWriteFailed(true);
      }
      window.dispatchEvent(new CustomEvent(eventName, { detail: key }));
    },
    [key, id],
  );
  return {
    source: saved?.source ?? starter,
    hasSaved: !!saved,
    ready: raw !== null,
    storageError: writeFailed || fallback.has(key),
    save,
  };
}
