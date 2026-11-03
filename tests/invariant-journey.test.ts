import { describe, expect, it } from "vitest";
import {
  evaluateTransfer,
  initialTransferCase,
  predictionCase,
  predictionState,
  revisitTransferCase,
  REVISIT_INTERVAL_MS,
  transferCases,
} from "@/content/invariant-journey";
import { generateWeightedSteps } from "@/lib/weighted-graph-steps";
import {
  appendJourneyAttempt,
  INVARIANT_JOURNEY_MAX_CHARS,
  MAX_JOURNEY_ATTEMPTS,
  newInvariantJourney,
  parseInvariantJourney,
  revisitEligible,
} from "@/lib/invariant-journey-state";

const start = Date.parse("2026-11-03T12:00:00.000Z");
const iso = (time: number) => new Date(time).toISOString();

describe("Dijkstra invariant journey content", () => {
  it("derives both predictions from the real trace and tests valid minimum rather than an old queue entry", () => {
    for (let seed = 0; seed < 100; seed++) {
      const item = predictionCase(seed);
      const { before, next, correctId } = predictionState(item);
      expect(before.settled).toContain("C");
      expect(before.queue).toContainEqual(
        expect.objectContaining({ vertex: "B", distance: 2 }),
      );
      expect(before.queue).toContainEqual(
        expect.objectContaining({ vertex: "B", distance: seed % 2 ? 5 : 4 }),
      );
      expect(next.phase).toBe("select");
      expect(correctId).toBe("B");
      expect(next.selectedMinimum?.distance).toBe(2);
    }
  });
  it("accepts both optimal ties, zero edges, and a cheap detour while rejecting invalid routes and totals", () => {
    expect(
      evaluateTransfer(transferCases[0], { path: "A C B D", cost: "4" })
        .correct,
    ).toBe(true);
    expect(
      evaluateTransfer(transferCases[0], { path: "A B D", cost: "6" }).correct,
    ).toBe(false);
    expect(
      evaluateTransfer(transferCases[1], { path: "A B D", cost: "3" }).correct,
    ).toBe(true);
    expect(
      evaluateTransfer(transferCases[1], { path: "A C D", cost: "3" }).correct,
    ).toBe(true);
    expect(
      evaluateTransfer(transferCases[1], { path: "A E D", cost: "3" }).correct,
    ).toBe(false);
    expect(
      evaluateTransfer(transferCases[1], { path: "A C D", cost: "-1" }).correct,
    ).toBe(false);
    expect(
      evaluateTransfer(transferCases[1], { path: "A".repeat(1000), cost: "3" })
        .correct,
    ).toBe(false);
    expect(
      generateWeightedSteps(transferCases[1].graph, "A", "D").at(-1)
        ?.unreachable,
    ).toContain("E");
  });
  it("rejects the negative-edge graph and uses it only as a distinct revisit case", () => {
    expect(() =>
      generateWeightedSteps(revisitTransferCase.graph, "A", "B"),
    ).toThrow(/Weight must/);
    expect(
      evaluateTransfer(revisitTransferCase, { suitable: "no" }).correct,
    ).toBe(true);
    expect(
      evaluateTransfer(revisitTransferCase, { suitable: "yes" }).correct,
    ).toBe(false);
    for (let seed = 0; seed < 100; seed++)
      expect(initialTransferCase(seed).id).not.toBe(revisitTransferCase.id);
  });
});

describe("bounded journey persistence and revisit clock", () => {
  it("validates revision, malformed data, attempts, and exact authored identities", () => {
    const store = newInvariantJourney(start, 0);
    expect(parseInvariantJourney(JSON.stringify(store))).toEqual(store);
    expect(parseInvariantJourney("broken")).toBeNull();
    expect(
      parseInvariantJourney("x".repeat(INVARIANT_JOURNEY_MAX_CHARS + 1)),
    ).toBeNull();
    expect(
      parseInvariantJourney(JSON.stringify({ ...store, version: 2 })),
    ).toBeNull();
    expect(
      parseInvariantJourney(JSON.stringify({ ...store, contentRevision: 2 })),
    ).toBeNull();
    expect(
      parseInvariantJourney(JSON.stringify({ ...store, seed: 9 })),
    ).toBeNull();
    expect(
      parseInvariantJourney(
        JSON.stringify({ ...store, startedAt: "not a date" }),
      ),
    ).toBeNull();
    expect(
      parseInvariantJourney(
        JSON.stringify({
          ...store,
          transfer: [
            { caseId: "other", correct: true, assisted: false, at: iso(start) },
          ],
        }),
      ),
    ).toBeNull();
    expect(
      parseInvariantJourney(
        JSON.stringify({
          ...store,
          explanation: { text: "x".repeat(2001), at: iso(start) },
        }),
      ),
    ).toBeNull();
  });
  it("opens after 24 hours, refuses backward clocks, and bounds retries without moving the due time", () => {
    let store = newInvariantJourney(start, 0);
    store = appendJourneyAttempt(
      store,
      {
        caseId: initialTransferCase(0).id,
        correct: false,
        assisted: true,
        at: iso(start),
      },
      "transfer",
      start,
    );
    expect(revisitEligible(store, start + REVISIT_INTERVAL_MS - 1)).toBe(false);
    expect(revisitEligible(store, start - 1)).toBe(false);
    expect(revisitEligible(store, start + REVISIT_INTERVAL_MS)).toBe(true);
    const tooSoon = appendJourneyAttempt(
      store,
      {
        caseId: revisitTransferCase.id,
        correct: true,
        assisted: false,
        at: iso(start + REVISIT_INTERVAL_MS - 1),
      },
      "revisit",
      start + REVISIT_INTERVAL_MS - 1,
    );
    expect(tooSoon).toBe(store);
    for (let i = 1; i < MAX_JOURNEY_ATTEMPTS + 4; i++)
      store = appendJourneyAttempt(
        store,
        {
          caseId: initialTransferCase(0).id,
          correct: true,
          assisted: false,
          at: iso(start + i * 1000),
        },
        "transfer",
        start + i * 1000,
      );
    expect(store.transfer).toHaveLength(MAX_JOURNEY_ATTEMPTS);
    expect(store.transfer[0].at).toBe(iso(start));
    expect(revisitEligible(store, start + REVISIT_INTERVAL_MS)).toBe(true);
    store = appendJourneyAttempt(
      store,
      {
        caseId: revisitTransferCase.id,
        correct: true,
        assisted: false,
        at: iso(start + REVISIT_INTERVAL_MS),
      },
      "revisit",
      start + REVISIT_INTERVAL_MS,
    );
    expect(store.revisit).toHaveLength(1);
    expect(parseInvariantJourney(JSON.stringify(store))).toEqual(store);
  });
});
