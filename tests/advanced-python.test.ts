import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { projects } from "@/content/projects";
import { lessons } from "@/content/lessons";
import { recursionTrace, debuggingTrace } from "@/content/advanced-traces";
import { validateTrace } from "@/lib/trace";

function python(source: string) {
  const result = spawnSync("python3", ["-I", "-"], {
    input: source,
    encoding: "utf8",
    timeout: 3000,
    maxBuffer: 1024 * 100,
  });
  expect(result.error, source).toBeUndefined();
  expect(result.status, `${source}\n${result.stderr}`).toBe(0);
  return result.stdout.trim();
}
describe("Python authoring verification", () => {
  it("runs all milestone solutions with their deterministic assertions and the complete reference", () => {
    for (const project of projects) {
      for (const milestone of project.milestones) {
        python(
          `${milestone.solution}\n\n${milestone.tests.map((t) => t.code).join("\n")}\nprint('passed')`,
        );
      }
      // Execute definitions as an import would, so the terminal guard does not prompt.
      python(
        `namespace = {'__name__': 'authored_reference'}\nexec(${JSON.stringify(project.reference)}, namespace)\nglobals().update(namespace)\n${project.milestones.flatMap((m) => m.tests.map((t) => t.code)).join("\n")}\nprint('passed')`,
      );
      const loss = spawnSync("python3", ["-I", "-c", project.reference], {
        input: "1\n2\n3\n",
        encoding: "utf8",
        timeout: 3000,
      });
      expect(loss.status).toBe(0);
      expect(loss.stdout).toContain("Out of attempts");
      expect(loss.stdout).not.toContain("Correct");
    }
  });
  it("proves the regression test distinguishes the off-by-one mutation", () => {
    const project = projects[0];
    const milestone = project.milestones.find((m) => m.id === "regression")!;
    const bug = milestone.solution.replace(
      "attempts >= max_attempts",
      "attempts > max_attempts",
    );
    const result = spawnSync("python3", ["-I", "-"], {
      input: bug,
      encoding: "utf8",
      timeout: 3000,
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("AssertionError");
  });
  it("compares recursive frame creation and returns with real Python tracing for every input", () => {
    for (const program of [recursionTrace, ...recursionTrace.scenarios!]) {
      expect(validateTrace({ ...recursionTrace, ...program })).toEqual([]);
      const output = python(
        `import sys, json\nevents = []\ndef observe(frame, event, arg):\n    if frame.f_code.co_name == 'factorial' and event in ('call', 'return'):\n        events.append([event, frame.f_locals['n'], arg if event == 'return' else None])\n    return observe\nsys.settrace(observe)\n${program.source}\nsys.settrace(None)\nprint(json.dumps(events))`,
      );
      const events: unknown[] = [];
      let priorDepth = 1;
      for (const step of program.steps) {
        const frames = step.frames!;
        const top = frames.at(-1)!;
        const n = step.variables.find(
          (v) => v.scope === top.scope && v.name === "n",
        )?.value;
        if (frames.length > priorDepth) events.push(["call", n, null]);
        if (top.status === "returning")
          events.push(["return", n, top.returnValue]);
        priorDepth = frames.length;
        for (const frame of frames.slice(1)) {
          const local = step.variables.find(
            (v) => v.scope === frame.scope && v.name === "n",
          )!;
          expect(frame.name).toBe(`factorial(${local.value})`);
        }
        if (frames.length > 1)
          expect(
            step.variables.some(
              (v) => v.scope === "global" && v.name === "result",
            ),
          ).toBe(false);
      }
      expect(JSON.parse(output.split("\n").at(-1)!)).toEqual(events);
      expect(program.steps.at(-1)!.frames).toEqual([
        {
          id: "module",
          name: "Caller (module)",
          scope: "global",
          status: "active",
        },
      ]);
    }
  });
  it("checks recursive domains, search boundaries, missing returns and termination failures", () => {
    const factorial = lessons.recursion.code.source.split("\nprint")[0];
    python(
      `${factorial}\nassert factorial(0) == 1\nassert factorial(1) == 1\nassert factorial(4) == 24\ntry:\n    factorial(-1)\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError('negative factorial accepted')`,
    );
    const sum = lessons.recursion.sections![0].code!.split("\nprint")[0];
    python(
      `${sum}\nfor n, expected in [(0, 0), (1, 1), (4, 10)]:\n    assert sum_to(n) == sum_iterative(n) == expected\ntry:\n    sum_to(-1)\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError('negative sum accepted')`,
    );
    const search = lessons.recursion.sections![1].code!.split("\nprint")[0];
    python(
      `${search}\nassert first_index([], 7) == -1\nassert first_index([7], 7) == 0\nassert first_index([4, 7, 9], 4) == 0\nassert first_index([4, 7, 9], 9) == 2\nassert first_index([4, 7, 9], 5) == -1\nassert first_index([7, 7], 7) == 0`,
    );
    python(
      "import sys\nsys.setrecursionlimit(60)\ndef stuck(n):\n    if n == 0:\n        return 1\n    return stuck(n)\ntry:\n    stuck(1)\nexcept RecursionError:\n    print('nontermination caught')\nelse:\n    raise AssertionError('expected recursion failure')",
    );
  });
  it("checks syntax failure happens before execution and buggy/fixed accumulator updates match Python", () => {
    const syntax = spawnSync("python3", ["-I", "-"], {
      input: "print('started')\nif True\n    print('done')",
      encoding: "utf8",
      timeout: 3000,
    });
    expect(syntax.status).toBe(1);
    expect(syntax.stdout).toBe("");
    expect(syntax.stderr).toContain("SyntaxError");
    for (const program of [debuggingTrace, ...debuggingTrace.scenarios!]) {
      expect(validateTrace({ ...debuggingTrace, ...program })).toEqual([]);
      const instrumented = program.source.replace(
        "    total += value",
        "    total += value\n    print('state', value, total)",
      );
      const states = python(instrumented)
        .split("\n")
        .filter((line) => line.startsWith("state"));
      expect(states).toEqual(
        program.steps
          .filter((step) => step.lines[0] === 4)
          .map(
            (step) =>
              `state ${step.variables.find((v) => v.name === "value")!.value} ${step.variables.find((v) => v.name === "total")!.value}`,
          ),
      );
    }
  });
});
