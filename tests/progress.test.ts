import { describe, expect, it } from "vitest";
import { availableTopics } from "@/content/curriculum";
import {
  loadProgress,
  parseProgress,
  PROGRESS_KEY,
  progressSummary,
  saveProgress,
  serializeProgress,
  toggleCompletion,
} from "@/lib/progress";
const id = "variables-data-types";
describe("browser progress", () => {
  it("persists and restores completion through storage", () => {
    expect(saveProgress(localStorage, [id])).toBe(true);
    expect(localStorage.getItem(PROGRESS_KEY)).toBe(serializeProgress([id]));
    expect(loadProgress(localStorage)).toEqual([id]);
  });
  it.each([
    null,
    "",
    "{bad json",
    "null",
    "[]",
    "42",
    '"text"',
    '{"version":2,"completed":[]}',
    '{"version":1,"completed":true}',
    '{"completed":[]}',
  ])("ignores malformed or unsupported storage: %s", (raw) => {
    expect(parseProgress(raw)).toEqual([]);
  });
  it("filters unknown IDs, planned lessons, invalid values, and duplicates", () => {
    expect(
      parseProgress(
        JSON.stringify({
          version: 1,
          completed: [id, id, "recursion", "unknown", 3, null],
        }),
      ),
    ).toEqual([id]);
    expect(parseProgress(serializeProgress(["recursion", id, id]))).toEqual([
      id,
    ]);
    expect(toggleCompletion([id], "recursion")).toEqual([id]);
  });
  it("toggles available lessons without duplicate counts", () => {
    expect(toggleCompletion([], id)).toEqual([id]);
    expect(toggleCompletion([id], id)).toEqual([]);
  });
  it("uses only available lessons as its denominator", () => {
    expect(progressSummary([])).toEqual({
      completed: 0,
      available: 7,
      percentage: 0,
    });
    expect(progressSummary([id, id, "recursion", "fake"])).toEqual({
      completed: 1,
      available: 7,
      percentage: 14,
    });
    expect(progressSummary([id, "big-o-notation"])).toEqual({
      completed: 2,
      available: 7,
      percentage: 29,
    });
    expect(
      progressSummary([id, "big-o-notation", "binary-number-representation"]),
    ).toEqual({ completed: 3, available: 7, percentage: 43 });
  });
  it("counts full completion across all seven available lessons", () => {
    expect(progressSummary(availableTopics.map((topic) => topic.id))).toEqual({
      completed: 7,
      available: 7,
      percentage: 100,
    });
  });
  it("handles browser storage failures without throwing", () => {
    const blocked = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("quota");
      },
    };
    expect(loadProgress(blocked)).toEqual([]);
    expect(saveProgress(blocked, [id])).toBe(false);
  });
});
