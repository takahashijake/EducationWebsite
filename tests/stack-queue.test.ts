import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  generateStructureSteps,
  structureOrder,
  structureScenarios,
  MAX_OPERATIONS,
  type StructureOperation,
} from "@/lib/stack-queue-steps";
import { stackQueueCodingExercises } from "@/content/stack-queue-coding-exercises";
import { stackQueueSolutions } from "@/content/stack-queue-solutions";
import { stackQueueRetrievalQuestions } from "@/content/stack-queue-catalog";
import {
  adaptiveFamilies,
  generateAdaptiveInstance,
} from "@/content/adaptive-families";
import { skills, activities } from "@/content/learning-catalog";
import { validateLearningCatalog } from "@/content/learning-catalog-validation";
import { lessons } from "@/content/lessons";
import { topics } from "@/content/curriculum";

const python = (source: string, check: string) =>
  spawnSync("python3", ["-I", "-"], {
    input: `${source}\n${check}\n`,
    encoding: "utf8",
    timeout: 2000,
  });

describe("stack and queue snapshots", () => {
  it("matches independent array oracles across varied operation sequences", () => {
    for (const kind of ["stack", "queue"] as const)
      for (let seed = 0; seed < 60; seed++) {
        const operations: StructureOperation[] = [];
        const expected: string[] = [];
        const model: string[] = [];
        for (let i = 0; i < 10; i++) {
          const choice = (seed * 13 + i * 17) % 5;
          if (choice < 2) {
            const value = `${(seed + i) % 3}`;
            operations.push({ action: "insert", value });
            if (kind === "stack") model.unshift(value);
            else model.push(value);
            expected.push("None");
          } else if (choice === 2) {
            operations.push({ action: "remove" });
            expected.push(model.shift() ?? "None (underflow)");
          } else if (choice === 3) {
            operations.push({ action: "inspect" });
            expected.push(
              kind === "stack"
                ? (model[0] ?? "None (empty)")
                : model.length
                  ? `front ${model[0]}; rear ${model.at(-1)}`
                  : "front None; rear None",
            );
          } else {
            operations.push({ action: "clear" });
            model.length = 0;
            expected.push("None");
          }
          const steps = generateStructureSteps(kind, operations);
          const final = steps.at(-1)!;
          expect(
            final.order.map(
              (id) => final.nodes.find((node) => node.id === id)!.value,
            ),
          ).toEqual(model);
          expect(final.result).toBe(expected.at(-1));
          for (const step of steps) {
            expect(step.order).toEqual(structureOrder(step.nodes, step.head));
            expect(step.tail).toBe(step.order.at(-1) ?? null);
            expect(new Set(step.nodes.map((node) => node.id)).size).toBe(
              step.nodes.length,
            );
          }
        }
      }
  });
  it("preserves identity and immutable previous snapshots, including singleton removal", () => {
    for (const scenario of structureScenarios) {
      const steps = generateStructureSteps(scenario.kind, scenario.operations);
      expect(steps.length).toBe(scenario.operations.length + 1);
      expect(steps.length).toBeLessThanOrEqual(MAX_OPERATIONS + 1);
      const frozen = JSON.stringify(steps[1]);
      steps.at(-1)!.nodes.push({ id: "sentinel", value: "x", next: null });
      expect(JSON.stringify(steps[1])).toBe(frozen);
    }
    const steps = generateStructureSteps("queue", [
      { action: "insert", value: "7" },
      { action: "insert", value: "7" },
      { action: "remove" },
      { action: "remove" },
    ]);
    expect(steps[2].head).not.toBe(steps[2].tail);
    expect(steps[2].nodes[0].id).not.toBe(steps[2].nodes[1].id);
    expect(steps[3].head).toBe(steps[2].nodes[1].id);
    expect(steps[4].head).toBeNull();
    expect(steps[4].tail).toBeNull();
  });
  it("rejects bounds and malformed references", () => {
    expect(() =>
      generateStructureSteps("stack", Array(13).fill({ action: "inspect" })),
    ).toThrow();
    expect(() =>
      generateStructureSteps("queue", [{ action: "insert", value: "" }]),
    ).toThrow();
    expect(() =>
      generateStructureSteps("queue", [
        { action: "insert", value: "x".repeat(13) },
      ]),
    ).toThrow();
    expect(() =>
      generateStructureSteps(
        "queue",
        Array(11).fill({ action: "insert", value: "x" }),
      ),
    ).toThrow();
    expect(() =>
      structureOrder([{ id: "n0", value: "x", next: "missing" }], "n0"),
    ).toThrow();
  });
});

describe("stack and queue curriculum", () => {
  it("publishes stable topic, six skills, focused retrieval and 12 seeded families", () => {
    expect(topics.find((t) => t.id === "stacks-queues")).toMatchObject({
      slug: "stacks-queues",
      status: "available",
    });
    expect(lessons["stacks-queues"].questions.length).toBeGreaterThanOrEqual(3);
    expect(lessons["stacks-queues"].codingExercises).toHaveLength(6);
    const ownSkills = skills.filter((s) => s.topicId === "stacks-queues");
    expect(ownSkills).toHaveLength(6);
    expect(stackQueueRetrievalQuestions).toHaveLength(12);
    for (const skill of ownSkills)
      expect(
        stackQueueRetrievalQuestions.filter(
          (q) => q.skillIds.join() === skill.id,
        ),
      ).toHaveLength(2);
    const families = adaptiveFamilies.filter(
      (f) => f.topicId === "stacks-queues",
    );
    expect(families).toHaveLength(12);
    for (const family of families) {
      const contexts = new Set<string>();
      for (let seed = 0; seed < 50; seed++) {
        const instance = generateAdaptiveInstance(family.id, 1, seed)!;
        expect(instance).toEqual(generateAdaptiveInstance(family.id, 1, seed));
        expect(new Set(instance.options.map((o) => o.text)).size).toBe(3);
        expect(
          instance.options[instance.correctIndex].misconception,
        ).toBeUndefined();
        contexts.add(instance.context);
      }
      expect(contexts.size).toBeGreaterThan(1);
      expect(
        activities.filter((a) => a.id === `adaptive-${family.id}`),
      ).toHaveLength(1);
    }
    expect(validateLearningCatalog()).toEqual([]);
  });
  it("runs every Python reference and catches broken starters", () => {
    for (const exercise of stackQueueCodingExercises) {
      expect(exercise.referenceSolution).toBe(stackQueueSolutions[exercise.id]);
      let starterFailures = 0;
      for (const check of exercise.tests) {
        const result = python(exercise.referenceSolution!, check.code);
        expect(
          result.status,
          `${exercise.id}/${check.id}: ${result.stderr}`,
        ).toBe(0);
        if (python(exercise.starter, check.code).status !== 0)
          starterFailures++;
      }
      expect(starterFailures, exercise.id).toBeGreaterThan(0);
    }
  });
});
