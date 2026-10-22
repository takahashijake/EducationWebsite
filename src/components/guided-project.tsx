"use client";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type {
  GuidedProject as Project,
  ProjectCheckpoint as Checkpoint,
} from "@/content/types";
import {
  parseProjectProgress,
  PROJECT_PROGRESS_KEY,
  serializeProjectProgress,
} from "@/lib/project-progress";
import { PracticeExercise } from "./practice-exercise";
import { CodeTrace } from "./code-trace";

const listeners = new Set<() => void>();
let sessionRaw: string | undefined;
function notify() {
  listeners.forEach((fn) => fn());
}
function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === PROJECT_PROGRESS_KEY || event.key === null) {
      sessionRaw = undefined;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}
function snapshot() {
  if (sessionRaw !== undefined) return sessionRaw;
  try {
    return window.localStorage.getItem(PROJECT_PROGRESS_KEY);
  } catch {
    return null;
  }
}
const serverSnapshot = () => null;
function persist(ids: string[]) {
  const raw = serializeProjectProgress(ids);
  let saved = true;
  try {
    window.localStorage.setItem(PROJECT_PROGRESS_KEY, raw);
    sessionRaw = undefined;
  } catch {
    sessionRaw = raw;
    saved = false;
  }
  notify();
  return saved;
}

export function ProjectCheckpoint({
  checkpoint,
  completed,
  onToggle,
}: {
  checkpoint: Checkpoint;
  completed: boolean;
  onToggle: () => void;
}) {
  const [ready, setReady] = useState(!checkpoint.exercise);

  return (
    <section className="project-checkpoint" aria-labelledby="checkpoint-title">
      <h2 id="checkpoint-title" tabIndex={-1}>
        {checkpoint.title}
      </h2>
      {checkpoint.paragraphs.map((text) => (
        <p key={text}>{text}</p>
      ))}
      {checkpoint.source && (
        <pre tabIndex={0} aria-label="Checkpoint Python example">
          <code>{checkpoint.source}</code>
        </pre>
      )}
      {checkpoint.trace && <CodeTrace trace={checkpoint.trace} />}
      <div className="takeaways">
        <h3>Expected result</h3>
        <p>{checkpoint.expected}</p>
      </div>
      {checkpoint.exercise && (
        <PracticeExercise
          exercise={checkpoint.exercise}
          onResult={setReady}
          completionNotice="After a correct answer, use Mark checkpoint complete to record your progress."
        />
      )}
      <p>
        {checkpoint.exercise
          ? "Answer this checkpoint's choice correctly before marking it complete. You can revisit any checkpoint at any time."
          : "After your local work and review, record this checkpoint yourself."}
      </p>
      <button
        type="button"
        className="button"
        disabled={!completed && !ready}
        aria-pressed={completed}
        onClick={onToggle}
      >
        {completed ? "Checkpoint completed · Undo" : "Mark checkpoint complete"}
      </button>
    </section>
  );
}

export function GuidedProject({ project }: { project: Project }) {
  const raw = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const completed = parseProjectProgress(raw);
  const [position, setPosition] = useState(0);
  const priorPosition = useRef(0);
  useEffect(() => {
    if (priorPosition.current !== position)
      document.getElementById("checkpoint-title")?.focus();
    priorPosition.current = position;
  }, [position]);
  const [storageFailed, setStorageFailed] = useState(false);
  const current = project.checkpoints[position];
  const recommended = project.checkpoints.find(
    (c) => !completed.includes(c.id),
  );
  return (
    <>
      <div className="learning-path">
        <p role="status">
          Checkpoints completed: {completed.length} of{" "}
          {project.checkpoints.length}. Lesson completion is separate.
        </p>
        <p>
          {recommended
            ? `Recommended next checkpoint: ${recommended.title}.`
            : "All project checkpoints recorded. Review your reasoning, then try the assessment."}
        </p>
        <nav aria-label="Project checkpoints">
          <ol className="checkpoint-nav">
            {project.checkpoints.map((c, i) => (
              <li key={c.id}>
                <button
                  className="button secondary"
                  type="button"
                  aria-current={position === i ? "step" : undefined}
                  onClick={() => setPosition(i)}
                >
                  {i + 1}. {c.title} ·{" "}
                  {completed.includes(c.id) ? "Completed" : "Available"}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </div>
      <p>
        Checkpoint {position + 1} of {project.checkpoints.length}
      </p>
      <ProjectCheckpoint
        key={current.id}
        checkpoint={current}
        completed={completed.includes(current.id)}
        onToggle={() => {
          const latest = parseProjectProgress(snapshot());
          setStorageFailed(
            !persist(
              latest.includes(current.id)
                ? latest.filter((id) => id !== current.id)
                : [...latest, current.id],
            ),
          );
        }}
      />
      {storageFailed && (
        <p role="status">
          Browser storage is unavailable. Project progress is kept for this
          session only.
        </p>
      )}
      <nav className="trace-controls" aria-label="Checkpoint navigation">
        <button
          className="button secondary"
          disabled={position === 0}
          onClick={() => setPosition((p) => p - 1)}
        >
          Previous checkpoint
        </button>
        <button
          className="button secondary"
          disabled={position === project.checkpoints.length - 1}
          onClick={() => setPosition((p) => p + 1)}
        >
          Next checkpoint
        </button>
      </nav>
      <p>
        <Link
          className="review-link"
          href="/assessments/programming-fundamentals"
        >
          Take the integrated fundamentals assessment
        </Link>
      </p>
    </>
  );
}
