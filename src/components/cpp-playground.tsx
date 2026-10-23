"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CodingExercise } from "@/content/cpp-exercises";
import { CppExecutor } from "@/lib/execution/cpp-executor";
import type { ExecutionEngine, ProgramResult } from "@/lib/execution/types";
import { INPUT_LIMIT } from "@/lib/execution/types";
import { evaluateCases } from "@/lib/coding-evaluation";
import { defaultPractice, HISTORY_LIMIT } from "@/lib/practice-progress";
import { useProgress } from "./progress-provider";
import { CodeEditor } from "./code-editor";

const labels = {
  success: "Successful execution",
  "compilation-error": "Compilation error",
  "runtime-error": "Runtime error",
  timeout: "Time limit exceeded",
  "output-limit": "Output limit exceeded",
  cancelled: "Stopped",
  "loading-error": "Runtime unavailable",
  "source-limit": "Source or input limit exceeded",
  "incorrect-output": "Incorrect output",
};
type Evidence = {
  source: string;
  stdin: string;
  mode: "run" | "submit";
  results: ProgramResult[];
};

export function CppPlayground({
  exercise,
  createEngine,
}: {
  exercise: CodingExercise;
  createEngine?: () => ExecutionEngine;
}) {
  const { practice, practiceReady, practiceStorageError, updatePractice } =
    useProgress();
  const entry = practice[exercise.id] ?? defaultPractice(exercise);
  const { source, stdin } = entry;
  const engine = useMemo(
    () => (createEngine ? createEngine() : new CppExecutor()),
    [createEngine],
  );
  const generation = useRef(0);
  const [active, setActive] = useState<{
    source: string;
    stdin: string;
    message: string;
  }>();
  const [evidence, setEvidence] = useState<Evidence>();
  const [hints, setHints] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);
  const busy = active?.source === source && active.stdin === stdin;
  const visible =
    evidence?.source === source && evidence.stdin === stdin
      ? evidence
      : undefined;
  const rows =
    visible?.mode === "submit"
      ? evaluateCases(exercise.tests, visible.results)
      : [];
  const first = visible?.results[0];
  const resetCancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (confirmReset) resetCancel.current?.focus();
  }, [confirmReset]);
  useEffect(() => {
    const lifetime = generation;
    return () => {
      lifetime.current++;
      engine.cancel();
    };
  }, [source, stdin, engine]);
  useEffect(() => () => engine.dispose(), [engine]);

  function edit(change: { source?: string; stdin?: string }) {
    generation.current++;
    engine.cancel();
    setActive(undefined);
    setEvidence(undefined);
    updatePractice(exercise.id, (current) => ({
      ...(current ?? defaultPractice(exercise)),
      ...change,
    }));
  }
  async function execute(mode: "run" | "submit") {
    if (busy || !practiceReady) return;
    const token = ++generation.current;
    setEvidence(undefined);
    setActive({ source, stdin, message: "Loading C++ compiler..." });
    let results: ProgramResult[];
    try {
      results = await engine.execute(
        {
          language: exercise.language,
          source,
          inputs:
            mode === "submit"
              ? exercise.tests.map((test) => test.stdin)
              : [stdin],
        },
        (event) => {
          if (token === generation.current)
            setActive({
              source,
              stdin,
              message:
                event.state === "compiling"
                  ? "Compiling C++ (first download is about 95 MB)..."
                  : `Running${mode === "submit" ? ` case ${(event.caseIndex ?? 0) + 1} of ${exercise.tests.length}` : " program"}...`,
            });
        },
      );
    } catch (error) {
      results = [
        {
          kind: "loading-error",
          stdout: "",
          stderr: "",
          diagnostics: "",
          error: String(error),
        },
      ];
    }
    if (token !== generation.current) return;
    setActive(undefined);
    setEvidence({ source, stdin, mode, results });
    const evaluated =
      mode === "submit" ? evaluateCases(exercise.tests, results) : [];
    const passed = evaluated.filter((row) => row.passed).length;
    const complete = mode === "submit" && passed === exercise.tests.length;
    const at = new Date().toISOString();
    const kind =
      evaluated.find((row) => !row.passed)?.kind ??
      results[0]?.kind ??
      "runtime-error";
    updatePractice(exercise.id, (current) => {
      const previous = current ?? defaultPractice(exercise);
      return {
        ...previous,
        completedAt: complete ? at : previous.completedAt,
        attempts: [
          ...previous.attempts,
          {
            at,
            mode,
            kind,
            passed,
            total: mode === "submit" ? exercise.tests.length : 0,
          },
        ].slice(-HISTORY_LIMIT),
      };
    });
  }
  return (
    <div className="cpp-playground">
      <p className="practice-boundary">
        C++17 in your browser. Passing the public tests does not verify which
        technique you used or certify mastery. After passing, explain why your
        solution works and try an extra boundary input.
      </p>
      <label className="editor-label" id={`${exercise.id}-label`}>
        C++ source
      </label>
      <CodeEditor
        label={`${exercise.title} C++ source`}
        value={source}
        onChange={(source) => {
          if (source !== entry.source) edit({ source });
        }}
        onRun={() => void execute("run")}
      />
      <p className="editor-help">
        Ctrl+Enter / Cmd+Enter: Run. Standard undo, redo, and selection
        shortcuts work. Tab moves to the next control. Source limit: 24,000
        characters.
      </p>
      <label className="stdin-label">
        Program input (stdin)
        <textarea
          maxLength={INPUT_LIMIT}
          value={stdin}
          onChange={(event) => edit({ stdin: event.target.value })}
          rows={3}
        />
      </label>
      <p>
        Input ends at the last supplied character (EOF). Submit uses the
        authored test inputs below.
      </p>
      <div className="playground-actions">
        <button
          className="button"
          disabled={!practiceReady || busy}
          onClick={() => void execute("run")}
        >
          Run
        </button>
        <button
          className="button secondary"
          disabled={!practiceReady || busy}
          onClick={() => void execute("submit")}
        >
          Submit solution
        </button>
        <button disabled={!busy} onClick={() => engine.cancel()}>
          Stop
        </button>
        <button disabled={!practiceReady} onClick={() => setConfirmReset(true)}>
          Reset to starter
        </button>
      </div>
      {confirmReset && (
        <div
          className="reset-confirmation"
          role="group"
          aria-label="Confirm reset"
        >
          <p>
            Replace your saved code with the starter? Attempt history will
            remain.
          </p>
          <button ref={resetCancel} onClick={() => setConfirmReset(false)}>
            Keep my code
          </button>
          <button
            onClick={() => {
              edit({ source: exercise.starter });
              setConfirmReset(false);
            }}
          >
            Replace code
          </button>
        </div>
      )}
      <div className="execution-status" role="status">
        {busy
          ? active.message
          : visible?.mode === "submit"
            ? `${rows.filter((row) => row.passed).length} of ${exercise.tests.length} public tests passed${rows.every((row) => row.passed) ? ". Exercise complete." : ". Review feedback and retry."}`
            : first
              ? `${labels[first.kind]}${first.exitCode !== undefined ? ` (exit ${first.exitCode})` : ""}`
              : "Ready to run. Editing withdraws earlier results."}
      </div>
      {first?.diagnostics && (
        <div className="execution-panel">
          <h4>Compiler diagnostics</h4>
          <pre tabIndex={0}>{first.diagnostics}</pre>
        </div>
      )}
      {first?.error && (
        <div className="execution-panel">
          <h4>{labels[first.kind]}</h4>
          <pre tabIndex={0}>{first.error}</pre>
        </div>
      )}
      {visible?.mode === "run" && first && (
        <div className="console-grid">
          <div className="execution-panel">
            <h4>Standard output</h4>
            <pre tabIndex={0}>{first.stdout || "(empty)"}</pre>
          </div>
          <div className="execution-panel">
            <h4>Standard error</h4>
            <pre tabIndex={0}>{first.stderr || "(empty)"}</pre>
          </div>
        </div>
      )}
      {rows.length > 0 && (
        <ol className="test-results">
          {rows.map((row, index) => (
            <li key={row.id}>
              <strong>
                {row.label}: {row.passed ? "Passed" : labels[row.kind]}
              </strong>
              {!row.passed && (
                <>
                  <p>
                    {row.result?.error ??
                      "Compare the actual output with the expected output; check boundaries and extra prompts."}
                  </p>
                  <div className="console-grid">
                    <div>
                      <h4>Input</h4>
                      <pre>{JSON.stringify(exercise.tests[index].stdin)}</pre>
                      <h4>Expected output</h4>
                      <pre>{JSON.stringify(exercise.tests[index].stdout)}</pre>
                    </div>
                    <div>
                      <h4>Actual output</h4>
                      <pre>{JSON.stringify(row.result?.stdout ?? "")}</pre>
                      {row.result?.stderr && (
                        <>
                          <h4>Standard error</h4>
                          <pre>{row.result.stderr}</pre>
                        </>
                      )}
                    </div>
                  </div>
                </>
              )}
            </li>
          ))}
        </ol>
      )}
      <div className="practice-hints">
        <button
          disabled={hints >= exercise.hints.length}
          onClick={() => setHints((count) => count + 1)}
        >
          Reveal next hint
        </button>
        {exercise.hints.slice(0, hints).map((hint, index) => (
          <p key={hint}>
            Hint {index + 1}: {hint}
          </p>
        ))}
      </div>
      <details>
        <summary>Common mistakes</summary>
        <ul>
          {exercise.commonMistakes.map((mistake) => (
            <li key={mistake}>{mistake}</li>
          ))}
        </ul>
      </details>
      <details>
        <summary>Public test cases and completion criteria</summary>
        <p>
          Pass every listed case. A single final newline is optional; CRLF
          becomes LF. Other spaces and line breaks must match exactly. Each case
          runs a fresh program. There are no hidden tests.
        </p>
        <ul>
          {exercise.tests.map((test) => (
            <li key={test.id}>
              {test.label}: input <code>{JSON.stringify(test.stdin)}</code>,
              output <code>{JSON.stringify(test.stdout)}</code>
            </li>
          ))}
        </ul>
      </details>
      <details>
        <summary>Attempt history ({entry.attempts.length} most recent)</summary>
        <p>
          {entry.completedAt
            ? `Previously passed all public tests: ${entry.completedAt}.`
            : "No completed submission yet."}
        </p>
        <ol>
          {[...entry.attempts].reverse().map((attempt, index) => (
            <li key={`${attempt.at}-${index}`}>
              <time dateTime={attempt.at}>{attempt.at}</time>: {attempt.mode},{" "}
              {labels[attempt.kind]}
              {attempt.mode === "submit"
                ? `, ${attempt.passed}/${attempt.total} passed`
                : ""}
            </li>
          ))}
        </ol>
      </details>
      {practiceStorageError && (
        <p role="alert">
          Browser storage is unavailable. Code and practice progress are kept
          for this session only.
        </p>
      )}
    </div>
  );
}
