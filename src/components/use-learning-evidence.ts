"use client";
import { useCallback, useState, useSyncExternalStore } from "react";
import {
  addEvidence,
  EVIDENCE_KEY,
  emptyEvidence,
  parseEvidence,
  type Evidence,
} from "@/lib/learning-evidence";
const CHANGE = "cs-learning-evidence-change";
let fallback: string | undefined;
let sessionOnly = false;
function snapshot() {
  if (sessionOnly) return fallback ?? "";
  try {
    return window.localStorage.getItem(EVIDENCE_KEY) ?? "";
  } catch {
    return fallback ?? "";
  }
}
function subscribe(callback: () => void) {
  const storage = (event: StorageEvent) => {
    if (event.key === EVIDENCE_KEY || event.key === null) callback();
  };
  window.addEventListener("storage", storage);
  window.addEventListener(CHANGE, callback);
  return () => {
    window.removeEventListener("storage", storage);
    window.removeEventListener(CHANGE, callback);
  };
}
export function useLearningEvidence() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  const [storageError, setStorageError] = useState(false);
  const record = useCallback((entries: Evidence[]) => {
    if (!entries.length) return;
    const next = JSON.stringify(
      addEvidence(parseEvidence(snapshot()), entries),
    );
    try {
      window.localStorage.setItem(EVIDENCE_KEY, next);
      sessionOnly = false;
      fallback = undefined;
      setStorageError(false);
    } catch {
      fallback = next;
      sessionOnly = true;
      setStorageError(true);
    }
    window.dispatchEvent(new Event(CHANGE));
  }, []);
  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(EVIDENCE_KEY);
      sessionOnly = false;
      fallback = undefined;
      setStorageError(false);
    } catch {
      sessionOnly = true;
      fallback = JSON.stringify(emptyEvidence());
      setStorageError(true);
    }
    window.dispatchEvent(new Event(CHANGE));
  }, []);
  return {
    evidence: parseEvidence(raw).records,
    ready: raw !== null,
    storageError: storageError || sessionOnly,
    record,
    clear,
  };
}
