import { expect, test } from "@playwright/test";
import { topics } from "../src/content/curriculum";

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
    "33",
  );
  await expect(page.locator(".topic-card.completed")).toContainText(
    "Variables and Data Types",
  );
  await page
    .locator(".topic-card")
    .filter({ has: page.getByRole("heading", { name: "Loops", exact: true }) })
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
  for (const [slug, title] of [
    ["variables-data-types", "Variables and Data Types"],
    ["binary-number-representation", "Binary Number Representation"],
    ["big-o-notation", "Introduction to Big O Notation"],
  ]) {
    await page.goto(`/lessons/${slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
    await expect(page.getByRole("group")).toHaveCount(3);
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
    JSON.stringify({ version: 1, completed: ["loops", "unknown", "loops"] }),
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
