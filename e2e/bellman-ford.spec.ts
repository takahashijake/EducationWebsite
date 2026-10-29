import { expect, test } from "@playwright/test";
import { bellmanSolutions } from "../src/content/bellman-solutions";
import { selectAdaptiveProblem } from "../src/lib/adaptive-selection";

test("Bellman–Ford lesson navigation, passes, predictions, cycle impact, and keyboard controls", async ({
  page,
}) => {
  await page.goto("/lessons/bellman-ford");
  await expect(
    page.getByRole("heading", {
      name: "Bellman–Ford and Negative-Weight Paths",
    }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("link", {
        name: "Weighted Graphs and Shortest Paths",
        exact: true,
      })
      .first(),
  ).toHaveAttribute("href", "/lessons/weighted-shortest-paths");
  const player = page.getByRole("figure", { name: "Bellman–Ford player" });
  await expect(player).toContainText(
    "Distances and predecessors after this step",
  );
  await player
    .getByLabel("Predict next Bellman–Ford relaxation")
    .selectOption("yes");
  await player
    .getByRole("button", { name: "Check prediction and reveal" })
    .click();
  await expect(player.getByRole("status")).toContainText("Strict improvement");
  await player.getByRole("button", { name: "Previous step" }).click();
  await player.getByRole("button", { name: "Reset trace" }).focus();
  await page.keyboard.press("Enter");
  await expect(player).toContainText("Step 1 of");
  await player
    .getByLabel("Bellman–Ford scenario")
    .selectOption("dijkstra-counterexample");
  const next = player.getByRole("button", { name: "Next step" });
  while (await next.isEnabled()) await next.click();
  await expect(player).toContainText("Valid path A → C → B; cost -5");
  await player
    .getByLabel("Bellman–Ford scenario")
    .selectOption("reachable-cycle");
  while (await next.isEnabled()) await next.click();
  await expect(player).toContainText("D is negatively unbounded");
  await expect(player).toContainText("Verified negative cycle:");
  await player
    .getByLabel("Bellman–Ford scenario")
    .selectOption("partial-impact");
  while (await next.isEnabled()) await next.click();
  await expect(player).toContainText("Valid path A → E; cost 4");
  await player.getByLabel("Bellman–Ford destination").selectOption("D");
  while (await next.isEnabled()) await next.click();
  await expect(player).toContainText("D is negatively unbounded");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("Bellman–Ford composer validates signed directed edges and isolates", async ({
  page,
}) => {
  await page.goto("/lessons/bellman-ford");
  const player = page.getByRole("figure", { name: "Bellman–Ford player" });
  await player.getByLabel("Bellman–Ford scenario").selectOption("compose");
  await player.getByLabel("Bellman–Ford edge weight").fill("-21");
  await player.getByRole("button", { name: "Add directed edge" }).click();
  await expect(player.getByRole("alert")).toContainText("Weights must be");
  await player.getByLabel("Bellman–Ford edge weight").fill("-3");
  await player.getByRole("button", { name: "Add directed edge" }).click();
  await expect(player.getByRole("alert")).toHaveCount(0);
  await player.getByRole("button", { name: "Add directed edge" }).click();
  await expect(player.getByRole("alert")).toContainText(
    "Duplicate directed edge",
  );
  await player.getByLabel("Bellman–Ford vertex count").selectOption("1");
  await expect(player).toContainText("Directed edges: none");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("Bellman–Ford Python checks preserve draft and assisted evidence semantics", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/lessons/bellman-ford");
  const lab = page.getByRole("region", {
    name: "Repair strict relaxation",
    exact: true,
  });
  await lab.getByRole("button", { name: "Reveal next hint" }).click();
  await lab
    .getByLabel("Python source", { exact: true })
    .fill(bellmanSolutions["bellman-relax"]);
  await lab.getByRole("button", { name: "Run Tests" }).click();
  await expect(lab.getByRole("region", { name: "Test result" })).toContainText(
    "2 passed · 0 failed",
    { timeout: 40000 },
  );
  await expect(lab).toContainText(
    "not recorded as independent positive concept evidence",
  );
  const records = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("cs-fundamentals:evidence:v1") ?? "{}")
        .records ?? [],
  );
  expect(records).not.toContainEqual(
    expect.objectContaining({ activityId: "bellman-relax", correct: true }),
  );
  await page.reload();
  await expect(
    page
      .getByRole("region", { name: "Repair strict relaxation", exact: true })
      .getByLabel("Python source", { exact: true }),
  ).toHaveValue(bellmanSolutions["bellman-relax"]);
});
test("Bellman–Ford adaptive mistake links back to the lesson", async ({
  page,
}) => {
  await page.goto("/practice/adaptive?skill=bellman-cycle-impact");
  const first = selectAdaptiveProblem({
    records: [],
    now: Date.now(),
    seed: 0,
    manualSkill: "bellman-cycle-impact",
  })!.instance;
  await expect(page.getByRole("heading", { name: first.prompt })).toBeVisible();
  const wrong = first.options.find((_, i) => i !== first.correctIndex)!;
  await page.getByRole("radio", { name: wrong.text, exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(
    page.getByRole("link", { name: /Review the lesson explanation/ }),
  ).toHaveAttribute("href", "/lessons/bellman-ford");
});

test("Bellman–Ford scenario classifications remain distinct", async ({
  page,
}) => {
  await page.goto("/lessons/bellman-ford");
  const player = page.getByRole("figure", { name: "Bellman–Ford player" });
  const scenario = player.getByLabel("Bellman–Ford scenario");
  const next = player.getByRole("button", { name: "Next step" });
  for (const [id, result] of [
    ["negative-edge", "Valid path A → B → C → D; cost 3"],
    ["zero-positive", "Valid path A → B → C; cost 3"],
    ["unreachable-cycle", "Valid path A → B; cost 2"],
    ["disconnected", "C is unreachable"],
    ["ties", "Valid path A; cost 0"],
  ]) {
    await scenario.selectOption(id);
    while (await next.isEnabled()) await next.click();
    await expect(player).toContainText(result);
  }
});
