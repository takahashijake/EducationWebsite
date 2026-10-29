import { expect, test } from "@playwright/test";
import { weightedSolutions } from "../src/content/weighted-solutions";
import { selectAdaptiveProblem } from "../src/lib/adaptive-selection";

test("weighted lesson traces selection, relaxation, stale entries, and path on desktop and mobile", async ({
  page,
}) => {
  await page.goto("/lessons/weighted-shortest-paths");
  await expect(
    page.getByRole("heading", { name: "Weighted Graphs and Shortest Paths" }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Graphs", exact: true }).first(),
  ).toHaveAttribute("href", "/lessons/graphs");
  const player = page.getByRole("figure", { name: "Weighted Dijkstra player" });
  await expect(player).toBeVisible();
  await expect(player).toContainText("Priority queue: minimum first");
  await player.getByLabel("Prediction").selectOption("A");
  await player.getByRole("button", { name: "Check prediction" }).click();
  await expect(player).toContainText("Correct. Pop minimum (A, 0)");
  await player.getByRole("button", { name: "Next step" }).click();
  await player.getByRole("button", { name: "Next step" }).click();
  await player.getByRole("button", { name: "Previous step" }).click();
  await expect(player).toContainText("Pop minimum (A, 0)");
  await player.getByRole("button", { name: "Reset algorithm" }).focus();
  await page.keyboard.press("Enter");
  await expect(player).toContainText("Step 1 of");
  const next = player.getByRole("button", { name: "Next step" });
  let sawStale = false;
  while (await next.isEnabled()) {
    await next.click();
    if (
      (await player.locator("[aria-live=polite]").textContent())?.includes(
        "Skip stale queue entry (D, 9)",
      )
    )
      sawStale = true;
  }
  expect(sawStale).toBe(true);
  await expect(player).toContainText("Path to D: A → B → C → D; total cost 6.");
  await player
    .getByLabel("Weighted graph scenario")
    .selectOption("unreachable");
  await expect(player).toContainText("Step 1 of");
  while (await next.isEnabled()) await next.click();
  await expect(player).toContainText("Path to D: unreachable");
  await player
    .getByLabel("Weighted graph scenario")
    .selectOption("directed-zero");
  await expect(player.locator("svg path[marker-end]")).toHaveCount(4);
  await player
    .getByLabel("Weighted graph scenario")
    .selectOption("same-vertex");
  while (await next.isEnabled()) await next.click();
  await expect(player).toContainText("Path to A: A; total cost 0.");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("weighted composer validates input and prediction explains a failed relaxation", async ({
  page,
}) => {
  await page.goto("/lessons/weighted-shortest-paths");
  const player = page.getByRole("figure", { name: "Weighted Dijkstra player" });
  await player.getByLabel("Weighted graph scenario").selectOption("compose");
  await player.getByLabel("Edge weight").fill("-1");
  await player.getByRole("button", { name: "Add weighted edge" }).click();
  await expect(player.getByRole("alert")).toContainText("Weight must be");
  await player.getByLabel("Edge weight").fill("");
  await player.getByRole("button", { name: "Add weighted edge" }).click();
  await expect(player.getByRole("alert")).toContainText("Weight must be");
  await player.getByLabel("Edge weight").fill("0");
  await player.getByRole("button", { name: "Add weighted edge" }).click();
  await expect(player.getByRole("alert")).toHaveCount(0);
  await player.getByRole("button", { name: "Add weighted edge" }).click();
  await expect(player.getByRole("alert")).toContainText(
    "Duplicate weighted edge",
  );
  await player.getByLabel("Destination").selectOption("B");
  const next = player.getByRole("button", { name: "Next step" });
  await next.click();
  await next.click();
  await expect(player).toContainText("Will A → B improve the estimate?");
  await player.getByLabel("Prediction").selectOption("No");
  await player.getByRole("button", { name: "Check prediction" }).click();
  await expect(player).toContainText("Try the queue and tentative table");
  while (
    !(await player.textContent())?.includes("Will B → A improve the estimate?")
  )
    await next.click();
  await player.getByLabel("Prediction").selectOption("Yes");
  await player.getByRole("button", { name: "Check prediction" }).click();
  await expect(player).toContainText("does not improve 0");
  await player.getByLabel("Vertex count").selectOption("2");
  await player.getByLabel("Directed edges").check();
  await player.getByRole("button", { name: "Add weighted edge" }).click();
  await player.getByLabel("Edge from").selectOption("B");
  await player.getByLabel("Edge to").selectOption("A");
  await player.getByLabel("Edge weight").fill("2");
  await player.getByRole("button", { name: "Add weighted edge" }).click();
  await expect(player.locator("svg path[marker-end]")).toHaveCount(2);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("weighted Python labs persist drafts and preserve independent evidence", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/lessons/weighted-shortest-paths");
  const assisted = page.getByRole("region", {
    name: "Repair edge relaxation",
    exact: true,
  });
  await assisted.getByRole("button", { name: "Reveal next hint" }).click();
  await assisted
    .getByLabel("Python source", { exact: true })
    .fill(weightedSolutions["weighted-relax"]);
  await assisted.getByRole("button", { name: "Run Tests" }).click();
  await expect(
    assisted.getByRole("region", { name: "Test result" }),
  ).toContainText("2 passed · 0 failed", { timeout: 40000 });
  await expect(assisted).toContainText(
    "not recorded as independent positive concept evidence",
  );
  const independent = page.getByRole("region", {
    name: "Compare route costs",
    exact: true,
  });
  await independent
    .getByLabel("Python source", { exact: true })
    .fill(weightedSolutions["weighted-route-cost"]);
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
    expect.objectContaining({ activityId: "weighted-relax", correct: true }),
  );
  expect(records).toContainEqual(
    expect.objectContaining({
      activityId: "weighted-route-cost",
      correct: true,
    }),
  );
  await page.reload();
  await expect(
    page
      .getByRole("region", { name: "Compare route costs", exact: true })
      .getByLabel("Python source", { exact: true }),
  ).toHaveValue(weightedSolutions["weighted-route-cost"]);
});

test("weighted adaptive mistake offers remediation and related variation", async ({
  page,
}) => {
  await page.goto("/practice/adaptive?skill=weighted-relaxation");
  const first = selectAdaptiveProblem({
    records: [],
    now: Date.now(),
    seed: 0,
    manualSkill: "weighted-relaxation",
  })!.instance;
  await expect(page.getByRole("heading", { name: first.prompt })).toBeVisible();
  const wrong = first.options.find((_, i) => i !== first.correctIndex)!;
  await page.getByRole("radio", { name: wrong.text, exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(
    page.getByRole("link", { name: /Review the lesson explanation/ }),
  ).toHaveAttribute("href", "/lessons/weighted-shortest-paths");
  await page.getByRole("button", { name: "New related variation" }).click();
  await page.goto("/lessons/graphs");
  await expect(
    page.getByRole("figure", { name: "Graph traversal player" }),
  ).toBeVisible();
});
