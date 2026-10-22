export type CodingTest = {
  id: string;
  label: string;
  code: string;
  expectedBehavior: string;
  guidance: string;
  conceptIds: string[];
};
export type CodingExercise = {
  id: string;
  topicId: string;
  title: string;
  instructions: string[];
  starter: string;
  expectedBehavior: string;
  demonstrationInput?: string;
  tests: CodingTest[];
  explanation: string;
  reflection: string;
  conceptIds: string[];
};
