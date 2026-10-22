"use client";
import { useState } from "react";
import type { Question } from "@/content/types";
import Link from "next/link";
import { topics, topicHref } from "@/content/curriculum";
import { evaluateAnswer, scoreQuestions } from "@/lib/quiz";
import { Icon } from "./icon";
export function KnowledgeCheck({
  questions,
  reviewTopics = {},
  submitLabel = "Check answers",
  retryLabel = "Try again",
}: {
  questions: Question[];
  reviewTopics?: Record<string, string[]>;
  submitLabel?: string;
  retryLabel?: string;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const allAnswered = questions.every(
    (question) => answers[question.id] !== undefined,
  );
  const score = scoreQuestions(questions, answers);
  const missedTopicIds = [
    ...new Set(
      questions
        .filter((q) => !evaluateAnswer(q, answers[q.id]))
        .flatMap((q) => reviewTopics[q.id] ?? []),
    ),
  ];
  return (
    <form
      className="knowledge-check"
      onSubmit={(event) => {
        event.preventDefault();
        if (allAnswered) setSubmitted(true);
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
          {question.source && (
            <pre tabIndex={0} aria-label="Python assessment problem">
              <code>{question.source}</code>
            </pre>
          )}
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
            <div>
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
              {!evaluateAnswer(question, answers[question.id]) &&
                reviewTopics[question.id]?.map((id) => {
                  const topic = topics.find((t) => t.id === id)!;
                  return (
                    <Link
                      className="review-link"
                      key={id}
                      href={topicHref(topic)}
                    >
                      Review {topic.title}
                    </Link>
                  );
                })}
            </div>
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
                ? "All answers correct on this attempt. Try explaining the reasoning without the choices."
                : "Review the explanations, then give it another try."}
            </p>
            {missedTopicIds.length > 0 && (
              <p>
                Suggested review:{" "}
                {missedTopicIds
                  .map((id) => topics.find((t) => t.id === id)!.title)
                  .join(", ")}
                .
              </p>
            )}
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setSubmitted(false);
                setAnswers({});
              }}
            >
              {retryLabel}
            </button>
          </>
        ) : (
          <>
            <button className="button" type="submit" disabled={!allAnswered}>
              {submitLabel} <Icon name="arrow" size={16} />
            </button>
            <span aria-live="polite">
              {allAnswered
                ? "Ready when you are."
                : `Answer all ${questions.length} questions to check.`}
            </span>
          </>
        )}
      </div>
    </form>
  );
}
