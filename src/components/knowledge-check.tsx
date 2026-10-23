"use client";
import { useState } from "react";
import type { Question } from "@/content/types";
import Link from "next/link";
import { topics, topicHref } from "@/content/curriculum";
import { evaluateAnswer, scoreQuestions } from "@/lib/quiz";
import { Icon } from "./icon";
import { activityById } from "@/content/learning-catalog";
import { makeEvidence } from "@/lib/learning-evidence";
import { useLearningEvidence } from "./use-learning-evidence";
export function KnowledgeCheck({
  questions,
  onResult,
  reviewTopics = {},
  submitLabel = "Check answers",
  retryLabel = "Try again",
}: {
  questions: Question[];
  onResult?: (results: boolean[] | undefined) => void;
  reviewTopics?: Record<string, string[]>;
  submitLabel?: string;
  retryLabel?: string;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const { record } = useLearningEvidence();
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
        if (allAnswered) {
          setSubmitted(true);
          const attempt = crypto.randomUUID();
          const observations = questions
            .filter((question) => activityById[question.id])
            .map((question) =>
              makeEvidence(
                question.id,
                evaluateAnswer(question, answers[question.id]),
                `${attempt}-${question.id}`,
              ),
            );
          if (observations.length) record(observations);
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
                  const topic = topics.find((t) => t.id === id);
                  return topic ? (
                    <Link
                      className="review-link"
                      key={id}
                      href={topicHref(topic)}
                    >
                      Review {topic.title}
                    </Link>
                  ) : null;
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
                  .map((id) => topics.find((t) => t.id === id)?.title)
                  .join(", ")}
                .
              </p>
            )}
            <p>
              <Link href="/learning">
                View your learning insights and next practice →
              </Link>
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
