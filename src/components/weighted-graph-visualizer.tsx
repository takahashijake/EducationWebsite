"use client";

import { useMemo, useState } from "react";
import {
  generateWeightedSteps,
  weightedAdjacency,
  weightedScenarios,
  type WeightedGraph,
  type WeightedStep,
} from "@/lib/weighted-graph-steps";

const emptyGraph: WeightedGraph = {
  vertices: ["A", "B", "C", "D"],
  edges: [],
  directed: false,
};
export function WeightedGraphVisualizer({ caption }: { caption: string }) {
  const [scenario, setScenario] = useState(weightedScenarios[0].id);
  const [custom, setCustom] = useState<WeightedGraph>(emptyGraph);
  const [start, setStart] = useState("A");
  const [destination, setDestination] = useState("D");
  const [from, setFrom] = useState("A");
  const [to, setTo] = useState("B");
  const [weight, setWeight] = useState("1");
  const [index, setIndex] = useState(0);
  const [prediction, setPrediction] = useState("");
  const [feedback, setFeedback] = useState("");
  const [error, setError] = useState("");
  const graph =
    scenario === "compose"
      ? custom
      : weightedScenarios.find((item) => item.id === scenario)!.graph;
  const trace = useMemo(() => {
    try {
      return {
        steps: generateWeightedSteps(graph, start, destination || undefined),
        error: "",
      };
    } catch (cause) {
      return {
        steps: [] as WeightedStep[],
        error: cause instanceof Error ? cause.message : "Invalid graph.",
      };
    }
  }, [graph, start, destination]);
  const steps = trace.steps;
  const step = steps[Math.min(index, steps.length - 1)];
  const vertices = [...graph.vertices].sort();
  const adjacency = useMemo(() => {
    try {
      return weightedAdjacency(graph);
    } catch {
      return {};
    }
  }, [graph]);
  const reset = () => {
    setIndex(0);
    setPrediction("");
    setFeedback("");
    setError("");
  };
  const nextPrediction = steps
    .slice(index + 1)
    .find((item) => item.phase === "select" || item.phase === "relax");
  const expected =
    nextPrediction?.phase === "select"
      ? nextPrediction.current
      : nextPrediction?.improved
        ? "Yes"
        : "No";
  const position = (vertex: string) => {
    const angle =
      -Math.PI / 2 + (2 * Math.PI * vertices.indexOf(vertex)) / vertices.length;
    return { x: 180 + 132 * Math.cos(angle), y: 165 + 118 * Math.sin(angle) };
  };
  const addEdge = () => {
    if (!/^(0|[1-9]\d*)$/.test(weight)) {
      setError("Weight must be a finite integer from 0 to 999.");
      return;
    }
    const parsed = Number(weight);
    const candidate = {
      ...custom,
      edges: [...custom.edges, [from, to, parsed] as const],
    };
    try {
      weightedAdjacency(candidate);
      setCustom(candidate);
      reset();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invalid edge.");
    }
  };
  return (
    <figure className="graph-player" aria-label="Weighted Dijkstra player">
      <figcaption>
        <strong>Dijkstra shortest-path player</strong> · {caption}
      </figcaption>
      <p>
        Nonnegative integer weights only. Equal-cost routes keep the first
        predecessor. The player traces this graph, not your Python code.
      </p>
      <div className="graph-controls">
        <label>
          Weighted graph scenario
          <select
            aria-label="Weighted graph scenario"
            value={scenario}
            onChange={(event) => {
              const id = event.target.value;
              setScenario(id);
              const selected = weightedScenarios.find((item) => item.id === id);
              setStart(selected?.start ?? custom.vertices[0]);
              setDestination(selected?.destination ?? "");
              reset();
            }}
          >
            {weightedScenarios.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
            <option value="compose">My weighted graph</option>
          </select>
        </label>
        <label>
          Start vertex
          <select
            aria-label="Start vertex"
            value={start}
            onChange={(event) => {
              setStart(event.target.value);
              reset();
            }}
          >
            {vertices.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Destination
          <select
            aria-label="Destination"
            value={destination}
            onChange={(event) => {
              setDestination(event.target.value);
              reset();
            }}
          >
            <option value="">All distances only</option>
            {vertices.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      </div>
      {scenario === "compose" && (
        <div className="graph-compose">
          <label>
            Vertex count
            <select
              aria-label="Vertex count"
              value={custom.vertices.length}
              onChange={(event) => {
                const allowed = "ABCDEFGHI"
                  .slice(0, Number(event.target.value))
                  .split("");
                setCustom({
                  ...custom,
                  vertices: allowed,
                  edges: custom.edges.filter(
                    ([a, b]) => allowed.includes(a) && allowed.includes(b),
                  ),
                });
                setStart(allowed.includes(start) ? start : "A");
                setDestination(
                  allowed.includes(destination) ? destination : "",
                );
                setFrom("A");
                setTo(allowed[1] ?? "A");
                reset();
              }}
            >
              {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={custom.directed}
              onChange={(event) => {
                setCustom({
                  ...custom,
                  directed: event.target.checked,
                  edges: [],
                });
                reset();
              }}
            />
            Directed edges
          </label>
          <label>
            From
            <select
              aria-label="Edge from"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            >
              {vertices.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            To
            <select
              aria-label="Edge to"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            >
              {vertices.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Weight (0–999)
            <input
              aria-label="Edge weight"
              type="number"
              inputMode="numeric"
              min="0"
              max="999"
              step="1"
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
            />
          </label>
          <button type="button" onClick={addEdge}>
            Add weighted edge
          </button>
          <button
            type="button"
            onClick={() => {
              setCustom({ ...custom, edges: [] });
              reset();
            }}
          >
            Clear edges
          </button>
        </div>
      )}
      {(error || trace.error) && <p role="alert">{error || trace.error}</p>}
      {step && (
        <>
          <div className="graph-main">
            <svg
              viewBox="0 0 360 330"
              role="img"
              aria-label={`${graph.directed ? "Directed" : "Undirected"} weighted graph. ${graph.edges.map(([a, b, w]) => `${a} to ${b}, weight ${w}`).join("; ") || "No edges"}.`}
            >
              <defs>
                <marker
                  id="weighted-arrow"
                  markerWidth="10"
                  markerHeight="10"
                  refX="8"
                  refY="5"
                  orient="auto"
                >
                  <path d="M0,0 L9,5 L0,10" fill="#475569" />
                </marker>
              </defs>
              {graph.edges.map(([a, b, w], i) => {
                const p = position(a),
                  q = position(b),
                  length = Math.hypot(q.x - p.x, q.y - p.y) || 1;
                const dx = (q.x - p.x) / length,
                  dy = (q.y - p.y) / length;
                const active =
                  step.edge &&
                  ((step.edge[0] === a && step.edge[1] === b) ||
                    (!graph.directed &&
                      step.edge[0] === b &&
                      step.edge[1] === a));
                const reciprocal =
                  graph.directed &&
                  graph.edges.some(
                    ([otherFrom, otherTo]) => otherFrom === b && otherTo === a,
                  );
                const bend = reciprocal ? 35 : 0;
                const labelX =
                  a === b
                    ? Math.min(330, p.x + 43)
                    : (p.x + q.x) / 2 - (dy * bend) / 2;
                const labelY =
                  a === b
                    ? Math.max(20, Math.min(310, p.y - 47))
                    : (p.y + q.y) / 2 + (dx * bend) / 2;
                return (
                  <g key={i}>
                    {a === b ? (
                      <circle
                        cx={p.x + 24}
                        cy={p.y - 24}
                        r="18"
                        fill="none"
                        stroke={active ? "#b45309" : "#64748b"}
                        strokeWidth={active ? 4 : 2}
                      />
                    ) : (
                      <path
                        d={`M ${p.x + 23 * dx} ${p.y + 23 * dy} Q ${(p.x + q.x) / 2 - dy * bend} ${(p.y + q.y) / 2 + dx * bend} ${q.x - 25 * dx} ${q.y - 25 * dy}`}
                        fill="none"
                        stroke={active ? "#b45309" : "#64748b"}
                        strokeWidth={active ? 4 : 2}
                        markerEnd={
                          graph.directed ? "url(#weighted-arrow)" : undefined
                        }
                      />
                    )}
                    <rect
                      x={labelX - 15}
                      y={labelY - 13}
                      width="30"
                      height="24"
                      rx="5"
                      fill="#fff"
                      stroke="#475569"
                    />
                    <text
                      x={labelX}
                      y={labelY + 4}
                      textAnchor="middle"
                      fontWeight="bold"
                      fill="#0f172a"
                    >
                      {w}
                    </text>
                  </g>
                );
              })}
              {vertices.map((v) => {
                const p = position(v);
                const state =
                  step.current === v
                    ? "current"
                    : step.settled.includes(v)
                      ? "settled"
                      : step.distances[v] !== null
                        ? "tentative"
                        : "unreached";
                return (
                  <g key={v} aria-label={`${v}: ${state}`}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="22"
                      fill={
                        {
                          current: "#fbbf24",
                          settled: "#bbf7d0",
                          tentative: "#bfdbfe",
                          unreached: "#f1f5f9",
                        }[state]
                      }
                      stroke="#334155"
                      strokeWidth="2"
                    />
                    <text
                      x={p.x}
                      y={p.y + 6}
                      textAnchor="middle"
                      fontWeight="bold"
                      fill="#0f172a"
                    >
                      {v}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="graph-state">
              <h4>Priority queue: minimum first</h4>
              <p>
                {step.queue
                  .map((item) => `${item.vertex}:${item.distance}`)
                  .join(" → ") || "Empty"}
              </p>
              <p>
                Selected minimum:{" "}
                {step.selectedMinimum
                  ? `${step.selectedMinimum.vertex}:${step.selectedMinimum.distance}`
                  : "none"}
              </p>
              <p>
                Settled: {step.settled.join(", ") || "none"}; unsettled:{" "}
                {step.unsettled.join(", ") || "none"}
              </p>
              <div className="table-scroll">
                <table>
                  <caption>
                    Tentative distances, predecessors, and neighbors
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Vertex</th>
                      <th scope="col">Distance</th>
                      <th scope="col">Predecessor</th>
                      <th scope="col">State</th>
                      <th scope="col">Outgoing neighbors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vertices.map((v) => (
                      <tr key={v}>
                        <th scope="row">{v}</th>
                        <td>{step.distances[v] ?? "∞"}</td>
                        <td>{step.predecessors[v] ?? "none"}</td>
                        <td>
                          {step.settled.includes(v) ? "settled" : "unsettled"}
                        </td>
                        <td>
                          {adjacency[v]
                            ?.map(({ to, weight }) => `${to} (${weight})`)
                            .join(", ") || "none"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {step.edge && (
                <p>
                  Edge {step.edge[0]} → {step.edge[1]} (weight {step.edge[2]}):
                  candidate {step.candidate};{" "}
                  {step.improved ? "improved" : "no improvement"}.
                </p>
              )}
              {destination && (
                <p>
                  Current path to {destination}:{" "}
                  {step.path?.join(" → ") ?? "unreachable"}; total cost{" "}
                  {step.pathCost ?? "∞"}.
                </p>
              )}
              {step.phase === "complete" && (
                <p>
                  Final unreachable vertices:{" "}
                  {step.unreachable.join(", ") || "none"}.
                </p>
              )}
            </div>
          </div>
          <p role="status" aria-live="polite">
            Step {index + 1} of {steps.length}. {step.narration}
          </p>
          {nextPrediction && (
            <fieldset className="graph-prediction">
              <legend>
                {nextPrediction.phase === "select"
                  ? "Predict the next minimum-distance vertex"
                  : `Will ${nextPrediction.edge?.[0]} → ${nextPrediction.edge?.[1]} improve the estimate?`}
              </legend>
              <select
                aria-label="Prediction"
                value={prediction}
                onChange={(event) => setPrediction(event.target.value)}
              >
                <option value="">Choose</option>
                {(nextPrediction.phase === "select"
                  ? vertices
                  : ["Yes", "No"]
                ).map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={!prediction}
                onClick={() =>
                  setFeedback(
                    prediction === expected
                      ? `Correct. ${nextPrediction.narration}`
                      : `Try the queue and tentative table: ${nextPrediction.narration}`,
                  )
                }
              >
                Check prediction
              </button>
              {feedback && <p role="status">{feedback}</p>}
            </fieldset>
          )}
          <div className="linked-controls">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => {
                setIndex(index - 1);
                setPrediction("");
                setFeedback("");
              }}
            >
              Previous step
            </button>
            <button
              type="button"
              disabled={index === steps.length - 1}
              onClick={() => {
                setIndex(index + 1);
                setPrediction("");
                setFeedback("");
              }}
            >
              Next step
            </button>
            <button type="button" disabled={index === 0} onClick={reset}>
              Reset algorithm
            </button>
          </div>
        </>
      )}
    </figure>
  );
}
