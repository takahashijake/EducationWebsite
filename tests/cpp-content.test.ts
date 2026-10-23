import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { cppExercises } from "@/content/cpp-exercises";
import { availableTopics } from "@/content/curriculum";
import { cppSolutions } from "./cpp-solutions";
import { normalizeOutput } from "@/lib/coding-evaluation";

describe("C++ authored content", () => {
  it("has stable unique identities, published lesson connections, and complete guidance", () => {
    expect(cppExercises).toHaveLength(8);
    expect(new Set(cppExercises.map((exercise) => exercise.id)).size).toBe(8);
    for (const exercise of cppExercises) {
      expect(
        availableTopics.some((topic) => topic.id === exercise.topicId),
      ).toBe(true);
      expect(exercise.starter.length).toBeLessThan(24000);
      expect(exercise.objectives.length).toBeGreaterThan(0);
      expect(exercise.hints.length).toBeGreaterThanOrEqual(2);
      expect(exercise.commonMistakes.length).toBeGreaterThan(0);
      expect(exercise.introduction.length).toBeGreaterThan(100);
      expect(exercise.workedExample.explanation).toBeTruthy();
      expect(exercise.statement).toBeTruthy();
      expect(new Set(exercise.tests.map((test) => test.id)).size).toBe(
        exercise.tests.length,
      );
      expect(exercise.tests.length).toBeGreaterThanOrEqual(3);
    }
  });
  for (const exercise of cppExercises)
    it(`${exercise.id}: validates the solution and rejects the starter against real C++ tests`, () => {
      const dir = mkdtempSync(join(tmpdir(), "cs-cpp-"));
      const source = join(dir, "main.cpp");
      const binary = join(dir, "program");
      try {
        function compile(code: string) {
          writeFileSync(source, code);
          const result = spawnSync(
            "g++",
            ["-std=c++17", "-Wall", "-Wextra", source, "-o", binary],
            { timeout: 15000, encoding: "utf8" },
          );
          expect(result.status, result.stderr).toBe(0);
        }
        compile(cppSolutions[exercise.id]);
        for (const test of [...exercise.examples, ...exercise.tests]) {
          const result = spawnSync(binary, [], {
            input: test.stdin,
            timeout: 1000,
            encoding: "utf8",
          });
          expect(result.status).toBe(0);
          expect(result.stderr).toBe("");
          expect(normalizeOutput(result.stdout), test.label).toBe(
            normalizeOutput(test.stdout),
          );
        }
        compile(exercise.starter);
        expect(
          exercise.tests.some((test) => {
            const result = spawnSync(binary, [], {
              input: test.stdin,
              timeout: 1000,
              encoding: "utf8",
            });
            return (
              result.status !== 0 ||
              normalizeOutput(result.stdout) !== normalizeOutput(test.stdout)
            );
          }),
        ).toBe(true);
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    }, 30000);
});
