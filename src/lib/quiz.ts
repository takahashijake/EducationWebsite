import type { Question } from "@/content/types";
export function evaluateAnswer(
  question: Question,
  answer: number | undefined,
): boolean {
  return (
    typeof answer === "number" &&
    Number.isInteger(answer) &&
    answer >= 0 &&
    answer < question.options.length &&
    answer === question.correctIndex
  );
}

export function scoreQuestions(
  questions: Question[],
  answers: Partial<Record<string, number>>,
) {
  return questions.filter((question) =>
    evaluateAnswer(question, answers[question.id]),
  ).length;
}
