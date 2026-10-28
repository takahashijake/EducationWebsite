import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import {
  buildTree,
  generateTreeSteps,
  treeHeight,
  treeMinimum,
  treeMaximum,
  treeStructure,
  validateTree,
  MAX_TREE_NODES,
  MAX_TREE_OPERATIONS,
  type Tree,
  type TreeTraversal,
} from "@/lib/tree-steps";
import { treeCodingExercises } from "@/content/tree-coding-exercises";
import { treeSolutions } from "@/content/tree-solutions";
import { treeRetrievalQuestions } from "@/content/tree-catalog";
import {
  adaptiveFamilies,
  generateAdaptiveInstance,
} from "@/content/adaptive-families";
import { activities, skills } from "@/content/learning-catalog";
import { validateLearningCatalog } from "@/content/learning-catalog-validation";
import { lessons } from "@/content/lessons";
import { topics } from "@/content/curriculum";
const python = (source: string, code: string) =>
  spawnSync("python3", ["-I", "-"], {
    input: `${source}\n${code}\n`,
    encoding: "utf8",
    timeout: 2000,
  });
const keys = (tree: Tree) => tree.nodes.map((n) => n.key).sort((a, b) => a - b);
const oracle = (tree: Tree, kind: TreeTraversal) => {
  const byId = new Map(tree.nodes.map((n) => [n.id, n]));
  const output: number[] = [];
  if (kind === "level-order") {
    const q = tree.rootId ? [tree.rootId] : [];
    for (let i = 0; i < q.length; i++) {
      const n = byId.get(q[i])!;
      output.push(n.key);
      if (n.left) q.push(n.left);
      if (n.right) q.push(n.right);
    }
  } else {
    const walk = (id: string | null) => {
      if (!id) return;
      const n = byId.get(id)!;
      if (kind === "preorder") output.push(n.key);
      walk(n.left);
      if (kind === "inorder") output.push(n.key);
      walk(n.right);
      if (kind === "postorder") output.push(n.key);
    };
    walk(tree.rootId);
  }
  return output;
};
const final = (tree: Tree, kind: "insert" | "search" | "delete", key: number) =>
  generateTreeSteps(tree, { kind, key }).at(-1)!;
describe("tree engine", () => {
  it("matches independent traversal oracles across varied insertion orders", () => {
    for (let seed = 0; seed < 60; seed++) {
      const input = Array.from(
        { length: seed % 12 },
        (_, i) => ((i * 7 + seed * 3) % 23) - 11,
      );
      const tree = buildTree(input);
      validateTree(tree);
      for (const kind of [
        "preorder",
        "inorder",
        "postorder",
        "level-order",
      ] as const) {
        const steps = generateTreeSteps(tree, { kind });
        expect(
          steps
            .filter((s) => s.action === "visit")
            .map(
              (s) =>
                s.activeId &&
                s.tree.nodes.find((n) => n.id === s.activeId)!.key,
            ),
        ).toEqual(oracle(tree, kind));
        expect(steps.at(-1)!.tree).toEqual(tree);
      }
      expect(oracle(tree, "inorder")).toEqual(keys(tree));
    }
  });
  it("handles empty, singleton, skewed, duplicate, and search paths", () => {
    const empty = buildTree([]);
    expect(treeHeight(empty)).toBe(-1);
    expect(treeMinimum(empty)).toBeNull();
    expect(treeMaximum(empty)).toBeNull();
    expect(treeStructure(empty)).toEqual({
      height: -1,
      size: 0,
      levels: [],
      leaves: [],
    });
    expect(final(empty, "search", 4).outcome).toContain("absent");
    const one = buildTree([4]);
    expect(treeHeight(one)).toBe(0);
    expect(final(one, "insert", 4).tree).toEqual(one);
    expect(final(one, "search", 4).outcome).toContain("Found");
    expect(final(one, "delete", 4).tree.rootId).toBeNull();
    const skewed = buildTree([1, 2, 3, 4, 5]);
    expect(treeHeight(skewed)).toBe(4);
    expect(treeMinimum(skewed)?.key).toBe(1);
    expect(treeMaximum(skewed)?.key).toBe(5);
    expect(final(skewed, "search", 5).path).toHaveLength(5);
    expect(final(skewed, "search", 6).path).toHaveLength(5);
    expect(treeStructure(buildTree([4, 2, 6, 1, 3, 5, 7])).height).toBe(2);
  });
  it("preserves identities through leaf, one-child, and successor deletion", () => {
    const tree = buildTree([8, 4, 12, 2, 6, 10, 14, 9, 11]);
    const before = new Map(tree.nodes.map((n) => [n.key, n.id]));
    const leaf = final(tree, "delete", 2).tree;
    expect(keys(leaf)).toEqual([4, 6, 8, 9, 10, 11, 12, 14]);
    expect(leaf.nodes.find((n) => n.key === 4)!.left).toBeNull();
    const one = final(buildTree([8, 4, 12, 10]), "delete", 12).tree;
    expect(one.nodes.find((n) => n.key === 8)!.right).toBe(
      one.nodes.find((n) => n.key === 10)!.id,
    );
    const steps = generateTreeSteps(tree, { kind: "delete", key: 8 });
    expect(
      steps
        .filter((s) => s.action === "compare")
        .map((s) => s.tree.nodes.find((n) => n.id === s.activeId)?.key),
    ).toEqual([8, 12, 10, 9]);
    const historical = JSON.stringify(steps[0]);
    expect(Object.isFrozen(steps[0])).toBe(true);
    expect(Object.isFrozen(steps[0].tree.nodes)).toBe(true);
    expect(Object.isFrozen(steps[0].tree.nodes[0])).toBe(true);
    expect(Object.isFrozen(steps[0].path)).toBe(true);
    const deleted = steps.at(-1)!.tree;
    expect(deleted.rootId).toBe(before.get(9));
    expect(deleted.nodes.find((n) => n.key === 10)!.left).toBeNull();
    for (const n of deleted.nodes) expect(n.id).toBe(before.get(n.key));
    expect(keys(deleted)).toEqual([2, 4, 6, 9, 10, 11, 12, 14]);
    expect(JSON.stringify(steps[0])).toBe(historical);
    expect(final(tree, "delete", 99).tree).toEqual(tree);
    const withSuccessorChild = buildTree([8, 4, 12, 10, 11]);
    const transplant = final(withSuccessorChild, "delete", 8).tree;
    expect(transplant.rootId).toBe(
      withSuccessorChild.nodes.find((n) => n.key === 10)!.id,
    );
    expect(transplant.nodes.find((n) => n.key === 12)!.left).toBe(
      withSuccessorChild.nodes.find((n) => n.key === 11)!.id,
    );
    const direct = final(buildTree([8, 4, 12]), "delete", 8).tree;
    expect(direct.rootId).toBe("n3");
    const next = final(deleted, "insert", 8).tree;
    expect(next.nodes.find((n) => n.key === 8)!.id).not.toBe(before.get(8));
  });
  it("relates comparison cost to height rather than node count alone", () => {
    const balanced = buildTree([4, 2, 6, 1, 3, 5, 7]);
    const skewed = buildTree([1, 2, 3, 4, 5, 6, 7]);
    expect(treeHeight(balanced)).toBe(2);
    expect(treeHeight(skewed)).toBe(6);
    expect(
      generateTreeSteps(balanced, { kind: "search", key: 7 }).filter(
        (s) => s.action === "compare",
      ),
    ).toHaveLength(3);
    expect(
      generateTreeSteps(skewed, { kind: "search", key: 7 }).filter(
        (s) => s.action === "compare",
      ),
    ).toHaveLength(7);
    const prose = lessons.trees
      .sections!.flatMap((section) => section.paragraphs)
      .join(" ");
    expect(prose).toContain("O(h)");
    expect(prose).toContain("O(log n)");
    expect(prose).toContain("O(n)");
  });
  it("rejects malformed references, keys, operations, and bounds", () => {
    expect(MAX_TREE_NODES).toBe(12);
    expect(MAX_TREE_OPERATIONS).toBe(16);
    expect(() => buildTree(Array(17).fill(1))).toThrow();
    expect(() => buildTree([1.5])).toThrow();
    expect(() => buildTree([1000])).toThrow();
    expect(() => buildTree(Array.from({ length: 13 }, (_, i) => i))).toThrow();
    const base = buildTree([8, 4, 12]);
    expect(() => final(base, "insert", NaN)).toThrow();
    expect(() =>
      validateTree({
        rootId: "n1",
        nodes: [{ id: "n1", key: 8, left: "n9", right: null }],
        nextId: 2,
      }),
    ).toThrow();
    expect(() =>
      validateTree({
        rootId: "n1",
        nodes: [{ id: "n1", key: 8, left: "n1", right: null }],
        nextId: 2,
      }),
    ).toThrow();
    expect(() =>
      validateTree({
        rootId: "n1",
        nodes: [
          { id: "n1", key: 8, left: "n2", right: "n2" },
          { id: "n2", key: 4, left: null, right: null },
        ],
        nextId: 3,
      }),
    ).toThrow();
    expect(() =>
      validateTree({
        rootId: "n1",
        nodes: [
          { id: "n1", key: 8, left: "n2", right: null },
          { id: "n2", key: 9, left: null, right: null },
        ],
        nextId: 3,
      }),
    ).toThrow();
    expect(() =>
      validateTree({
        rootId: "n1",
        nodes: [
          { id: "n1", key: 8, left: null, right: null },
          { id: "n1", key: 8, left: null, right: null },
        ],
        nextId: 2,
      }),
    ).toThrow();
  });
});
describe("tree learning integration", () => {
  it("publishes complete content and deterministic focused adaptive practice", () => {
    expect(topics.find((t) => t.id === "trees")?.status).toBe("available");
    expect(lessons.trees.codingExercises).toHaveLength(6);
    expect(skills.filter((s) => s.topicId === "trees")).toHaveLength(6);
    expect(treeRetrievalQuestions).toHaveLength(12);
    const families = adaptiveFamilies.filter((f) => f.topicId === "trees");
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
        expect(instance.reviewHref).toBe("/lessons/trees");
        contexts.add(instance.context);
      }
      expect(contexts.size).toBeGreaterThan(1);
      expect(
        activities.filter((a) => a.id === `adaptive-${family.id}`),
      ).toHaveLength(1);
    }
    expect(validateLearningCatalog()).toEqual([]);
  });
  it("runs authored Python references and detects defective starters", () => {
    for (const exercise of treeCodingExercises) {
      expect(exercise.referenceSolution).toBe(treeSolutions[exercise.id]);
      let failed = 0;
      for (const check of exercise.tests) {
        const good = python(exercise.referenceSolution!, check.code);
        expect(good.status, `${exercise.id}/${check.id}: ${good.stderr}`).toBe(
          0,
        );
        if (python(exercise.starter, check.code).status !== 0) failed++;
      }
      expect(failed, exercise.id).toBeGreaterThan(0);
    }
  }, 15000);
});
