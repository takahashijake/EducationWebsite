/** Small authored graphs. Labels are unique A–J; neighbors are explored alphabetically. */
export type Graph = {
  vertices: string[];
  edges: [string, string][];
  directed: boolean;
};
export type GraphAlgorithm = "bfs" | "dfs";
export type GraphPhase =
  "initial" | "discover" | "examine" | "finish" | "backtrack" | "complete";
export type GraphFrame = { vertex: string; nextNeighbor: number };
export type GraphStep = {
  phase: GraphPhase;
  active: string | null;
  examined: [string, string] | null;
  discovered: string[];
  finished: string[];
  frontier: string[];
  frames: GraphFrame[];
  parents: Record<string, string | null>;
  distances: Record<string, number>;
  order: string[];
  narration: string;
};
export const MAX_GRAPH_VERTICES = 9;
export const MAX_GRAPH_EDGES = 18;
export const graphScenarios: { id: string; label: string; graph: Graph }[] = [
  {
    id: "chain",
    label: "Simple chain",
    graph: {
      vertices: ["A", "B", "C", "D"],
      edges: [
        ["A", "B"],
        ["B", "C"],
        ["C", "D"],
      ],
      directed: false,
    },
  },
  {
    id: "branch",
    label: "Branching graph",
    graph: {
      vertices: ["A", "B", "C", "D", "E"],
      edges: [
        ["A", "B"],
        ["A", "C"],
        ["B", "D"],
        ["C", "E"],
      ],
      directed: false,
    },
  },
  {
    id: "cycle",
    label: "Cycle",
    graph: {
      vertices: ["A", "B", "C", "D"],
      edges: [
        ["A", "B"],
        ["B", "C"],
        ["C", "A"],
        ["C", "D"],
      ],
      directed: false,
    },
  },
  {
    id: "disconnected",
    label: "Disconnected",
    graph: {
      vertices: ["A", "B", "C", "D", "E"],
      edges: [
        ["A", "B"],
        ["C", "D"],
      ],
      directed: false,
    },
  },
  {
    id: "directed",
    label: "Directed edges",
    graph: {
      vertices: ["A", "B", "C", "D"],
      edges: [
        ["A", "B"],
        ["C", "A"],
        ["B", "D"],
      ],
      directed: true,
    },
  },
  {
    id: "routes",
    label: "Two shortest routes",
    graph: {
      vertices: ["A", "B", "C", "D"],
      edges: [
        ["A", "B"],
        ["A", "C"],
        ["B", "D"],
        ["C", "D"],
      ],
      directed: false,
    },
  },
];

export function graphAdjacency(graph: Graph): Record<string, string[]> {
  if (
    !Array.isArray(graph.vertices) ||
    graph.vertices.length < 1 ||
    graph.vertices.length > MAX_GRAPH_VERTICES ||
    !Array.isArray(graph.edges) ||
    graph.edges.length > MAX_GRAPH_EDGES
  )
    throw new Error("Graph needs 1–9 vertices and at most 18 edges.");
  if (typeof graph.directed !== "boolean")
    throw new Error("Choose directed or undirected edges.");
  const vertices = graph.vertices;
  if (
    vertices.some((v) => typeof v !== "string" || !/^[A-J]$/.test(v)) ||
    new Set(vertices).size !== vertices.length
  )
    throw new Error("Use distinct vertex labels A–J.");
  const adjacency = Object.fromEntries(
    vertices.map((v) => [v, [] as string[]]),
  ) as Record<string, string[]>;
  const seen = new Set<string>();
  for (const edge of graph.edges) {
    if (
      !Array.isArray(edge) ||
      edge.length !== 2 ||
      !vertices.includes(edge[0]) ||
      !vertices.includes(edge[1])
    )
      throw new Error("Every edge must join known vertices.");
    const [a, b] = edge;
    const key = graph.directed ? `${a}>${b}` : [a, b].sort().join("-");
    if (seen.has(key)) throw new Error("Duplicate edge.");
    seen.add(key);
    adjacency[a].push(b);
    if (!graph.directed && a !== b) adjacency[b].push(a);
  }
  for (const list of Object.values(adjacency)) list.sort();
  return adjacency;
}

export function graphPath(
  step: GraphStep,
  start: string,
  target: string,
): string[] | null {
  if (!Object.hasOwn(step.parents, target) || !Object.hasOwn(step.parents, start))
    return null;
  const path: string[] = [];
  let current: string | null = target;
  while (current !== null) {
    path.unshift(current);
    if (current === start) return path;
    current = step.parents[current] ?? null;
  }
  return null;
}

/** Each emitted step owns copies of every mutable collection. Self-loops are legal and examined once. */
export function generateGraphSteps(
  graph: Graph,
  algorithm: GraphAlgorithm,
  start: string,
  target?: string,
): GraphStep[] {
  const adjacency = graphAdjacency(graph);
  if (algorithm !== "bfs" && algorithm !== "dfs")
    throw new Error("Choose BFS or DFS.");
  if (
    !Object.hasOwn(adjacency, start) ||
    (target !== undefined && !Object.hasOwn(adjacency, target))
  )
    throw new Error("Start and target must be vertices.");
  const discovered = new Set<string>();
  const finished = new Set<string>();
  const parents: Record<string, string | null> = {};
  const distances: Record<string, number> = {};
  const order: string[] = [];
  const queue: string[] = [];
  const frames: GraphFrame[] = [];
  const steps: GraphStep[] = [];
  const emit = (
    phase: GraphPhase,
    narration: string,
    active: string | null = null,
    examined: [string, string] | null = null,
  ) => {
    steps.push({
      phase,
      active,
      examined: examined ? ([...examined] as [string, string]) : null,
      discovered: [...discovered],
      finished: [...finished],
      frontier: algorithm === "bfs" ? [...queue] : frames.map((f) => f.vertex),
      frames: frames.map((f) => ({ ...f })),
      parents: { ...parents },
      distances: { ...distances },
      order: [...order],
      narration,
    });
  };
  emit(
    "initial",
    `Start at ${start}. Only vertices reachable from it can be visited.`,
  );
  discovered.add(start);
  parents[start] = null;
  distances[start] = 0;
  order.push(start);
  if (algorithm === "bfs") {
    queue.push(start);
    emit(
      "discover",
      `Discover ${start} and enqueue it. Mark on enqueue to prevent duplicates.`,
      start,
    );
    while (queue.length) {
      const vertex = queue.shift()!;
      emit(
        "examine",
        `Dequeue ${vertex}; inspect its neighbors in alphabetical order.`,
        vertex,
      );
      for (const neighbor of adjacency[vertex]) {
        if (!discovered.has(neighbor)) {
          discovered.add(neighbor);
          parents[neighbor] = vertex;
          distances[neighbor] = distances[vertex] + 1;
          order.push(neighbor);
          queue.push(neighbor);
          emit(
            "discover",
            `Examine ${vertex} → ${neighbor}. Discover and enqueue ${neighbor}; its distance is ${distances[neighbor]}.`,
            vertex,
            [vertex, neighbor],
          );
        } else
          emit(
            "examine",
            `Examine ${vertex} → ${neighbor}. Already discovered, so do not enqueue it again.`,
            vertex,
            [vertex, neighbor],
          );
      }
      finished.add(vertex);
      emit(
        "finish",
        `Finished ${vertex}. The queue contains the next distance layer.`,
        vertex,
      );
    }
  } else {
    frames.push({ vertex: start, nextNeighbor: 0 });
    emit(
      "discover",
      `Discover ${start} and push its DFS frame. Each frame acts like a recursive call.`,
      start,
    );
    while (frames.length) {
      const frame = frames[frames.length - 1];
      const neighbors = adjacency[frame.vertex];
      if (frame.nextNeighbor === neighbors.length) {
        frames.pop();
        finished.add(frame.vertex);
        emit(
          "backtrack",
          `No unexplored neighbors of ${frame.vertex}; return to the previous DFS frame.`,
          frame.vertex,
        );
        continue;
      }
      const neighbor = neighbors[frame.nextNeighbor++];
      if (discovered.has(neighbor)) {
        emit(
          "examine",
          `Examine ${frame.vertex} → ${neighbor}; it was discovered already, so skip it.`,
          frame.vertex,
          [frame.vertex, neighbor],
        );
      } else {
        discovered.add(neighbor);
        parents[neighbor] = frame.vertex;
        distances[neighbor] = distances[frame.vertex] + 1;
        order.push(neighbor);
        frames.push({ vertex: neighbor, nextNeighbor: 0 });
        emit(
          "discover",
          `Examine ${frame.vertex} → ${neighbor}; discover ${neighbor} and descend before trying another neighbor.`,
          neighbor,
          [frame.vertex, neighbor],
        );
      }
    }
  }
  const unreachable = graph.vertices.filter((v) => !discovered.has(v));
  const path =
    target && algorithm === "bfs"
      ? graphPath(steps.at(-1)!, start, target)
      : null;
  emit(
    "complete",
    `Traversal complete. ${unreachable.length ? `Unreachable: ${unreachable.join(", ")}.` : "Every vertex was reached."}${target && algorithm === "bfs" ? ` Path to ${target}: ${path?.join(" → ") ?? "unreachable"}.` : ""}`,
  );
  return steps;
}
