export const stackQueueSolutions: Record<string, string> = {
  "sq-stack-sim": `def simulate_stack(operations):
    stack, results = [], []
    for action, value in operations:
        if action == "push":
            stack.append(value)
        elif action == "pop":
            results.append(stack.pop() if stack else None)
        elif action == "peek":
            results.append(stack[-1] if stack else None)
    return results`,
  "sq-queue-sim": `from collections import deque

def simulate_queue(operations):
    queue, results = deque(), []
    for action, value in operations:
        if action == "enqueue":
            queue.append(value)
        elif action == "dequeue":
            results.append(queue.popleft() if queue else None)
        elif action == "front":
            results.append(queue[0] if queue else None)
    return results`,
  "sq-linked-stack": `class Node:
    def __init__(self, value, next=None):
        self.value, self.next = value, next

class LinkedStack:
    def __init__(self):
        self.top = None
    def push(self, value):
        self.top = Node(value, self.top)
    def pop(self):
        if self.top is None:
            return None
        value = self.top.value
        self.top = self.top.next
        return value
    def peek(self):
        return None if self.top is None else self.top.value`,
  "sq-linked-queue": `class Node:
    def __init__(self, value, next=None):
        self.value, self.next = value, next

class LinkedQueue:
    def __init__(self):
        self.head = self.tail = None
    def enqueue(self, value):
        new = Node(value)
        if self.tail is None:
            self.head = new
        else:
            self.tail.next = new
        self.tail = new
    def dequeue(self):
        if self.head is None:
            return None
        value = self.head.value
        self.head = self.head.next
        if self.head is None:
            self.tail = None
        return value
    def front(self):
        return None if self.head is None else self.head.value`,
  "sq-delimiters": `def balanced_delimiters(text):
    pairs = {')': '(', ']': '[', '}': '{'}
    opening = set(pairs.values())
    stack = []
    for char in text:
        if char in opening:
            stack.append(char)
        elif char in pairs:
            if not stack or stack.pop() != pairs[char]:
                return False
    return not stack`,
  "sq-tasks": `from collections import deque

def process_tasks(arrivals, limit):
    waiting = deque(arrivals)
    completed = []
    for _ in range(limit):
        if not waiting:
            break
        completed.append(waiting.popleft())
    return completed, list(waiting)`,
};
