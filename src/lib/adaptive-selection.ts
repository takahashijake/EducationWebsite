import {
  adaptiveFamilies,
  adaptiveSkillIds,
  generateAdaptiveInstance,
  type AdaptiveInstance,
} from "@/content/adaptive-families";
import { skills } from "@/content/learning-catalog";
import { validAdaptiveInstanceId } from "./adaptive-session";
import {
  diagnose,
  recommend,
  validEvidence,
  type Evidence,
} from "./learning-evidence";

export type AdaptiveSelection = {
  instance: AdaptiveInstance;
  skillId: string;
  reason: string;
  priority: number;
};
export type SelectionInput = {
  records: Evidence[];
  now: number;
  seed: number;
  recent?: readonly string[];
  manualSkill?: string;
  currentSkill?: string;
};
const supported = new Set(adaptiveSkillIds);
const validNow = (now: number) => (Number.isFinite(now) && now >= 0 ? now : 0);
const safeInstance = (id: string, revision: number, seed: number) => {
  try {
    return generateAdaptiveInstance(id, revision, seed);
  } catch {
    return null;
  }
};

/** A related published skill; dependents introduce transfer, prerequisites support review. */
export function relatedAdaptiveSkill(skillId: string): string | undefined {
  const skill = skills.find((item) => item.id === skillId);
  if (!skill) return undefined;
  return (
    skills.find(
      (item) => item.prerequisites.includes(skillId) && supported.has(item.id),
    )?.id ?? skill.prerequisites.find((id) => supported.has(id))
  );
}

/** Reuses V0.5's diagnosis priority and due dates; only family choice is new. */
export function selectAdaptiveProblem(
  input: SelectionInput,
): AdaptiveSelection | null {
  const records = Array.isArray(input.records) ? input.records : [];
  const recent = Array.isArray(input.recent)
    ? input.recent.filter(validAdaptiveInstanceId).slice(-32)
    : [];
  const { manualSkill, currentSkill } = input;
  if (
    !Number.isSafeInteger(input.seed) ||
    input.seed < 0 ||
    input.seed > 0x7fffffff
  )
    return null;
  const now = validNow(input.now);
  const eligible = records.filter(
    (entry) => validEvidence(entry) && Date.parse(entry.at) <= now + 5 * 60_000,
  );
  const recommendations = recommend(eligible, now).filter((item) =>
    supported.has(item.skillId),
  );
  if (!recommendations.length) return null;
  let recommendation = recommendations[0];
  if (manualSkill && supported.has(manualSkill))
    recommendation = recommendations.find(
      (item) => item.skillId === manualSkill,
    )!;
  else if (
    currentSkill &&
    supported.has(currentSkill) &&
    recommendation.priority > 1
  )
    recommendation = recommendations.find(
      (item) => item.skillId === currentSkill,
    )!;
  const diagnoses = diagnose(eligible, now);
  const diagnosis = diagnoses.find(
    (item) => item.skillId === recommendation.skillId,
  )!;
  const prereq = skills
    .find((item) => item.id === recommendation.skillId)
    ?.prerequisites.find((id) =>
      diagnoses.some(
        (entry) => entry.skillId === id && entry.state === "Needs review",
      ),
    );
  const familyOptions = adaptiveFamilies.filter(
    (item) => item.skillId === recommendation.skillId,
  );
  if (!familyOptions.length) return null;
  const last = recent.at(-1) ?? "";
  const ranked = [...familyOptions].sort((a, b) => {
    const count = (id: string) =>
      recent.filter((value) => value.startsWith(`adaptive-${id}:`)).length;
    const score = (id: string) =>
      count(id) * 2 + Number(last.startsWith(`adaptive-${id}:`));
    return score(a.id) - score(b.id) || a.id.localeCompare(b.id);
  });
  let instance: AdaptiveInstance | null = null;
  for (const family of ranked) {
    for (let offset = 0; offset < 64; offset++) {
      const candidate = safeInstance(
        family.id,
        family.revision,
        (input.seed + offset) & 0x7fffffff,
      );
      if (candidate && !recent.includes(candidate.id)) {
        instance = candidate;
        break;
      }
    }
    if (instance) break;
  }
  // A bounded recent list normally leaves unseen variants; if it does not, reuse the oldest.
  instance ??= safeInstance(ranked[0].id, ranked[0].revision, input.seed);
  if (!instance) return null;
  const skillTitle =
    skills.find((item) => item.id === recommendation.skillId)?.title ??
    recommendation.skillId;
  const reason =
    manualSkill && supported.has(manualSkill)
      ? `You chose ${skillTitle}. This is a fresh focused variation.`
      : diagnosis.recentCombinedMiss
        ? `A recent combined question involved ${skillTitle}. It does not isolate the cause, so try this focused check.`
        : diagnosis.state === "Needs review"
          ? `A recent focused ${skillTitle.toLowerCase()} answer was incorrect. Try a new variation after reviewing the explanation.`
          : diagnosis.dueAt && Date.parse(diagnosis.dueAt) <= now
            ? `A scheduled ${skillTitle.toLowerCase()} review is due.`
            : prereq
              ? `${skills.find((item) => item.id === prereq)?.title} needs review and supports ${skillTitle}.`
              : diagnosis.state === "Not yet assessed"
                ? `There is no focused ${skillTitle.toLowerCase()} answer yet. Start with this authored check.`
                : `Continue ${skillTitle.toLowerCase()} practice with a different authored case.`;
  return {
    instance,
    skillId: recommendation.skillId,
    reason,
    priority: recommendation.priority,
  };
}
