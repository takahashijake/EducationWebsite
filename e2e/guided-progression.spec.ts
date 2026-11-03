import { expect, test } from "@playwright/test";

test("planned topic is labeled before navigation and offers a published alternative", async ({
  page,
}) => {
  await page.goto("/roadmap");
  const card = page.getByRole("link", { name: /Hash Tables/ });
  await expect(card).toContainText("Planned · preview only");
  await card.click();
  await expect(page.getByText("Planned topic", { exact: true })).toBeVisible();
  await page
    .getByRole("link", { name: /Study Arrays and Strings instead/ })
    .click();
  await expect(page).toHaveURL(/\/lessons\/arrays-strings$/);
});

test("a new learner sees one contextual primary lesson next step", async ({
  page,
}) => {
  await page.goto("/lessons/variables-data-types");
  const summary = page.getByRole("region", { name: "Understanding summary" });
  await expect(
    summary.getByRole("link", {
      name: /Continue to Operators and Expressions/,
    }),
  ).toHaveAttribute("href", "/lessons/operators-expressions");
});
