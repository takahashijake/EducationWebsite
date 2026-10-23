"use client";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  parseProgress,
  PROGRESS_KEY,
  progressSummary,
  serializeProgress,
  toggleCompletion,
} from "@/lib/progress";
import {
  PRACTICE_KEY,
  parsePractice,
  serializePractice,
  type PracticeEntry,
  type PracticeProgress,
} from "@/lib/practice-progress";
import { cppExercises } from "@/content/cpp-exercises";

const practiceEvent = "cs-practice-change";
let practiceFallback: string | undefined;
function practiceSnapshot() {
  if (practiceFallback !== undefined) return practiceFallback;
  try {
    return window.localStorage.getItem(PRACTICE_KEY) ?? "";
  } catch {
    return "";
  }
}
function subscribePractice(callback: () => void) {
  const listener = (event: StorageEvent) => {
    if (event.key === PRACTICE_KEY || event.key === null) callback();
  };
  window.addEventListener("storage", listener);
  window.addEventListener(practiceEvent, callback);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(practiceEvent, callback);
  };
}

const CHANGE_EVENT = "cs-progress-change";
let sessionValue = "";
let sessionOnly = false;
function subscribe(callback: () => void) {
  const storageChanged = (event: StorageEvent) => {
    if (event.key === PROGRESS_KEY || event.key === null) callback();
  };
  window.addEventListener("storage", storageChanged);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", storageChanged);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}
function getSnapshot(): string {
  if (sessionOnly) return sessionValue;
  try {
    return window.localStorage.getItem(PROGRESS_KEY) ?? "";
  } catch {
    return sessionValue;
  }
}
const getServerSnapshot = () => null;
type ProgressContextValue = ReturnType<typeof progressSummary> & {
  completedIds: string[];
  ready: boolean;
  storageError: boolean;
  toggle: (id: string) => void;
  practice: PracticeProgress;
  practiceReady: boolean;
  practiceStorageError: boolean;
  updatePractice: (
    id: string,
    change: (current: PracticeEntry | undefined) => PracticeEntry,
  ) => void;
};
const ProgressContext = createContext<ProgressContextValue | null>(null);
export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const completedIds = useMemo(() => parseProgress(raw), [raw]);
  const [storageError, setStorageError] = useState(false);
  const practiceRaw = useSyncExternalStore(
    subscribePractice,
    practiceSnapshot,
    getServerSnapshot,
  );
  const practice = useMemo(() => parsePractice(practiceRaw), [practiceRaw]);
  const [practiceStorageError, setPracticeStorageError] = useState(false);
  const updatePractice = useCallback(
    (
      id: string,
      change: (current: PracticeEntry | undefined) => PracticeEntry,
    ) => {
      if (!cppExercises.some((exercise) => exercise.id === id)) return;
      const current = parsePractice(practiceSnapshot());
      const next = serializePractice({ ...current, [id]: change(current[id]) });
      try {
        window.localStorage.setItem(PRACTICE_KEY, next);
        practiceFallback = undefined;
        setPracticeStorageError(false);
      } catch {
        practiceFallback = next;
        setPracticeStorageError(true);
      }
      window.dispatchEvent(new Event(practiceEvent));
    },
    [],
  );
  const toggle = useCallback((id: string) => {
    sessionValue = serializeProgress(
      toggleCompletion(parseProgress(getSnapshot()), id),
    );
    try {
      window.localStorage.setItem(PROGRESS_KEY, sessionValue);
      sessionOnly = false;
      setStorageError(false);
    } catch {
      sessionOnly = true;
      setStorageError(true);
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);
  return (
    <ProgressContext.Provider
      value={{
        ...progressSummary(completedIds),
        completedIds,
        ready: raw !== null,
        storageError,
        toggle,
        practice,
        practiceReady: practiceRaw !== null,
        practiceStorageError:
          practiceStorageError || practiceFallback !== undefined,
        updatePractice,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}
export function useProgress() {
  const value = useContext(ProgressContext);
  if (!value) throw new Error("useProgress requires ProgressProvider");
  return value;
}
