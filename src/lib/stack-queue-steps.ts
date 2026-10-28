/** Pure snapshots for authored stack/queue operations. IDs are logical identities. */
export type StructureKind = "stack" | "queue";
export type StructureAction = "insert" | "remove" | "inspect" | "clear";
export type StructureOperation = { action: StructureAction; value?: string };
export type StructureNode = { id: string; value: string; next: string | null };
export type StructureStep = {
  nodes: StructureNode[];
  head: string | null;
  tail: string | null;
  order: string[];
  operation: string;
  result: string;
  explanation: string;
};
export type StructureScenario = {
  id: string;
  label: string;
  kind: StructureKind;
  operations: StructureOperation[];
};
export const MAX_OPERATIONS = 12;
export const MAX_NODES = 10;
export const MAX_VALUE_LENGTH = 12;
export const structureScenarios: StructureScenario[] = [
  {
    id: "stack-lifo",
    label: "Stack: last in, first out",
    kind: "stack",
    operations: [
      { action: "insert", value: "A" },
      { action: "insert", value: "B" },
      { action: "inspect" },
      { action: "remove" },
      { action: "remove" },
      { action: "remove" },
    ],
  },
  {
    id: "stack-repeat",
    label: "Stack: repeated values",
    kind: "stack",
    operations: [
      { action: "insert", value: "7" },
      { action: "insert", value: "7" },
      { action: "remove" },
      { action: "inspect" },
    ],
  },
  {
    id: "queue-fifo",
    label: "Queue: first in, first out",
    kind: "queue",
    operations: [
      { action: "insert", value: "A" },
      { action: "insert", value: "B" },
      { action: "inspect" },
      { action: "remove" },
      { action: "remove" },
      { action: "remove" },
    ],
  },
  {
    id: "queue-boundary",
    label: "Queue: empty and singleton references",
    kind: "queue",
    operations: [
      { action: "remove" },
      { action: "insert", value: "task" },
      { action: "remove" },
      { action: "insert", value: "next" },
      { action: "clear" },
    ],
  },
  {
    id: "queue-repeat",
    label: "Queue: repeated values",
    kind: "queue",
    operations: [
      { action: "insert", value: "7" },
      { action: "insert", value: "7" },
      { action: "remove" },
      { action: "inspect" },
    ],
  },
];

export function structureOrder(
  nodes: readonly StructureNode[],
  head: string | null,
): string[] {
  const byId = new Map(nodes.map((node) => [node.id, node]));
  if (byId.size !== nodes.length) throw new Error("Duplicate node identity");
  for (const node of nodes)
    if (node.next !== null && !byId.has(node.next))
      throw new Error("Dangling next reference");
  const order: string[] = [];
  let current = head;
  while (current !== null) {
    if (!byId.has(current)) throw new Error("Dangling head reference");
    if (order.includes(current)) throw new Error("Cycle detected");
    order.push(current);
    current = byId.get(current)!.next;
  }
  if (order.length !== nodes.length) throw new Error("Unreachable active node");
  return order;
}

export function generateStructureSteps(
  kind: StructureKind,
  operations: readonly StructureOperation[],
): StructureStep[] {
  if (kind !== "stack" && kind !== "queue")
    throw new Error("Unknown structure");
  if (operations.length > MAX_OPERATIONS)
    throw new Error("Too many operations");
  const nodes: StructureNode[] = [];
  let head: string | null = null;
  let tail: string | null = null;
  let serial = 0;
  const steps: StructureStep[] = [];
  const emit = (operation: string, result: string, explanation: string) => {
    const order = structureOrder(nodes, head);
    if ((order.at(-1) ?? null) !== tail)
      throw new Error("Dangling tail reference");
    steps.push({
      nodes: nodes.map((node) => ({ ...node })),
      head,
      tail,
      order,
      operation,
      result,
      explanation,
    });
  };
  emit(
    "Initial state",
    "None",
    kind === "stack"
      ? "top → null. The stack is empty."
      : "head → null and tail → null. The queue is empty.",
  );
  for (const item of operations) {
    if (!["insert", "remove", "inspect", "clear"].includes(item.action))
      throw new Error("Unknown operation");
    if (item.action === "insert") {
      if (
        typeof item.value !== "string" ||
        !item.value.trim() ||
        item.value.length > MAX_VALUE_LENGTH
      )
        throw new Error("Value must be 1–12 characters");
      if (nodes.length >= MAX_NODES) throw new Error("Structure is full");
      const node: StructureNode = {
        id: `n${serial++}`,
        value: item.value,
        next: null,
      };
      if (kind === "stack") {
        node.next = head;
        nodes.push(node);
        head = node.id;
        tail ??= node.id;
        emit(
          `Push ${node.value}`,
          "None",
          `Set ${node.id}.next to the old top, then top → ${node.id}. The newest node leaves first.`,
        );
      } else {
        const oldTail = tail;
        nodes.push(node);
        if (oldTail === null) head = node.id;
        else
          nodes.find((candidate) => candidate.id === oldTail)!.next = node.id;
        tail = node.id;
        emit(
          `Enqueue ${node.value}`,
          "None",
          oldTail === null
            ? `The empty queue gains ${node.id}; set both head and tail → ${node.id}.`
            : `Set ${oldTail}.next → ${node.id}, then tail → ${node.id}. Head stays ${head}.`,
        );
      }
    } else if (item.action === "remove") {
      const removed = nodes.find((node) => node.id === head);
      if (!removed) {
        emit(
          kind === "stack" ? "Pop empty stack" : "Dequeue empty queue",
          "None (underflow)",
          "The structure is empty. This player returns None and leaves both references null; a Python API may instead raise an exception if its contract says so.",
        );
      } else {
        head = removed.next;
        nodes.splice(nodes.indexOf(removed), 1);
        if (head === null) tail = null;
        emit(
          kind === "stack" ? "Pop" : "Dequeue",
          removed.value,
          kind === "stack"
            ? `Return ${removed.id}'s value ${removed.value}; top moves to ${head ?? "null"}.`
            : `Return ${removed.id}'s value ${removed.value}; head moves to ${head ?? "null"}${head === null ? " and tail also becomes null" : ` while tail stays ${tail}`}.`,
        );
      }
    } else if (item.action === "inspect") {
      if (kind === "stack") {
        const top = nodes.find((node) => node.id === head);
        emit(
          "Peek top",
          top?.value ?? "None (empty)",
          top
            ? `Read ${top.id} without removing it; top remains ${head}.`
            : "The stack is empty; peek returns None without changing state.",
        );
      } else {
        const front = nodes.find((node) => node.id === head);
        const rear = nodes.find((node) => node.id === tail);
        emit(
          "Inspect front and rear",
          front
            ? `front ${front.value}; rear ${rear!.value}`
            : "front None; rear None",
          front
            ? `Read ${front.id} and ${rear!.id} without removing either node.`
            : "The queue is empty; both references are null.",
        );
      }
    } else {
      nodes.length = 0;
      head = tail = null;
      emit(
        "Clear",
        "None",
        kind === "stack"
          ? "All nodes are removed; top → null."
          : "All nodes are removed; head → null and tail → null.",
      );
    }
  }
  return steps;
}
