/** Authored singly linked-list operations. IDs denote logical identity, never heap addresses. */
export type NodeId = string;
export type LinkedNode = { id: NodeId; value: number; next: NodeId | null };
export type LinkedOperation =
  "traverse" | "search" | "prepend" | "append" | "delete";
export type LinkedScenario = {
  id: string;
  label: string;
  values: number[];
  operation: LinkedOperation;
  target?: number;
};
export type LinkedStep = {
  nodes: LinkedNode[];
  head: NodeId | null;
  current: NodeId | null;
  previous: NodeId | null;
  reachable: NodeId[];
  detached: NodeId[];
  operation: string;
  explanation: string;
};
export const linkedScenarios: LinkedScenario[] = [
  {
    id: "empty-traverse",
    label: "Traverse an empty list",
    values: [],
    operation: "traverse",
  },
  {
    id: "singleton-traverse",
    label: "Traverse a singleton",
    values: [7],
    operation: "traverse",
  },
  {
    id: "duplicates-traverse",
    label: "Traverse duplicate values",
    values: [7, 4, 7],
    operation: "traverse",
  },
  {
    id: "search-found",
    label: "Search: first duplicate",
    values: [4, 7, 7, 2],
    operation: "search",
    target: 7,
  },
  {
    id: "search-missing",
    label: "Search: absent value",
    values: [4, 7, 2],
    operation: "search",
    target: 9,
  },
  {
    id: "prepend-empty",
    label: "Prepend to empty list",
    values: [],
    operation: "prepend",
    target: 5,
  },
  {
    id: "prepend-many",
    label: "Prepend and preserve chain",
    values: [4, 7, 2],
    operation: "prepend",
    target: 5,
  },
  {
    id: "append-empty",
    label: "Append to empty list",
    values: [],
    operation: "append",
    target: 5,
  },
  {
    id: "append-many",
    label: "Append after traversal",
    values: [4, 7, 2],
    operation: "append",
    target: 5,
  },
  {
    id: "delete-empty",
    label: "Delete from empty list",
    values: [],
    operation: "delete",
    target: 7,
  },
  {
    id: "delete-singleton",
    label: "Delete singleton head",
    values: [7],
    operation: "delete",
    target: 7,
  },
  {
    id: "delete-head",
    label: "Delete head, preserve tail",
    values: [7, 4, 2],
    operation: "delete",
    target: 7,
  },
  {
    id: "delete-middle",
    label: "Delete first middle duplicate",
    values: [4, 7, 7, 2],
    operation: "delete",
    target: 7,
  },
  {
    id: "delete-tail",
    label: "Delete tail",
    values: [4, 2, 7],
    operation: "delete",
    target: 7,
  },
  {
    id: "delete-missing",
    label: "Delete absent value",
    values: [4, 7, 2],
    operation: "delete",
    target: 9,
  },
];

/** Returns IDs in link order, rejecting broken references and cycles. */
export function linkedReachability(
  nodes: readonly LinkedNode[],
  head: NodeId | null,
): NodeId[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  if (byId.size !== nodes.length) throw new Error("Duplicate node ID");
  for (const node of nodes)
    if (node.next !== null && !byId.has(node.next))
      throw new Error("Dangling next reference");
  const result: NodeId[] = [];
  const seen = new Set<NodeId>();
  let pointer = head;
  while (pointer !== null) {
    if (!byId.has(pointer)) throw new Error("Dangling head reference");
    if (seen.has(pointer)) throw new Error("Cycle detected");
    seen.add(pointer);
    result.push(pointer);
    pointer = byId.get(pointer)!.next;
  }
  return result;
}

/** Pure, bounded snapshots; visual order is derived from next links. */
export function generateLinkedSteps(scenario: LinkedScenario): LinkedStep[] {
  if (
    scenario.values.length > 12 ||
    scenario.values.some((value) => !Number.isSafeInteger(value)) ||
    ((scenario.operation === "search" ||
      scenario.operation === "delete" ||
      scenario.operation === "prepend" ||
      scenario.operation === "append") &&
      !Number.isSafeInteger(scenario.target))
  )
    throw new Error(
      "Linked-list input must contain at most 12 safe integers and a valid target",
    );
  const nodes: LinkedNode[] = scenario.values.map((value, index) => ({
    id: `n${index}`,
    value,
    next: index + 1 < scenario.values.length ? `n${index + 1}` : null,
  }));
  let head: NodeId | null = nodes[0]?.id ?? null;
  let current: NodeId | null = null;
  let previous: NodeId | null = null;
  const steps: LinkedStep[] = [];
  const node = (id: NodeId) => nodes.find((item) => item.id === id)!;
  const emit = (operation: string, explanation: string) => {
    const reachable = linkedReachability(nodes, head);
    steps.push({
      nodes: nodes.map((item) => ({ ...item })),
      head,
      current,
      previous,
      reachable,
      detached: nodes
        .filter((item) => !reachable.includes(item.id))
        .map((item) => item.id),
      operation,
      explanation,
    });
  };
  emit(
    "Initial references",
    `head → ${head ?? "null"}. Nodes are logical identities, not memory addresses.`,
  );
  if (scenario.operation === "prepend") {
    nodes.push({ id: "new", value: scenario.target!, next: null });
    emit(
      "Create detached node",
      `Create new node new with value ${scenario.target}; new.next → null. The old chain remains reachable from head.`,
    );
    node("new").next = head;
    emit(
      "Link new node",
      `Set new.next → ${head ?? "null"} before changing head. This preserves the old chain.`,
    );
    head = "new";
    emit(
      "Update head",
      "Set head → new. The new node and every former reachable node are now reachable.",
    );
  } else if (scenario.operation === "append") {
    nodes.push({ id: "new", value: scenario.target!, next: null });
    emit(
      "Create detached node",
      `Create new node new with value ${scenario.target}; new.next → null.`,
    );
    if (head === null) {
      head = "new";
      emit("Update empty head", "The list was empty; set head → new.");
    } else {
      current = head;
      emit(
        "Start tail search",
        `Set current → ${current}. Follow next links to find the tail.`,
      );
      while (node(current!).next !== null) {
        previous = current;
        current = node(current!).next;
        emit(
          "Follow next",
          `Set previous → ${previous}; current → ${current}.`,
        );
      }
      node(current!).next = "new";
      emit(
        "Link tail",
        `Set ${current}.next → new. The old chain remains intact.`,
      );
    }
  } else {
    current = head;
    emit(
      "Start traversal",
      `Set current → ${current ?? "null"}. An empty head needs no dereference.`,
    );
    while (current !== null) {
      const found = node(current!).value === scenario.target;
      emit(
        "Inspect node",
        `Inspect ${current} (value ${node(current!).value})${scenario.operation === "traverse" ? "." : found ? `; first match for ${scenario.target}.` : `; not ${scenario.target}.`}`,
      );
      if (found && scenario.operation === "search") {
        emit(
          "Found first match",
          `Return reference ${current}; its identity is distinct from every other node with value ${scenario.target}.`,
        );
        return steps;
      }
      if (found && scenario.operation === "delete") {
        const successor = node(current!).next;
        if (previous === null) {
          head = successor;
          emit(
            "Reassign head",
            `Set head → ${successor ?? "null"}; ${current} is now detached. The remaining chain stays reachable.`,
          );
        } else {
          node(previous).next = successor;
          emit(
            "Bypass matched node",
            `Set ${previous}.next → ${successor ?? "null"}; ${current} is detached. Delete only this first match.`,
          );
        }
        return steps;
      }
      previous = current;
      current = node(current!).next;
      emit(
        "Follow next",
        `Set previous → ${previous}; current → ${current ?? "null"}.`,
      );
    }
    emit(
      scenario.operation === "traverse" ? "Traversal complete" : "No match",
      "current is null: traversal terminates. No reachable node was deleted.",
    );
  }
  return steps;
}
