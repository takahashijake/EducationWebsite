import { expect, test } from "@playwright/test";
import { fundamentalsAssessment } from "../src/content/assessments";
const key = "cs-fundamentals:evidence:v1";
test("assessment evidence persists, retry appends, dashboard updates across tabs, and clearing preserves reading", async ({
  page,
  context,
}) => {
  await page.goto("/assessments/programming-fundamentals");
  await page.evaluate(() =>
    localStorage.setItem(
      "cs-fundamentals:progress:v1",
      '{"version":1,"completed":["loops"]}',
    ),
  );
  await page.evaluate(() =>
    localStorage.setItem(
      "cs-fundamentals:workspace:v1:lesson:loops:loops-inclusive-sum",
      '{"version":1,"workspaceId":"lesson:loops:loops-inclusive-sum","source":"print(42)"}',
    ),
  );
  for (const [i, q] of fundamentalsAssessment.questions.entries())
    await page
      .locator(".knowledge-check fieldset")
      .nth(i)
      .getByLabel(
        q.options[
          i === 3 ? (q.correctIndex + 1) % q.options.length : q.correctIndex
        ],
        { exact: true },
      )
      .check();
  await page.getByRole("button", { name: "Submit assessment" }).click();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? "{}").records.length,
      key,
    ),
  ).toBe(12);
  await page.getByRole("button", { name: "Retry assessment" }).click();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? "{}").records.length,
      key,
    ),
  ).toBe(12);
  const other = await context.newPage();
  await other.goto("/learning");
  await expect(
    other.getByText("12 recorded activity observations"),
  ).toBeVisible();
  await expect(
    other.getByText("1 of 7 Programming Fundamentals lessons marked read"),
  ).toBeVisible();
  await page.goto("/practice/retrieval?question=retrieve-loop-boundary-a");
  await page.getByLabel("[1, 3, 5]", { exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(
    other.getByText("13 recorded activity observations"),
  ).toBeVisible();
  await other.reload();
  await expect(
    other.getByText("13 recorded activity observations"),
  ).toBeVisible();
  await other.getByRole("button", { name: "Clear learning evidence…" }).click();
  await expect(
    other.getByRole("button", { name: "Keep evidence" }),
  ).toBeFocused();
  await other
    .getByRole("button", { name: "Clear learning evidence", exact: true })
    .click();
  await expect(
    other.getByText("0 recorded activity observations"),
  ).toBeVisible();
  expect(
    await other.evaluate(() =>
      localStorage.getItem("cs-fundamentals:progress:v1"),
    ),
  ).toContain("loops");
  expect(
    await other.evaluate(() =>
      localStorage.getItem(
        "cs-fundamentals:workspace:v1:lesson:loops:loops-inclusive-sum",
      ),
    ),
  ).toContain("print(42)");
});
test("delayed review becomes due and recommends a direct activity", async ({
  page,
}) => {
  await page.goto("/learning");
  await page.evaluate(
    (key) =>
      localStorage.setItem(
        key,
        JSON.stringify({
          version: 1,
          records: [
            {
              attemptId: "previous-001",
              activityId: "variables-q2",
              source: "lesson",
              correct: true,
              at: "2026-01-01T00:00:00.000Z",
              revision: 1,
            },
          ],
        }),
      ),
    key,
  );
  await page.reload();
  await expect(
    page.getByText("Scheduled review is due", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Due for review" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Start recommended practice" }).click();
  await expect(page).toHaveURL(/\/practice\/retrieval/);
  await page.getByLabel("3", { exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.locator(".retrieval-practice [role=status]")).toBeFocused();
  await page.getByRole("link", { name: "Return to learning insights" }).click();
  await expect(
    page.getByText("Delayed retrieval completed", { exact: false }),
  ).toBeVisible();
});
test("rapid retries do not advance a completed spaced review", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-01-02T00:10:00.000Z") });
  await page.goto("/learning");
  await page.evaluate((key) => {
    const items = [
      ["variables-q2", "lesson", "2026-01-01T00:00:00.000Z"],
      ["retrieve-assignment-a", "retrieval", "2026-01-02T00:00:00.000Z"],
      ["retrieve-assignment-a", "retrieval", "2026-01-02T00:02:00.000Z"],
      ["retrieve-assignment-b", "retrieval", "2026-01-02T00:05:00.000Z"],
    ];
    localStorage.setItem(
      key,
      JSON.stringify({
        version: 1,
        records: items.map(([activityId, source, at], index) => ({
          attemptId: `rapid-00${index}`,
          activityId,
          source,
          correct: true,
          at,
          revision: 1,
        })),
      }),
    );
  }, key);
  await page.reload();
  await expect(
    page.getByText("No review is due yet", { exact: false }),
  ).toBeVisible();
  await page.clock.setFixedTime(new Date("2026-01-05T00:00:00.000Z"));
  await page.reload();
  await expect(
    page.getByText("Scheduled review is due", { exact: false }),
  ).toBeVisible();
});
test("storage-denied assessment and keyboard retrieval remain usable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "cs-fundamentals:evidence:v1")
        throw new DOMException("Denied", "QuotaExceededError");
      return original.call(this, key, value);
    };
  });
  await page.goto("/practice/retrieval");
  const choices = page.locator(".retrieval-practice input[type=radio]");
  await choices.first().focus();
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.locator(".retrieval-practice [role=alert]")).toContainText(
    "session only",
  );
  await page.getByRole("link", { name: "Return to learning insights" }).click();
  await expect(
    page.getByText("1 recorded activity observations"),
  ).toBeVisible();
  await expect(page.locator(".insights-grid [role=alert]")).toContainText(
    "session only",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test("transfer challenge runs actual Python public checks", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto("/practice/transfer");
  const lab = page.getByRole("region", {
    name: "Expense summary: transfer challenge",
  });
  await expect(lab.getByText("Hint 1:", { exact: false })).toHaveCount(0);
  await lab.getByRole("button", { name: "Reveal next hint" }).click();
  await expect(lab.getByText("Hint 1:", { exact: false })).toBeVisible();
  await expect(lab.getByText("Hint 2:", { exact: false })).toHaveCount(0);
  await lab.getByRole("button", { name: "Run", exact: true }).click();
  await expect(
    lab.getByRole("region", { name: "Execution result" }),
  ).toContainText("Program completed successfully", { timeout: 40000 });
  expect(
    await page.evaluate((key) => localStorage.getItem(key), key),
  ).toBeNull();
  await lab.getByRole("button", { name: "Run Tests" }).click();
  await expect(lab.getByRole("region", { name: "Test result" })).toContainText(
    "0 passed",
    { timeout: 40000 },
  );
  expect(
    (
      await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key) ?? "{}").records,
        key,
      )
    ).some(
      (r: { activityId: string; correct: boolean }) =>
        r.activityId === "python-expense-summary" && !r.correct,
    ),
  ).toBe(true);
  await lab
    .getByLabel("Python source", { exact: true })
    .fill(
      "def summarize_expenses(amounts, limit):\n    if limit < 0: raise ValueError('limit')\n    total = 0\n    for amount in amounts:\n        if amount < 0: raise ValueError('amount')\n        total += amount\n    return total, total > limit\n",
    );
  await lab.getByRole("button", { name: "Run Tests" }).click();
  await expect(lab.getByRole("region", { name: "Test result" })).toContainText(
    "5 passed",
    { timeout: 60000 },
  );
  expect(
    (
      await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key) ?? "{}").records,
        key,
      )
    ).some(
      (r: { activityId: string; correct: boolean }) =>
        r.activityId === "python-expense-summary" && r.correct,
    ),
  ).toBe(false); // A revealed hint makes the passing check assisted practice.
  await expect(lab).toContainText(
    "not recorded as independent positive concept evidence",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
