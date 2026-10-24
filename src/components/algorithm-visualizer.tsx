"use client";
import { useEffect, useId, useMemo, useState } from "react";
import {
  generateAlgorithmSteps,
  moveStep,
  scenarios,
  type Algorithm,
} from "@/lib/algorithm-steps";
export function AlgorithmVisualizer({
  algorithm,
  caption,
}: {
  algorithm: Algorithm;
  caption: string;
}) {
  const id = useId();
  const [scenarioId, setScenarioId] = useState(scenarios[algorithm][0].id);
  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const scenario =
    scenarios[algorithm].find((item) => item.id === scenarioId) ??
    scenarios[algorithm][0];
  const steps = useMemo(
    () => generateAlgorithmSteps(algorithm, scenario),
    [algorithm, scenario],
  );
  const step = steps[position] ?? steps[0];
  useEffect(() => {
    if (!window.matchMedia) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      setReducedMotion(preference.matches);
      if (preference.matches) setPlaying(false);
    };
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!playing || position >= steps.length - 1) return;
    const timer = window.setTimeout(() => {
      setPosition((current) => moveStep(current, steps.length, "next"));
      if (position + 1 >= steps.length - 1) setPlaying(false);
    }, 900);
    return () => window.clearTimeout(timer);
  }, [playing, position, steps.length]);
  const navigate = (action: "next" | "previous" | "reset") => {
    setPlaying(false);
    setPosition((current) => moveStep(current, steps.length, action));
  };
  return (
    <figure className="algorithm-visualizer" aria-labelledby={`${id}-title`}>
      <figcaption id={`${id}-title`}>
        <strong>
          {algorithm === "traversal"
            ? "Array traversal"
            : algorithm === "linear"
              ? "Linear search"
              : "Binary search"}
        </strong>
        <p>{caption}</p>
      </figcaption>
      {algorithm === "binary-search" && (
        <p>
          <strong>Precondition:</strong> values must be sorted in ascending
          order. This example returns the first matching midpoint it encounters;
          it does not promise the leftmost duplicate.
        </p>
      )}
      <label htmlFor={`${id}-scenario`}>Choose input scenario</label>{" "}
      <select
        id={`${id}-scenario`}
        value={scenarioId}
        onChange={(event) => {
          setScenarioId(event.target.value);
          setPosition(0);
          setPlaying(false);
        }}
      >
        {scenarios[algorithm].map((item) => (
          <option value={item.id} key={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      <p>
        Input: [{scenario.values.join(", ")}]{" "}
        {scenario.target === undefined ? "" : `· Target: ${scenario.target}`}
      </p>
      <ol className="algorithm-array" aria-label="Indexed values">
        {step.values.map((value, index) => (
          <li
            key={index}
            className={
              step.highlightedIndices.includes(index)
                ? "inspected"
                : step.low !== null &&
                    step.high !== null &&
                    index >= step.low &&
                    index <= step.high
                  ? "candidate"
                  : ""
            }
          >
            <span>Index {index}</span>
            <strong>{value}</strong>
            <small>
              {step.highlightedIndices.includes(index)
                ? step.highlightLabel
                : step.activeIndex === index
                  ? "Active"
                  : step.low !== null &&
                      step.high !== null &&
                      index === step.low &&
                      index === step.high
                    ? "Low and high"
                    : index === step.low
                      ? "Low"
                      : index === step.high
                        ? "High"
                        : " "}
            </small>
          </li>
        ))}
      </ol>
      {step.values.length === 0 && <p>No elements in this scenario.</p>}
      <div className="algorithm-step" aria-live="polite" aria-atomic="true">
        <p>
          <strong>
            Step {position + 1} of {steps.length}: {step.operation}
          </strong>
        </p>
        <p>{step.explanation}</p>
        <p>
          Active index: {step.activeIndex ?? "none"} ·{" "}
          {algorithm === "traversal" ? "Remaining indices" : "Search bounds"}:{" "}
          {step.low === null ? "empty" : `${step.low} through ${step.high}`} ·
          Comparisons: {step.comparisons}
        </p>
        {step.outcome && (
          <p>
            <strong>Outcome: {step.outcome}</strong>
          </p>
        )}
      </div>
      <div
        className="algorithm-controls"
        role="group"
        aria-label="Visualization controls"
      >
        <button
          type="button"
          onClick={() => navigate("previous")}
          disabled={position === 0}
        >
          Previous step
        </button>
        <button
          type="button"
          onClick={() => navigate("next")}
          disabled={position === steps.length - 1}
        >
          Next step
        </button>
        <button
          type="button"
          onClick={() => navigate("reset")}
          disabled={position === 0}
        >
          Reset
        </button>
        <button
          type="button"
          onClick={() => setPlaying((current) => !current)}
          disabled={reducedMotion || position === steps.length - 1}
          title={
            reducedMotion
              ? "Use manual steps with reduced motion enabled"
              : undefined
          }
        >
          {playing ? "Pause" : "Play"}
        </button>
      </div>
      <p className="algorithm-note">
        Comparisons count the equality check and, after a binary-search
        mismatch, its ordering check. They are not timing measurements. Playback
        pauses when you change scenarios or step manually.
      </p>
    </figure>
  );
}
