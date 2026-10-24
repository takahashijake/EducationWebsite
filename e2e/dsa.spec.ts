import { expect, test } from "@playwright/test";
const evidenceKey = "cs-fundamentals:evidence:v1";
const progressKey = "cs-fundamentals:progress:v1";
test("roadmap to DSA, stepper, knowledge evidence, Python repair, insight, and persistence", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/roadmap");
  await page.evaluate(
    (key) =>
      localStorage.setItem(
        key,
        JSON.stringify({ version: 1, completed: ["loops"] }),
      ),
    progressKey,
  );
  await page
    .getByRole("link", { name: /Arrays and Strings/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/lessons\/arrays-strings/);
  const traversal = page.locator(".algorithm-visualizer");
  await expect(traversal).toContainText("Array traversal");
  await traversal.getByRole("button", { name: "Next step" }).focus();
  await page.keyboard.press("Enter");
  await expect(traversal).toContainText("Step 2 of");
  await traversal.getByLabel("Choose input scenario").selectOption("empty");
  await expect(traversal).toContainText("Step 1 of");
  await expect(traversal).toContainText("No elements in this scenario");
  await traversal.getByRole("button", { name: "Next step" }).click();
  await expect(traversal).toContainText("Visited 0 elements");
  await traversal.getByRole("button", { name: "Reset" }).click();
  await page.goto("/lessons/searching");
  await expect(
    page.getByRole("link", { name: /Arrays and Strings/ }).first(),
  ).toBeVisible();
  const binary = page.locator(".algorithm-visualizer").first();
  const linear = page.locator(".algorithm-visualizer").nth(1);
  await binary.getByLabel("Choose input scenario").selectOption("duplicate");
  await binary.getByRole("button", { name: "Next step" }).click();
  await expect(binary).toContainText("Found at index 2");
  await linear.getByLabel("Choose input scenario").selectOption("duplicate");
  await linear.getByRole("button", { name: "Next step" }).click();
  await expect(linear).toContainText("Found at index 0");
  const check = page.locator(".knowledge-check");
  await check.getByLabel("Unique values", { exact: true }).check();
  await check.getByLabel("0", { exact: true }).check();
  await check
    .getByLabel("It halves the possible interval after each mismatch", {
      exact: true,
    })
    .check();
  await check.getByRole("button", { name: "Check answers" }).click();
  const recorded = await page.evaluate(
    (key) =>
      JSON.parse(localStorage.getItem(key) ?? "{}").records?.map(
        (entry: { activityId: string; correct: boolean }) => [
          entry.activityId,
          entry.correct,
        ],
      ),
    evidenceKey,
  );
  expect(recorded).toContainEqual(["searching-q1", false]);
  const lab = page.getByRole("region", {
    name: "Implement linear search",
    exact: true,
  });
  await lab.getByRole("button", { name: "Run Tests" }).click();
  await expect(
    lab.getByRole("region", { name: "Execution result" }),
  ).toContainText("authored checks found failures", { timeout: 40000 });
  const solution =
    "def linear_search(values, target):\n    for index, value in enumerate(values):\n        if value == target:\n            return index\n    return -1";
  await lab.getByLabel("Python source", { exact: true }).fill(solution);
  await lab.getByRole("button", { name: "Run Tests" }).click();
  await expect(
    lab.getByRole("region", { name: "Execution result" }),
  ).toContainText("Program completed successfully", { timeout: 40000 });
  await page.goto("/learning");
  await expect(
    page.getByText("Sorted-input precondition: Needs review"),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Start recommended practice/ }),
  ).toHaveAttribute("href", /retrieve-sorted-precondition/);
  await expect(
    page.getByText("1 of 7 Programming Fundamentals lessons marked read"),
  ).toBeVisible();
  await expect(
    page.getByText("0 of 1 Data Structures lessons marked read"),
  ).toBeVisible();
  await expect(
    page.getByText("0 of 2 Algorithms lessons marked read"),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Introduction to Big O Notation" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Sorted-input precondition: Needs review"),
  ).toBeVisible();
  await page.goto("/lessons/searching");
  await expect(
    page
      .getByRole("region", { name: "Implement linear search", exact: true })
      .getByLabel("Python source", { exact: true }),
  ).toHaveValue(solution);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("reduced motion keeps keyboard stepping available without playback", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/lessons/arrays-strings");
  const traversal = page.locator(".algorithm-visualizer");
  await expect(traversal.getByRole("button", { name: "Play" })).toBeDisabled();
  await traversal.getByRole("button", { name: "Next step" }).focus();
  await page.keyboard.press("Enter");
  await expect(traversal).toContainText("Step 2 of");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("playback stops at the end and a scenario change cancels pending steps", async ({
  page,
}) => {
  await page.goto("/lessons/arrays-strings");
  const traversal = page.locator(".algorithm-visualizer");
  await traversal.getByRole("button", { name: "Play" }).click();
  await traversal.getByLabel("Choose input scenario").selectOption("singleton");
  await page.waitForTimeout(1100);
  await expect(traversal).toContainText("Step 1 of 3");
  await traversal.getByRole("button", { name: "Play" }).click();
  await expect(traversal).toContainText("Step 3 of 3", { timeout: 4000 });
  await expect(traversal.getByRole("button", { name: "Play" })).toBeDisabled();
  await traversal.getByRole("button", { name: "Reset" }).click();
  await expect(traversal).toContainText("Step 1 of 3");
});
