import { expect, test } from "@playwright/test";
import { selectAdaptiveProblem } from "../src/lib/adaptive-selection";

const evidenceKey = "cs-fundamentals:evidence:v1";
const sessionKey = "cs-fundamentals:adaptive-session:v1";
const initial = (skill?: string) =>
  selectAdaptiveProblem({
    records: [],
    now: Date.now(),
    seed: 0,
    manualSkill: skill,
  })!.instance;

test("a new learner completes independent practice and keeps evidence on reload", async ({
  page,
}) => {
  await page.goto("/learning");
  await page.getByRole("link", { name: "Start adaptive practice" }).click();
  await expect(page).toHaveURL(/\/practice\/adaptive/);
  const question = initial();
  await expect(
    page.getByRole("heading", { name: question.prompt }),
  ).toBeVisible();
  await page
    .getByRole("radio", {
      name: question.options[question.correctIndex].text,
      exact: true,
    })
    .check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByText("Correct answer.")).toBeVisible();
  const records = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "{}").records ?? [],
    evidenceKey,
  );
  expect(records).toHaveLength(1);
  expect(records[0]).toMatchObject({
    activityId: `adaptive-${question.familyId}`,
    correct: true,
    source: "retrieval",
    revision: 1,
  });
  await page.getByRole("button", { name: /Try related concept/ }).click();
  await expect(page.locator(".adaptive-practice .eyebrow")).toContainText(
    "Exclusive loop boundaries",
  );
  await page.reload();
  await expect(
    page.getByText(/Session: 1 of 5 submitted problems/),
  ).toBeVisible();
  await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
  await page.goto("/learning");
  await expect(
    page.getByText("Inclusive comparisons: Practicing"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear learning evidence…" }).click();
  await page
    .getByRole("button", { name: "Clear learning evidence", exact: true })
    .click();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), evidenceKey),
  ).toBeNull();
  expect(
    (
      await page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key) ?? "{}"),
        sessionKey,
      )
    ).session.total,
  ).toBe(1);
});

test("a wrong answer gives authored remediation, then a fresh assisted variation", async ({
  page,
}) => {
  await page.goto("/practice/adaptive?skill=binary-invariants");
  const first = initial("binary-invariants");
  const wrong = first.options.find((_, index) => index !== first.correctIndex)!;
  await page.getByRole("radio", { name: wrong.text, exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByText("Review this boundary.")).toBeVisible();
  await expect(
    page.getByText(wrong.misconception!, { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Review the lesson explanation/ }),
  ).toHaveAttribute("href", "/lessons/searching");
  const firstRecord = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "{}").records ?? [],
    evidenceKey,
  );
  expect(firstRecord).toHaveLength(1);
  expect(firstRecord[0].correct).toBe(false);
  await page.getByRole("button", { name: "New related variation" }).click();
  const second = selectAdaptiveProblem({
    records: [],
    now: Date.now(),
    seed: 1,
    manualSkill: "binary-invariants",
    recent: [first.id],
  })!.instance;
  expect(second.id).not.toBe(first.id);
  await expect(
    page.getByRole("heading", { name: second.prompt }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Show a hint" }).click();
  await expect(page.getByText(/Hint 1:/)).toBeVisible();
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
  const later = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "{}").records ?? [],
    evidenceKey,
  );
  expect(later).toHaveLength(1);
  await expect(
    page.getByText(/Session: 2 of 5 submitted problems/),
  ).toBeVisible();
});

test("five submissions produce a cautious summary that survives reload", async ({
  page,
}) => {
  await page.goto("/practice/adaptive");
  for (let index = 0; index < 5; index++) {
    await page.getByRole("radio").first().check();
    await page.getByRole("button", { name: "Check answer" }).click();
    await expect(
      page.getByText(new RegExp(`Session: ${index + 1} of 5`)),
    ).toBeVisible();
    if (index < 4)
      await page
        .getByRole("button", { name: "Next recommended problem" })
        .click();
  }
  await expect(
    page.getByRole("heading", { name: "Session summary" }),
  ).toBeVisible();
  await expect(
    page.getByText(/You submitted 5 focused problems/),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Session summary" }),
  ).toBeVisible();
  const saved = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "{}"),
    sessionKey,
  );
  expect(saved).toMatchObject({ version: 1, session: { total: 5 } });
  await page
    .getByRole("button", { name: "Start another five-question session" })
    .click();
  await expect(
    page.getByText(/Session: 0 of 5 submitted problems/),
  ).toBeVisible();
  await page.getByLabel("Choose a concept").selectOption("sequence-traversal");
  await expect(page.locator(".adaptive-practice .eyebrow")).toContainText(
    "Sequence traversal",
  );
});

test("malformed skill queries and denied storage preserve keyboard and mobile practice", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (
        key === "cs-fundamentals:evidence:v1" ||
        key === "cs-fundamentals:adaptive-session:v1"
      )
        throw new DOMException("Blocked", "SecurityError");
      return original.call(this, key, value);
    };
  });
  await page.goto("/practice/adaptive?skill=unsupported-value");
  await expect(
    page.getByRole("heading", { name: "Adaptive practice" }),
  ).toBeVisible();
  await page.getByRole("radio").first().focus();
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: "Check answer" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".adaptive-practice [role='alert']")).toContainText(
    "Browser storage is unavailable",
  );
  await page.getByRole("button", { name: "Next recommended problem" }).click();
  await expect(page.getByRole("radio").first()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.goto("/practice/adaptive?skill=linear-search");
  await expect(page.locator(".adaptive-practice .eyebrow")).toContainText(
    "Linear search",
  );
  await page.goto("/practice/adaptive?skill=sequence-traversal");
  await expect(page.locator(".adaptive-practice .eyebrow")).toContainText(
    "Sequence traversal",
  );
  await page.goBack();
  await expect(page.locator(".adaptive-practice .eyebrow")).toContainText(
    "Linear search",
  );
});
