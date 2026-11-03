import {
  adaptiveFamilyById,
  generateAdaptiveInstance,
} from "@/content/adaptive-families";
import {
  misconceptions,
  type Misconception,
} from "@/content/misconceptions";
import { validAdaptiveInstanceId } from "./adaptive-session";

export const MISCONCEPTION_KEY = "cs-fundamentals:misconceptions:v1";
export const MISCONCEPTION_LIMIT = 40;
export const MISCONCEPTION_MAX_CHARS = 12000;
export type MisconceptionSignal = {
  misconceptionId: string;
  revision: number;
  activityId: string;
  attemptId: string;
  instanceId: string;
  choiceIndex: number;
  at: string;
  counterevidenceAt?: string;
  counterevidenceInstanceId?: string;
};
export type MisconceptionStore = { version: 1; records: MisconceptionSignal[] };
export const emptyMisconceptions = (): MisconceptionStore => ({
  version: 1,
  records: [],
});
const familyFromInstance = (id: string) => id.slice(9).split(":", 1)[0];
const validTime = (at: unknown): at is string =>
  typeof at === "string" &&
  Number.isFinite(Date.parse(at)) &&
  new Date(at).toISOString() === at;
const validFollowUp = (item: Misconception, id: string) => {
  if (
    !validAdaptiveInstanceId(id) ||
    familyFromInstance(id) !== item.followUpFamilyId
  )
    return false;
  const family = adaptiveFamilyById[item.followUpFamilyId];
  return (
    family?.skillId === item.skillId &&
    generateAdaptiveInstance(
      family.id,
      family.revision,
      Number(id.split(":s")[1]),
    )?.caseTag === item.followUpCaseTag
  );
};

export function validSignal(value: unknown): value is MisconceptionSignal {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<MisconceptionSignal>;
  const item =
    typeof r.misconceptionId === "string"
      ? misconceptions[r.misconceptionId]
      : undefined;
  if (
    !item ||
    r.revision !== item.revision ||
    !validAdaptiveInstanceId(r.instanceId) ||
    familyFromInstance(r.instanceId) !== item.familyId ||
    r.activityId !== `adaptive-${item.familyId}` ||
    typeof r.attemptId !== "string" ||
    !/^[\w-]{8,80}$/.test(r.attemptId) ||
    !validTime(r.at)
  )
    return false;
  const seed = Number(r.instanceId.split(":s")[1]);
  const question = generateAdaptiveInstance(item.familyId, item.revision, seed);
  if (
    !Number.isInteger(r.choiceIndex) ||
    question?.options[r.choiceIndex!]?.misconceptionId !== item.id
  )
    return false;
  if (
    r.counterevidenceAt === undefined &&
    r.counterevidenceInstanceId === undefined
  )
    return true;
  return (
    validTime(r.counterevidenceAt) &&
    Date.parse(r.counterevidenceAt) >= Date.parse(r.at) &&
    typeof r.counterevidenceInstanceId === "string" &&
    validFollowUp(item, r.counterevidenceInstanceId)
  );
}

export function parseMisconceptions(raw: string | null): MisconceptionStore {
  if (!raw || raw.length > MISCONCEPTION_MAX_CHARS)
    return emptyMisconceptions();
  try {
    const data = JSON.parse(raw);
    if (
      data?.version !== 1 ||
      !Array.isArray(data.records) ||
      data.records.length > MISCONCEPTION_LIMIT
    )
      return emptyMisconceptions();
    const seen = new Set<string>();
    return {
      version: 1,
      records: data.records
        .filter((entry: unknown): entry is MisconceptionSignal => {
          if (!validSignal(entry)) return false;
          const signal = entry as MisconceptionSignal;
          if (seen.has(signal.instanceId)) return false;
          seen.add(signal.instanceId);
          return true;
        })
        .map((r: MisconceptionSignal) => ({
          misconceptionId: r.misconceptionId,
          revision: r.revision,
          activityId: r.activityId,
          attemptId: r.attemptId,
          instanceId: r.instanceId,
          choiceIndex: r.choiceIndex,
          at: r.at,
          ...(r.counterevidenceAt
            ? {
                counterevidenceAt: r.counterevidenceAt,
                counterevidenceInstanceId: r.counterevidenceInstanceId,
              }
            : {}),
        })),
    };
  } catch {
    return emptyMisconceptions();
  }
}

export function addMisconception(
  store: MisconceptionStore,
  signal: MisconceptionSignal,
): MisconceptionStore {
  if (
    !validSignal(signal) ||
    store.records.some((r) => r.instanceId === signal.instanceId)
  )
    return store;
  const records = [...store.records.filter(validSignal), signal].slice(
    -MISCONCEPTION_LIMIT,
  );
  while (
    JSON.stringify({ version: 1, records }).length > MISCONCEPTION_MAX_CHARS
  )
    records.shift();
  return {
    version: 1,
    records,
  };
}

/** Counterevidence means a different, independent question was answered correctly, not that a belief disappeared. */
export function addCounterevidence(
  store: MisconceptionStore,
  sourceInstanceId: string,
  followUpInstanceId: string,
  at: string,
): MisconceptionStore {
  if (!validTime(at) || !validAdaptiveInstanceId(followUpInstanceId))
    return store;
  const records = store.records.map((signal) => {
    const item = misconceptions[signal.misconceptionId];
    if (
      signal.instanceId !== sourceInstanceId ||
      signal.counterevidenceAt ||
      !item ||
      Date.parse(at) < Date.parse(signal.at) ||
      !validFollowUp(item, followUpInstanceId)
    )
      return signal;
    return {
      ...signal,
      counterevidenceAt: at,
      counterevidenceInstanceId: followUpInstanceId,
    };
  });
  return records.every((r, i) => r === store.records[i])
    ? store
    : { version: 1, records };
}
