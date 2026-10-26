import type { Lesson } from "./types";

export const linkedListLesson: Lesson = {
  topicId: "linked-lists",
  minutes: 42,
  objectives: [
    "Distinguish node identity, value, next reference, and head reference.",
    "Trace traversal, search, insertion, append, and first-match deletion across boundary cases.",
    "Preserve the reachable chain while rewiring references and explain aliasing.",
    "Analyze location-finding separately from changing known links and compare arrays fairly.",
  ],
  introduction: [
    "A singly linked list is a chain of node objects. Each node contains a value and a next reference to another node or null. The head reference identifies the first node; an empty list has head = None in Python. Following next from head, rather than using an index, gives the list's order. The final node has next = None.",
    "The labels n0 and n1 in the diagrams name logical nodes so we can follow identity. They are not addresses or claims about heap layout. Two nodes can both contain 7 and still be different objects. Nodes need not sit next to each other in memory. Python's built-in list is a dynamic array with indexed access, not this node chain.",
  ],
  concept: {
    title: "References define structure",
    paragraphs: [
      "If head points to A, A.next points to B, and B.next is None, traversal visits A then B. Assigning alias = head gives another reference to the same A; it does not copy A or the chain. Mutating alias.next changes the chain seen through head. Rebinding alias alone does not rebind head.",
      "To prepend X safely, set X.next = head before head = X. Reversing those assignments while using the changed head as the old successor can lose the original chain. To remove a non-head node C after B, set B.next = C.next. To remove the head, set head = head.next and return the new head to the caller. The removed node may still exist through another alias, but it is no longer reachable from this head.",
      "A linked list avoids shifting array elements when modifying a known link, but finding the link can require a scan. With only head, head insertion and nonempty head deletion take O(1) time. Traversal, value search, and indexed access take O(n). Tail append takes O(n) with head alone; a maintained tail reference permits O(1) append when it stays correct. The operations here use O(1) auxiliary space apart from an output list returned by traversal, which uses O(n). Linked lists add reference storage and often worse locality than arrays, so neither representation always wins.",
    ],
  },
  demonstration: {
    kind: "linked-list",
    caption:
      "Step through authored reference updates. Select another scenario to inspect boundary cases and duplicate identities.",
  },
  sections: [
    {
      title: "Traverse and search by following next",
      paragraphs: [
        "Begin current = head. While current is not None, inspect current.value and then advance current = current.next. For search, return the first matching node reference immediately. Empty head makes zero iterations; absence ends at None. A Python list index is a position in an indexed sequence; node labels in our diagrams are identities, not positions.",
        "The loop stores one traversal reference, so auxiliary space is O(1). Collecting all values allocates an O(n) output list. A first-node match is O(1) best case; an absent or final-node match is O(n) worst case.",
      ],
      code: "def find_first(head, target):\n    current = head\n    while current is not None:\n        if current.value == target:\n            return current\n        current = current.next\n    return None",
    },
    {
      title: "Prepend, append, and preserve the old chain",
      paragraphs: [
        "Create a fresh node for insertion. For prepend, connect its next to the old head, then return it as the new head. This takes O(1) time and O(1) auxiliary space. Even an empty old head works: new.next remains None.",
        "For append with only head, first handle the empty case. Otherwise traverse until current.next is None, then set current.next to the new node. Locating the tail costs O(n) time; the final link assignment is O(1). A separately maintained tail pointer can avoid the scan, but must be updated on empty insertions and tail deletions.",
      ],
      code: "def prepend(head, value):\n    node = Node(value)\n    node.next = head\n    return node\n\ndef append(head, value):\n    node = Node(value)\n    if head is None:\n        return node\n    current = head\n    while current.next is not None:\n        current = current.next\n    current.next = node\n    return head",
    },
    {
      title: "Delete the first match",
      paragraphs: [
        "Keep previous and current references. If current matches and previous is None, current is the head: return current.next. Otherwise set previous.next = current.next, then return the original head. This bypasses exactly the first reachable matching node. If no match exists, return the original head untouched.",
        "The search portion costs O(n) worst-case time, even though rewriting a known next link is O(1). Auxiliary space stays O(1). In a singleton deletion, the new head is None. If a caller ignores the returned head, head deletion appears not to work because the caller still holds its old reference.",
      ],
      code: "def remove_first(head, target):\n    previous, current = None, head\n    while current is not None:\n        if current.value == target:\n            if previous is None:\n                return current.next\n            previous.next = current.next\n            return head\n        previous, current = current, current.next\n    return head",
    },
  ],
  workedExample: {
    title: "Remove the first 7 from A(4) → B(7) → C(7) → D(2)",
    introduction:
      "Track node identities and references, not only the resulting values.",
    steps: [
      "head → A. Set current → A and previous → None. A.value is 4, so keep searching.",
      "Advance previous → A and current → B. B.value is 7, so B is the first match. C also holds 7 but has a different identity and has not been selected.",
      "Save the successor through B.next, which is C. Set A.next → C. Do not set A.next to None or replace head with B.next.",
      "The reachable chain is A → C → D → None. B is detached from this head; A, C, and D retain their identities. The operation scanned two nodes, then changed one link.",
    ],
  },
  code: {
    language: "Python 3",
    title: "A node class and safe first-match deletion",
    source:
      "class Node:\n    def __init__(self, value, next=None):\n        self.value = value\n        self.next = next\n\ndef remove_first(head, target):\n    previous, current = None, head\n    while current is not None:\n        if current.value == target:\n            if previous is None:\n                return current.next\n            previous.next = current.next\n            return head\n        previous, current = current, current.next\n    return head\n\nhead = Node(4, Node(7, Node(7, Node(2))))\nhead = remove_first(head, 7)\nprint(head.next.value)  # 7: the second 7 remains",
    explanation:
      "Node(value, next=None) is the common contract in every linked-list lab. Python assignments move references; they do not clone nodes. The caller stores the returned head because deleting the first node may change it. The visualizer illustrates this authored logic and does not trace learner code.",
  },
  misconceptions: [
    {
      belief: "Nodes have array indices.",
      correction:
        "A node has an identity and next reference. Position can be counted by traversal, but direct indexed access requires walking from head.",
    },
    {
      belief: "Equal values mean the same node.",
      correction:
        "Two nodes holding 7 remain separate objects with separate IDs and next links. First-match deletion removes only the earliest reachable one.",
    },
    {
      belief: "new_head = head copies a list.",
      correction:
        "Both names refer to the same node. Changing a node through either alias is visible through the other; copying requires constructing new nodes.",
    },
    {
      belief: "Head changes cannot lose the rest of the list.",
      correction:
        "Before replacing head, retain a reference to the old chain. Prepend links new.next to old head first; deleting head returns its successor.",
    },
    {
      belief: "An empty head can be dereferenced.",
      correction:
        "Check for None before accessing value or next. Empty traversal performs no iterations, and append must return the new node.",
    },
    {
      belief: "Every insertion is O(1), and linked lists always beat arrays.",
      correction:
        "Only changing known links is constant time. Finding a tail or position may take O(n), and arrays offer O(1) indexed access with less reference overhead.",
    },
  ],
  takeaways: [
    "Stable node identity differs from stored value and from a visual position.",
    "Follow next until None, and handle empty head before dereferencing it.",
    "Connect or bypass links in an order that keeps the remaining chain reachable.",
    "Separate O(n) location finding from O(1) modification of a known reference.",
  ],
  questions: [
    {
      id: "linked-q1",
      prompt: "A(7) → B(7) → None. Which node does search for 7 return?",
      options: [
        "A, the first reachable matching node",
        "B, because its value is also 7",
        "Both nodes as one identity",
      ],
      correctIndex: 0,
      explanation:
        "Traversal inspects A first. Equal values do not merge A and B into one object.",
    },
    {
      id: "linked-q2",
      prompt:
        "What must happen before head = new when prepending to a nonempty list?",
      options: [
        "Set new.next = old head",
        "Set old head.next = None",
        "Copy all old node values",
      ],
      correctIndex: 0,
      explanation:
        "Linking new.next to the old head preserves the existing reachable chain when head moves.",
    },
    {
      id: "linked-q3",
      prompt:
        "With only a head reference, what is the worst-case time to append?",
      options: [
        "O(1), because one link changes",
        "O(n), because locating the tail takes a scan",
        "O(n²), because every link changes",
      ],
      correctIndex: 1,
      explanation:
        "Finding the tail is O(n); assigning its next reference is O(1).",
    },
  ],
  nextStep:
    "Try each Python lab, then use focused retrieval and adaptive practice to test reference reasoning without relying on the diagram.",
};
