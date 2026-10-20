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
};
const ProgressContext = createContext<ProgressContextValue | null>(null);
export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const completedIds = useMemo(() => parseProgress(raw), [raw]);
  const [storageError, setStorageError] = useState(false);
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
