import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { lessons } from "@/content/lessons";
import { codingExercises } from "@/content/coding-exercises";
import { projects } from "@/content/projects";
import { topics, programmingPath } from "@/content/curriculum";
import { validateCodingExercises } from "@/lib/coding-validation";
import { lessonSolutions, projectSolutions } from "./coding-solutions";
import type { CodingExercise } from "@/content/coding-types";
const harness = readFileSync("public/python-harness.py", "utf8");
function execute(
  source: string,
  tests: CodingExercise["tests"] = [],
  stdin = "",
) {
  const payload = JSON.stringify({ source, tests, stdin });
  const script = `${harness}\nimport contextlib\n_out = io.StringIO()\n_err = io.StringIO()\nwith contextlib.redirect_stdout(_out), contextlib.redirect_stderr(_err):\n    _answer = execute_payload(json.loads(${JSON.stringify(payload)}))\nprint(json.dumps({'result': json.loads(_answer), 'stdout': _out.getvalue(), 'stderr': _err.getvalue()}))`;
  const result = spawnSync("python3", ["-I", "-"], {
    input: script,
    encoding: "utf8",
    timeout: 3000,
    maxBuffer: 1024 * 100,
  });
  expect(result.error).toBeUndefined();
  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(result.stdout) as {
    result: {
      kind: string;
      error?: string;
      tests: { id: string; status: string; error?: string }[];
    };
    stdout: string;
    stderr: string;
  };
}
describe("executable educational content and trusted harness", () => {
  it("adds optional coding to all seven programming lessons without replacing existing content", () => {
    expect(Object.keys(codingExercises).sort()).toEqual(
      [...programmingPath].sort(),
    );
    for (const id of programmingPath) {
      expect(lessons[id].codingExercises).toEqual([codingExercises[id]]);
      expect(lessons[id].questions).toHaveLength(3);
      expect(lessons[id].demonstration).toBeDefined();
    }
    expect(
      validateCodingExercises(
        [
          ...Object.values(lessons).flatMap(
            (lesson) => lesson.codingExercises ?? [],
          ),
          ...projects.flatMap((p) =>
            p.milestones.flatMap((m) => (m.coding ? [m.coding] : [])),
          ),
        ],
        topics,
      ),
    ).toEqual([]);
    const invalid = structuredClone(codingExercises.loops);
    invalid.tests[0].conceptIds = ["missing"];
    expect(validateCodingExercises([invalid, invalid], topics).join()).toMatch(
      /Incomplete coding test[\s\S]*duplicate coding ID/,
    );
  });
  for (const [topic, exercise] of Object.entries(codingExercises)) {
    it(`${topic}: reference passes all checks, while the mistaken starter fails`, () => {
      const good = execute(lessonSolutions[topic], exercise.tests).result;
      expect(good.kind).toBe("success");
      expect(good.tests).toHaveLength(exercise.tests.length);
      expect(good.tests.every((t) => t.status === "passed")).toBe(true);
      const bad = execute(exercise.starter, exercise.tests).result;
      expect(bad.tests.some((t) => t.status === "failed")).toBe(true);
      expect(bad.kind).not.toBe("success");
    });
  }
  for (const milestone of projects[0].milestones) {
    it(`project ${milestone.id}: executes the original assertions and rejects missing learner work`, () => {
      const lab = milestone.coding!;
      const good = execute(projectSolutions[milestone.id], lab.tests).result;
      expect(good.kind, JSON.stringify(good)).toBe("success");
      expect(good.tests.every((t) => t.status === "passed")).toBe(true);
      const bad = execute(lab.starter, lab.tests).result;
      expect(bad.kind).not.toBe("success");
      expect(bad.tests.some((t) => t.status === "failed")).toBe(true);
    });
  }
  it("rejects a vacuous regression test while accepting and rejecting the explicit fixtures appropriately", () => {
    const milestone = projects[0].milestones[3];
    const result = execute(
      `${projectSolutions.round}\ndef test_attempt_limit(play):\n    pass`,
      milestone.coding!.tests,
    ).result;
    expect(
      result.tests.find((t) => t.id === "regression-rejects-mutation")?.status,
    ).toBe("failed");
    const alwaysRaises = execute(
      `${projectSolutions.round}\ndef test_attempt_limit(play):\n    assert False`,
      milestone.coding!.tests,
    ).result;
    expect(
      alwaysRaises.tests.find((t) => t.id === "regression-correct-fixture")
        ?.status,
    ).toBe("failed");
  });
  it("reports an observed off-by-one boundary failure and points at the intended concept", () => {
    const lab = projects[0].milestones[2].coding!;
    const result = execute(
      projectSolutions.round.replace(
        "attempts >= max_attempts",
        "attempts > max_attempts",
      ),
      lab.tests,
    ).result;
    const boundary = result.tests.find((t) => t.id === "round-valid-budget")!;
    expect(boundary.status).toBe("failed");
    expect(boundary.error).toContain("observed");
    expect(boundary.error).toContain("Correct");
    expect(lab.tests.find((t) => t.id === boundary.id)?.conceptIds).toEqual([
      "loops",
      "debugging",
    ]);
  });
  it("captures streams, classifies syntax/runtime errors, supports scripted EOF, and gives fresh check namespaces", () => {
    expect(
      execute("import sys\nprint('hello')\nprint('warning', file=sys.stderr)"),
    ).toMatchObject({
      stdout: "hello\n",
      stderr: "warning\n",
      result: { kind: "success" },
    });
    const syntax = execute("if True\n    pass").result;
    expect(syntax.kind).toBe("syntax-error");
    expect(syntax.error).toContain("learner.py");
    const runtime = execute("print(1 / 0)").result;
    expect(runtime.kind).toBe("runtime-error");
    expect(runtime.error).toContain("ZeroDivisionError");
    expect(
      execute(
        "print(input())\ntry:\n    input()\nexcept EOFError:\n    print('end')",
        [],
        "cat\n",
      ).stdout,
    ).toBe("cat\nend\n");
    const tests = [
      { id: "mutate", code: "items.append(1)\nassert items == [1]" },
      { id: "fresh", code: "assert items == []" },
    ] as CodingExercise["tests"];
    expect(
      execute("items = []", tests).result.tests.every(
        (t) => t.status === "passed",
      ),
    ).toBe(true);
  });
});
