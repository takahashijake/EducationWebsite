"use client";
import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import type { CodingExercise } from "@/content/coding-types";
import { topics, topicHref } from "@/content/curriculum";
import { PythonExecutor } from "@/lib/execution/python-executor";
import {
  SOURCE_LIMIT,
  INPUT_LIMIT,
  type ExecutionEngine,
  type ExecutionResult,
  type ExecutionState,
} from "@/lib/execution/python-types";
import { useWorkspace } from "./use-workspace";
import { activityById } from "@/content/learning-catalog";
import { makeEvidence } from "@/lib/learning-evidence";
import { useLearningEvidence } from "./use-learning-evidence";

const stateLabels: Record<ExecutionState, string> = {
  idle: "Not initialized · Python loads when you run",
  initializing: "Initializing Python…",
  ready: "Python ready",
  running: "Running Python…",
  completed: "Execution finished",
  failed: "Execution failed",
  cancelled: "Execution cancelled",
};
const resultLabels: Record<ExecutionResult["kind"], string> = {
  success: "Program completed successfully",
  "syntax-error": "Python syntax error",
  "runtime-error": "Python runtime error",
  "test-failure": "Code executed; authored checks found failures",
  "loading-error": "Python loading failed · Retry Run",
  "worker-error": "Python Worker failed · Retry Run",
  timeout: "Execution deadline exceeded",
  cancelled: "Execution stopped",
  "source-limit": "Source or input limit exceeded",
};
export function CodeLab({
  exercise,
  workspaceId,
  carryFrom,
  createEngine = () => new PythonExecutor(),
}: {
  exercise: CodingExercise;
  workspaceId: string;
  carryFrom?: { workspaceId: string; title: string };
  createEngine?: () => ExecutionEngine;
}) {
  const id = useId();
  const { record } = useLearningEvidence();
  const workspace = useWorkspace(workspaceId, exercise.starter);
  const previous = useWorkspace(carryFrom?.workspaceId, "");
  const [stdin, setStdin] = useState(exercise.demonstrationInput ?? "");
  const [deadlineMs, setDeadlineMs] = useState(3000);
  const [state, setState] = useState<ExecutionState>("idle");
  const [rawResult, setResult] = useState<ExecutionResult>();
  const [runSource, setRunSource] = useState(workspace.source);
  const result = runSource === workspace.source ? rawResult : undefined;
  const [streams, setStreams] = useState({ stdout: "", stderr: "" });
  const [tested, setTested] = useState(false);
  const [revealedHints, setRevealedHints] = useState(0);
  const [referenceViewed, setReferenceViewed] = useState(false);
  const [confirm, setConfirm] = useState<"reset" | "carry">();
  const engine = useRef<ExecutionEngine | undefined>(undefined);
  const sequence = useRef(0);
  const confirmButton = useRef<HTMLButtonElement>(null);
  const editor = useRef<HTMLTextAreaElement>(null);
  const busy =
    state === "initializing" || state === "ready" || state === "running";
  useEffect(
    () => () => {
      sequence.current++;
      engine.current?.dispose();
    },
    [],
  );
  useEffect(() => {
    if (confirm) confirmButton.current?.focus();
  }, [confirm]);
  // A cross-tab edit invalidates displayed execution evidence, without writing it back.
  useEffect(
    () => () => {
      sequence.current++;
      engine.current?.cancel();
    },
    [workspace.source],
  );
  const clearEvidence = () => {
    sequence.current++;
    engine.current?.cancel();
    setState("idle");
    setResult(undefined);
    setStreams({ stdout: "", stderr: "" });
  };
  const save = (source: string) => {
    clearEvidence();
    workspace.save(source);
  };
  const execute = async (tests: boolean) => {
    if (!workspace.ready || busy) return;
    const requestId = ++sequence.current;
    engine.current ??= createEngine();
    setResult(undefined);
    setStreams({ stdout: "", stderr: "" });
    setTested(tests);
    setRunSource(workspace.source);
    const answer = await engine.current.execute(
      {
        language: "python",
        source: workspace.source,
        stdin,
        deadlineMs,
        tests: tests
          ? exercise.tests.map(({ id, code }) => ({ id, code }))
          : [],
      },
      (event) => {
        if (sequence.current !== requestId) return;
        setState(event.state);
        if (event.stdout !== undefined || event.stderr !== undefined)
          setStreams((current) => ({
            stdout: event.stdout ?? current.stdout,
            stderr: event.stderr ?? current.stderr,
          }));
      },
    );
    if (sequence.current === requestId) {
      setResult(answer);
      setStreams({ stdout: answer.stdout, stderr: answer.stderr });
      const unique = new Map(answer.tests.map((row) => [row.id, row.status]));
      const allPassed = exercise.tests.every(
        (test) => unique.get(test.id) === "passed",
      );
      if (
        tests &&
        activityById[exercise.id] &&
        (answer.kind === "success" || answer.kind === "test-failure") &&
        (answer.kind === "success") === allPassed &&
        answer.tests.length === exercise.tests.length &&
        unique.size === exercise.tests.length &&
        exercise.tests.every((test) => unique.has(test.id)) &&
        (!allPassed || (revealedHints === 0 && !referenceViewed))
      ) {
        record([makeEvidence(exercise.id, allPassed, crypto.randomUUID())]);
      }
    }
  };
  const rows = exercise.tests.map((test) => ({
    test,
    result: result?.tests.find((row) => row.id === test.id),
  }));
  const passed = rows.filter((row) => row.result?.status === "passed").length;
  const failed = rows.filter((row) => row.result?.status === "failed").length;
  const stale = rawResult !== undefined && runSource !== workspace.source;
  return (
    <section className="code-lab" aria-labelledby={`${id}-title`}>
      <header>
        <span className="eyebrow">
          LEARN → PREDICT → WRITE → RUN → DEBUG → TEST → EXPLAIN
        </span>
        <h2 id={`${id}-title`}>{exercise.title}</h2>
      </header>
      {exercise.instructions.map((text) => (
        <p key={text}>{text}</p>
      ))}
      {!!exercise.hints?.length && (
        <div className="practice-hints">
          <button
            type="button"
            disabled={busy || revealedHints >= exercise.hints.length}
            onClick={() => setRevealedHints((count) => count + 1)}
          >
            Reveal next hint
          </button>
          {exercise.hints.slice(0, revealedHints).map((hint, index) => (
            <p key={hint}>
              Hint {index + 1}: {hint}
            </p>
          ))}
        </div>
      )}
      <p>
        <strong>Expected behavior:</strong> {exercise.expectedBehavior}
      </p>
      <label htmlFor={`${id}-source`}>
        <strong>Python source</strong>
      </label>
      <p id={`${id}-help`}>
        Edit the program before testing. Ctrl+Enter or ⌘+Enter runs it; Tab
        moves to the next control. Maximum{" "}
        {SOURCE_LIMIT.toLocaleString("en-US")} characters.
      </p>
      <textarea
        ref={editor}
        id={`${id}-source`}
        aria-describedby={`${id}-help`}
        className="code-editor"
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        rows={12}
        value={workspace.source}
        maxLength={SOURCE_LIMIT}
        disabled={!workspace.ready}
        onChange={(event) => save(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            void execute(false);
          }
        }}
      />
      <p className="workspace-note">
        {workspace.source.length} / {SOURCE_LIMIT} characters ·{" "}
        {workspace.ready
          ? workspace.storageError
            ? "Session-only draft"
            : workspace.hasSaved
              ? "Draft saved in this browser"
              : "Starter code · no saved draft yet"
          : "Restoring draft…"}
      </p>
      {workspace.storageError && (
        <p role="alert">
          Browser storage is unavailable or full. Your code remains usable in
          this session; copy it before closing the page.
        </p>
      )}
      <label htmlFor={`${id}-stdin`}>
        Scripted standard input · one entry per line, then end-of-file
      </label>
      <textarea
        id={`${id}-stdin`}
        rows={3}
        value={stdin}
        maxLength={INPUT_LIMIT}
        onChange={(event) => {
          clearEvidence();
          setStdin(event.target.value);
        }}
      />
      <label htmlFor={`${id}-deadline`}>
        Execution deadline · starts after Python is ready
      </label>
      <select
        id={`${id}-deadline`}
        value={deadlineMs}
        onChange={(event) => setDeadlineMs(Number(event.target.value))}
        disabled={busy}
      >
        <option value={1000}>1 second</option>
        <option value={3000}>3 seconds</option>
        <option value={10000}>10 seconds</option>
      </select>
      <div className="lab-controls">
        <button
          className="button"
          type="button"
          disabled={!workspace.ready || busy}
          onClick={() => void execute(false)}
        >
          Run
        </button>
        <button
          className="button secondary"
          type="button"
          disabled={!workspace.ready || busy || !exercise.tests.length}
          onClick={() => void execute(true)}
        >
          Run Tests
        </button>
        <button
          className="button secondary"
          type="button"
          disabled={!busy}
          onClick={() => {
            sequence.current++;
            engine.current?.cancel();
            setState("cancelled");
            setResult({
              kind: "cancelled",
              stdout: streams.stdout,
              stderr: streams.stderr,
              tests: [],
              truncated: false,
            });
          }}
        >
          Stop
        </button>
        <button
          className="button secondary"
          type="button"
          disabled={!workspace.ready || busy}
          onClick={() => setConfirm("reset")}
        >
          Reset Code
        </button>
      </div>
      {carryFrom && (
        <div className="lab-carry">
          <p>
            Continue with your own saved code from “{carryFrom.title}”. This
            replaces this editor with that draft plus this stage’s starter.
            Inspect the combined program before running it.
          </p>
          <button
            className="button secondary"
            type="button"
            disabled={!previous.hasSaved || !workspace.ready || busy}
            onClick={() => setConfirm("carry")}
          >
            Carry forward my previous code
          </button>
          {!previous.hasSaved && (
            <p>
              No saved previous-stage code yet. Write and save it in that stage
              first, or implement the required functions here.
            </p>
          )}
        </div>
      )}
      {confirm && (
        <div
          className="lab-confirm"
          role="group"
          aria-label="Confirm code replacement"
        >
          <p>
            {confirm === "reset"
              ? "Replace your saved work with this exercise’s starter code?"
              : "Replace this draft with your saved previous-stage code plus this starter?"}{" "}
            This cannot be undone in the website. Copy any work you want to keep
            first.
          </p>
          <button
            ref={confirmButton}
            type="button"
            className="button secondary"
            onClick={() => {
              setConfirm(undefined);
              editor.current?.focus();
            }}
          >
            Keep my code
          </button>{" "}
          <button
            type="button"
            className="button"
            onClick={() => {
              const source =
                confirm === "reset"
                  ? exercise.starter
                  : `${previous.source}\n\n${exercise.starter}`;
              if (source.length > SOURCE_LIMIT) {
                setRunSource(workspace.source);
                setTested(false);
                setResult({
                  kind: "source-limit",
                  error:
                    "Combined code exceeds the editor limit. Copy only the required functions manually.",
                  stdout: "",
                  stderr: "",
                  tests: [],
                  truncated: false,
                });
                setState("failed");
              } else save(source);
              setConfirm(undefined);
              editor.current?.focus();
            }}
          >
            {confirm === "reset" ? "Confirm reset" : "Confirm carry forward"}
          </button>
        </div>
      )}
      <p className="lab-state" role="status" aria-live="polite">
        {stale
          ? "Code changed · Earlier results withdrawn"
          : stateLabels[state]}
      </p>
      <section aria-label="Execution result">
        <h3>Execution result</h3>
        <p>
          {result
            ? resultLabels[result.kind]
            : "Run inspects what your program does. Running successfully does not mean it passes the tests."}
          {stale ? " Results are out of date." : ""}
        </p>
        <h4>Standard output</h4>
        <pre tabIndex={0} aria-label="Standard output">
          {(runSource === workspace.source ? streams.stdout : "") ||
            "(no output)"}
        </pre>
        <h4>Standard error</h4>
        <pre tabIndex={0} aria-label="Standard error">
          {(runSource === workspace.source ? streams.stderr : "") ||
            "(no stderr)"}
        </pre>
        {result?.error && (
          <div>
            <h4>Error and traceback</h4>
            <pre tabIndex={0} aria-label="Error and traceback">
              {result.error}
            </pre>
          </div>
        )}
        {result?.truncated && (
          <p>
            Output was limited to 20,000 characters. Reduce repeated printing
            and run a smaller case.
          </p>
        )}
      </section>
      <section aria-label="Test result">
        <h3>Test result</h3>
        {result && tested ? (
          <>
            <p>
              {passed} passed · {failed} failed ·{" "}
              {rows.length - passed - failed} not run
            </p>
            <ul className="lab-test-results">
              {rows.map((row) => (
                <li key={row.test.id}>
                  <strong>
                    {row.test.label} · {row.result?.status ?? "not run"}
                  </strong>
                  <p>Expected: {row.test.expectedBehavior}</p>
                  {row.result?.error && (
                    <pre tabIndex={0}>{row.result.error}</pre>
                  )}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>
            Tests have not run for this code. Use Run Tests to check the
            authored cases.
          </p>
        )}
      </section>
      <section aria-label="Learning guidance">
        <h3>Learning guidance</h3>
        {result && tested && failed > 0 ? (
          rows
            .filter((row) => row.result?.status === "failed")
            .map(({ test }) => (
              <div key={test.id}>
                <h4>{test.label}</h4>
                <p>{test.guidance}</p>
                <ConceptLinks ids={test.conceptIds} />
              </div>
            ))
        ) : (
          <>
            <p>{exercise.explanation}</p>
            <ConceptLinks ids={exercise.conceptIds} />
          </>
        )}
        {tested && result && exercise.referenceSolution && (
          <details
            onToggle={(event) => {
              if (event.currentTarget.open) setReferenceViewed(true);
            }}
          >
            <summary>Compare with the authored reference</summary>
            <pre tabIndex={0}>
              <code>{exercise.referenceSolution}</code>
            </pre>
            <p>
              Use this to explain the link changes; passing public checks alone
              does not establish a general solution.
            </p>
          </details>
        )}
        <p>
          <strong>Explain before improving:</strong> {exercise.reflection}
        </p>
        <p>
          Passing these authored cases is limited local evidence, not complete
          understanding or authoritative grading. It never changes reading or
          project completion.
        </p>
        {(revealedHints > 0 || referenceViewed) && (
          <p>
            Hint or reference assisted work is practice; a passing test in this
            visit is not recorded as independent positive concept evidence.
          </p>
        )}
      </section>
      <p className="lab-limit-note">
        Python runs in a disposable browser Worker. Stop and deadlines terminate
        it; this is not a strong security or memory sandbox. Run only code you
        trust.
      </p>
    </section>
  );
}
function ConceptLinks({ ids }: { ids: string[] }) {
  return (
    <p className="lab-concepts">
      Review:{" "}
      {ids.map((id) => {
        const topic = topics.find((topic) => topic.id === id);
        return topic ? (
          <Link key={id} href={topicHref(topic)}>
            {topic.title}
          </Link>
        ) : null;
      })}
    </p>
  );
}
