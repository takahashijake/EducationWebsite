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
  /** Authored reference, shown after the learner runs public checks. */
  referenceSolution?: string;
  demonstrationInput?: string;
  tests: CodingTest[];
  explanation: string;
  reflection: string;
  conceptIds: string[];
  /** Bump when authored checks change meaning; conceptIds remain topic-level IDs. */
  revision?: number;
  hints?: string[];
};
