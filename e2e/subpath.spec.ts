import { expect, test } from "@playwright/test";
import { cppSolutions } from "../tests/cpp-solutions";
import { codingExercises } from "../src/content/coding-exercises";

const base = process.env.E2E_BASE_PATH;
test.skip(
  !base,
  "Build with NEXT_PUBLIC_APP_BASE_PATH and set E2E_BASE_PATH to test a subpath.",
);

test("subpath pages hydrate, style, and load both same-origin execution runtimes", async ({
  page,
}) => {
  test.setTimeout(180000);
  const failures: string[] = [];
  const css: string[] = [];
  const cacheWarnings: string[] = [];
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(message.text());
  });
  page.on("requestfailed", (request) => {
    const url = new URL(request.url());
    const reason = request.failure()?.errorText;
    // Next cancels speculative RSC prefetches when navigating away.
    if (reason === "net::ERR_ABORTED" && url.searchParams.has("_rsc")) return;
    // Chromium can run the streamed compiler even if its temporary cache cannot store 95 MB.
    if (
      reason === "net::ERR_CACHE_WRITE_FAILURE" &&
      url.pathname.endsWith("/cpp/runtime/clang.wasm")
    ) {
      cacheWarnings.push(request.url());
      return;
    }
    failures.push(`${request.url()}: ${reason}`);
  });
  page.on("response", (response) => {
    const path = new URL(response.url()).pathname;
    if (path.endsWith(".css")) css.push(path);
    if (response.status() >= 400 && /\/_next\/|\/cpp\/|\/python/.test(path))
      failures.push(`${path}: ${response.status()}`);
  });
  await page.goto(`${base}/practice/cpp`);
  await expect(
    page.getByRole("heading", { name: "Learn it. Write it. Run it." }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Read and Print an Integer/ }).click();
  await expect(page).toHaveURL(
    new RegExp(`${base}/lessons/variables-data-types#cpp-variables-output$`),
  );
  const panel = page.locator("#cpp-variables-output");
  await expect(panel).toHaveJSProperty("open", true);
  await expect(panel).toHaveCSS("background-color", "rgb(255, 255, 255)");
  const editor = panel.getByRole("textbox", { name: /C\+\+ source/ });
  await editor.fill(cppSolutions["cpp-variables-output"]);
  await panel.getByLabel("Program input (stdin)").fill("7\n");
  await panel.getByRole("button", { name: "Run", exact: true }).click();
  await expect(panel.getByRole("status").last()).toContainText(
    "Successful execution",
    { timeout: 90000 },
  );
  await expect(
    panel.getByRole("heading", { name: "Standard output" }).locator(".."),
  ).toContainText("Learners: 7");
  const workerResponse = await page.request.get(`${base}/cpp/worker.js`);
  expect(workerResponse.headers()["content-security-policy"]).toContain(
    "worker-src 'none'",
  );
  expect((await page.request.get(`${base}/python-harness.py`)).status()).toBe(
    200,
  );
  await page.goto(`${base}/lessons/variables-data-types`);
  const lab = page.getByRole("region", {
    name: codingExercises["variables-data-types"].title,
    exact: true,
  });
  await lab
    .getByLabel("Python source", { exact: true })
    .fill("print('python subpath ready')");
  await lab.getByRole("button", { name: "Run", exact: true }).click();
  await expect(
    lab.getByRole("region", { name: "Execution result" }),
  ).toContainText("Program completed successfully", { timeout: 40000 });
  await expect(
    lab.getByLabel("Standard output", { exact: true }),
  ).toContainText("python subpath ready");
  expect(css.some((path) => path.startsWith(`${base}/_next/`))).toBe(true);
  expect(cacheWarnings.length).toBeLessThanOrEqual(1);
  if (cacheWarnings.length)
    test
      .info()
      .annotations.push({
        type: "browser-cache",
        description:
          "Chromium reported a nonfatal compiler WASM cache write failure after a successful compile.",
      });
  expect(failures).toEqual([]);
});
