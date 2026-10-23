import type { CodingExercise } from "./coding-types";
import type { Question } from "./types";

export type ProjectMilestone = {
  coding?: CodingExercise;
  id: string;
  title: string;
  goal: string;
  connections: { topicId: string; explanation: string }[];
  starter: string;
  expectedBehavior: string;
  hints: string[];
  solution: string;
  explanation: string;
  tests: { label: string; code: string }[]; // Trusted, authored Python assertions; displayed, never executed in-browser.
  question: Question;
  checklist: { id: string; text: string }[];
};
export type GuidedProject = {
  id: string;
  slug: string;
  title: string;
  introduction: string[];
  objectives: string[];
  prerequisites: string[];
  milestones: ProjectMilestone[];
  reference: string;
  referenceExplanation: string;
  reflections: string[];
};
