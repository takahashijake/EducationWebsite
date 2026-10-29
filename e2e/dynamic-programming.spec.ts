import { expect, test } from "@playwright/test";
import { dpSolutions } from "../src/content/dp-solutions";
import { selectAdaptiveProblem } from "../src/lib/adaptive-selection";

test("DP lesson, prediction, measured calls, scenarios, keyboard and mobile containment", async ({
  page,
}) => {
  await page.goto("/lessons/dynamic-programming");
  await expect(
    page.getByRole("heading", { name: "Dynamic Programming", exact: true }),
  ).toBeVisible();
  const player = page.getByRole("figure", {
    name: "Dynamic programming player",
  });
  await expect(player).toContainText("Naive calls: 9; unique states: 5");
  await player.getByRole("button", { name: "Next step" }).focus();
  await page.keyboard.press("Enter");
  await expect(player).toContainText("Step 2 of");
  await player.getByRole("button", { name: "Reset trace" }).click();
  await expect(player).toContainText("Step 1 of");
  await player.getByLabel("DP prediction").fill("1");
  await player
    .getByRole("button", { name: "Check prediction and reveal" })
    .click();
  await expect(player.getByRole("status")).toContainText(/Correct|Reconsider/);
  await player.getByLabel("DP scenario").selectOption("coin-greedy");
  const next = player.getByRole("button", { name: "Next step" });
  while (await next.isEnabled()) await next.click();
  await expect(player).toContainText("Minimum 2 coins: 3 + 3");
  await player.getByLabel("DP scenario").selectOption("coin-unreachable");
  await expect(
    player.getByRole("cell", { name: "row 0, state 7: not yet filled" }),
  ).toBeVisible();
  while (await next.isEnabled()) await next.click();
  await expect(player).toContainText("Amount 7 is unreachable");
  await expect(
    player.getByRole("cell", { name: "row 0, state 7: unreachable" }),
  ).toBeVisible();
  await player.getByLabel("DP scenario").selectOption("knap-choice");
  while (await next.isEnabled()) await next.click();
  await expect(player).toContainText("Maximum value 7; selected items A, B");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("bounded DP composer validates and applies coin and knapsack inputs", async ({
  page,
}) => {
  await page.goto("/lessons/dynamic-programming");
  const player = page.getByRole("figure", {
    name: "Dynamic programming player",
  });
  await player.getByLabel("DP scenario").selectOption("custom");
  await player.getByLabel("DP problem family").selectOption("coin");
  await player.getByLabel("DP target or capacity").fill("21");
  await player.getByRole("button", { name: "Apply bounded problem" }).click();
  await expect(player.getByRole("alert")).toContainText("0 to 20");
  await player.getByLabel("DP target or capacity").fill("6");
  await player.getByLabel("DP denominations").fill("4, 1, 3, 3");
  await player.getByRole("button", { name: "Apply bounded problem" }).click();
  await expect(player).toContainText("using 1, 3, 4");
  await player.getByLabel("DP problem family").selectOption("knapsack");
  await player.getByLabel("DP target or capacity").fill("2");
  await player.getByLabel("DP items").fill("A,2,3\nA,1,1");
  await player.getByRole("button", { name: "Apply bounded problem" }).click();
  await expect(player.getByRole("alert")).toContainText("distinct item IDs");
  await player.getByLabel("DP items").fill("A,2,3\nB,2,3");
  await player.getByRole("button", { name: "Apply bounded problem" }).click();
  while (await player.getByRole("button", { name: "Next step" }).isEnabled())
    await player.getByRole("button", { name: "Next step" }).click();
  await expect(player).toContainText("Maximum value 3; selected items A");
});
test("DP Python lab runs in browser and assisted success stays formative", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/lessons/dynamic-programming");
  const lab = page.getByRole("region", {
    name: "Cache staircase results",
    exact: true,
  });
  await lab.getByRole("button", { name: "Reveal next hint" }).click();
  await lab
    .getByLabel("Python source", { exact: true })
    .fill(dpSolutions["dp-memo"]);
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
    expect.objectContaining({ activityId: "dp-memo", correct: true }),
  );
  await page.reload();
  await expect(
    page
      .getByRole("region", { name: "Cache staircase results", exact: true })
      .getByLabel("Python source", { exact: true }),
  ).toHaveValue(dpSolutions["dp-memo"]);
});
test("DP adaptive mistake remediates to the lesson", async ({ page }) => {
  await page.goto("/practice/adaptive?skill=dp-coin-change");
  const first = selectAdaptiveProblem({
    records: [],
    now: Date.now(),
    seed: 0,
    manualSkill: "dp-coin-change",
  })!.instance;
  await expect(page.getByRole("heading", { name: first.prompt })).toBeVisible();
  const wrong = first.options.find((_, i) => i !== first.correctIndex)!;
  await page.getByRole("radio", { name: wrong.text, exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(
    page.getByRole("link", { name: /Review the lesson explanation/ }),
  ).toHaveAttribute("href", "/lessons/dynamic-programming");
});
