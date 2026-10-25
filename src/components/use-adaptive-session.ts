"use client";
import { useCallback, useState, useSyncExternalStore } from "react";
import {
  ADAPTIVE_SESSION_KEY,
  parseAdaptiveSession,
  presentAdaptiveInstance,
  recordAdaptiveOutcome,
  restartAdaptiveSession,
  type AdaptiveSessionStore,
  type Outcome,
} from "@/lib/adaptive-session";

const CHANGE = "cs-adaptive-session-change";
let fallback: string | undefined;
let sessionOnly = false;
function snapshot() {
  if (sessionOnly) return fallback ?? "";
  try {
    return window.localStorage.getItem(ADAPTIVE_SESSION_KEY) ?? "";
  } catch {
    return fallback ?? "";
  }
}
function subscribe(callback: () => void) {
  const storage = (event: StorageEvent) => {
    if (event.key === ADAPTIVE_SESSION_KEY || event.key === null) callback();
  };
  window.addEventListener("storage", storage);
  window.addEventListener(CHANGE, callback);
  return () => {
    window.removeEventListener("storage", storage);
    window.removeEventListener(CHANGE, callback);
  };
}
export function useAdaptiveSession() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  const [storageError, setStorageError] = useState(false);
  const update = useCallback(
    (change: (current: AdaptiveSessionStore) => AdaptiveSessionStore) => {
      const current = parseAdaptiveSession(snapshot());
      const next = change(current);
      if (next === current) return current;
      const text = JSON.stringify(next);
      try {
        window.localStorage.setItem(ADAPTIVE_SESSION_KEY, text);
        sessionOnly = false;
        fallback = undefined;
        setStorageError(false);
      } catch {
        fallback = text;
        sessionOnly = true;
        setStorageError(true);
      }
      window.dispatchEvent(new Event(CHANGE));
      return next;
    },
    [],
  );
  const present = useCallback(
    (id: string) => update((current) => presentAdaptiveInstance(current, id)),
    [update],
  );
  const submit = useCallback(
    (id: string, skillId: string, outcome: Outcome, hinted: boolean) => {
      let recorded = false;
      update((current) => {
        const next = recordAdaptiveOutcome(
          current,
          id,
          skillId,
          outcome,
          hinted,
        );
        recorded = next !== current;
        return next;
      });
      return recorded;
    },
    [update],
  );
  const restart = useCallback(() => update(restartAdaptiveSession), [update]);
  return {
    store: parseAdaptiveSession(raw),
    ready: raw !== null,
    storageError: storageError || sessionOnly,
    present,
    submit,
    restart,
  };
}
