import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  linkedReachability,
  generateLinkedSteps,
  linkedScenarios,
  type LinkedScenario,
} from "@/lib/linked-list-steps";
import { linkedListCodingExercises } from "@/content/linked-list-coding-exercises";
import { linkedListRetrievalQuestions } from "@/content/linked-list-catalog";
import {
  adaptiveFamilies,
  generateAdaptiveInstance,
} from "@/content/adaptive-families";
import { skills, activities } from "@/content/learning-catalog";
import { validateLearningCatalog } from "@/content/learning-catalog-validation";
import { linkedListSolutions } from "./linked-list-solutions";

const python = (source: string, check: string) =>
  spawnSync("python3", ["-I", "-"], {
    input: `${source}\n${check}\n`,
    encoding: "utf8",
    timeout: 1500,
  });

describe("linked reference engine", () => {
  it("keeps unique stable IDs, valid links and accurate reachability in every step", () => {
    for (const scenario of linkedScenarios) {
      const steps = generateLinkedSteps(scenario);
      expect(steps.length).toBeGreaterThan(1);
      expect(steps.length).toBeLessThan(40);
      for (const step of steps) {
        const ids = step.nodes.map((n) => n.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(step.reachable).toEqual(
          linkedReachability(step.nodes, step.head),
        );
        expect([...step.reachable, ...step.detached].sort()).toEqual(
          [...ids].sort(),
        );
        for (const node of step.nodes)
          if (node.next !== null) expect(ids).toContain(node.next);
        for (const pointer of [step.current, step.previous])
          if (pointer !== null) expect(ids).toContain(pointer);
      }
      expect(steps[0].nodes.map((n) => n.value)).toEqual(scenario.values);
      const final = steps.at(-1)!;
      if (scenario.operation === "prepend" || scenario.operation === "append") {
        expect(final.reachable.length).toBe(scenario.values.length + 1);
        expect(final.reachable.filter((id) => id !== "new")).toEqual(
          scenario.values.map((_, i) => `n${i}`),
        );
      }
      if (scenario.operation === "delete") {
        const first = scenario.values.indexOf(scenario.target!);
        expect(final.reachable).toEqual(
          scenario.values.map((_, i) => `n${i}`).filter((_, i) => i !== first),
        );
      }
    }
  });
  it("detects malformed references and bounds generation", () => {
    expect(() =>
      linkedReachability([{ id: "A", value: 1, next: "A" }], "A"),
    ).toThrow(/Cycle/);
    expect(() =>
      linkedReachability([{ id: "A", value: 1, next: "B" }], "A"),
    ).toThrow(/Dangling/);
    expect(() =>
      linkedReachability(
        [
          { id: "A", value: 1, next: null },
          { id: "A", value: 2, next: null },
        ],
        "A",
      ),
    ).toThrow(/Duplicate/);
    expect(() =>
      generateLinkedSteps({
        id: "large",
        label: "large",
        values: Array(13).fill(1),
        operation: "traverse",
      }),
    ).toThrow(/at most/);
  });
  it("holds for varied lengths, duplicates, and deletion positions", () => {
    for (let n = 0; n <= 10; n++)
      for (let target = 0; target <= 3; target++) {
        const values = Array.from({ length: n }, (_, i) => i % 4);
        for (const operation of [
          "traverse",
          "search",
          "prepend",
          "append",
          "delete",
        ] as const) {
          const scenario: LinkedScenario = {
            id: "property",
            label: "property",
            values,
            operation,
            target,
          };
          const steps = generateLinkedSteps(scenario);
          const final = steps.at(-1)!;
          expect(final.reachable).toEqual(
            linkedReachability(final.nodes, final.head),
          );
          expect(final.reachable.length).toBe(
            n +
              (operation === "prepend" || operation === "append"
                ? 1
                : operation === "delete" && values.includes(target)
                  ? -1
                  : 0),
          );
          expect(steps.length).toBeLessThan(40);
        }
      }
  });
});

describe("linked curriculum and code", () => {
  it("maps six skills and focused retrieval, labs, and adaptive families", () => {
    const linkedSkills = skills.filter((s) => s.topicId === "linked-lists");
    expect(linkedSkills).toHaveLength(6);
    expect(linkedListRetrievalQuestions).toHaveLength(12);
    expect(
      new Set(
        linkedListRetrievalQuestions.map((question) => question.correctIndex),
      ),
    ).toEqual(new Set([0, 1, 2]));
    for (const skill of linkedSkills) {
      expect(
        linkedListRetrievalQuestions.filter(
          (q) => q.skillIds.join() === skill.id,
        ),
      ).toHaveLength(2);
      expect(adaptiveFamilies.some((f) => f.skillId === skill.id)).toBe(true);
    }
    expect(linkedListCodingExercises).toHaveLength(5);
    expect(validateLearningCatalog()).toEqual([]);
    for (const exercise of linkedListCodingExercises)
      expect(activities.find((a) => a.id === exercise.id)?.revision).toBe(1);
  });
  it("executes reference solutions and detects defective starters", () => {
    for (const exercise of linkedListCodingExercises) {
      const solution = linkedListSolutions[exercise.id];
      expect(solution).toBeTruthy();
      expect(exercise.referenceSolution).toBe(solution);
      let starterFailures = 0;
      for (const check of exercise.tests) {
        const result = python(solution, check.code);
        expect(
          result.status,
          `${exercise.id}/${check.id}: ${result.stderr}`,
        ).toBe(0);
        const broken = python(exercise.starter, check.code);
        if (broken.status !== 0) starterFailures++;
      }
      expect(starterFailures, exercise.id).toBeGreaterThan(0);
    }
  });
  it("generates deterministic, distinct adaptive choices and meaningful variation", () => {
    const families = adaptiveFamilies.filter(
      (f) => f.topicId === "linked-lists",
    );
    expect(families.length).toBeGreaterThanOrEqual(8);
    for (const family of families) {
      const contexts = new Set<string>();
      for (let seed = 0; seed < 80; seed++) {
        const instance = generateAdaptiveInstance(
          family.id,
          family.revision,
          seed,
        )!;
        expect(instance).toEqual(
          generateAdaptiveInstance(family.id, family.revision, seed),
        );
        expect(new Set(instance.options.map((o) => o.text)).size).toBe(3);
        expect(
          instance.options[instance.correctIndex].misconception,
        ).toBeUndefined();
        contexts.add(instance.context);
      }
      expect(contexts.size, family.id).toBeGreaterThan(1);
    }
  });
  it("matches independently derived reference-operation answers", () => {
    for (const family of adaptiveFamilies.filter(
      (item) => item.topicId === "linked-lists",
    )) {
      for (let seed = 0; seed < 40; seed++) {
        const instance = generateAdaptiveInstance(family.id, 1, seed)!;
        const context = instance.context;
        const links = [...context.matchAll(/([A-E])\(-?\d+\) → ([A-E]|null)/g)];
        const answer = instance.options[instance.correctIndex].text;
        if (family.id === "linked-next-reference") {
          const current = context.match(/current → ([A-E])/)![1];
          expect(answer).toBe(links.find((match) => match[1] === current)![2]);
        } else if (family.id === "linked-chain-termination") {
          expect(answer).toBe(`${links.length} nodes`);
        } else if (family.id === "linked-first-duplicate") {
          const target = Number(instance.prompt.match(/for (-?\d+)/)![1]);
          const first = links.find(
            (match) => Number(match[0].match(/\((-?\d+)\)/)![1]) === target,
          )!;
          expect(answer).toBe(first[1]);
        } else if (family.id === "linked-prepend-order") {
          expect(answer).toBe(
            `head → X → ${links.map((match) => match[1]).join(" → ")} → null`,
          );
        } else if (family.id === "linked-empty-head") {
          expect(answer).toBe("head → X; X.next → null");
        } else if (family.id === "linked-delete-head") {
          expect(answer).toBe(links[0][2]);
        } else if (family.id === "linked-delete-middle") {
          const previous = context.match(/previous → ([A-E])/)![1];
          const current = links.find((match) => match[1] === previous)![2];
          const successor = links.find((match) => match[1] === current)![2];
          expect(answer).toBe(`${previous}.next → ${successor}`);
        } else if (family.id === "linked-lost-reference") {
          expect(answer).toBe(
            `The old chain A through ${links.at(-1)![1]} becomes unreachable from head`,
          );
        } else if (family.id === "linked-append-cost") {
          expect(answer).toBe(
            context.includes("Only a head reference")
              ? "O(n): scan from head to find the tail"
              : "O(1): use tail.next and update tail",
          );
        } else if (family.id === "linked-alias-change") {
          expect(answer).toBe("A → null");
        }
      }
    }
  });
});
