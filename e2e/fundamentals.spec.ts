import { expect, test, type Page } from "@playwright/test";
import { fundamentalsAssessment } from "../src/content/assessments";
import { numberGuessingProject } from "../src/content/projects";
const lessonKey = "cs-fundamentals:progress:v1";
const projectKey = "cs-fundamentals:project-progress:v1";
async function contained(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}

test("reason through recursion, debug, build checkpoints, assess, and preserve lesson progress", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/roadmap#programming");
  await page.evaluate(
    (key) =>
      localStorage.setItem(
        key,
        JSON.stringify({ version: 1, completed: ["variables-data-types"] }),
      ),
    lessonKey,
  );
  await page.reload();
  const path = page.getByRole("navigation", {
    name: "Programming core learning path",
  });
  await path.getByRole("link", { name: "Recursion", exact: true }).click();
  await expect(page.getByText("Lesson 6 of 7")).toBeVisible();
  const trace = page.locator(".code-trace");
  const next = trace.getByRole("button", { name: "Next step" });
  await next.focus();
  await page.keyboard.press("Enter");
  const stack = trace.getByRole("region", { name: "Call stack" });
  await expect(stack).toContainText("Stack event: push");
  for (let i = 0; i < 4; i++) await next.click();
  await expect(stack).toContainText("Stack event: base");
  await expect(stack.getByRole("listitem")).toHaveCount(4);
  await next.click();
  await expect(stack).toContainText("Returning 1");
  await next.click();
  await expect(stack.getByRole("listitem")).toHaveCount(3);
  await trace.getByRole("button", { name: "Previous step" }).click();
  await expect(stack.getByRole("listitem")).toHaveCount(4);
  await contained(page);
  const exercise = page.locator(".practice-exercise").first();
  await exercise.getByLabel("6", { exact: true }).check();
  await exercise.getByRole("button", { name: "Check prediction" }).click();
  await expect(exercise.getByRole("status")).toContainText("Correct.");
  await page.getByRole("button", { name: "Mark lesson complete" }).click();
  await page
    .getByRole("link", { name: "Next Lesson: Basic Debugging" })
    .click();
  const diagnosis = page.locator(".practice-exercise").first();
  await diagnosis
    .getByLabel("Always return True so 18 passes", { exact: true })
    .check();
  await diagnosis.getByRole("button", { name: "Check prediction" }).click();
  await expect(diagnosis.getByRole("status")).toContainText(
    "wrongly admits 17",
  );
  await diagnosis.getByRole("button", { name: "Retry exercise" }).click();
  await diagnosis
    .getByLabel("The comparison excludes 18; use age >= 18", { exact: true })
    .check();
  await diagnosis.getByRole("button", { name: "Check prediction" }).click();
  await expect(diagnosis.getByRole("status")).toContainText("Correct.");
  await contained(page);
  const before = await page.evaluate(
    (key) => localStorage.getItem(key),
    lessonKey,
  );
  await page
    .getByRole("link", { name: "Build a Number Guessing Game", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    numberGuessingProject.title,
  );
  for (const checkpoint of numberGuessingProject.checkpoints.slice(0, 5)) {
    await expect(
      page.getByRole("heading", {
        level: 2,
        name: checkpoint.title,
        exact: true,
      }),
    ).toBeVisible();
    const choice = checkpoint.exercise!;
    const form = page.locator(".practice-exercise");
    await expect(
      page.getByRole("button", { name: "Mark checkpoint complete" }),
    ).toBeDisabled();
    await form
      .getByLabel(choice.options[choice.correctIndex], { exact: true })
      .check();
    await form.getByRole("button", { name: "Check prediction" }).click();
    await page
      .getByRole("button", { name: "Mark checkpoint complete" })
      .click();
    await expect(
      page.getByRole("button", { name: "Checkpoint completed · Undo" }),
    ).toHaveAttribute("aria-pressed", "true");
    await contained(page);
    await page.getByRole("button", { name: "Next checkpoint" }).click();
  }
  await expect(page.getByText(/Checkpoints completed: 5 of 6/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Checkpoints completed: 5 of 6/)).toBeVisible();
  await page.getByRole("button", { name: /6\. Review and extend/ }).click();
  await expect(
    page.getByRole("heading", { name: "Review and extend", exact: true }),
  ).toBeFocused();
  await contained(page);
  await page
    .getByRole("link", { name: "Take the integrated fundamentals assessment" })
    .click();
  await expect(
    page.getByRole("button", { name: "Submit assessment" }),
  ).toBeDisabled();
  for (const [index, q] of fundamentalsAssessment.questions.entries()) {
    const answer =
      index === 8 ? (q.correctIndex + 1) % q.options.length : q.correctIndex;
    await page
      .getByRole("group")
      .nth(index)
      .getByLabel(q.options[answer], { exact: true })
      .check();
  }
  await contained(page);
  await page.getByRole("button", { name: "Submit assessment" }).click();
  await expect(page.getByRole("status")).toContainText("11 of 12 correct");
  await expect(
    page.getByRole("link", { name: "Review Recursion", exact: true }),
  ).toHaveAttribute("href", "/lessons/recursion");
  await contained(page);
  await page.getByRole("button", { name: "Retry assessment" }).click();
  await expect(
    page.getByRole("button", { name: "Submit assessment" }),
  ).toBeDisabled();
  expect(
    await page
      .getByRole("radio")
      .evaluateAll((radios) =>
        radios.every((radio) => !(radio as HTMLInputElement).checked),
      ),
  ).toBe(true);
  await page
    .getByRole("link", { name: "Return to the roadmap", exact: true })
    .click();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), lessonKey),
  ).toBe(before);
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "22",
  );
  await expect(page.locator(".topic-card.completed")).toHaveCount(2);
  expect(errors).toEqual([]);
});

test("malformed project progress is ignored and assessment attempts remain session-only", async ({
  page,
}) => {
  await page.goto("/");
  for (const raw of [
    "{bad",
    JSON.stringify({
      version: 2,
      projectId: "number-guessing",
      completed: ["logic"],
    }),
    JSON.stringify({ version: 1, projectId: "other", completed: ["logic"] }),
  ]) {
    await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), {
      key: projectKey,
      raw,
    });
    await page.goto("/projects/number-guessing");
    await expect(page.getByText(/Checkpoints completed: 0 of 6/)).toBeVisible();
  }
  await page.goto("/assessments/programming-fundamentals");
  for (const [i, q] of fundamentalsAssessment.questions.entries())
    await page
      .getByRole("group")
      .nth(i)
      .getByLabel(q.options[q.correctIndex], { exact: true })
      .check();
  await page.getByRole("button", { name: "Submit assessment" }).click();
  await expect(page.getByRole("status")).toContainText("12 of 12 correct");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Submit assessment" }),
  ).toBeDisabled();
  await expect(page.getByRole("status")).toHaveCount(0);
  expect(
    await page.evaluate((key) => localStorage.getItem(key), lessonKey),
  ).toBeNull();
});

test("denied project storage retains usable session progress and explains persistence", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException("Denied", "SecurityError");
    };
    Storage.prototype.setItem = () => {
      throw new DOMException("Denied", "SecurityError");
    };
  });
  await page.goto("/projects/number-guessing");
  await page
    .locator(".practice-exercise")
    .getByLabel("attempts", { exact: true })
    .check();
  await page.getByRole("button", { name: "Check prediction" }).click();
  await page.getByRole("button", { name: "Mark checkpoint complete" }).click();
  await expect(page.getByText(/Checkpoints completed: 1 of 6/)).toBeVisible();
  await expect(
    page.getByText(
      "Browser storage is unavailable. Project progress is kept for this session only.",
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next checkpoint" }).click();
  await page.getByRole("button", { name: "Previous checkpoint" }).click();
  await expect(
    page.getByRole("button", { name: "Checkpoint completed · Undo" }),
  ).toBeEnabled();
  await page.reload();
  await expect(page.getByText(/Checkpoints completed: 0 of 6/)).toBeVisible();
});
