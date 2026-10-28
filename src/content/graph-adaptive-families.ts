import type { AdaptiveFamily } from "./adaptive-families";
type R = Parameters<AdaptiveFamily["generate"]>[0];
type Draft = ReturnType<AdaptiveFamily["generate"]>;
type Choice = Draft["choices"][number];
const yes = (text: string): Choice => ({ text, correct: true });
const no = (text: string, misconception: string): Choice => ({
  text,
  misconception,
});
const family = (
  id: string,
  skillId: string,
  difficulty: "foundation" | "application",
  generate: (r: R) => Draft,
): AdaptiveFamily => ({
  id: `graph-${id}`,
  skillId,
  difficulty,
  revision: 1,
  topicId: "graphs",
  reviewHref: "/lessons/graphs",
  generate,
});
const draft = (
  prompt: string,
  context: string,
  choices: [Choice, Choice, Choice],
  explanation: string,
  hint: string,
): Draft => ({
  prompt,
  context,
  choices,
  explanation,
  hints: [hint, explanation],
  workedStep: explanation,
});
const names = (r: R) => {
  const letters = "ABCDEFGHIJ";
  const offset = r.int(0, 5),
    gap = r.int(1, 3);
  return [
    letters[offset],
    letters[offset + gap],
    letters[offset + gap + 1],
  ] as [string, string, string];
};
export const graphAdaptiveFamilies: AdaptiveFamily[] = [
  family("adj-neighbors", "graph-adjacency", "foundation", (r) => {
    const [a, b, c] = names(r),
      extra = r.int(0, 1) === 1;
    return draft(
      `What are ${a}'s sorted neighbors?`,
      `Undirected edges: ${a}—${b}${extra ? `, ${a}—${c}` : `, ${b}—${c}`}.`,
      [
        yes(extra ? `${b}, ${c}` : b),
        no(
          extra ? b : `${b}, ${c}`,
          "A neighbor needs a direct edge, not just a path or one selected edge.",
        ),
        no("none", "An edge touches the selected vertex."),
      ],
      `Only direct edges touching ${a} enter its neighbor list.`,
      "Look for edges incident to the selected vertex.",
    );
  }),
  family("adj-storage", "graph-adjacency", "application", (r) => {
    const v = r.int(5, 9),
      e = r.int(1, v - 2);
    return draft(
      "Which representation avoids storing a full square table?",
      `${v} vertices and ${e} edges; most vertex pairs are not adjacent.`,
      [
        yes("Adjacency list"),
        no(
          "Adjacency matrix",
          "A matrix reserves a cell for every vertex pair, even absent edges.",
        ),
        no(
          "Neither; both require the same cells",
          "Lists store present neighbors while matrices reserve V² cells.",
        ),
      ],
      `This graph is sparse: a list stores O(V + E) entries rather than ${v}² matrix cells.`,
      "Compare existing edges with all possible pairs.",
    );
  }),
  family("direction-reach", "graph-direction", "foundation", (r) => {
    const [a, b, c] = names(r),
      reverse = r.int(0, 1) === 1;
    return draft(
      `Can ${a} reach ${c} by following arrows?`,
      reverse ? `${b} → ${a}; ${c} → ${b}.` : `${a} → ${b}; ${b} → ${c}.`,
      [
        reverse
          ? no(
              "Yes",
              "Arrows point toward the start; directed paths cannot reverse them.",
            )
          : yes("Yes"),
        reverse
          ? yes("No")
          : no(
              "No",
              "The two arrows form a forward path through the middle vertex.",
            ),
        no("Only with DFS", "BFS and DFS follow the same edge directions."),
      ],
      reverse
        ? `Both arrows point toward ${a}, so ${c} is unreachable from it.`
        : `${a} → ${b} → ${c} is a directed path.`,
      "Follow arrows from the chosen start; never traverse backward.",
    );
  }),
  family("direction-list", "graph-direction", "application", (r) => {
    const [a, b, c] = names(r),
      directed = r.int(0, 1) === 1;
    return draft(
      `Is ${a} a neighbor of ${b} in the adjacency list?`,
      `${directed ? "Directed" : "Undirected"} edge ${a} ${directed ? "→" : "—"} ${b}; ${c} is isolated.`,
      [
        directed
          ? no(
              "Yes",
              "The directed arrow gives an outgoing neighbor only from its source.",
            )
          : yes("Yes"),
        directed
          ? yes("No")
          : no(
              "No",
              "Undirected edges are represented in both adjacency lists.",
            ),
        no(
          "Only if BFS starts there",
          "Adjacency is a graph property, independent of traversal start.",
        ),
      ],
      directed
        ? `${b} has no outgoing edge back to ${a}.`
        : `The undirected edge appears in both directions.`,
      "Ask whether the edge can be followed from the selected vertex.",
    );
  }),
  family("bfs-front", "graph-bfs", "foundation", (r) => {
    const [a, b, c] = names(r),
      first = r.int(0, 1) === 1 ? b : c,
      second = first === b ? c : b;
    return draft(
      "Which vertex is processed next?",
      `BFS queue front → [${first}, ${second}] ← rear; ${a} is finished.`,
      [
        yes(first),
        no(second, "BFS dequeues from the front, not the rear."),
        no(a, "A finished vertex is no longer in the queue."),
      ],
      `${first} is at the FIFO front and leaves before ${second}.`,
      "Read queue direction before choosing.",
    );
  }),
  family("bfs-duplicate", "graph-bfs", "application", (r) => {
    const [a, b, c] = names(r),
      mode = r.int(0, 1);
    return draft(
      `Should ${c} be enqueued from ${b}?`,
      `${a} and ${b} each have an edge to ${c}. ${mode ? `${c} was already discovered from ${a}.` : `${c} has not been discovered yet.`}`,
      [
        mode
          ? no(
              "Yes",
              "BFS marks a vertex on first enqueue; another route does not add it again.",
            )
          : yes("Yes"),
        mode
          ? yes("No")
          : no("No", "An undiscovered neighbor should be marked and enqueued."),
        no(
          "Only if DFS would visit it",
          "BFS's visited rule does not depend on DFS.",
        ),
      ],
      mode
        ? `${c} already has a parent and must not be queued twice.`
        : `${c} is new, so mark it and enqueue once.`,
      "Check discovered state before adding to the queue.",
    );
  }),
  family("dfs-descend", "graph-dfs", "foundation", (r) => {
    const [a, b, c] = names(r),
      child = r.int(0, 1) ? b : c;
    return draft(
      "Which vertex does recursive DFS discover next?",
      `${a} has one unvisited neighbor ${child}; its other neighbor is already discovered. The active frame is ${a}.`,
      [
        yes(child),
        no(a, "The active vertex is already discovered."),
        no(child === b ? c : b, "An already discovered neighbor is skipped."),
      ],
      `DFS descends to the unvisited neighbor ${child} before returning.`,
      "Inspect the top frame's next unvisited neighbor.",
    );
  }),
  family("dfs-backtrack", "graph-dfs", "application", (r) => {
    const [a, b, c] = names(r),
      hasSibling = r.int(0, 1) === 1;
    return draft(
      `After ${b} has no unvisited neighbors, what happens?`,
      `DFS frames bottom → top: ${a}, ${b}. ${a} ${hasSibling ? `still has unvisited neighbor ${c}` : "has no other unvisited neighbor"}.`,
      [
        yes(`Return to ${a}'s frame`),
        no(
          `Enqueue ${c}`,
          "DFS returns through frames; it does not use a FIFO queue.",
        ),
        no(`Restart at ${b}`, "A finished frame is popped, not restarted."),
      ],
      `Pop ${b}'s frame and resume ${a}${hasSibling ? `, where ${c} can be explored next` : ", then backtrack again"}.`,
      "A recursive return restores the caller's position.",
    );
  }),
  family("path-distance", "graph-reachability", "foundation", (r) => {
    const [a, b, c] = names(r),
      direct = r.int(0, 1) === 1;
    return draft(
      `What is the minimum-edge distance from ${a} to ${c}?`,
      `Undirected edges: ${a}—${b}, ${b}—${c}${direct ? `, ${a}—${c}` : ""}.`,
      [
        yes(direct ? "1" : "2"),
        no(
          direct ? "2" : "1",
          "Count edges on the shortest available route, not an arbitrary path.",
        ),
        no("unreachable", "A route exists through the shown edges."),
      ],
      direct
        ? `The direct ${a}—${c} edge gives distance 1.`
        : `The route ${a}—${b}—${c} uses 2 edges.`,
      "Compare all available routes by edge count.",
    );
  }),
  family("path-unreachable", "graph-reachability", "application", (r) => {
    const [a, b, c] = names(r),
      connected = r.int(0, 1) === 1;
    return draft(
      `What does BFS from ${a} record for ${c}?`,
      `${a}—${b}${connected ? `—${c}` : `; ${c} is isolated`}.`,
      [
        connected
          ? yes("distance 2")
          : no(
              "distance 2",
              "An isolated vertex is not reached through the other component.",
            ),
        connected
          ? no("unreachable", "The chain reaches the target in two edges.")
          : yes("unreachable"),
        no("distance 0", "Distance zero belongs only to the start vertex."),
      ],
      connected
        ? `${a} reaches ${c} through ${b} in two steps.`
        : `${c} is in another component, so no distance is assigned.`,
      "Follow only actual edges from the chosen start.",
    );
  }),
  family("cost-list", "graph-complexity", "foundation", (r) => {
    const v = r.int(4, 9),
      e = r.int(v - 1, v + 4);
    return draft(
      "What is a full adjacency-list BFS traversal bound?",
      `${v} vertices, ${e} edges; neighbor lists are already ordered.`,
      [
        yes("O(V + E)"),
        no(
          "O(V²) regardless of representation",
          "A list scans present edges, not every possible pair.",
        ),
        no("O(log V)", "Every reachable vertex and edge may need examination."),
      ],
      `List traversal touches vertices and present edges: O(${v} + ${e}) here, generalized as O(V + E).`,
      "Count visited vertices and scanned neighbors.",
    );
  }),
  family("cost-transfer", "graph-complexity", "application", (r) => {
    const v = r.int(4, 9),
      e = r.int(1, v - 2);
    if (r.int(0, 1) === 0)
      return draft(
        "How many matrix entries may a full traversal inspect?",
        `${v} vertices, ${e} edges; a V × V adjacency matrix is scanned row by row.`,
        [
          yes("O(V²)"),
          no("O(V + E) entries", "A matrix row includes absent edges too."),
          no(
            "O(1) entries",
            "Each reached vertex has V possible neighbors to check.",
          ),
        ],
        `${v} rows of ${v} entries give a V² scan despite only ${e} edges.`,
        "Count cells per row, then rows.",
      );
    const [a, b, c] = names(r);
    return draft(
      "Which task is ready first under alphabetical tie-breaking?",
      `Tasks ${a}, ${b}, ${c}. Prerequisites: ${a} → ${c}, ${b} → ${c}.`,
      [
        yes(a),
        no(
          b,
          "Both are ready, but alphabetical tie-breaking chooses the smaller label first.",
        ),
        no(
          c,
          "C still has two unmet prerequisites, so it cannot enter the ready queue.",
        ),
      ],
      `${a} and ${b} have no prerequisites; ${a} is alphabetically first. ${c} waits for both.`,
      "A dependency queue contains only zero-indegree tasks.",
    );
  }),
];
