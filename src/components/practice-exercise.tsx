"use client";
import { useId, useState } from "react";
import type { PracticeExercise as Exercise } from "@/content/types";
import { evaluateAnswer } from "@/lib/quiz";
export function PracticeExercise({
  exercise,
  onResult,
  completionNotice = "Practice attempts do not mark this lesson complete.",
}: {
  exercise: Exercise;
  onResult?: (correct: boolean) => void;
  completionNotice?: string;
}) {
  const id = useId();
  const [answer, setAnswer] = useState<number>();
  const [submitted, setSubmitted] = useState(false);
  const correct = answer !== undefined && evaluateAnswer(exercise, answer);
  return (
    <form
      className="practice-exercise"
      onSubmit={(event) => {
        event.preventDefault();
        if (answer !== undefined) {
          setSubmitted(true);
          onResult?.(evaluateAnswer(exercise, answer));
        }
      }}
    >
      <pre tabIndex={0} aria-label="Python program to predict">
        <code>{exercise.source}</code>
      </pre>
      <fieldset>
        <legend>{exercise.prompt}</legend>
        <div className="quiz-options">
          {exercise.options.map((option, index) => (
            <label className="quiz-option" key={option}>
              <input
                type="radio"
                name={id}
                checked={answer === index}
                disabled={submitted}
                onChange={() => setAnswer(index)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {submitted && (
        <p
          role="status"
          className={`answer-feedback ${correct ? "correct" : "incorrect"}`}
        >
          <strong>{correct ? "Correct." : "Not quite."}</strong>{" "}
          {exercise.explanation}
        </p>
      )}
      {submitted ? (
        <button
          className="button secondary"
          type="button"
          onClick={() => {
            setAnswer(undefined);
            setSubmitted(false);
            onResult?.(false);
          }}
        >
          Retry exercise
        </button>
      ) : (
        <button
          className="button"
          type="submit"
          disabled={answer === undefined}
        >
          Check prediction
        </button>
      )}
      <p className="quiz-intro">{completionNotice}</p>
    </form>
  );
}
