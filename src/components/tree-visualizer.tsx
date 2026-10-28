"use client";

import { useMemo, useState } from "react";
import {
  buildTree,
  generateTreeSteps,
  treeHeight,
  treeMinimum,
  treeMaximum,
  treeScenarios,
  type Tree,
  type TreeOperation,
} from "@/lib/tree-steps";

const modes = [
  "insert",
  "search",
  "delete",
  "preorder",
  "inorder",
  "postorder",
  "level-order",
] as const;
type Mode = (typeof modes)[number];
export function TreeVisualizer({ caption }: { caption: string }) {
  const [scenario, setScenario] = useState("balanced");
  const [custom, setCustom] = useState<Tree>({
    rootId: null,
    nodes: [],
    nextId: 1,
  });
  const [operations, setOperations] = useState(0);
  const [mode, setMode] = useState<Mode>("inorder");
  const [key, setKey] = useState("8");
  const [index, setIndex] = useState(0);
  const [prediction, setPrediction] = useState("");
  const [feedback, setFeedback] = useState("");
  const [notice, setNotice] = useState("");
  const chosen = treeScenarios.find((s) => s.id === scenario);
  const tree = useMemo(
    () => (scenario === "compose" ? custom : buildTree(chosen!.keys)),
    [scenario, custom, chosen],
  );
  const operation: TreeOperation =
    mode === "insert" || mode === "search" || mode === "delete"
      ? { kind: mode, key: key.trim() ? Number(key) : NaN }
      : { kind: mode };
  const result = useMemo(() => {
    try {
      return { steps: generateTreeSteps(tree, operation), error: "" };
    } catch (error) {
      return {
        steps: generateTreeSteps(tree, { kind: "inorder" }).slice(0, 1),
        error: error instanceof Error ? error.message : "Invalid operation.",
      };
    }
    // A string key is intentionally part of the dependency: invalid text should show feedback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree, mode, key]);
  const steps = result.steps,
    step = steps[Math.min(index, steps.length - 1)];
  const nodeById = new Map(step.tree.nodes.map((n) => [n.id, n]));
  const order: string[] = [];
  const arrange = (id: string | null) => {
    if (!id) return;
    const n = nodeById.get(id)!;
    arrange(n.left);
    order.push(id);
    arrange(n.right);
  };
  arrange(step.tree.rootId);
  const depth = (id: string): number => {
    let d = 0,
      current = step.tree.rootId;
    while (current && current !== id) {
      const n = nodeById.get(current)!;
      current = nodeById.get(id)!.key < n.key ? n.left : n.right;
      d++;
    }
    return d;
  };
  const place = (id: string) => ({
    x: ((order.indexOf(id) + 1) * 760) / (order.length + 1),
    y: 35 + depth(id) * 76,
  });
  const nextRelevant = steps
    .slice(index + 1)
    .find((s) =>
      ["compare", "visit", "successor", "insert"].includes(s.action),
    );
  const answer = nextRelevant?.activeId
    ? nextRelevant.tree.nodes
        .find((n) => n.id === nextRelevant.activeId)
        ?.key.toString()
    : "None";
  const reset = () => {
    setIndex(0);
    setPrediction("");
    setFeedback("");
    setNotice("");
  };
  const changeScenario = (id: string) => {
    setScenario(id);
    const selected = treeScenarios.find((s) => s.id === id);
    if (selected) {
      setMode(selected.suggested.kind);
      setKey(
        "key" in selected.suggested ? String(selected.suggested.key) : "8",
      );
    }
    reset();
  };
  const apply = () => {
    try {
      if (operations >= 16)
        throw new Error("Composition is limited to 16 operations.");
      if (!(mode === "insert" || mode === "delete"))
        throw new Error("Choose insert or delete to change your tree.");
      const last = generateTreeSteps(custom, {
        kind: mode,
        key: key.trim() ? Number(key) : NaN,
      }).at(-1)!;
      setCustom(last.tree);
      setOperations(operations + 1);
      reset();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Invalid operation.");
    }
  };
  return (
    <figure className="tree-player" aria-label="Tree and BST operation player">
      <figcaption>
        <strong>Tree and BST operation player</strong> · {caption}
      </figcaption>
      <p>
        Keys are unique integers from -999 to 999. Duplicate insertion changes
        nothing. Height counts edges. The player traces its own tree, not your
        Python Code Lab.
      </p>
      <div className="tree-controls">
        <label>
          Tree scenario{" "}
          <select
            aria-label="Tree scenario"
            value={scenario}
            onChange={(e) => changeScenario(e.target.value)}
          >
            {treeScenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
            <option value="compose">My BST</option>
          </select>
        </label>
        <label>
          Operation{" "}
          <select
            aria-label="Tree operation"
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as Mode);
              reset();
            }}
          >
            {modes.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        {(mode === "insert" || mode === "search" || mode === "delete") && (
          <label>
            Key{" "}
            <input
              aria-label="Tree key"
              type="number"
              min="-999"
              max="999"
              step="1"
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                reset();
              }}
            />
          </label>
        )}
      </div>
      {scenario === "compose" && (
        <div className="tree-compose">
          <button
            type="button"
            onClick={apply}
            disabled={
              operations >= 16 || (mode !== "insert" && mode !== "delete")
            }
          >
            Apply to my BST
          </button>
          <button
            type="button"
            onClick={() => {
              setCustom({ rootId: null, nodes: [], nextId: 1 });
              setOperations(0);
              reset();
            }}
          >
            Clear my BST
          </button>
          <span>{operations} of 16 composed operations</span>
          {notice && <p role="alert">{notice}</p>}
        </div>
      )}
      {result.error && <p role="alert">{result.error}</p>}
      <div className="tree-main">
        <svg
          viewBox={`0 0 760 ${Math.max(120, (treeHeight(step.tree) + 1) * 76 + 80)}`}
          role="img"
          aria-label={`BST root ${step.tree.rootId ? nodeById.get(step.tree.rootId)!.key : "none"}; ${step.tree.nodes.length} nodes`}
        >
          {step.tree.nodes.flatMap((n) =>
            [n.left, n.right]
              .filter((x): x is string => !!x)
              .map((child) => {
                const a = place(n.id),
                  b = place(child);
                return (
                  <line
                    key={`${n.id}-${child}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke="#64748b"
                    strokeWidth="2"
                  />
                );
              }),
          )}
          {step.tree.nodes.map((n) => {
            const p = place(n.id),
              active = step.activeId === n.id,
              seen = step.visited.includes(n.id);
            return (
              <g
                key={n.id}
                aria-label={`${n.key} ${n.id}${active ? " current" : seen ? " visited" : ""}`}
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="24"
                  fill={active ? "#fbbf24" : seen ? "#bbf7d0" : "#f1f5f9"}
                  stroke="#334155"
                  strokeWidth="2"
                />
                <text
                  x={p.x}
                  y={p.y + 5}
                  textAnchor="middle"
                  fill="#0f172a"
                  fontWeight="bold"
                >
                  {n.key}
                </text>
                <text
                  x={p.x}
                  y={p.y + 40}
                  textAnchor="middle"
                  fill="currentColor"
                  fontSize="12"
                >
                  {n.id}
                </text>
              </g>
            );
          })}
        </svg>
        <div className="tree-state">
          <h4>Algorithm state</h4>
          <p>
            Root:{" "}
            {step.tree.rootId
              ? `${nodeById.get(step.tree.rootId)!.key} (${step.tree.rootId})`
              : "empty"}
            ; height: {treeHeight(step.tree)} edges; nodes:{" "}
            {step.tree.nodes.length}; minimum:{" "}
            {treeMinimum(step.tree)?.key ?? "none"}; maximum:{" "}
            {treeMaximum(step.tree)?.key ?? "none"}
          </p>
          <p>Comparison or action: {step.comparison}</p>
          <p>
            Path:{" "}
            {step.path
              .map((id) => `${nodeById.get(id)?.key ?? "removed"} (${id})`)
              .join(" → ") || "none"}
          </p>
          <p>
            Visited order:{" "}
            {step.visited
              .map((id) => nodeById.get(id)?.key ?? "removed")
              .join(" → ") || "none"}
          </p>
          <p>
            Recursive frames:{" "}
            {step.frames.map((id) => nodeById.get(id)?.key).join(" → ") ||
              "empty"}
          </p>
          <p>
            Queue front → rear:{" "}
            {step.queue.map((id) => nodeById.get(id)?.key).join(" → ") ||
              "empty"}
          </p>
          <p>Outcome: {step.outcome ?? "pending"}</p>
          <p>{step.invariant}</p>
          <h4>Text tree structure</h4>
          {step.tree.rootId ? (
            <ul>
              {step.tree.nodes.map((n) => (
                <li key={n.id}>
                  {n.key} ({n.id}): left{" "}
                  {n.left
                    ? `${nodeById.get(n.left)!.key} (${n.left})`
                    : "empty"}
                  ; right{" "}
                  {n.right
                    ? `${nodeById.get(n.right)!.key} (${n.right})`
                    : "empty"}
                </li>
              ))}
            </ul>
          ) : (
            <p>Empty tree: no root or child references.</p>
          )}
        </div>
      </div>
      <p role="status" aria-live="polite">
        Step {index + 1} of {steps.length}. {step.narration}
      </p>
      {index < steps.length - 1 && (
        <div
          className="tree-prediction"
          role="group"
          aria-label="Next key prediction"
        >
          <p>
            Predict the next key compared, visited, or structurally selected
          </p>
          <select
            aria-label="Tree prediction"
            value={prediction}
            onChange={(e) => setPrediction(e.target.value)}
          >
            <option value="">Choose</option>
            {[...new Set([...tree.nodes.map((n) => String(n.key)), key])]
              .filter(Boolean)
              .map((value) => (
                <option key={value}>{value}</option>
              ))}
            <option>None</option>
          </select>
          <button
            type="button"
            disabled={!prediction}
            onClick={() =>
              setFeedback(
                prediction === answer
                  ? `Correct. ${answer === "None" ? "No further key is selected." : `${answer} is next because ${nextRelevant?.narration.toLowerCase()}`}`
                  : `Next key: ${answer}. ${nextRelevant?.narration ?? "The operation is complete."}`,
              )
            }
          >
            Check prediction
          </button>
          {feedback && <p role="status">{feedback}</p>}
        </div>
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
          Reset operation
        </button>
      </div>
    </figure>
  );
}
