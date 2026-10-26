"use client";

import { useMemo, useState } from "react";
import {
  generateLinkedSteps,
  linkedScenarios,
  type LinkedNode,
} from "@/lib/linked-list-steps";

export function LinkedListVisualizer({ caption }: { caption: string }) {
  const [scenarioId, setScenarioId] = useState(linkedScenarios[0].id);
  const [index, setIndex] = useState(0);
  const scenario = linkedScenarios.find((item) => item.id === scenarioId)!;
  const steps = useMemo(() => generateLinkedSteps(scenario), [scenario]);
  const step = steps[index];
  const byId = new Map(step.nodes.map((node) => [node.id, node]));
  const ordered = [...step.reachable, ...step.detached].map((id) =>
    byId.get(id)!,
  );
  const labels = (node: LinkedNode) =>
    `${node.id}, value ${node.value}, next references ${node.next ?? "null"}, ${step.reachable.includes(node.id) ? "reachable from head" : "detached"}${step.current === node.id ? ", current" : ""}${step.previous === node.id ? ", previous" : ""}`;
  return (
    <figure
      className="linked-visualizer"
      aria-label="Linked-list reference visualizer"
    >
      <figcaption>
        <strong>Linked-list reference visualizer</strong> · {caption}
      </figcaption>
      <label htmlFor="linked-scenario">Choose reference scenario</label>
      <select
        id="linked-scenario"
        value={scenarioId}
        onChange={(event) => {
          setScenarioId(event.target.value);
          setIndex(0);
        }}
      >
        {linkedScenarios.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      <p className="linked-note">
        Node labels are stable logical identities. Their placement does not
        represent actual heap layout or memory addresses. The player follows
        authored operations, not learner Python.
      </p>
      <p className="linked-pointers">
        <strong>head → {step.head ?? "null"}</strong> · current →{" "}
        {step.current ?? "null"} · previous → {step.previous ?? "null"}
      </p>
      {ordered.length ? (
        <ol className="linked-nodes" aria-label="Nodes and next references">
          {ordered.map((node) => (
            <li
              key={node.id}
              aria-label={labels(node)}
              className={step.detached.includes(node.id) ? "detached" : ""}
            >
              <span className="linked-node-label">
                <strong>{node.id}</strong>
                <span>value {node.value}</span>
              </span>
              <span
                className="linked-edge"
                aria-label={`${node.id} next references ${node.next ?? "null"}`}
              >
                next → {node.next ?? "null"}
              </span>
              <span className="linked-flags">
                {step.current === node.id ? "current " : ""}
                {step.previous === node.id ? "previous " : ""}
                {step.detached.includes(node.id) ? "detached" : "reachable"}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p>No nodes; head → null.</p>
      )}
      <p className="linked-operation" role="status" aria-live="polite">
        Step {index + 1} of {steps.length}: {step.operation}. {step.explanation}
      </p>
      <div className="linked-controls">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex((old) => old - 1)}
        >
          Previous step
        </button>
        <button
          type="button"
          disabled={index === steps.length - 1}
          onClick={() => setIndex((old) => old + 1)}
        >
          Next step
        </button>
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex(0)}
        >
          Reset
        </button>
      </div>
    </figure>
  );
}
