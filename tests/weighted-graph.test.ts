import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  generateWeightedSteps,
  reconstructWeightedPath,
  weightedAdjacency,
  weightedScenarios,
  MAX_WEIGHTED_EDGES,
  MAX_WEIGHTED_STEPS,
  MAX_WEIGHTED_QUEUE,
  type WeightedGraph,
} from "@/lib/weighted-graph-steps";
import { weightedSolutions } from "@/content/weighted-solutions";
import { weightedCodingExercises } from "@/content/weighted-coding-exercises";
import { weightedRetrievalQuestions } from "@/content/weighted-catalog";
import {
  adaptiveFamilies,
  generateAdaptiveInstance,
} from "@/content/adaptive-families";
import { activities, skills } from "@/content/learning-catalog";
import { validateLearningCatalog } from "@/content/learning-catalog-validation";
import { lessons } from "@/content/lessons";
import { topics } from "@/content/curriculum";

function oracle(graph: WeightedGraph, start: string) {
  const adj = weightedAdjacency(graph),
    distance: Record<string, number | null> = Object.fromEntries(
      graph.vertices.map((v) => [v, null]),
    );
  distance[start] = 0;
  for (let pass = 0; pass < graph.vertices.length - 1; pass++) {
    let changed = false;
    for (const from of [...graph.vertices].sort())
      for (const { to, weight } of adj[from])
        if (
          distance[from] !== null &&
          (distance[to] === null || distance[from] + weight < distance[to]!)
        ) {
          distance[to] = distance[from] + weight;
          changed = true;
        }
    if (!changed) break;
  }
  return distance;
}
function generated(seed: number): WeightedGraph {
  const n = 1 + (seed % 7),
    vertices = "ABCDEFG".slice(0, n).split(""),
    directed = seed % 2 === 0;
  const edges: [string, string, number][] = [];
  for (let a = 0; a < n; a++)
    for (let b = 0; b < n; b++) {
      if (!directed && a > b) continue;
      if (
        (seed * 17 + a * 13 + b * 7 + a * b * 5) % 11 < 3 &&
        edges.length < MAX_WEIGHTED_EDGES
      )
        edges.push([vertices[a], vertices[b], (seed + a * 3 + b * 5) % 8]);
    }
  return { vertices, edges, directed };
}
describe("weighted Dijkstra engine", () => {
  it("matches independent Bellman-Ford distances on many directed and undirected graphs", () => {
    for (let seed = 0; seed < 240; seed++) {
      const graph = generated(seed),
        start = graph.vertices[seed % graph.vertices.length];
      const steps = generateWeightedSteps(graph, start, graph.vertices.at(-1));
      const final = steps.at(-1)!;
      expect(final.phase).toBe("complete");
      expect(steps.length).toBeLessThanOrEqual(MAX_WEIGHTED_STEPS);
      expect(
        steps.every((step) => step.queue.length <= MAX_WEIGHTED_QUEUE),
      ).toBe(true);
      expect(final.distances).toEqual(oracle(graph, start));
      const adj = weightedAdjacency(graph);
      for (const target of graph.vertices) {
        const path = reconstructWeightedPath(
          final.predecessors,
          final.distances,
          start,
          target,
        );
        if (final.distances[target] === null) {
          expect(path).toBeNull();
          continue;
        }
        expect(path?.[0]).toBe(start);
        expect(path?.at(-1)).toBe(target);
        expect(new Set(path).size).toBe(path?.length);
        let sum = 0;
        for (let i = 1; i < path!.length; i++) {
          const edge = adj[path![i - 1]].find((e) => e.to === path![i]);
          expect(edge).toBeDefined();
          sum += edge!.weight;
        }
        expect(sum).toBe(final.distances[target]);
      }
      for (const step of steps) {
        expect(
          step.queue.map((e) => [e.distance, e.vertex, e.sequence]),
        ).toEqual(
          [...step.queue]
            .sort(
              (a, b) =>
                a.distance - b.distance ||
                a.vertex.localeCompare(b.vertex) ||
                a.sequence - b.sequence,
            )
            .map((e) => [e.distance, e.vertex, e.sequence]),
        );
        for (const v of step.settled)
          expect(step.distances[v]).toBe(final.distances[v]);
      }
    }
  });
  it("traces strict improvements, stale entries, zero cycles, ties, and unreachable results", () => {
    const detour = generateWeightedSteps(weightedScenarios[0].graph, "A", "D");
    expect(detour.some((s) => s.phase === "stale" && s.current === "D")).toBe(
      true,
    );
    expect(
      detour
        .filter((s) => s.phase === "relax" && s.edge?.[1] === "D" && s.improved)
        .map((s) => s.candidate),
    ).toEqual([9, 6]);
    expect(detour.at(-1)!.path).toEqual(["A", "B", "C", "D"]);
    expect(detour.at(-1)!.pathCost).toBe(6);
    expect(
      generateWeightedSteps(weightedScenarios[1].graph, "A", "D").at(-1)!.path,
    ).toEqual(["A", "B", "D"]);
    expect(
      generateWeightedSteps(weightedScenarios[2].graph, "A", "D").at(-1)!.path,
    ).toBeNull();
    expect(
      generateWeightedSteps(weightedScenarios[4].graph, "A", "A").at(-1)!.path,
    ).toEqual(["A"]);
    const cycle: WeightedGraph = {
      vertices: ["A", "B", "C"],
      edges: [
        ["A", "B", 0],
        ["B", "C", 0],
        ["C", "A", 0],
      ],
      directed: true,
    };
    expect(generateWeightedSteps(cycle, "A", "C").at(-1)!.predecessors).toEqual(
      { A: null, B: "A", C: "B" },
    );
    expect(
      generateWeightedSteps(
        { vertices: ["A"], edges: [], directed: false },
        "A",
        "A",
      ).at(-1)!.pathCost,
    ).toBe(0);
  });
  it("rejects malformed edges, bounds, and endpoints without mutating historical snapshots", () => {
    const graph: WeightedGraph = {
      vertices: ["A", "B"],
      edges: [["A", "B", 0]],
      directed: false,
    };
    for (const bad of [NaN, Infinity, -1, 1.5, 1000])
      expect(() =>
        weightedAdjacency({ ...graph, edges: [["A", "B", bad]] }),
      ).toThrow();
    expect(() =>
      weightedAdjacency({ ...graph, edges: [["A", "X", 1]] }),
    ).toThrow();
    expect(() =>
      weightedAdjacency({
        ...graph,
        edges: [
          ["A", "B", 1],
          ["B", "A", 2],
        ],
      }),
    ).toThrow();
    expect(() => weightedAdjacency({ ...graph, vertices: [] })).toThrow();
    expect(() =>
      weightedAdjacency({ ...graph, vertices: "ABCDEFGHIJ".split("") }),
    ).toThrow();
    expect(() =>
      weightedAdjacency({ ...graph, edges: Array(19).fill(["A", "B", 1]) }),
    ).toThrow();
    expect(() => generateWeightedSteps(graph, "X")).toThrow();
    expect(() => generateWeightedSteps(graph, "A", "X")).toThrow();
    const steps = generateWeightedSteps(graph, "A", "B"),
      before = JSON.stringify(steps[0]);
    expect(Object.isFrozen(steps[0].queue)).toBe(true);
    expect(Object.isFrozen(steps[0].distances)).toBe(true);
    expect(() => {
      steps.at(-1)!.distances.A = 123;
    }).toThrow();
    expect(JSON.stringify(steps[0])).toBe(before);
  });
});
describe("weighted learning integration", () => {
  it("registers the lesson, skills, retrieval, families, and mappings", () => {
    expect(topics.find((t) => t.id === "weighted-shortest-paths")?.status).toBe(
      "available",
    );
    expect(lessons["weighted-shortest-paths"].codingExercises).toHaveLength(6);
    expect(
      skills.filter((s) => s.topicId === "weighted-shortest-paths"),
    ).toHaveLength(6);
    expect(weightedRetrievalQuestions).toHaveLength(12);
    const families = adaptiveFamilies.filter(
      (f) => f.topicId === "weighted-shortest-paths",
    );
    expect(families).toHaveLength(12);
    for (const family of families) {
      const contexts = new Set<string>();
      for (let seed = 0; seed < 30; seed++) {
        const instance = generateAdaptiveInstance(family.id, 1, seed)!;
        expect(instance.familyId).toBe(family.id);
        expect(instance.options).toHaveLength(3);
        expect(new Set(instance.options.map((o) => o.text)).size).toBe(3);
        expect(
          instance.options.filter((_, i) => i === instance.correctIndex),
        ).toHaveLength(1);
        expect(instance.explanation.length).toBeGreaterThan(25);
        expect(instance.hints.every(Boolean)).toBe(true);
        contexts.add(instance.context);
      }
      expect(contexts.size).toBeGreaterThan(1);
      expect(
        activities.filter((a) => a.id === `adaptive-${family.id}`),
      ).toHaveLength(1);
    }
    expect(validateLearningCatalog()).toEqual([]);
  });
  it("executes references against independently authored public and regression assertions", () => {
    const regressions: Record<string, string> = {
      "weighted-adjacency": `assert weighted_adjacency(['A'], [('A','A',0)]) == {'A':[('A',0)]}`,
      "weighted-route-cost": `assert route_cost({'A':[('B',4)],'B':[]},['A','B']) == 4`,
      "weighted-select": `assert select_minimum({'Z':None,'B':2,'A':2},{'A'}) == 'B'`,
      "weighted-relax": `d={'A':0,'B':0};p={'A':None,'B':'A'};assert relax(d,p,'B','A',0) is False and p['A'] is None`,
      "weighted-dijkstra": `g={'A':[('B',0)],'B':[('A',0)],'C':[]};assert dijkstra(g,'A') == ({'A':0,'B':0,'C':None},{'A':None,'B':'A','C':None})`,
      "weighted-reconstruct": `assert reconstruct_path({'A':None},{'A':0},'A','A') == ['A']`,
    };
    for (const exercise of weightedCodingExercises) {
      expect(exercise.tests.length).toBeGreaterThanOrEqual(2);
      const solution = weightedSolutions[exercise.id];
      for (const test of exercise.tests) {
        const run = spawnSync("python3", ["-I", "-"], {
          input: `${solution}\n${test.code}\n`,
          encoding: "utf8",
          timeout: 3000,
        });
        expect(run.status, `${exercise.id}/${test.id}: ${run.stderr}`).toBe(0);
      }
      const run = spawnSync("python3", ["-I", "-"], {
        input: `${solution}\n${regressions[exercise.id]}\n`,
        encoding: "utf8",
        timeout: 3000,
      });
      expect(run.status, `${exercise.id}: ${run.stderr}`).toBe(0);
      const starter = spawnSync("python3", ["-I", "-"], {
        input: `${exercise.starter}\n${exercise.tests[0].code}\n`,
        encoding: "utf8",
        timeout: 3000,
      });
      expect(starter.status).not.toBe(0);
    }
  });
});

describe("weighted adaptive arithmetic across seeded variants", () => {
  const answer = (family: string, seed: number) => {
    const instance = generateAdaptiveInstance(family, 1, seed)!;
    return {
      context: instance.context,
      correct: instance.options[instance.correctIndex].text,
      explanation: instance.explanation,
      hints: instance.hints,
      familyId: instance.familyId,
    };
  };
  it("computes route sums, comparisons, relaxations, queue choices, and negative counterexamples", () => {
    for (let seed = 0; seed < 80; seed++) {
      let item = answer("weighted-cost-sum", seed),
        nums = [...item.context.matchAll(/weighs (\d+)/g)].map((m) =>
          Number(m[1]),
        );
      expect(item.correct).toBe(String(nums[0] + nums[1]));
      item = answer("weighted-cost-directed", seed);
      nums = [...item.context.matchAll(/\((\d+)\)/g)].map((m) => Number(m[1]));
      expect(item.correct).toBe(String(nums[0] + nums[1]));
      item = answer("weighted-hops-detour", seed);
      nums = [...item.context.matchAll(/\d+/g)].map((m) => Number(m[0]));
      expect(nums[0]).toBeGreaterThan(nums[1] + nums[2]);
      expect(item.correct).toBe("A → B → C");
      item = answer("weighted-hops-compare", seed);
      nums = [...item.context.matchAll(/\d+/g)].map((m) => Number(m[0]));
      expect(nums[0]).toBeGreaterThan(nums[1] + nums[2] + nums[3]);
      expect(item.correct).toBe("A → B → C → D");
      item = answer("weighted-relax-improve", seed);
      nums = [...item.context.matchAll(/=?(\d+)/g)].map((m) => Number(m[1]));
      expect(item.correct).toBe(`Yes, C becomes ${nums[0] + nums[1]}`);
      expect(nums[2]).toBeGreaterThan(nums[0] + nums[1]);
      item = answer("weighted-relax-tie", seed);
      nums = [...item.context.matchAll(/=?(\d+)/g)].map((m) => Number(m[1]));
      expect(item.correct).toBe(nums[0] + nums[1] < nums[2] ? "Yes" : "No");
      item = answer("weighted-queue-min", seed);
      nums = [...item.context.matchAll(/\(\w, (\d+)\)/g)].map((m) =>
        Number(m[1]),
      );
      expect(nums[1]).toBeLessThan(nums[0]);
      expect(nums[1]).toBeLessThan(nums[2]);
      expect(item.correct).toBe("C");
      item = answer("weighted-queue-stale", seed);
      nums = [...item.context.matchAll(/\d+/g)].map((m) => Number(m[0]));
      expect(nums[1]).toBeGreaterThan(nums[0]);
      expect(item.correct).toBe("Skip the stale entry");
      item = answer("weighted-invariant-negative", seed);
      nums = [...item.context.matchAll(/-?\d+/g)].map((m) => Number(m[0]));
      expect(nums[1] + nums[2]).toBeLessThan(nums[0]);
      expect(item.correct).toBe("The later route can undercut D");
      item = answer("weighted-limits-algorithm", seed);
      nums = [...item.context.matchAll(/-?\d+/g)].map((m) => Number(m[0]));
      expect(item.correct).toBe(nums[0] < 0 ? "Bellman-Ford" : "Dijkstra");
      expect(item.hints.every(Boolean)).toBe(true);
      expect(item.explanation.length).toBeGreaterThan(25);
    }
  });
});
