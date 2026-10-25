"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  adaptiveSkillIds,
  evaluateAdaptiveAnswer,
} from "@/content/adaptive-families";
import { skills } from "@/content/learning-catalog";
import { SESSION_LENGTH } from "@/lib/adaptive-session";
import {
  relatedAdaptiveSkill,
  selectAdaptiveProblem,
  type AdaptiveSelection,
} from "@/lib/adaptive-selection";
import { diagnose, makeEvidence } from "@/lib/learning-evidence";
import { useAdaptiveSession } from "./use-adaptive-session";
import { useLearningEvidence } from "./use-learning-evidence";

export function AdaptivePractice({ initialSkill }: { initialSkill?: string }) {
  const {
    evidence,
    ready: evidenceReady,
    record,
    storageError: evidenceStorageError,
  } = useLearningEvidence();
  const {
    store,
    ready: sessionReady,
    storageError: sessionStorageError,
    present,
    submit,
    restart,
  } = useAdaptiveSession();
  const [manualSkill, setManualSkill] = useState(
    adaptiveSkillIds.includes(initialSkill ?? "") ? initialSkill! : "",
  );
  const [selection, setSelection] = useState<AdaptiveSelection | null>(null);
  const [selectionAttempted, setSelectionAttempted] = useState(false);
  const [answer, setAnswer] = useState<number>();
  const [submitted, setSubmitted] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [logicalNow, setLogicalNow] = useState(() => Date.now());
  const attempted = useRef(false);
  const feedback = useRef<HTMLDivElement>(null);
  const firstChoice = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (
      !evidenceReady ||
      !sessionReady ||
      selection ||
      selectionAttempted ||
      store.session.total >= SESSION_LENGTH
    )
      return;
    const frame = requestAnimationFrame(() => {
      setSelection(
        selectAdaptiveProblem({
          records: evidence,
          now: logicalNow,
          seed: store.counter,
          recent: store.recent,
          manualSkill,
        }),
      );
      setSelectionAttempted(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [
    evidenceReady,
    sessionReady,
    selection,
    selectionAttempted,
    store.counter,
    store.recent,
    store.session.total,
    evidence,
    manualSkill,
    logicalNow,
  ]);
  useEffect(() => {
    if (submitted) feedback.current?.focus();
  }, [submitted]);
  if (!evidenceReady || !sessionReady)
    return <p role="status">Loading local practice…</p>;

  const problem = selection?.instance;
  const diagnoses = diagnose(evidence, logicalNow);
  const skill = problem
    ? skills.find((item) => item.id === problem.skillId)
    : undefined;
  const prerequisite =
    skill?.prerequisites
      .map((id) => skills.find((item) => item.id === id))
      .find(
        (item) =>
          item &&
          diagnoses.some(
            (entry) =>
              entry.skillId === item.id && entry.state === "Needs review",
          ),
      ) ??
    skill?.prerequisites
      .map((id) => skills.find((item) => item.id === id))
      .find(Boolean);
  const evaluation =
    problem && answer !== undefined
      ? evaluateAdaptiveAnswer(problem, answer)
      : null;
  const correct = evaluation?.correct === true;
  const independentCorrect = correct && hintLevel === 0;
  const related = problem ? relatedAdaptiveSkill(problem.skillId) : undefined;

  function advance(
    mode: "related" | "recommended" | "variation" | "manual",
    requested?: string,
  ) {
    const nextStore = problem ? present(problem.id) : store;
    const override =
      mode === "related" || mode === "manual"
        ? requested
        : mode === "variation"
          ? problem?.skillId
          : undefined;
    const currentTime = Date.now();
    setLogicalNow(currentTime);
    const next = selectAdaptiveProblem({
      records: evidence,
      now: currentTime,
      seed: nextStore.counter,
      recent: nextStore.recent,
      manualSkill: override,
      currentSkill: mode === "variation" ? problem?.skillId : undefined,
    });
    setSelection(next);
    setSelectionAttempted(true);
    setAnswer(undefined);
    setSubmitted(false);
    setHintLevel(0);
    attempted.current = false;
    if (mode === "recommended") setManualSkill("");
    if (mode === "related" || mode === "manual") setManualSkill(override ?? "");
    requestAnimationFrame(() => firstChoice.current?.focus());
  }
  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (
      !problem ||
      !evaluation ||
      attempted.current ||
      store.session.total >= SESSION_LENGTH
    )
      return;
    attempted.current = true;
    setSubmitted(true);
    const outcome = correct
      ? hintLevel > 0
        ? "assisted-correct"
        : "independent-correct"
      : "incorrect";
    if (
      submit(problem.id, problem.skillId, outcome, hintLevel > 0) &&
      (outcome === "independent-correct" || outcome === "incorrect")
    )
      record([
        makeEvidence(
          `adaptive-${problem.familyId}`,
          outcome === "independent-correct",
          crypto.randomUUID(),
        ),
      ]);
  }
  const session = store.session;
  const weak = diagnoses.find(
    (item) =>
      session.skills.includes(item.skillId) && item.state === "Needs review",
  );
  return (
    <div className="adaptive-practice">
      <section className="insight-panel" aria-label="Practice controls">
        <p>
          Session: {session.total} of {SESSION_LENGTH} submitted problems. A
          hint-assisted correct answer stays practice, not independent positive
          evidence.
        </p>
        <label className="editor-label" htmlFor="adaptive-skill">
          Choose a concept
        </label>
        <select
          id="adaptive-skill"
          value={manualSkill}
          onChange={(event) => {
            const value = event.target.value;
            setManualSkill(value);
            if (session.total < SESSION_LENGTH)
              advance(value ? "manual" : "recommended", value || undefined);
          }}
        >
          <option value="">Follow recommendation</option>
          {adaptiveSkillIds.map((id) => (
            <option key={id} value={id}>
              {skills.find((item) => item.id === id)?.title}
            </option>
          ))}
        </select>
        {selection && (
          <p>
            <strong>Why this problem:</strong> {selection.reason}
          </p>
        )}
      </section>
      {!problem && session.total < SESSION_LENGTH && selectionAttempted && (
        <section className="insight-panel" role="status">
          <h2>No generated problem is available right now</h2>
          <p>
            Choose another concept or use an authored fixed retrieval question.
          </p>
          <Link href="/practice/retrieval">Open retrieval practice →</Link>
        </section>
      )}
      {!problem && session.total < SESSION_LENGTH && !selectionAttempted && (
        <p role="status">Preparing a focused problem…</p>
      )}
      {problem && (
        <section
          className="insight-panel"
          aria-labelledby="adaptive-question-title"
        >
          <p className="eyebrow">
            {skill?.title} · {problem.difficulty}
          </p>
          <h2 id="adaptive-question-title">{problem.prompt}</h2>
          <pre tabIndex={0}>
            <code>{problem.context}</code>
          </pre>
          <form onSubmit={handleSubmit}>
            <fieldset disabled={submitted || session.total >= SESSION_LENGTH}>
              <legend>Select one answer</legend>
              <div className="quiz-options">
                {problem.options.map((option, index) => (
                  <label className="quiz-option" key={`${problem.id}-${index}`}>
                    <input
                      ref={index === 0 ? firstChoice : undefined}
                      type="radio"
                      name={problem.id}
                      checked={answer === index}
                      onChange={() => setAnswer(index)}
                    />
                    {option.text}
                  </label>
                ))}
              </div>
            </fieldset>
            {!submitted && (
              <div className="playground-actions">
                <button
                  className="button"
                  disabled={
                    answer === undefined || session.total >= SESSION_LENGTH
                  }
                >
                  Check answer
                </button>
                {hintLevel < 2 && (
                  <button
                    type="button"
                    onClick={() => setHintLevel((level) => level + 1)}
                  >
                    Show {hintLevel === 0 ? "a hint" : "a reasoning step"}
                  </button>
                )}
              </div>
            )}
          </form>
          {!submitted && hintLevel > 0 && (
            <div className="adaptive-hint">
              {problem.hints.slice(0, hintLevel).map((hint, index) => (
                <p key={index}><strong>Hint {index + 1}:</strong> {hint}</p>
              ))}
            </div>
          )}
          {submitted && answer !== undefined && (
            <div
              ref={feedback}
              tabIndex={-1}
              role="status"
              className="adaptive-feedback"
            >
              <h3>{correct ? "Correct answer." : "Review this boundary."}</h3>
              <p>
                Your choice: <strong>{evaluation?.chosen}</strong>. Correct
                answer: <strong>{evaluation?.correctAnswer}</strong>.
              </p>
              {!correct && evaluation?.misconception && (
                <p>
                  <strong>Authored note for this choice:</strong>{" "}
                  {evaluation.misconception}
                </p>
              )}
              <p>{problem.explanation}</p>
              {!correct && (
                <p>
                  <strong>Worked step:</strong> {problem.workedStep}
                </p>
              )}
              <p>
                <Link href={problem.reviewHref}>
                  Review the lesson explanation →
                </Link>
                {prerequisite && (
                  <>
                    {" "}
                    ·{" "}
                    <Link href={prerequisite.reviewHref}>
                      Review prerequisite: {prerequisite.title} →
                    </Link>
                  </>
                )}
              </p>
              {correct && !independentCorrect && (
                <p>
                  This correct response followed a hint, so it was not recorded
                  as independent positive evidence.
                </p>
              )}
              {!correct && (
                <p>
                  The wrong first submission was recorded as focused practice
                  evidence; it does not prove a particular misconception.
                </p>
              )}
            </div>
          )}
          {session.total < SESSION_LENGTH && (
            <div className="playground-actions">
              <button type="button" onClick={() => advance("variation")}>
                New related variation
              </button>
              <button type="button" onClick={() => advance("recommended")}>
                Next recommended problem
              </button>
              {submitted && independentCorrect && related && (
                <button
                  type="button"
                  onClick={() => advance("related", related)}
                >
                  Try related concept:{" "}
                  {skills.find((item) => item.id === related)?.title}
                </button>
              )}
            </div>
          )}
        </section>
      )}
      {session.total >= SESSION_LENGTH && (
        <section
          className="insight-panel"
          aria-label="Session summary"
          role="status"
        >
          <h2>Session summary</h2>
          <p>
            You submitted {session.total} focused problems:{" "}
            {session.independentCorrect} correct independently,{" "}
            {session.assistedCorrect} correct with help, and {session.incorrect}{" "}
            incorrect. Hints were used on {session.hinted} problems.
          </p>
          <p>
            {weak
              ? `${skills.find((item) => item.id === weak.skillId)?.title} may benefit from another review.`
              : "These observations guide the next practice choice; they do not establish mastery."}
          </p>
          <button
            type="button"
            onClick={() => {
              restart();
              setSelection(null);
              setSelectionAttempted(false);
              attempted.current = false;
              setSubmitted(false);
              setAnswer(undefined);
              setHintLevel(0);
            }}
          >
            Start another five-question session
          </button>
          <p>
            <Link href="/learning">View Learning Insights →</Link>
          </p>
        </section>
      )}
      {(sessionStorageError || evidenceStorageError) && (
        <p role="alert">
          Browser storage is unavailable. Practice remains usable in this tab
          for this session.
        </p>
      )}
    </div>
  );
}
