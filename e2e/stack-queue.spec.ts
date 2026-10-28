import { test, expect } from "@playwright/test";
import { stackQueueSolutions } from "../src/content/stack-queue-solutions";
import { selectAdaptiveProblem } from "../src/lib/adaptive-selection";

test("stack and queue player supports operations, review, and keyboard", async ({
  page,
}) => {
  await page.goto("/lessons/stacks-queues");
  const player = page.getByRole("figure", {
    name: "Stack and queue operation player",
  });
  await expect(player).toBeVisible();
  await player.getByLabel("Scenario").selectOption("queue-boundary");
  await player.getByRole("button", { name: "Next step" }).click();
  await expect(player).toContainText("front/head → null · rear/tail → null");
  await player.getByRole("button", { name: "Next step" }).click();
  await player.getByRole("button", { name: "Next step" }).click();
  await expect(player.getByRole("status")).toContainText(
    "tail also becomes null",
  );
  await player.getByRole("button", { name: "Previous step" }).click();
  await expect(player).toContainText("front and rear");
  await player.getByRole("button", { name: "Reset review" }).click();
  await expect(player.getByRole("status")).toContainText("Step 1");
  await player.getByLabel("Structure").selectOption("stack");
  await player.getByLabel("Value to insert").fill("A");
  await player.getByRole("button", { name: "Push" }).click();
  await expect(player.getByRole("status")).toContainText("Push A");
  await player.getByRole("button", { name: "Pop" }).click();
  await expect(player.getByRole("status")).toContainText("Result: A");
  await player.getByRole("button", { name: "Reset sequence" }).focus();
  await page.keyboard.press("Enter");
  await expect(player.getByRole("status")).toContainText("Initial state");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("stack and queue lesson and code labs remain available after reload", async ({
  page,
}) => {
  await page.goto("/lessons/stacks-queues");
  await expect(page.getByText("Validate balanced delimiters")).toBeVisible();
  await expect(page.getByText("Process tasks in arrival order")).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("figure", { name: "Stack and queue operation player" }),
  ).toBeVisible();
});

test("stack/queue transfer labs separate assisted evidence and preserve drafts", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/lessons/stacks-queues");
  const assisted = page.getByRole("region", {
    name: "Validate balanced delimiters",
    exact: true,
  });
  await assisted.getByRole("button", { name: "Run Tests" }).click();
  await expect(
    assisted.getByRole("region", { name: "Execution result" }),
  ).toContainText("authored checks found failures", { timeout: 40000 });
  await assisted.getByRole("button", { name: "Reveal next hint" }).click();
  await assisted
    .getByLabel("Python source", { exact: true })
    .fill(stackQueueSolutions["sq-delimiters"]);
  await assisted.getByRole("button", { name: "Run Tests" }).click();
  await expect(
    assisted.getByRole("region", { name: "Test result" }),
  ).toContainText("2 passed · 0 failed", { timeout: 40000 });
  await expect(assisted).toContainText(
    "not recorded as independent positive concept evidence",
  );
  const independent = page.getByRole("region", {
    name: "Process tasks in arrival order",
    exact: true,
  });
  await independent
    .getByLabel("Python source", { exact: true })
    .fill(stackQueueSolutions["sq-tasks"]);
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
    expect.objectContaining({ activityId: "sq-delimiters", correct: true }),
  );
  expect(records).toContainEqual(
    expect.objectContaining({ activityId: "sq-tasks", correct: true }),
  );
  await page.reload();
  await expect(
    page
      .getByRole("region", {
        name: "Process tasks in arrival order",
        exact: true,
      })
      .getByLabel("Python source", { exact: true }),
  ).toHaveValue(stackQueueSolutions["sq-tasks"]);
  await page.goto("/learning");
  await expect(
    page.getByText("Applied stack and queue transfer"),
  ).toBeVisible();
});

test("stack mistake opens focused review and assisted variation", async ({
  page,
}) => {
  await page.goto("/practice/adaptive?skill=stack-lifo");
  const first = selectAdaptiveProblem({
    records: [],
    now: Date.now(),
    seed: 0,
    manualSkill: "stack-lifo",
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
  ).toHaveAttribute("href", "/lessons/stacks-queues");
  await page.getByRole("button", { name: "New related variation" }).click();
  await page.getByRole("button", { name: "Show a hint" }).click();
  await expect(page.getByText(/hint/i).first()).toBeVisible();
});
