import { expect, test } from "@playwright/test";
import { projects } from "../src/content/projects";
import { lessons } from "../src/content/lessons";
const project = projects[0];
const legacyKey = "cs-fundamentals:progress:v1";
const projectKey = "cs-fundamentals:project:v1:number-guessing";
const legacy = JSON.stringify({
  version: 1,
  completed: ["variables-data-types", "functions"],
});

test("recursive stack and debugging boundary scenarios replay correctly with keyboard controls", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/lessons/recursion");
  const trace = page.locator(".code-trace");
  const next = trace.getByRole("button", { name: "Next step" });
  await next.focus();
  await page.keyboard.press("Enter");
  await expect(
    trace.getByRole("region", { name: "Call frames" }),
  ).toContainText("factorial(3) · active");
  while (await next.isEnabled()) await next.click();
  await expect(trace.getByRole("status").locator("pre")).toHaveText("6");
  await expect(
    trace.getByRole("region", { name: "Call frames" }).getByRole("listitem"),
  ).toHaveCount(1);
  for (const [id, output] of [
    ["n-0", "1"],
    ["n-1", "1"],
    ["n-4", "24"],
  ]) {
    await trace.getByRole("combobox").selectOption(id);
    await expect(trace.getByRole("status")).toContainText("step 1 of");
    while (await next.isEnabled()) await next.click();
    await expect(trace.getByRole("status").locator("pre")).toHaveText(output);
  }
  await page
    .getByRole("link", { name: "Next Lesson: Basic Debugging" })
    .click();
  for (const [id, output, verdict] of [
    ["", "3", "Buggy"],
    ["fixed-3", "6", "Fixed"],
    ["buggy-1", "0", "Buggy"],
    ["fixed-1", "1", "Fixed"],
  ]) {
    await trace.getByRole("combobox").selectOption(id);
    while (await next.isEnabled()) await next.click();
    await expect(trace.getByRole("status").locator("pre")).toHaveText(output);
    await expect(trace.getByRole("status")).toContainText(
      `${verdict} boundary`,
    );
  }
  const exercise = page.locator(".practice-exercise").last();
  const question = lessons.debugging.exercises!.at(-1)!;
  await exercise.getByLabel(question.options[1]).check();
  await exercise.getByRole("button", { name: "Check prediction" }).click();
  await expect(exercise.getByRole("status")).toContainText("Not quite.");
  await expect(exercise.getByRole("status")).toContainText(
    question.explanation,
  );
  await expect(
    page.getByRole("region", { name: "Understanding summary" }),
  ).toContainText("1 of 6 checks attempted · 0 correct");
  await page.getByRole("button", { name: "Mark lesson complete" }).click();
  await expect(
    page.getByRole("region", { name: "Understanding summary" }),
  ).toContainText("0 correct");
  expect(errors).toEqual([]);
});

test("complete the staged project, reveal hints and solutions, preserve legacy progress and restore the project", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/projects");
  await page.evaluate(({ key, raw }) => localStorage.setItem(key, raw), {
    key: legacyKey,
    raw: legacy,
  });
  await page.getByRole("link", { name: /Python Number Guessing Game/ }).click();
  await expect(
    page
      .getByRole("region", { name: "Project prerequisites" })
      .getByRole("link"),
  ).toHaveCount(6);
  await expect(page.locator(".project-solution")).toHaveCount(0);
  expect(
    await page.evaluate((key) => localStorage.getItem(key), projectKey),
  ).toBeNull();
  for (const [index, milestone] of project.milestones.entries()) {
    const stage = page.getByRole("region", {
      name: `${index + 1}. ${milestone.title}`,
    });
    if (index === 0) {
      const hint = stage.getByRole("button", { name: "Reveal next hint" });
      await hint.focus();
      await page.keyboard.press("Enter");
      await expect(
        stage.getByText(`Hint 1: ${milestone.hints[0]}`),
      ).toBeVisible();
      await expect(
        stage.getByText(`Hint 2: ${milestone.hints[1]}`),
      ).toHaveCount(0);
      await stage
        .getByLabel(milestone.question.options[0], { exact: true })
        .check();
      await stage.getByRole("button", { name: "Check reasoning" }).click();
      await expect(stage.locator(".answer-feedback")).toContainText(
        "Not quite.",
      );
      await expect(stage.getByRole("checkbox")).toBeDisabled();
      await stage.locator("summary").focus();
      await page.keyboard.press("Enter");
      await expect(stage.locator("details")).toHaveAttribute("open", "");
      await stage.getByRole("button", { name: "Retry exercise" }).click();
    }
    await stage
      .getByLabel(milestone.question.options[milestone.question.correctIndex], {
        exact: true,
      })
      .check();
    await stage.getByRole("button", { name: "Check reasoning" }).click();
    for (const checkbox of await stage.getByRole("checkbox").all())
      await checkbox.check();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await expect(page.getByText(/5 of 5 milestones complete/)).toBeVisible();
  await expect(page.getByText("Reveal the full reference")).toBeVisible();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), legacyKey),
  ).toBe(legacy);
  await page.reload();
  await expect(page.getByText(/5 of 5 milestones complete/)).toBeVisible();
  await expect(
    page.getByText("Reveal the full reference").locator(".."),
  ).not.toHaveAttribute("open");
  const other = await context.newPage();
  await other.goto("/projects/number-guessing");
  await other.getByRole("checkbox").first().uncheck();
  await expect(page.getByText(/0 of 5 milestones complete/)).toBeVisible();
  await expect(page.getByText("Reveal the full reference")).toHaveCount(0);
  await other.close();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), legacyKey),
  ).toBe(legacy);
  expect(errors).toEqual([]);
});

test("project rejects malformed storage and handles denied writes independently of lesson data", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(
    ({ projectKey, legacyKey, legacy }) => {
      localStorage.setItem(
        projectKey,
        '{"version":1,"projectId":"other","answers":{},"checked":[]}',
      );
      localStorage.setItem(legacyKey, legacy);
    },
    { projectKey, legacyKey, legacy },
  );
  await page.goto("/projects/number-guessing");
  await expect(page.getByText(/0 of 5 milestones complete/)).toBeVisible();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), projectKey),
  ).toContain('"other"');
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("denied", "SecurityError");
    };
  });
  const stage = page.getByRole("region", {
    name: `1. ${project.milestones[0].title}`,
  });
  await stage.getByLabel("11, 12, 13", { exact: true }).check();
  await stage.getByRole("button", { name: "Check reasoning" }).click();
  await stage.getByRole("checkbox").check();
  await expect(page.locator(".project-page").getByRole("alert")).toContainText(
    "Project progress is kept for this session only",
  );
  await expect(page.getByText(/1 of 5 milestones complete/)).toBeVisible();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), legacyKey),
  ).toBe(legacy);
});
