/** Bounded, deterministic BST steps. Height counts edges: empty = -1, leaf = 0. */
export const MAX_TREE_NODES = 12;
export const MAX_TREE_OPERATIONS = 16;
export const MAX_TREE_STEPS = 128;
export const MIN_TREE_KEY = -999;
export const MAX_TREE_KEY = 999;
export type TreeNode = {
  id: string;
  key: number;
  left: string | null;
  right: string | null;
};
export type Tree = { rootId: string | null; nodes: TreeNode[]; nextId: number };
export type TreeTraversal =
  "preorder" | "inorder" | "postorder" | "level-order";
export type TreeOperation =
  | { kind: "insert" | "search" | "delete"; key: number }
  | { kind: TreeTraversal };
export type TreeAction =
  | "initial"
  | "compare"
  | "visit"
  | "descend"
  | "found"
  | "absent"
  | "duplicate"
  | "insert"
  | "successor"
  | "remove"
  | "complete";
export type TreeStep = {
  tree: Tree;
  action: TreeAction;
  activeId: string | null;
  path: string[];
  visited: string[];
  frames: string[];
  queue: string[];
  comparison: string;
  narration: string;
  invariant: string;
  outcome: string | null;
};
const invariant =
  "All keys in each left subtree are smaller; all keys in each right subtree are larger. Node IDs track identity, not positions.";
const validKey = (key: number) =>
  Number.isSafeInteger(key) && key >= MIN_TREE_KEY && key <= MAX_TREE_KEY;
const copy = (tree: Tree): Tree => ({
  rootId: tree.rootId,
  nodes: tree.nodes.map((n) => ({ ...n })),
  nextId: tree.nextId,
});
export function validateTree(tree: Tree, requireBst = true): void {
  if (
    !tree ||
    !Array.isArray(tree.nodes) ||
    tree.nodes.length > MAX_TREE_NODES ||
    !(tree.rootId === null || typeof tree.rootId === "string")
  )
    throw new Error("Malformed or oversized tree.");
  const ids = new Set<string>();
  for (const node of tree.nodes) {
    if (
      !node ||
      typeof node.id !== "string" ||
      !/^n[1-9]\d*$/.test(node.id) ||
      !Number.isSafeInteger(Number(node.id.slice(1))) ||
      ids.has(node.id) ||
      !validKey(node.key) ||
      !(node.left === null || typeof node.left === "string") ||
      !(node.right === null || typeof node.right === "string")
    )
      throw new Error("Invalid node, key, or repeated ID.");
    ids.add(node.id);
  }
  if (
    (tree.rootId === null) !== (tree.nodes.length === 0) ||
    (tree.rootId !== null && !ids.has(tree.rootId))
  )
    throw new Error("Invalid root reference.");
  if (
    !Number.isSafeInteger(tree.nextId) ||
    tree.nextId < 1 ||
    tree.nodes.some((n) => Number(n.id.slice(1)) >= tree.nextId)
  )
    throw new Error("Invalid next node ID.");
  const byId = new Map(tree.nodes.map((n) => [n.id, n]));
  const parents = new Set<string>();
  for (const node of tree.nodes)
    for (const child of [node.left, node.right])
      if (child !== null) {
        if (!byId.has(child)) throw new Error("Dangling child reference.");
        if (parents.has(child)) throw new Error("Shared child reference.");
        parents.add(child);
      }
  const seen = new Set<string>();
  const keys = new Set<number>();
  function walk(id: string | null, min: number, max: number): void {
    if (id === null) return;
    if (seen.has(id)) throw new Error("Cycle in tree.");
    seen.add(id);
    const node = byId.get(id)!;
    if (
      requireBst &&
      (node.key <= min || node.key >= max || keys.has(node.key))
    )
      throw new Error("BST ordering invariant violated.");
    keys.add(node.key);
    walk(node.left, min, node.key);
    walk(node.right, node.key, max);
  }
  walk(tree.rootId, -Infinity, Infinity);
  if (seen.size !== tree.nodes.length)
    throw new Error("Unreachable node or cycle.");
}
export function treeMinimum(tree: Tree): TreeNode | null {
  validateTree(tree);
  const byId = new Map(tree.nodes.map((n) => [n.id, n]));
  let id = tree.rootId;
  if (id === null) return null;
  while (byId.get(id)!.left) id = byId.get(id)!.left!;
  return { ...byId.get(id)! };
}
export function treeMaximum(tree: Tree): TreeNode | null {
  validateTree(tree);
  const byId = new Map(tree.nodes.map((n) => [n.id, n]));
  let id = tree.rootId;
  if (id === null) return null;
  while (byId.get(id)!.right) id = byId.get(id)!.right!;
  return { ...byId.get(id)! };
}
export function treeHeight(tree: Tree): number {
  validateTree(tree);
  const byId = new Map(tree.nodes.map((n) => [n.id, n]));
  const h = (id: string | null): number =>
    id === null
      ? -1
      : 1 + Math.max(h(byId.get(id)!.left), h(byId.get(id)!.right));
  return h(tree.rootId);
}
export function treeStructure(tree: Tree) {
  validateTree(tree);
  const byId = new Map(tree.nodes.map((n) => [n.id, n]));
  const levels: string[][] = [];
  const queue: Array<[string, number]> = tree.rootId ? [[tree.rootId, 0]] : [];
  for (let i = 0; i < queue.length; i++) {
    const [id, depth] = queue[i],
      node = byId.get(id)!;
    (levels[depth] ??= []).push(id);
    if (node.left) queue.push([node.left, depth + 1]);
    if (node.right) queue.push([node.right, depth + 1]);
  }
  return {
    height: levels.length - 1,
    size: tree.nodes.length,
    levels,
    leaves: tree.nodes.filter((n) => !n.left && !n.right).map((n) => n.id),
  };
}
export function buildTree(keys: number[]): Tree {
  if (
    !Array.isArray(keys) ||
    keys.length > MAX_TREE_OPERATIONS ||
    keys.some((key) => !validKey(key))
  )
    throw new Error("Enter at most 16 bounded integer keys.");
  let tree: Tree = { rootId: null, nodes: [], nextId: 1 };
  for (const key of keys)
    tree = generateTreeSteps(tree, { kind: "insert", key }).at(-1)!.tree;
  return tree;
}
export function generateTreeSteps(
  input: Tree,
  operation: TreeOperation,
): TreeStep[] {
  validateTree(input);
  if (
    !operation ||
    typeof operation !== "object" ||
    ![
      "insert",
      "search",
      "delete",
      "preorder",
      "inorder",
      "postorder",
      "level-order",
    ].includes(operation.kind)
  )
    throw new Error("Unknown tree operation.");
  if (
    ["insert", "search", "delete"].includes(operation.kind) &&
    (!("key" in operation) || !validKey(operation.key))
  )
    throw new Error("Key must be an integer from -999 to 999.");
  if (
    ["preorder", "inorder", "postorder", "level-order"].includes(
      operation.kind,
    ) &&
    "key" in operation
  )
    throw new Error("Traversal does not take a key.");
  const tree = copy(input),
    byId = () => new Map(tree.nodes.map((n) => [n.id, n]));
  const path: string[] = [],
    visited: string[] = [],
    frames: string[] = [],
    queue: string[] = [];
  let activeId: string | null = null,
    comparison = "None",
    outcome: string | null = null;
  const steps: TreeStep[] = [];
  const emit = (action: TreeAction, narration: string) => {
    if (steps.length >= MAX_TREE_STEPS) throw new Error("Too many tree steps.");
    const snapshotTree = copy(tree);
    snapshotTree.nodes.forEach(Object.freeze);
    Object.freeze(snapshotTree.nodes);
    Object.freeze(snapshotTree);
    const pathSnapshot = Object.freeze([...path]) as unknown as string[];
    const visitedSnapshot = Object.freeze([...visited]) as unknown as string[];
    const framesSnapshot = Object.freeze([...frames]) as unknown as string[];
    const queueSnapshot = Object.freeze([...queue]) as unknown as string[];
    steps.push(
      Object.freeze({
        tree: snapshotTree,
        action,
        activeId,
        path: pathSnapshot,
        visited: visitedSnapshot,
        frames: framesSnapshot,
        queue: queueSnapshot,
        comparison,
        narration,
        invariant,
        outcome,
      }),
    );
  };
  emit("initial", tree.rootId ? "Start at the root." : "The tree is empty.");
  if (operation.kind === "level-order") {
    if (tree.rootId) queue.push(tree.rootId);
    while (queue.length) {
      const id = queue.shift()!,
        node = byId().get(id)!;
      activeId = id;
      visited.push(id);
      comparison = `Visit ${node.key} from the FIFO queue.`;
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
      emit(
        "visit",
        `Visit ${node.key}; enqueue its left child, then right child.`,
      );
    }
    outcome = visited.map((id) => byId().get(id)!.key).join(" → ") || "empty";
  } else if (["preorder", "inorder", "postorder"].includes(operation.kind)) {
    const mode = operation.kind;
    const walk = (id: string | null) => {
      if (id === null) return;
      const node = byId().get(id)!;
      frames.push(id);
      activeId = id;
      comparison = `Enter recursive frame for ${node.key}.`;
      emit(
        "descend",
        `Enter ${node.key}; the call stack remembers this frame.`,
      );
      const visit = () => {
        activeId = id;
        visited.push(id);
        comparison = `Visit ${node.key}.`;
        emit("visit", `Visit ${node.key} in ${mode} order.`);
      };
      if (mode === "preorder") visit();
      walk(node.left);
      if (mode === "inorder") visit();
      walk(node.right);
      if (mode === "postorder") visit();
      frames.pop();
    };
    walk(tree.rootId);
    outcome = visited.map((id) => byId().get(id)!.key).join(" → ") || "empty";
  } else {
    const key = "key" in operation ? operation.key : NaN;
    let parent: TreeNode | null = null,
      side: "left" | "right" | null = null,
      id = tree.rootId;
    while (id !== null) {
      const node: TreeNode = byId().get(id)!;
      activeId = id;
      path.push(id);
      comparison = `${key} ${key < node.key ? "<" : key > node.key ? ">" : "="} ${node.key}`;
      emit(
        "compare",
        `Compare ${key} with ${node.key}. ${key < node.key ? "Follow left." : key > node.key ? "Follow right." : "Keys match."}`,
      );
      if (key === node.key) {
        if (operation.kind === "insert") {
          outcome = `Duplicate ${key}: no change.`;
          emit("duplicate", outcome);
        } else if (operation.kind === "search") {
          outcome = `Found ${key} at ${id}.`;
          emit("found", outcome);
        } else {
          const replace = (
            oldId: string,
            newId: string | null,
            p: TreeNode | null,
            s: "left" | "right" | null,
          ) => {
            if (p && s) p[s] = newId;
            else tree.rootId = newId;
          };
          if (!node.left || !node.right) {
            const child = node.left ?? node.right;
            replace(id, child, parent, side);
            tree.nodes = tree.nodes.filter((n) => n.id !== id);
            outcome = child
              ? `Removed ${key}; child ${byId().get(child)!.key} takes its place.`
              : `Removed leaf ${key}.`;
            emit("remove", outcome);
          } else {
            let successorParent = node,
              successorId = node.right;
            while (true) {
              const candidate = byId().get(successorId)!;
              activeId = successorId;
              path.push(successorId);
              comparison = candidate.left
                ? `Successor candidate ${candidate.key} has a left child.`
                : `Successor candidate ${candidate.key} has no left child.`;
              emit(
                "compare",
                candidate.left
                  ? `Inspect ${candidate.key}; descend left to find the right subtree's minimum.`
                  : `Inspect ${candidate.key}; it is the minimum of the right subtree.`,
              );
              if (!candidate.left) break;
              successorParent = candidate;
              successorId = candidate.left;
            }
            const successor = byId().get(successorId)!;
            activeId = successorId;
            comparison = `Successor ${successor.key} is the minimum of the right subtree.`;
            emit(
              "successor",
              `Find successor ${successor.key}. Its node identity ${successor.id} will move; no key is copied into ${id}.`,
            );
            if (successorParent.id !== node.id) {
              successorParent.left = successor.right;
              successor.right = node.right;
            }
            successor.left = node.left;
            replace(id, successor.id, parent, side);
            tree.nodes = tree.nodes.filter((n) => n.id !== id);
            outcome = `Removed ${key}; transplanted successor ${successor.key} (${successor.id}) into its position.`;
            emit("remove", outcome);
          }
        }
        break;
      }
      parent = node;
      side = key < node.key ? "left" : "right";
      id = node[side];
    }
    if (id === null) {
      if (operation.kind === "insert") {
        if (tree.nodes.length >= MAX_TREE_NODES)
          throw new Error("Tree is limited to 12 active nodes.");
        const next = tree.nextId;
        tree.nextId = next + 1;
        const node: TreeNode = { id: `n${next}`, key, left: null, right: null };
        tree.nodes.push(node);
        if (parent && side) parent[side] = node.id;
        else tree.rootId = node.id;
        activeId = node.id;
        path.push(node.id);
        comparison = `Insert ${key} at the empty child reference.`;
        outcome = `Inserted ${key} as ${node.id}.`;
        emit("insert", outcome);
      } else {
        activeId = null;
        outcome = `${key} is absent.`;
        emit("absent", outcome);
      }
    }
  }
  validateTree(tree);
  activeId = null;
  emit("complete", outcome ?? "Traversal complete.");
  return steps;
}
export const treeScenarios: {
  id: string;
  label: string;
  keys: number[];
  suggested: TreeOperation;
}[] = [
  {
    id: "empty",
    label: "Empty",
    keys: [],
    suggested: { kind: "insert", key: 8 },
  },
  {
    id: "singleton",
    label: "Singleton",
    keys: [8],
    suggested: { kind: "delete", key: 8 },
  },
  {
    id: "balanced",
    label: "Balanced shape",
    keys: [8, 4, 12, 2, 6, 10, 14],
    suggested: { kind: "inorder" },
  },
  {
    id: "skewed",
    label: "Skewed shape",
    keys: [2, 4, 6, 8, 10],
    suggested: { kind: "search", key: 10 },
  },
  {
    id: "duplicate",
    label: "Duplicate insertion",
    keys: [8, 4, 12],
    suggested: { kind: "insert", key: 4 },
  },
  {
    id: "leaf",
    label: "Delete a leaf",
    keys: [8, 4, 12, 2],
    suggested: { kind: "delete", key: 2 },
  },
  {
    id: "one-child",
    label: "Delete one child",
    keys: [8, 4, 12, 10],
    suggested: { kind: "delete", key: 12 },
  },
  {
    id: "two-children",
    label: "Delete two children",
    keys: [8, 4, 12, 2, 6, 10, 14, 9, 11],
    suggested: { kind: "delete", key: 8 },
  },
];
