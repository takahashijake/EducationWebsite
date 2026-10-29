import type { Lesson } from "./types";
import { weightedCodingExercises } from "./weighted-coding-exercises";
export const weightedLesson: Lesson = {
  topicId: "weighted-shortest-paths",
  minutes: 65,
  objectives: [
    "Distinguish weighted from unweighted and directed from undirected routes; calculate path cost by summing edge weights.",
    "Explain why a fewest-edge BFS path may cost more than a longer route.",
    "Trace tentative distances, strict edge relaxation, min-priority queue entries, and stale skips.",
    "Justify Dijkstra’s settled-distance invariant for nonnegative weights and reconstruct predecessor paths.",
    "Handle ties, zero-weight edges, unreachable vertices, and analyze complexity under stated heap assumptions.",
  ],
  introduction: [
    "A transit connection might take two minutes or twenty. Counting stations alone cannot identify the fastest route. A weighted graph assigns a cost to each edge; a route’s total cost is the sum of its edge weights. This lesson extends the earlier Graphs lesson, where BFS minimized the number of edges because every edge counted equally.",
    "You can follow the player, inspect its real algorithm state, predict a selection or relaxation, then implement the same ideas in Python. The player traces its own small graph rather than executing the code you write. Graphs and Big O are helpful advisory foundations.",
  ],
  concept: {
    title: "Weights change the question",
    paragraphs: [
      "An unweighted graph records whether a connection exists. A weighted graph additionally records a numeric cost. Here costs are finite nonnegative integers, including zero. A directed edge A → B with weight 3 permits travel from A to B at cost 3, but says nothing about B → A. An undirected A—B edge can be used both ways at the same cost. Its adjacency list has entries in both directions.",
      "A path cost adds its edges: if A → B costs 2, B → C costs 2, and C → D costs 2, then A → B → C → D costs 6. A direct A → D edge costing 9 uses fewer hops but costs more. BFS would prefer the direct edge by hop count; Dijkstra prefers the three-edge path by total cost. A missing edge is not a zero-cost edge.",
      "Dijkstra begins with distance 0 at the source and infinity elsewhere. Each estimate is tentative until its vertex is settled. Relaxing u → v compares distance[u] + weight(u,v) with the current estimate of v. Only a strictly smaller candidate changes v’s distance and predecessor. A tie keeps the first predecessor under alphabetical vertex and neighbor order; this also prevents predecessor cycles on zero-weight cycles.",
    ],
  },
  demonstration: {
    kind: "weighted-dijkstra",
    caption:
      "Select a scenario, inspect the live minimum heap, predict a step, and reconstruct a route.",
  },
  sections: [
    {
      title: "The minimum-priority queue and settled invariant",
      paragraphs: [
        "A min-priority queue removes the smallest (distance, vertex) pair. The reference implementation uses a binary heap. If two distances tie, alphabetical vertex labels decide which is removed first; neighbors are also scanned alphabetically. When relaxation improves a distance, a fresh heap entry is pushed. The old entry stays until popped; it is stale and must be skipped because it no longer matches the best estimate or its vertex is settled.",
        "When the minimum valid entry for u is removed, settle u. With nonnegative remaining edges, any alternative path reaching u later must pass through an unsettled vertex whose current distance is at least distance[u], then add a nonnegative cost. It cannot improve u. This is the greedy invariant behind Dijkstra. A negative edge can lower a settled distance later and break the argument; Dijkstra is not valid for negative-weight edges. Bellman-Ford repeatedly relaxes edges and can handle negative edges when no reachable negative cycle makes shortest distances undefined.",
      ],
    },
    {
      title: "Predecessors, unreachable vertices, and ties",
      paragraphs: [
        "Each strict improvement sets predecessor[v] = u. To reconstruct a path to a reachable destination, start at that destination, follow predecessors back to the source, then reverse the sequence. The destination’s final distance is the total cost. The source-to-source route is just [source] at cost 0. If the destination remains at infinity, no route exists; do not fabricate a predecessor or cost.",
        "Equal-cost alternatives can have different valid shortest paths. This lesson makes one deterministic choice: minimum distance first, alphabetical vertex tie, alphabetical outgoing-neighbor order, and strict improvement only. An equal candidate never rewrites a predecessor. This policy is useful for reproducible traces, but the optimal distance is independent of which equal-cost route was retained.",
      ],
    },
    {
      title: "Complexity under explicit assumptions",
      paragraphs: [
        "For V vertices and E adjacency entries, assume a binary min-heap, adjacency lists, nonnegative weights, and lazy duplicate entries. A successful relaxation can push a new entry, so the heap has O(E) entries over the run. Each edge is scanned once from its settled source; heap operations cost O(log(V + E)). Time is O((V + E) log(V + E)); graph, distance, parent, settled, and heap storage total O(V + E). On simple graphs this is often written O((V + E) log V). Sorting unsorted adjacency lists adds preprocessing cost.",
        "The teaching player validates small graphs and copies snapshots, so its animation cost is larger than the algorithmic bound. A linear scan instead of a heap gives O(V² + E) time, which can be reasonable for dense graphs. Neither complexity claim allows negative edges.",
      ],
    },
  ],
  workedExample: {
    title: "A direct edge loses to a longer route",
    introduction:
      "Directed edges: A → D costs 9, A → B costs 2, B → C costs 2, C → D costs 2. Start A and target D.",
    steps: [
      "Initialize A = 0 and B, C, D = ∞. Heap [(0, A)]. Pop and settle A. Relax A → B to 2 and A → D to 9; predecessors B ← A and D ← A.",
      "Pop B at 2, settle it, and relax B → C to 4. Pop C at 4 and relax C → D: candidate 4 + 2 = 6 improves 9. D’s predecessor changes from A to C; push (6, D).",
      "Pop D at 6 and settle it. The old (9, D) entry remains in the heap; when popped it is stale because D is already settled and its best distance is 6. Skip it.",
      "Follow D ← C ← B ← A and reverse: A → B → C → D. The path costs 2 + 2 + 2 = 6. BFS would return the one-edge A → D route, which costs 9.",
    ],
  },
  code: {
    language: "Python 3",
    title: "Dijkstra with a lazy binary heap and route reconstruction",
    source: `import heapq

def dijkstra(adjacency, start):
    if start not in adjacency:
        raise ValueError("unknown start")
    if any(type(weight) is not int or weight < 0 for edges in adjacency.values()
           for _, weight in edges):
        raise ValueError("Dijkstra requires nonnegative weights")
    distance = {v: None for v in adjacency}
    predecessor = {v: None for v in adjacency}
    distance[start] = 0
    heap = [(0, start)]
    settled = set()
    while heap:
        cost, vertex = heapq.heappop(heap)
        if vertex in settled or cost != distance[vertex]:
            continue  # an older, worse estimate
        settled.add(vertex)
        for neighbor, weight in sorted(adjacency[vertex]):
            candidate = cost + weight
            old = distance[neighbor]
            if neighbor not in settled and (old is None or candidate < old):
                distance[neighbor] = candidate
                predecessor[neighbor] = vertex
                heapq.heappush(heap, (candidate, neighbor))
    return distance, predecessor

def path_to(distance, predecessor, start, target):
    if target not in distance or distance[target] is None:
        return None
    path = []
    while target is not None:
        path.append(target)
        if target == start:
            return path[::-1]
        target = predecessor[target]
    return None`,
    explanation:
      "The heap orders (cost, label), so ties are deterministic. A newly improved estimate is pushed without deleting the old entry. Strict improvement fixes predecessor ties, and None represents infinity or an unreachable target. This example assumes valid endpoints and integer weights; the Code Labs add explicit validation practice.",
  },
  misconceptions: [
    {
      belief: "The shortest route always uses the fewest edges.",
      correction:
        "Shortest means minimum total edge weight here. A three-edge route costing 6 beats a direct edge costing 9.",
    },
    {
      belief: "A tentative estimate is already final.",
      correction:
        "Only the minimum valid queue entry becomes settled. A later relaxation may improve an unsettled estimate.",
    },
    {
      belief: "A stale heap entry should settle the vertex again.",
      correction:
        "Compare popped cost with the current estimate and settled set; skip old entries.",
    },
    {
      belief: "Equal-cost relaxation should always replace the predecessor.",
      correction:
        "Strict improvement keeps the first parent and avoids cycles on zero-weight ties.",
    },
    {
      belief: "Dijkstra works with negative edges.",
      correction:
        "A negative edge can reduce a settled distance later, invalidating the greedy proof. Use an appropriate algorithm such as Bellman-Ford instead.",
    },
    {
      belief: "An unreachable destination has distance zero.",
      correction:
        "Zero belongs to the source and may be reached via zero-weight edges. Unreachable remains infinity (None in Python).",
    },
  ],
  takeaways: [
    "Add edge weights to obtain route cost; BFS minimizes hops only under equal unit costs.",
    "Relax with source distance plus edge weight and update predecessors only on strict improvement.",
    "Settle the valid heap minimum and skip stale entries; nonnegative weights justify finality.",
    "Follow predecessors backward for a reachable route; leave unreachable vertices at infinity.",
  ],
  questions: [
    {
      id: "weighted-q1",
      prompt:
        "A → D costs 9; A → B, B → C, and C → D each cost 2. Which route has minimum total cost?",
      options: ["A → B → C → D, cost 6", "A → D, cost 9", "Both cost 3"],
      correctIndex: 0,
      explanation:
        "Three edges can cost less than one: 2 + 2 + 2 = 6 versus 9. Edge count is a different objective.",
    },
    {
      id: "weighted-q2",
      prompt:
        "If distance[B] is 4, B → C weighs 3, and distance[C] is 9, what does relaxation do?",
      options: [
        "Set C to 7 and predecessor C to B",
        "Keep C at 9 because it was visited before",
        "Set C to 3",
      ],
      correctIndex: 0,
      explanation:
        "The candidate is 4 + 3 = 7, which strictly improves 9; update both distance and predecessor.",
    },
    {
      id: "weighted-q3",
      prompt: "Why can Dijkstra settle the current minimum?",
      options: [
        "Nonnegative edges cannot later make a path through an unsettled vertex cheaper",
        "The heap removes every old entry immediately",
        "Negative edges make all distances smaller",
      ],
      correctIndex: 0,
      explanation:
        "An unsettled route already costs at least the minimum, and adding nonnegative edges cannot reduce it. Negative weights break this proof.",
    },
  ],
  relatedTopicIds: ["graphs", "big-o-notation"],
  codingExercises: weightedCodingExercises,
  nextStep:
    "Try the six weighted Python Code Labs, then revisit a missed skill through adaptive practice.",
};
