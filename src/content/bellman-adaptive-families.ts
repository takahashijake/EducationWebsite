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
  id: `bellman-${id}`,
  skillId,
  difficulty,
  revision: 1,
  topicId: "bellman-ford",
  reviewHref: "/lessons/bellman-ford",
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
export const bellmanAdaptiveFamilies: AdaptiveFamily[] = [
  f("signed-sum", "bellman-negative-costs", "foundation", (r) => {
    const a = r.int(2, 8),
      b = r.int(a + 1, a + 7),
      sum = a - b;
    return d(
      "What is the route cost?",
      `A → B weighs ${a}; B → C weighs −${b}.`,
      [
        yes(`${sum}`),
        no(`${a + b}`, "A negative edge subtracts from the route cost."),
        no(`${a}`, "Both edges contribute to the route cost."),
      ],
      `The sum is ${a} − ${b} = ${sum}.`,
      "Add both signed edge weights.",
    );
  }),
  f("edge-vs-cycle", "bellman-negative-costs", "application", (r) => {
    const w = r.int(2, 9),
      back = r.int(0, 1) === 1,
      returnWeight = back ? r.int(0, w - 1) : null;
    const cycle = back;
    return d(
      "Is a negative directed cycle shown?",
      back
        ? `A → B weighs −${w}; B → A weighs ${returnWeight}.`
        : `A → B weighs −${w}; no route returns from B to A.`,
      [
        cycle
          ? yes("Yes, A → B → A is negative")
          : no(
              "Yes, A → B → A is negative",
              "There is no directed return route to close this walk.",
            ),
        cycle
          ? no(
              "No, only a negative edge",
              "The return edge closes a cycle with negative total cost.",
            )
          : yes("No, only a negative edge"),
        no(
          "Every destination is unbounded",
          "Cycle existence and source/destination reachability require separate checks.",
        ),
      ],
      cycle
        ? `The closed walk totals −${w} + ${returnWeight} < 0.`
        : "A negative edge alone does not close a directed cycle.",
      "Look for a directed return route and add the cycle weights.",
    );
  }),
  f("round-bound", "bellman-rounds", "foundation", (r) => {
    const v = r.int(3, 40);
    return d(
      "What is the maximum number of relaxation passes before the extra check?",
      `${v} vertices, no early stop.`,
      [
        yes(`${v - 1}`),
        no(`${v}`, "A simple route uses at most V−1 edges."),
        no("1", "One pass may not propagate along all route prefixes."),
      ],
      `At most V−1 = ${v - 1} complete passes cover simple routes.`,
      "A simple route cannot revisit a vertex.",
    );
  }),
  f("round-order", "bellman-rounds", "application", (r) => {
    const w1 = r.int(1, 5),
      w2 = r.int(-5, -1);
    return d(
      "Why can B remain unreachable after the first sorted pass?",
      `Edges B → A (${w2}), C → B (${w1}); source C. Scan B → A before C → B.`,
      [
        yes(
          "B becomes reachable late in the pass; B → A waits until the next pass",
        ),
        no(
          "Negative weights prevent all relaxation",
          "A negative weight is allowed and does not prevent reachability.",
        ),
        no("A must start at zero", "Only source C begins at zero."),
      ],
      "The B → A edge was already scanned when C → B first set B.",
      "Track edge scan order and when each source becomes reachable.",
    );
  }),
  f("stop-condition", "bellman-convergence", "foundation", (r) => {
    const pass = r.int(1, 6),
      updates = r.int(0, 5);
    return d(
      "Can the algorithm stop after this complete pass?",
      `Pass ${pass} finished with ${updates} strict improvement${updates === 1 ? "" : "s"}.`,
      [
        updates === 0
          ? yes("Yes, estimates converged")
          : no(
              "Yes, estimates converged",
              "An improvement means another pass may still propagate a route.",
            ),
        updates === 0
          ? no(
              "No, V−1 passes are mandatory",
              "An unchanged complete pass makes further scans redundant.",
            )
          : yes("No, continue if passes remain"),
        no(
          "Stop after any single edge is unchanged",
          "Only a complete unchanged pass justifies convergence.",
        ),
      ],
      updates === 0
        ? "No edge improved, so all constraints remain satisfied."
        : "At least one estimate improved; continue if passes remain.",
      "Count improvements across the full pass.",
    );
  }),
  f("stop-vs-check", "bellman-convergence", "application", (r) => {
    const v = r.int(4, 9),
      p = r.int(1, v - 2);
    return d(
      "What follows an unchanged pass?",
      `V=${v}; pass ${p} made no updates.`,
      [
        yes("Stop relaxation passes and classify stable routes"),
        no(
          "Set every unreachable vertex to zero",
          "No path was discovered to unreachable vertices.",
        ),
        no(
          "Claim a negative cycle was found",
          "No update is evidence of convergence, not a negative cycle.",
        ),
      ],
      "A full unchanged pass makes later relaxation passes redundant; the final status remains truthful.",
      "An unchanged full pass leaves every edge inequality satisfied.",
    );
  }),
  f("detect-candidate", "bellman-cycle-detection", "foundation", (r) => {
    const du = r.int(-6, 2),
      w = r.int(-6, -1),
      dv = du + w + r.int(1, 4);
    return d(
      "Does this reachable edge remain relaxable on the extra check?",
      `distance[U]=${du}; U → V weighs ${w}; distance[V]=${dv}.`,
      [
        yes("Yes, a further strict improvement exists"),
        no(
          "No, all estimates are final",
          "The candidate is smaller than V’s current estimate.",
        ),
        no(
          "No, negative edges are invalid",
          "Bellman–Ford accepts negative edges.",
        ),
      ],
      `${du} + (${w}) = ${du + w}, below ${dv}.`,
      "Compare source distance plus weight with the target estimate.",
    );
  }),
  f("detect-unreachable", "bellman-cycle-detection", "application", (r) => {
    const w = r.int(2, 12),
      returnWeight = r.int(0, w - 1);
    return d(
      "Does this disconnected cycle trigger source A’s negative-cycle report?",
      `A has no route to B or C. B → C weighs −${w}; C → B weighs ${returnWeight}.`,
      [
        yes("No, neither cycle edge has a reachable source"),
        no(
          "Yes, every negative cycle affects every source",
          "Reachability from the chosen source is required.",
        ),
        no(
          "Yes, because C → B is positive",
          "The cycle total is negative, but its component is disconnected from A.",
        ),
      ],
      "The cycle is negative but unreachable from A, so it cannot improve A’s route estimates.",
      "Check whether a path from A reaches either cycle vertex.",
    );
  }),
  f("impact-chain", "bellman-cycle-impact", "foundation", (r) => {
    const hops = r.int(1, 5),
      chainWeight = r.int(-9, 9);
    return d(
      "Which vertex is affected by the detected cycle?",
      `Cycle influence seeds B; a directed chain of ${hops} edge${hops === 1 ? "" : "s"} of weight ${chainWeight} each reaches D. E is on a separate branch.`,
      [
        yes("D, but not E"),
        no(
          "D and E",
          "Only vertices reachable from a cycle seed are affected.",
        ),
        no(
          "Neither D nor E",
          "The directed chain carries cycle influence to D.",
        ),
      ],
      "Repeatedly follow outgoing directed edges from the cycle seeds; D is downstream, E is not.",
      "Trace arrows outward from B.",
    );
  }),
  f("impact-status", "bellman-cycle-impact", "application", (r) => {
    const estimate = r.int(-20, -1),
      branch = r.int(1, 9);
    return d(
      "What final answers can be reported?",
      `D has temporary estimate ${estimate} and is downstream of a reachable negative cycle. E is reached only by a separate edge of cost ${branch}.`,
      [
        yes(`D is unbounded; E is finite at ${branch}`),
        no(
          `D is finite at ${estimate}; E is finite at ${branch}`,
          "A temporary estimate downstream of a negative cycle is not a minimum.",
        ),
        no(
          "Both are unbounded",
          "Cycle influence cannot reach E on this graph.",
        ),
      ],
      "D can be made arbitrarily cheap; the separate E route stays finite.",
      "Classify each destination by directed reachability from the cycle.",
    );
  }),
  f("choose-basic", "bellman-algorithm-choice", "foundation", (r) => {
    const mode = r.int(0, 2),
      size = r.int(3, 15),
      contexts = [
        `Every edge has unit cost; minimize hops from A through ${size} edges.`,
        `Weights vary from 0 to ${size} and are all nonnegative.`,
        `Some directed edges weigh −${size}; detect reachable negative cycles.`,
      ];
    const answers = ["BFS", "Dijkstra", "Bellman–Ford"];
    return d(
      "Which is the most direct conventional algorithm for this requirement?",
      contexts[mode],
      [0, 1, 2].map((i) =>
        i === mode
          ? yes(answers[i])
          : no(
              answers[i],
              i === 0
                ? "BFS minimizes hops, not arbitrary weighted cost."
                : i === 1
                  ? "Dijkstra requires nonnegative weights; use its guarantee only under that precondition."
                  : "Bellman–Ford works here but the stated simpler requirement is served by the matching algorithm.",
            ),
      ) as [Choice, Choice, Choice],
      `Choose ${answers[mode]} for this stated graph and objective.`,
      "Check unit cost, nonnegative weights, and negative-edge requirements.",
    );
  }),
  f("choose-application", "bellman-algorithm-choice", "application", (r) => {
    if (r.int(0, 1) === 1) {
      const credit = r.int(1, 15);
      return d(
        "What does this negative edge imply about standard Dijkstra?",
        `A → B weighs −${credit}; no directed edge returns to A.`,
        [
          yes(
            "Its nonnegative proof fails; a particular run might still be correct",
          ),
          no(
            "It always returns a wrong answer on every graph with a negative edge",
            "A negative edge removes Dijkstra's guarantee, but does not force every run to be wrong.",
          ),
          no(
            "This single edge proves a negative cycle",
            "A negative cycle needs a directed closed walk with negative total weight.",
          ),
        ],
        "The greedy settled-distance proof needs nonnegative edges. This graph has a negative edge but no shown return route or guaranteed Dijkstra failure.",
        "Distinguish a missing correctness guarantee from a guaranteed wrong output.",
      );
    }
    const v = r.int(3, 8),
      e = r.int(v, Math.min(18, v * 2));
    return d(
      "What worst-case scan work should you budget for Bellman–Ford?",
      `V=${v}, E=${e} directed edges. Ignore teaching snapshots.`,
      [
        yes(`O(VE), proportional to ${v}×${e} edge checks`),
        no("O(1), one edge check", "Every pass scans all E edges."),
        no(
          "O(E log V), like heap Dijkstra",
          "Bellman–Ford repeats full edge scans up to V−1 times.",
        ),
      ],
      `Up to V−1 full passes plus detection give O(VE) time and O(V) auxiliary state.`,
      "Multiply the pass count by directed edges per pass.",
    );
  }),
];
