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
  sections?: { title: string; paragraphs: string[]; code?: string }[];
  exercises?: PracticeExercise[];
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
  lines: number[]; // One-based source lines; state is AFTER these lines execute.
  explanation: string;
  variables: { name: string; value: TraceValue; scope: string }[];
  output: string[]; // Complete output so far, not a delta.
  detail?: string; // Branch decision, iteration, call, or return.
};
export type CodeTrace = {
  kind: "trace";
  title: string;
  caption: string;
  source: string;
  steps: TraceStep[];
  result: string;
};
export type Demonstration =
  { kind: "types" | "binary" | "complexity"; caption: string } | CodeTrace;
export type PracticeExercise = Question & { source: string };
