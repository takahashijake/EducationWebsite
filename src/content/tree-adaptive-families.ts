import type { AdaptiveFamily } from "./adaptive-families";
type R = Parameters<AdaptiveFamily["generate"]>[0];
type Draft = ReturnType<AdaptiveFamily["generate"]>;
type Choice = Draft["choices"][number];
const yes = (text: string): Choice => ({ text, correct: true });
const no = (text: string, misconception: string): Choice => ({
  text,
  misconception,
});
const f = (
  id: string,
  skillId: string,
  difficulty: "foundation" | "application",
  generate: (r: R) => Draft,
): AdaptiveFamily => ({
  id: `tree-${id}`,
  skillId,
  difficulty,
  revision: 1,
  topicId: "trees",
  reviewHref: "/lessons/trees",
  generate,
});
const d = (
  prompt: string,
  context: string,
  choices: [Choice, Choice, Choice],
  explanation: string,
  hint: string,
): Draft => ({
  prompt,
  context,
  choices,
  explanation,
  hints: [hint, explanation],
  workedStep: explanation,
});
export const treeAdaptiveFamilies: AdaptiveFamily[] = [
  f("structure-depth", "tree-structure", "foundation", (r) => {
    const root = r.int(8, 60),
      child = root - r.int(2, 4),
      leaf = child - r.int(1, 2);
    return d(
      `What is the depth of node ${leaf}?`,
      `Root ${root}; its left child ${child}; ${child}'s left child ${leaf}. Depth counts edges from root.`,
      [
        yes("2"),
        no("3", "Counting nodes instead of edges adds one."),
        no("1", "The node is two references below the root."),
      ],
      `${root} → ${child} → ${leaf} crosses two edges, so depth is 2.`,
      "Count edges, starting with root depth 0.",
    );
  }),
  f("structure-shape", "tree-structure", "application", (r) => {
    const x = r.int(4, 50),
      a = x - 2,
      b = x + 2;
    return d(
      "Which statement about this binary tree is correct?",
      `Root ${x}; left child ${a}; right child ${b}; ${a} has a right child ${x - 1}.`,
      [
        yes(`${a} and ${b} are siblings; ${x - 1} is a leaf.`),
        no(
          `${a} and ${x - 1} are siblings.`,
          "A parent and its child are not siblings.",
        ),
        no(
          `${x} is a leaf because it has no parent.`,
          "A leaf has no children; the root has two.",
        ),
      ],
      `${a} and ${b} share parent ${x}. Node ${x - 1} has no children.`,
      "Siblings share a parent; leaves have no children.",
    );
  }),
  f("traversal-order", "tree-traversal", "foundation", (r) => {
    const x = r.int(6, 60),
      a = x - 3,
      b = x + 4,
      mode = r.int(0, 1);
    return mode
      ? d(
          "What is postorder?",
          `Root ${x}, left leaf ${a}, right leaf ${b}.`,
          [
            yes(`${a}, ${b}, ${x}`),
            no(`${x}, ${a}, ${b}`, "That visits the root first: preorder."),
            no(
              `${a}, ${x}, ${b}`,
              "That visits between left and right: inorder.",
            ),
          ],
          `Postorder visits left ${a}, right ${b}, then root ${x}.`,
          "The root is last in postorder.",
        )
      : d(
          "What is preorder?",
          `Root ${x}, left leaf ${a}, right leaf ${b}.`,
          [
            yes(`${x}, ${a}, ${b}`),
            no(`${a}, ${x}, ${b}`, "That is inorder."),
            no(`${a}, ${b}, ${x}`, "That is postorder."),
          ],
          `Preorder visits root ${x} before left ${a} and right ${b}.`,
          "The root is first in preorder.",
        );
  }),
  f("traversal-shape", "tree-traversal", "application", (r) => {
    const x = r.int(7, 60),
      left = x - 3,
      right = x + 3,
      deep = left + 1;
    return d(
      "What does inorder visit after changing the left subtree?",
      `Root ${x}; left child ${left} has right child ${deep}; right child ${right} is a leaf.`,
      [
        yes(`${left}, ${deep}, ${x}, ${right}`),
        no(
          `${deep}, ${left}, ${x}, ${right}`,
          "The left child's right subtree follows that child in inorder.",
        ),
        no(
          `${left}, ${x}, ${deep}, ${right}`,
          "Finish the entire left subtree before visiting the root.",
        ),
      ],
      `Inorder finishes ${left}'s subtree as ${left}, ${deep}, then visits ${x}, then ${right}.`,
      "Recursively finish left subtree, then root, then right subtree.",
    );
  }),
  f("ordering-global", "tree-ordering", "foundation", (r) => {
    const root = r.int(10, 70),
      left = root - 4,
      bad = root + 1;
    return d(
      "Which placement violates the BST invariant?",
      `Root ${root}; left child ${left}; place key ${bad} as ${left}'s right child.`,
      [
        yes(`${bad} is in ${root}'s left subtree but exceeds ${root}.`),
        no(
          `It is valid because ${bad} exceeds its direct parent ${left}.`,
          "Ordering applies to every ancestor, not just the direct parent.",
        ),
        no(
          `It is invalid only if ${bad} duplicates another key.`,
          "A nonduplicate can still be on the wrong side of an ancestor.",
        ),
      ],
      `${bad} is greater than root ${root}, so it cannot be anywhere in the left subtree.`,
      "Check the key against every ancestor's allowed range.",
    );
  }),
  f("ordering-inorder", "tree-ordering", "application", (r) => {
    const x = r.int(7, 60),
      a = x - 2,
      b = x + 3,
      wrong = r.int(0, 1);
    return d(
      "Does inorder prove this is a valid strict BST?",
      wrong
        ? `Root ${x}; left key ${b}; right key ${a}.`
        : `Root ${x}; left key ${a}; right key ${b}.`,
      [
        wrong
          ? no("Yes", "An inorder sequence must rise strictly for unique keys.")
          : yes("Yes"),
        wrong
          ? yes("No")
          : no("No", "Both children are correctly ordered around the root."),
        no(
          "Cannot tell from these three keys",
          "All three nodes and references are specified.",
        ),
      ],
      wrong
        ? `Inorder is ${b}, ${x}, ${a}, which is not increasing.`
        : `Inorder is ${a}, ${x}, ${b}, strictly increasing.`,
      "Read left, root, right and check strict increase.",
    );
  }),
  f("search-branch", "bst-search", "foundation", (r) => {
    const root = r.int(10, 80),
      target = root - r.int(1, 4);
    return d(
      `Where must search for ${target} go first?`,
      `BST root ${root}; left and right subtrees may contain more keys.`,
      [
        yes("Left subtree"),
        no("Right subtree", "All right-subtree keys exceed the root."),
        no(
          "Both subtrees",
          "BST search needs only one branch after comparison.",
        ),
      ],
      `${target} < ${root}, so only the left subtree can contain ${target}.`,
      "Compare target with root and use the global invariant.",
    );
  }),
  f("search-wrong-turn", "bst-search", "application", (r) => {
    const x = r.int(12, 80),
      left = x - 5,
      right = x + 5,
      target = left + 2;
    return d(
      "Identify the first incorrect branch in this search path.",
      `BST root ${x}, left child ${left}, right child ${right}. Search ${target}: compare with ${x}, then go right to ${right}.`,
      [
        yes(`Going right at ${x}; ${target} is smaller than ${x}.`),
        no(
          `Comparing at ${x}; comparisons are unnecessary.`,
          "A comparison at each visited node is necessary.",
        ),
        no(
          `No error; ${right} may contain ${target}.`,
          "Every key in the right subtree exceeds the root.",
        ),
      ],
      `The first comparison gives ${target} < ${x}; search must go left.`,
      "Find the earliest comparison whose chosen branch violates ordering.",
    );
  }),
  f("mutation-duplicate", "bst-mutations", "foundation", (r) => {
    const root = r.int(5, 80);
    return d(
      `What happens when inserting ${root} again?`,
      `Unique-key BST with root ${root}.`,
      [
        yes("No structural change; return the existing root."),
        no(
          `Add another ${root} to the left.`,
          "Strict left ordering rejects equality.",
        ),
        no(
          `Replace the root with a new ${root} node.`,
          "A duplicate insertion preserves the existing node identity.",
        ),
      ],
      `Equality ends insertion without adding or replacing a node.`,
      "Use the stated unique-key policy.",
    );
  }),
  f("mutation-root-delete", "bst-mutations", "application", (r) => {
    const x = r.int(10, 70),
      a = x - 3,
      b = x + 4,
      successor = x + 2;
    return d(
      "Which references result from deleting the two-child root?",
      `Root ${x}; left leaf ${a}; right child ${b} with left leaf ${successor}. Use structural inorder-successor transplant.`,
      [
        yes(`${successor} becomes root; left ${a}, right ${b}.`),
        no(
          `${b} becomes root; ${successor} remains its left child.`,
          "The minimum node of the right subtree is the successor.",
        ),
        no(
          `${x} remains root with key ${successor}.`,
          "This contract moves the successor node; the deleted node is removed.",
        ),
      ],
      `Detach ${successor} from ${b}'s left and move that node to root; attach ${a} and ${b}.`,
      "Choose the leftmost node of the right subtree.",
    );
  }),
  f("complexity-height", "tree-complexity", "foundation", (r) => {
    const n = r.int(5, 40);
    return d(
      "What is the worst search cost for this ordinary BST shape?",
      `${n} keys inserted in ascending order, with no balancing.`,
      [
        yes("O(n): the tree becomes a chain."),
        no(
          "Always O(log n)",
          "Ordinary BST insertion does not rebalance sorted input.",
        ),
        no(
          "O(1): the root stores all keys",
          "A comparison follows one edge per level.",
        ),
      ],
      `Ascending insertion makes height ${n - 1}, so a missing or deepest key takes O(n) comparisons.`,
      "Infer height from insertion order before choosing a cost.",
    );
  }),
  f("complexity-compare", "tree-complexity", "application", (r) => {
    const base = r.int(10, 80);
    return d(
      "Which insertion order gives the shorter search path in an ordinary BST?",
      `Same keys ${base - 2}, ${base - 1}, ${base}, ${base + 1}, ${base + 2}. Order A: ascending. Order B: ${base}, ${base - 2}, ${base + 2}, ${base - 1}, ${base + 1}. Search for ${base + 1}.`,
      [
        yes("B: root in the middle keeps this path shorter."),
        no(
          "A: sorted insertion automatically balances.",
          "Sorted insertion creates a right chain.",
        ),
        no(
          "Both have the same height because the key set is identical.",
          "Shape depends on insertion order, not just keys.",
        ),
      ],
      `A forms a chain and reaches ${base + 1} near its end. B visits ${base} → ${base + 2} → ${base + 1}.`,
      "Draw the insertion paths; an ordinary BST does not rebalance.",
    );
  }),
];
