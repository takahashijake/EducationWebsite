import { expect, test } from "@playwright/test";
import { cppExercises } from "../src/content/cpp-exercises";
import { cppSolutions } from "../tests/cpp-solutions";
import { normalizeOutput } from "../src/lib/coding-evaluation";

test.setTimeout(180000);
test("complete a C++ lesson practice flow, repair a boundary, restore a draft, and return to the pathway", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  const outbound: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (request.method() === "POST") outbound.push(request.url());
  });
  await page.goto("/practice/cpp");
  await page.getByRole("link", { name: /Sum with a for loop/ }).click();
  const panel = page.locator("#cpp-inclusive-sum");
  await panel.locator(":scope > summary").click();
  const editor = panel.getByRole("textbox", { name: /C\+\+ source/ });
  await expect(editor).toBeVisible();
  await expect(panel.locator(".cm-lineNumbers")).toBeVisible();
  await editor.focus();
  await page.keyboard.press("Control+Enter");
  await expect(panel.getByRole("status")).toContainText(
    "Successful execution (exit 0)",
    { timeout: 90000 },
  );
  await expect(
    panel.getByRole("heading", { name: "Standard output" }).locator(".."),
  ).toContainText("3");
  await panel.getByRole("button", { name: "Submit solution" }).click();
  await expect(panel.getByRole("status")).toContainText(
    "1 of 4 public tests passed",
    { timeout: 90000 },
  );
  await expect(panel.locator(".test-results")).toContainText(
    "One iteration: Incorrect output",
  );
  await panel.getByRole("button", { name: "Reveal next hint" }).click();
  await expect(panel.getByText(/Trace the starter with n = 1/)).toBeVisible();
  await editor.fill(cppSolutions["cpp-inclusive-sum"]);
  await expect(panel.getByRole("status")).toContainText("Ready to run");
  await editor.focus();
  await page.keyboard.press("Tab");
  await expect(panel.getByLabel("Program input (stdin)")).toBeFocused();
  await panel.getByRole("button", { name: "Reset to starter" }).click();
  await expect(
    panel.getByRole("button", { name: "Keep my code" }),
  ).toBeFocused();
  await panel.getByRole("button", { name: "Keep my code" }).click();
  await panel.getByRole("button", { name: "Submit solution" }).click();
  await expect(panel.getByRole("status")).toContainText(
    "4 of 4 public tests passed. Exercise complete.",
    { timeout: 90000 },
  );
  expect(
    await page.evaluate(() =>
      localStorage.getItem("cs-fundamentals:progress:v1"),
    ),
  ).toBeNull();
  await page.reload();
  await panel.locator(":scope > summary").click();
  await expect(editor).toContainText("i <= n");
  await panel
    .getByText("Attempt history (3 most recent)", { exact: true })
    .click();
  await expect(
    panel.getByText(/Previously passed all public tests/),
  ).toBeVisible();
  const other = await context.newPage();
  await other.goto("/lessons/loops");
  await other.locator("#cpp-inclusive-sum > summary").click();
  await other
    .locator("#cpp-inclusive-sum")
    .getByRole("textbox", { name: /C\+\+ source/ })
    .fill("int main() { return 0; }");
  await expect(editor).toContainText("int main() { return 0; }");
  await other.close();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await panel
    .getByRole("link", { name: "Return to the learning pathway" })
    .click();
  await expect(
    page.getByRole("link", {
      name: "C++ practice: 1 of 8 exercises passed public tests",
    }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  expect(outbound).toEqual([]);
});

test("all eight solutions compile to WASM and pass every example and public case", async ({
  page,
}) => {
  await page.goto("/practice/cpp");
  for (const exercise of cppExercises) {
    const result = await page.evaluate(
      async ({ source, inputs }) => {
        async function job(message: Record<string, unknown>, timeout: number) {
          return new Promise<Record<string, unknown>>((resolve, reject) => {
            const worker = new Worker("/cpp/worker.js", { type: "module" });
            let stdout = "",
              stderr = "";
            const timer = setTimeout(() => {
              worker.terminate();
              reject(new Error("Worker deadline"));
            }, timeout);
            worker.onerror = (event) => {
              clearTimeout(timer);
              worker.terminate();
              reject(new Error(event.message));
            };
            worker.onmessage = ({ data }) => {
              if (data.type === "output") {
                if (data.channel === "stdout") stdout += data.text;
                else stderr += data.text;
                return;
              }
              clearTimeout(timer);
              worker.terminate();
              resolve({ ...data, stdout, stderr });
            };
            worker.postMessage({ ...message, id: 1 });
          });
        }
        const compiled = await job({ type: "compile", source }, 60000);
        if (!compiled.module)
          return { diagnostics: compiled.diagnostics, results: [] };
        const results = [];
        for (const stdin of inputs)
          results.push(
            await job({ type: "run", module: compiled.module, stdin }, 2000),
          );
        return { diagnostics: compiled.diagnostics, results };
      },
      {
        source: cppSolutions[exercise.id],
        inputs: [...exercise.examples, ...exercise.tests].map(
          (test) => test.stdin,
        ),
      },
    );
    expect(
      result.results,
      `${exercise.id}: ${result.diagnostics}`,
    ).toHaveLength(exercise.examples.length + exercise.tests.length);
    for (const [index, row] of result.results.entries()) {
      expect(row.type, `${exercise.id}: ${JSON.stringify(row)}`).toBe("exit");
      expect(row.exitCode).toBe(0);
      expect(normalizeOutput(String(row.stdout))).toBe(
        normalizeOutput(
          [...exercise.examples, ...exercise.tests][index].stdout,
        ),
      );
      expect(row.stderr).toBe("");
    }
  }
});

test("real compiler diagnostics, stdin, stderr, timeout, memory, output, and capability boundaries", async ({
  page,
  request,
}) => {
  await page.goto("/lessons/loops");
  const panel = page.locator("#cpp-inclusive-sum");
  await panel.locator(":scope > summary").click();
  const editor = panel.getByRole("textbox", { name: /C\+\+ source/ });
  async function run(source: string) {
    await editor.fill(source);
    await panel.getByRole("button", { name: "Run", exact: true }).click();
  }
  await run("int main() { this is not C++; }");
  await expect(panel.getByRole("status")).toContainText("Compilation error", {
    timeout: 90000,
  });
  await expect(panel.locator(".execution-panel").first()).toContainText(
    "main.cpp:1:",
  );
  await panel.getByLabel("Program input (stdin)").fill("Ada Lovelace\n");
  await run(
    '#include <iostream>\n#include <string>\nint main(){ std::string name; std::getline(std::cin,name); std::cout << name; std::cerr << "diagnostic"; return 7; }',
  );
  await expect(panel.getByRole("status")).toContainText(
    "Runtime error (exit 7)",
    { timeout: 90000 },
  );
  await expect(
    panel.getByRole("heading", { name: "Standard output" }).locator(".."),
  ).toContainText("Ada Lovelace");
  await expect(
    panel.getByRole("heading", { name: "Standard error" }).locator(".."),
  ).toContainText("diagnostic");
  await run(
    '#include <iostream>\nint main(){ std::cout << "before loop\\n" << std::flush; std::cerr << "check condition"; for(;;) {} }',
  );
  await expect(panel.getByRole("status")).toContainText("Time limit exceeded", {
    timeout: 90000,
  });
  await expect(
    panel.getByRole("heading", { name: "Standard output" }).locator(".."),
  ).toContainText("before loop");
  await expect(
    panel.getByRole("heading", { name: "Standard error" }).locator(".."),
  ).toContainText("check condition");
  await run(
    "#include <cstdio>\nint main(){for(int i=0;i<30000;++i) putchar(65); }",
  );
  await expect(panel.getByRole("status")).toContainText(
    "Output limit exceeded",
    { timeout: 90000 },
  );
  expect(
    (
      await panel
        .getByRole("heading", { name: "Standard output" })
        .locator("..")
        .locator("pre")
        .textContent()
    )?.length,
  ).toBe(20000);
  await run(
    '#include <cstdio>\n#include <cstdlib>\nint main(){void *p=std::malloc(100*1024*1024); std::printf("%d %d %d\\n", p==nullptr, std::getenv("APP_SECRET")==nullptr, std::fopen("/etc/passwd", "r")==nullptr); std::free(p); }',
  );
  await expect(panel.getByRole("status")).toContainText(
    "Successful execution",
    { timeout: 90000 },
  );
  await expect(
    panel.getByRole("heading", { name: "Standard output" }).locator(".."),
  ).toContainText("1 1 1");
  await run("int main(){ __builtin_trap(); }");
  await expect(panel.getByRole("status")).toContainText("Runtime error", {
    timeout: 90000,
  });
  await run("int main(){ for(;;) {} }");
  await panel.getByRole("button", { name: "Stop", exact: true }).click();
  await expect(panel.getByRole("status")).toContainText("Stopped");
  const headers = (await request.get("/cpp/worker.js")).headers();
  expect(headers["content-security-policy"]).toContain("worker-src 'none'");
  expect(
    (await request.post("/cpp/worker.js", { data: "int main(){}" })).status(),
  ).toBeGreaterThanOrEqual(400);
  const rejected = await page.evaluate(async () => {
    // A valid module requesting a JavaScript bridge; rejected before instantiation.
    const bridgeModule = new WebAssembly.Module(
      new Uint8Array([
        0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 2, 13, 1, 3, 101, 110,
        118, 5, 102, 101, 116, 99, 104, 0, 0,
      ]),
    );
    return new Promise<string>((resolve, reject) => {
      const worker = new Worker("/cpp/worker.js", { type: "module" });
      const timer = setTimeout(() => {
        worker.terminate();
        reject(new Error("No import validation response"));
      }, 5000);
      worker.onmessage = ({ data }) => {
        clearTimeout(timer);
        worker.terminate();
        resolve(data.error);
      };
      worker.postMessage({
        id: 1,
        type: "run",
        module: bridgeModule,
        stdin: "",
      });
    });
  });
  expect(rejected).toContain("Unsupported program import: env.fetch");
});
