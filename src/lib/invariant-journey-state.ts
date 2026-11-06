import {
  INVARIANT_JOURNEY_REVISION,
  initialTransferCase,
  predictionCases,
  predictionState,
  REVISIT_INTERVAL_MS,
  revisitTransferCase,
} from "@/content/invariant-journey";

export const INVARIANT_JOURNEY_KEY = "cs-fundamentals:invariant-journey:v1";
export const INVARIANT_JOURNEY_MAX_CHARS = 8000;
export const MAX_JOURNEY_ATTEMPTS = 8;
export type JourneyAttempt = {
  caseId: string;
  correct: boolean;
  assisted: boolean;
  at: string;
};
export type InvariantJourneyStore = {
  version: 1;
  contentRevision: 1;
  seed: 0 | 1;
  startedAt: string;
  assistance: { prediction: boolean; transfer: boolean; revisit: boolean };
  prediction?: {
    caseId: string;
    choiceId: string;
    reasonId: "0" | "1" | "2";
    correct: boolean;
    assisted: boolean;
    at: string;
  };
  explanation?: {
    text: string;
    at: string;
    selfReview?: "developing" | "complete";
  };
  transfer: JourneyAttempt[];
  revisit: JourneyAttempt[];
};

const validTime = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString() === value;
const validAttempt = (value: unknown, id: string): value is JourneyAttempt => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Partial<JourneyAttempt>;
  return (
    row.caseId === id &&
    typeof row.correct === "boolean" &&
    typeof row.assisted === "boolean" &&
    validTime(row.at)
  );
};

export function newInvariantJourney(
  now: number,
  seed?: 0 | 1,
): InvariantJourneyStore {
  const safeNow = Number.isFinite(now) && now >= 0 && now <= 8.64e15 ? now : 0;
  return {
    version: 1,
    contentRevision: INVARIANT_JOURNEY_REVISION,
    seed: seed ?? ((Math.floor(safeNow) % 2) as 0 | 1),
    startedAt: new Date(safeNow).toISOString(),
    assistance: { prediction: false, transfer: false, revisit: false },
    transfer: [],
    revisit: [],
  };
}

export function parseInvariantJourney(
  raw: string | null,
): InvariantJourneyStore | null {
  if (!raw || raw.length > INVARIANT_JOURNEY_MAX_CHARS) return null;
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    const row = data as Partial<InvariantJourneyStore>;
    if (
      row.version !== 1 ||
      row.contentRevision !== INVARIANT_JOURNEY_REVISION ||
      (row.seed !== 0 && row.seed !== 1) ||
      !validTime(row.startedAt)
    )
      return null;
    if (
      !row.assistance ||
      typeof row.assistance.prediction !== "boolean" ||
      typeof row.assistance.transfer !== "boolean" ||
      typeof row.assistance.revisit !== "boolean"
    )
      return null;
    const prediction = row.prediction;
    const expectedPrediction = predictionCases[row.seed];
    if (
      prediction !== undefined &&
      (prediction.caseId !== expectedPrediction.id ||
        !expectedPrediction.choices.some(
          (choice) => choice.id === prediction.choiceId,
        ) ||
        !["0", "1", "2"].includes(prediction.reasonId) ||
        typeof prediction.correct !== "boolean" ||
        prediction.correct !==
          (prediction.choiceId ===
            predictionState(expectedPrediction).correctId &&
            prediction.reasonId === "0") ||
        typeof prediction.assisted !== "boolean" ||
        !validTime(prediction.at))
    )
      return null;
    const explanation = row.explanation;
    if (
      explanation !== undefined &&
      (typeof explanation.text !== "string" ||
        !explanation.text.trim() ||
        explanation.text.length > 2000 ||
        !validTime(explanation.at) ||
        (explanation.selfReview !== undefined &&
          !["developing", "complete"].includes(explanation.selfReview)))
    )
      return null;
    const transferId = initialTransferCase(row.seed).id;
    if (
      !Array.isArray(row.transfer) ||
      row.transfer.length > MAX_JOURNEY_ATTEMPTS ||
      !row.transfer.every((entry) => validAttempt(entry, transferId)) ||
      !Array.isArray(row.revisit) ||
      row.revisit.length > MAX_JOURNEY_ATTEMPTS ||
      !row.revisit.every((entry) => validAttempt(entry, revisitTransferCase.id))
    )
      return null;
    const transfer = row.transfer as JourneyAttempt[];
    const revisit = row.revisit as JourneyAttempt[];
    if (prediction && Date.parse(prediction.at) < Date.parse(row.startedAt))
      return null;
    if (explanation && Date.parse(explanation.at) < Date.parse(row.startedAt))
      return null;
    if (
      transfer.some(
        (entry, index) =>
          index > 0 &&
          Date.parse(entry.at) < Date.parse(transfer[index - 1].at),
      )
    )
      return null;
    if (
      revisit.some(
        (entry, index) =>
          index > 0 && Date.parse(entry.at) < Date.parse(revisit[index - 1].at),
      )
    )
      return null;
    if (
      transfer.some(
        (entry) => Date.parse(entry.at) < Date.parse(row.startedAt!),
      )
    )
      return null;
    if (
      revisit.length &&
      (!transfer.length ||
        revisit.some(
          (entry) =>
            Date.parse(entry.at) - Date.parse(transfer[0].at) <
            REVISIT_INTERVAL_MS,
        ))
    )
      return null;
    return {
      version: 1,
      contentRevision: INVARIANT_JOURNEY_REVISION,
      seed: row.seed,
      startedAt: row.startedAt,
      assistance: {
        prediction: row.assistance.prediction,
        transfer: row.assistance.transfer,
        revisit: row.assistance.revisit,
      },
      ...(prediction
        ? {
            prediction: {
              caseId: prediction.caseId,
              choiceId: prediction.choiceId,
              reasonId: prediction.reasonId,
              correct: prediction.correct,
              assisted: prediction.assisted,
              at: prediction.at,
            },
          }
        : {}),
      ...(explanation
        ? {
            explanation: {
              text: explanation.text,
              at: explanation.at,
              ...(explanation.selfReview
                ? { selfReview: explanation.selfReview }
                : {}),
            },
          }
        : {}),
      transfer: transfer.map(({ caseId, correct, assisted, at }) => ({
        caseId,
        correct,
        assisted,
        at,
      })),
      revisit: revisit.map(({ caseId, correct, assisted, at }) => ({
        caseId,
        correct,
        assisted,
        at,
      })),
    };
  } catch {
    return null;
  }
}

export function revisitEligible(store: InvariantJourneyStore, now: number) {
  if (!Number.isFinite(now) || now < 0 || !store.transfer.length) return false;
  const start = Date.parse(store.transfer[0].at);
  return (
    Number.isFinite(start) && now >= start && now - start >= REVISIT_INTERVAL_MS
  );
}

export function appendJourneyAttempt(
  store: InvariantJourneyStore,
  attempt: JourneyAttempt,
  stage: "transfer" | "revisit",
  now: number,
): InvariantJourneyStore {
  if (
    !Number.isFinite(now) ||
    now < 0 ||
    !validTime(attempt.at) ||
    Math.abs(Date.parse(attempt.at) - now) > 60_000 ||
    Date.parse(attempt.at) < Date.parse(store.startedAt) ||
    !validAttempt(
      attempt,
      stage === "transfer"
        ? initialTransferCase(store.seed).id
        : revisitTransferCase.id,
    ) ||
    (stage === "revisit" && !revisitEligible(store, now))
  )
    return store;
  const prior = store[stage];
  if (prior.length && Date.parse(attempt.at) < Date.parse(prior.at(-1)!.at))
    return store;
  if (
    prior.some(
      (entry) =>
        entry.at === attempt.at &&
        entry.caseId === attempt.caseId &&
        entry.correct === attempt.correct &&
        entry.assisted === attempt.assisted,
    )
  )
    return store;
  const nextEntries =
    prior.length < MAX_JOURNEY_ATTEMPTS
      ? [...prior, attempt]
      : [prior[0], ...prior.slice(-(MAX_JOURNEY_ATTEMPTS - 2)), attempt];
  const next = { ...store, [stage]: nextEntries };
  return JSON.stringify(next).length <= INVARIANT_JOURNEY_MAX_CHARS
    ? next
    : store;
}
