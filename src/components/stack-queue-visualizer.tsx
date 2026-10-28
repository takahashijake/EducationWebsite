"use client";

import { useMemo, useState } from "react";
import {
  generateStructureSteps,
  MAX_OPERATIONS,
  MAX_VALUE_LENGTH,
  structureScenarios,
  type StructureKind,
  type StructureOperation,
} from "@/lib/stack-queue-steps";

export function StackQueueVisualizer({ caption }: { caption: string }) {
  const [selection, setSelection] = useState(structureScenarios[0].id);
  const [kind, setKind] = useState<StructureKind>("stack");
  const [operations, setOperations] = useState<StructureOperation[]>([]);
  const [value, setValue] = useState("");
  const [index, setIndex] = useState(0);
  const [notice, setNotice] = useState("");
  const scenario = structureScenarios.find((item) => item.id === selection);
  const currentKind = scenario?.kind ?? kind;
  const sequence = scenario?.operations ?? operations;
  const steps = useMemo(
    () => generateStructureSteps(currentKind, sequence),
    [currentKind, sequence],
  );
  const step = steps[Math.min(index, steps.length - 1)];
  const byId = new Map(step.nodes.map((node) => [node.id, node]));
  const add = (action: StructureOperation["action"]) => {
    if (sequence.length >= MAX_OPERATIONS) {
      setNotice(`Limit: ${MAX_OPERATIONS} operations.`);
      return;
    }
    if (
      action === "insert" &&
      (!value.trim() || value.length > MAX_VALUE_LENGTH)
    ) {
      setNotice(`Enter 1–${MAX_VALUE_LENGTH} characters.`);
      return;
    }
    if (action === "insert" && step.nodes.length >= 10) {
      setNotice("Limit: 10 nodes. Remove or clear one first.");
      return;
    }
    const next = [
      ...sequence,
      { action, ...(action === "insert" ? { value: value.trim() } : {}) },
    ];
    try {
      generateStructureSteps(currentKind, next);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Invalid operation");
      return;
    }
    setSelection("compose");
    setKind(currentKind);
    setOperations(next);
    setIndex(next.length);
    setNotice("");
  };
  return (
    <figure
      className="structure-player"
      aria-label="Stack and queue operation player"
    >
      <figcaption>
        <strong>Stack and queue operation player</strong> · {caption}
      </figcaption>
      <p>
        Logical node IDs track identity; diagram position is not a memory
        address. These are authored operations, not a trace of your Python Code
        Lab.
      </p>
      <div className="structure-fields">
        <label>
          Scenario{" "}
          <select
            aria-label="Scenario"
            value={selection}
            onChange={(event) => {
              const id = event.target.value;
              setSelection(id);
              setIndex(0);
              setNotice("");
              if (id === "compose") setOperations([]);
            }}
          >
            {structureScenarios.map((item) => (
              <option value={item.id} key={item.id}>
                {item.label}
              </option>
            ))}
            <option value="compose">My sequence</option>
          </select>
        </label>
        <label>
          Structure{" "}
          <select
            aria-label="Structure"
            value={currentKind}
            onChange={(event) => {
              setKind(event.target.value as StructureKind);
              setSelection("compose");
              setOperations([]);
              setIndex(0);
              setNotice("");
            }}
          >
            <option value="stack">Stack</option>
            <option value="queue">Queue</option>
          </select>
        </label>
        <label>
          Value to insert{" "}
          <input
            aria-label="Value to insert"
            value={value}
            maxLength={MAX_VALUE_LENGTH}
            onChange={(event) => setValue(event.target.value)}
          />
        </label>
      </div>
      <div className="linked-controls" aria-label="Operation controls">
        <button type="button" onClick={() => add("insert")}>
          {currentKind === "stack" ? "Push" : "Enqueue"}
        </button>
        <button type="button" onClick={() => add("remove")}>
          {currentKind === "stack" ? "Pop" : "Dequeue"}
        </button>
        <button type="button" onClick={() => add("inspect")}>
          {currentKind === "stack" ? "Peek top" : "Inspect front/rear"}
        </button>
        <button type="button" onClick={() => add("clear")}>
          Clear structure
        </button>
      </div>
      {notice && <p role="alert">{notice}</p>}
      <p>
        <strong>Size: {step.order.length}</strong> ·{" "}
        {currentKind === "stack"
          ? `top → ${step.head ?? "null"}`
          : `front/head → ${step.head ?? "null"} · rear/tail → ${step.tail ?? "null"}`}
      </p>
      <ol className="structure-nodes" aria-label="Nodes in operation order">
        {step.order.map((id, position) => {
          const node = byId.get(id)!;
          return (
            <li key={id}>
              <strong>
                {node.id}: {node.value}
              </strong>
              <span>next → {node.next ?? "null"}</span>
              <small>
                {currentKind === "stack"
                  ? position === 0
                    ? "top"
                    : "below top"
                  : position === 0 && position === step.order.length - 1
                    ? "front and rear"
                    : position === 0
                      ? "front"
                      : position === step.order.length - 1
                        ? "rear"
                        : "between front and rear"}
              </small>
            </li>
          );
        })}
      </ol>
      {!step.order.length && <p>No nodes in this {currentKind}.</p>}
      <p role="status" aria-live="polite">
        Step {Math.min(index, steps.length - 1) + 1} of {steps.length}:{" "}
        {step.operation}. Result: {step.result}. {step.explanation}
      </p>
      <div className="linked-controls">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex((i) => i - 1)}
        >
          Previous step
        </button>
        <button
          type="button"
          disabled={index >= steps.length - 1}
          onClick={() => setIndex((i) => i + 1)}
        >
          Next step
        </button>
        <button
          type="button"
          disabled={index === 0}
          onClick={() => setIndex(0)}
        >
          Reset review
        </button>
        <button
          type="button"
          onClick={() => {
            setSelection("compose");
            setOperations([]);
            setIndex(0);
            setNotice("");
          }}
        >
          Reset sequence
        </button>
      </div>
    </figure>
  );
}
