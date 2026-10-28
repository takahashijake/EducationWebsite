/** Authored Python references for browser Code Labs; never executed by the tree step engine. */
const node = `class Node:
    def __init__(self, key, left=None, right=None):
        self.key = key
        self.left = left
        self.right = right
`;
export const treeSolutions: Record<string, string> = {
  "tree-traversals":
    node +
    `
def traversals(root):
    pre, ino, post = [], [], []
    def walk(node):
        if node is None:
            return
        pre.append(node.key)
        walk(node.left)
        ino.append(node.key)
        walk(node.right)
        post.append(node.key)
    walk(root)
    return pre, ino, post
`,
  "tree-level-order":
    node +
    `
from collections import deque

def level_order(root):
    if root is None:
        return []
    queue = deque([root])
    levels = []
    while queue:
        level = []
        for _ in range(len(queue)):
            node = queue.popleft()
            level.append(node.key)
            if node.left is not None:
                queue.append(node.left)
            if node.right is not None:
                queue.append(node.right)
        levels.append(level)
    return levels
`,
  "tree-height":
    node +
    `
def height(root):
    if root is None:
        return -1
    return 1 + max(height(root.left), height(root.right))
`,
  "tree-search":
    node +
    `
def bst_search(root, key):
    node = root
    while node is not None:
        if key == node.key:
            return node
        node = node.left if key < node.key else node.right
    return None
`,
  "tree-insert":
    node +
    `
def bst_insert(root, key):
    if root is None:
        return Node(key)
    if key < root.key:
        root.left = bst_insert(root.left, key)
    elif key > root.key:
        root.right = bst_insert(root.right, key)
    return root
`,
  "tree-delete":
    node +
    `
def bst_delete(root, key):
    if root is None:
        return None
    if key < root.key:
        root.left = bst_delete(root.left, key)
        return root
    if key > root.key:
        root.right = bst_delete(root.right, key)
        return root
    if root.left is None:
        return root.right
    if root.right is None:
        return root.left
    parent = root
    successor = root.right
    while successor.left is not None:
        parent = successor
        successor = successor.left
    if parent is not root:
        parent.left = successor.right
        successor.right = root.right
    successor.left = root.left
    return successor
`,
};
