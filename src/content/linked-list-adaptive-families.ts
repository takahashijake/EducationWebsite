import type { AdaptiveFamily } from "./adaptive-families";
type R = Parameters<AdaptiveFamily["generate"]>[0];
type Draft = ReturnType<AdaptiveFamily["generate"]>;
type Choice = Draft["choices"][number];
const right = (text: string): Choice => ({ text, correct: true });
const wrong = (text: string, misconception: string): Choice => ({
  text,
  misconception,
});
const family = (
  id: string,
  skillId: string,
  difficulty: "foundation" | "application",
  generate: (r: R) => Draft,
): AdaptiveFamily => ({
  id,
  skillId,
  difficulty,
  generate,
  revision: 1,
  topicId: "linked-lists",
  reviewHref: "/lessons/linked-lists",
});
const ids = ["A", "B", "C", "D", "E"];
const chain = (length: number, values: number[]) =>
  ids
    .slice(0, length)
    .map(
      (id, i) =>
        `${id}(${values[i]}) → ${i + 1 < length ? ids[i + 1] : "null"}`,
    )
    .join("; ");
export const linkedListAdaptiveFamilies: AdaptiveFamily[] = [
  family("linked-next-reference", "linked-traversal", "foundation", (r) => {
    const length = r.int(2, 5),
      values = ids.slice(0, length).map(() => r.int(1, 9)),
      at = r.int(0, length - 2);
    return {
      prompt: "Which node does current visit next?",
      context: `head → A; ${chain(length, values)}; current → ${ids[at]}.`,
      choices: [
        right(ids[at + 1]),
        wrong(
          ids[at],
          "Current advances through next; it does not stay on the same node.",
        ),
        wrong("null", "The current node has a non-null next reference."),
      ],
      explanation: `${ids[at]}.next points to ${ids[at + 1]}, regardless of value or drawing position.`,
      hints: ["Read current.next.", `Find the reference leaving ${ids[at]}.`],
      workedStep: `current = current.next changes ${ids[at]} to ${ids[at + 1]}.`,
    };
  }),
  family("linked-chain-termination", "linked-traversal", "application", (r) => {
    const length = r.int(1, 5),
      values = ids.slice(0, length).map(() => r.int(1, 9));
    return {
      prompt: "How many nodes are visited before current becomes null?",
      context: `head → A; ${chain(length, values)}.`,
      choices: [
        right(`${length} nodes`),
        wrong(
          `${length - 1} nodes`,
          "The final node is visited before its next reference becomes null.",
        ),
        wrong(
          `${length + 1} nodes`,
          "Null is the stopping reference, not an extra node.",
        ),
      ],
      explanation: `Following next from A visits ${ids.slice(0, length).join(", ")} once, then null.`,
      hints: [
        "Start at head and count each node once.",
        "Stop when current is null, after inspecting the tail.",
      ],
      workedStep: `${ids.slice(0, length).join(" → ")} → null gives ${length} visited nodes.`,
    };
  }),
  family(
    "linked-first-duplicate",
    "linked-node-identity",
    "application",
    (r) => {
      const value = r.int(1, 9),
        first = r.int(0, 1),
        length = r.int(3, 4);
      const values =
        length === 3
          ? [value + 1, value, value]
          : first
            ? [value, value + 1, value, value]
            : [value + 1, value, value, value + 2];
      const target = value;
      const correct = ids[values.indexOf(target)];
      const later = ids[values.lastIndexOf(target)];
      return {
        prompt: `Which node identity does search for ${target} return?`,
        context: `head → A; ${chain(values.length, values)}. Return the first match.`,
        choices: [
          right(correct),
          wrong(
            later,
            "Equal values do not share identity; search returns at the earliest match.",
          ),
          wrong("null", "A reachable node has the target value."),
        ],
        explanation: `The first reachable value ${target} belongs to ${correct}; ${later} is a later, distinct node.`,
        hints: [
          "Follow links from head.",
          "Stop immediately at the first equal value.",
        ],
        workedStep: `Search visits ${ids.slice(0, values.indexOf(target) + 1).join(" → ")} and returns ${correct}.`,
      };
    },
  ),
  family("linked-prepend-order", "linked-head-insertion", "foundation", (r) => {
    const length = r.int(1, 4),
      values = ids.slice(0, length).map(() => r.int(1, 9)),
      value = r.int(1, 9);
    return {
      prompt:
        "Which final reference chain preserves every old node after prepending X?",
      context: `head → A; ${chain(length, values)}; new X(${value}) starts detached.`,
      choices: [
        right(`head → X → ${ids.slice(0, length).join(" → ")} → null`),
        wrong(
          `head → X → null`,
          "This loses the old reachable chain because X.next was not set to old head.",
        ),
        wrong(
          `head → A → X → null`,
          "That appends or replaces later links; prepend must make X the head.",
        ),
      ],
      explanation: `Set X.next → A first, then head → X. All ${length} old nodes keep their identity and order.`,
      hints: [
        "Keep old head A reachable.",
        "Connect X.next to A before changing head.",
      ],
      workedStep: `X.next = A; head = X; the old chain ${ids.slice(0, length).join(" → ")} remains.`,
    };
  }),
  family("linked-empty-head", "linked-head-insertion", "application", (r) => {
    const value = r.int(-5, 9),
      operation = r.pick(["prepend", "append"] as const);
    return {
      prompt: `What is head after ${operation} on an empty list?`,
      context: `head → null; create X(${value}) with X.next → null.`,
      choices: [
        right("head → X; X.next → null"),
        wrong(
          "head → null; X remains detached",
          "The new node must become head when the original list is empty.",
        ),
        wrong(
          "head → X; X.next → X",
          "A self-link creates a cycle instead of a singleton list.",
        ),
      ],
      explanation: `An empty list has no existing node to link through; ${operation} returns X as head.`,
      hints: [
        "There is no old tail or head node.",
        "Set or return head as X; X.next stays null.",
      ],
      workedStep: `head changes from null to X(${value}); the list now has one node.`,
    };
  }),
  family("linked-delete-head", "linked-deletion", "foundation", (r) => {
    const length = r.int(1, 4),
      values = ids.slice(0, length).map(() => r.int(1, 9)),
      successor = length === 1 ? "null" : "B";
    return {
      prompt: "After deleting the matching head A, what must head reference?",
      context: `head → A; ${chain(length, values)}; target = ${values[0]}.`,
      choices: [
        right(successor),
        wrong(
          "A",
          "Returning the old head leaves the deleted node at the front.",
        ),
        wrong(
          "a fresh copy of A",
          "Deletion changes references; it does not copy the matched node.",
        ),
      ],
      explanation: `A is the first match. Set head → A.next, which is ${successor}; the rest remains reachable.`,
      hints: [
        "There is no previous node at the head.",
        "Use the old head's next reference as the new head.",
      ],
      workedStep: `new head = A.next = ${successor}.`,
    };
  }),
  family("linked-delete-middle", "linked-deletion", "application", (r) => {
    const length = r.int(3, 5),
      values = ids.slice(0, length).map(() => r.int(1, 9)),
      position = r.int(1, length - 2),
      target = values[position];
    values[0] = target + 10; // first match is at the chosen position
    for (let i = 1; i < position; i++) values[i] = target + 10 + i;
    const previous = ids[position - 1],
      current = ids[position],
      successor = ids[position + 1];
    return {
      prompt: `Which link update removes ${current} and preserves the suffix?`,
      context: `head → A; ${chain(length, values)}; previous → ${previous}; current → ${current}; delete first value ${target}.`,
      choices: [
        right(`${previous}.next → ${successor}`),
        wrong(
          `${previous}.next → null`,
          "That disconnects every node after the removed node.",
        ),
        wrong(
          `head → ${successor}`,
          "Changing head would also discard nodes before the match.",
        ),
      ],
      explanation: `Bypass ${current} with ${previous}.next = ${current}.next = ${successor}.`,
      hints: [
        "Keep the prefix through previous.",
        "Point previous.next at current.next.",
      ],
      workedStep: `${previous}.next changes from ${current} to ${successor}; ${current} detaches.`,
    };
  }),
  family("linked-lost-reference", "linked-aliasing", "application", (r) => {
    const length = r.int(2, 5),
      values = ids.slice(0, length).map(() => r.int(1, 9));
    return {
      prompt: "What does this incorrect assignment lose from head?",
      context: `head → A; ${chain(length, values)}; execute head = X where X.next → null, without setting X.next = old head.`,
      choices: [
        right(
          `The old chain A through ${ids[length - 1]} becomes unreachable from head`,
        ),
        wrong(
          "Only A's value changes",
          "The head reference moves to X; no node value was assigned.",
        ),
        wrong(
          "Nothing; assignment copies the old chain",
          "Reference assignment does not copy or reconnect the old nodes.",
        ),
      ],
      explanation: `X has no link to A, so the old chain is no longer reachable from the new head. Other aliases may still refer to it.`,
      hints: [
        "Follow next from the new head X.",
        "X.next is null, so no path reaches A.",
      ],
      workedStep: `head → X → null; A through ${ids[length - 1]} are outside this reachable chain.`,
    };
  }),
  family("linked-append-cost", "linked-complexity", "application", (r) => {
    const length = r.int(2, 13),
      hasTail = r.int(0, 1) === 1;
    return {
      prompt: "What is the append time under this reference contract?",
      context: `${length} nodes. ${hasTail ? "An up-to-date tail reference is maintained." : "Only a head reference is maintained."}`,
      choices: [
        hasTail
          ? right("O(1): use tail.next and update tail")
          : wrong(
              "O(1): use tail.next and update tail",
              "There is no tail reference; finding the tail requires a scan.",
            ),
        hasTail
          ? wrong(
              "O(n): scan from head to find the tail",
              "The maintained tail reference already identifies the last node.",
            )
          : right("O(n): scan from head to find the tail"),
        wrong(
          "O(n²): rebuild every existing node",
          "Append changes one link; no quadratic rebuilding is required.",
        ),
      ],
      explanation: hasTail
        ? "The valid tail reference avoids scanning; link and tail updates are constant time."
        : "With head alone, the last node must be found by following next links, taking linear time.",
      hints: [
        "Separate finding the tail from changing tail.next.",
        hasTail
          ? "The tail is already known."
          : "A head reference alone does not identify the tail.",
      ],
      workedStep: `${hasTail ? "Known tail → one link plus tail update" : `${length} nodes → traverse to last, then one link update`}.`,
    };
  }),
  family("linked-alias-change", "linked-aliasing", "foundation", (r) => {
    const value = r.int(1, 9),
      next = r.int(1, 9);
    return {
      prompt: "After changing alias.next, what chain is visible through head?",
      context: `head → A(${value}) → B(${next}) → null; alias = head; alias.next = None.`,
      choices: [
        right("A → null"),
        wrong(
          "A → B → null",
          "Alias and head refer to the same A; changing A.next is visible through both.",
        ),
        wrong(
          "A is copied, so head → B",
          "Assignment creates no new node and does not move head to B.",
        ),
      ],
      explanation:
        "alias and head both point to A. Setting A.next to None disconnects B from head.",
      hints: [
        "Does alias = head copy A?",
        "Both names refer to A; inspect A.next after assignment.",
      ],
      workedStep:
        "A.next changes from B to null, so traversal from head stops after A.",
    };
  }),
];
