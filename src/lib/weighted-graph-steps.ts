/** Bounded, deterministic Dijkstra trace. Labels and neighbors sort lexically. */
export const MAX_WEIGHTED_VERTICES = 9;
export const MAX_WEIGHTED_EDGES = 18;
export const MAX_EDGE_WEIGHT = 999;
export const MAX_WEIGHTED_STEPS = 128;
export const MAX_WEIGHTED_QUEUE = 2 * MAX_WEIGHTED_EDGES + 1;
export type WeightedEdge = readonly [string, string, number];
export type WeightedGraph = {
  vertices: string[];
  edges: WeightedEdge[];
  directed: boolean;
};
export type QueueEntry = { vertex: string; distance: number; sequence: number };
export type WeightedStep = {
  phase: "initial" | "select" | "settle" | "relax" | "stale" | "complete";
  current: string | null;
  edge: WeightedEdge | null;
  candidate: number | null;
  improved: boolean | null;
  distances: Record<string, number | null>;
  predecessors: Record<string, string | null>;
  settled: string[];
  unsettled: string[];
  queue: QueueEntry[];
  selectedMinimum: QueueEntry | null;
  path: string[] | null;
  pathCost: number | null;
  unreachable: string[];
  narration: string;
};
export const weightedScenarios: {
  id: string;
  label: string;
  graph: WeightedGraph;
  start: string;
  destination: string;
}[] = [
  {
    id: "cheaper-detour",
    label: "Cheaper longer route and stale entry",
    graph: {
      vertices: ["A", "B", "C", "D"],
      edges: [
        ["A", "D", 9],
        ["A", "B", 2],
        ["B", "C", 2],
        ["C", "D", 2],
      ],
      directed: false,
    },
    start: "A",
    destination: "D",
  },
  {
    id: "equal-routes",
    label: "Equal-cost alternatives",
    graph: {
      vertices: ["A", "B", "C", "D"],
      edges: [
        ["A", "B", 2],
        ["A", "C", 2],
        ["B", "D", 3],
        ["C", "D", 3],
      ],
      directed: false,
    },
    start: "A",
    destination: "D",
  },
  {
    id: "unreachable",
    label: "Unreachable destination",
    graph: {
      vertices: ["A", "B", "C", "D"],
      edges: [
        ["A", "B", 4],
        ["C", "D", 1],
      ],
      directed: false,
    },
    start: "A",
    destination: "D",
  },
  {
    id: "directed-zero",
    label: "Directed zero-weight edge",
    graph: {
      vertices: ["A", "B", "C", "D"],
      edges: [
        ["A", "B", 0],
        ["B", "C", 2],
        ["A", "C", 5],
        ["D", "A", 1],
      ],
      directed: true,
    },
    start: "A",
    destination: "C",
  },
  {
    id: "same-vertex",
    label: "Start equals destination",
    graph: { vertices: ["A", "B"], edges: [["A", "B", 7]], directed: false },
    start: "A",
    destination: "A",
  },
];
export function weightedAdjacency(
  graph: WeightedGraph,
): Record<string, { to: string; weight: number }[]> {
  if (
    !Array.isArray(graph.vertices) ||
    graph.vertices.length < 1 ||
    graph.vertices.length > MAX_WEIGHTED_VERTICES ||
    !Array.isArray(graph.edges) ||
    graph.edges.length > MAX_WEIGHTED_EDGES
  )
    throw new Error("Use 1–9 vertices and at most 18 edges.");
  if (
    typeof graph.directed !== "boolean" ||
    graph.vertices.some((v) => typeof v !== "string" || !/^[A-I]$/.test(v)) ||
    new Set(graph.vertices).size !== graph.vertices.length
  )
    throw new Error("Use distinct vertex labels A–I and choose directedness.");
  const adjacency = Object.fromEntries(
    graph.vertices.map((v) => [v, [] as { to: string; weight: number }[]]),
  );
  const seen = new Set<string>();
  for (const edge of graph.edges) {
    if (
      !Array.isArray(edge) ||
      edge.length !== 3 ||
      !Object.hasOwn(adjacency, edge[0]) ||
      !Object.hasOwn(adjacency, edge[1])
    )
      throw new Error("Every weighted edge needs two known endpoints.");
    const [from, to, weight] = edge;
    if (!Number.isSafeInteger(weight) || weight < 0 || weight > MAX_EDGE_WEIGHT)
      throw new Error("Weight must be a finite integer from 0 to 999.");
    const key = graph.directed ? `${from}>${to}` : [from, to].sort().join("-");
    if (seen.has(key)) throw new Error("Duplicate weighted edge.");
    seen.add(key);
    adjacency[from].push({ to, weight });
    if (!graph.directed && from !== to)
      adjacency[to].push({ to: from, weight });
  }
  for (const list of Object.values(adjacency))
    list.sort((a, b) => a.to.localeCompare(b.to));
  return adjacency;
}
function compare(a: QueueEntry, b: QueueEntry) {
  return (
    a.distance - b.distance ||
    a.vertex.localeCompare(b.vertex) ||
    a.sequence - b.sequence
  );
}
/** Binary min-heap; sequence orders otherwise identical lazy entries. */
class MinHeap {
  private items: QueueEntry[] = [];
  get length() {
    return this.items.length;
  }
  sorted() {
    return [...this.items].sort(compare).map((item) => ({ ...item }));
  }
  push(item: QueueEntry) {
    if (this.items.length >= MAX_WEIGHTED_QUEUE)
      throw new Error("Weighted priority queue exceeds its entry limit.");
    let i = this.items.length;
    this.items.push(item);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (compare(this.items[p], item) <= 0) break;
      this.items[i] = this.items[p];
      i = p;
    }
    this.items[i] = item;
  }
  pop(): QueueEntry {
    const root = this.items[0];
    const tail = this.items.pop()!;
    if (this.items.length) {
      let i = 0;
      while (2 * i + 1 < this.items.length) {
        let child = 2 * i + 1;
        if (
          child + 1 < this.items.length &&
          compare(this.items[child + 1], this.items[child]) < 0
        )
          child++;
        if (compare(tail, this.items[child]) <= 0) break;
        this.items[i] = this.items[child];
        i = child;
      }
      this.items[i] = tail;
    }
    return root;
  }
}
export function reconstructWeightedPath(
  predecessors: Record<string, string | null>,
  distances: Record<string, number | null>,
  start: string,
  target: string,
): string[] | null {
  if (
    !Object.hasOwn(distances, start) ||
    !Object.hasOwn(distances, target) ||
    distances[target] === null
  )
    return null;
  const path: string[] = [],
    seen = new Set<string>();
  let vertex: string | null = target;
  while (vertex !== null && !seen.has(vertex)) {
    path.unshift(vertex);
    seen.add(vertex);
    if (vertex === start) return path;
    vertex = predecessors[vertex] ?? null;
  }
  return null;
}
/** Strict improvement preserves the first alphabetical equal-cost parent, even across zero cycles. */
export function generateWeightedSteps(
  graph: WeightedGraph,
  start: string,
  destination?: string,
): WeightedStep[] {
  const adjacency = weightedAdjacency(graph);
  if (
    !Object.hasOwn(adjacency, start) ||
    (destination !== undefined && !Object.hasOwn(adjacency, destination))
  )
    throw new Error("Start and destination must be vertices.");
  const vertices = [...graph.vertices].sort();
  const distances: Record<string, number | null> = Object.fromEntries(
    vertices.map((v) => [v, null]),
  );
  const predecessors: Record<string, string | null> = Object.fromEntries(
    vertices.map((v) => [v, null]),
  );
  const settled = new Set<string>();
  const heap = new MinHeap();
  const steps: WeightedStep[] = [];
  let sequence = 0;
  distances[start] = 0;
  heap.push({ vertex: start, distance: 0, sequence: sequence++ });
  const emit = (
    phase: WeightedStep["phase"],
    narration: string,
    current: string | null = null,
    edge: WeightedEdge | null = null,
    candidate: number | null = null,
    improved: boolean | null = null,
    selectedMinimum: QueueEntry | null = null,
  ) => {
    if (steps.length >= MAX_WEIGHTED_STEPS)
      throw new Error("Weighted trace exceeds its step limit.");
    const path = destination
      ? reconstructWeightedPath(predecessors, distances, start, destination)
      : null;
    const step: WeightedStep = {
      phase,
      narration,
      current,
      edge: edge ? ([...edge] as [string, string, number]) : null,
      candidate,
      improved,
      distances: { ...distances },
      predecessors: { ...predecessors },
      settled: [...settled].sort(),
      unsettled: vertices.filter((v) => !settled.has(v)),
      queue: heap.sorted(),
      selectedMinimum: selectedMinimum ? { ...selectedMinimum } : null,
      path,
      pathCost: destination && path ? distances[destination] : null,
      unreachable:
        phase === "complete"
          ? vertices.filter((v) => distances[v] === null)
          : [],
    };
    Object.freeze(step.distances);
    Object.freeze(step.predecessors);
    Object.freeze(step.settled);
    Object.freeze(step.unsettled);
    step.queue.forEach(Object.freeze);
    Object.freeze(step.queue);
    if (step.edge) Object.freeze(step.edge);
    if (step.path) Object.freeze(step.path);
    Object.freeze(step.unreachable);
    if (step.selectedMinimum) Object.freeze(step.selectedMinimum);
    steps.push(Object.freeze(step));
  };
  emit(
    "initial",
    `Start at ${start} with distance 0; all other estimates are infinity.`,
  );
  while (heap.length) {
    const entry = heap.pop();
    if (
      settled.has(entry.vertex) ||
      distances[entry.vertex] !== entry.distance
    ) {
      emit(
        "stale",
        `Skip stale queue entry (${entry.vertex}, ${entry.distance}): ${entry.vertex} is ${settled.has(entry.vertex) ? "already settled" : `now estimated at ${distances[entry.vertex]}`}.`,
        entry.vertex,
        null,
        null,
        null,
        entry,
      );
      continue;
    }
    emit(
      "select",
      `Pop minimum (${entry.vertex}, ${entry.distance}); alphabetical labels break distance ties.`,
      entry.vertex,
      null,
      null,
      null,
      entry,
    );
    settled.add(entry.vertex);
    emit(
      "settle",
      `Settle ${entry.vertex} at ${entry.distance}. Nonnegative edges cannot later produce a shorter route to it.`,
      entry.vertex,
    );
    for (const { to, weight } of adjacency[entry.vertex]) {
      const candidate = entry.distance + weight;
      const old = distances[to];
      const improved = !settled.has(to) && (old === null || candidate < old);
      if (improved) {
        distances[to] = candidate;
        predecessors[to] = entry.vertex;
        heap.push({ vertex: to, distance: candidate, sequence: sequence++ });
      }
      emit(
        "relax",
        improved
          ? `${entry.vertex} → ${to}: ${entry.distance} + ${weight} = ${candidate} improves ${old ?? "∞"}; set predecessor ${to} ← ${entry.vertex}.`
          : `${entry.vertex} → ${to}: ${entry.distance} + ${weight} = ${candidate} does not improve ${old ?? "∞"}${candidate === old ? "; equal cost keeps the first predecessor" : ""}.`,
        entry.vertex,
        [entry.vertex, to, weight],
        candidate,
        improved,
      );
    }
  }
  const unreachable = vertices.filter((v) => distances[v] === null);
  const route = destination
    ? reconstructWeightedPath(predecessors, distances, start, destination)
    : null;
  emit(
    "complete",
    `Complete. ${unreachable.length ? `Unreachable: ${unreachable.join(", ")}.` : "All vertices reachable."}${destination ? ` Path to ${destination}: ${route?.join(" → ") ?? "unreachable"}${route ? `; total cost ${distances[destination]}.` : "."}` : ""}`,
  );
  return Object.freeze(steps) as unknown as WeightedStep[];
}
