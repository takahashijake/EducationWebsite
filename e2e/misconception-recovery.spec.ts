import { expect, test } from "@playwright/test";
import { generateAdaptiveInstance } from "../src/content/adaptive-families";

test("comparison mistake leads to a different independent check and durable cautious guidance", async ({
  page,
}) => {
  await page.goto("/practice/adaptive?skill=comparisons");
  await page.getByRole("button", { name: "New related variation" }).click();
  const policy = page.getByRole("heading", { name: /Which test implements/ });
  await expect(policy).toBeVisible();
  const firstId = await page.getByRole("radio").first().getAttribute("name");
  const firstSeed = Number(firstId?.split(":s")[1]);
  const question = generateAdaptiveInstance("comparison-policy", 1, firstSeed)!;
  const wrong = question.options.find((option) => option.misconceptionId)!;
  await page.getByRole("radio", { name: wrong.text, exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(
    page.getByLabel("Possible misconception recovery"),
  ).toContainText("One possible reason");
  await expect(
    page.getByLabel("Possible misconception recovery"),
  ).toContainText("Contrast:");
  const key = "cs-fundamentals:misconceptions:v1";
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).records.length,
      key,
    ),
  ).toBe(1);
  await page
    .getByRole("button", { name: "Try a different independent check" })
    .focus();
  await page.keyboard.press("Enter");
  const followId = await page.getByRole("radio").first().getAttribute("name");
  expect(followId).toContain("adaptive-comparison-branch:");
  const follow = generateAdaptiveInstance(
    "comparison-branch",
    1,
    Number(followId?.split(":s")[1]),
  )!;
  expect(follow.caseTag).toBe("equality-boundary");
  await page
    .getByRole("radio", {
      name: follow.options[follow.correctIndex].text,
      exact: true,
    })
    .check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(
    page.getByText(/different question adds independent counterevidence/),
  ).toBeVisible();
  await page.goto("/learning");
  await expect(
    page.getByText("Possible boundary misunderstanding:"),
  ).toBeVisible();
  await expect(page.getByText(/useful counterevidence/)).toBeVisible();
  await page.reload();
  await expect(page.getByText(/useful counterevidence/)).toBeVisible();
});
