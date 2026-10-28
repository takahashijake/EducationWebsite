import type { Lesson } from "./types";
import { graphCodingExercises } from "./graph-coding-exercises";

export const graphLesson: Lesson = {
  topicId: "graphs",
  minutes: 55,
  objectives: [
    "Represent directed and undirected graphs using adjacency lists and matrices.",
    "Predict BFS queues, distances, and shortest unweighted paths.",
    "Trace DFS discovery and backtracking using recursive call frames.",
    "Find unreachable vertices and components; choose a representation with accurate costs.",
  ],
  introduction: [
    "A graph models relationships. A transit map has stations (vertices) and direct connections (edges). A task dependency graph has tasks and arrows from prerequisites to tasks that depend on them. Unlike a single chain, a graph can branch, cycle, and contain isolated vertices. The same representation supports many questions, but the algorithm determines which answer you get.",
    "This lesson builds on arrays, recursion, stacks and queues, and Big O. Those links are advisory; you can begin here. The separate Graph Theory topic remains planned. The player below draws small authored graphs and creates its own snapshots. It does not execute or trace the Python you write in the labs.",
  ],
  concept: {
    title: "Relationships and reachable paths",
    paragraphs: [
      "Two vertices are adjacent when an edge directly joins them. A path follows edges from one vertex to another; its length here is the number of edges. A cycle returns to a vertex already on the path, such as A → B → C → A. A visited set prevents traversal from looping around cycles forever. A self-loop A → A is a valid edge, but it does not discover a new vertex.",
      "An undirected edge A—B can be followed both ways. In an adjacency list, store B among A's neighbors and A among B's. A directed edge A → B allows only that direction. A route from A to B does not imply a route from B to A. The player's directed scenario makes this visible; starting at B may leave a vertex unreached even when starting at A can reach it.",
      "An adjacency list stores only each vertex's neighbors. It is a useful choice for sparse networks with relatively few edges and takes O(V + E) storage. An adjacency matrix is a V × V table with entry [i][j] indicating an edge. It uses O(V²) storage regardless of sparsity, but testing whether a specific edge exists takes O(1). In a dense graph with many edges, the matrix's direct lookup can be useful. For an undirected simple graph its matrix is symmetric; directed graphs need not be.",
    ],
  },
  demonstration: {
    kind: "graph-traversal",
    caption:
      "Choose a graph, trace BFS or DFS, then predict the next discovery.",
  },
  sections: [
    {
      title: "BFS: a queue gives distance layers",
      paragraphs: [
        "Breadth-first search starts at one chosen vertex. Mark it discovered when enqueued. Repeatedly dequeue the front vertex and inspect its neighbors in alphabetical order; enqueue each undiscovered neighbor once, recording the current vertex as its parent and its distance as parent distance + 1. Marking on enqueue prevents two same-layer vertices from adding the same neighbor twice. The queue then contains the next distance layer in FIFO order.",
        "For an unweighted graph, the first discovery of a target yields a path with the fewest edges. Follow parent references backward and reverse them. Alphabetical neighbor order breaks ties between equal-length routes. BFS does not generally find the minimum-cost path when edges have different weights. A vertex in another component remains unreachable from the chosen start; its distance and parent remain undefined.",
      ],
    },
    {
      title: "DFS: frames remember where to resume",
      paragraphs: [
        "Depth-first search discovers the start, then follows its first alphabetically sorted unvisited neighbor. It continues down that branch before trying siblings. Each recursive call or explicit stack frame remembers the current vertex and which neighbor to try next. When no unvisited neighbor remains, the frame returns: this is backtracking. Mark on discovery so a cycle does not re-enter an active call.",
        "DFS order is different from BFS order and does not promise a shortest path. A plain LIFO stack that pushes all neighbors and marks them immediately may produce a different order from recursive DFS. The player keeps explicit frames to preserve recursive semantics. To find every component in an undirected graph, repeat a traversal from each still unvisited vertex; one start alone reaches only its own component.",
      ],
    },
    {
      title: "Complexity under stated assumptions",
      paragraphs: [
        "With an adjacency list, BFS and DFS each take O(V + E) time over all reachable vertices and examined edges, plus O(V) auxiliary space for visited, parents, and queue or frames. Starting from one vertex may do less work if much of the graph is unreachable. Sorting unsorted neighbor lists costs extra; the O(V + E) traversal claim assumes already ordered lists or ignores ordering cost. The player uses tiny lists and sorts them before traversal.",
        "With an adjacency matrix, inspecting all possible neighbors of each reached vertex scans a full row of V entries. A full traversal is O(V²) time and O(V²) matrix storage, even for a sparse graph. A directed topological scheduler is different from ordinary FIFO task arrivals: it may enqueue a task only when all its prerequisites have completed. A cycle leaves no valid topological order.",
      ],
    },
  ],
  workedExample: {
    title: "Two routes from A to D",
    introduction:
      "Use undirected edges A—B, A—C, B—D, C—D. Neighbors are alphabetical.",
    steps: [
      "BFS starts with queue [A], distance A = 0, parent A = None. Dequeue A, then discover B and C in that order. Queue becomes [B, C]; each has distance 1 and parent A.",
      "Dequeue B. Discover D with distance 2 and parent B. Queue becomes [C, D]. When C examines D, it is already discovered, so its parent stays B. The path A → B → D has two edges.",
      "DFS begins A → B → D. At D, alphabetical neighbor B is already discovered, then C is new, so it descends to C before backtracking. DFS discovery order is A, B, D, C; a DFS parent chain is not guaranteed shortest in a general graph.",
      "If E were isolated, neither traversal from A would include E. A separate component traversal starting at E would find it.",
    ],
  },
  code: {
    language: "Python 3",
    title: "BFS parents for unweighted paths",
    source:
      "from collections import deque\n\ndef parents_from(adjacency, start):\n    queue = deque([start])\n    parent = {start: None}\n    while queue:\n        vertex = queue.popleft()\n        for neighbor in sorted(adjacency[vertex]):\n            if neighbor not in parent:\n                parent[neighbor] = vertex\n                queue.append(neighbor)\n    return parent",
    explanation:
      "Membership in parent doubles as discovered state. A neighbor gets its parent only on first discovery, preserving a minimum-edge route. This code assumes start is present; the lab contracts state how to handle absent starts.",
  },
  misconceptions: [
    {
      belief: "BFS uses a stack, and DFS uses a queue.",
      correction:
        "BFS's FIFO queue explores distance layers; DFS's recursive or explicit frames descend before siblings.",
    },
    {
      belief: "DFS always finds the shortest path.",
      correction:
        "DFS follows a branch deeply. BFS gives fewest-edge paths only when edges have equal unit cost.",
    },
    {
      belief: "Enqueue a vertex every time another edge reaches it.",
      correction:
        "Mark on enqueue. Re-enqueueing can duplicate work and produce wrong parent or distance data.",
    },
    {
      belief:
        "Every graph is connected, and undirected edges have one direction.",
      correction:
        "Isolated vertices and separate components exist. An undirected edge is traversable both ways.",
    },
    {
      belief: "A cycle makes traversal impossible.",
      correction:
        "Visited tracking skips already discovered vertices, so cycles terminate normally.",
    },
    {
      belief: "Adjacency lists and matrices scan neighbors at the same cost.",
      correction:
        "A list scans present neighbors; a matrix checks a full row of V entries per reached vertex.",
    },
  ],
  takeaways: [
    "Model vertices and edges with an explicit directedness rule and deterministic neighbor order.",
    "BFS uses FIFO, marks on enqueue, and gives minimum-edge distances in unweighted graphs.",
    "DFS uses frames or recursion, marks on discovery, and backtracks after a branch.",
    "A start reaches only its component or directed reachable set; lists and matrices have different space and scan costs.",
  ],
  questions: [
    {
      id: "graphs-q1",
      prompt:
        "With edges A—B and A—C, what is the BFS queue after processing A?",
      options: ["[B, C]", "[C, B]", "[A, B, C]"],
      correctIndex: 0,
      explanation:
        "A is dequeued; B and C are discovered alphabetically and enqueued. Choose BFS in the player to watch the queue change.",
    },
    {
      id: "graphs-q2",
      prompt: "Why does DFS mark a vertex when it first enters its frame?",
      options: [
        "To avoid revisiting a cycle",
        "To make every path shortest",
        "To turn an edge undirected",
      ],
      correctIndex: 0,
      explanation:
        "A back edge can reach an active call. Marking on discovery prevents re-entry; try the cyclic scenario in the player.",
    },
    {
      id: "graphs-q3",
      prompt: "What does BFS guarantee for an unweighted graph?",
      options: [
        "A minimum-edge path from the start to each reached vertex",
        "A minimum-weight path for arbitrary edge costs",
        "All graph vertices are reached",
      ],
      correctIndex: 0,
      explanation:
        "FIFO layers give fewest edges among reachable vertices. Weights require a different method; review the shortest-path lab.",
    },
  ],
  codingExercises: graphCodingExercises,
  nextStep:
    "Try a graph Code Lab, then choose a graph skill in adaptive practice to test a new variation.",
};
