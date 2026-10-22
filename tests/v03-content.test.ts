import { describe, expect, it } from "vitest";
import { lessons } from "@/content/lessons";
import { topics, programmingPath } from "@/content/curriculum";
import { projects, numberGuessingProject } from "@/content/projects";
import { assessments, fundamentalsAssessment } from "@/content/assessments";
import { recursionTrace } from "@/content/recursion-lesson";
import { validateActivities } from "@/lib/activity-validation";
import { validateTrace } from "@/lib/trace";
import { scoreQuestions } from "@/lib/quiz";
import {
  loadProjectProgress,
  parseProjectProgress,
  PROJECT_PROGRESS_KEY,
  saveProjectProgress,
  serializeProjectProgress,
} from "@/lib/project-progress";
import { PROGRESS_KEY, parseProgress } from "@/lib/progress";

describe("V0.3 content and assessment contracts", () => {
  it("publishes both complete lessons, seven path members, and advisory debugging foundations", () => {
    for (const id of ["recursion", "debugging"]) {
      expect(topics.find((t) => t.id === id)?.status).toBe("available");
      const l = lessons[id];
      expect(l.objectives.length).toBeGreaterThanOrEqual(3);
      expect(l.exercises!.length).toBeGreaterThanOrEqual(3);
      expect(l.sections!.length).toBeGreaterThanOrEqual(3);
      expect(l.questions).toHaveLength(3);
    }
    expect(programmingPath).toHaveLength(7);
    expect(
      topics.find((t) => t.id === "debugging")?.prerequisites,
    ).not.toContain("recursion");
    expect(validateActivities(topics, lessons, projects, assessments)).toEqual(
      [],
    );
  });
  it("rejects duplicate activity, checkpoint, and global question IDs", () => {
    expect(
      validateActivities(
        topics,
        lessons,
        [...projects, ...projects],
        assessments,
      ).join(" "),
    ).toMatch(/Duplicate/);
    const project = structuredClone(numberGuessingProject);
    project.checkpoints.push(project.checkpoints[0]);
    project.checkpoints[1].exercise!.id = lessons.functions.questions[0].id;
    expect(
      validateActivities(topics, lessons, [project], assessments).join(" "),
    ).toMatch(/Duplicate.*Duplicate/);
  });
  it("rejects missing explanations, invalid answers/references, and missing coverage", () => {
    const assessment = structuredClone(fundamentalsAssessment);
    assessment.questions[0].correctIndex = 99;
    assessment.questions[1].explanation = "";
    assessment.questions.forEach((q) => {
      q.topicIds = ["unknown"];
    });
    const errors = validateActivities(topics, lessons, projects, [
      assessment,
    ]).join(" ");
    expect(errors).toMatch(/Invalid activity answer/);
    expect(errors).toMatch(/Invalid activity topic references/);
    expect(errors).toMatch(/Missing assessment topic coverage/);
  });
  it("scores unanswered, invalid, partial, and complete attempts without touching manual progress", () => {
    const qs = fundamentalsAssessment.questions;
    const answers = Object.fromEntries(qs.map((q) => [q.id, q.correctIndex]));
    const raw = '{"version":1,"completed":["variables-data-types"]}';
    localStorage.setItem(PROGRESS_KEY, raw);
    expect(scoreQuestions(qs, {})).toBe(0);
    expect(
      scoreQuestions(qs, { [qs[0].id]: NaN, [qs[1].id]: 999, [qs[2].id]: 0.5 }),
    ).toBe(0);
    expect(scoreQuestions(qs, { [qs[0].id]: qs[0].correctIndex })).toBe(1);
    expect(scoreQuestions(qs, answers)).toBe(12);
    expect(localStorage.getItem(PROGRESS_KEY)).toBe(raw);
  });
});

describe("recursive trace invariants", () => {
  it("allows an ordinary active-local assignment without a structural stack event", () => {
    const trace = structuredClone(recursionTrace);
    trace.source =
      "def increase(n):\n    result = n + 1\n    return result\nprint(increase(1))";
    const frame = {
      id: "increase-1",
      functionName: "increase",
      arguments: [{ name: "n", value: 1 }],
      locals: [{ name: "n", value: 1 }],
      status: "running" as const,
    };
    const assigned = {
      ...frame,
      locals: [...frame.locals, { name: "result", value: 2 }],
    };
    trace.steps = [
      {
        lines: [1],
        explanation: "Define the function.",
        variables: [],
        output: [],
        stack: [],
      },
      {
        lines: [4],
        explanation: "Push increase(1).",
        variables: [],
        output: [],
        stack: [frame],
        stackEvent: { kind: "push", frameId: frame.id },
      },
      {
        lines: [2],
        explanation: "Assign result in the active frame.",
        variables: [],
        output: [],
        stack: [assigned],
      },
      {
        lines: [3],
        explanation: "Return 2.",
        variables: [],
        output: [],
        stack: [{ ...assigned, status: "returned", returnValue: 2 }],
        stackEvent: { kind: "return", frameId: frame.id },
      },
      {
        lines: [4],
        explanation: "Pop the completed frame.",
        variables: [],
        output: [],
        stack: [],
        stackEvent: { kind: "pop", frameId: frame.id },
      },
      {
        lines: [4],
        explanation: "Print the returned value.",
        variables: [],
        output: ["2"],
        stack: [],
      },
    ];
    expect(validateTrace(trace)).toEqual([]);
  });

  it("models four independent frames, a reachable base, returns in LIFO order, and a completed empty stack", () => {
    expect(validateTrace(recursionTrace)).toEqual([]);
    const stack = recursionTrace.steps[4].stack!;
    expect(
      stack.map((f) => f.locals.find((v) => v.name === "n")!.value),
    ).toEqual([3, 2, 1, 0]);
    expect(stack.map((f) => f.status)).toEqual([
      "waiting",
      "waiting",
      "waiting",
      "running",
    ]);
    expect(
      recursionTrace.steps
        .filter((s) => s.stackEvent?.kind === "return")
        .map((s) => s.stack!.at(-1)!.returnValue),
    ).toEqual([1, 1, 2, 6]);
    expect(
      recursionTrace.steps
        .filter((s) => s.stackEvent?.kind === "pop")
        .map((s) => s.stackEvent!.frameId),
    ).toEqual(["factorial-0", "factorial-1", "factorial-2", "factorial-3"]);
    expect(recursionTrace.steps.at(-1)!.stack).toEqual([]);
  });
  it.each([
    "early-pop",
    "reused-id",
    "changed-argument",
    "missing-return",
    "missing-event",
    "missing-stack",
    "suspended-local",
    "unfinished",
    "invalid-value",
  ])("rejects %s", (caseName) => {
    const trace = structuredClone(recursionTrace);
    if (caseName === "early-pop")
      trace.steps[5].stackEvent = { kind: "pop", frameId: "factorial-0" };
    if (caseName === "reused-id") trace.steps[2].stack![1].id = "factorial-3";
    if (caseName === "changed-argument")
      trace.steps[5].stack![0].arguments[0].value = 99;
    if (caseName === "missing-return")
      delete trace.steps[6].stack![3].returnValue;
    if (caseName === "missing-event") delete trace.steps[1].stackEvent;
    if (caseName === "missing-stack") delete trace.steps[2].stack;
    if (caseName === "suspended-local")
      trace.steps[3].stack![0].locals[0].value = 2;
    if (caseName === "unfinished") trace.steps = trace.steps.slice(0, 5);
    if (caseName === "invalid-value")
      trace.steps[1].stack![0].locals[0].value = Infinity;
    expect(validateTrace(trace).length).toBeGreaterThan(0);
  });
});

describe("separate project progress", () => {
  it("writes only a distinct versioned key, restores known checkpoint IDs, and preserves v1 lessons", () => {
    localStorage.setItem(
      PROGRESS_KEY,
      '{"version":1,"completed":["recursion"]}',
    );
    expect(
      saveProjectProgress(localStorage, [
        "understand",
        "understand",
        "logic",
        "unknown",
      ]),
    ).toBe(true);
    expect(PROJECT_PROGRESS_KEY).not.toBe(PROGRESS_KEY);
    expect(loadProjectProgress(localStorage)).toEqual(["understand", "logic"]);
    expect(parseProgress(localStorage.getItem(PROGRESS_KEY))).toEqual([
      "recursion",
    ]);
    expect(JSON.parse(serializeProjectProgress(["review"]))).toEqual({
      version: 1,
      projectId: "number-guessing",
      completed: ["review"],
    });
  });
  it.each([
    null,
    "{bad",
    "null",
    "[]",
    "42",
    '{"version":2,"projectId":"number-guessing","completed":[]}',
    '{"version":1,"projectId":"other","completed":["understand"]}',
    '{"version":1,"projectId":"number-guessing","completed":true}',
  ])("ignores malformed project storage %s", (raw) => {
    expect(parseProjectProgress(raw)).toEqual([]);
  });
  it("filters unknown values and tolerates denied reads and writes", () => {
    expect(
      parseProjectProgress(
        '{"version":1,"projectId":"number-guessing","completed":["logic","logic",null,2,"recursion"]}',
      ),
    ).toEqual(["logic"]);
    const blocked = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("quota");
      },
    };
    expect(loadProjectProgress(blocked)).toEqual([]);
    expect(saveProjectProgress(blocked, ["logic"])).toBe(false);
  });
});
