import { expect, test } from "@playwright/test";
import { projects } from "../src/content/projects";
import {
  projectWorkspaceId,
  serializeWorkspace,
  workspaceKey,
} from "../src/lib/workspace";

test("oversized carry-forward explains the limit and preserves edited code and legacy progress", async ({
  page,
}) => {
  const project = projects[0];
  const first = project.milestones[0];
  const progressKey = "cs-fundamentals:project:v1:number-guessing";
  const oldProgress = JSON.stringify({
    version: 1,
    projectId: project.id,
    answers: { [first.question.id]: first.question.correctIndex },
    checked: first.checklist.map((c) => c.id),
  });
  const key = workspaceKey(projectWorkspaceId(project.id, first.id));
  const raw = serializeWorkspace(
    projectWorkspaceId(project.id, first.id),
    "#".repeat(24000),
  );
  await page.goto("/");
  await page.evaluate(
    ({ key, raw, progressKey, oldProgress }) => {
      localStorage.setItem(key, raw);
      localStorage.setItem(progressKey, oldProgress);
    },
    { key, raw, progressKey, oldProgress },
  );
  await page.goto("/projects/number-guessing");
  const lab = page.getByRole("region", {
    name: project.milestones[1].coding!.title,
    exact: true,
  });
  const source = lab.getByLabel("Python source", { exact: true });
  await source.fill("# preserve this edited draft");
  await lab
    .getByRole("button", { name: "Carry forward my previous code" })
    .click();
  await lab.getByRole("button", { name: "Confirm carry forward" }).click();
  await expect(lab.getByLabel("Error and traceback")).toContainText(
    "Combined code exceeds the editor limit",
  );
  await expect(source).toHaveValue("# preserve this edited draft");
  expect(
    await page.evaluate((key) => localStorage.getItem(key), progressKey),
  ).toBe(oldProgress);
});
