import {
  adaptiveFamilyById,
  adaptiveSkillIds,
} from "@/content/adaptive-families";

export const ADAPTIVE_SESSION_KEY = "cs-fundamentals:adaptive-session:v1";
export const SESSION_LENGTH = 5;
export type Outcome = "independent-correct" | "assisted-correct" | "incorrect";
export type AdaptiveSession = {
  total: number;
  independentCorrect: number;
  assistedCorrect: number;
  incorrect: number;
  hinted: number;
  skills: string[];
};
export type AdaptiveSessionStore = {
  version: 1;
  counter: number;
  recent: string[];
  answered: string[];
  session: AdaptiveSession;
};
const emptySession = (): AdaptiveSession => ({
  total: 0,
  independentCorrect: 0,
  assistedCorrect: 0,
  incorrect: 0,
  hinted: 0,
  skills: [],
});
export const emptyAdaptiveSession = (): AdaptiveSessionStore => ({
  version: 1,
  counter: 0,
  recent: [],
  answered: [],
  session: emptySession(),
});
export function validAdaptiveInstanceId(id: unknown): id is string {
  if (typeof id !== "string" || id.length > 100) return false;
  const match = id.match(/^adaptive-([a-z-]+):r([1-9]\d*):s(0|[1-9]\d*)$/);
  if (!match) return false;
  const family = adaptiveFamilyById[match[1]];
  const seed = Number(match[3]);
  return (
    !!family &&
    family.revision === Number(match[2]) &&
    Number.isSafeInteger(seed) &&
    seed <= 0x7fffffff
  );
}
const boundedIds = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.slice(-32).filter(validAdaptiveInstanceId))];
};
export function parseAdaptiveSession(raw: string | null): AdaptiveSessionStore {
  if (!raw || raw.length > 6000) return emptyAdaptiveSession();
  try {
    const value = JSON.parse(raw);
    if (
      value?.version !== 1 ||
      !Number.isSafeInteger(value.counter) ||
      value.counter < 0 ||
      value.counter > 1_000_000
    )
      return emptyAdaptiveSession();
    const s = value.session;
    const counts = [
      s?.total,
      s?.independentCorrect,
      s?.assistedCorrect,
      s?.incorrect,
      s?.hinted,
    ];
    if (
      counts.some(
        (n) => !Number.isSafeInteger(n) || n < 0 || n > SESSION_LENGTH,
      ) ||
      s.total !== s.independentCorrect + s.assistedCorrect + s.incorrect ||
      s.hinted > s.total ||
      !Array.isArray(s.skills)
    )
      return emptyAdaptiveSession();
    const skills = [
      ...new Set(
        s.skills.filter(
          (id: unknown) =>
            typeof id === "string" && adaptiveSkillIds.includes(id as string),
        ),
      ),
    ].slice(-SESSION_LENGTH) as string[];
    return {
      version: 1,
      counter: value.counter,
      recent: boundedIds(value.recent),
      answered: boundedIds(value.answered),
      session: {
        total: s.total,
        independentCorrect: s.independentCorrect,
        assistedCorrect: s.assistedCorrect,
        incorrect: s.incorrect,
        hinted: s.hinted,
        skills,
      },
    };
  } catch {
    return emptyAdaptiveSession();
  }
}
export function presentAdaptiveInstance(
  store: AdaptiveSessionStore,
  id: string,
): AdaptiveSessionStore {
  if (!validAdaptiveInstanceId(id)) return store;
  return {
    ...store,
    counter: (store.counter + 1) % 1_000_001,
    recent: [...store.recent.filter((item) => item !== id), id].slice(-32),
  };
}
export function recordAdaptiveOutcome(
  store: AdaptiveSessionStore,
  id: string,
  skillId: string,
  outcome: Outcome,
  hinted: boolean,
): AdaptiveSessionStore {
  if (
    !validAdaptiveInstanceId(id) ||
    !adaptiveSkillIds.includes(skillId) ||
    adaptiveFamilyById[id.slice("adaptive-".length).split(":", 1)[0]]
      ?.skillId !== skillId ||
    !["independent-correct", "assisted-correct", "incorrect"].includes(
      outcome,
    ) ||
    typeof hinted !== "boolean" ||
    store.answered.includes(id) ||
    store.session.total >= SESSION_LENGTH
  )
    return store;
  return {
    ...store,
    recent: [...store.recent.filter((item) => item !== id), id].slice(-32),
    answered: [...store.answered, id].slice(-32),
    session: {
      total: store.session.total + 1,
      independentCorrect:
        store.session.independentCorrect +
        Number(outcome === "independent-correct"),
      assistedCorrect:
        store.session.assistedCorrect + Number(outcome === "assisted-correct"),
      incorrect: store.session.incorrect + Number(outcome === "incorrect"),
      hinted: store.session.hinted + Number(hinted),
      skills: [...new Set([...store.session.skills, skillId])].slice(
        -SESSION_LENGTH,
      ),
    },
  };
}
export function restartAdaptiveSession(
  store: AdaptiveSessionStore,
): AdaptiveSessionStore {
  return { ...store, session: emptySession() };
}
