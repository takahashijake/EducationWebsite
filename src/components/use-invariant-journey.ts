"use client";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import {
  INVARIANT_JOURNEY_KEY,
  newInvariantJourney,
  parseInvariantJourney,
  type InvariantJourneyStore,
} from "@/lib/invariant-journey-state";

const CHANGE = "cs-invariant-journey-change";
let fallback: string | undefined;
let sessionOnly = false;
function snapshot() {
  if (sessionOnly) return fallback ?? "";
  try {
    return window.localStorage.getItem(INVARIANT_JOURNEY_KEY) ?? "";
  } catch {
    return fallback ?? "";
  }
}
function subscribe(callback: () => void) {
  const storage = (event: StorageEvent) => {
    if (event.key === INVARIANT_JOURNEY_KEY || event.key === null) callback();
  };
  window.addEventListener("storage", storage);
  window.addEventListener(CHANGE, callback);
  return () => {
    window.removeEventListener("storage", storage);
    window.removeEventListener(CHANGE, callback);
  };
}
export function useInvariantJourney() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => null);
  const store = useMemo(
    () => (raw === null ? null : parseInvariantJourney(raw)),
    [raw],
  );
  const [storageError, setStorageError] = useState(false);
  const update = useCallback(
    (
      change: (current: InvariantJourneyStore) => InvariantJourneyStore,
      now: number,
    ) => {
      const current =
        parseInvariantJourney(snapshot()) ?? newInvariantJourney(now);
      const next = change(current);
      if (next === current) return current;
      const text = JSON.stringify(next);
      if (!parseInvariantJourney(text)) return current;
      try {
        window.localStorage.setItem(INVARIANT_JOURNEY_KEY, text);
        fallback = undefined;
        sessionOnly = false;
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
  const restart = useCallback((now: number) => {
    const current = parseInvariantJourney(snapshot());
    const next = newInvariantJourney(now, current?.seed === 0 ? 1 : 0);
    try {
      window.localStorage.setItem(INVARIANT_JOURNEY_KEY, JSON.stringify(next));
      fallback = undefined;
      sessionOnly = false;
      setStorageError(false);
    } catch {
      fallback = JSON.stringify(next);
      sessionOnly = true;
      setStorageError(true);
    }
    window.dispatchEvent(new Event(CHANGE));
  }, []);
  return {
    store,
    ready: raw !== null,
    storageError: storageError || sessionOnly,
    update,
    restart,
  };
}
