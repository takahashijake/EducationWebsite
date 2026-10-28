import type { Lesson } from "./types";
import { treeCodingExercises } from "./tree-coding-exercises";

export const treeLesson: Lesson = {
  topicId: "trees",
  minutes: 70,
  objectives: [
    "Name structural relationships and calculate edge-based depth and height.",
    "Predict preorder, inorder, postorder, and level-order on varied shapes.",
    "Apply the global BST invariant to search, insert, and delete unique keys.",
    "Explain successor transplantation, node identity, and costs in terms of height.",
  ],
  introduction: [
    "A tree organizes nodes into a hierarchy: one root, child references, and no cycles or shared children. A family diagram or file hierarchy is a general tree; each node can have many children. A binary tree limits each node to a left and a right child. The player uses binary search trees (BSTs), a special binary-tree arrangement that lets a comparison choose one branch.",
    "This lesson builds on recursion, stacks and queues, and Big O. Those prerequisites are advisory. Try the player to see every comparison and structural change, then use the Python labs to implement the ideas yourself. The player traces its own small tree and does not execute your Python.",
  ],
  concept: {
    title: "Tree shape and identity",
    paragraphs: [
      "The root has no parent. A parent points to a child; children of the same parent are siblings. A leaf has no children. A subtree is a node together with all its descendants. Each nonroot node has exactly one parent. Two different nodes may display the same value in a general binary tree, but they remain different objects; in this BST lesson keys are unique, and the player gives every node a stable ID independent of its key and screen position.",
      "Depth is the number of edges from root to a node. Nodes at the same depth form a level; the root is level 0. Height is the maximum number of edges from a node to a leaf. This lesson uses edge-based height: empty tree -1, leaf 0, and a root with a leaf child 1. A singleton is both root and leaf.",
      "A balanced-looking shape keeps height relatively small. A skewed tree has a chain of nodes and height n - 1. An ordinary BST is not self-balancing: inserting sorted keys can create that chain. Shape depends on insertion order, even when the set of keys is identical.",
    ],
  },
  demonstration: {
    kind: "tree-bst",
    caption:
      "Trace structural references, recursive frames, FIFO levels, and successor transplantation.",
  },
  sections: [
    {
      title: "Four traversal orders",
      paragraphs: [
        "Depth-first traversals use recursive call frames. Preorder visits node, left subtree, right subtree. Inorder visits left subtree, node, right subtree. Postorder visits left subtree, right subtree, node. A frame remembers where to resume after a child returns. On 8 with children 4 and 12, preorder is 8,4,12; inorder is 4,8,12; postorder is 4,12,8.",
        "Level-order is breadth-first: put the root in a FIFO queue, remove the front node, then enqueue its left and right children. It visits one depth before the next. On that same tree the order is 8,4,12, but a deeper branch makes it different from preorder. An empty tree yields an empty order in every mode.",
        "Inorder produces sorted keys only if the global BST invariant holds. It does not sort an arbitrary binary tree by magic. Try changing the shape in the player, and then inspect the Tree traversals Code Lab.",
      ],
      code: `def inorder(node):\n    if node is None: return []\n    return inorder(node.left) + [node.key] + inorder(node.right)`,
    },
    {
      title: "The global BST ordering invariant",
      paragraphs: [
        "For every node, every key anywhere in its left subtree is smaller, and every key anywhere in its right subtree is larger. Checking only immediate children is insufficient: a key 9 placed under the left child of root 8 violates the root's invariant even if it is larger than its direct parent.",
        "Search compares a target with the current key and follows exactly one child: left if smaller, right if larger, stop if equal or the child reference is empty. Minimum follows left references until none remain; maximum follows right. Insert follows the same search path and creates a node at the empty reference. Here keys are unique: an equal-key insertion is a no-op and preserves the existing node.",
      ],
      code: `def search(root, key):\n    while root is not None:\n        if key == root.key: return root\n        root = root.left if key < root.key else root.right\n    return None`,
    },
    {
      title: "Deletion changes references",
      paragraphs: [
        "To delete a leaf, set its parent's child reference to empty. To delete a node with one child, connect its parent directly to that child. Deleting the root uses the returned replacement as the new root. An absent key leaves the tree alone.",
        "With two children, find the inorder successor: the minimum node of the right subtree. Detach that existing node from its former parent, connecting its right child there if it has one. Move the successor object into the deleted node's position and attach the deleted node's left and right subtrees. The deleted node disappears, while the successor keeps its logical identity and key. The player shows stable node IDs so this reference change is visible.",
        "For example, delete root 8 from 8 with left 4 and right 12 whose left child is 10. Node 10 moves into the root position; 4 becomes its left child and 12 its right. If 10 had a right child 11, 12's left reference would become 11. Inorder remains sorted after the change.",
      ],
    },
    {
      title: "Costs follow height",
      paragraphs: [
        "Search, insertion, and deletion inspect a root-to-leaf path, so each takes O(h) time. A reasonably balanced n-node BST has h around log n and typically O(log n) operations; a maximally skewed BST has h = n - 1 and O(n) operations. Ordinary insertion does not guarantee balance. Traversing all nodes takes O(n) time.",
        "The n nodes require O(n) tree storage. Recursive traversal and recursive mutations use O(h) call-stack space; level-order uses a queue up to the maximum level width, at most O(n). Iterative search needs O(1) auxiliary space. These are different costs: an O(h) search does not mean the whole tree occupies only O(h) memory.",
        "For related foundations, review /lessons/recursion, /lessons/stacks-queues, /lessons/linked-lists, and /lessons/big-o-notation. The graph lesson compares tree-like traversal with graphs that may contain cycles or shared paths.",
      ],
    },
  ],
  relatedTopicIds: [
    "recursion",
    "stacks-queues",
    "linked-lists",
    "big-o-notation",
    "graphs",
  ],
  workedExample: {
    title: "Delete a root with two children",
    introduction:
      "Start with keys inserted in order 8, 4, 12, 10, 14, 9, 11. Delete 8.",
    steps: [
      "Search finds root 8. Its left and right references are both present.",
      "Follow right to 12, then left to 10, then left to 9: node 9 is the inorder successor.",
      "Detach node 9 from 10's left reference. If 9 had a right child, that child would replace 9 there.",
      "Move the same node 9 into the root position. Attach 4 on its left and 12 on its right. Root ID changes to 9's ID; node 8 is removed.",
      "Inorder is now 4, 9, 10, 11, 12, 14. Every left-subtree key remains smaller and every right-subtree key remains larger.",
    ],
  },
  code: {
    language: "Python",
    title: "Structural successor transplant",
    source: `def delete(root, key):\n    if root is None: return None\n    if key < root.key:\n        root.left = delete(root.left, key)\n        return root\n    if key > root.key:\n        root.right = delete(root.right, key)\n        return root\n    if root.left is None: return root.right\n    if root.right is None: return root.left\n    parent, successor = root, root.right\n    while successor.left is not None:\n        parent, successor = successor, successor.left\n    if parent is not root:\n        parent.left = successor.right\n        successor.right = root.right\n    successor.left = root.left\n    return successor`,
    explanation:
      "The existing successor object replaces the deleted root. A caller reassigns the returned root so root deletion works too.",
  },
  misconceptions: [
    {
      belief: "A binary tree is automatically a BST.",
      correction:
        "Binary describes at most two children; a BST also satisfies strict global ordering at every node.",
    },
    {
      belief: "Inorder sorts any tree.",
      correction:
        "It yields sorted keys only when the BST invariant already holds.",
    },
    {
      belief: "A BST automatically stays balanced.",
      correction:
        "Ordinary insertion can make a chain; balanced variants are a later topic.",
    },
    {
      belief: "Deleting a two-child node just copies the successor's key.",
      correction:
        "This lesson transplants the existing successor node and preserves its identity; references must be rewired.",
    },
    {
      belief: "Height and storage have the same complexity.",
      correction:
        "Height controls path and recursion costs; storing n nodes still takes O(n).",
    },
  ],
  takeaways: [
    "Height counts edges: empty -1, leaf 0; depth counts edges from root.",
    "Recursive visit timing distinguishes preorder, inorder, and postorder; FIFO gives level-order.",
    "The BST invariant applies to whole subtrees; duplicates are ignored here.",
    "Search, insert, and delete cost O(h), which can be O(n) on a skewed ordinary BST.",
  ],
  questions: [
    {
      id: "trees-q1",
      prompt:
        "In a BST with root 8 and children 4 and 12, what does inorder visit?",
      options: ["4, 8, 12", "8, 4, 12", "4, 12, 8"],
      correctIndex: 0,
      explanation:
        "Inorder visits left, node, right. This is sorted because the tree obeys BST ordering.",
    },
    {
      id: "trees-q2",
      prompt: "Why does search for 5 at root 8 skip the entire right subtree?",
      options: [
        "Every key there is greater than 8",
        "Only the direct right child matters",
        "The right subtree is always empty",
      ],
      correctIndex: 0,
      explanation:
        "The invariant applies to every descendant: all right-subtree keys exceed 8, so none can equal 5.",
    },
    {
      id: "trees-q3",
      prompt:
        "Deleting a two-child root with successor key 10 should do what to the successor node?",
      options: [
        "Move that existing node into the root position",
        "Copy 10 into the old root object and leave the successor",
        "Discard both children",
      ],
      correctIndex: 0,
      explanation:
        "Structural transplant detaches the successor, reconnects its former child, and moves that same node object to replace the deleted root.",
    },
  ],
  codingExercises: treeCodingExercises,
  nextStep:
    "Try the six Tree Code Labs, then practice a focused tree skill through a new adaptive variation.",
};
