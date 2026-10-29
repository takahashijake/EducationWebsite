import type { AdaptiveFamily } from "./adaptive-families";
type R = Parameters<AdaptiveFamily["generate"]>[0];
type Draft = ReturnType<AdaptiveFamily["generate"]>;
type Choice = Draft["choices"][number];
const yes = (text: string): Choice => ({ text, correct: true });
const no = (text: string, misconception: string): Choice => ({
  text,
  misconception,
});
const f = (
  id: string,
  skillId: string,
  difficulty: "foundation" | "application",
  generate: (r: R) => Draft,
): AdaptiveFamily => ({
  id: `weighted-${id}`,
  skillId,
  difficulty,
  revision: 1,
  topicId: "weighted-shortest-paths",
  reviewHref: "/lessons/weighted-shortest-paths",
  generate,
});
const d = (
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
export const weightedAdaptiveFamilies: AdaptiveFamily[] = [
  f("cost-sum", "weighted-path-costs", "foundation", (r) => {
    const a = r.int(0, 5),
      b = r.int(1, 7),
      sum = a + b;
    return d(
      "What is this path’s total cost?",
      `A → B weighs ${a}; B → C weighs ${b}.`,
      [
        yes(`${sum}`),
        no(
          `${sum + 1}`,
          "Adding an extra unit does not follow any edge weight.",
        ),
        no(
          `${Math.max(a, b) + 10}`,
          "Path cost adds the two weights, not an unrelated estimate.",
        ),
      ],
      `The path cost is ${a} + ${b} = ${sum}.`,
      "Add edge weights, including zero.",
    );
  }),
  f("cost-directed", "weighted-path-costs", "application", (r) => {
    const a = r.int(1, 6),
      b = r.int(1, 5);
    return d(
      "What does the shown directed route cost?",
      `Edges A → B (${a}), B → C (${b}); no C → B edge. Route A → B → C.`,
      [
        yes(`${a + b}`),
        no(`${a}`, "The second edge contributes its weight too."),
        no("unreachable", "Both forward arrows needed by the route exist."),
      ],
      `A → B → C follows both arrows and costs ${a} + ${b} = ${a + b}.`,
      "Follow only arrows in route order, then add costs.",
    );
  }),
  f("hops-detour", "weighted-hops-cost", "foundation", (r) => {
    const a = r.int(1, 4),
      b = r.int(1, 4),
      direct = a + b + r.int(1, 5);
    return d(
      "Which route has lower total cost?",
      `Direct A → C costs ${direct}; A → B → C costs ${a} + ${b}.`,
      [
        yes("A → B → C"),
        no("A → C", "Fewest hops can cost more."),
        no("Equal cost", `The direct cost ${direct} exceeds ${a + b}.`),
      ],
      `The two-hop route costs ${a + b}, less than ${direct}.`,
      "Compare sums rather than hop counts.",
    );
  }),
  f("hops-compare", "weighted-hops-cost", "application", (r) => {
    const x = r.int(1, 4),
      y = r.int(1, 4),
      z = r.int(1, 4),
      shortcut = x + y + z + r.int(1, 4);
    return d(
      "What route should a weighted shortest-path search choose?",
      `A → D costs ${shortcut}; A → B → C → D weighs ${x}, ${y}, ${z}.`,
      [
        yes("A → B → C → D"),
        no("A → D", "One edge is not necessarily least cost."),
        no("No route exists", "Both forward routes exist."),
      ],
      `The three-hop route costs ${x + y + z}, below ${shortcut}.`,
      "Sum each full route.",
    );
  }),
  f("relax-improve", "weighted-relaxation", "foundation", (r) => {
    const base = r.int(1, 8),
      weight = r.int(0, 5),
      old = base + weight + r.int(1, 6);
    return d(
      "Does this edge relaxation improve C?",
      `distance[B]=${base}, B → C weighs ${weight}, current distance[C]=${old}.`,
      [
        yes(`Yes, C becomes ${base + weight}`),
        no(`No, C stays ${old}`, "The candidate is strictly smaller."),
        no(`Yes, C becomes ${weight}`, "Include the source distance."),
      ],
      `Candidate ${base} + ${weight} = ${base + weight} is below ${old}; predecessor C becomes B.`,
      "Add source distance and edge weight before comparing.",
    );
  }),
  f("relax-tie", "weighted-relaxation", "application", (r) => {
    const base = r.int(0, 7),
      weight = r.int(0, 6),
      candidate = base + weight,
      old = candidate + r.int(0, 1);
    return d(
      "Should predecessor C change to B?",
      `distance[B]=${base}, B → C weighs ${weight}; C currently has estimate ${old} and predecessor A.`,
      [
        old > candidate
          ? yes("Yes")
          : no(
              "Yes",
              "An equal candidate does not replace the first predecessor.",
            ),
        old === candidate
          ? yes("No")
          : no("No", "A strictly lower candidate changes predecessor."),
        no("Always clear C", "Relaxation never clears a valid predecessor."),
      ],
      old > candidate
        ? `${base} + ${weight} = ${candidate} < ${old}, so update C and its predecessor.`
        : `${base} + ${weight} = ${candidate} ties ${old}; strict improvement keeps predecessor A.`,
      "Compare the candidate strictly with the old estimate.",
    );
  }),
  f("queue-min", "weighted-priority-queue", "foundation", (r) => {
    const low = r.int(0, 7),
      high = low + r.int(1, 5);
    return d(
      "Which vertex is removed next from the min-priority queue?",
      `Queue entries (B, ${high}), (C, ${low}), (D, ${high + 1}).`,
      [
        yes("C"),
        no("B", "B has a larger tentative distance."),
        no("D", "D has the largest tentative distance."),
      ],
      `C has the smallest distance ${low}.`,
      "Choose the smallest numeric distance.",
    );
  }),
  f("queue-stale", "weighted-priority-queue", "application", (r) => {
    const best = r.int(1, 7),
      old = best + r.int(1, 5);
    return d(
      "What happens when the old entry is removed?",
      `D’s current best distance is ${best}; its heap still contains older (D, ${old}).`,
      [
        yes("Skip the stale entry"),
        no(
          `Set D back to ${old}`,
          "An old worse estimate cannot overwrite the best.",
        ),
        no(
          "Relax every edge from D again",
          "A stale entry must not process D again.",
        ),
      ],
      `The popped cost ${old} differs from current ${best}, so skip it.`,
      "Compare popped cost with the current distance.",
    );
  }),
  f("invariant-settle", "weighted-settled-invariant", "foundation", (r) => {
    const minimum = r.int(1, 8),
      extra = r.int(0, 5);
    return d(
      "Why is the removed minimum final?",
      `Minimum valid tentative distance is ${minimum}; all remaining edges weigh at least ${extra} (nonnegative).`,
      [
        yes("No later route through an unsettled vertex can lower it"),
        no(
          "Every vertex was already discovered",
          "Discovery is not settlement.",
        ),
        no(
          "The heap has no duplicate entries",
          "Lazy heaps can hold stale entries.",
        ),
      ],
      `A competing route begins at distance at least ${minimum}, then adds at least ${extra}; it cannot beat ${minimum}.`,
      "Use the nonnegative-edge condition.",
    );
  }),
  f("invariant-negative", "weighted-settled-invariant", "application", (r) => {
    const settled = r.int(4, 9),
      via = settled + r.int(1, 4),
      negative = -(via - settled + r.int(1, 4));
    return d(
      "Why is greedy settling unsafe here?",
      `D was settled at ${settled}; another route reaches B at ${via}, then B → D weighs ${negative}.`,
      [
        yes("The later route can undercut D"),
        no(
          "The later route must cost more",
          "A negative edge can reduce total cost.",
        ),
        no(
          "Only ties are possible",
          `The route can cost ${via + negative}, below ${settled}.`,
        ),
      ],
      `${via} + (${negative}) = ${via + negative}, less than settled ${settled}; Dijkstra’s invariant fails.`,
      "Add the negative edge to the route reaching B.",
    );
  }),
  f("limits-heap", "weighted-complexity-limits", "foundation", (r) => {
    const v = r.int(4, 9),
      e = r.int(v, v + 8);
    return d(
      "Which bound fits this implementation?",
      `${v} vertices, ${e} adjacency entries; binary min-heap with lazy duplicate entries.`,
      [
        yes("O((V + E) log(V + E))"),
        no(
          "O(V + E) with no heap factor",
          "Heap push and pop are logarithmic.",
        ),
        no("O(1)", "Edges and entries must be processed."),
      ],
      `Scanning edges plus at most O(E) heap entries gives O((V + E) log(V + E)).`,
      "Include binary-heap operation costs.",
    );
  }),
  f("limits-algorithm", "weighted-complexity-limits", "application", (r) => {
    const negative = r.int(0, 1) === 1,
      weight = negative ? -r.int(1, 20) : r.int(0, 20);
    return d(
      "Which algorithm choice is justified?",
      `A directed graph contains an edge of weight ${weight}; all other edges are nonnegative. Assume no reachable negative cycle.`,
      [
        negative
          ? no("Dijkstra", "A negative edge breaks Dijkstra’s settling proof.")
          : yes("Dijkstra"),
        negative
          ? yes("Bellman-Ford")
          : no(
              "Bellman-Ford is required",
              "Nonnegative weights permit Dijkstra; Bellman-Ford is unnecessary here.",
            ),
        no(
          "BFS for arbitrary weights",
          "BFS minimizes hops, not weighted cost.",
        ),
      ],
      negative
        ? `Weight ${weight} is negative, so choose Bellman-Ford; Dijkstra’s settled invariant is invalid.`
        : `All weights are stated nonnegative; Dijkstra can compute shortest paths with a heap.`,
      "Check whether every edge is nonnegative before choosing Dijkstra.",
    );
  }),
];
