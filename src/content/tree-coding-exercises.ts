import type { CodingExercise, CodingTest } from "./coding-types";
import { treeSolutions } from "./tree-solutions";
const node = `class Node:\n    def __init__(self, key, left=None, right=None):\n        self.key = key\n        self.left = left\n        self.right = right\n`;
const check = (
  id: string,
  label: string,
  code: string,
  guidance: string,
): CodingTest => ({
  id: `tree-${id}`,
  label,
  code,
  expectedBehavior: label,
  guidance,
  conceptIds: ["trees"],
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
  id: `tree-${id}`,
  topicId: "trees",
  title,
  instructions,
  starter: node + starter,
  expectedBehavior: instructions[0],
  tests,
  hints,
  explanation,
  reflection,
  conceptIds: ["trees"],
  revision: 1,
  referenceSolution: treeSolutions[`tree-${id}`],
});
export const treeCodingExercises: CodingExercise[] = [
  lab(
    "traversals",
    "Implement three depth-first traversals",
    [
      "Implement traversals(root), returning a tuple (preorder, inorder, postorder) of lists of keys. Use left before right. An empty tree returns ([], [], []).",
      "Node has key, left, and right references. Preserve the input tree. These are binary-tree traversals; the keys need not satisfy BST ordering.",
    ],
    `\ndef traversals(root):\n    if root is None: return [], [], []\n    return [root.key], [root.key], [root.key]  # repair recursive order\n`,
    [
      check(
        "traversals-branch",
        "Different preorder, inorder, and postorder orders",
        `root = Node(8, Node(4, Node(2), Node(6)), Node(12))\nassert traversals(root) == ([8,4,2,6,12], [2,4,6,8,12], [2,6,4,12,8])`,
        "Visit before, between, or after child calls.",
      ),
      check(
        "traversals-boundary",
        "Empty and skewed trees",
        `assert traversals(None) == ([], [], [])\nroot = Node(3, None, Node(1, None, Node(2)))\nassert traversals(root) == ([3,1,2], [3,1,2], [2,1,3])`,
        "Right-only recursion still has three different visit positions.",
      ),
    ],
    [
      "Write one recursive walk with a base case for None.",
      "Append to each result before the left call, between calls, or after the right call.",
    ],
    "The same recursive frames support three visit timings. Inorder sorts keys only when the tree obeys the BST invariant.",
    "Why is inorder not necessarily sorted for an arbitrary binary tree?",
  ),
  lab(
    "level-order",
    "Traverse a tree level by level",
    [
      "Implement level_order(root), returning a list of key lists, one per depth from root to leaves and left to right. Empty returns [].",
      "Use FIFO. At each outer iteration, process exactly the queue length recorded before adding the next level's children.",
    ],
    `\ndef level_order(root):\n    if root is None: return []\n    return [[root.key]]  # repair FIFO and level boundaries\n`,
    [
      check(
        "level-branch",
        "Branching levels",
        `root = Node(8, Node(4, Node(2), Node(6)), Node(12, None, Node(14)))\nassert level_order(root) == [[8],[4,12],[2,6,14]]`,
        "New children belong to the next level, not the current one.",
      ),
      check(
        "level-empty",
        "Empty, singleton, and skewed",
        `assert level_order(None) == []\nassert level_order(Node(5)) == [[5]]\nassert level_order(Node(1, None, Node(2, None, Node(3)))) == [[1],[2],[3]]`,
        "A queue of one node produces one level at a time.",
      ),
    ],
    [
      "Use collections.deque and popleft().",
      "Freeze len(queue) at the start of each level, then enqueue children left before right.",
    ],
    "FIFO processes all nodes at depth d before nodes at depth d + 1; a saved level size keeps boundaries intact.",
    "What goes wrong if newly enqueued children are processed in the current level?",
  ),
  lab(
    "height",
    "Compute edge-based tree height",
    [
      "Implement height(root), returning the maximum number of edges from root to a leaf. Empty height is -1; a leaf has height 0.",
      "Use recursion. The taller child determines height; the tree need not be a BST.",
    ],
    `\ndef height(root):\n    if root is None: return 0  # repair the edge-based base case\n    return 1 + height(root.left)\n`,
    [
      check(
        "height-boundary",
        "Empty, singleton, and skewed",
        `assert height(None) == -1\nassert height(Node(5)) == 0\nassert height(Node(1, None, Node(2, None, Node(3)))) == 2`,
        "The empty child's -1 height makes a leaf 0.",
      ),
      check(
        "height-branch",
        "Choose the taller subtree",
        `root = Node(8, Node(4), Node(12, Node(10, Node(9)), Node(14)))\nassert height(root) == 3`,
        "Use max of both subtree heights.",
      ),
    ],
    [
      "The base case is height(None) == -1.",
      "Return 1 + max(height(left), height(right)).",
    ],
    "Each recursive frame adds one edge above the taller child; recursion stack space is O(h).",
    "How many frames can a maximally skewed n-node tree require?",
  ),
  lab(
    "search",
    "Search a binary search tree",
    [
      "Implement bst_search(root, key), returning the matching Node object or None. Do not replace or mutate nodes.",
      "Use the global BST invariant to choose exactly one branch at each comparison. Empty and absent keys return None.",
    ],
    `\ndef bst_search(root, key):\n    if root is None: return None\n    return root if root.key == key else None  # repair branch selection\n`,
    [
      check(
        "search-found",
        "Find a deep node by identity",
        `root = Node(8, Node(4, Node(2), Node(6)), Node(12))\nassert bst_search(root, 6) is root.left.right\nassert bst_search(root, 8) is root`,
        "A successful search returns the existing object.",
      ),
      check(
        "search-absent",
        "Absent and empty keys",
        `root = Node(8, Node(4), Node(12))\nassert bst_search(root, 5) is None\nassert bst_search(root, 15) is None\nassert bst_search(None, 8) is None`,
        "Stop at the selected empty child reference.",
      ),
    ],
    [
      "Compare the key with the current node.",
      "Go left only when smaller, right only when larger; return the object on equality.",
    ],
    "Each comparison eliminates one entire subtree, so cost follows height h.",
    "Why would searching both branches discard the BST advantage?",
  ),
  lab(
    "insert",
    "Insert a unique BST key",
    [
      "Implement bst_insert(root, key), returning the resulting root. Mutate only the child reference on the search path; preserve existing Node objects and subtrees.",
      "Keys are unique. Inserting a duplicate is a no-op and returns the same root. Empty insertion creates one Node.",
    ],
    `\ndef bst_insert(root, key):\n    if root is None: return Node(key)\n    root.left = Node(key)  # repair path and duplicate handling\n    return root\n`,
    [
      check(
        "insert-path",
        "Insert both directions and preserve references",
        `left, right = Node(4), Node(12)\nroot = Node(8, left, right)\nassert bst_insert(root, 6) is root\nassert root.left is left and root.right is right and root.left.right.key == 6\nassert bst_insert(root, 10) is root and root.right.left.key == 10`,
        "Only the selected empty child reference should change.",
      ),
      check(
        "insert-boundary",
        "Empty insertion and duplicate no-op",
        `root = bst_insert(None, 8)\nassert root.key == 8 and root.left is None and root.right is None\nbefore = (root.left, root.right)\nassert bst_insert(root, 8) is root and (root.left, root.right) == before`,
        "Equality must return unchanged.",
      ),
    ],
    [
      "The empty child is the insertion position.",
      "Recurse left for smaller, right for larger; on equality, return root unchanged.",
    ],
    "The insertion path has length O(h); unaffected nodes retain their identity.",
    "Why would adding a duplicate to the left violate this lesson's strict invariant?",
  ),
  lab(
    "delete",
    "Delete a BST key without losing identities",
    [
      "Implement bst_delete(root, key), returning the resulting root. Handle absent, leaf, one-child, and two-child cases, including root deletion.",
      "Preserve all unaffected Node objects. For two children, transplant the existing inorder successor Node from the right subtree; do not copy its key into the deleted object. The successor's right child must remain connected.",
    ],
    `\ndef bst_delete(root, key):\n    if root is None: return None\n    if root.key == key: return None  # repair all structural cases\n    return root\n`,
    [
      check(
        "delete-simple",
        "Absent, leaf, and one-child deletion",
        `leaf = Node(2)\nchild = Node(10)\nroot = Node(8, Node(4, leaf), Node(12, child))\nassert bst_delete(root, 99) is root\nassert bst_delete(root, 2) is root and root.left.left is None\nassert bst_delete(root, 12) is root and root.right is child\nassert bst_delete(Node(5), 5) is None`,
        "Rewire the parent to the surviving child or None.",
      ),
      check(
        "delete-successor",
        "Root transplant preserves successor and untouched identities",
        `left = Node(4)\nextra = Node(11)\nsuccessor = Node(10, None, extra)\nright = Node(12, successor, Node(14))\nold = Node(8, left, right)\nnew = bst_delete(old, 8)\nassert new is successor and new.key == 10\nassert new.left is left and new.right is right\nassert right.left is extra and right.right.key == 14\nassert bst_delete(Node(8, Node(4), Node(12)), 8).key == 12`,
        "Detach successor from its old parent, then move that same object to the deleted position.",
      ),
    ],
    [
      "Descend along one BST branch until the target is found.",
      "With two children, find the leftmost node in the right subtree, detach it, and reattach both subtrees to that same Node object.",
    ],
    "A successor is the smallest key above the target. Transplanting its object preserves logical identity while strict ordering remains valid.",
    "Why must the successor's former parent adopt its right child?",
  ),
];
