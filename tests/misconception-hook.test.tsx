import { act, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useMisconceptionSignals } from "@/components/use-misconception-signals";
import { generateAdaptiveInstance } from "@/content/adaptive-families";
import { MISCONCEPTION_KEY } from "@/lib/misconception-signals";

afterEach(() => vi.restoreAllMocks());

it("retains a usable session signal when browser writes are denied", () => {
  const question = generateAdaptiveInstance("comparison-policy", 1, 0)!;
  const choiceIndex = question.options.findIndex(
    (option) => !!option.misconceptionId,
  );
  const { result } = renderHook(() => useMisconceptionSignals());
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("denied");
  });
  act(() =>
    result.current.record({
      misconceptionId: question.options[choiceIndex].misconceptionId!,
      revision: 1,
      activityId: "adaptive-comparison-policy",
      attemptId: "attempt-denied",
      instanceId: question.id,
      choiceIndex,
      at: "2026-10-31T12:00:00.000Z",
    }),
  );
  expect(result.current.signals).toHaveLength(1);
  expect(result.current.storageError).toBe(true);
  expect(localStorage.getItem(MISCONCEPTION_KEY)).toBeNull();
  act(() => result.current.clear());
  expect(result.current.signals).toEqual([]);
});
