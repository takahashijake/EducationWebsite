import { expect, test, type Locator } from "@playwright/test";
import { codingExercises } from "../src/content/coding-exercises";
import { projects } from "../src/content/projects";
import { lessonSolutions, projectSolutions } from "../tests/coding-solutions";
import {
  lessonWorkspaceId,
  projectWorkspaceId,
  workspaceKey,
} from "../src/lib/workspace";
const labFor = (page: import("@playwright/test").Page, title: string) =>
  page.getByRole("region", { name: title, exact: true });
async function run(lab: Locator, source: string, tests = false) {
  await lab.getByLabel("Python source", { exact: true }).fill(source);
  await lab
    .getByRole("button", { name: tests ? "Run Tests" : "Run", exact: true })
    .click();
}
async function success(lab: Locator) {
  await expect(
    lab.getByRole("region", { name: "Execution result" }),
  ).toContainText("Program completed successfully", { timeout: 40000 });
}

test("actual Worker Python: lazy assets, keyboard execution, streams, exceptions, state isolation, stop, timeout, and output bounds", async ({
  page,
}) => {
  test.setTimeout(120000);
  const requests: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => {
    if (/\/python\/|python-worker/.test(request.url()))
      requests.push(request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.goto("/lessons/loops");
  const lab = labFor(page, codingExercises.loops.title);
  await expect(lab.getByLabel("Python source", { exact: true })).toBeEnabled();
  expect(requests).toEqual([]);
  const source = lab.getByLabel("Python source", { exact: true });
  await source.fill(
    "import sys\nprint('hello')\nprint('warning', file=sys.stderr)\nprint('partial', end='')",
  );
  await source.press("Control+Enter");
  await success(lab);
  await expect(lab.getByLabel("Standard output", { exact: true })).toHaveText(
    "hello\npartial",
  );
  await expect(lab.getByLabel("Standard error", { exact: true })).toHaveText(
    "warning\n",
  );
  await expect(lab.getByRole("region", { name: "Test result" })).toContainText(
    "Tests have not run",
  );
  expect(requests.some((url) => url.endsWith("pyodide.asm.wasm"))).toBe(true);
  const wasmResponse = await page.request.get(
    "/python/0.29.3/pyodide.asm.wasm",
  );
  expect(wasmResponse.headers()["content-type"]).toContain("application/wasm");
  await run(lab, "if True\n    print('broken')");
  await expect(
    lab.getByRole("region", { name: "Execution result" }),
  ).toContainText("Python syntax error", { timeout: 40000 });
  await expect(lab.getByLabel("Error and traceback")).toContainText(
    "learner.py",
  );
  await run(lab, "def divide():\n    return 1 / 0\ndivide()");
  await expect(lab.getByLabel("Error and traceback")).toContainText(
    "ZeroDivisionError",
    { timeout: 40000 },
  );
  await expect(lab.getByLabel("Error and traceback")).toContainText(
    "in divide",
  );
  await run(lab, "import builtins\nbuiltins.leaked = 1\nassigned = 42");
  await success(lab);
  await run(
    lab,
    "import builtins\nprint('assigned' in globals(), hasattr(builtins, 'leaked'))",
  );
  await success(lab);
  await expect(lab.getByLabel("Standard output", { exact: true })).toHaveText(
    "False False\n",
  );
  await lab
    .getByLabel("Execution deadline · starts after Python is ready")
    .selectOption("10000");
  await run(lab, "while True:\n    pass");
  await expect(lab.getByRole("status")).toHaveText("Running Python…", {
    timeout: 40000,
  });
  await lab.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(
    lab.getByRole("region", { name: "Execution result" }),
  ).toContainText("Execution stopped");
  await run(lab, "print(42)");
  await success(lab);
  await expect(lab.getByLabel("Standard output", { exact: true })).toHaveText(
    "42\n",
  );
  await lab
    .getByLabel("Execution deadline · starts after Python is ready")
    .selectOption("1000");
  await run(
    lab,
    "import sys\nprint('before loop', flush=True)\nprint('diagnostic', file=sys.stderr, flush=True)\nwhile True:\n    pass",
  );
  await expect(
    lab.getByRole("region", { name: "Execution result" }),
  ).toContainText("Execution deadline exceeded", { timeout: 40000 });
  await expect(lab.getByLabel("Standard output", { exact: true })).toHaveText(
    "before loop\n",
  );
  await expect(lab.getByLabel("Standard error", { exact: true })).toHaveText(
    "diagnostic\n",
  );
  await run(lab, "print('x' * 25000)");
  await success(lab);
  await expect(
    lab.getByRole("region", { name: "Execution result" }),
  ).toContainText("Output was limited to 20,000 characters");
  expect(
    (await lab.getByLabel("Standard output", { exact: true }).textContent())!
      .length,
  ).toBe(20000);
  await source.focus();
  await page.keyboard.press("Tab");
  await expect(source).not.toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await lab
    .getByLabel("Execution deadline · starts after Python is ready")
    .selectOption("10000");
  await run(lab, "while True:\n    pass");
  await expect(lab.getByRole("status")).toHaveText("Running Python…", {
    timeout: 40000,
  });
  await page.goto("/lessons/functions");
  const nextLab = labFor(page, codingExercises.functions.title);
  await run(nextLab, "print('fresh after navigation')");
  await success(nextLab);
  await expect(
    nextLab.getByLabel("Standard output", { exact: true }),
  ).toHaveText("fresh after navigation\n");
  expect(errors).toEqual([]);
});

test("real runtime initialization failure is visible and retry recovers", async ({
  page,
  context,
}) => {
  test.setTimeout(60000);
  await context.route("**/python/0.29.3/pyodide.js", (route) => route.abort());
  await page.goto("/lessons/functions");
  const lab = labFor(page, codingExercises.functions.title);
  await run(lab, "print('recovered')");
  await expect(
    lab.getByRole("region", { name: "Execution result" }),
  ).toContainText("Python loading failed", { timeout: 35000 });
  await context.unroute("**/python/0.29.3/pyodide.js");
  await lab.getByRole("button", { name: "Run", exact: true }).click();
  await success(lab);
  await expect(lab.getByLabel("Standard output", { exact: true })).toHaveText(
    "recovered\n",
  );
});

test("all seven executable lesson exercises reject mistakes, pass correct code, retain drafts and preserve legacy progress", async ({
  page,
  context,
}) => {
  test.setTimeout(150000);
  const legacyKey = "cs-fundamentals:progress:v1";
  const projectKey = "cs-fundamentals:project:v1:number-guessing";
  const legacy = JSON.stringify({
    version: 1,
    completed: ["functions", "loops"],
  });
  const oldProject = JSON.stringify({
    version: 1,
    projectId: "number-guessing",
    answers: { "project-compare-check": 1 },
    checked: ["compare-written"],
  });
  await page.goto("/");
  await page.evaluate(
    ({ legacyKey, projectKey, legacy, oldProject }) => {
      localStorage.setItem(legacyKey, legacy);
      localStorage.setItem(projectKey, oldProject);
    },
    { legacyKey, projectKey, legacy, oldProject },
  );
  for (const [id, exercise] of Object.entries(codingExercises)) {
    await page.goto(`/lessons/${id}`);
    const lab = labFor(page, exercise.title);
    await run(lab, exercise.starter, true);
    await expect(
      lab.getByRole("region", { name: "Test result" }),
    ).toContainText("failed", { timeout: 40000 });
    await expect(
      lab
        .getByRole("region", { name: "Learning guidance" })
        .getByRole("link")
        .first(),
    ).toHaveAttribute("href", /^\/lessons\//);
    await run(lab, lessonSolutions[id], true);
    await expect(
      lab.getByRole("region", { name: "Test result" }),
    ).toContainText(`${exercise.tests.length} passed · 0 failed · 0 not run`, {
      timeout: 40000,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.reload();
  const lab = labFor(page, codingExercises.debugging.title);
  await expect(lab.getByLabel("Python source", { exact: true })).toHaveValue(
    lessonSolutions.debugging,
  );
  await lab.getByRole("button", { name: "Reset Code" }).click();
  await expect(lab.getByLabel("Python source", { exact: true })).toHaveValue(
    lessonSolutions.debugging,
  );
  await lab.getByRole("button", { name: "Keep my code" }).click();
  await lab.getByRole("button", { name: "Reset Code" }).click();
  await lab.getByRole("button", { name: "Confirm reset" }).click();
  await expect(lab.getByLabel("Python source", { exact: true })).toHaveValue(
    codingExercises.debugging.starter,
  );
  const other = await context.newPage();
  await other.goto("/lessons/debugging");
  await labFor(other, codingExercises.debugging.title)
    .getByLabel("Python source", { exact: true })
    .fill("# edited in other tab");
  await expect(lab.getByLabel("Python source", { exact: true })).toHaveValue(
    "# edited in other tab",
  );
  await other.close();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), legacyKey),
  ).toBe(legacy);
  expect(
    await page.evaluate((key) => localStorage.getItem(key), projectKey),
  ).toBe(oldProject);
  await page.goto("/lessons/loops");
  await expect(
    labFor(page, codingExercises.loops.title).getByLabel("Python source", {
      exact: true,
    }),
  ).toHaveValue(lessonSolutions.loops);
});

test("project carries learner implementations, verifies all five milestones, detects a vacuous regression, and runs unittest.mock terminal cases", async ({
  page,
}) => {
  test.setTimeout(150000);
  const project = projects[0];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  // Old V0.3 completed work remains unlocked without requiring any new code tests.
  const old = JSON.stringify({
    version: 1,
    projectId: project.id,
    answers: Object.fromEntries(
      project.milestones.map((m) => [m.question.id, m.question.correctIndex]),
    ),
    checked: project.milestones.flatMap((m) => m.checklist.map((c) => c.id)),
  });
  await page.goto("/");
  await page.evaluate(
    (raw) =>
      localStorage.setItem("cs-fundamentals:project:v1:number-guessing", raw),
    old,
  );
  await page.goto("/projects/number-guessing");
  for (const [index, milestone] of project.milestones.entries()) {
    const lab = labFor(page, milestone.coding!.title);
    if (index > 0) {
      await lab
        .getByRole("button", { name: "Carry forward my previous code" })
        .click();
      await lab.getByRole("button", { name: "Confirm carry forward" }).click();
      const carried = await lab
        .getByLabel("Python source", { exact: true })
        .inputValue();
      expect(carried).toContain(
        projectSolutions[project.milestones[index - 1].id],
      );
    }
    if (milestone.id === "regression") {
      await run(
        lab,
        `${projectSolutions.round}\ndef test_attempt_limit(play):\n    pass`,
        true,
      );
      await expect(
        lab.getByRole("region", { name: "Test result" }),
      ).toContainText("1 failed", { timeout: 40000 });
      await expect(
        lab.getByRole("region", { name: "Learning guidance" }),
      ).toContainText("Put the winning guess just outside");
    }
    await run(lab, projectSolutions[milestone.id], true);
    await expect(
      lab.getByRole("region", { name: "Test result" }),
    ).toContainText(
      `${milestone.coding!.tests.length} passed · 0 failed · 0 not run`,
      { timeout: 40000 },
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  const terminal = labFor(page, project.milestones[4].coding!.title);
  await run(terminal, `${projectSolutions.terminal}\nmain()`);
  await success(terminal);
  await expect(
    terminal.getByLabel("Standard output", { exact: true }),
  ).toContainText("Correct");
  expect(
    await page.evaluate(() =>
      localStorage.getItem("cs-fundamentals:project:v1:number-guessing"),
    ),
  ).toBe(old);
  expect(errors).toEqual([]);
});

test("malformed or denied workspace storage remains usable and separate from other exercises", async ({
  page,
}) => {
  const exercise = codingExercises.loops;
  const key = workspaceKey(lessonWorkspaceId("loops", exercise.id));
  await page.goto("/");
  await page.evaluate((key) => localStorage.setItem(key, '{"version":7}'), key);
  await page.goto("/lessons/loops");
  const lab = labFor(page, exercise.title);
  await expect(lab.getByLabel("Python source", { exact: true })).toHaveValue(
    exercise.starter,
  );
  expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
    '{"version":7}',
  );
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("full", "QuotaExceededError");
    };
  });
  await lab
    .getByLabel("Python source", { exact: true })
    .fill("print('session draft')");
  await expect(lab.getByRole("alert")).toContainText(
    "Your code remains usable in this session",
  );
  await page.goto("/lessons/functions");
  await expect(
    labFor(page, codingExercises.functions.title).getByLabel("Python source", {
      exact: true,
    }),
  ).toHaveValue(codingExercises.functions.starter);
  expect(
    await page.evaluate(
      (key) => localStorage.getItem(key),
      workspaceKey(projectWorkspaceId("number-guessing", "compare")),
    ),
  ).toBeNull();
});
