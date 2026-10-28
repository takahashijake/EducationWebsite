import type { CodingExercise, CodingTest } from "./coding-types";
import { stackQueueSolutions } from "./stack-queue-solutions";

const t = (
  id: string,
  label: string,
  code: string,
  guidance: string,
): CodingTest => ({
  id: `sq-${id}`,
  label,
  code,
  expectedBehavior: label,
  guidance,
  conceptIds: ["stacks-queues"],
});
const lab = (
  id: string,
  title: string,
  instructions: string[],
  starter: string,
  tests: CodingTest[],
  hints: string[],
  explanation: string,
  reflection: string,
): CodingExercise => ({
  id: `sq-${id}`,
  topicId: "stacks-queues",
  title,
  instructions,
  starter,
  expectedBehavior: instructions[0],
  tests,
  hints,
  explanation,
  reflection,
  conceptIds: ["stacks-queues"],
  revision: 1,
  referenceSolution: stackQueueSolutions[`sq-${id}`],
});
export const stackQueueCodingExercises: CodingExercise[] = [
  lab(
    "stack-sim",
    "Simulate a stack",
    [
      "Implement simulate_stack(operations), returning results of pop and peek in operation order.",
      "Each operation is (action, value); value is ignored for pop/peek. Empty pop/peek returns None. Inputs are not mutated.",
    ],
    `def simulate_stack(operations):
    stack, results = [], []
    for action, value in operations:
        if action == "push":
            stack.append(value)
        elif action in ("pop", "peek"):
            results.append(None)  # replace with top behavior
    return results`,
    [
      t(
        "stack-empty",
        "Empty and singleton",
        `assert simulate_stack([("pop", None), ("peek", None), ("push", 4), ("peek", None), ("pop", None), ("pop", None)]) == [None, None, 4, 4, None]`,
        "Check emptiness before accessing the top.",
      ),
      t(
        "stack-order",
        "LIFO and repeated values",
        `ops = [("push", 7), ("push", 2), ("push", 7), ("pop", None), ("pop", None), ("pop", None)]
assert simulate_stack(ops) == [7, 2, 7]`,
        "Pop the most recent push; repeated values remain separate entries.",
      ),
    ],
    [
      "Use a Python list with its end as top.",
      "append pushes; pop() removes; stack[-1] peeks without removing.",
    ],
    "The end of the list models top; guarded pop and peek keep underflow explicit.",
    "Why would pop(0) give the wrong order?",
  ),
  lab(
    "queue-sim",
    "Simulate a queue",
    [
      "Implement simulate_queue(operations), returning results of dequeue and front in operation order.",
      "Each operation is (action, value); value is ignored for dequeue/front. Empty access returns None.",
    ],
    `from collections import deque

def simulate_queue(operations):
    queue, results = deque(), []
    for action, value in operations:
        if action == "enqueue":
            queue.append(value)
        elif action in ("dequeue", "front"):
            results.append(None)  # repair FIFO access
    return results`,
    [
      t(
        "queue-empty",
        "Empty and singleton",
        `assert simulate_queue([("dequeue", None), ("enqueue", "A"), ("front", None), ("dequeue", None), ("front", None)]) == [None, "A", "A", None]`,
        "Inspect and remove from the front; handle emptiness.",
      ),
      t(
        "queue-order",
        "FIFO and repeated values",
        `ops = [("enqueue", 7), ("enqueue", 2), ("enqueue", 7), ("dequeue", None), ("dequeue", None), ("dequeue", None)]
assert simulate_queue(ops) == [7, 2, 7]`,
        "The first enqueued value leaves first.",
      ),
    ],
    [
      "Use deque.append for arrivals.",
      "Use popleft for removal and queue[0] for front inspection after checking emptiness.",
    ],
    "The queue's left end is front. deque avoids list.pop(0) shifting.",
    "How does the empty case differ from a singleton dequeue?",
  ),
  lab(
    "linked-stack",
    "Implement a linked stack",
    [
      "Complete LinkedStack with top, push(value), pop(), and peek(). Empty pop/peek returns None.",
      "Use the supplied Node class; push creates one fresh node, pop returns the top value and advances top.",
    ],
    `class Node:
    def __init__(self, value, next=None):
        self.value, self.next = value, next

class LinkedStack:
    def __init__(self):
        self.top = None
    def push(self, value):
        new = Node(value)
        self.top = new  # old chain is lost; repair
    def pop(self):
        return None
    def peek(self):
        return None`,
    [
      t(
        "linked-stack-empty",
        "Empty and singleton transitions",
        `s = LinkedStack()
assert s.top is None and s.pop() is None and s.peek() is None
s.push(5); first = s.top
assert isinstance(first, Node) and first.value == 5 and first.next is None
assert s.peek() == 5 and s.top is first
assert s.pop() == 5 and s.top is None`,
        "Reassign top to the successor on pop.",
      ),
      t(
        "linked-stack-links",
        "Distinct nodes with repeated values",
        `s = LinkedStack(); s.push(7); first = s.top; s.push(7); second = s.top
assert second is not first and second.next is first
assert s.pop() == 7 and s.top is first
assert s.pop() == 7 and s.top is None`,
        "Link new.next to old top before changing top.",
      ),
    ],
    [
      "A new node must point to the old top.",
      "On pop, save top.value, assign top = top.next, then return the saved value.",
    ],
    "Top is the only endpoint needed for constant-time linked stack operations.",
    "Why is new = Node(value) followed by top = new insufficient?",
  ),
  lab(
    "linked-queue",
    "Implement a linked queue",
    [
      "Complete LinkedQueue with head, tail, enqueue(value), dequeue(), and front(). Empty dequeue/front returns None.",
      "Create one fresh Node on enqueue. Maintain head/tail; both are None when empty, and tail.next is always None.",
    ],
    `class Node:
    def __init__(self, value, next=None):
        self.value, self.next = value, next

class LinkedQueue:
    def __init__(self):
        self.head = self.tail = None
    def enqueue(self, value):
        new = Node(value)
        self.tail = new  # repair both references and old tail link
    def dequeue(self):
        return None
    def front(self):
        return None`,
    [
      t(
        "linked-queue-empty",
        "Empty, singleton, then empty again",
        `q = LinkedQueue()
assert q.head is q.tail is None and q.dequeue() is None and q.front() is None
q.enqueue(4); only = q.head
assert q.tail is only and only.next is None and q.front() == 4
assert q.dequeue() == 4 and q.head is q.tail is None
q.enqueue(9); assert q.head is q.tail and q.front() == 9`,
        "The final dequeue must clear both head and tail; new empty enqueue sets both.",
      ),
      t(
        "linked-queue-links",
        "FIFO, duplicate identity, and tail links",
        `q = LinkedQueue(); q.enqueue(7); a = q.head; q.enqueue(7); b = q.tail; q.enqueue(2); c = q.tail
assert a is not b and a.next is b and b.next is c and c.next is None
assert q.dequeue() == 7 and q.head is b and q.tail is c
assert q.dequeue() == 7 and q.head is c and q.tail is c
assert q.dequeue() == 2 and q.head is q.tail is None`,
        "Link old tail.next to new and move tail; dequeue advances head.",
      ),
    ],
    [
      "Empty enqueue sets head and tail to the same new node.",
      "Nonempty enqueue changes old tail.next and tail. When dequeue makes head None, set tail = None.",
    ],
    "Maintaining both endpoints allows O(1) enqueue/dequeue without losing a successor.",
    "What breaks if tail still points to a removed singleton?",
  ),
  lab(
    "delimiters",
    "Validate balanced delimiters",
    [
      "Implement balanced_delimiters(text) for (), [], and {} with proper nesting.",
      "Ignore every non-bracket character. Return True for empty text. A closer without a matching most recent opener returns False.",
    ],
    `def balanced_delimiters(text):
    depth = 0
    for char in text:
        if char in "([{": depth += 1
        elif char in ")]}": depth -= 1
    return depth == 0  # depth alone misses mismatched types and early closers`,
    [
      t(
        "delimiters-empty",
        "Empty and singleton",
        `assert balanced_delimiters("") is True
assert balanced_delimiters("x") is True
assert balanced_delimiters("(") is False
assert balanced_delimiters(")") is False`,
        "A closer cannot appear before its opener.",
      ),
      t(
        "delimiters-nesting",
        "Nesting and mismatch",
        `assert balanced_delimiters("a[({b})]") is True
assert balanced_delimiters("([)]") is False
assert balanced_delimiters("(]") is False
assert balanced_delimiters("{[]}") is True`,
        "Match the most recent opener's type, not only the count.",
      ),
    ],
    [
      "Push each opener; ignore other characters.",
      "For a closer, require a nonempty stack and the correct type at its top; finish with an empty stack.",
    ],
    "A stack preserves nesting order; a numeric depth loses type information.",
    "Why can ([)] have final depth zero and still be invalid?",
  ),
  lab(
    "tasks",
    "Process tasks in arrival order",
    [
      "Implement process_tasks(arrivals, limit), returning (completed, remaining) as two new lists.",
      "Process at most limit tasks in FIFO order. If the queue empties early, stop. Preserve duplicate task names and do not mutate arrivals. limit is a nonnegative integer.",
    ],
    `def process_tasks(arrivals, limit):
    completed = []
    waiting = list(arrivals)
    for _ in range(limit):
        if waiting:
            completed.append(waiting.pop())  # wrong end
    return completed, waiting`,
    [
      t(
        "tasks-empty",
        "Empty queue and zero limit",
        `assert process_tasks([], 3) == ([], [])
items = ["A"]
assert process_tasks(items, 0) == ([], ["A"]) and items == ["A"]
assert process_tasks(items, 3) == (["A"], [])`,
        "Stop when empty and leave input unchanged.",
      ),
      t(
        "tasks-order",
        "FIFO capacity and duplicate task names",
        `items = ["A", "B", "A", "C"]
assert process_tasks(items, 2) == (["A", "B"], ["A", "C"])
assert items == ["A", "B", "A", "C"]
assert process_tasks(items, 8) == (items, [])`,
        "Remove from the front, preserving later arrival order and duplicates.",
      ),
    ],
    [
      "Build a deque from arrivals so the input stays unchanged.",
      "Repeat up to limit: if empty, stop; otherwise popleft into completed. Convert the remaining deque to a list.",
    ],
    "This applies FIFO to a bounded processing window, with explicit empty handling.",
    "How would a stack change which tasks receive service when capacity is limited?",
  ),
];
