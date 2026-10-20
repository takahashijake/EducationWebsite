import type { Question } from "@/content/types";
export function evaluateAnswer(question: Question, answer: number): boolean {
  return (
    Number.isInteger(answer) &&
    answer >= 0 &&
    answer < question.options.length &&
    answer === question.correctIndex
  );
}
