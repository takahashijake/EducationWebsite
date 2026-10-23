"use client";
import { useState } from "react";
import Link from "next/link";
import type { Lesson } from "@/content/types";
import { PracticeExercise } from "./practice-exercise";
import { KnowledgeCheck } from "./knowledge-check";

export function LessonPractice({ lesson }: { lesson: Lesson }) {
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [quiz, setQuiz] = useState<boolean[]>();
  const exercises = lesson.exercises ?? [];
  const total = exercises.length + lesson.questions.length;
  const answered = Object.keys(results).length + (quiz?.length ?? 0);
  const correct =
    Object.values(results).filter(Boolean).length +
    (quiz?.filter(Boolean).length ?? 0);
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
        {correct < total && (
          <a href="#understanding">Revisit the explanation and demonstration</a>
        )}
      </section>
    </>
  );
}
