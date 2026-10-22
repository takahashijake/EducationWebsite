import { spawnSync } from "node:child_process";
import { expect, it } from "vitest";
import { lessons } from "@/content/lessons";
import { recursionTrace } from "@/content/recursion-lesson";
import {
  numberGuessingProject as project,
  guessingGameSource as gameSource,
} from "@/content/projects";
import { fundamentalsAssessment as assessment } from "@/content/assessments";

it("verifies authored Python outputs, corrections, edge cases, and recursive locals with Python 3", () => {
  const result = spawnSync("python3", ["scripts/verify-python.py"], {
    input: JSON.stringify({
      lessons,
      recursionTrace,
      project,
      gameSource,
      assessment,
    }),
    encoding: "utf8",
    timeout: 10000,
  });
  expect(result.error, result.stderr).toBeUndefined();
  expect(result.status, result.stderr).toBe(0);
  const report = JSON.parse(result.stdout);
  expect(report.programs).toBeGreaterThanOrEqual(60);
  expect(report.game_cases).toBe(10);
  expect(report.recursive_frames_verified).toBe(4);
  console.info("Python verification:", report);
});
