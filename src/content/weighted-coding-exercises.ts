import type { CodingExercise, CodingTest } from "./coding-types";
import { weightedSolutions } from "./weighted-solutions";
const check = (
  id: string,
  label: string,
  code: string,
  guidance: string,
): CodingTest => ({
  id: `weighted-${id}`,
  label,
  code,
  expectedBehavior: label,
  guidance,
  conceptIds: ["weighted-shortest-paths"],
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
  id: `weighted-${id}`,
  topicId: "weighted-shortest-paths",
  title,
  instructions,
  starter,
  tests,
  hints,
  explanation,
  reflection,
  expectedBehavior: instructions[0],
  conceptIds: ["weighted-shortest-paths"],
  revision: 1,
  referenceSolution: weightedSolutions[`weighted-${id}`],
});
export const weightedCodingExercises: CodingExercise[] = [
  lab(
    "adjacency",
    "Build a weighted adjacency list",
    [
      "Implement weighted_adjacency(vertices, edges, directed=False). Return a dict whose every vertex maps to a sorted list of (neighbor, weight) tuples.",
      "Vertices are distinct string labels. Edges are (source, destination, nonnegative integer weight). Preserve isolated vertices, add reverse entries only when undirected, do not mutate inputs, and raise ValueError for unknown endpoints, invalid weights, or duplicate edges (including reversed undirected duplicates).",
    ],
    `def weighted_adjacency(vertices, edges, directed=False):
    graph = {v: [] for v in vertices}
    for a, b, weight in edges:
        graph[a].append((b, weight))  # repair validation, direction, duplicates, and order
    return graph`,
    [
      check(
        "adj-isolates",
        "Undirected weights and isolates",
        `assert weighted_adjacency(['C','B','A'], [('B','A',0)]) == {'A':[('B',0)],'B':[('A',0)],'C':[]}`,
        "Include every vertex and both directions, even at weight zero.",
      ),
      check(
        "adj-directed",
        "Directed ordering and invalid edges",
        `assert weighted_adjacency(['C','A','B'], [('A','C',5),('A','B',2)], True) == {'A':[('B',2),('C',5)],'B':[],'C':[]}
for edges in [[('A','X',1)],[('A','B',-1)],[('A','B',True)],[('A','B',1),('B','A',2)]]:
    try: weighted_adjacency(['A','B'],edges)
    except ValueError: pass
    else: raise AssertionError('invalid graph accepted')`,
        "Sort labels and neighbors; reject invalid endpoints, weights, and duplicates.",
      ),
    ],
    [
      "Make an entry for each vertex before adding edges.",
      "Track endpoint pairs in a set; canonicalize the pair for undirected graphs.",
    ],
    "An edge carries its numerical cost; directedness determines whether a reverse entry exists.",
    "Why does a zero-weight edge still need a neighbor entry?",
  ),
  lab(
    "route-cost",
    "Compare route costs",
    [
      "Implement route_cost(adjacency, path). Sum weights on consecutive path edges; return None for an empty path, unknown start, or a missing directed edge.",
      "A one-vertex path has cost 0. Adjacency maps labels to lists of (neighbor, weight). Do not count hops as cost or assume reverse edges exist.",
    ],
    `def route_cost(adjacency, path):
    return len(path) - 1  # hops are not weights`,
    [
      check(
        "route-detour",
        "Longer route can cost less",
        `g={'A':[('B',2),('D',9)],'B':[('C',2)],'C':[('D',2)],'D':[]}
assert route_cost(g,['A','D']) == 9
assert route_cost(g,['A','B','C','D']) == 6`,
        "Sum edge weights on each route, rather than counting edges.",
      ),
      check(
        "route-boundary",
        "Zero, missing edge, and singleton",
        `g={'A':[('B',0)],'B':[],'C':[]}
assert route_cost(g,['A','B']) == 0
assert route_cost(g,['A']) == 0
assert route_cost(g,['B','A']) is None
assert route_cost(g,[]) is None`,
        "A zero-weight edge is present; a nonexistent reverse edge is not.",
      ),
    ],
    [
      "Begin with total = 0 and inspect each consecutive pair.",
      "Look up each directed edge; return None if it is absent, otherwise add its weight.",
    ],
    "Cost is the sum of actual edge weights, including zeros.",
    "How can a three-edge path beat a direct edge?",
  ),
  lab(
    "select",
    "Select the minimum tentative vertex",
    [
      "Implement select_minimum(distances, settled). Return the unsettled vertex with the smallest finite tentative distance, breaking ties by alphabetical label.",
      "Distances is a dict from label to a number or None (unreached). Return None when no finite unsettled candidate remains. Do not mutate inputs.",
    ],
    `def select_minimum(distances, settled):
    return next(iter(distances))  # ignores distance, settled state, and infinity`,
    [
      check(
        "select-tie",
        "Finite distances and alphabetical tie",
        `assert select_minimum({'C':3,'B':3,'A':8,'D':None},set()) == 'B'
assert select_minimum({'C':3,'B':3,'A':8,'D':None},{'B'}) == 'C'`,
        "Compare (distance, label) among unsettled finite candidates.",
      ),
      check(
        "select-empty",
        "No candidate and zero",
        `assert select_minimum({'A':None,'B':None},set()) is None
assert select_minimum({'B':0,'A':0},set()) == 'A'
assert select_minimum({'B':0}, {'B'}) is None`,
        "Zero is finite; None is infinity, not zero.",
      ),
    ],
    [
      "Filter out settled labels and None distances.",
      "The minimum of (distance, label) pairs gives the tie rule.",
    ],
    "Dijkstra settles the smallest currently known distance, not the first dict entry.",
    "Why should a vertex at infinity not be settled from the queue?",
  ),
  lab(
    "relax",
    "Repair edge relaxation",
    [
      "Implement relax(distances, predecessors, source, target, weight). Return True only if source distance plus weight strictly improves target distance.",
      "Distances map labels to numbers or None. Mutate target distance and predecessor only on improvement; preserve them on a tie or unreachable source. Raise ValueError for negative or noninteger weight.",
    ],
    `def relax(distances, predecessors, source, target, weight):
    distances[target] = weight  # ignores source cost and ties
    predecessors[target] = source
    return True`,
    [
      check(
        "relax-improve",
        "Candidate uses source distance",
        `d={'A':4,'B':10}; p={'A':None,'B':None}
assert relax(d,p,'A','B',3) is True
assert d['B']==7 and p['B']=='A'`,
        "Compute source distance + edge weight.",
      ),
      check(
        "relax-tie",
        "Tie, zero cycle, and unreachable source",
        `d={'A':0,'B':0,'C':None}; p={'A':None,'B':'A','C':None}
assert relax(d,p,'B','A',0) is False
assert p['A'] is None
assert relax(d,p,'C','A',1) is False
assert relax(d,p,'A','C',0) is True and d['C']==0
for bad in [-1, True, 1.5]:
    try: relax(d,p,'A','B',bad)
    except ValueError: pass
    else: raise AssertionError('invalid weight accepted')`,
        "Strict improvement leaves predecessors unchanged on ties, preventing zero-cycle parent loops.",
      ),
    ],
    [
      "Reject invalid weights and skip a source at None.",
      "Compare candidate = distances[source] + weight with the current target; update both fields only for a smaller candidate.",
    ],
    "Equal-cost alternatives keep the first parent, even if an edge has weight zero.",
    "How could rewriting a predecessor on every tie create a cycle?",
  ),
  lab(
    "dijkstra",
    "Compute Dijkstra distances",
    [
      "Implement dijkstra(adjacency, start), returning (distances, predecessors) dictionaries for every vertex. Use a min-heap and sorted neighbors.",
      "Adjacency maps labels to (neighbor, nonnegative integer weight) lists. Use None for unreachable distances and predecessors, 0 for start, strict improvement for parent updates, and skip stale heap entries. Raise ValueError for absent start or invalid edges.",
    ],
    `def dijkstra(adjacency, start):
    distances = {v: None for v in adjacency}
    predecessors = {v: None for v in adjacency}
    distances[start] = 0
    return distances, predecessors  # process the heap`,
    [
      check(
        "dijkstra-detour",
        "Cheaper detour and stale entry",
        `g={'A':[('D',9),('B',2)],'B':[('C',2)],'C':[('D',2)],'D':[]}
d,p=dijkstra(g,'A')
assert d == {'A':0,'B':2,'C':4,'D':6}
assert p['D']=='C' and p['C']=='B'`,
        "A direct estimate of 9 must later improve to 6; the old queue entry becomes stale.",
      ),
      check(
        "dijkstra-tie",
        "Directed zero ties, unreachable, and singleton",
        `g={'A':[('B',0),('C',0)],'B':[('A',0),('C',0)],'C':[],'D':[]}
d,p=dijkstra(g,'A')
assert d == {'A':0,'B':0,'C':0,'D':None}
assert p == {'A':None,'B':'A','C':'A','D':None}
assert dijkstra({'A':[]},'A') == ({'A':0},{'A':None})
for bad in [-1, True, 1.5]:
    try: dijkstra({'A':[('B',bad)],'B':[]},'A')
    except ValueError: pass
    else: raise AssertionError('invalid edge accepted')`,
        "Sort neighbors, use strict improvement, leave unreachable vertices at None, and reject negative weights.",
      ),
    ],
    [
      "Push (distance, vertex) into heapq; initialize only start at zero.",
      "On pop, skip settled or outdated entries. Settle once; relax sorted outgoing edges only with strict improvement.",
    ],
    "The heap can hold an obsolete larger estimate; skip it when removed.",
    "Why does settling a minimum require nonnegative remaining edges?",
  ),
  lab(
    "reconstruct",
    "Reconstruct a predecessor path",
    [
      "Implement reconstruct_path(predecessors, distances, start, target). Return the start-to-target label list, or None if target is unreachable or either label is unknown.",
      "Follow predecessors backward, reverse once, and guard against malformed predecessor cycles. A start-equals-target path is [start] with cost 0.",
    ],
    `def reconstruct_path(predecessors, distances, start, target):
    return [start, target]  # intermediate vertices and reachability matter`,
    [
      check(
        "reconstruct-chain",
        "Full path and start equals target",
        `p={'A':None,'B':'A','C':'B','D':'C'}; d={'A':0,'B':2,'C':4,'D':6}
assert reconstruct_path(p,d,'A','D') == ['A','B','C','D']
assert reconstruct_path(p,d,'A','A') == ['A']`,
        "Walk backward from target until start; then reverse.",
      ),
      check(
        "reconstruct-boundary",
        "Unreachable and malformed cycle",
        `p={'A':None,'B':'C','C':'B','D':None}; d={'A':0,'B':2,'C':2,'D':None}
assert reconstruct_path(p,d,'A','D') is None
assert reconstruct_path(p,d,'A','B') is None
assert reconstruct_path(p,d,'A','X') is None`,
        "Check reachability and stop if a predecessor repeats.",
      ),
    ],
    [
      "Return None before walking if either label is absent or target is unreached.",
      "Keep a seen set while following predecessors. Return the reversed route only when start is reached.",
    ],
    "A predecessor chain certifies a path only when it reaches the chosen start.",
    "Why is [start] the right route when start equals target?",
  ),
];
