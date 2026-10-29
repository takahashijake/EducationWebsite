"use client";
import { useMemo, useState } from "react";
import {
  bellmanScenarios,
  generateBellmanSteps,
  validateBellmanGraph,
  type BellmanGraph,
  type BellmanStep,
} from "@/lib/bellman-ford-steps";

const initialGraph: BellmanGraph = { vertices: ["A", "B", "C"], edges: [] };
export function BellmanFordVisualizer({ caption }: { caption: string }) {
  const [scenario, setScenario] = useState(bellmanScenarios[0].id);
  const [custom, setCustom] = useState<BellmanGraph>(initialGraph);
  const [start, setStart] = useState("A"),
    [destination, setDestination] = useState("D");
  const [from, setFrom] = useState("A"),
    [to, setTo] = useState("B"),
    [weight, setWeight] = useState("-1");
  const [index, setIndex] = useState(0),
    [prediction, setPrediction] = useState(""),
    [feedback, setFeedback] = useState(""),
    [error, setError] = useState("");
  const chosen = bellmanScenarios.find((item) => item.id === scenario);
  const graph = chosen?.graph ?? custom;
  const result = useMemo(() => {
    try {
      return {
        steps: generateBellmanSteps(graph, start, destination || undefined),
        error: "",
      };
    } catch (cause) {
      return {
        steps: [] as readonly BellmanStep[],
        error: cause instanceof Error ? cause.message : "Invalid graph.",
      };
    }
  }, [graph, start, destination]);
  const step = result.steps[Math.min(index, result.steps.length - 1)];
  const vertices = [...graph.vertices].sort();
  const next = result.steps
    .slice(index + 1)
    .find((item) => item.phase === "relaxation");
  const reset = () => {
    setIndex(0);
    setPrediction("");
    setFeedback("");
    setError("");
  };
  const position = (v: string) => {
    const angle =
      -Math.PI / 2 + (2 * Math.PI * vertices.indexOf(v)) / vertices.length;
    return { x: 180 + 125 * Math.cos(angle), y: 165 + 115 * Math.sin(angle) };
  };
  const addEdge = () => {
    const value = Number(weight);
    if (!/^-?(0|[1-9]\d*)$/.test(weight) || !Number.isSafeInteger(value)) {
      setError("Enter an integer weight from −20 through 20.");
      return;
    }
    const candidate = {
      ...custom,
      edges: [...custom.edges, [from, to, value] as const],
    };
    try {
      validateBellmanGraph(candidate);
      setCustom(candidate);
      reset();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Invalid edge.");
    }
  };
  return (
    <figure className="graph-player" aria-label="Bellman–Ford player">
      <figcaption>
        <strong>Bellman–Ford pass player</strong> · {caption}
      </figcaption>
      <p>
        Directed edges only; weights −20 through 20. Equal candidates keep the
        first predecessor. Temporary finite estimates are not final answers
        until the detection check. A traversable undirected negative edge would
        make a negative closed walk.
      </p>
      <div className="graph-controls">
        <label>
          Graph scenario
          <select
            aria-label="Bellman–Ford scenario"
            value={scenario}
            onChange={(event) => {
              const id = event.target.value;
              setScenario(id);
              const item = bellmanScenarios.find((x) => x.id === id);
              setStart(item?.start ?? "A");
              setDestination(item?.destination ?? "");
              reset();
            }}
          >
            {bellmanScenarios.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label}
              </option>
            ))}
            <option value="compose">My directed graph</option>
          </select>
        </label>
        <label>
          Source
          <select
            aria-label="Bellman–Ford source"
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
            aria-label="Bellman–Ford destination"
            value={destination}
            onChange={(event) => {
              setDestination(event.target.value);
              reset();
            }}
          >
            <option value="">All vertices</option>
            {vertices.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      </div>
      {chosen?.note && (
        <p>
          {chosen.note} This comparison is conceptual; the nonnegative Dijkstra
          player does not accept this graph.
        </p>
      )}
      {scenario === "compose" && (
        <div className="graph-compose">
          <label>
            Vertex count
            <select
              aria-label="Bellman–Ford vertex count"
              value={custom.vertices.length}
              onChange={(event) => {
                const allowed = "ABCDEFGHI"
                  .slice(0, Number(event.target.value))
                  .split("");
                setCustom({
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
              {Array.from({ length: 9 }, (_, i) => (
                <option key={i + 1}>{i + 1}</option>
              ))}
            </select>
          </label>
          <label>
            From
            <select
              aria-label="Bellman–Ford edge from"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            >
              {vertices.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            To
            <select
              aria-label="Bellman–Ford edge to"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            >
              {vertices.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Weight (−20 to 20)
            <input
              aria-label="Bellman–Ford edge weight"
              type="number"
              min="-20"
              max="20"
              step="1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </label>
          <button type="button" onClick={addEdge}>
            Add directed edge
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
      {(error || result.error) && <p role="alert">{error || result.error}</p>}
      {step && (
        <>
          <div className="graph-main">
            <svg
              viewBox="0 0 360 330"
              role="img"
              aria-label={`Directed graph: ${graph.edges.map(([a, b, w]) => `${a} to ${b}, weight ${w}`).join("; ") || "no edges"}.`}
            >
              <defs>
                <marker
                  id="bellman-arrow"
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
                  len = Math.hypot(q.x - p.x, q.y - p.y) || 1,
                  dx = (q.x - p.x) / len,
                  dy = (q.y - p.y) / len,
                  reciprocal = graph.edges.some(([c, d]) => c === b && d === a),
                  bend = reciprocal ? 32 : 0,
                  active = step.edge?.[0] === a && step.edge?.[1] === b;
                const lx =
                    a === b
                      ? Math.min(325, p.x + 42)
                      : (p.x + q.x) / 2 - (dy * bend) / 2,
                  ly =
                    a === b
                      ? Math.max(25, p.y - 44)
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
                        markerEnd="url(#bellman-arrow)"
                      />
                    )}
                    <rect
                      x={lx - 15}
                      y={ly - 13}
                      width="30"
                      height="24"
                      rx="5"
                      fill="#fff"
                      stroke="#475569"
                    />
                    <text
                      x={lx}
                      y={ly + 4}
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
                return (
                  <g key={v}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="22"
                      fill={
                        step.affected.includes(v)
                          ? "#fecaca"
                          : step.distances[v] === null
                            ? "#f1f5f9"
                            : "#bfdbfe"
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
              <h4>
                Pass {step.pass}: {step.phase.replaceAll("-", " ")}
              </h4>
              <p aria-live="polite">{step.narration}</p>
              <p>
                Current edge:{" "}
                {step.edge
                  ? `${step.edge[0]} → ${step.edge[1]} (${step.edge[2]})`
                  : "none"}
                . Candidate: {step.candidate ?? "none"}. Relaxed:{" "}
                {step.improved === null
                  ? "not checked"
                  : step.improved
                    ? "yes"
                    : "no"}
                .
              </p>
              <p>
                Reachable negative cycle:{" "}
                {step.negativeCycleDetected ? "detected" : "not detected yet"}.
                Affected vertices: {step.affected.join(", ") || "none"}.
              </p>
              <p>
                Verified negative cycle:{" "}
                {step.witness?.join(" → ") ?? "none shown"}.
              </p>
              <p>
                Destination:{" "}
                {step.phase === "complete"
                  ? (step.destinationStatus ?? "all vertices")
                  : `${step.destinationStatus ?? "all vertices"} (provisional)`}
                .{" "}
                {step.phase === "complete" && step.path
                  ? `Valid path ${step.path.join(" → ")}; cost ${step.cost}.`
                  : ""}
              </p>
              <div className="table-scroll">
                <table>
                  <caption>Distances and predecessors after this step</caption>
                  <thead>
                    <tr>
                      <th scope="col">Vertex</th>
                      <th scope="col">Estimate</th>
                      <th scope="col">Predecessor</th>
                      <th scope="col">Final status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vertices.map((v) => (
                      <tr key={v}>
                        <th scope="row">{v}</th>
                        <td>{step.distances[v] ?? "∞"}</td>
                        <td>{step.predecessors[v] ?? "none"}</td>
                        <td>
                          {step.phase !== "complete"
                            ? "pending"
                            : step.affected.includes(v)
                              ? "negatively unbounded"
                              : step.distances[v] === null
                                ? "unreachable"
                                : "finite"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <p>
            Directed edges:{" "}
            {graph.edges.map(([a, b, w]) => `${a} → ${b} (${w})`).join("; ") ||
              "none"}
            .
          </p>
          {next && (
            <div className="graph-prediction">
              <label>
                Before the next relaxation result, will {next.edge?.[0]} →{" "}
                {next.edge?.[1]} strictly improve its target?{" "}
                <select
                  aria-label="Predict next Bellman–Ford relaxation"
                  value={prediction}
                  onChange={(e) => setPrediction(e.target.value)}
                >
                  <option value="">Choose</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
              <button
                type="button"
                disabled={!prediction}
                onClick={() => {
                  setFeedback(
                    `${prediction === (next.improved ? "yes" : "no") ? "Correct. " : "Reconsider. "}${next.narration}`,
                  );
                  setIndex(result.steps.indexOf(next));
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
              onClick={() => {
                setIndex(Math.max(0, index - 1));
                setFeedback("");
              }}
              disabled={index === 0}
            >
              Previous step
            </button>
            <button
              type="button"
              onClick={() => {
                setIndex(Math.min(result.steps.length - 1, index + 1));
                setFeedback("");
              }}
              disabled={index >= result.steps.length - 1}
            >
              Next step
            </button>
            <button type="button" onClick={reset}>
              Reset trace
            </button>
            <span>
              Step {index + 1} of {result.steps.length}
            </span>
          </div>
        </>
      )}
    </figure>
  );
}
