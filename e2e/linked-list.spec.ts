import { expect, test } from "@playwright/test";
import { linkedListSolutions } from "../tests/linked-list-solutions";
import { selectAdaptiveProblem } from "../src/lib/adaptive-selection";

const evidenceKey = "cs-fundamentals:evidence:v1";

test("linked lesson reference player is keyboard accessible, bounded, and responsive", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/lessons/linked-lists");
  await expect(
    page.getByRole("heading", { name: "Linked Lists", exact: true }),
  ).toBeVisible();
  const player = page.getByRole("figure", {
    name: "Linked-list reference visualizer",
  });
  await expect(player).toContainText("head → null");
  await player
    .getByLabel("Choose reference scenario")
    .selectOption("delete-middle");
  await expect(player).toContainText("Step 1 of");
  await expect(
    player.getByRole("listitem", { name: /n1, value 7/ }),
  ).toBeVisible();
  await expect(
    player.getByRole("listitem", { name: /n2, value 7/ }),
  ).toBeVisible();
  await player.getByRole("button", { name: "Next step" }).focus();
  await page.keyboard.press("Enter");
  await expect(player).toContainText("Step 2 of");
  for (
    let i = 0;
    i < 20 &&
    (await player.getByRole("button", { name: "Next step" }).isEnabled());
    i++
  )
    await player.getByRole("button", { name: "Next step" }).click();
  await expect(player).toContainText("n1 is detached");
  await expect(
    player.getByRole("listitem", { name: /n1, value 7.*detached/ }),
  ).toBeVisible();
  await expect(
    player.getByRole("listitem", { name: /n2, value 7.*reachable/ }),
  ).toBeVisible();
  await player.getByRole("button", { name: "Reset" }).click();
  await expect(player).toContainText("Step 1 of");
  await player
    .getByLabel("Choose reference scenario")
    .selectOption("prepend-empty");
  await expect(player).toContainText("head → null");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("linked Python labs show failure, success, saved draft, and scoped evidence", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/lessons/linked-lists");
  const lab = page.getByRole("region", {
    name: "Remove the first matching node",
    exact: true,
  });
  await lab.getByRole("button", { name: "Run Tests" }).click();
  await expect(
    lab.getByRole("region", { name: "Execution result" }),
  ).toContainText("authored checks found failures", { timeout: 40000 });
  await expect(
    lab.getByRole("region", { name: "Learning guidance" }),
  ).toContainText("return current.next");
  await lab.getByText("Compare with the authored reference").click();
  await expect(
    lab.getByRole("region", { name: "Learning guidance" }),
  ).toContainText("previous.next = current.next");
  await expect(lab).toContainText(
    "not recorded as independent positive concept evidence",
  );
  await lab
    .getByLabel("Python source", { exact: true })
    .fill(linkedListSolutions["linked-remove"]);
  await lab.getByRole("button", { name: "Run Tests" }).click();
  await expect(
    lab.getByRole("region", { name: "Execution result" }),
  ).toContainText("Program completed successfully", { timeout: 40000 });
  await expect(lab.getByRole("region", { name: "Test result" })).toContainText(
    "4 passed · 0 failed",
  );
  const traversal = page.getByRole("region", {
    name: "Collect linked-list values",
    exact: true,
  });
  await traversal
    .getByLabel("Python source", { exact: true })
    .fill(linkedListSolutions["linked-traverse"]);
  await traversal.getByRole("button", { name: "Run Tests" }).click();
  await expect(
    traversal.getByRole("region", { name: "Execution result" }),
  ).toContainText("Program completed successfully", { timeout: 40000 });
  const records = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "{}").records ?? [],
    evidenceKey,
  );
  expect(records).not.toContainEqual(
    expect.objectContaining({ activityId: "linked-remove", correct: true }),
  );
  expect(records).toContainEqual(
    expect.objectContaining({ activityId: "linked-traverse", correct: true }),
  );
  await page.reload();
  await expect(
    page
      .getByRole("region", {
        name: "Remove the first matching node",
        exact: true,
      })
      .getByLabel("Python source", { exact: true }),
  ).toHaveValue(linkedListSolutions["linked-remove"]);
});

test("linked adaptive mistake leads to related variation and hint assisted result", async ({
  page,
}) => {
  await page.goto("/practice/adaptive?skill=linked-deletion");
  const first = selectAdaptiveProblem({
    records: [],
    now: Date.now(),
    seed: 0,
    manualSkill: "linked-deletion",
  })!.instance;
  await expect(page.getByRole("heading", { name: first.prompt })).toBeVisible();
  const wrong = first.options.find((_, i) => i !== first.correctIndex)!;
  await page.getByRole("radio", { name: wrong.text, exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(
    page.getByText(wrong.misconception!, { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Review the lesson explanation/ }),
  ).toHaveAttribute("href", "/lessons/linked-lists");
  await page.getByRole("button", { name: "New related variation" }).click();
  const second = selectAdaptiveProblem({
    records: [],
    now: Date.now(),
    seed: 1,
    manualSkill: "linked-deletion",
    recent: [first.id],
  })!.instance;
  expect(second.id).not.toBe(first.id);
  await page.getByRole("button", { name: "Show a hint" }).click();
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
  await page.goto("/learning");
  await expect(
    page.getByText("Reference rewiring and deletion").first(),
  ).toBeVisible();
});
