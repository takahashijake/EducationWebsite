import {
  generateWeightedSteps,
  weightedAdjacency,
  type WeightedGraph,
} from "@/lib/weighted-graph-steps";

export const INVARIANT_JOURNEY_REVISION = 1;
export const REVISIT_INTERVAL_MS = 24 * 60 * 60 * 1000;

type PredictionCase = {
  id: string;
  graph: WeightedGraph;
  checkpoint: { vertex: string; neighbor: string };
  choices: { id: string; label: string; why: string }[];
};

export const predictionCases: PredictionCase[] = [
  {
    id: "junction-minimum",
    graph: {
      vertices: ["A", "B", "C", "D"],
      directed: true,
      edges: [
        ["A", "B", 4],
        ["A", "C", 1],
        ["C", "B", 1],
        ["C", "D", 7],
        ["B", "D", 2],
      ],
    },
    checkpoint: { vertex: "C", neighbor: "D" },
    choices: [
      {
        id: "B",
        label: "Settle B at 2",
        why: "B has the smallest valid tentative distance. Its old entry at 4 is stale.",
      },
      {
        id: "D",
        label: "Settle D at 8",
        why: "D is tentative at 8, but B has a smaller valid entry at 2.",
      },
      {
        id: "old-B",
        label: "Settle B at 4",
        why: "The older B entry at 4 no longer matches B's current estimate of 2.",
      },
    ],
  },
  {
    id: "zero-link-minimum",
    graph: {
      vertices: ["A", "B", "C", "D"],
      directed: true,
      edges: [
        ["A", "B", 5],
        ["A", "C", 2],
        ["C", "B", 0],
        ["C", "D", 4],
        ["B", "D", 1],
      ],
    },
    checkpoint: { vertex: "C", neighbor: "D" },
    choices: [
      {
        id: "B",
        label: "Settle B at 2",
        why: "The zero-cost C → B edge improves B from 5 to 2; B is the valid minimum.",
      },
      {
        id: "D",
        label: "Settle D at 6",
        why: "D is tentative at 6; B's valid entry at 2 comes first.",
      },
      {
        id: "old-B",
        label: "Settle B at 5",
        why: "The queued B entry at 5 is stale after the zero-cost improvement.",
      },
    ],
  },
];

export function predictionCase(seed: number) {
  if (!Number.isSafeInteger(seed) || seed < 0)
    throw new Error("Invalid journey seed.");
  return predictionCases[Math.abs(Math.trunc(seed)) % predictionCases.length];
}

export function predictionState(item: PredictionCase) {
  const steps = generateWeightedSteps(item.graph, "A", "D");
  const index = steps.findIndex(
    (step) =>
      step.phase === "relax" &&
      step.edge?.[0] === item.checkpoint.vertex &&
      step.edge?.[1] === item.checkpoint.neighbor,
  );
  if (index < 0) throw new Error("Missing authored prediction checkpoint.");
  const next = steps.slice(index + 1).find((step) => step.phase === "select");
  if (!next?.current) throw new Error("Missing authored minimum selection.");
  return { before: steps[index], next, correctId: next.current };
}

export type TransferCase = {
  id: string;
  title: string;
  network: string;
  graph: WeightedGraph;
  start: string;
  target: string;
  prompt: string;
  reasoning: string;
  kind: "route" | "suitability";
};

export const transferCases: TransferCase[] = [
  {
    id: "express-versus-transfer",
    title: "A free interchange changes the route",
    network: "A directed transit network; edges are travel minutes.",
    graph: {
      vertices: ["A", "B", "C", "D", "E"],
      directed: true,
      edges: [
        ["A", "B", 3],
        ["A", "C", 1],
        ["C", "B", 0],
        ["B", "D", 3],
        ["C", "E", 6],
        ["E", "D", 1],
      ],
    },
    start: "A",
    target: "D",
    kind: "route",
    prompt:
      "Give a minimum-cost route from A to D and its total cost. A zero-minute connection is a real edge.",
    reasoning:
      "A → C → B → D costs 1 + 0 + 3 = 4. C improves B from 3 to 1, making the old B entry stale. The later route through E costs 8.",
  },
  {
    id: "equal-platforms",
    title: "Two equally quick platforms",
    network: "A directed station network; edges are travel minutes.",
    graph: {
      vertices: ["A", "B", "C", "D", "E"],
      directed: true,
      edges: [
        ["A", "D", 8],
        ["A", "B", 1],
        ["A", "C", 1],
        ["B", "D", 2],
        ["C", "D", 2],
        ["E", "A", 0],
      ],
    },
    start: "A",
    target: "D",
    kind: "route",
    prompt:
      "Give any minimum-cost route from A to D and its total cost. More than one route may be valid; E cannot be reached from A.",
    reasoning:
      "A → B → D and A → C → D both cost 3. The old direct entry for D at 8 becomes stale. E is unreachable from A despite its outgoing edge.",
  },
  {
    id: "credit-edge",
    title: "A route with a travel credit",
    network:
      "A directed network includes a negative travel credit on one edge.",
    graph: {
      vertices: ["A", "B", "C"],
      directed: true,
      edges: [
        ["A", "B", 2],
        ["A", "C", 5],
        ["C", "B", -6],
      ],
    },
    start: "A",
    target: "B",
    kind: "suitability",
    prompt:
      "Can Dijkstra safely finalize B when it first removes B at cost 2? Choose the action justified by the invariant.",
    reasoning:
      "No. The later A → C → B route costs -1. A negative edge can improve an already settled vertex; use an algorithm suited to negative edges, such as Bellman–Ford.",
  },
];

export function initialTransferCase(seed: number) {
  if (!Number.isSafeInteger(seed) || seed < 0)
    throw new Error("Invalid journey seed.");
  return transferCases[Math.abs(Math.trunc(seed)) % 2];
}
export const revisitTransferCase = transferCases[2];

export function evaluateTransfer(
  item: TransferCase,
  answer: { path?: string; cost?: string; suitable?: string },
) {
  if (
    (answer.path !== undefined &&
      (typeof answer.path !== "string" || answer.path.length > 80)) ||
    (answer.cost !== undefined &&
      (typeof answer.cost !== "string" || answer.cost.length > 20)) ||
    (answer.suitable !== undefined && typeof answer.suitable !== "string")
  )
    return {
      correct: false,
      feedback: "Enter a short route and cost, or choose a valid action.",
    };
  if (item.kind === "suitability") {
    let rejected = false;
    try {
      generateWeightedSteps(item.graph, item.start, item.target);
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !error.message.includes("Weight must be")
      )
        throw error;
      rejected = true;
    }
    if (!rejected) throw new Error("Authored negative-edge case was accepted.");
    return { correct: answer.suitable === "no", feedback: item.reasoning };
  }
  const steps = generateWeightedSteps(item.graph, item.start, item.target);
  const optimal = steps.at(-1)?.distances[item.target];
  const adjacency = weightedAdjacency(item.graph);
  const path = (answer.path ?? "")
    .toUpperCase()
    .split(/\s*(?:→|->|,|\s)\s*/)
    .filter(Boolean);
  const cost = Number(answer.cost);
  if (!Number.isSafeInteger(cost) || !/^(0|[1-9]\d*)$/.test(answer.cost ?? ""))
    return {
      correct: false,
      feedback: "Enter a nonnegative integer total cost. " + item.reasoning,
    };
  if (
    path[0] !== item.start ||
    path.at(-1) !== item.target ||
    path.length > item.graph.vertices.length
  )
    return {
      correct: false,
      feedback:
        "Give a route from the stated start to destination. " + item.reasoning,
    };
  let actual = 0;
  const visited = new Set<string>();
  for (let i = 0; i < path.length; i++) {
    if (visited.has(path[i]))
      return {
        correct: false,
        feedback:
          "Use a simple route without repeated vertices. " + item.reasoning,
      };
    visited.add(path[i]);
    if (i === 0) continue;
    const edge = adjacency[path[i - 1]]?.find((entry) => entry.to === path[i]);
    if (!edge)
      return {
        correct: false,
        feedback: "That directed connection does not exist. " + item.reasoning,
      };
    actual += edge.weight;
  }
  return {
    correct: actual === cost && actual === optimal,
    feedback:
      actual !== cost
        ? `The listed route costs ${actual}, not ${cost}. ${item.reasoning}`
        : item.reasoning,
  };
}
