import type { Lesson } from "./types";
import { stackQueueCodingExercises } from "./stack-queue-coding-exercises";

export const stackQueueLesson: Lesson = {
  topicId: "stacks-queues",
  minutes: 48,
  objectives: [
    "Predict LIFO stack and FIFO queue results, including empty and singleton operations.",
    "Maintain top, head, and tail references without losing or duplicating nodes.",
    "Choose an array, linked nodes, or deque using accurate operation costs.",
    "Use stacks and queues to solve delimiter validation and task scheduling problems.",
  ],
  introduction: [
    "A stack removes the most recently added item: last in, first out (LIFO). A queue removes the earliest added item: first in, first out (FIFO). These are behavior contracts, independent of how values are stored.",
    "The player uses logical node IDs such as n0 and n1. Equal values can belong to different nodes. Node positions are diagram layout, not memory addresses. The player shows authored operations; your Python labs execute separately in a browser Worker.",
  ],
  concept: {
    title: "Operations determine what can leave next",
    paragraphs: [
      "A stack has one accessible end, the top. push places a new value there; pop removes and returns that value; peek reads it without removal. An empty check prevents underflow. In this lesson's player, pop or peek on an empty stack returns None and leaves it empty. Python APIs can instead raise, so read each contract.",
      "A queue has a front and rear. enqueue adds at the rear, dequeue removes and returns the front, and an inspection reads front/rear without removal. In the player, empty dequeue returns None. A linked queue maintains head at the front and tail at the rear. The invariant is: both references are null when empty; otherwise tail is the final reachable node and tail.next is null.",
      "With a linked stack, top is a head reference. Push sets new.next to old top before moving top. Pop moves top to its successor. With a linked queue, enqueue links old tail.next to the new node and moves tail; when empty, both head and tail become the new node. Dequeue advances head. If that removed the last node, tail must also become null. These changes take O(1) time when the references are maintained correctly.",
    ],
  },
  demonstration: {
    kind: "stacks-queues",
    caption:
      "Operate and review bounded stack and queue sequences, then compose your own.",
  },
  sections: [
    {
      title: "Representations and real operation costs",
      paragraphs: [
        "A Python list is a dynamic array. Reading list[i] is O(1); append and pop() at the end are amortized O(1). Resizing can make an individual append O(n), so do not claim every append has worst-case O(1) time. The backing array stores references compactly, but may reserve unused capacity.",
        "Using list.pop(0) for dequeue shifts the remaining n−1 references, so it is O(n). A head index avoids those shifts for a while but needs a compaction or resizing policy. collections.deque is normally preferable for FIFO work: append and popleft are O(1) operations at opposite ends, while middle indexing is not the reason to use it. A linked queue also supports O(1) enqueue/dequeue with maintained head/tail, but each node adds reference/object overhead and usually has poorer locality. Neither diagram nor ID reveals actual placement in memory.",
      ],
      code: "from collections import deque\nwaiting = deque()\nwaiting.append('A')\nwaiting.append('B')\nprint(waiting.popleft())  # A",
    },
    {
      title: "Stack transfer: balanced delimiters",
      paragraphs: [
        "Scan characters left to right. Push opening brackets. For a closing bracket, the most recent unmatched opener must have the corresponding type; pop it. If none exists or the type differs, reject immediately. At the end, accept only if the stack is empty. This lesson's lab ignores all non-bracket characters. A count alone cannot distinguish ([)] from ([]).",
        "The scan is O(n) time and O(n) worst-case auxiliary space for unmatched openers. An empty string is balanced under this contract.",
      ],
      code: "pairs = {')': '(', ']': '[', '}': '{'}\n# On a closer: require stack and stack[-1] == pairs[char].",
    },
    {
      title: "Queue transfer: process work in arrival order",
      paragraphs: [
        "A task processor must preserve arrival order even when tasks have identical names. Enqueue each arrival, then dequeue one task at a time; check emptiness before removal. This FIFO rule can govern print jobs, requests, or breadth-first exploration, though real systems may add priorities, cancellation, or concurrency.",
        "When the last task is removed from a linked queue, both head and tail become None. Leaving tail on the removed node can corrupt the next enqueue: linking through that detached node leaves the new task unreachable from head.",
      ],
    },
  ],
  workedExample: {
    title: "Process a queue through its singleton boundary",
    introduction:
      "Track identities and both endpoint references for enqueue A, enqueue B, dequeue, dequeue, enqueue C.",
    steps: [
      "Start head = tail = None. Enqueue A: make n0; head = tail = n0; n0.next = None.",
      "Enqueue B: make n1; set n0.next = n1, then tail = n1. Head stays n0.",
      "Dequeue returns A from n0; head becomes n1 and tail remains n1.",
      "Dequeue returns B from n1; head becomes None. Since the queue is empty, tail must become None too.",
      "Enqueue C: make n2. Both head and tail become n2. Its identity differs from the removed nodes, even if its value repeats.",
    ],
  },
  code: {
    language: "Python 3",
    title: "Stack and FIFO queue",
    source:
      "from collections import deque\nstack = []\nstack.append('A')\nstack.append('B')\nprint(stack.pop())  # B\n\nqueue = deque()\nqueue.append('A')\nqueue.append('B')\nprint(queue.popleft())  # A",
    explanation:
      "Python list is suitable for stack operations at its end. deque provides FIFO operations at opposite ends. Check emptiness before pop or popleft if your contract requires None instead of an exception.",
  },
  misconceptions: [
    {
      belief: "The first stack item is removed first.",
      correction:
        "The most recently pushed item is at top and leaves first; the oldest item waits below it.",
    },
    {
      belief: "Queue rear is the next item to leave.",
      correction:
        "Dequeue removes the front/head. Rear/tail identifies where new work joins.",
    },
    {
      belief: "Removing a singleton linked queue only changes head.",
      correction:
        "When head becomes None, tail must become None too; otherwise it points to a detached node.",
    },
    {
      belief: "Equal values are the same node.",
      correction:
        "Values can repeat. n0(7) and n1(7) remain distinct identities with different links.",
    },
    {
      belief: "All dynamic-array end operations are worst-case O(1).",
      correction:
        "End append/pop are amortized O(1); an append that resizes the array can take O(n).",
    },
    {
      belief: "Python list.pop(0) is a constant-time dequeue.",
      correction:
        "Removing index zero shifts later references, costing O(n); use deque.popleft for ordinary FIFO work.",
    },
  ],
  takeaways: [
    "Stack: push/pop/peek at top, LIFO.",
    "Queue: enqueue at rear and dequeue at front, FIFO.",
    "An empty linked queue has both head and tail equal to null.",
    "Choose a representation using its actual operation costs and memory tradeoffs.",
  ],
  questions: [
    {
      id: "stackqueue-q1",
      prompt: "After push A, push B, then pop, what leaves the stack?",
      options: ["A", "B", "Nothing"],
      correctIndex: 1,
      explanation: "B was pushed last and is at top, so pop returns B.",
    },
    {
      id: "stackqueue-q2",
      prompt:
        "After enqueue A, enqueue B, then dequeue, what leaves the queue?",
      options: ["A", "B", "Nothing"],
      correctIndex: 0,
      explanation: "A arrived first and is at front, so dequeue returns A.",
    },
    {
      id: "stackqueue-q3",
      prompt:
        "After dequeuing the only linked-queue node, what are head and tail?",
      options: [
        "Both null",
        "Head null, tail still points to the removed node",
        "Both point to the removed node",
      ],
      correctIndex: 0,
      explanation:
        "An empty queue has no reachable node; both endpoint references must be null.",
    },
  ],
  codingExercises: stackQueueCodingExercises,
  nextStep:
    "Try the six Python Code Labs, then use focused retrieval and adaptive practice to revisit any missed invariant.",
};
