import type { CodingExercise, CodingTest } from "./coding-types";
import { bellmanSolutions } from "./bellman-solutions";
const check = (
  id: string,
  label: string,
  code: string,
  guidance: string,
): CodingTest => ({
  id: `bellman-${id}`,
  label,
  code,
  expectedBehavior: label,
  guidance,
  conceptIds: ["bellman-ford"],
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
  id: `bellman-${id}`,
  topicId: "bellman-ford",
  title,
  instructions,
  starter,
  tests,
  hints,
  explanation,
  reflection,
  expectedBehavior: instructions[0],
  conceptIds: ["bellman-ford"],
  revision: 1,
  referenceSolution: bellmanSolutions[`bellman-${id}`],
});
export const bellmanCodingExercises: CodingExercise[] = [
  lab(
    "adjacency",
    "Represent signed directed edges",
    [
      "Implement signed_adjacency(vertices, edges): map each vertex to a sorted list of (neighbor, weight) tuples.",
      "Preserve isolates and negative or zero weights. Reject unknown endpoints, duplicate directed pairs, noninteger or out-of-range weights (−20..20), and duplicate vertices. Reciprocal pairs are distinct.",
    ],
    `def signed_adjacency(vertices, edges):
    graph = {v: [] for v in vertices}
    for u, v, weight in edges:
        if weight < 0: continue  # bug: negative edges are valid
        graph[u].append((v, weight))
    return graph`,
    [
      check(
        "adj-signed",
        "Signed edges and isolates",
        `assert signed_adjacency(['C','B','A'], [('B','A',-3),('A','B',0)]) == {'A':[('B',0)],'B':[('A',-3)],'C':[]}`,
        "A negative directed edge is valid; keep both reciprocal entries when explicitly supplied.",
      ),
      check(
        "adj-reject",
        "Reject malformed edges",
        `for edges in [[('A','X',1)],[('A','B',21)],[('A','B',True)],[('A','B',1),('A','B',2)]]:
    try: signed_adjacency(['A','B'],edges)
    except ValueError: pass
    else: raise AssertionError('accepted invalid edge')`,
        "Validate endpoints, exact integer type, range, and ordered pair uniqueness.",
      ),
    ],
    [
      "Build all vertex keys before scanning edges.",
      "Use a set of ordered (u,v) pairs; sort each neighbor list.",
    ],
    "Signed edge weights are valid data; direction and validation determine the adjacency entries.",
    "Why is B → A not implied by A → B?",
  ),
  lab(
    "relax",
    "Repair strict relaxation",
    [
      "Implement strict_relax(distance, parent, u, v, weight), mutating the two maps only on a strict improvement and returning a boolean.",
      "None represents infinity. Ignore an unreachable source; preserve a predecessor on equal candidates. Reject unknown endpoints and noninteger weights.",
    ],
    `def strict_relax(distance, parent, u, v, weight):
    candidate = distance[u] + weight  # bug: None and ties
    if candidate <= distance[v]:
        distance[v], parent[v] = candidate, u
        return True
    return False`,
    [
      check(
        "relax-negative",
        "Negative candidate",
        `d={'A':0,'B':5};p={'A':None,'B':'A'}
assert strict_relax(d,p,'A','B',-2) is True and d['B']==-2 and p['B']=='A'`,
        "Add the source distance and negative weight; compare strictly.",
      ),
      check(
        "relax-tie",
        "Unreachable source and ties",
        `d={'A':0,'B':3,'C':None};p={'A':None,'B':'A','C':None}
assert strict_relax(d,p,'C','B',-5) is False
assert strict_relax(d,p,'A','B',3) is False and p['B']=='A'`,
        "None cannot be added; equal cost keeps the prior parent.",
      ),
    ],
    [
      "Check the source distance before arithmetic.",
      "Use candidate < old, with None treated as infinity.",
    ],
    "Strict ties preserve an existing valid predecessor; an unreachable source offers no path.",
    "What could happen to parents if zero-cost ties rewrote them repeatedly?",
  ),
  lab(
    "passes",
    "Run complete relaxation passes",
    [
      "Implement relaxation_passes(vertices, edges, start), returning (distance, parent, passes_run).",
      "Scan edges in sorted (source,target,weight) order up to V−1 times. Count every complete pass, stop only after a pass with no updates, and keep unreachable vertices at None.",
    ],
    `def relaxation_passes(vertices, edges, start):
    distance = {v: None for v in vertices}
    distance[start] = 0
    parent = {v: None for v in vertices}
    for u,v,w in edges:  # bug: one pass is insufficient
        if distance[u] is not None: distance[v] = distance[u]+w
    return distance,parent,1`,
    [
      check(
        "passes-chain",
        "Reverse-order chain needs repeated passes",
        `d,p,n=relaxation_passes(['A','B','C','D'], [('D','C',2),('C','B',2),('B','A',2)], 'D')
assert d['A']==6 and p['A']=='B' and n==3`,
        "Repeat complete sorted passes until convergence or V−1 rounds.",
      ),
      check(
        "passes-stop",
        "Early stop and isolates",
        `d,p,n=relaxation_passes(['A','B','C'], [('A','B',-2)], 'A')
assert d=={'A':0,'B':-2,'C':None} and n==2`,
        "An unchanged complete second pass proves convergence.",
      ),
    ],
    [
      "Initialize all vertices; source alone gets zero.",
      "Track changed across the entire pass, and break only after its final edge.",
    ],
    "A route may need multiple passes when edge order delays its prefixes.",
    "Why is an unchanged complete pass enough to stop?",
  ),
  lab(
    "detect",
    "Detect reachable cycle improvements",
    [
      "Implement relaxable_targets(vertices, edges, distance): return the set of targets of edges that can still strictly improve after V−1 passes.",
      "Only a reachable source can offer a candidate; reject unknown endpoints. Do not mutate the distance map.",
    ],
    `def relaxable_targets(vertices, edges, distance):
    return {v for u,v,w in edges if distance[u]+w < distance[v]}  # bug: None`,
    [
      check(
        "detect-reachable",
        "Reachable negative cycle target",
        `d={'A':0,'B':-3,'C':-4};assert relaxable_targets(['A','B','C'], [('B','C',-2),('C','B',1)],d)=={'C'}`,
        "Compare each reachable candidate with the current target estimate.",
      ),
      check(
        "detect-unreachable",
        "Ignore unreachable cycle",
        `d={'A':0,'B':None,'C':None};before=d.copy()
assert relaxable_targets(['A','B','C'], [('B','C',-3),('C','B',1)],d)==set() and d==before`,
        "A cycle disconnected from the source is not a reachable failure.",
      ),
    ],
    [
      "Guard distance[u] is None before adding weight.",
      "Return target labels only when a strict improvement remains.",
    ],
    "The extra check tests reachability from this source, not whether any cycle exists anywhere.",
    "Why can a disconnected negative cycle leave A’s paths valid?",
  ),
  lab(
    "impact",
    "Propagate negative-cycle influence",
    [
      "Implement cycle_impact(vertices, edges, seeds): return all seed vertices and vertices reachable from them through directed edges.",
      "Seeds are targets found by the extra relaxation check. Reject unknown seeds and do not add vertices that cannot be reached from the seeds.",
    ],
    `def cycle_impact(vertices, edges, seeds):
    return set(vertices) if seeds else set()  # bug: over-propagates`,
    [
      check(
        "impact-branch",
        "Affected downstream branch only",
        `assert cycle_impact(['A','B','C','D','E'], [('B','C',-2),('C','B',1),('C','D',2),('A','E',4)], {'B'})=={'B','C','D'}`,
        "Follow arrows from affected vertices; E is on an unaffected branch.",
      ),
      check(
        "impact-empty",
        "No seeds, no impact",
        `assert cycle_impact(['A','B','C'], [('A','B',1)], set())==set()`,
        "An empty seed set affects nothing.",
      ),
    ],
    [
      "Start a set and queue or iterate until no new vertex appears.",
      "Only follow edges whose source is already affected.",
    ],
    "A reachable negative cycle contaminates only destinations reachable from it.",
    "Why can E retain a finite path while D is negatively unbounded?",
  ),
  lab(
    "integrate",
    "Return trustworthy Bellman–Ford paths",
    [
      "Implement bellman_paths(vertices, edges, start), returning a map from each vertex to (status, cost, path).",
      "Statuses are 'finite', 'unreachable', or 'unbounded'. Finite paths are source-to-destination lists; otherwise cost and path are None. Validate vertices, source, and edges; run V−1 passes, an extra reachable check, and downstream propagation.",
    ],
    `def bellman_paths(vertices, edges, start):
    distance = {v: None for v in vertices}; distance[start]=0
    for u,v,w in edges: distance[v]=distance[u]+w  # bug: one pass, no cycle check
    return {v: ('finite', distance[v], [start,v]) for v in vertices}`,
    [
      check(
        "integrate-finite",
        "Negative edge without cycle",
        `r=bellman_paths(['A','B','C'], [('A','B',2),('A','C',5),('C','B',-10)], 'A')
assert r['B']==('finite',-5,['A','C','B']) and r['A']==('finite',0,['A'])`,
        "A negative edge is valid, and the path must follow actual directed edges.",
      ),
      check(
        "integrate-impact",
        "Cycle and unaffected branch",
        `r=bellman_paths(['A','B','C','D','E','F'], [('A','B',1),('B','C',-3),('C','B',1),('C','D',2),('A','E',4)], 'A')
assert r['B']==('unbounded',None,None) and r['D']==('unbounded',None,None)
assert r['E']==('finite',4,['A','E']) and r['F']==('unreachable',None,None)`,
        "Propagate only downstream of a reachable cycle; do not return temporary estimates as answers.",
      ),
    ],
    [
      "Initialize None, relax sorted edges through V−1 complete passes, then test one more time.",
      "Propagate from relaxable targets; reconstruct only finite paths with a visited guard.",
    ],
    "A finite estimate for a cycle-affected destination is not a shortest-path answer.",
    "Which destinations may still have finite paths when a reachable negative cycle exists?",
  ),
];
