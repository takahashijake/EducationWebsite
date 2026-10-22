"use client";
import { useState } from "react";
import type { CodeTrace as Trace } from "@/content/types";
import { tracePosition } from "@/lib/trace";
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
  const [position, setPosition] = useState(0);
  const step = trace.steps[position];
  const final = position === trace.steps.length - 1;
  return (
    <figure className="code-trace">
      <figcaption>
        <strong>{trace.title}</strong>
        <p>{trace.caption}</p>
        <p>
          Authored Python walkthrough. Each state shows values after the
          highlighted step; controls replay this fixed example.
        </p>
      </figcaption>
      <pre
        tabIndex={0}
        aria-label="Python example with highlighted execution lines"
      >
        <code>
          {trace.source.split("\n").map((line, index) => (
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
          Execution state: step {position + 1} of {trace.steps.length}
          {final ? " · Finished" : ""}
        </h4>
        <p>Highlighted lines: {step.lines.join(", ")}</p>
        {step.detail && (
          <p>
            <strong>{step.detail}</strong>
          </p>
        )}
        <p>{step.explanation}</p>
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
            <strong>Final result: {trace.result}</strong>
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
              setPosition((p) => tracePosition(p, action, trace.steps.length))
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
