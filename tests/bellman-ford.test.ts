import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  generateBellmanSteps,
  reconstructBellmanPath,
  validateBellmanGraph,
  bellmanScenarios,
  type BellmanGraph,
} from "@/lib/bellman-ford-steps";
import { bellmanCodingExercises } from "@/content/bellman-coding-exercises";
import { bellmanSolutions } from "@/content/bellman-solutions";
import { bellmanRetrievalQuestions } from "@/content/bellman-catalog";
import {
  adaptiveFamilies,
  generateAdaptiveInstance,
} from "@/content/adaptive-families";
import { activities, skills } from "@/content/learning-catalog";
import { validateLearningCatalog } from "@/content/learning-catalog-validation";
import { lessons } from "@/content/lessons";

function oracle(graph: BellmanGraph, start: string) {
  const vs = graph.vertices,
    n = vs.length,
    index = Object.fromEntries(vs.map((v, i) => [v, i]));
  const d = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 0 : Infinity)),
  );
  for (const [a, b, w] of graph.edges)
    d[index[a]][index[b]] = Math.min(d[index[a]][index[b]], w);
  for (let k = 0; k < n; k++)
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++)
        d[i][j] = Math.min(d[i][j], d[i][k] + d[k][j]);
  return Object.fromEntries(
    vs.map((v) => {
      const j = index[v],
        affected = vs.some(
          (k) =>
            d[index[start]][index[k]] < Infinity &&
            d[index[k]][index[k]] < 0 &&
            d[index[k]][j] < Infinity,
        );
      return [
        v,
        affected
          ? { status: "unbounded", cost: null }
          : {
              status:
                d[index[start]][j] === Infinity ? "unreachable" : "finite",
              cost: d[index[start]][j] === Infinity ? null : d[index[start]][j],
            },
      ];
    }),
  );
}
function randomGraph(seed: number): BellmanGraph {
  let state = seed + 1;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
  const n = 1 + (next() % 6),
    vertices = "ABCDEF".slice(0, n).split(""),
    edges: [string, string, number][] = [];
  for (const a of vertices)
    for (const b of vertices)
      if (edges.length < 18 && next() % 5 === 0)
        edges.push([a, b, (next() % 11) - 5]);
  return { vertices, edges };
}
describe("Bellman–Ford engine", () => {
  it("matches independent Floyd–Warshall classification and finite costs on fixed random graphs", () => {
    for (let seed = 0; seed < 300; seed++) {
      const graph = randomGraph(seed),
        start = graph.vertices[seed % graph.vertices.length],
        final = generateBellmanSteps(graph, start).at(-1)!,
        expected = oracle(graph, start);
      expect(final.phase).toBe("complete");
      for (const v of graph.vertices) {
        const status = final.affected.includes(v)
          ? "unbounded"
          : final.distances[v] === null
            ? "unreachable"
            : "finite";
        expect(status, `seed ${seed} ${v}`).toBe(expected[v].status);
        if (status === "finite")
          expect(final.distances[v], `seed ${seed} ${v}`).toBe(
            expected[v].cost,
          );
        const destination = generateBellmanSteps(graph, start, v).at(-1)!;
        expect(destination.destinationStatus).toBe(expected[v].status);
        if (status === "finite") {
          expect(destination.cost).toBe(expected[v].cost);
          expect(destination.path?.[0]).toBe(start);
          expect(destination.path?.at(-1)).toBe(v);
          let sum = 0;
          for (let i = 0; i < destination.path!.length - 1; i++) {
            const edge = graph.edges.find(
              ([a, b]) =>
                a === destination.path![i] && b === destination.path![i + 1],
            );
            expect(edge).toBeDefined();
            sum += edge![2];
          }
          expect(sum).toBe(destination.cost);
        } else expect(destination.path).toBeNull();
      }
    }
  });
  it("covers scenarios, witnesses, immutability, ties, and guarded reconstruction", () => {
    for (const scenario of bellmanScenarios) {
      const steps = generateBellmanSteps(
          scenario.graph,
          scenario.start,
          scenario.destination,
        ),
        last = steps.at(-1)!;
      expect(steps.length).toBeLessThanOrEqual(450);
      expect(Object.isFrozen(steps)).toBe(true);
      expect(Object.isFrozen(last.distances)).toBe(true);
      expect(Object.isFrozen(last.affected)).toBe(true);
      if (last.witness) {
        const cycle = last.witness;
        expect(cycle[0]).toBe(cycle.at(-1));
        let cost = 0;
        for (let i = 0; i < cycle.length - 1; i++) {
          const edge = scenario.graph.edges.find(
            ([a, b]) => a === cycle[i] && b === cycle[i + 1],
          );
          expect(edge).toBeDefined();
          cost += edge![2];
        }
        expect(cost).toBeLessThan(0);
      }
    }
    expect(
      generateBellmanSteps(bellmanScenarios[1].graph, "A", "B").at(-1)!.cost,
    ).toBe(-5);
    expect(
      generateBellmanSteps(bellmanScenarios[5].graph, "A", "E").at(-1)!.cost,
    ).toBe(4);
    expect(
      generateBellmanSteps(bellmanScenarios[5].graph, "A", "D").at(-1)!
        .destinationStatus,
    ).toBe("unbounded");
    expect(
      generateBellmanSteps(
        {
          vertices: ["A", "B"],
          edges: [
            ["A", "A", -1],
            ["A", "B", 0],
          ],
        },
        "A",
        "B",
      ).at(-1)!.destinationStatus,
    ).toBe("unbounded");
    expect(
      generateBellmanSteps(
        {
          vertices: ["A", "B", "C"],
          edges: [
            ["A", "B", 1],
            ["A", "C", 1],
            ["C", "B", 0],
          ],
        },
        "A",
        "B",
      ).at(-1)!.predecessors.B,
    ).toBe("A");
    expect(
      reconstructBellmanPath(
        { A: null, B: "C", C: "B" },
        { A: 0, B: 1, C: 1 },
        "A",
        "B",
      ),
    ).toBeNull();
  });
  it("propagates multiple reachable negative cycles without contaminating a separate branch", () => {
    const graph: BellmanGraph = {
      vertices: ["A", "B", "C", "D", "E", "F", "G"],
      edges: [
        ["A", "B", 1],
        ["B", "C", -3],
        ["C", "B", 1],
        ["C", "D", 2],
        ["A", "E", 2],
        ["E", "F", -4],
        ["F", "E", 1],
        ["F", "G", 3],
      ],
    };
    const steps = generateBellmanSteps(graph, "A", "A");
    expect(steps.at(-1)!.affected).toEqual(["B", "C", "D", "E", "F", "G"]);
    expect(steps.at(-1)!.path).toEqual(["A"]);
    expect(steps.at(-1)!.cost).toBe(0);
    expect(
      steps.some(
        (step) => step.phase === "detection" && step.negativeCycleDetected,
      ),
    ).toBe(true);
    const before = JSON.stringify(steps[0]);
    expect(() => {
      (steps[0].distances as Record<string, number | null>).A = 99;
    }).toThrow();
    expect(JSON.stringify(steps[0])).toBe(before);
  });
  it("rejects malformed graphs and preserves Dijkstra's separate nonnegative contract", () => {
    const base: BellmanGraph = {
      vertices: ["A", "B"],
      edges: [["A", "B", -1]],
    };
    expect(validateBellmanGraph(base)).toHaveLength(1);
    for (const graph of [
      { vertices: [], edges: [] },
      { vertices: ["A", "A"], edges: [] },
      { vertices: ["A", "X"], edges: [] },
      { ...base, edges: [["A", "X", 1]] },
      { ...base, edges: [["A", "B", 21]] },
      { ...base, edges: [["A", "B", NaN]] },
      {
        ...base,
        edges: [
          ["A", "B", 1],
          ["A", "B", 2],
        ],
      },
      { ...base, edges: Array(19).fill(["A", "B", 1]) },
    ])
      expect(() => validateBellmanGraph(graph as BellmanGraph)).toThrow();
    expect(() => generateBellmanSteps(base, "X")).toThrow();
    expect(() => generateBellmanSteps(base, "A", "X")).toThrow();
  });
});
describe("Bellman learning integration", () => {
  it("registers six labs, six skills, twelve retrieval questions, and twelve seeded families", () => {
    expect(lessons["bellman-ford"].codingExercises).toHaveLength(6);
    expect(skills.filter((x) => x.topicId === "bellman-ford")).toHaveLength(6);
    expect(bellmanRetrievalQuestions).toHaveLength(12);
    const families = adaptiveFamilies.filter(
      (x) => x.topicId === "bellman-ford",
    );
    expect(families).toHaveLength(12);
    for (const family of families) {
      const contexts = new Set<string>();
      for (let seed = 0; seed < 40; seed++) {
        const item = generateAdaptiveInstance(family.id, 1, seed)!;
        expect(item.options).toHaveLength(3);
        expect(new Set(item.options.map((o) => o.text)).size).toBe(3);
        expect(item.explanation.length).toBeGreaterThan(20);
        contexts.add(item.context);
      }
      expect(contexts.size).toBeGreaterThan(1);
      expect(
        activities.find((a) => a.id === `adaptive-${family.id}`),
      ).toBeDefined();
    }
    expect(validateLearningCatalog()).toEqual([]);
  });
  it("runs trusted Python references on public and extra regression assertions", () => {
    const regressions: Record<string, string> = {
      "bellman-adjacency": `assert signed_adjacency(['A'], [('A','A',-20)]) == {'A':[('A',-20)]}`,
      "bellman-relax": `d={'A':0,'B':0};p={'A':None,'B':'A'};assert strict_relax(d,p,'B','A',0) is False and p['A'] is None`,
      "bellman-passes": `d,p,n=relaxation_passes(['A'], [], 'A');assert (d,p,n)==({'A':0},{'A':None},0)`,
      "bellman-detect": `assert relaxable_targets(['A'], [('A','A',-1)], {'A':0})=={'A'}`,
      "bellman-impact": `assert cycle_impact(['A','B'], [('A','B',1)], {'A'})=={'A','B'}`,
      "bellman-integrate": `r=bellman_paths(['A','B'], [('A','A',-1),('A','B',0)], 'A');assert r['A']==('unbounded',None,None) and r['B']==('unbounded',None,None)`,
    };
    for (const lab of bellmanCodingExercises) {
      expect(lab.tests.length).toBeGreaterThanOrEqual(2);
      for (const test of lab.tests) {
        const run = spawnSync("python3", ["-I", "-"], {
          input: `${bellmanSolutions[lab.id]}\n${test.code}\n`,
          encoding: "utf8",
          timeout: 3000,
        });
        expect(run.status, `${lab.id}/${test.id}: ${run.stderr}`).toBe(0);
      }
      const run = spawnSync("python3", ["-I", "-"], {
        input: `${bellmanSolutions[lab.id]}\n${regressions[lab.id]}\n`,
        encoding: "utf8",
        timeout: 3000,
      });
      expect(run.status, `${lab.id}: ${run.stderr}`).toBe(0);
      const starterFailures = lab.tests.map(
        (test) =>
          spawnSync("python3", ["-I", "-"], {
            input: `${lab.starter}\n${test.code}\n`,
            encoding: "utf8",
            timeout: 3000,
          }).status !== 0,
      );
      expect(
        starterFailures.some(Boolean),
        `starter ${lab.id} unexpectedly passed all public checks`,
      ).toBe(true);
    }
  }, 15000);
});
