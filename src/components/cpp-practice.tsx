"use client";
import Link from "next/link";
import { useState } from "react";
import {
  cppExercises,
  exercisesForTopic,
  type CodingExercise,
} from "@/content/cpp-exercises";
import { practiceSummary } from "@/lib/practice-progress";
import { CodeExample } from "./code-example";
import { CppPlayground } from "./cpp-playground";
import { useProgress } from "./progress-provider";

function ExercisePanel({ exercise }: { exercise: CodingExercise }) {
  const [open, setOpen] = useState(false);
  const { practice } = useProgress();
  const entry = practice[exercise.id];
  return (
    <details
      className="cpp-exercise"
      id={exercise.id}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>
        <span>{exercise.title}</span>
        <span className="exercise-badge">
          {entry?.completedAt
            ? "Public tests passed"
            : entry?.attempts.length
              ? "In progress"
              : "Start practice"}
        </span>
      </summary>
      <div className="exercise-body">
        <p className="eyebrow">C++17 / {exercise.difficulty}</p>
        <h3>{exercise.title}</h3>
        <ul>
          {exercise.objectives.map((objective) => (
            <li key={objective}>{objective}</li>
          ))}
        </ul>
        <p>{exercise.introduction}</p>
        <h4>Worked example</h4>
        <CodeExample
          code={{
            language: "C++17",
            title: "A related example",
            source: exercise.workedExample.source,
            explanation: exercise.workedExample.explanation,
          }}
        />
        <h4>Your task</h4>
        <p>{exercise.statement}</p>
        <p>{exercise.expectedBehavior}</p>
        {exercise.examples.map((example) => (
          <div className="example-io console-grid" key={example.id}>
            <div>
              <h4>Example input</h4>
              <pre>{example.stdin || "(empty)"}</pre>
            </div>
            <div>
              <h4>Example output</h4>
              <pre>{example.stdout}</pre>
            </div>
          </div>
        ))}
        {open && <CppPlayground exercise={exercise} />}
        <p>
          <Link href="/practice/cpp">Explore the C++ practice collection</Link>{" "}
          / <Link href="/roadmap">Return to the learning pathway</Link>
        </p>
      </div>
    </details>
  );
}
export function CppPractice({ topicId }: { topicId: string }) {
  const exercises = exercisesForTopic(topicId);
  const { practice } = useProgress();
  const summary = practiceSummary(practice, topicId);
  if (!exercises.length) return null;
  return (
    <section
      id="cpp-practice"
      aria-label="C++ programming practice"
      className="cpp-practice"
    >
      <span className="eyebrow">LEARN / PRACTICE / EXECUTE / IMPROVE</span>
      <h2>Apply this concept in C++</h2>
      <p>
        Keep the lesson open while you practice. Each activity introduces the
        C++ syntax you need and runs real code in your browser.
      </p>
      <p>
        {summary.completed} of {summary.total} exercises passed all public
        tests. Reading completion is recorded separately.
      </p>
      {exercises.map((exercise) => (
        <ExercisePanel key={exercise.id} exercise={exercise} />
      ))}
    </section>
  );
}
export function CppPracticeCollection() {
  const { practice } = useProgress();
  const summary = practiceSummary(practice);
  return (
    <div className="shell practice-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/roadmap">Roadmap</Link>
        <span>/</span>
        <span>C++ practice</span>
      </nav>
      <span className="eyebrow">PROGRAMMING FUNDAMENTALS</span>
      <h1>Learn it. Write it. Run it.</h1>
      <p className="lesson-deck">
        Eight guided C++ activities connected to your programming lessons.
      </p>
      <p>
        {summary.completed} of {summary.total} exercises passed all public
        tests. Saved in this browser, with no account needed.
      </p>
      <p>
        Start in order if C++ is new to you. Existing lessons use Python for
        explanations; each C++ activity supplies a syntax introduction and
        worked example. Arrays and strings here are introductory practice; the
        full data structures lesson remains planned.
      </p>
      <ol className="practice-collection">
        {cppExercises.map((exercise) => {
          const entry = practice[exercise.id];
          return (
            <li key={exercise.id}>
              <Link href={`/lessons/${exercise.topicId}#${exercise.id}`}>
                <strong>{exercise.title}</strong>
                <span>
                  {exercise.difficulty} /{" "}
                  {entry?.completedAt
                    ? "Public tests passed"
                    : entry?.attempts.length
                      ? "Resume practice"
                      : "Start practice"}
                </span>
              </Link>
              <p>{exercise.objectives[0]}</p>
            </li>
          );
        })}
      </ol>
      <p>
        Execution stays on your device: C++17, stdin/stdout/stderr, a 64 MiB
        program memory limit, and a 2-second execution limit per case. The first
        run downloads about 95 MB of compiler assets. No threads, C++
        exceptions, host files, networking, or third-party libraries. Tests are
        visible practice checks, not secure certification.
      </p>
      <Link href="/roadmap" className="button secondary">
        Continue the learning pathway
      </Link>
    </div>
  );
}
