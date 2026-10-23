import { expect, test } from "@playwright/test";
import { fundamentalsAssessment as assessment } from "../src/content/assessments";
test("assessment links from the learning path, scores, retries, resets on reload and preserves progress", async ({
  page,
}) => {
  await page.goto("/roadmap");
  const readingKey = "cs-fundamentals:progress:v1";
  const projectKey = "cs-fundamentals:project:v1:number-guessing";
  await page.evaluate(
    ({ readingKey, projectKey }) => {
      localStorage.setItem(
        readingKey,
        '{"version":1,"completed":["recursion"]}',
      );
      localStorage.setItem(
        projectKey,
        '{"version":1,"projectId":"number-guessing","answers":{},"checked":[]}',
      );
    },
    { readingKey, projectKey },
  );
  const before = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  await page
    .getByRole("link", { name: "Take the integrated fundamentals assessment" })
    .click();
  const submit = page.getByRole("button", { name: "Submit assessment" });
  await expect(submit).toBeDisabled();
  await expect(page.getByText(assessment.questions[0].explanation)).toHaveCount(
    0,
  );
  for (const [i, q] of assessment.questions.entries()) {
    const answer =
      i === 8 ? (q.correctIndex + 1) % q.options.length : q.correctIndex;
    await page
      .locator(".knowledge-check fieldset")
      .nth(i)
      .getByLabel(q.options[answer], { exact: true })
      .check();
  }
  await submit.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("11 of 12 correct");
  await expect(
    page.getByRole("link", { name: "Review Recursion", exact: true }),
  ).toHaveAttribute("href", "/lessons/recursion");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).toBe(
    before,
  );
  await page.getByRole("button", { name: "Retry assessment" }).click();
  await expect(submit).toBeDisabled();
  await expect(page.locator(".knowledge-check input:checked")).toHaveCount(0);
  for (const [i, q] of assessment.questions.entries())
    await page
      .locator(".knowledge-check fieldset")
      .nth(i)
      .getByLabel(q.options[q.correctIndex], { exact: true })
      .check();
  await submit.click();
  await expect(page.getByRole("status")).toContainText("12 of 12 correct");
  await page.reload();
  await expect(submit).toBeDisabled();
  await expect(page.getByRole("status")).toHaveCount(0);
});
