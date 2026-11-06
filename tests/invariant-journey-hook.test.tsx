import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useInvariantJourney } from "@/components/use-invariant-journey";
import {
  INVARIANT_JOURNEY_KEY,
  newInvariantJourney,
} from "@/lib/invariant-journey-state";

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.removeItem(INVARIANT_JOURNEY_KEY);
});

it("keeps journey progress usable when storage writes are denied", () => {
  const now = Date.parse("2026-11-03T12:00:00.000Z");
  const { result } = renderHook(() => useInvariantJourney());
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("denied");
  });
  act(() => result.current.update(() => newInvariantJourney(now, 0), now));
  expect(result.current.store?.seed).toBe(0);
  expect(result.current.storageError).toBe(true);
  expect(localStorage.getItem(INVARIANT_JOURNEY_KEY)).toBeNull();
});

it("receives same-tab updates through the companion event", () => {
  const now = Date.parse("2026-11-03T12:00:00.000Z");
  const first = renderHook(() => useInvariantJourney());
  const second = renderHook(() => useInvariantJourney());
  act(() =>
    first.result.current.update(() => newInvariantJourney(now, 1), now),
  );
  expect(second.result.current.store?.seed).toBe(1);
});

it("reads a different tab's validated update", () => {
  const now = Date.parse("2026-11-03T12:00:00.000Z");
  const { result } = renderHook(() => useInvariantJourney());
  act(() => result.current.update(() => newInvariantJourney(now, 0), now));
  act(() => {
    localStorage.setItem(
      INVARIANT_JOURNEY_KEY,
      JSON.stringify(newInvariantJourney(now + 1000, 1)),
    );
    window.dispatchEvent(
      new StorageEvent("storage", { key: INVARIANT_JOURNEY_KEY }),
    );
  });
  expect(result.current.store?.seed).toBe(1);
});
