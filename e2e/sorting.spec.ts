import { expect, test } from "@playwright/test";
import { selectAdaptiveProblem } from "../src/lib/adaptive-selection";
import { sortingSolutions } from "../tests/sorting-solutions";

const evidenceKey = "cs-fundamentals:evidence:v1";

test("published sorting players show exact operations, navigation, shared comparison, and keyboard access", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/lessons/sorting");
  await expect(
    page.getByRole("heading", { name: "Sorting", exact: true }),
  ).toBeVisible();
  const players = page.locator(".algorithm-visualizer");
  await expect(players).toHaveCount(3);
  const expected = [
    { name: "Bubble sort", comparisons: 6, swaps: 6, writes: 12 },
    { name: "Selection sort", comparisons: 6, swaps: 2, writes: 4 },
    { name: "Insertion sort", comparisons: 6, swaps: 0, writes: 9 },
  ];
  for (const [index, contract] of expected.entries()) {
    const player = players.nth(index);
    await expect(player).toContainText(contract.name);
    await expect(player.getByRole("button", { name: "Play" })).toBeDisabled();
    await player.getByLabel("Choose input scenario").selectOption("reverse");
    await player.getByRole("button", { name: "Next step" }).focus();
    await page.keyboard.press("Enter");
    await expect(player).toContainText("Step 2 of");
    await player.getByRole("button", { name: "Previous step" }).click();
    await expect(player).toContainText("Step 1 of");
    for (
      let step = 0;
      step < 50 &&
      (await player.getByRole("button", { name: "Next step" }).isEnabled());
      step++
    )
      await player.getByRole("button", { name: "Next step" }).click();
    await expect(
      player.getByRole("button", { name: "Next step" }),
    ).toBeDisabled();
    await expect(
      player.getByText(`Comparisons: ${contract.comparisons}`, {
        exact: false,
      }),
    ).toBeVisible();
    await expect(
      player.getByText(`Swaps: ${contract.swaps}`, { exact: false }),
    ).toBeVisible();
    await expect(
      player.getByText(`Array writes: ${contract.writes}`, { exact: false }),
    ).toBeVisible();
    await expect(player.locator(".algorithm-array li strong")).toHaveText([
      "1",
      "2",
      "3",
      "4",
    ]);
    await player.getByLabel("Choose input scenario").selectOption("empty");
    await expect(player).toContainText("Step 1 of");
    await expect(player).toContainText("No elements in this scenario");
    await expect(player.getByRole("button", { name: "Reset" })).toBeDisabled();
  }
  const comparison = page.locator(".sorting-comparison");
  await comparison.getByLabel("Shared sorting input").selectOption("reverse");
  await expect(comparison.getByText("Input: [4, 3, 2, 1]")).toBeVisible();
  await expect(comparison).toContainText("Array writes: 12");
  await expect(comparison).toContainText("Array writes: 4");
  await expect(comparison).toContainText("Array writes: 9");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("Python sorting labs, focused errors, adaptive remediation, and insights persist", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/lessons/sorting");
  const bubble = page.getByRole("region", {
    name: "Implement optimized bubble sort",
    exact: true,
  });
  await bubble.getByRole("button", { name: "Run Tests" }).click();
  await expect(
    bubble.getByRole("region", { name: "Execution result" }),
  ).toContainText("authored checks found failures", { timeout: 40000 });
  await bubble
    .getByLabel("Python source", { exact: true })
    .fill(sortingSolutions["sorting-bubble"]);
  await bubble.getByRole("button", { name: "Run Tests" }).click();
  await expect(
    bubble.getByRole("region", { name: "Execution result" }),
  ).toContainText("Program completed successfully", { timeout: 40000 });
  const stable = page.getByRole("region", {
    name: "Repair an insertion stability defect",
    exact: true,
  });
  await stable
    .getByLabel("Python source", { exact: true })
    .fill(sortingSolutions["sorting-insertion-stability"]);
  await stable.getByRole("button", { name: "Run Tests" }).click();
  await expect(
    stable.getByRole("region", { name: "Execution result" }),
  ).toContainText("Program completed successfully", { timeout: 40000 });
  const check = page.locator(".knowledge-check");
  await check.locator("fieldset").nth(0).getByRole("radio").nth(1).check();
  await check.locator("fieldset").nth(1).getByRole("radio").nth(1).check();
  await check.locator("fieldset").nth(2).getByRole("radio").nth(1).check();
  await check.getByRole("button", { name: "Check answers" }).click();
  await expect(check).toContainText("Not quite.");
  const initialRecords = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "{}").records ?? [],
    evidenceKey,
  );
  expect(initialRecords).toContainEqual(
    expect.objectContaining({ activityId: "sorting-q1", correct: false }),
  );
  expect(initialRecords).toContainEqual(
    expect.objectContaining({ activityId: "sorting-bubble", correct: true }),
  );
  await page.goto("/practice/adaptive?skill=bubble-invariant");
  const first = selectAdaptiveProblem({
    records: [],
    now: Date.now(),
    seed: 0,
    manualSkill: "bubble-invariant",
  })!.instance;
  await expect(page.getByRole("heading", { name: first.prompt })).toBeVisible();
  const wrong = first.options.find((_, i) => i !== first.correctIndex)!;
  await page.getByRole("radio", { name: wrong.text, exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(
    page.getByText(wrong.misconception!, { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Review the lesson explanation/ }),
  ).toHaveAttribute("href", "/lessons/sorting");
  await page.getByRole("button", { name: "New related variation" }).click();
  const second = selectAdaptiveProblem({
    records: [],
    now: Date.now(),
    seed: 1,
    manualSkill: "bubble-invariant",
    recent: [first.id],
  })!.instance;
  expect(second.id).not.toBe(first.id);
  await expect(
    page.getByRole("heading", { name: second.prompt }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Show a hint" }).click();
  await page
    .getByRole("radio", {
      name: second.options[second.correctIndex].text,
      exact: true,
    })
    .check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(
    page.getByText(/not recorded as independent positive evidence/),
  ).toBeVisible();
  const records = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "{}").records ?? [],
    evidenceKey,
  );
  expect(
    records.filter((entry: { activityId: string }) =>
      entry.activityId.startsWith("adaptive-sorting-bubble"),
    ),
  ).toHaveLength(1);
  await page.reload();
  await expect(
    page.getByText(/Session: 2 of 5 submitted problems/),
  ).toBeVisible();
  await page.goto("/learning");
  await expect(
    page.getByText("Bubble sorted suffix: Needs review"),
  ).toBeVisible();
  await page.goto("/lessons/sorting");
  await expect(bubble.getByLabel("Python source", { exact: true })).toHaveValue(
    sortingSolutions["sorting-bubble"],
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
