import { expect, test } from "@playwright/test";
import { treeSolutions } from "../src/content/tree-solutions";
import { selectAdaptiveProblem } from "../src/lib/adaptive-selection";

test("tree lesson traces traversals, predictions, composition, and deletion", async ({
  page,
}) => {
  await page.goto("/lessons/trees");
  const player = page.getByRole("figure", {
    name: "Tree and BST operation player",
  });
  await expect(player).toBeVisible();
  await player.getByLabel("Tree scenario").selectOption("balanced");
  await player.getByLabel("Tree operation").selectOption("inorder");
  await player.getByRole("button", { name: "Next step" }).click();
  await player.getByLabel("Tree prediction").selectOption("4");
  await player.getByRole("button", { name: "Check prediction" }).click();
  await expect(player).toContainText("Next key:");
  await player.getByRole("button", { name: "Next step" }).click();
  await player.getByRole("button", { name: "Previous step" }).click();
  await player.getByRole("button", { name: "Reset operation" }).focus();
  await page.keyboard.press("Enter");
  await expect(player).toContainText("Step 1 of");
  await player.getByLabel("Tree operation").selectOption("level-order");
  const next = player.getByRole("button", { name: "Next step" });
  while (await next.isEnabled()) await next.click();
  await expect(player).toContainText("8 → 4 → 12 → 2 → 6 → 10 → 14");
  await player.getByLabel("Tree scenario").selectOption("two-children");
  while (await next.isEnabled()) await next.click();
  await expect(player).toContainText("transplanted successor 9");
  await expect(player).toContainText("Root: 9 (n8)");
  await player.getByLabel("Tree scenario").selectOption("leaf");
  while (await next.isEnabled()) await next.click();
  await expect(player).toContainText("Removed leaf 2");
  await player.getByLabel("Tree scenario").selectOption("one-child");
  while (await next.isEnabled()) await next.click();
  await expect(player).toContainText("child 10 takes its place");
  await player.getByLabel("Tree scenario").selectOption("compose");
  await player.getByLabel("Tree operation").selectOption("insert");
  await player.getByLabel("Tree key", { exact: true }).fill("8");
  await player.getByRole("button", { name: "Apply to my BST" }).click();
  await player.getByLabel("Tree key", { exact: true }).fill("4");
  await player.getByRole("button", { name: "Apply to my BST" }).click();
  await expect(player).toContainText("nodes: 2");
  await player.getByLabel("Tree key", { exact: true }).fill("4");
  await player.getByRole("button", { name: "Apply to my BST" }).click();
  await expect(player).toContainText("nodes: 2");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("tree Code Labs preserve drafts and separate assisted evidence", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/lessons/trees");
  const assisted = page.getByRole("region", {
    name: "Search a binary search tree",
    exact: true,
  });
  await assisted.getByRole("button", { name: "Reveal next hint" }).click();
  await assisted
    .getByLabel("Python source", { exact: true })
    .fill(treeSolutions["tree-search"]);
  await assisted.getByRole("button", { name: "Run Tests" }).click();
  await expect(
    assisted.getByRole("region", { name: "Test result" }),
  ).toContainText("2 passed · 0 failed", { timeout: 40000 });
  await expect(assisted).toContainText(
    "not recorded as independent positive concept evidence",
  );
  const independent = page.getByRole("region", {
    name: "Compute edge-based tree height",
    exact: true,
  });
  await independent
    .getByLabel("Python source", { exact: true })
    .fill(treeSolutions["tree-height"]);
  await independent.getByRole("button", { name: "Run Tests" }).click();
  await expect(
    independent.getByRole("region", { name: "Test result" }),
  ).toContainText("2 passed · 0 failed", { timeout: 40000 });
  const records = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("cs-fundamentals:evidence:v1") ?? "{}")
        .records ?? [],
  );
  expect(records).not.toContainEqual(
    expect.objectContaining({ activityId: "tree-search", correct: true }),
  );
  expect(records).toContainEqual(
    expect.objectContaining({ activityId: "tree-height", correct: true }),
  );
  await page.reload();
  await expect(
    page
      .getByRole("region", {
        name: "Compute edge-based tree height",
        exact: true,
      })
      .getByLabel("Python source", { exact: true }),
  ).toHaveValue(treeSolutions["tree-height"]);
});

test("tree adaptive remediation links to published lesson", async ({
  page,
}) => {
  await page.goto("/practice/adaptive?skill=bst-mutations");
  const first = selectAdaptiveProblem({
    records: [],
    now: Date.now(),
    seed: 0,
    manualSkill: "bst-mutations",
  })!.instance;
  await expect(page.getByRole("heading", { name: first.prompt })).toBeVisible();
  const wrong = first.options.find((_, i) => i !== first.correctIndex)!;
  await page.getByRole("radio", { name: wrong.text, exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(
    page.getByRole("link", { name: /Review the lesson explanation/ }),
  ).toHaveAttribute("href", "/lessons/trees");
  await page.getByRole("button", { name: "New related variation" }).click();
  await page.goto("/lessons/graphs");
  await expect(
    page.getByRole("figure", { name: "Graph traversal player" }),
  ).toBeVisible();
});
