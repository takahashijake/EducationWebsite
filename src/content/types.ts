import type { CodingExercise } from "./coding-types";
export type Section = {
  id: string;
  title: string;
  description: string;
  order: number;
  icon:
    | "code"
    | "logic"
    | "layers"
    | "route"
    | "cpu"
    | "terminal"
    | "network"
    | "database";
};
export type Topic = {
  id: string;
  sectionId: string;
  slug: string;
  title: string;
  description: string;
  order: number;
  status: "available" | "planned";
  prerequisites?: string[];
};
export type Question = {
  source?: string;
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};
export type Lesson = {
  topicId: string;
  minutes: number;
  objectives: string[];
  introduction: string[];
  concept: { title: string; paragraphs: string[] };
  demonstration: Demonstration;
  demonstrations?: Demonstration[];
  sections?: { title: string; paragraphs: string[]; code?: string }[];
  relatedTopicIds?: string[];
  exercises?: PracticeExercise[];
  codingExercises?: CodingExercise[];
  nextStep?: string;
  workedExample: { title: string; introduction: string; steps: string[] };
  code: {
    language: string;
    title: string;
    source: string;
    explanation: string;
  };
  misconceptions: { belief: string; correction: string }[];
  takeaways: string[];
  questions: Question[];
};

export type TraceValue = string | number | boolean | null;
export type TraceStep = {
  lines: number[]; // One-based source lines; state follows the explained action, possibly part of a line.
  explanation: string;
  variables: { name: string; value: TraceValue; scope: string }[];
  output: string[]; // Complete output so far, not a delta.
  detail?: string; // Branch decision, iteration, call, or return.
  frames?: TraceFrame[]; // Oldest caller first; variables are matched by scope.
};
export type TraceFrame = {
  id: string;
  name: string;
  scope: string;
  status: "active" | "suspended" | "returning";
  resumeLine?: number;
  returnValue?: TraceValue;
};
export type TraceProgram = {
  source: string;
  steps: TraceStep[];
  result: string;
};
export type CodeTrace = TraceProgram & {
  kind: "trace";
  title: string;
  caption: string;
  defaultLabel?: string;
  inputLabel?: string;
  scenarios?: (TraceProgram & { id: string; label: string })[];
};
export type Demonstration =
  | { kind: "types" | "binary" | "complexity"; caption: string }
  | { kind: "linked-list"; caption: string }
  | { kind: "stacks-queues"; caption: string }
  | { kind: "graph-traversal"; caption: string }
  | { kind: "weighted-dijkstra"; caption: string }
  | { kind: "bellman-ford"; caption: string }
  | { kind: "tree-bst"; caption: string }
  | CodeTrace
  | { kind: "sorting-comparison"; caption: string }
  | {
      kind: "algorithm";
      algorithm:
        | "traversal"
        | "linear"
        | "binary-search"
        | "bubble-sort"
        | "selection-sort"
        | "insertion-sort";
      caption: string;
    };
export type PracticeExercise = Question & { source: string };

export type AssessmentQuestion = PracticeExercise & { topicIds: string[] };
export type Assessment = {
  id: string;
  title: string;
  questions: AssessmentQuestion[];
};
