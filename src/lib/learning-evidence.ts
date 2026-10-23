import { activityById, skills } from "@/content/learning-catalog";
export const EVIDENCE_KEY = "cs-fundamentals:evidence:v1";
export const EVIDENCE_LIMIT = 240;
export type Evidence = {
  attemptId: string;
  activityId: string;
  source: "assessment" | "lesson" | "retrieval" | "python";
  correct: boolean;
  at: string;
  revision: number;
};
export type EvidenceStore = { version: 1; records: Evidence[] };
export const emptyEvidence = (): EvidenceStore => ({ version: 1, records: [] });
const MAX_RAW = 100_000;
const validTime = (value: unknown) =>
  typeof value === "string" &&
  /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString() === value;
export function validEvidence(value: unknown): value is Evidence {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<Evidence>;
  const activity =
    typeof r.activityId === "string" ? activityById[r.activityId] : undefined;
  return (
    !!activity &&
    r.source === activity.source &&
    typeof r.attemptId === "string" &&
    /^[\w-]{8,80}$/.test(r.attemptId) &&
    typeof r.correct === "boolean" &&
    validTime(r.at) &&
    r.revision === activity.revision
  );
}
function clean(record: Evidence): Evidence {
  return {
    attemptId: record.attemptId,
    activityId: record.activityId,
    source: record.source,
    correct: record.correct,
    at: record.at,
    revision: record.revision,
  };
}
export function parseEvidence(raw: string | null): EvidenceStore {
  if (!raw || raw.length > MAX_RAW) return emptyEvidence();
  try {
    const data = JSON.parse(raw);
    if (
      data?.version !== 1 ||
      !Array.isArray(data.records) ||
      data.records.length > EVIDENCE_LIMIT
    )
      return emptyEvidence();
    const seen = new Set<string>();
    return {
      version: 1,
      records: data.records
        .filter((record: unknown): record is Evidence => {
          if (!validEvidence(record)) return false;
          if (seen.has(record.attemptId)) return false;
          seen.add(record.attemptId);
          return true;
        })
        .map(clean),
    };
  } catch {
    return emptyEvidence();
  }
}
export function addEvidence(
  store: EvidenceStore,
  records: Evidence[],
): EvidenceStore {
  const retained = store.records.filter(validEvidence).map(clean);
  const seen = new Set(retained.map((record) => record.attemptId));
  const appended = records.filter((record) => {
    if (!validEvidence(record) || seen.has(record.attemptId)) return false;
    seen.add(record.attemptId);
    return true;
  });
  return {
    version: 1,
    records: [...retained, ...appended.map(clean)].slice(-EVIDENCE_LIMIT),
  };
}
export function makeEvidence(
  activityId: string,
  correct: boolean,
  attemptId: string,
  at = new Date().toISOString(),
): Evidence {
  const activity = activityById[activityId];
  if (!activity) throw new Error(`Unknown activity ${activityId}`);
  return {
    activityId,
    correct,
    attemptId,
    at,
    source: activity.source,
    revision: activity.revision,
  };
}
export type SkillState =
  | "Not yet assessed"
  | "Needs review"
  | "Practicing"
  | "Reinforced through repeated evidence";
export type Diagnosis = {
  skillId: string;
  state: SkillState;
  reason: string;
  directCorrect: number;
  directIncorrect: number;
  partial: number;
  partialCorrect: number;
  partialIncorrect: number;
  recentCombinedMiss: boolean;
  dueAt?: string;
  dueReason?: string;
  lastReviewedAt?: string;
};
const DAY = 86_400_000;
export function diagnose(records: Evidence[], now: number): Diagnosis[] {
  const safeNow = Number.isFinite(now) ? now : 0;
  return skills.map((skill) => {
    const all = records
      .filter(
        (r) =>
          validEvidence(r) &&
          activityById[r.activityId].skillIds.includes(skill.id) &&
          Date.parse(r.at) <= safeNow + 5 * 60_000,
      )
      .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    const direct = all.filter(
      (r) => activityById[r.activityId].skillIds.length === 1,
    );
    const positive = direct.filter((r) => r.correct);
    const negative = direct.filter((r) => !r.correct);
    const latest = direct.at(-1);
    const lastMistake = direct.findLastIndex((r) => !r.correct);
    const currentPositive = direct
      .slice(lastMistake + 1)
      .filter((r) => r.correct);
    const distinct = new Set(currentPositive.map((r) => r.activityId)).size;
    const firstSuccess = currentPositive[0]
      ? Date.parse(currentPositive[0].at)
      : undefined;
    const firstEverSuccess = positive[0]
      ? Date.parse(positive[0].at)
      : undefined;
    const reviewed =
      firstEverSuccess === undefined
        ? []
        : direct.filter(
            (r) =>
              r.source === "retrieval" &&
              Date.parse(r.at) - firstEverSuccess >= DAY,
          );
    const delayed =
      firstSuccess === undefined
        ? []
        : currentPositive.filter(
            (r) =>
              r.source === "retrieval" &&
              Date.parse(r.at) - firstSuccess >= DAY,
          );
    const reinforced =
      distinct >= 2 && delayed.length > 0 && latest?.correct === true;
    let state: SkillState = "Not yet assessed";
    if (latest?.correct === false) state = "Needs review";
    else if (reinforced) state = "Reinforced through repeated evidence";
    else if (direct.length) state = "Practicing";
    // A mixed question is a clue, never definitive skill-level evidence.
    const combined = all.filter(
      (r) => activityById[r.activityId].skillIds.length > 1,
    );
    const partial = combined.length;
    const partialCorrect = combined.filter((r) => r.correct).length;
    const partialIncorrect = partial - partialCorrect;
    const recentCombinedMiss =
      !!all.at(-1) &&
      activityById[all.at(-1)!.activityId].skillIds.length > 1 &&
      !all.at(-1)!.correct;
    if (recentCombinedMiss && state === "Reinforced through repeated evidence")
      state = "Practicing";
    const schedule = currentPositive.length
      ? [1, 3, 7, 14][Math.min(delayed.length, 3)]
      : undefined;
    const latestSuccess = currentPositive.at(-1);
    let dueAt =
      state !== "Needs review" && schedule && latestSuccess
        ? new Date(Date.parse(latestSuccess.at) + schedule * DAY).toISOString()
        : undefined;
    if (state === "Needs review" && latest) dueAt = latest.at;
    const dueReason =
      state === "Needs review"
        ? "A recent focused answer was incorrect, so review is available now."
        : schedule
          ? `Scheduled ${schedule} day${schedule === 1 ? "" : "s"} after the latest successful focused practice.`
          : undefined;
    const reason = recentCombinedMiss
      ? `You missed the combined question “${activityById[all.at(-1)!.activityId].title}”. It does not isolate the cause; try a focused ${skill.title.toLowerCase()} check. ${direct.length ? `${positive.length} focused correct and ${negative.length} focused incorrect attempts are recorded.` : "No focused answer is recorded yet."}`
      : state === "Not yet assessed"
        ? partial
          ? `${partialCorrect} combined correct and ${partialIncorrect} combined incorrect observation${partial === 1 ? "" : "s"} involved this skill; a focused check is still needed.`
          : "No focused answer has been recorded yet."
        : state === "Needs review"
          ? `Your latest focused attempt on “${activityById[latest!.activityId].title}” was incorrect${negative.length > 1 ? `; ${negative.length} misses are recorded` : ""}. Review the explanation and try a different ${skill.title.toLowerCase()} question.`
          : state === "Reinforced through repeated evidence"
            ? `${distinct} distinct focused activities were correct, including delayed retrieval at least one day later. New mistakes can change this status.`
            : `${positive.length} focused correct and ${negative.length} focused incorrect attempt${direct.length === 1 ? "" : "s"}; more independent, delayed practice is needed.`;
    return {
      skillId: skill.id,
      state,
      reason,
      directCorrect: positive.length,
      directIncorrect: negative.length,
      partial,
      partialCorrect,
      partialIncorrect,
      recentCombinedMiss,
      dueAt,
      dueReason,
      lastReviewedAt: reviewed.at(-1)?.at,
    };
  });
}
export type Recommendation = {
  skillId: string;
  reason: string;
  href: string;
  activityId: string;
  priority: number;
};
export function recommend(records: Evidence[], now: number): Recommendation[] {
  const safeNow = Number.isFinite(now) ? now : 0;
  const diagnoses = diagnose(records, safeNow);
  const byId = Object.fromEntries(diagnoses.map((d) => [d.skillId, d]));
  const recommendations = diagnoses.map((diagnosis, index) => {
    const skill = skills[index];
    const prerequisite = skill.prerequisites.find(
      (id) => byId[id]?.state === "Needs review",
    );
    const due = diagnosis.dueAt && Date.parse(diagnosis.dueAt) <= safeNow;
    const priority =
      diagnosis.state === "Needs review" || diagnosis.recentCombinedMiss
        ? 0
        : due
          ? 1
          : prerequisite
            ? 2
            : diagnosis.state === "Not yet assessed"
              ? 3
              : 4;
    const related = records.filter(
      (r) =>
        validEvidence(r) &&
        activityById[r.activityId].skillIds.includes(skill.id) &&
        Date.parse(r.at) <= safeNow + 5 * 60_000,
    );
    const unseen = [...related].map((r) => r.activityId);
    const choice =
      Object.values(activityById).find(
        (a) =>
          a.source === "retrieval" &&
          a.skillIds.length === 1 &&
          a.skillIds[0] === skill.id &&
          !unseen.includes(a.id),
      ) ??
      Object.values(activityById).find(
        (a) => a.source === "retrieval" && a.skillIds.includes(skill.id),
      );
    return {
      skillId: skill.id,
      priority,
      activityId: choice?.id ?? "",
      href: choice?.href ?? skill.reviewHref,
      reason:
        priority === 0
          ? `Recent incorrect answer: ${diagnosis.reason}`
          : priority === 1
            ? `Scheduled review is due after earlier success. ${diagnosis.reason}`
            : priority === 2
              ? `Review prerequisite ${skills.find((s) => s.id === prerequisite)?.title} while working on ${skill.title}.`
              : priority === 3
                ? `Try a first focused check: ${diagnosis.reason}`
                : `Continue with another ${skill.title} activity.`,
    };
  });
  return recommendations.sort(
    (a, b) =>
      a.priority - b.priority ||
      skills.findIndex((s) => s.id === a.skillId) -
        skills.findIndex((s) => s.id === b.skillId),
  );
}
