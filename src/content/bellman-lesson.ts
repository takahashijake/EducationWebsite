import type { Lesson } from "./types";
import { bellmanCodingExercises } from "./bellman-coding-exercises";
export const bellmanLesson: Lesson = {
  topicId: "bellman-ford",
  minutes: 75,
  objectives: [
    "Explain why a negative edge can defeat Dijkstra’s settled-distance proof without being a negative cycle.",
    "Trace strict relaxation through up to V−1 complete passes and justify the bound.",
    "Detect reachable negative cycles and distinguish finite, unreachable, and negatively unbounded destinations.",
    "Reconstruct valid finite paths and choose BFS, Dijkstra, or Bellman–Ford from graph requirements.",
  ],
  introduction: [
    "A negative weight can represent a credit, rebate, or energy gain. Path cost still adds edge weights; a negative edge can make a longer route cheaper. The earlier weighted-path lesson used Dijkstra because its greedy settled-distance proof requires nonnegative weights.",
    "Here you will inspect each Bellman–Ford pass, predict relaxations, then write the same steps in browser Python. Graphs, Big O, and Weighted Graphs and Shortest Paths are advisory foundations.",
  ],
  concept: {
    title: "Repeated relaxation replaces greedy settlement",
    paragraphs: [
      "Initialize the source to 0 and every other vertex to infinity. For a directed edge u → v with weight w, a reachable u offers candidate distance[u] + w. Update v and its predecessor only if this is strictly smaller. An unreachable u offers no candidate. Equal-cost ties retain the earlier predecessor.",
      "Consider A → B: 2, A → C: 5, C → B: −10. Bellman–Ford finds A → C → B at −5. Standard Dijkstra may settle B at 2 before visiting C, so its nonnegative-edge proof no longer applies. A negative edge can invalidate that proof; it does not guarantee that Dijkstra gives a wrong answer on every such graph.",
      "A complete pass scans every directed edge. After pass k, every reachable vertex with a shortest route using at most k edges has a valid estimate no larger than that route’s cost. In a graph without a reachable negative cycle affecting the route, a minimum route can be simple and has at most V−1 edges. Thus up to V−1 passes suffice. In-place scans may discover routes faster, but one pass is not a general guarantee.",
    ],
  },
  demonstration: {
    kind: "bellman-ford",
    caption:
      "Step through complete passes, predict strict improvements, and inspect cycle impact.",
  },
  sections: [
    {
      title: "Convergence and the extra check",
      paragraphs: [
        "If an entire pass makes no updates, every later scan would see the same distances; stop early. Otherwise scan up to V−1 passes. Then check every edge once more, but only when its source is reachable. A further strict improvement proves that a reachable negative cycle can reduce some path without bound.",
        "A negative cycle in a disconnected component does not affect routes from the chosen source. An undirected negative edge that can be traversed both ways already creates a negative closed walk, which is why this composer uses directed edges.",
      ],
    },
    {
      title: "Which destinations lose finite answers?",
      paragraphs: [
        "A reachable negative cycle lets you loop for arbitrarily low cost, then follow any directed route downstream. Mark the detected influence and every vertex reachable from it as negatively unbounded (−∞). A different branch that the cycle cannot reach can still have a finite shortest path. An unreachable vertex stays at infinity; it does not become zero or −∞.",
        "A temporary finite estimate after V−1 passes is not a valid final answer for an affected destination. Reconstruct only a final finite destination: follow predecessors backward, reject unknown or repeated vertices, reach the source, and reverse the list. Never present a predecessor chain as a finite shortest path for a negatively unbounded destination.",
      ],
    },
    {
      title: "Choose the algorithm and state its cost",
      paragraphs: [
        "Use BFS when every edge has equal unit cost and you need minimum hops. Use Dijkstra for weighted shortest paths with all nonnegative edges. Use Bellman–Ford when negative edges are allowed and you need single-source distances plus reachable negative-cycle detection. A negative edge alone is not a negative cycle.",
        "Bellman–Ford scans E directed edges on each of up to V−1 passes and once for detection: worst-case O(VE) time. Distances, predecessors, and propagation bookkeeping take O(V) algorithmic auxiliary space beyond the input graph. The player also stores trace snapshots for teaching, so its display memory is larger.",
      ],
    },
  ],
  workedExample: {
    title: "A pass-by-pass detour",
    introduction:
      "Edges A → B (2), A → C (5), C → B (−10), source A. The player sorts edges by source then target.",
    steps: [
      "Initialize A=0; B=C=∞. Pass 1 inspects A → B and sets B=2, then A → C and sets C=5. C → B offers 5−10=−5, improving B and changing its predecessor to C.",
      "Pass 2 makes no changes. An entire unchanged pass permits early stopping. The additional check finds no reachable edge that can improve.",
      "B is finite at −5. Follow B ← C ← A and reverse to A → C → B. Dijkstra’s standard greedy settlement could have finalized B at 2 before seeing C’s negative outgoing edge.",
    ],
  },
  code: {
    language: "Python 3",
    title: "Bellman–Ford with cycle impact",
    source: `def bellman_ford(vertices, edges, start):
    if start not in vertices:
        raise ValueError("unknown source")
    distance = {v: None for v in vertices}
    parent = {v: None for v in vertices}
    distance[start] = 0
    edges = sorted(edges)
    for _ in range(len(vertices) - 1):
        changed = False
        for u, v, weight in edges:
            if distance[u] is None:
                continue
            candidate = distance[u] + weight
            if distance[v] is None or candidate < distance[v]:
                distance[v], parent[v] = candidate, u
                changed = True
        if not changed:
            break
    affected = {v for u, v, weight in edges
                if distance[u] is not None and
                (distance[v] is None or distance[u] + weight < distance[v])}
    while True:
        more = {v for u, v, _ in edges if u in affected} - affected
        if not more:
            break
        affected |= more
    return distance, parent, affected`,
    explanation:
      "The extra check seeds only targets reachable from the source, then follows directed edges downstream. Values in affected are estimates, not valid shortest-path costs. The Code Labs add endpoint validation and safe path reconstruction.",
  },
  misconceptions: [
    {
      belief: "Any negative edge is a negative cycle.",
      correction:
        "A negative cycle is a directed closed walk with negative total weight; a single directed negative edge need not return to its start.",
    },
    {
      belief: "One pass always finds all shortest routes.",
      correction:
        "An edge may be scanned before its source becomes reachable. Up to V−1 complete passes cover simple routes regardless of edge order.",
    },
    {
      belief: "V−1 passes make every displayed estimate final.",
      correction:
        "Check one more time for reachable improvements and propagate cycle influence before classifying destinations.",
    },
    {
      belief: "A reachable negative cycle makes every destination −∞.",
      correction:
        "Only vertices reachable from the cycle are affected. Other reachable branches can retain finite paths.",
    },
    {
      belief: "An unreachable vertex has distance zero.",
      correction:
        "Only the source starts at zero. Unreachable vertices remain at infinity.",
    },
    {
      belief: "Dijkstra always fails if any edge is negative.",
      correction:
        "A negative edge breaks the greedy guarantee, but particular graphs may still produce the correct answer.",
    },
  ],
  takeaways: [
    "Relax every directed edge repeatedly; strict improvement changes both distance and predecessor.",
    "V−1 passes cover simple routes; an unchanged full pass permits early stopping.",
    "An additional reachable improvement signals negative-cycle influence. Propagate it downstream before reporting final paths.",
    "Choose BFS for equal unit costs, Dijkstra for nonnegative weights, and Bellman–Ford when signed weights require cycle detection.",
  ],
  questions: [
    {
      id: "bellman-q1",
      prompt:
        "A → B costs 2, A → C costs 5, C → B costs −10. What is the minimum cost from A to B?",
      options: [
        "−5 via C",
        "2 directly",
        "No answer because every negative edge is a cycle",
      ],
      correctIndex: 0,
      explanation:
        "A → C → B costs 5−10=−5. There is no directed return edge forming a negative cycle.",
    },
    {
      id: "bellman-q2",
      prompt: "When may Bellman–Ford stop before V−1 passes?",
      options: [
        "After a complete pass with no strict improvements",
        "After the first edge changes",
        "Whenever one edge has a zero weight",
      ],
      correctIndex: 0,
      explanation:
        "An unchanged complete pass leaves every edge constraint satisfied; repeating it cannot change distances.",
    },
    {
      id: "bellman-q3",
      prompt:
        "A reachable negative cycle can reach D but not E. E is reachable through another branch. Which statement is valid?",
      options: [
        "D is −∞; E may be finite",
        "Both D and E are −∞",
        "D has its last temporary estimate as a finite answer",
      ],
      correctIndex: 0,
      explanation:
        "Cycle influence follows directed reachability. D has no finite minimum; the separate branch to E can retain a finite shortest path.",
    },
  ],
  relatedTopicIds: ["graphs", "big-o-notation", "weighted-shortest-paths"],
  codingExercises: bellmanCodingExercises,
  nextStep:
    "Complete the six Bellman–Ford Python labs, then review missed skills in retrieval and adaptive practice.",
};
