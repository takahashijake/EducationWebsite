import { expect, test } from "@playwright/test";
import { lessons } from "../src/content/lessons";
import { availableTopics } from "../src/content/curriculum";
const key = "cs-fundamentals:progress:v1";
const oldProgress = JSON.stringify({
  version: 1,
  completed: [
    "variables-data-types",
    "binary-number-representation",
    "big-o-notation",
  ],
});
async function contained(page: import("@playwright/test").Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}

test("threshold inputs select all three branches and function frames restore the caller", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/lessons/conditionals");
  const trace = page.locator(".code-trace");
  const next = trace.getByRole("button", { name: "Next step" });
  for (const [id, output] of [
    ["below-60", "review"],
    ["at-60", "ready"],
    ["below-80", "ready"],
    ["at-80", "advanced"],
    ["above-80", "advanced"],
  ]) {
    await trace
      .getByRole("combobox", { name: "Choose a quiz score" })
      .selectOption(id);
    await expect(trace.getByRole("status")).toContainText("step 1 of");
    await next.focus();
    await page.keyboard.press("Enter");
    while (await next.isEnabled()) await next.click();
    await expect(trace.getByRole("status").locator("pre")).toHaveText(output);
    await trace.getByRole("button", { name: "Previous step" }).click();
    await expect(trace.getByRole("status").locator("pre")).toHaveText(
      "(no output)",
    );
    await contained(page);
  }
  await page.goto("/lessons/functions");
  const frames = trace.getByRole("region", { name: "Call frames" });
  await next.click();
  await next.click();
  await expect(frames).toContainText("Caller (module) · suspended");
  await expect(frames).toContainText("amount = 10; fee = 2");
  await next.click();
  await next.click();
  await expect(frames).toContainText("Returning 12");
  await next.click();
  await expect(frames.getByRole("listitem")).toHaveCount(1);
  await expect(frames).toContainText("result = 12");
  await contained(page);
  expect(errors).toEqual([]);
});

test("each new lesson provides retryable practice along the coherent path without earning completion", async ({
  page,
}) => {
  await page.goto("/lessons/operators-expressions");
  const ids = [
    "operators-expressions",
    "conditionals",
    "loops",
    "functions",
    "recursion",
    "debugging",
  ];
  for (const [index, id] of ids.entries()) {
    await expect(page).toHaveURL(`/lessons/${id}`);
    const exercise = lessons[id].exercises![0];
    const practice = page.locator(".practice-exercise").first();
    await practice
      .getByLabel(
        exercise.options[(exercise.correctIndex + 1) % exercise.options.length],
        { exact: true },
      )
      .check();
    await practice.getByRole("button", { name: "Check prediction" }).click();
    await expect(practice.getByRole("status")).toContainText("Not quite.");
    await practice.getByRole("button", { name: "Retry exercise" }).click();
    await practice
      .getByLabel(exercise.options[exercise.correctIndex], { exact: true })
      .check();
    await practice.getByRole("button", { name: "Check prediction" }).click();
    await expect(practice.getByRole("status")).toContainText("Correct.");
    await expect(
      page.getByRole("button", { name: "Mark lesson complete" }),
    ).toHaveAttribute("aria-pressed", "false");
    await contained(page);
    if (index < ids.length - 1)
      await page
        .getByRole("navigation", { name: "Continue learning" })
        .getByRole("link", { name: /^Next Lesson:/ })
        .click();
  }
  await expect(
    page
      .getByRole("navigation", { name: "Continue learning" })
      .getByRole("link", { name: /^Next Lesson:/ }),
  ).toHaveCount(0);
  await expect(
    page.getByText(/Apply the complete programming path/),
  ).toBeVisible();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), key),
  ).toBeNull();
});

test("original progress survives expansion, completion and undo synchronize across real tabs", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), {
    key,
    value: oldProgress,
  });
  await page.goto("/roadmap");
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    String(Math.round((100 * 3) / availableTopics.length)),
  );
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
    oldProgress,
  );
  const other = await context.newPage();
  await other.goto("/lessons/loops");
  await other.getByRole("button", { name: "Mark lesson complete" }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    String(Math.round((100 * 4) / availableTopics.length)),
  );
  await other.getByRole("button", { name: "Completed · Undo" }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    String(Math.round((100 * 3) / availableTopics.length)),
  );
  await page.reload();
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
    oldProgress,
  );
  await other.close();
});
