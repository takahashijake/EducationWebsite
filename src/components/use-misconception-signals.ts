"use client";
import { useCallback, useState, useSyncExternalStore } from "react";
import {
  addCounterevidence,
  addMisconception,
  MISCONCEPTION_KEY,
  parseMisconceptions,
  type MisconceptionSignal,
  type MisconceptionStore,
} from "@/lib/misconception-signals";

const CHANGE = "cs-misconception-change";
let fallback: string | undefined;
let sessionOnly = false;
function snapshot() {
  if (sessionOnly) return fallback ?? "";
  try {
    return window.localStorage.getItem(MISCONCEPTION_KEY) ?? "";
  } catch {
    return fallback ?? "";
  }
}
function subscribe(callback: () => void) {
  const storage = (event: StorageEvent) => {
    if (event.key === MISCONCEPTION_KEY || event.key === null) callback();
  };
  window.addEventListener("storage", storage);
  window.addEventListener(CHANGE, callback);
  return () => {
    window.removeEventListener("storage", storage);
    window.removeEventListener(CHANGE, callback);
  };
}
export function useMisconceptionSignals() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  const [storageError, setStorageError] = useState(false);
  const update = useCallback(
    (change: (current: MisconceptionStore) => MisconceptionStore) => {
      const current = parseMisconceptions(snapshot());
      const next = change(current);
      if (next === current) return;
      const text = JSON.stringify(next);
      try {
        window.localStorage.setItem(MISCONCEPTION_KEY, text);
        fallback = undefined;
        sessionOnly = false;
        setStorageError(false);
      } catch {
        fallback = text;
        sessionOnly = true;
        setStorageError(true);
      }
      window.dispatchEvent(new Event(CHANGE));
    },
    [],
  );
  const record = useCallback(
    (signal: MisconceptionSignal) => update((s) => addMisconception(s, signal)),
    [update],
  );
  const counterevidence = useCallback(
    (sourceId: string, followUpId: string, at: string) =>
      update((s) => addCounterevidence(s, sourceId, followUpId, at)),
    [update],
  );
  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(MISCONCEPTION_KEY);
      fallback = undefined;
      sessionOnly = false;
      setStorageError(false);
    } catch {
      fallback = JSON.stringify({ version: 1, records: [] });
      sessionOnly = true;
      setStorageError(true);
    }
    window.dispatchEvent(new Event(CHANGE));
  }, []);
  return {
    signals: parseMisconceptions(raw).records,
    ready: raw !== null,
    storageError: storageError || sessionOnly,
    record,
    counterevidence,
    clear,
  };
}
