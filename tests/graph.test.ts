import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  generateGraphSteps,
  graphAdjacency,
  graphPath,
  graphScenarios,
  MAX_GRAPH_EDGES,
  MAX_GRAPH_VERTICES,
  type Graph,
} from "@/lib/graph-steps";
import { graphCodingExercises } from "@/content/graph-coding-exercises";
import { graphSolutions } from "@/content/graph-solutions";
import { graphRetrievalQuestions } from "@/content/graph-catalog";
import {
  adaptiveFamilies,
  generateAdaptiveInstance,
} from "@/content/adaptive-families";
import { activities, skills } from "@/content/learning-catalog";
import { validateLearningCatalog } from "@/content/learning-catalog-validation";
import { lessons } from "@/content/lessons";
import { topics } from "@/content/curriculum";

const python = (source: string, check: string) =>
  spawnSync("python3", ["-I", "-"], {
    input: `${source}\n${check}\n`,
    encoding: "utf8",
    timeout: 2000,
  });
const reference = (graph: Graph, start: string, algorithm: "bfs" | "dfs") => {
  const adjacency = graphAdjacency(graph);
  const seen = new Set([start]),
    order = [start],
    parent: Record<string, string | null> = { [start]: null },
    distance: Record<string, number> = { [start]: 0 };
  if (algorithm === "bfs") {
    const queue = [start];
    for (let i = 0; i < queue.length; i++)
      for (const neighbor of adjacency[queue[i]])
        if (!seen.has(neighbor)) {
          seen.add(neighbor);
          queue.push(neighbor);
          order.push(neighbor);
          parent[neighbor] = queue[i];
          distance[neighbor] = distance[queue[i]] + 1;
        }
  } else {
    const visit = (vertex: string) => {
      for (const neighbor of adjacency[vertex])
        if (!seen.has(neighbor)) {
          seen.add(neighbor);
          order.push(neighbor);
          parent[neighbor] = vertex;
          visit(neighbor);
        }
    };
    visit(start);
  }
  return { order, parent, distance };
};

describe("graph traversal engine", () => {
  it("matches independent BFS and recursive DFS oracles on seeded small graphs", () => {
    for (let seed = 0; seed < 80; seed++) {
      const vertices = ["A", "B", "C", "D", "E"].slice(0, 1 + (seed % 5));
      const directed = seed % 2 === 0;
      const edges: [string, string][] = [];
      for (let a = 0; a < vertices.length; a++)
        for (let b = 0; b < vertices.length; b++)
          if ((seed * 7 + a * 11 + b * 13) % 7 < 2 && (directed || a <= b))
            edges.push([vertices[a], vertices[b]]);
      const graph = { vertices, edges, directed };
      for (const algorithm of ["bfs", "dfs"] as const) {
        const actual = generateGraphSteps(graph, algorithm, "A");
        const expected = reference(graph, "A", algorithm);
        expect(actual.at(-1)!.order).toEqual(expected.order);
        expect(actual.at(-1)!.parents).toEqual(expected.parent);
        if (algorithm === "bfs")
          expect(actual.at(-1)!.distances).toEqual(expected.distance);
        for (const step of actual) {
          expect(new Set(step.discovered).size).toBe(step.discovered.length);
          expect(step.frontier.every((v) => step.discovered.includes(v))).toBe(
            true,
          );
          expect(step.finished.every((v) => step.discovered.includes(v))).toBe(
            true,
          );
          if (algorithm === "bfs")
            expect(step.frontier.map((v) => step.distances[v])).toEqual(
              [...step.frontier.map((v) => step.distances[v])].sort(
                (a, b) => a - b,
              ),
            );
        }
      }
    }
  });
  it("handles scenarios, shortest ties, and historical snapshots", () => {
    for (const scenario of graphScenarios)
      for (const algorithm of ["bfs", "dfs"] as const) {
        const steps = generateGraphSteps(
          scenario.graph,
          algorithm,
          scenario.graph.vertices[0],
        );
        expect(steps[0].phase).toBe("initial");
        expect(steps.at(-1)!.phase).toBe("complete");
        const before = JSON.stringify(steps[1]);
        steps.at(-1)!.order.push("sentinel");
        expect(JSON.stringify(steps[1])).toBe(before);
      }
    const routes = graphScenarios.find((s) => s.id === "routes")!.graph;
    const final = generateGraphSteps(routes, "bfs", "A", "D").at(-1)!;
    expect(graphPath(final, "A", "D")).toEqual(["A", "B", "D"]);
    expect(final.distances.D).toBe(2);
    const disconnected = graphScenarios.find(
      (s) => s.id === "disconnected",
    )!.graph;
    expect(
      graphPath(
        generateGraphSteps(disconnected, "bfs", "A", "E").at(-1)!,
        "A",
        "E",
      ),
    ).toBeNull();
    expect(
      generateGraphSteps(
        { vertices: ["A"], edges: [["A", "A"]], directed: true },
        "dfs",
        "A",
      ).at(-1)!.order,
    ).toEqual(["A"]);
  });
  it("rejects malformed or oversized graphs", () => {
    const valid: Graph = {
      vertices: ["A", "B"],
      edges: [["A", "B"]],
      directed: false,
    };
    expect(() => graphAdjacency({ ...valid, vertices: [] })).toThrow();
    expect(() => graphAdjacency({ ...valid, vertices: ["A", "A"] })).toThrow();
    expect(() => graphAdjacency({ ...valid, edges: [["A", "X"]] })).toThrow();
    expect(() =>
      graphAdjacency({
        ...valid,
        edges: [
          ["A", "B"],
          ["B", "A"],
        ],
      }),
    ).toThrow();
    expect(() =>
      graphAdjacency({ ...valid, vertices: "ABCDEFGHIJ".split("") }),
    ).toThrow();
    expect(() =>
      graphAdjacency({
        ...valid,
        edges: Array(MAX_GRAPH_EDGES + 1).fill(["A", "B"]),
      }),
    ).toThrow();
    expect(MAX_GRAPH_VERTICES).toBe(9);
    expect(() => generateGraphSteps(valid, "bfs", "X")).toThrow();
    expect(() => generateGraphSteps(valid, "bfs", "A", "X")).toThrow();
  });
});

describe("graph learning integration", () => {
  it("registers the complete published lesson and deterministic adaptive coverage", () => {
    expect(topics.find((t) => t.id === "graphs")?.status).toBe("available");
    expect(lessons.graphs.codingExercises).toHaveLength(6);
    expect(skills.filter((s) => s.topicId === "graphs")).toHaveLength(6);
    expect(graphRetrievalQuestions).toHaveLength(12);
    const families = adaptiveFamilies.filter((f) => f.topicId === "graphs");
    expect(families).toHaveLength(12);
    for (const family of families) {
      const contexts = new Set<string>();
      for (let seed = 0; seed < 30; seed++) {
        const instance = generateAdaptiveInstance(family.id, 1, seed)!;
        expect(instance).toEqual(generateAdaptiveInstance(family.id, 1, seed));
        expect(new Set(instance.options.map((o) => o.text)).size).toBe(3);
        expect(
          instance.options[instance.correctIndex].misconception,
        ).toBeUndefined();
        expect(instance.reviewHref).toBe("/lessons/graphs");
        contexts.add(instance.context);
      }
      expect(contexts.size).toBeGreaterThan(1);
      expect(
        activities.filter((a) => a.id === `adaptive-${family.id}`),
      ).toHaveLength(1);
    }
    expect(validateLearningCatalog()).toEqual([]);
  });
  it("runs each Python reference against public checks and detects defective starters", () => {
    for (const exercise of graphCodingExercises) {
      expect(exercise.referenceSolution).toBe(graphSolutions[exercise.id]);
      let failed = 0;
      for (const test of exercise.tests) {
        const result = python(exercise.referenceSolution!, test.code);
        expect(
          result.status,
          `${exercise.id}/${test.id}: ${result.stderr}`,
        ).toBe(0);
        if (python(exercise.starter, test.code).status !== 0) failed++;
      }
      expect(failed, exercise.id).toBeGreaterThan(0);
    }
  }, 15000);
});
