"use client";
import { useMemo, useState } from "react";
import {
  dpScenarios,
  generateDpTrace,
  validateDpInput,
  type DpInput,
  type DpStep,
} from "@/lib/dynamic-programming-steps";
const initial: DpInput = { mode: "staircase", n: 5 };
export function DynamicProgrammingVisualizer({ caption }: { caption: string }) {
  const [scenario, setScenario] = useState(dpScenarios[0].id),
    [custom, setCustom] = useState<DpInput>(initial);
  const [mode, setMode] = useState<DpInput["mode"]>("staircase"),
    [number, setNumber] = useState("5"),
    [list, setList] = useState("1, 3, 4"),
    [items, setItems] = useState("A,2,3\nB,3,4\nC,4,5");
  const [index, setIndex] = useState(0),
    [prediction, setPrediction] = useState(""),
    [feedback, setFeedback] = useState(""),
    [error, setError] = useState("");
  const selected = dpScenarios.find((item) => item.id === scenario),
    input = selected?.input ?? custom;
  const result = useMemo(() => {
    try {
      return { trace: generateDpTrace(input), error: "" };
    } catch (cause) {
      return {
        trace: null,
        error: cause instanceof Error ? cause.message : "Invalid input.",
      };
    }
  }, [input]);
  const steps = result.trace?.steps ?? [],
    step = steps[Math.min(index, steps.length - 1)];
  const reset = () => {
    setIndex(0);
    setPrediction("");
    setFeedback("");
    setError("");
  };
  const nextCandidate = steps
    .slice(index + 1)
    .find((s) => s.phase === "candidate" || s.phase === "dependency");
  const applyCustom = () => {
    try {
      if (!/^\d+$/.test(number))
        throw new Error("Target or capacity must be a nonnegative integer.");
      const n = Number(number);
      let value: DpInput;
      if (mode === "staircase") value = { mode, n };
      else if (mode === "coin") {
        if (!/^\s*\d+(\s*,\s*\d+)*\s*$/.test(list))
          throw new Error("Enter comma-separated positive denominations.");
        value = {
          mode,
          target: n,
          coins: list.split(",").map((x) => Number(x.trim())),
        };
      } else {
        const lines = items.trim() ? items.trim().split("\n") : [];
        value = {
          mode,
          capacity: n,
          items: lines.map((line) => {
            const parts = line.split(",").map((x) => x.trim());
            if (
              parts.length !== 3 ||
              !/^\d+$/.test(parts[1]) ||
              !/^\d+$/.test(parts[2])
            )
              throw new Error(
                "Each item needs ID,weight,value on its own line.",
              );
            return {
              id: parts[0],
              weight: Number(parts[1]),
              value: Number(parts[2]),
            };
          }),
        };
      }
      setCustom(validateDpInput(value));
      reset();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invalid input.");
    }
  };
  const showCandidate = (s: DpStep) =>
    s.candidate === null ? "none" : String(s.candidate);
  const coinFinalizedThrough =
    input.mode !== "coin" || !step
      ? -1
      : step.phase === "reconstruct" || step.phase === "complete"
        ? input.target
        : step.phase === "row"
          ? (step.column ?? 0)
          : (step.column ?? 0) - 1;
  const cellText = (value: number | null, column: number) =>
    value !== null
      ? String(value)
      : input.mode === "coin" && column <= coinFinalizedThrough
        ? "∞"
        : "—";
  const callDepths = new Map<number, number>();
  for (const call of result.trace?.metrics?.naiveTree ?? [])
    callDepths.set(
      call.id,
      call.parent === null ? 0 : (callDepths.get(call.parent) ?? 0) + 1,
    );
  return (
    <figure className="graph-player" aria-label="Dynamic programming player">
      <figcaption>
        <strong>Dynamic programming lab</strong> · {caption}
      </figcaption>
      <p>
        Derive a state, base case, and dependencies before reading the final
        answer. This player traces its own bounded algorithm; it does not
        execute Code Lab Python. Predictions are exploratory.
      </p>
      <div className="graph-controls">
        <label>
          Scenario
          <select
            aria-label="DP scenario"
            value={scenario}
            onChange={(e) => {
              setScenario(e.target.value);
              reset();
            }}
          >
            {dpScenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
            <option value="custom">My bounded problem</option>
          </select>
        </label>
      </div>
      {selected && <p>{selected.purpose}</p>}
      {scenario === "custom" && (
        <div className="graph-compose">
          <label>
            Problem family
            <select
              aria-label="DP problem family"
              value={mode}
              onChange={(e) => setMode(e.target.value as DpInput["mode"])}
            >
              <option value="staircase">Staircase</option>
              <option value="coin">Minimum coin change</option>
              <option value="knapsack">Zero-one knapsack</option>
            </select>
          </label>
          <label>
            {mode === "knapsack" ? "Capacity" : "Target"}
            <input
              aria-label="DP target or capacity"
              type="number"
              min="0"
              max={mode === "staircase" ? 15 : mode === "coin" ? 20 : 15}
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
          </label>
          {mode === "coin" && (
            <label>
              Denominations, comma separated
              <input
                aria-label="DP denominations"
                value={list}
                onChange={(e) => setList(e.target.value)}
              />
            </label>
          )}
          {mode === "knapsack" && (
            <label>
              Items: ID,weight,value per line
              <textarea
                aria-label="DP items"
                rows={4}
                value={items}
                onChange={(e) => setItems(e.target.value)}
              />
            </label>
          )}
          <button type="button" onClick={applyCustom}>
            Apply bounded problem
          </button>
        </div>
      )}
      {(error || result.error) && <p role="alert">{error || result.error}</p>}
      {result.trace && step && (
        <>
          <p>
            Problem:{" "}
            {input.mode === "staircase"
              ? `ways(${input.n})`
              : input.mode === "coin"
                ? `Minimum coins for ${input.target} using ${input.coins.join(", ")}`
                : `Capacity ${input.capacity}, items ${input.items.map((i) => `${i.id} (${i.weight}, ${i.value})`).join("; ") || "none"}`}
            .
          </p>
          {result.trace.metrics && (
            <section className="graph-state">
              <h4>Naive recursion versus memoization</h4>
              <p>
                Naive calls:{" "}
                {result.trace.metrics.naiveCalls ?? "not expanded above n=10"};
                unique states:{" "}
                {result.trace.metrics.naiveUnique ?? "not expanded"}. Memoized
                calls: {result.trace.metrics.memoCalls}; unique stored states:{" "}
                {result.trace.metrics.memoUnique}; cache hits:{" "}
                {result.trace.metrics.cacheHits}.
              </p>
              <details>
                <summary>Inspect bounded naive call tree</summary>
                {result.trace.metrics.naiveTree.length ? (
                  <div
                    className="table-scroll"
                    style={{ maxHeight: "16rem", overflowY: "auto" }}
                  >
                    <table>
                      <caption>
                        Indented states show the parent-child recursion tree;
                        each call records repeated work
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Call</th>
                          <th scope="col">Parent</th>
                          <th scope="col">State</th>
                          <th scope="col">Repeated?</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.trace.metrics.naiveTree.map((call) => (
                          <tr key={call.id}>
                            <th scope="row">{call.id}</th>
                            <td>{call.parent ?? "root"}</td>
                            <td
                              style={{
                                paddingInlineStart: `${0.5 + (callDepths.get(call.id) ?? 0) * 1.25}rem`,
                              }}
                            >
                              ways({call.n})
                            </td>
                            <td>{call.repeated ? "yes" : "no"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p>
                    Naive expansion is limited to n≤10; memoization and
                    tabulation still run.
                  </p>
                )}
              </details>
            </section>
          )}
          <div className="graph-state">
            <h4>
              {step.phase.replaceAll("-", " ")}: {step.state}
            </h4>
            <p aria-live="polite">{step.narration}</p>
            <p>
              Dependencies:{" "}
              {step.dependencies.join(", ") || "base case or none"}. Candidate:{" "}
              {showCandidate(step)}. Decision: {step.choice ?? "none"}.
              Improvement:{" "}
              {step.improved === null
                ? "not applicable"
                : step.improved
                  ? "yes"
                  : "no"}
              .
            </p>
            {input.mode === "staircase" && (
              <p>
                Memoized states now stored:{" "}
                {step.memo
                  .map(([n, value]) => `ways(${n})=${value}`)
                  .join(", ") || "none"}
                .
              </p>
            )}
            <div className="table-scroll">
              <table>
                <caption>
                  {input.mode === "knapsack"
                    ? "DP values by item prefix and capacity"
                    : input.mode === "coin"
                      ? "Minimum coin count by amount; ∞ means finalized unreachable and — means not yet filled"
                      : "Ways by stair count; dash means not yet filled"}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">
                      {input.mode === "knapsack" ? "Items used" : "State"}
                    </th>
                    {step.table[0]?.map((_, c) => (
                      <th scope="col" key={c}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {step.table.map((row, r) => (
                    <tr key={r}>
                      <th scope="row">
                        {input.mode === "knapsack"
                          ? r === 0
                            ? "none"
                            : input.items
                                .slice(0, r)
                                .map((i) => i.id)
                                .join(", ")
                          : "result"}
                      </th>
                      {row.map((value, c) => (
                        <td
                          key={c}
                          aria-label={`row ${r}, state ${c}: ${value !== null ? value : cellText(value, c) === "∞" ? "unreachable" : "not yet filled"}`}
                        >
                          {cellText(value, c)}
                          {step.row === r && step.column === c
                            ? " ← current"
                            : ""}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {input.mode === "knapsack" && (
              <p>
                Selected item IDs during backtracking:{" "}
                {step.selected.join(", ") || "none yet"}. Each include reads the
                previous item row, so an item is never reused.
              </p>
            )}
            {step.phase === "complete" && (
              <p>
                <strong>Final answer:</strong>{" "}
                {step.answer === null ? "unreachable" : step.answer}.{" "}
                {step.solution
                  ? `Reconstructed selection: ${step.solution.join(", ") || "empty"}.`
                  : ""}
              </p>
            )}
          </div>
          {nextCandidate && (
            <div className="graph-prediction">
              <label>
                {input.mode === "staircase"
                  ? `Predict the value needed for ${nextCandidate.state}`
                  : `Will the next candidate for ${nextCandidate.state} strictly improve its current value?`}
                {input.mode === "staircase" ? (
                  <input
                    aria-label="DP prediction"
                    value={prediction}
                    onChange={(e) => setPrediction(e.target.value)}
                    inputMode="numeric"
                  />
                ) : (
                  <select
                    aria-label="DP prediction"
                    value={prediction}
                    onChange={(e) => setPrediction(e.target.value)}
                  >
                    <option value="">Choose</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                )}
              </label>
              <button
                type="button"
                disabled={!prediction}
                onClick={() => {
                  const expected =
                    input.mode === "staircase"
                      ? showCandidate(nextCandidate)
                      : nextCandidate.improved
                        ? "yes"
                        : "no";
                  setFeedback(
                    `${prediction.trim().toLowerCase() === expected ? "Correct. " : "Reconsider. "}${nextCandidate.narration}`,
                  );
                  setIndex(steps.indexOf(nextCandidate));
                }}
              >
                Check prediction and reveal
              </button>
              {feedback && <p role="status">{feedback}</p>}
            </div>
          )}
          <div className="graph-controls">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => {
                setIndex(Math.max(0, index - 1));
                setFeedback("");
              }}
            >
              Previous step
            </button>
            <button
              type="button"
              disabled={index === steps.length - 1}
              onClick={() => {
                setIndex(Math.min(steps.length - 1, index + 1));
                setFeedback("");
              }}
            >
              Next step
            </button>
            <button type="button" onClick={reset}>
              Reset trace
            </button>
            <span>
              Step {index + 1} of {steps.length}
            </span>
          </div>
        </>
      )}
    </figure>
  );
}
