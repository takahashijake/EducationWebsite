import { spawnSync } from "node:child_process";
import { expect, it } from "vitest";
import { lessons } from "@/content/lessons";

// Repository-authored programs only. Python is an authoring check, never a site runtime.
const examples: Record<string, string[]> = {
  "variables-data-types": ["13.5\n18.0"],
  "binary-number-representation": ["13\n0b10011\n00010011"],
  "big-o-notation": ["3\n-1"],
  "arrays-strings": ["6\n0", "0 5\n1 8\n2 1", "[6, 4, 9, 2] cat bat"],
  searching: ["3\n-1", ""],
  sorting: ["[1, 2, 4, 4] True", "", "", ""],
  "linked-lists": ["7", "", "", ""],
  "stacks-queues": ["B\nA", "A", ""],
  graphs: [""],
  "operators-expressions": ["26 False", "3.4\n3\n2", "True"],
  conditionals: ["ready", "Continue", "Member, below minimum"],
  loops: ["6", "40 2", "3\n2\n1\nDone", "1\n3\nDone", "1 1\n1 2\n2 1\n2 2"],
  functions: ["12", "6\nNone 6", "5 6", "14"],
  debugging: [
    "59 False\n60 True\n61 True",
    "count must be positive",
    "boundary tests passed",
  ],
  recursion: ["1\n1\n6", "6 6\n0", "1\n2\n-1\n-1"],
};
const predictions: Record<string, string> = {
  "operators-p1": "14",
  "operators-p2": "2 3",
  "conditionals-p1": "middle",
  "conditionals-p2": "A\nB",
  "loops-p1": "6",
  "loops-p2": "1",
  "functions-p1": "5 6",
  "functions-p2": "6\nNone",
  "debugging-p1": "3",
  "debugging-p2": "retry",
  "recursion-p1": "6",
  "recursion-p2": "None",
  "searching-p1": "",
};
function execute(source: string, expected: string) {
  const result = spawnSync("python3", ["-I", "-"], {
    input: source,
    encoding: "utf8",
    timeout: 3000,
    maxBuffer: 1024 * 100,
  });
  expect(result.error, source).toBeUndefined();
  expect(result.status, `${source}\n${result.stderr}`).toBe(0);
  expect(result.stdout.trim(), source).toBe(expected);
}
it("checks every runnable lesson example, supplementary program, prediction and trace output against Python 3", () => {
  for (const lesson of Object.values(lessons)) {
    const sources = [
      lesson.code.source,
      ...(lesson.sections ?? []).flatMap((s) => (s.code ? [s.code] : [])),
    ];
    expect(examples[lesson.topicId]).toHaveLength(sources.length);
    sources.forEach((source, i) =>
      execute(source, examples[lesson.topicId][i]),
    );
    for (const exercise of lesson.exercises ?? []) {
      if (exercise.id === "debugging-p3" || exercise.id === "arrays-p1") {
        const result = spawnSync("python3", ["-I", "-"], {
          input: exercise.source,
          encoding: "utf8",
          timeout: 3000,
        });
        expect(result.status).toBe(1);
        if (exercise.id === "debugging-p3") {
          expect(result.stderr).toContain("ZeroDivisionError");
          expect(result.stderr).toContain("in average");
          expect(result.stdout).toBe("");
        } else {
          expect(result.stderr).toContain("IndexError");
          expect(result.stdout).toContain("10");
        }
      } else {
        expect(predictions[exercise.id]).toBeDefined();
        execute(exercise.source, predictions[exercise.id]);
      }
    }
    const demo = lesson.demonstration;
    if (demo.kind === "trace")
      for (const program of [demo, ...(demo.scenarios ?? [])])
        execute(program.source, program.steps.at(-1)!.output.join("\n"));
  }
}, 15000);
