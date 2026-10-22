"use client";
import { useState } from "react";
import type { Question } from "@/content/types";
import { evaluateAnswer } from "@/lib/quiz";
import { Icon } from "./icon";
export function KnowledgeCheck({
  questions,
  onResult,
}: {
  questions: Question[];
  onResult?: (results: boolean[] | undefined) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const allAnswered = questions.every(
    (question) => answers[question.id] !== undefined,
  );
  const score = questions.filter((question) =>
    evaluateAnswer(question, answers[question.id]),
  ).length;
  return (
    <form
      className="knowledge-check"
      onSubmit={(event) => {
        event.preventDefault();
        if (allAnswered) {
          setSubmitted(true);
          onResult?.(
            questions.map((question) =>
              evaluateAnswer(question, answers[question.id]),
            ),
          );
        }
      }}
    >
      <p className="quiz-intro">
        Put your understanding to work. Choose one answer for each question,
        then check your answers.
      </p>
      {questions.map((question, index) => (
        <fieldset key={question.id}>
          <legend>
            <span>{index + 1}.</span> {question.prompt}
          </legend>
          <div className="quiz-options">
            {question.options.map((option, optionIndex) => (
              <label
                key={optionIndex}
                className={`quiz-option ${submitted && optionIndex === question.correctIndex ? "correct-option" : ""} ${submitted && optionIndex === answers[question.id] && !evaluateAnswer(question, optionIndex) ? "incorrect-option" : ""}`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={optionIndex}
                  checked={answers[question.id] === optionIndex}
                  disabled={submitted}
                  onChange={() =>
                    setAnswers({ ...answers, [question.id]: optionIndex })
                  }
                />
                <span>{option}</span>
                {submitted && optionIndex === question.correctIndex && (
                  <Icon name="check" size={16} />
                )}
              </label>
            ))}
          </div>
          {submitted && (
            <p
              className={`answer-feedback ${evaluateAnswer(question, answers[question.id]) ? "correct" : "incorrect"}`}
            >
              <strong>
                {evaluateAnswer(question, answers[question.id])
                  ? "Correct."
                  : "Not quite."}
              </strong>{" "}
              {question.explanation}
            </p>
          )}
        </fieldset>
      ))}
      <div className="quiz-footer">
        {submitted ? (
          <>
            <p role="status">
              <strong>
                {score} of {questions.length} correct.
              </strong>{" "}
              {score === questions.length
                ? "All checks are correct. Try explaining the reasoning without hints."
                : "Review the explanations, then give it another try."}
            </p>
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setSubmitted(false);
                setAnswers({});
                onResult?.(undefined);
              }}
            >
              Try again
            </button>
          </>
        ) : (
          <>
            <button className="button" type="submit" disabled={!allAnswered}>
              Check answers <Icon name="arrow" size={16} />
            </button>
            <span aria-live="polite">
              {allAnswered
                ? "Ready when you are."
                : "Answer every question to check."}
            </span>
          </>
        )}
      </div>
    </form>
  );
}
