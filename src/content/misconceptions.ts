import type { AdaptiveInstance } from "./adaptive-families";

export type Misconception = {
  id: string;
  revision: 1;
  skillId: string;
  familyId: string;
  description: string;
  correction: string;
  contrast: string;
  reviewHref: string;
  followUpFamilyId: string;
  followUpCaseTag: string;
};

/** An answer supports a possibility, never a diagnosis of the learner. */
export const misconceptions: Record<string, Misconception> = {
  "comparison-includes-equality": {
    id: "comparison-includes-equality",
    revision: 1,
    skillId: "comparisons",
    familyId: "comparison-policy",
    description:
      "A strict greater-than rule may have been read as including equality.",
    correction:
      "Greater than (>) excludes the boundary; at least (>=) includes it.",
    contrast:
      "If the rule is score > 10, score 10 fails and score 11 passes. With score >= 10, both pass.",
    reviewHref: "/lessons/conditionals",
    followUpFamilyId: "comparison-branch",
    followUpCaseTag: "equality-boundary",
  },
  "comparison-excludes-equality": {
    id: "comparison-excludes-equality",
    revision: 1,
    skillId: "comparisons",
    familyId: "comparison-policy",
    description: "An 'at least' rule may have been read as excluding equality.",
    correction: "At least includes the boundary, so use >= rather than >.",
    contrast:
      "If the rule is score >= 10, score 10 passes. Under score > 10, it fails; score 11 passes either way.",
    reviewHref: "/lessons/conditionals",
    followUpFamilyId: "comparison-branch",
    followUpCaseTag: "equality-boundary",
  },
};

export function possibleMisconception(
  problem: AdaptiveInstance,
  answer: number,
) {
  if (answer === problem.correctIndex || !Number.isInteger(answer)) return null;
  const id = problem.options[answer]?.misconceptionId;
  const item = id ? misconceptions[id] : undefined;
  return item &&
    item.skillId === problem.skillId &&
    item.familyId === problem.familyId &&
    item.revision === problem.revision
    ? item
    : null;
}
