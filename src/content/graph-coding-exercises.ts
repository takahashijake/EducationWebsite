import type { CodingExercise, CodingTest } from "./coding-types";
import { graphSolutions } from "./graph-solutions";

const check = (
  id: string,
  label: string,
  code: string,
  guidance: string,
): CodingTest => ({
  id: `graph-${id}`,
  label,
  code,
  expectedBehavior: label,
  guidance,
  conceptIds: ["graphs"],
});
const lab = (
  id: string,
  title: string,
  instructions: string[],
  starter: string,
  tests: CodingTest[],
  hints: string[],
  explanation: string,
  reflection: string,
): CodingExercise => ({
  id: `graph-${id}`,
  topicId: "graphs",
  title,
  instructions,
  starter,
  expectedBehavior: instructions[0],
  tests,
  hints,
  explanation,
  reflection,
  conceptIds: ["graphs"],
  revision: 1,
  referenceSolution: graphSolutions[`graph-${id}`],
});

export const graphCodingExercises: CodingExercise[] = [
  lab(
    "adjacency",
    "Build an adjacency list",
    [
      "Implement build_adjacency(vertices, edges, directed=False), returning a dict of sorted neighbor lists for every vertex.",
      "Edges are (source, destination). Undirected edges work both ways. Deduplicate repeated edges, preserve isolated vertices, and do not mutate inputs. Labels are distinct strings and endpoints are valid.",
    ],
    `def build_adjacency(vertices, edges, directed=False):\n    result = {v: [] for v in vertices}\n    for a, b in edges:\n        result[a].append(b)  # repair direction, duplicates, and ordering\n    return result`,
    [
      check(
        "adj-isolated",
        "Isolates and undirected edges",
        `assert build_adjacency(["A", "B", "C"], [("B", "A")]) == {"A": ["B"], "B": ["A"], "C": []}`,
        "Create entries for isolated vertices and add the reverse neighbor.",
      ),
      check(
        "adj-duplicates",
        "Directed edges, duplicates, and order",
        `edges = [("A", "C"), ("A", "B"), ("A", "B")]\nassert build_adjacency(["C", "A", "B"], edges, True) == {"A": ["B", "C"], "B": [], "C": []}\nassert edges == [("A", "C"), ("A", "B"), ("A", "B")]`,
        "Use sets internally, then sort labels and each neighbor list.",
      ),
    ],
    [
      "Initialize every vertex, even if isolated.",
      "Use sets for duplicate edges; add a reverse link only when undirected, then sort.",
    ],
    "Adjacency lists store existing neighbors; deduplication prevents repeated work.",
    "Why does an isolated vertex still need an entry?",
  ),
  lab(
    "bfs",
    "Traverse with breadth-first search",
    [
      "Implement bfs_order(adjacency, start), returning traversal order using alphabetical neighbors.",
      "Use FIFO and mark vertices when enqueued. Return [] if start is absent. The graph may contain cycles or unreachable vertices.",
    ],
    `def bfs_order(adjacency, start):\n    if start not in adjacency: return []\n    queue, order = [start], []\n    while queue:\n        vertex = queue.pop()  # wrong end; repair FIFO\n        if vertex in order: continue  # late check may still duplicate queue entries\n        order.append(vertex)\n        queue.extend(sorted(adjacency[vertex]))\n    return order`,
    [
      check(
        "bfs-branch",
        "FIFO branching order",
        `g = {"A": ["B", "C"], "B": ["D"], "C": ["E"], "D": [], "E": []}\nassert bfs_order(g, "A") == ["A", "B", "C", "D", "E"]`,
        "Dequeue from front; discover B and C before exploring D.",
      ),
      check(
        "bfs-cycle",
        "Cycles and disconnected vertices",
        `g = {"A": ["B", "C"], "B": ["A", "C"], "C": ["A", "B"], "D": []}\nassert bfs_order(g, "A") == ["A", "B", "C"]\nassert bfs_order(g, "D") == ["D"]\nassert bfs_order(g, "X") == []`,
        "Mark when enqueued; otherwise cycles can enqueue forever.",
      ),
    ],
    [
      "A deque gives popleft for FIFO.",
      "Add to seen at enqueue time, not dequeue time; sort neighbors.",
    ],
    "BFS completes one distance layer before the next and never re-enqueues discovered vertices.",
    "Why mark before enqueueing a second route to the same vertex?",
  ),
  lab(
    "shortest",
    "Find an unweighted shortest path",
    [
      "Implement shortest_path(adjacency, start, target), returning a vertex list or None when unreachable or absent.",
      "Use BFS and alphabetical neighbors for deterministic ties. Start equals target returns [start]. Every edge has unit cost; weighted paths need another algorithm.",
    ],
    `def shortest_path(adjacency, start, target):\n    if start not in adjacency or target not in adjacency: return None\n    return [start, target]  # repair with BFS predecessors`,
    [
      check(
        "path-boundary",
        "Same vertex and unreachable target",
        `g = {"A": ["B"], "B": [], "C": []}\nassert shortest_path(g, "A", "A") == ["A"]\nassert shortest_path(g, "A", "C") is None\nassert shortest_path(g, "X", "A") is None`,
        "The self-path has zero edges; unreachable means no predecessor chain.",
      ),
      check(
        "path-tie",
        "Shortest path with deterministic tie",
        `g = {"A": ["C", "B"], "B": ["D"], "C": ["D"], "D": []}\nassert shortest_path(g, "A", "D") == ["A", "B", "D"]`,
        "Alphabetical neighbor order chooses B before C at equal distance.",
      ),
    ],
    [
      "BFS discovers paths by increasing edge count.",
      "Record parent on first discovery; walk backward from target and reverse.",
    ],
    "The first BFS predecessor chain has minimum edge count with alphabetical ties.",
    "Why does this guarantee fail for arbitrary weighted edges?",
  ),
  lab(
    "dfs",
    "Traverse with depth-first search",
    [
      "Implement dfs_order(adjacency, start), returning recursive DFS discovery order with alphabetical neighbors.",
      "Return [] if start is absent. Skip already discovered vertices; only reachable vertices appear.",
    ],
    `def dfs_order(adjacency, start):\n    if start not in adjacency: return []\n    return [start]  # descend before siblings`,
    [
      check(
        "dfs-branch",
        "Recursive descent order",
        `g = {"A": ["C", "B"], "B": ["D"], "C": ["E"], "D": [], "E": []}\nassert dfs_order(g, "A") == ["A", "B", "D", "C", "E"]`,
        "Visit B, then descend to D before trying C.",
      ),
      check(
        "dfs-cycle",
        "Cycles and unreachable vertices",
        `g = {"A": ["B"], "B": ["A", "C"], "C": ["B"], "D": []}\nassert dfs_order(g, "A") == ["A", "B", "C"]\nassert dfs_order(g, "D") == ["D"]`,
        "Mark before descending so a back edge cannot recurse forever.",
      ),
    ],
    [
      "A recursive helper mirrors the call stack.",
      "Mark and append on entry, then recurse into sorted unvisited neighbors.",
    ],
    "DFS completes a branch before returning to its caller.",
    "What does the call stack remember when DFS backtracks?",
  ),
  lab(
    "components",
    "Find connected components",
    [
      "Implement connected_components(adjacency) for an undirected graph, returning sorted vertex lists sorted by their smallest label.",
      "Include isolated vertices, handle cycles, and do not mutate adjacency.",
    ],
    `def connected_components(adjacency):\n    return [sorted(adjacency)]  # one component is not always enough`,
    [
      check(
        "components-isolates",
        "Disconnected and isolated vertices",
        `g = {"D": [], "A": ["B"], "C": [], "B": ["A"]}\nassert connected_components(g) == [["A", "B"], ["C"], ["D"]]`,
        "Start a new traversal at each still unseen vertex.",
      ),
      check(
        "components-cycle",
        "Cycles remain one component",
        `g = {"A": ["B", "C"], "B": ["A", "C"], "C": ["A", "B"], "D": ["E"], "E": ["D"]}\nassert connected_components(g) == [["A", "B", "C"], ["D", "E"]]`,
        "A cycle does not create extra components; mark seen vertices.",
      ),
    ],
    [
      "Scan starting vertices in sorted order.",
      "Explore each unseen vertex's reachable group; sort each group before returning.",
    ],
    "A component is a maximal connected group; the outer scan finds unreachable groups.",
    "Why does one traversal from A miss an isolated C?",
  ),
  lab(
    "schedule",
    "Schedule dependent tasks",
    [
      "Implement schedule_tasks(tasks, prerequisites). Each pair (before, after) means before must finish first.",
      "Return a topological order using the alphabetically smallest currently ready task; return None for a cycle. Deduplicate repeated dependencies. Do not mutate inputs.",
    ],
    `def schedule_tasks(tasks, prerequisites):\n    return sorted(tasks)  # names alone ignore edges`,
    [
      check(
        "schedule-ready",
        "Ready tasks and a chain",
        `assert schedule_tasks(["C", "A", "B"], []) == ["A", "B", "C"]\nassert schedule_tasks(["A", "B", "C"], [("C", "A"), ("A", "B")]) == ["C", "A", "B"]`,
        "Only tasks with zero remaining prerequisites may run.",
      ),
      check(
        "schedule-cycle",
        "Newly ready tasks, duplicate edges, and cycle",
        `assert schedule_tasks(["A", "B", "C", "D"], [("A", "C"), ("B", "C"), ("B", "C")]) == ["A", "B", "C", "D"]\nassert schedule_tasks(["A", "B"], [("A", "B"), ("B", "A")]) is None`,
        "A cycle leaves tasks with positive indegree after the ready set empties.",
      ),
    ],
    [
      "Count distinct incoming prerequisites.",
      "Use a min-heap of zero-indegree tasks; release dependents after finishing a task.",
    ],
    "Kahn's algorithm processes currently ready tasks; FIFO arrival order alone cannot respect prerequisites.",
    "Why can a task become ready only after another finishes?",
  ),
];
