import { expect, test } from "@playwright/test";
import { availableTopics, topics } from "../src/content/curriculum";

test("learn, check answers, persist completion, and explore a planned topic", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Don’t just learn to code.",
  );
  await page.getByRole("link", { name: /^Start learning$/ }).click();
  await expect(page).toHaveURL("/roadmap");
  await expect(page.locator(".topic-card")).toHaveCount(46);
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "0",
  );
  await page
    .locator(".topic-card")
    .filter({
      has: page.getByRole("heading", {
        name: "Variables and Data Types",
        exact: true,
      }),
    })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Variables and Data Types",
  );
  await page.getByLabel("str", { exact: true }).check();
  await page.getByRole("group").nth(1).getByLabel("5", { exact: true }).check();
  await page.getByLabel('"32"', { exact: true }).check();
  await page.getByRole("button", { name: "Check answers" }).click();
  await expect(page.getByText("3 of 3 correct.")).toBeVisible();
  await page.getByRole("button", { name: "Mark lesson complete" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Completed · Undo" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/roadmap");
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "14",
  );
  await expect(page.locator(".topic-card.completed")).toContainText(
    "Variables and Data Types",
  );
  await page
    .locator(".topic-card")
    .filter({
      has: page.getByRole("heading", { name: "Recursion", exact: true }),
    })
    .click();
  await expect(page.getByText("Planned topic", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /mark lesson complete/i }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("all sample lessons and 404 render without horizontal page overflow", async ({
  page,
}) => {
  for (const { slug, title } of availableTopics) {
    await page.goto(`/lessons/${slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(
      page.locator(".knowledge-check").getByRole("group"),
    ).toHaveCount(3);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  const response = await page.goto("/lessons/does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "This topic isn’t on the map.",
  );
});

test("malformed and planned-only saved progress cannot inflate completion", async ({
  page,
}) => {
  await page.goto("/");
  for (const value of [
    "{bad",
    JSON.stringify({
      version: 1,
      completed: ["recursion", "unknown", "recursion"],
    }),
  ]) {
    await page.evaluate(
      (raw) => localStorage.setItem("cs-fundamentals:progress:v1", raw),
      value,
    );
    await page.goto("/roadmap");
    await expect(page.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );
  }
});

test("every curriculum URL resolves in the production application", async ({
  request,
}) => {
  for (const topic of topics) {
    const response = await request.get(`/lessons/${topic.slug}`);
    expect(response.status(), topic.slug).toBe(200);
  }
});

test("denied storage keeps completion usable and explains the persistence limit", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Storage unavailable", "SecurityError");
    };
  });
  await page.goto("/lessons/variables-data-types");
  await page.getByRole("button", { name: "Mark lesson complete" }).click();
  await expect(
    page.getByRole("button", { name: "Completed · Undo" }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByText(
      "Browser storage is unavailable. Progress is kept for this session only.",
    ),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Mark lesson complete" }),
  ).toHaveAttribute("aria-pressed", "false");
});

test("follow the programming path, trace, practice, check knowledge and retain manual progress", async ({
  page,
}) => {
  await page.goto("/lessons/variables-data-types");
  await page
    .getByRole("link", { name: "Next Lesson: Operators and Expressions" })
    .click();
  await expect(page.getByText("Lesson 2 of 5")).toBeVisible();
  const trace = page.locator(".code-trace");
  while (await trace.getByRole("button", { name: "Next step" }).isEnabled()) {
    await trace.getByRole("button", { name: "Next step" }).click();
  }
  await expect(trace.getByRole("status")).toContainText("The bill is 26");
  await trace.getByRole("button", { name: "Previous step" }).click();
  await expect(trace.getByRole("status")).not.toContainText("Finished");
  await trace.getByRole("button", { name: "Reset trace" }).click();
  await expect(trace.getByRole("status")).toContainText("step 1 of");
  const exercise = page.locator(".practice-exercise").first();
  await exercise.getByLabel("20", { exact: true }).check();
  await exercise.getByRole("button", { name: "Check prediction" }).click();
  await expect(exercise.getByRole("status")).toContainText("Not quite.");
  await exercise.getByRole("button", { name: "Retry exercise" }).click();
  await exercise.getByLabel("14", { exact: true }).check();
  await exercise.getByRole("button", { name: "Check prediction" }).click();
  await expect(exercise.getByRole("status")).toContainText("Correct.");
  await expect(
    page.getByRole("button", { name: "Mark lesson complete" }),
  ).toHaveAttribute("aria-pressed", "false");
  const quiz = page.locator(".knowledge-check");
  await quiz.getByLabel("x == 4", { exact: true }).check();
  await quiz.getByLabel("2", { exact: true }).check();
  await quiz.getByLabel("True", { exact: true }).check();
  await quiz.getByRole("button", { name: "Check answers" }).click();
  await expect(quiz.getByRole("status")).toContainText("3 of 3 correct");
  await page.getByRole("button", { name: "Mark lesson complete" }).click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Completed · Undo" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("link", { name: "Next Lesson: Conditionals" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Conditionals",
  );
  const conditional = page.locator(".code-trace");
  await conditional.getByRole("button", { name: "Next step" }).click();
  await expect(conditional.getByRole("status")).toContainText("branch skipped");
  await conditional.getByRole("button", { name: "Next step" }).click();
  await expect(conditional.getByRole("status")).toContainText(
    "Selected branch: elif score >= 60",
  );
  await page.goto("/lessons/recursion");
  await expect(page.getByText("Planned topic", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Mark lesson complete" }),
  ).toHaveCount(0);
});

for (const slug of ["loops", "functions"]) {
  test(`${slug} trace shows local state, final output, reset and mobile containment`, async ({
    page,
  }) => {
    await page.goto(`/lessons/${slug}`);
    const trace = page.locator(".code-trace");
    for (let i = 0; i < 3; i++)
      await trace.getByRole("button", { name: "Next step" }).click();
    await expect(trace.getByRole("status")).toContainText(
      slug === "loops" ? "Iteration 2" : "add_fee call",
    );
    while (await trace.getByRole("button", { name: "Next step" }).isEnabled())
      await trace.getByRole("button", { name: "Next step" }).click();
    await expect(trace.getByRole("status")).toContainText(
      slug === "loops" ? "Three iterations accumulate 6" : "returned value 12",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await trace.getByRole("button", { name: "Reset trace" }).click();
    await expect(trace.getByRole("status")).toContainText("step 1 of");
    await expect(
      trace.getByRole("button", { name: "Previous step" }),
    ).toBeDisabled();
  });
}
