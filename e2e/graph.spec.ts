import { expect, test } from "@playwright/test";
import { graphSolutions } from "../src/content/graph-solutions";
import { selectAdaptiveProblem } from "../src/lib/adaptive-selection";

test("graph lesson traces BFS and DFS with prediction and keyboard review", async ({
  page,
}) => {
  await page.goto("/lessons/graphs");
  const player = page.getByRole("figure", { name: "Graph traversal player" });
  await expect(player).toBeVisible();
  await player.getByLabel("Graph scenario").selectOption("branch");
  await player.getByRole("button", { name: "Next step" }).click();
  await expect(player).toContainText("Queue: front → rear");
  await player.getByLabel("Prediction").selectOption("C");
  await player.getByRole("button", { name: "Check prediction" }).click();
  await expect(player).toContainText("Next discovered: B");
  await player.getByRole("button", { name: "Next step" }).click();
  await player.getByRole("button", { name: "Previous step" }).click();
  await expect(player).toContainText("Discover A and enqueue it");
  await player.getByLabel("Algorithm").selectOption("dfs");
  await expect(player).toContainText("DFS frames: bottom → top");
  await player.getByRole("button", { name: "Next step" }).click();
  await expect(player).toContainText("Each frame acts like a recursive call");
  await player.getByRole("button", { name: "Reset traversal" }).focus();
  await page.keyboard.press("Enter");
  await expect(player).toContainText("Step 1 of");
  await player.getByLabel("Graph scenario").selectOption("directed");
  await player.getByLabel("Start vertex").selectOption("B");
  await expect(player.locator("svg line[marker-end]")).toHaveCount(3);
  const directedNext = player.getByRole("button", { name: "Next step" });
  while (await directedNext.isEnabled()) await directedNext.click();
  await expect(player).toContainText("Unreachable: A, C");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("composed graph rejects duplicate edges and shows unreachable vertices", async ({
  page,
}) => {
  await page.goto("/lessons/graphs");
  const player = page.getByRole("figure", { name: "Graph traversal player" });
  await player.getByLabel("Graph scenario").selectOption("compose");
  await player.getByRole("button", { name: "Add edge" }).click();
  await player.getByRole("button", { name: "Add edge" }).click();
  await expect(player.getByRole("alert")).toContainText("Duplicate edge");
  await player.getByLabel("Target vertex").selectOption("D");
  const next = player.getByRole("button", { name: "Next step" });
  while (await next.isEnabled()) await next.click();
  await expect(player).toContainText("Unreachable: C, D");
  await expect(player).toContainText("Path to D: unreachable");
  await player.getByLabel("Vertex count").selectOption("2");
  await expect(player).not.toContainText("C: not reached");
});

test("graph labs preserve drafts and separate assisted from independent evidence", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/lessons/graphs");
  const assisted = page.getByRole("region", {
    name: "Traverse with breadth-first search",
    exact: true,
  });
  await assisted.getByRole("button", { name: "Reveal next hint" }).click();
  await assisted
    .getByLabel("Python source", { exact: true })
    .fill(graphSolutions["graph-bfs"]);
  await assisted.getByRole("button", { name: "Run Tests" }).click();
  await expect(
    assisted.getByRole("region", { name: "Test result" }),
  ).toContainText("2 passed · 0 failed", { timeout: 40000 });
  await expect(assisted).toContainText(
    "not recorded as independent positive concept evidence",
  );
  const independent = page.getByRole("region", {
    name: "Find an unweighted shortest path",
    exact: true,
  });
  await independent
    .getByLabel("Python source", { exact: true })
    .fill(graphSolutions["graph-shortest"]);
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
    expect.objectContaining({ activityId: "graph-bfs", correct: true }),
  );
  expect(records).toContainEqual(
    expect.objectContaining({ activityId: "graph-shortest", correct: true }),
  );
  await page.reload();
  await expect(
    page
      .getByRole("region", {
        name: "Find an unweighted shortest path",
        exact: true,
      })
      .getByLabel("Python source", { exact: true }),
  ).toHaveValue(graphSolutions["graph-shortest"]);
});

test("graph adaptive mistakes link to lesson and old lessons remain usable", async ({
  page,
}) => {
  await page.goto("/practice/adaptive?skill=graph-bfs");
  const first = selectAdaptiveProblem({
    records: [],
    now: Date.now(),
    seed: 0,
    manualSkill: "graph-bfs",
  })!.instance;
  await expect(page.getByRole("heading", { name: first.prompt })).toBeVisible();
  const wrong = first.options.find((_, i) => i !== first.correctIndex)!;
  await page.getByRole("radio", { name: wrong.text, exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(
    page.getByRole("link", { name: /Review the lesson explanation/ }),
  ).toHaveAttribute("href", "/lessons/graphs");
  await page.getByRole("button", { name: "New related variation" }).click();
  await page.goto("/lessons/stacks-queues");
  await expect(
    page.getByRole("figure", { name: "Stack and queue operation player" }),
  ).toBeVisible();
});
