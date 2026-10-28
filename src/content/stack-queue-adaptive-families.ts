import type { AdaptiveFamily } from "./adaptive-families";
type R = Parameters<AdaptiveFamily["generate"]>[0];
type Draft = ReturnType<AdaptiveFamily["generate"]>;
type Choice = Draft["choices"][number];
const yes = (text: string): Choice => ({ text, correct: true });
const no = (text: string, misconception: string): Choice => ({
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
  topicId: "stacks-queues",
  reviewHref: "/lessons/stacks-queues",
});
const triplet = (r: R) => {
  const a = r.int(1, 8),
    b = a + r.int(1, 5),
    c = b + r.int(1, 5);
  return [a, b, c] as const;
};
export const stackQueueAdaptiveFamilies: AdaptiveFamily[] = [
  family("sq-lifo-pop", "stack-lifo", "foundation", (r) => {
    const [a, b, c] = triplet(r);
    return {
      prompt: "What does pop return?",
      context: `push ${a}; push ${b}; push ${c}; pop`,
      choices: [
        yes(`${c}`),
        no(`${a}`, "That is the oldest, not the top item."),
        no(`${b}`, "The middle item waits below the top."),
      ],
      explanation: `${c} was pushed last and is at top.`,
      hints: ["Locate the most recent push.", `The last push was ${c}.`],
      workedStep: `Top changes ${a} → ${b} → ${c}; pop returns ${c}.`,
    };
  }),
  family("sq-lifo-two-pops", "stack-lifo", "application", (r) => {
    const [a, b, c] = triplet(r);
    return {
      prompt: "What values do two pops return?",
      context: `push ${a}; push ${b}; push ${c}; pop; pop`,
      choices: [
        yes(`${c}, ${b}`),
        no(`${a}, ${b}`, "That treats the stack like a FIFO queue."),
        no(`${c}, ${a}`, "After removing the top, the middle item is next."),
      ],
      explanation: `The top is ${c}, then ${b}.`,
      hints: [
        "Remove the most recent push first.",
        "After one pop, the former middle item becomes top.",
      ],
      workedStep: `[${a}, ${b}, ${c}] → [${a}, ${b}] → [${a}], returning ${c}, ${b}.`,
    };
  }),
  family("sq-empty-pop", "stack-boundaries", "foundation", (r) => {
    const value = r.int(1, 99);
    return {
      prompt:
        "What happens on pop from this empty structure under the lesson contract?",
      context: `push ${value}; pop; now top = None; pop again.`,
      choices: [
        yes("Return None; top stays None"),
        no(
          "Return the old top value",
          "There is no old top in an empty structure.",
        ),
        no("Create a node", "Pop removes; it never creates a node."),
      ],
      explanation:
        "An empty pop returns None and leaves top null in this contract.",
      hints: ["Check top before dereferencing.", "There is no node to remove."],
      workedStep: "top is None, so take the empty branch and return None.",
    };
  }),
  family("sq-stack-link", "stack-boundaries", "application", (r) => {
    const old = r.int(1, 9),
      value = r.int(10, 19);
    return {
      prompt: "Which linked push keeps the old chain?",
      context: `top → A(${old}); create X(${value}).`,
      choices: [
        yes("X.next = top; top = X"),
        no(
          "top = X; X.next = top",
          "This makes X point to itself after top moves.",
        ),
        no(
          "top.next = X; top = X",
          "This changes the old link and does not put X before A.",
        ),
      ],
      explanation: "Link X to old top A before assigning top = X.",
      hints: ["Preserve A before moving top.", "X.next must point to A."],
      workedStep: "X.next → A, then top → X; both nodes remain reachable.",
    };
  }),
  family("sq-fifo-dequeue", "queue-fifo", "foundation", (r) => {
    const [a, b, c] = triplet(r);
    return {
      prompt: "What does dequeue return?",
      context: `enqueue ${a}; enqueue ${b}; enqueue ${c}; dequeue`,
      choices: [
        yes(`${a}`),
        no(`${c}`, "That removes the rear as if it were a stack."),
        no(`${b}`, "The middle arrival waits behind the first."),
      ],
      explanation: `${a} arrived first and is at front.`,
      hints: ["Locate the earliest arrival.", `The first enqueue was ${a}.`],
      workedStep: `front ${a} → ${b} → ${c} rear; dequeue returns ${a}.`,
    };
  }),
  family("sq-fifo-after-removal", "queue-fifo", "application", (r) => {
    const [a, b, c] = triplet(r);
    return {
      prompt: "What is the new front after one dequeue?",
      context: `enqueue ${a}; enqueue ${b}; enqueue ${c}; dequeue`,
      choices: [
        yes(`${b}`),
        no(`${a}`, "The first item was just removed."),
        no(`${c}`, "The rear remains behind the middle item."),
      ],
      explanation: `Removing ${a} advances front to ${b}.`,
      hints: [
        "Remove exactly one item from front.",
        "The second arrival becomes first.",
      ],
      workedStep: `[${a}, ${b}, ${c}] → [${b}, ${c}], so front is ${b}.`,
    };
  }),
  family("sq-singleton-refs", "queue-references", "foundation", (r) => {
    const value = r.int(1, 99);
    return {
      prompt: "What are endpoint references after dequeue?",
      context: `head = tail = A(${value}); A.next = null; dequeue`,
      choices: [
        yes("head = null; tail = null"),
        no("head = null; tail = A", "Tail would dangle on a removed node."),
        no(
          "head = A; tail = null",
          "Head would still point to the removed node.",
        ),
      ],
      explanation:
        "Removing the only node empties the queue, so both references become null.",
      hints: [
        "The queue has no remaining nodes.",
        "An empty linked queue has two null endpoints.",
      ],
      workedStep:
        "A.next is null, so moving head to A.next gives null; set tail to null too.",
    };
  }),
  family("sq-enqueue-refs", "queue-references", "application", (r) => {
    const value = r.int(1, 99);
    return {
      prompt: "Which reference update enqueues X?",
      context: `head → A; tail → B(${value}); B.next = null; new X.`,
      choices: [
        yes("B.next = X; tail = X"),
        no(
          "head = X; tail = B",
          "That loses the old front and leaves tail incorrect.",
        ),
        no(
          "A.next = X; tail = B",
          "That can bypass B and leaves tail on the wrong node.",
        ),
      ],
      explanation:
        "Link through the old tail B and move tail to X; head remains A.",
      hints: ["The rear is B, not A.", "Connect B.next to X, then move tail."],
      workedStep: "B.next → X; tail → X; head → A.",
    };
  }),
  family("sq-pop-zero-cost", "structure-complexity", "foundation", (r) => {
    const n = r.int(5, 30);
    return {
      prompt: "What is the cost of Python list.pop(0)?",
      context: `A Python list holds ${n} references.`,
      choices: [
        yes("O(n): later references shift"),
        no("O(1): it is a pop", "Only pop() at the end avoids shifting."),
        no(
          "O(log n): it halves the list",
          "No halving occurs; remaining entries move.",
        ),
      ],
      explanation: `After removing index zero, up to ${n - 1} references shift left, giving O(n).`,
      hints: [
        "Think about the gap at index zero.",
        "Every later item must move one position.",
      ],
      workedStep: `${n - 1} later references may shift, proportional to n.`,
    };
  }),
  family("sq-amortized-append", "structure-complexity", "application", (r) => {
    const n = r.int(8, 64);
    return {
      prompt: "Which guarantee accurately describes dynamic-array end append?",
      context: `A list has ${n} items and may need to grow its backing array.`,
      choices: [
        yes("Amortized O(1); a resize can take O(n)"),
        no(
          "Worst-case O(1) for every append",
          "A resize copies existing references.",
        ),
        no(
          "Always O(n) for every append",
          "Most appends use available capacity and are cheap.",
        ),
      ],
      explanation:
        "Occasional O(n) resizes are spread across many O(1) appends, giving amortized O(1).",
      hints: [
        "Consider what happens when capacity runs out.",
        "A resize copies old references, but does not happen every time.",
      ],
      workedStep: `A resize may copy ${n} references; many intervening appends are constant time.`,
    };
  }),
  family("sq-delimiter-type", "structure-transfer", "application", (r) => {
    const opener = r.pick(["(", "[", "{"]);
    const filler = r.int(1, 99);
    const closer = opener === "(" ? ")" : opener === "[" ? "]" : "}";
    const bad = closer === ")" ? "]" : ")";
    return {
      prompt: "Is this delimiter string balanced?",
      context: `task${filler}${opener}${bad} (non-bracket characters are ignored)`,
      choices: [
        yes("No: the closer has the wrong type"),
        no(
          "Yes: one opener and one closer",
          "Matching counts do not ensure matching types.",
        ),
        no(
          "Yes: every closer pops any opener",
          "A closer must match the top opener's type.",
        ),
      ],
      explanation: `${bad} does not match ${opener}; the stack detects the mismatch.`,
      hints: [
        "Look at the top opener.",
        `The matching closer for ${opener} is ${closer}.`,
      ],
      workedStep: `Push ${opener}; compare ${bad} with expected ${closer}; reject.`,
    };
  }),
  family("sq-task-window", "structure-transfer", "application", (r) => {
    const [a, b, c] = triplet(r);
    return {
      prompt: "Which two tasks complete first?",
      context: `Arrivals: T${a}, T${b}, T${c}. Process at most two tasks FIFO.`,
      choices: [
        yes(`T${a}, T${b}`),
        no(`T${c}, T${b}`, "That treats work as LIFO."),
        no(
          `T${a}, T${c}`,
          "The second arrival must be processed before the third.",
        ),
      ],
      explanation: `The first two arrivals are T${a} and T${b}.`,
      hints: [
        "The front is the earliest arrival.",
        "Remove two items from the front, one at a time.",
      ],
      workedStep: `[T${a}, T${b}, T${c}] → [T${b}, T${c}] → [T${c}]; completed T${a}, T${b}.`,
    };
  }),
];
