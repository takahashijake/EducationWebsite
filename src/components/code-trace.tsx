"use client";
import { useId, useState } from "react";
import type { CodeTrace as Trace } from "@/content/types";
import { tracePosition, validateTrace } from "@/lib/trace";
function pythonValue(value: string | number | boolean | null) {
  return value === null
    ? "None"
    : value === true
      ? "True"
      : value === false
        ? "False"
        : JSON.stringify(value);
}
export function CodeTrace({ trace }: { trace: Trace }) {
  if (validateTrace(trace).length)
    return (
      <p role="note">
        This walkthrough is unavailable because its authored states are
        incomplete.
      </p>
    );
  return <TracePlayer key={trace.source} trace={trace} />;
}
function TracePlayer({ trace }: { trace: Trace }) {
  const inputId = useId();
  const [scenarioId, setScenarioId] = useState("");
  const [position, setPosition] = useState(0);
  const program = trace.scenarios?.find((s) => s.id === scenarioId) ?? trace;
  const step = program.steps[position] ?? program.steps[0];
  const final = position === program.steps.length - 1;
  return (
    <figure className="code-trace">
      <figcaption>
        <strong>{trace.title}</strong>
        <p>{trace.caption}</p>
        <p>
          Authored Python walkthrough. Each state shows values after the
          highlighted step; controls replay the selected example.
        </p>
        {!!trace.scenarios?.length && (
          <div className="trace-input">
            <label htmlFor={inputId}>
              {trace.inputLabel ?? "Choose example input"}
            </label>
            <select
              id={inputId}
              value={scenarioId}
              onChange={(event) => {
                setScenarioId(event.target.value);
                setPosition(0);
              }}
            >
              <option value="">{trace.defaultLabel ?? "Default input"}</option>
              {trace.scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <p>Changing input starts a fresh trace at step 1.</p>
          </div>
        )}
      </figcaption>
      <pre
        tabIndex={0}
        aria-label="Python example with highlighted execution lines"
      >
        <code>
          {program.source.split("\n").map((line, index) => (
            <span
              className={`trace-line ${step.lines.includes(index + 1) ? "active" : ""}`}
              key={index}
              aria-current={step.lines.includes(index + 1) ? "step" : undefined}
            >
              <span aria-hidden="true" className="line-number">
                {index + 1}
              </span>
              {line || " "}
              {"\n"}
            </span>
          ))}
        </code>
      </pre>
      <div
        className="trace-state"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <h4>
          Execution state: step {position + 1} of {program.steps.length}
          {final ? " · Finished" : ""}
        </h4>
        <p>Highlighted lines: {step.lines.join(", ")}</p>
        {step.detail && (
          <p>
            <strong>{step.detail}</strong>
          </p>
        )}
        <p>{step.explanation}</p>
        {step.frames && (
          <section aria-label="Call frames" className="trace-frames">
            <h4>Call frames · caller first</h4>
            <ol>
              {step.frames.map((frame) => (
                <li key={frame.id}>
                  <strong>
                    {frame.name} · {frame.status}
                  </strong>
                  {frame.resumeLine !== undefined && (
                    <p>Caller resumes at line {frame.resumeLine}.</p>
                  )}
                  {frame.status === "returning" && (
                    <p>
                      Returning{" "}
                      <code>{pythonValue(frame.returnValue ?? null)}</code>
                    </p>
                  )}
                  <p>
                    {step.variables
                      .filter((v) => v.scope === frame.scope)
                      .map((v) => `${v.name} = ${pythonValue(v.value)}`)
                      .join("; ") || "No values bound in this frame."}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}
        <h4>Variables</h4>
        {step.variables.length ? (
          <dl>
            {step.variables.map((v) => (
              <div key={`${v.scope}:${v.name}`}>
                <dt>
                  {v.scope} · <code>{v.name}</code>
                </dt>
                <dd>
                  <code>{pythonValue(v.value)}</code>
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p>No variables assigned yet.</p>
        )}
        <h4>Program output so far</h4>
        <pre>{step.output.join("\n") || "(no output)"}</pre>
        {final && (
          <p>
            <strong>Final result: {program.result}</strong>
          </p>
        )}
      </div>
      <div className="trace-controls">
        {(["previous", "next", "reset"] as const).map((action) => (
          <button
            type="button"
            className="button secondary"
            key={action}
            disabled={
              action === "previous"
                ? position === 0
                : action === "next"
                  ? final
                  : false
            }
            onClick={() =>
              setPosition((p) => tracePosition(p, action, program.steps.length))
            }
          >
            {action === "next"
              ? "Next step"
              : action === "previous"
                ? "Previous step"
                : "Reset trace"}
          </button>
        ))}
      </div>
    </figure>
  );
}
