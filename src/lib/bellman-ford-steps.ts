/** Bounded, directed Bellman–Ford teaching trace. Distances are null for infinity. */
export type BellmanEdge = readonly [string, string, number];
export type BellmanGraph = { vertices: string[]; edges: BellmanEdge[] };
export type DestinationStatus = "finite" | "unreachable" | "unbounded";
export type BellmanStep = Readonly<{
  phase:
    | "initialization"
    | "pass-start"
    | "inspection"
    | "relaxation"
    | "pass-summary"
    | "early-stop"
    | "detection"
    | "propagation"
    | "complete";
  pass: number;
  edge: BellmanEdge | null;
  candidate: number | null;
  improved: boolean | null;
  distances: Readonly<Record<string, number | null>>;
  predecessors: Readonly<Record<string, string | null>>;
  negativeCycleDetected: boolean;
  affected: readonly string[];
  destinationStatus: DestinationStatus | null;
  path: readonly string[] | null;
  cost: number | null;
  witness: readonly string[] | null;
  narration: string;
}>;
export type BellmanScenario = {
  id: string;
  label: string;
  graph: BellmanGraph;
  start: string;
  destination: string;
  note?: string;
};
export const bellmanScenarios: BellmanScenario[] = [
  {
    id: "negative-edge",
    label: "Negative edge, no cycle",
    graph: {
      vertices: ["A", "B", "C", "D"],
      edges: [
        ["A", "B", 4],
        ["A", "C", 5],
        ["B", "C", -3],
        ["C", "D", 2],
      ],
    },
    start: "A",
    destination: "D",
  },
  {
    id: "dijkstra-counterexample",
    label: "Dijkstra settling counterexample",
    graph: {
      vertices: ["A", "B", "C"],
      edges: [
        ["A", "B", 2],
        ["A", "C", 5],
        ["C", "B", -10],
      ],
    },
    start: "A",
    destination: "B",
    note: "A standard Dijkstra settling B at 2 misses A → C → B at −5.",
  },
  {
    id: "zero-positive",
    label: "Positive and zero weights",
    graph: {
      vertices: ["A", "B", "C"],
      edges: [
        ["A", "B", 0],
        ["B", "C", 3],
        ["A", "C", 7],
      ],
    },
    start: "A",
    destination: "C",
  },
  {
    id: "reachable-cycle",
    label: "Reachable negative cycle",
    graph: {
      vertices: ["A", "B", "C", "D"],
      edges: [
        ["A", "B", 1],
        ["B", "C", -3],
        ["C", "B", 1],
        ["C", "D", 2],
      ],
    },
    start: "A",
    destination: "D",
  },
  {
    id: "unreachable-cycle",
    label: "Unreachable negative cycle",
    graph: {
      vertices: ["A", "B", "C", "D"],
      edges: [
        ["A", "B", 2],
        ["C", "D", -3],
        ["D", "C", 1],
      ],
    },
    start: "A",
    destination: "B",
  },
  {
    id: "partial-impact",
    label: "Cycle with unaffected destination",
    graph: {
      vertices: ["A", "B", "C", "D", "E"],
      edges: [
        ["A", "B", 1],
        ["B", "C", -3],
        ["C", "B", 1],
        ["C", "D", 2],
        ["A", "E", 4],
      ],
    },
    start: "A",
    destination: "E",
  },
  {
    id: "disconnected",
    label: "Disconnected graph",
    graph: { vertices: ["A", "B", "C"], edges: [["A", "B", 2]] },
    start: "A",
    destination: "C",
  },
  {
    id: "ties",
    label: "Equal costs and source destination",
    graph: {
      vertices: ["A", "B", "C"],
      edges: [
        ["A", "B", 1],
        ["A", "C", 1],
        ["C", "B", 0],
      ],
    },
    start: "A",
    destination: "A",
  },
];
export function validateBellmanGraph(
  graph: BellmanGraph,
  start?: string,
  destination?: string,
): BellmanEdge[] {
  if (
    !graph ||
    !Array.isArray(graph.vertices) ||
    graph.vertices.length < 1 ||
    graph.vertices.length > 9 ||
    graph.vertices.some((v) => typeof v !== "string" || !/^[A-I]$/.test(v)) ||
    new Set(graph.vertices).size !== graph.vertices.length
  )
    throw new Error("Use 1–9 distinct vertices labeled A–I.");
  if (!Array.isArray(graph.edges) || graph.edges.length > 18)
    throw new Error("Use at most 18 directed edges.");
  if (start !== undefined && !graph.vertices.includes(start))
    throw new Error("Choose a known source.");
  if (destination !== undefined && !graph.vertices.includes(destination))
    throw new Error("Choose a known destination.");
  const known = new Set(graph.vertices),
    seen = new Set<string>();
  for (const edge of graph.edges) {
    if (
      !Array.isArray(edge) ||
      edge.length !== 3 ||
      !known.has(edge[0]) ||
      !known.has(edge[1])
    )
      throw new Error("Every edge needs two known endpoints.");
    if (!Number.isSafeInteger(edge[2]) || edge[2] < -20 || edge[2] > 20)
      throw new Error("Weights must be integers from −20 through 20.");
    const key = `${edge[0]}:${edge[1]}`;
    if (seen.has(key)) throw new Error("Duplicate directed edge.");
    seen.add(key);
  }
  return graph.edges
    .map(([a, b, w]) => Object.freeze([a, b, w] as const))
    .sort((x, y) => x[0].localeCompare(y[0]) || x[1].localeCompare(y[1]));
}
export function reconstructBellmanPath(
  predecessors: Readonly<Record<string, string | null>>,
  distances: Readonly<Record<string, number | null>>,
  start: string,
  destination: string,
  affected: readonly string[] = [],
): string[] | null {
  if (
    !Object.hasOwn(distances, start) ||
    !Object.hasOwn(distances, destination) ||
    distances[destination] === null ||
    affected.includes(destination)
  )
    return null;
  const path: string[] = [],
    seen = new Set<string>();
  let cursor: string | null = destination;
  while (cursor !== null) {
    if (
      !Object.hasOwn(distances, cursor) ||
      seen.has(cursor) ||
      affected.includes(cursor)
    )
      return null;
    seen.add(cursor);
    path.push(cursor);
    if (cursor === start) return path.reverse();
    cursor = predecessors[cursor] ?? null;
  }
  return null;
}
function cycleWitness(
  predecessors: Record<string, string | null>,
  seed: string,
  edges: BellmanEdge[],
  count: number,
): string[] | null {
  let cursor: string | null = seed;
  for (let i = 0; i < count; i++) {
    cursor = cursor === null ? null : (predecessors[cursor] ?? null);
    if (cursor === null) return null;
  }
  const anchor = cursor,
    backward: string[] = [anchor];
  cursor = predecessors[anchor] ?? null;
  while (cursor !== null && cursor !== anchor && backward.length <= count) {
    backward.push(cursor);
    cursor = predecessors[cursor] ?? null;
  }
  if (cursor !== anchor) return null;
  const forward = [anchor, ...backward.slice(1).reverse(), anchor];
  const weights = new Map(edges.map(([a, b, w]) => [`${a}:${b}`, w]));
  let sum = 0;
  for (let i = 0; i < forward.length - 1; i++) {
    const w = weights.get(`${forward[i]}:${forward[i + 1]}`);
    if (w === undefined) return null;
    sum += w;
  }
  return sum < 0 ? forward : null;
}
export function generateBellmanSteps(
  graph: BellmanGraph,
  start: string,
  destination?: string,
): readonly BellmanStep[] {
  const edges = validateBellmanGraph(graph, start, destination),
    vertices = [...graph.vertices].sort();
  const distances: Record<string, number | null> = Object.fromEntries(
    vertices.map((v) => [v, null]),
  );
  const predecessors: Record<string, string | null> = Object.fromEntries(
    vertices.map((v) => [v, null]),
  );
  distances[start] = 0;
  const steps: BellmanStep[] = [];
  let detected = false,
    affected: string[] = [],
    witness: string[] | null = null;
  function add(
    phase: BellmanStep["phase"],
    pass: number,
    narration: string,
    edge: BellmanEdge | null = null,
    candidate: number | null = null,
    improved: boolean | null = null,
  ) {
    if (steps.length >= 450)
      throw new Error("Bellman–Ford trace limit exceeded.");
    const status: DestinationStatus | null =
      destination === undefined
        ? null
        : affected.includes(destination)
          ? "unbounded"
          : distances[destination] === null
            ? "unreachable"
            : "finite";
    const path =
      phase === "complete" && status === "finite" && destination
        ? reconstructBellmanPath(
            predecessors,
            distances,
            start,
            destination,
            affected,
          )
        : null;
    const snapshot: BellmanStep = Object.freeze({
      phase,
      pass,
      narration,
      edge,
      candidate,
      improved,
      distances: Object.freeze({ ...distances }),
      predecessors: Object.freeze({ ...predecessors }),
      negativeCycleDetected: detected,
      affected: Object.freeze([...affected]),
      destinationStatus: status,
      path: path ? Object.freeze(path) : null,
      cost:
        phase === "complete" && status === "finite" && path
          ? distances[destination!]
          : null,
      witness: witness ? Object.freeze([...witness]) : null,
    });
    steps.push(snapshot);
  }
  add(
    "initialization",
    0,
    `Set ${start} to 0; all other distances are ∞. Estimates remain tentative until detection finishes.`,
  );
  let early = false;
  for (let pass = 1; pass < vertices.length; pass++) {
    add(
      "pass-start",
      pass,
      `Pass ${pass}: inspect every directed edge in alphabetical source and target order.`,
    );
    let changes = 0;
    for (const edge of edges) {
      const [a, b, w] = edge,
        candidate = distances[a] === null ? null : distances[a] + w;
      add(
        "inspection",
        pass,
        candidate === null
          ? `${a} is unreachable, so ${a} → ${b} cannot relax.`
          : `Inspect ${a} → ${b}: ${distances[a]} + (${w}) = ${candidate}; current ${b} is ${distances[b] ?? "∞"}.`,
        edge,
        candidate,
      );
      const improve =
        candidate !== null &&
        (distances[b] === null || candidate < distances[b]);
      if (improve) {
        distances[b] = candidate;
        predecessors[b] = a;
        changes++;
      }
      add(
        "relaxation",
        pass,
        improve
          ? `Strict improvement: ${b} becomes ${candidate}, predecessor ${a}.`
          : `No strict improvement for ${b}; its distance and predecessor stay.`,
        edge,
        candidate,
        improve,
      );
    }
    add(
      "pass-summary",
      pass,
      `Pass ${pass} complete: ${changes} strict improvement${changes === 1 ? "" : "s"}.`,
    );
    if (changes === 0) {
      early = true;
      add(
        "early-stop",
        pass,
        "A complete pass made no changes. Further passes cannot improve a reachable distance.",
      );
      break;
    }
  }
  // Detect from final V−1 estimates. Only reachable sources can seed negative-cycle influence.
  const seeds = new Set<string>(),
    probeParents = { ...predecessors };
  let probeSeed: string | null = null;
  for (const [a, b, w] of edges) {
    const candidate = distances[a] === null ? null : distances[a] + w;
    if (
      candidate !== null &&
      (distances[b] === null || candidate < distances[b])
    ) {
      seeds.add(b);
      probeParents[b] = a;
      probeSeed = b;
    }
  }
  detected = seeds.size > 0;
  if (detected && probeSeed)
    witness = cycleWitness(probeParents, probeSeed, edges, vertices.length);
  add(
    "detection",
    vertices.length,
    detected
      ? `An additional check finds ${seeds.size} reachable relaxable target${seeds.size === 1 ? "" : "s"}. A reachable negative cycle exists.${witness ? ` Verified cycle: ${witness.join(" → ")}.` : " No verified cycle witness is shown."}`
      : `No reachable edge can improve after ${early ? "convergence" : "up to V−1 passes"}; no reachable negative cycle affects routes.`,
  );
  if (detected) {
    const queue = [...seeds].sort(),
      seen = new Set(queue);
    while (queue.length) {
      const current = queue.shift()!;
      for (const [a, b] of edges)
        if (a === current && !seen.has(b)) {
          seen.add(b);
          queue.push(b);
        }
    }
    affected = [...seen].sort();
    add(
      "propagation",
      vertices.length,
      `Negative-cycle influence reaches ${affected.join(", ")}. These destinations have no finite shortest-path cost; other reachable vertices keep finite answers.`,
    );
  }
  const classification =
    destination === undefined
      ? "Choose a destination to inspect its final classification."
      : affected.includes(destination)
        ? `${destination} is negatively unbounded (−∞); no finite shortest path exists.`
        : distances[destination] === null
          ? `${destination} is unreachable (∞).`
          : `${destination} has finite cost ${distances[destination]}.`;
  add("complete", vertices.length, `Completed. ${classification}`);
  return Object.freeze(steps);
}
