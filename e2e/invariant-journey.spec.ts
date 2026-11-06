import { expect, test } from "@playwright/test";
import { weightedSolutions } from "../src/content/weighted-solutions";
import { INVARIANT_JOURNEY_KEY } from "../src/lib/invariant-journey-state";
import { REVISIT_INTERVAL_MS } from "../src/content/invariant-journey";

test("predict, explain, implement, transfer, and revisit with one saved Python editor", async ({
  page,
}) => {
  test.setTimeout(120000);
  await page.goto("/lessons/weighted-shortest-paths");
  const journey = page.getByRole("region", {
    name: "Dijkstra invariant transfer journey",
  });
  await expect(journey).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Start the guided journey →" }),
  ).toHaveAttribute("href", "#invariant-journey");
  await expect(
    journey.getByRole("region", { name: "Compute Dijkstra distances" }),
  ).toHaveCount(1);
  const seed = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).seed as number,
    INVARIANT_JOURNEY_KEY,
  );
  await journey
    .getByRole("radio", {
      name: seed === 0 ? "Settle D at 8" : "Settle D at 6",
    })
    .check();
  await journey
    .getByRole("radio", { name: /smallest valid tentative entry/ })
    .check();
  await journey.getByRole("button", { name: "Check prediction" }).click();
  await expect(journey).toContainText("Actual next transition:");
  await expect(journey.locator(".journey-feedback[role=status]")).toBeFocused();
  await expect(journey).toContainText("Compare your choice and reason");
  await journey.getByRole("button", { name: /2. Explain/ }).focus();
  await page.keyboard.press("Enter");
  await journey
    .getByLabel("Your explanation")
    .fill(
      "The valid heap minimum is final because unsettled paths begin no cheaper and nonnegative edges cannot lower them. A negative edge breaks that argument.",
    );
  await journey
    .getByRole("button", { name: "Reveal rubric after submitting" })
    .click();
  await expect(journey.getByText("Self-review rubric")).toBeVisible();
  await journey
    .getByRole("radio", { name: "I covered all five points" })
    .check();
  await journey.getByRole("button", { name: "Revise my explanation" }).click();
  await journey
    .getByLabel("Revised explanation")
    .fill(
      "The valid minimum is final because any later route through an unsettled vertex adds only nonnegative weights. A negative edge breaks this proof.",
    );
  await journey
    .getByRole("button", { name: "Save revised explanation" })
    .click();
  await expect(journey).toContainText(
    "Revised explanation saved for self-review",
  );
  await journey.getByRole("button", { name: /3. Implement/ }).click();
  const lab = journey.getByRole("region", {
    name: "Compute Dijkstra distances",
  });
  await lab
    .getByLabel("Python source", { exact: true })
    .fill(weightedSolutions["weighted-dijkstra"]);
  await lab.getByRole("button", { name: "Run Tests" }).click();
  await expect(lab.getByRole("region", { name: "Test result" })).toContainText(
    "2 passed · 0 failed",
    { timeout: 40000 },
  );
  await expect(journey).toContainText(
    "Current source passed all public checks independently",
  );
  const records = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("cs-fundamentals:evidence:v1")!).records,
  );
  expect(
    records.filter(
      (row: { activityId: string }) => row.activityId === "weighted-dijkstra",
    ),
  ).toHaveLength(1);
  await lab
    .getByLabel("Python source", { exact: true })
    .fill(weightedSolutions["weighted-dijkstra"] + "\n# changed");
  await expect(journey).toContainText("withdraws this visit’s pass display");
  await journey.getByRole("button", { name: /4. Transfer/ }).click();
  await journey
    .getByLabel("Route (for example A → B → D)")
    .fill(seed === 0 ? "A C B D" : "A C D");
  await journey.getByLabel("Total cost").fill(seed === 0 ? "4" : "3");
  await journey
    .getByLabel(/Why is this action justified/)
    .fill(
      "The smallest valid tentative distance is settled; nonnegative edges cannot reduce it later.",
    );
  await journey.getByRole("button", { name: "Check transfer action" }).click();
  await expect(journey).toContainText("Your action matches the authored case");
  await page.reload();
  await expect(journey).toBeVisible();
  await journey.getByRole("button", { name: /5. Revisit/ }).click();
  await expect(journey).toContainText("This site does not send reminders");
  await page.evaluate(
    ({ key, interval }) => {
      const store = JSON.parse(localStorage.getItem(key)!);
      const old = new Date(Date.now() - interval - 1000).toISOString();
      store.startedAt = old;
      store.transfer[0].at = old;
      localStorage.setItem(key, JSON.stringify(store));
    },
    { key: INVARIANT_JOURNEY_KEY, interval: REVISIT_INTERVAL_MS },
  );
  await page.reload();
  await journey.getByRole("button", { name: /5. Revisit/ }).click();
  await journey.getByRole("radio", { name: /No, use a method/ }).check();
  await journey
    .getByLabel(/Why is this action justified/)
    .fill(
      "A negative edge can later lower B after B was settled, so Dijkstra is unsuitable.",
    );
  await journey.getByRole("button", { name: "Check revisit action" }).click();
  await expect(journey).toContainText("The later A → C → B route costs -1");
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).revisit.length,
      INVARIANT_JOURNEY_KEY,
    ),
  ).toBe(1);
  await journey.getByRole("button", { name: "Start a new journey" }).click();
  await journey.getByRole("radio", { name: "Settle B at 2" }).check();
  await journey
    .getByRole("radio", { name: /smallest valid tentative entry/ })
    .check();
  await journey.getByRole("button", { name: "Check prediction" }).click();
  await expect(journey).toContainText(
    "Your choice and reason matched this authored case",
  );
  await journey.getByRole("button", { name: /4. Transfer/ }).click();
  await journey.getByRole("button", { name: "Show a hint" }).click();
  const nextSeed = await page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key)!).seed as number,
    INVARIANT_JOURNEY_KEY,
  );
  await journey
    .getByLabel("Route (for example A → B → D)")
    .fill(nextSeed === 0 ? "A C B D" : "A B D");
  await journey.getByLabel("Total cost").fill(nextSeed === 0 ? "4" : "3");
  await journey
    .getByLabel(/Why is this action justified/)
    .fill(
      "The valid minimum can be settled because all edge weights are nonnegative.",
    );
  await journey.getByRole("button", { name: "Check transfer action" }).click();
  await expect(journey).toContainText("Latest action: matched; assisted");
  const finalEvidence = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem("cs-fundamentals:evidence:v1")!).records,
  );
  expect(
    finalEvidence.filter(
      (row: { activityId: string }) => row.activityId === "weighted-dijkstra",
    ),
  ).toHaveLength(1);
});

test("malformed journey storage is reset without changing evidence or workspaces", async ({
  page,
}) => {
  await page.goto("/lessons/weighted-shortest-paths");
  await page.evaluate(
    (key) => localStorage.setItem(key, "{broken"),
    INVARIANT_JOURNEY_KEY,
  );
  await page.reload();
  const journey = page.getByRole("region", {
    name: "Dijkstra invariant transfer journey",
  });
  await expect(
    journey.getByRole("heading", { name: /Predict the next valid settlement/ }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).version,
      INVARIANT_JOURNEY_KEY,
    ),
  ).toBe(1);
});
