"use client";

import { useMemo, useState } from "react";
import {
  generateGraphSteps,
  graphAdjacency,
  graphScenarios,
  type Graph,
  type GraphAlgorithm,
} from "@/lib/graph-steps";

export function GraphVisualizer({ caption }: { caption: string }) {
  const [scenarioId, setScenarioId] = useState("branch");
  const [custom, setCustom] = useState<Graph>({
    vertices: ["A", "B", "C", "D"],
    edges: [],
    directed: false,
  });
  const [algorithm, setAlgorithm] = useState<GraphAlgorithm>("bfs");
  const [start, setStart] = useState("A");
  const [target, setTarget] = useState("");
  const [edgeFrom, setEdgeFrom] = useState("A");
  const [edgeTo, setEdgeTo] = useState("B");
  const [index, setIndex] = useState(0);
  const [prediction, setPrediction] = useState("");
  const [feedback, setFeedback] = useState("");
  const [notice, setNotice] = useState("");
  const graph =
    scenarioId === "compose"
      ? custom
      : graphScenarios.find((s) => s.id === scenarioId)!.graph;
  const steps = useMemo(
    () => generateGraphSteps(graph, algorithm, start, target || undefined),
    [graph, algorithm, start, target],
  );
  const step = steps[Math.min(index, steps.length - 1)];
  const adjacency = useMemo(() => graphAdjacency(graph), [graph]);
  const vertices = [...graph.vertices].sort();
  const nextDiscoveryStep = steps
    .slice(index + 1)
    .find((s) => s.phase === "discover");
  const nextDiscovery =
    nextDiscoveryStep?.examined?.[1] ?? nextDiscoveryStep?.active ?? "None";
  const canPredict = index < steps.length - 1 && step.phase !== "initial";
  const position = (v: string) => {
    const angle =
      -Math.PI / 2 + (2 * Math.PI * vertices.indexOf(v)) / vertices.length;
    return { x: 180 + 135 * Math.cos(angle), y: 165 + 120 * Math.sin(angle) };
  };
  const rewind = () => {
    setIndex(0);
    setPrediction("");
    setFeedback("");
    setNotice("");
  };
  const addEdge = () => {
    const candidate = {
      ...custom,
      edges: [...custom.edges, [edgeFrom, edgeTo] as [string, string]],
    };
    try {
      graphAdjacency(candidate);
      setCustom(candidate);
      rewind();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Invalid edge.");
    }
  };
  return (
    <figure className="graph-player" aria-label="Graph traversal player">
      <figcaption>
        <strong>Graph traversal player</strong> · {caption}
      </figcaption>
      <p>
        Neighbors are explored in alphabetical order. This player traces its own
        graph, not your Python Code Lab.
      </p>
      <div className="graph-controls">
        <label>
          Graph{" "}
          <select
            aria-label="Graph scenario"
            value={scenarioId}
            onChange={(event) => {
              const id = event.target.value;
              setScenarioId(id);
              const first =
                id === "compose"
                  ? custom.vertices[0]
                  : graphScenarios.find((s) => s.id === id)!.graph.vertices[0];
              setStart(first);
              setTarget("");
              rewind();
            }}
          >
            {graphScenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
            <option value="compose">My graph</option>
          </select>
        </label>
        <label>
          Algorithm{" "}
          <select
            aria-label="Algorithm"
            value={algorithm}
            onChange={(event) => {
              setAlgorithm(event.target.value as GraphAlgorithm);
              rewind();
            }}
          >
            <option value="bfs">BFS</option>
            <option value="dfs">DFS</option>
          </select>
        </label>
        <label>
          Start{" "}
          <select
            aria-label="Start vertex"
            value={start}
            onChange={(event) => {
              setStart(event.target.value);
              rewind();
            }}
          >
            {vertices.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label>
          Target for BFS path{" "}
          <select
            aria-label="Target vertex"
            value={target}
            onChange={(event) => {
              setTarget(event.target.value);
              rewind();
            }}
          >
            <option value="">None</option>
            {vertices.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
      </div>
      {scenarioId === "compose" && (
        <div className="graph-compose">
          <label>
            Vertices{" "}
            <select
              aria-label="Vertex count"
              value={custom.vertices.length}
              onChange={(event) => {
                const count = Number(event.target.value);
                const allowed = "ABCDEFGHI".slice(0, count).split("");
                setCustom({
                  ...custom,
                  vertices: allowed,
                  edges: custom.edges.filter(
                    ([a, b]) => allowed.includes(a) && allowed.includes(b),
                  ),
                });
                setStart(allowed.includes(start) ? start : "A");
                setTarget(allowed.includes(target) ? target : "");
                setEdgeFrom("A");
                setEdgeTo("B");
                rewind();
              }}
            >
              {[2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
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
                rewind();
              }}
            />{" "}
            Directed edges
          </label>
          <label>
            From{" "}
            <select
              aria-label="Edge from"
              value={edgeFrom}
              onChange={(event) => setEdgeFrom(event.target.value)}
            >
              {vertices.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            To{" "}
            <select
              aria-label="Edge to"
              value={edgeTo}
              onChange={(event) => setEdgeTo(event.target.value)}
            >
              {vertices.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={addEdge}>
            Add edge
          </button>
          <button
            type="button"
            onClick={() => {
              setCustom({ ...custom, edges: [] });
              rewind();
            }}
          >
            Clear edges
          </button>
          {notice && <p role="alert">{notice}</p>}
        </div>
      )}
      <div className="graph-main">
        <svg
          viewBox="0 0 360 330"
          role="img"
          aria-label={`${graph.directed ? "Directed" : "Undirected"} graph with vertices ${vertices.join(", ")} and edges ${graph.edges.map(([a, b]) => `${a} to ${b}`).join(", ") || "none"}`}
        >
          <defs>
            <marker
              id="graph-arrow"
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="5"
              orient="auto"
            >
              <path d="M0,0 L9,5 L0,10" fill="#475569" />
            </marker>
          </defs>
          {graph.edges.map(([a, b], i) => {
            const p = position(a),
              q = position(b);
            const length = Math.hypot(q.x - p.x, q.y - p.y) || 1;
            const dx = (q.x - p.x) / length,
              dy = (q.y - p.y) / length;
            const examined =
              step.examined &&
              ((step.examined[0] === a && step.examined[1] === b) ||
                (!graph.directed &&
                  step.examined[0] === b &&
                  step.examined[1] === a));
            return a === b ? (
              <circle
                key={i}
                cx={p.x + 18}
                cy={p.y - 18}
                r="18"
                fill="none"
                stroke={examined ? "#b45309" : "#64748b"}
                strokeWidth={examined ? 4 : 2}
              />
            ) : (
              <line
                key={i}
                x1={p.x + 23 * dx}
                y1={p.y + 23 * dy}
                x2={q.x - 25 * dx}
                y2={q.y - 25 * dy}
                stroke={examined ? "#b45309" : "#64748b"}
                strokeWidth={examined ? 4 : 2}
                markerEnd={graph.directed ? "url(#graph-arrow)" : undefined}
              />
            );
          })}
          {vertices.map((v) => {
            const p = position(v);
            const state =
              step.active === v
                ? "active"
                : step.finished.includes(v)
                  ? "finished"
                  : step.discovered.includes(v)
                    ? "frontier"
                    : "unvisited";
            return (
              <g key={v} aria-label={`${v}: ${state}`}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="22"
                  fill={
                    {
                      active: "#fbbf24",
                      finished: "#bbf7d0",
                      frontier: "#bfdbfe",
                      unvisited: "#f1f5f9",
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
          <h4>
            {algorithm === "bfs"
              ? "Queue: front → rear"
              : "DFS frames: bottom → top"}
          </h4>
          <p>{step.frontier.join(" → ") || "Empty"}</p>
          {algorithm === "dfs" && (
            <p>
              Next neighbor indices:{" "}
              {step.frames
                .map((f) => `${f.vertex}:${f.nextNeighbor}`)
                .join(", ") || "none"}
            </p>
          )}
          <h4>Vertex states</h4>
          <ul>
            {vertices.map((v) => (
              <li key={v}>
                {v}:{" "}
                {step.active === v
                  ? "current"
                  : step.finished.includes(v)
                    ? "finished"
                    : step.discovered.includes(v)
                      ? "discovered"
                      : "not reached"}
                ; parent {step.parents[v] ?? "none"}
                {algorithm === "bfs" && v in step.distances
                  ? `; distance ${step.distances[v]}`
                  : ""}
                ; neighbors {adjacency[v].join(", ") || "none"}
              </li>
            ))}
          </ul>
          <p>Discovery order: {step.order.join(" → ") || "none"}</p>
          {step.examined && <p>Examined edge: {step.examined.join(" → ")}</p>}
        </div>
      </div>
      <p role="status" aria-live="polite">
        Step {index + 1} of {steps.length}. {step.narration}
      </p>
      {canPredict && (
        <fieldset className="graph-prediction">
          <legend>
            What happens next: which vertex will be discovered next?
          </legend>
          <select
            aria-label="Prediction"
            value={prediction}
            onChange={(event) => setPrediction(event.target.value)}
          >
            <option value="">Choose</option>
            {vertices.map((v) => (
              <option key={v}>{v}</option>
            ))}
            <option>None</option>
          </select>
          <button
            type="button"
            disabled={!prediction}
            onClick={() =>
              setFeedback(
                prediction === nextDiscovery
                  ? `Correct. ${nextDiscovery === "None" ? "No undiscovered vertex remains reachable." : `${nextDiscovery} is next under alphabetical neighbor order.`}`
                  : `Next discovered: ${nextDiscovery}. Follow the ${algorithm === "bfs" ? "FIFO queue and mark on enqueue" : "top DFS frame, descending before siblings"}; already discovered vertices are skipped.`,
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
        <button type="button" onClick={rewind} disabled={index === 0}>
          Reset traversal
        </button>
      </div>
    </figure>
  );
}
