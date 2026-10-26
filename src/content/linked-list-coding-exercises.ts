import type { CodingExercise, CodingTest } from "./coding-types";
import { linkedListSolutions } from "./linked-list-solutions";

const prelude =
  "class Node:\n    def __init__(self, value, next=None):\n        self.value = value\n        self.next = next\n";
const chain =
  "def make(values):\n    head = None\n    for value in reversed(values):\n        head = Node(value, head)\n    return head\n\ndef inspect(head):\n    seen, nodes = set(), []\n    while head is not None:\n        assert id(head) not in seen, 'cycle detected'\n        seen.add(id(head))\n        nodes.append(head)\n        assert len(nodes) <= 20, 'chain did not terminate'\n        head = head.next\n    return nodes\n";
const test = (
  id: string,
  label: string,
  code: string,
  guidance: string,
): CodingTest => ({
  id: `linked-${id}`,
  label,
  code: `${chain}\n${code}`,
  expectedBehavior: label,
  guidance,
  conceptIds: ["linked-lists"],
});
const lab = (
  id: string,
  title: string,
  instructions: string[],
  starter: string,
  expectedBehavior: string,
  tests: CodingTest[],
  hints: string[],
  explanation: string,
  reflection: string,
): CodingExercise => ({
  id: `linked-${id}`,
  topicId: "linked-lists",
  title,
  instructions,
  starter: `${prelude}\n${starter}`,
  expectedBehavior,
  tests,
  revision: 1,
  hints,
  explanation,
  reflection,
  conceptIds: ["linked-lists"],
  referenceSolution: linkedListSolutions[`linked-${id}`],
});
export const linkedListCodingExercises: CodingExercise[] = [
  lab(
    "traverse",
    "Collect linked-list values",
    [
      "Implement collect_values(head) using next references. Return a new Python list of values in traversal order.",
      "Node(value, next=None) is supplied. Do not mutate any node. Empty head returns [].",
    ],
    "def collect_values(head):\n    result = []\n    current = head\n    while current is not None:\n        # append the value, then follow next\n        break\n    return result",
    "Return every reachable value once in next-link order; preserve all node identities and links.",
    [
      test(
        "traverse-empty",
        "Empty and singleton",
        "assert collect_values(None) == []\na = Node(8)\nassert collect_values(a) == [8]\nassert a.next is None",
        "Check None before reading a node; process the singleton before advancing.",
      ),
      test(
        "traverse-chain",
        "Order, duplicates, and unchanged links",
        "a = make([4, 7, 7, 2]); before = inspect(a)\nassert collect_values(a) == [4, 7, 7, 2]\nassert inspect(a) == before\nassert all(before[i].next is before[i+1] for i in range(3))",
        "Read current.value, advance current = current.next, and leave the chain untouched.",
      ),
    ],
    [
      "Start current at head; an empty head skips the loop.",
      "Append current.value before assigning current = current.next.",
    ],
    "A traversal follows references until None. Its output uses O(n) space; the traversal reference itself uses O(1).",
    "Why is an output list O(n) even though traversal needs only one reference?",
  ),
  lab(
    "search",
    "Find the first matching node",
    [
      "Implement find_first(head, target). Return the matching Node object, not its value or a new node; return None if absent.",
      "Search in next-link order, including duplicate values.",
    ],
    "def find_first(head, target):\n    current = head\n    while current is not None:\n        # return the first matching node\n        break\n    return None",
    "Return the exact first reachable matching object, or None; leave links unchanged.",
    [
      test(
        "search-empty",
        "Empty and missing",
        "assert find_first(None, 7) is None\na = make([4, 2]); assert find_first(a, 9) is None\nassert [n.value for n in inspect(a)] == [4, 2]",
        "Stop at None without dereferencing it; absent targets return None.",
      ),
      test(
        "search-identity",
        "First duplicate identity",
        "a = make([7, 2, 7]); nodes = inspect(a)\nassert find_first(a, 7) is nodes[0]\nassert find_first(a, 2) is nodes[1]\nassert find_first(a, 7) is not nodes[2]\nassert inspect(a) == nodes",
        "Return current itself at the first match, not a value, copy, or later duplicate.",
      ),
    ],
    [
      "Compare current.value with target before advancing.",
      "Use return current immediately at a match; return None after the loop.",
    ],
    "Equal values can occupy distinct nodes. The first match is the first identity encountered from head.",
    "How can two equal values lead to different return identities?",
  ),
  lab(
    "prepend",
    "Prepend without losing the chain",
    [
      "Implement prepend(head, value). Allocate one fresh Node and return it as the new head.",
      "Its next must reference the original head, including when head is None.",
    ],
    "def prepend(head, value):\n    new = Node(value)\n    # preserve the original chain before updating the returned head\n    return head",
    "Return one new head whose next is the exact old head; preserve every old node and link.",
    [
      test(
        "prepend-empty",
        "Empty head",
        "new = prepend(None, 5)\nassert isinstance(new, Node) and new.value == 5 and new.next is None",
        "The empty head becomes a one-node list.",
      ),
      test(
        "prepend-preserve",
        "Old identities and duplicate values",
        "old = make([7, 7, 2]); before = inspect(old)\nnew = prepend(old, 7); after = inspect(new)\nassert len(after) == 4 and new is not old and new.next is old\nassert after[1:] == before and [n.value for n in after] == [7, 7, 7, 2]",
        "Set new.next to the original head. Copying values does not preserve identity.",
      ),
    ],
    [
      "The new node has its own identity even if its value repeats.",
      "Set new.next = head, then return new.",
    ],
    "A constant number of reference assignments preserves the chain, so head insertion is O(1).",
    "Why does assigning alias = head not create the new node required here?",
  ),
  lab(
    "append",
    "Append with only a head reference",
    [
      "Implement append(head, value). Allocate one fresh Node with next=None and return the head.",
      "If head is empty, return the new node. Otherwise preserve the original head and every prior link while finding the tail.",
    ],
    "def append(head, value):\n    new = Node(value)\n    if head is None:\n        return None  # repair the empty case\n    current = head\n    while current.next is not None:\n        current = current.next\n    # link the old tail to new\n    return head",
    "Return the original head for nonempty inputs; link one fresh tail node without losing existing nodes.",
    [
      test(
        "append-empty",
        "Empty head",
        "new = append(None, 5)\nassert isinstance(new, Node) and new.value == 5 and new.next is None",
        "Return the fresh node as head when there is no old node.",
      ),
      test(
        "append-singleton",
        "Singleton and same head",
        "old = Node(2); result = append(old, 7)\nassert result is old and old.next is not None and old.next.value == 7 and old.next.next is None",
        "Attach the new node through old.next; keep the old head.",
      ),
      test(
        "append-preserve",
        "Preserve full chain and duplicates",
        "old = make([4, 7, 7]); before = inspect(old)\nresult = append(old, 2); after = inspect(result)\nassert result is old and after[:3] == before and len(after) == 4\nassert [n.value for n in after] == [4, 7, 7, 2] and after[-1] not in before",
        "Traverse while current.next is not None, then assign current.next = new.",
      ),
    ],
    [
      "For None, the new node is the head.",
      "Walk to the node with next is None; set that node's next to new.",
    ],
    "With head alone, locating the tail costs O(n); setting tail.next costs O(1).",
    "What extra reference would make repeated appends O(1), and when must it be updated?",
  ),
  lab(
    "remove",
    "Remove the first matching node",
    [
      "Implement remove_first(head, target), returning the possibly changed head.",
      "Bypass only the first reachable match. Preserve all unaffected Node objects and their order. Return the same head if no match exists.",
    ],
    "def remove_first(head, target):\n    previous, current = None, head\n    while current is not None:\n        if current.value == target:\n            # update head or previous.next before returning\n            return head\n        previous, current = current, current.next\n    return head",
    "Remove exactly the first match; correctly update head, keep the tail chain, and preserve unaffected identities.",
    [
      test(
        "remove-empty",
        "Empty and absent",
        "assert remove_first(None, 7) is None\na = make([4, 2]); before = inspect(a)\nassert remove_first(a, 7) is a and inspect(a) == before",
        "An absent target must leave head and all links unchanged.",
      ),
      test(
        "remove-head",
        "Head and singleton deletion",
        "a = make([7, 4, 2]); old = inspect(a); result = remove_first(a, 7)\nassert result is old[1] and inspect(result) == old[1:]\nsingle = Node(7); assert remove_first(single, 7) is None",
        "When previous is None, return current.next as the new head.",
      ),
      test(
        "remove-middle",
        "First duplicate and surviving tail",
        "a = make([4, 7, 7, 2]); old = inspect(a); result = remove_first(a, 7)\nassert result is a and inspect(result) == [old[0], old[2], old[3]]\nassert old[0].next is old[2] and old[2].next is old[3]",
        "Set previous.next = current.next; retain the second 7 and remaining tail.",
      ),
      test(
        "remove-tail",
        "Tail deletion",
        "a = make([4, 2, 7]); old = inspect(a); result = remove_first(a, 7)\nassert result is a and inspect(result) == old[:2] and old[1].next is None",
        "Bypassing the tail assigns previous.next = None.",
      ),
    ],
    [
      "Track previous and current; previous stays None at the head.",
      "At a head match return current.next; otherwise assign previous.next = current.next and return head.",
    ],
    "Finding a match is O(n) worst case; rewiring the known link is O(1). Returning head lets the caller observe head deletion.",
    "What would be lost if previous.next were set to None when current had a successor?",
  ),
];
