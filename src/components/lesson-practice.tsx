"use client";
import { useState } from "react";
import Link from "next/link";
import type { Lesson } from "@/content/types";
import { PracticeExercise } from "./practice-exercise";
import { KnowledgeCheck } from "./knowledge-check";
import { lessonNeighbors, topics, topicHref } from "@/content/curriculum";
import { recommend } from "@/lib/learning-evidence";
import { useLearningEvidence } from "./use-learning-evidence";

export function LessonPractice({ lesson }: { lesson: Lesson }) {
  const { evidence, ready: evidenceReady } = useLearningEvidence();
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [quiz, setQuiz] = useState<boolean[]>();
  const [now] = useState(() => Date.now());
  const exercises = lesson.exercises ?? [];
  const total = exercises.length + lesson.questions.length;
  const answered = Object.keys(results).length + (quiz?.length ?? 0);
  const correct =
    Object.values(results).filter(Boolean).length +
    (quiz?.filter(Boolean).length ?? 0);
  const topic = topics.find((item) => item.id === lesson.topicId)!;
  const nextTopic = lessonNeighbors(topic).next;
  const recommendation =
    evidenceReady && answered > 0 && evidence.length > 0
      ? recommend(evidence, now)[0]
      : undefined;
  const nextHref =
    recommendation?.href ??
    (nextTopic ? topicHref(nextTopic) : "/projects/number-guessing");
  const nextReason =
    recommendation?.reason ??
    (nextTopic
      ? `Continue with the published ${nextTopic.title} lesson; this lesson's checks are limited evidence.`
      : "Apply published concepts in the guided project; lesson completion is reading progress.");
  return (
    <>
      {!!exercises.length && (
        <section id="practice">
          <h2>Predict program behavior</h2>
          <p>
            Trace the values on paper before choosing an answer. For a failure,
            explain the cause before choosing a repair.
          </p>
          {exercises.map((exercise) => (
            <PracticeExercise
              key={exercise.id}
              exercise={exercise}
              onResult={(result) =>
                setResults((current) => {
                  const next = { ...current };
                  if (result === undefined) delete next[exercise.id];
                  else next[exercise.id] = result;
                  return next;
                })
              }
            />
          ))}
        </section>
      )}
      <section id="knowledge-check">
        <span className="eyebrow">PAUSE & PRACTICE</span>
        <h2>Check your understanding</h2>
        <KnowledgeCheck questions={lesson.questions} onResult={setQuiz} />
      </section>
      <section
        className="understanding-summary"
        aria-label="Understanding summary"
      >
        <h2>Your understanding this visit</h2>
        <p role="status">
          {answered} of {total} checks attempted · {correct} correct.
          {answered === 0
            ? " Try the checks to gather evidence of your understanding."
            : correct === total
              ? " All checks are correct. Explain the reasoning without hints, then apply it in a project."
              : " Review the explanations and retry the missed or remaining checks."}
        </p>
        <p>
          These fixed questions provide limited evidence; they do not establish
          mastery. Your submitted knowledge checks create local learning
          evidence. Marking a lesson complete records your reading progress
          separately.
        </p>
        <p>
          <Link href="/learning">
            View learning insights and targeted practice →
          </Link>
        </p>
        <p className="next-guidance">
          <strong>Recommended next:</strong> {nextReason}{" "}
          <Link className="button secondary" href={nextHref}>
            {recommendation
              ? "Start recommended practice"
              : nextTopic
                ? `Continue to ${nextTopic.title}`
                : "Try the guided project"}{" "}
            →
          </Link>
        </p>
        {correct < total && (
          <a href="#understanding">Revisit the explanation and demonstration</a>
        )}
      </section>
    </>
  );
}
