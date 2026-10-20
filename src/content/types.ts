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
  demonstration: { kind: "types" | "binary" | "complexity"; caption: string };
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
