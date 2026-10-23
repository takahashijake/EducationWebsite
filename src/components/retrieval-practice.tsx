"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { retrievalQuestions } from "@/content/learning-catalog";
import { topics, topicHref } from "@/content/curriculum";
import { makeEvidence } from "@/lib/learning-evidence";
import { useLearningEvidence } from "./use-learning-evidence";
export function RetrievalPractice({ initialId }: { initialId?: string }) {
  const { evidence, record, ready, storageError } = useLearningEvidence();
  const [selectedId, setSelectedId] = useState(
    initialId && retrievalQuestions.some((q) => q.id === initialId)
      ? initialId
      : retrievalQuestions[0].id,
  );
  const [answer, setAnswer] = useState<number>();
  const [submitted, setSubmitted] = useState(false);
  const feedback = useRef<HTMLDivElement>(null);
  const firstChoice = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (submitted) feedback.current?.focus();
  }, [submitted]);
  const question = retrievalQuestions.find((q) => q.id === selectedId)!;
  const seen = useMemo(
    () => new Set(evidence.map((entry) => entry.activityId)),
    [evidence],
  );
  const topic = topics.find((item) => item.id === question.topicId)!;
  function choose(id: string) {
    setSelectedId(id);
    setAnswer(undefined);
    setSubmitted(false);
  }
  return (
    <div className="retrieval-practice">
      <label className="editor-label">
        Choose a question
        <select
          value={selectedId}
          onChange={(event) => choose(event.target.value)}
        >
          {retrievalQuestions.map((item) => (
            <option key={item.id} value={item.id}>
              {topics.find((topic) => topic.id === item.topicId)?.title}:{" "}
              {item.prompt} {seen.has(item.id) ? "(seen)" : "(new)"}
            </option>
          ))}
        </select>
      </label>
      <p>
        {seen.has(question.id)
          ? "You have tried this question before. Retrying it counts as practice on a seen item; choose a new item for independent evidence."
          : "This is a new question for your profile."}
      </p>
      <form
        className="knowledge-check"
        onSubmit={(event) => {
          event.preventDefault();
          if (answer === undefined || submitted || !ready) return;
          setSubmitted(true);
          record([
            makeEvidence(
              question.id,
              answer === question.correctIndex,
              crypto.randomUUID(),
            ),
          ]);
        }}
      >
        <fieldset>
          <legend>{question.prompt}</legend>
          {question.source && (
            <pre tabIndex={0}>
              <code>{question.source}</code>
            </pre>
          )}
          <div className="quiz-options">
            {question.options.map((option, index) => (
              <label key={index} className="quiz-option">
                <input
                  ref={index === 0 ? firstChoice : undefined}
                  type="radio"
                  name={question.id}
                  checked={answer === index}
                  disabled={submitted}
                  onChange={() => setAnswer(index)}
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>
        {submitted ? (
          <div ref={feedback} tabIndex={-1} role="status">
            <strong>
              {answer === question.correctIndex ? "Correct." : "Not quite."}
            </strong>{" "}
            {question.explanation}
            <p>
              <Link href={topicHref(topic)}>Review {topic.title} →</Link>
            </p>
          </div>
        ) : (
          <button className="button" disabled={answer === undefined || !ready}>
            Check answer
          </button>
        )}
      </form>
      <div className="playground-actions">
        <button
          type="button"
          onClick={() => {
            setAnswer(undefined);
            setSubmitted(false);
            requestAnimationFrame(() => firstChoice.current?.focus());
          }}
        >
          Retry this question
        </button>
        <button
          type="button"
          onClick={() => {
            const next =
              retrievalQuestions.find(
                (item) =>
                  !seen.has(item.id) &&
                  item.topicId === question.topicId &&
                  item.id !== question.id,
              ) ??
              retrievalQuestions.find(
                (item) => !seen.has(item.id) && item.id !== question.id,
              ) ??
              retrievalQuestions.find((item) => item.id !== question.id)!;
            choose(next.id);
            requestAnimationFrame(() => firstChoice.current?.focus());
          }}
        >
          Try another question
        </button>
      </div>
      {storageError && (
        <p role="alert">
          Browser storage is unavailable. Evidence is kept for this session
          only.
        </p>
      )}
    </div>
  );
}
