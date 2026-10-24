import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { LessonDemonstration } from "@/components/lesson-demonstration";
import { CodeTrace } from "@/components/code-trace";
import { PracticeExercise } from "@/components/practice-exercise";
import { LearningPath } from "@/components/learning-path";
import { ProgressProvider } from "@/components/progress-provider";
import { LessonLayout } from "@/components/lesson-layout";
import { lessons } from "@/content/lessons";
import {
  topics,
  programmingPath,
  lessonNeighbors,
  availableTopics,
} from "@/content/curriculum";
import { validateContent } from "@/lib/content-validation";
import { tracePosition, validateTrace } from "@/lib/trace";
import { evaluateAnswer } from "@/lib/quiz";
import {
  parseProgress,
  pathProgress,
  progressSummary,
  PROGRESS_KEY,
} from "@/lib/progress";
const trace = lessons.loops.demonstration;
if (trace.kind !== "trace") throw new Error("Missing loop trace");

describe("authored content integrity", () => {
  it("validates the published catalog and globally unique assessment IDs", () => {
    expect(validateContent(topics, lessons, programmingPath)).toEqual([]);
    expect(availableTopics).toHaveLength(11);
    expect(topics.filter((t) => t.status === "planned")).toHaveLength(35);
  });
  it("rejects missing references, cycles, duplicate slugs, incomplete content and bad path order", () => {
    const cyclic = topics.map((t) =>
      t.id === programmingPath[0]
        ? { ...t, prerequisites: ["functions", "missing"] }
        : t,
    );
    expect(validateContent(cyclic, lessons, programmingPath).join(" ")).toMatch(
      /cycle/,
    );
    expect(validateContent(cyclic, lessons, programmingPath).join(" ")).toMatch(
      /Unknown prerequisite/,
    );
    expect(
      validateContent([...topics, topics[0]], lessons, programmingPath),
    ).toContain("Duplicate topic ID or slug");
    expect(validateContent(topics, {}, programmingPath).join(" ")).toMatch(
      /Missing lesson/,
    );
    expect(
      validateContent(topics, lessons, [...programmingPath].reverse()).join(
        " ",
      ),
    ).toMatch(/Invalid path order/);
    const invalid = {
      ...lessons.loops,
      questions: [
        { ...lessons.loops.questions[0], correctIndex: 99 },
        ...lessons.loops.questions.slice(1),
      ],
    };
    expect(
      validateContent(
        topics,
        { ...lessons, loops: invalid },
        programmingPath,
      ).join(" "),
    ).toMatch(/Invalid answer/);
  });
  it("rejects invalid trace lines, empty steps and invalid scoped state", () => {
    expect(validateTrace(trace)).toEqual([]);
    expect(validateTrace({ ...trace, steps: [] })).toContain(
      "Incomplete trace",
    );
    expect(
      validateTrace({
        ...trace,
        steps: [
          {
            lines: [999],
            explanation: "",
            variables: [{ name: "", value: NaN, scope: "" }],
            output: [],
          },
        ],
      }).join(" "),
    ).toMatch(/Invalid step.*Invalid variables/);
  });
  it("validates all authored predictions deterministically, including invalid answers", () => {
    const exercises = Object.values(lessons).flatMap((l) => l.exercises ?? []);
    expect(exercises).toHaveLength(15);
    for (const e of exercises) {
      e.options.forEach((_, index) =>
        expect(evaluateAnswer(e, index)).toBe(index === e.correctIndex),
      );
      for (const invalid of [-1, NaN, Infinity, 0.5, e.options.length])
        expect(evaluateAnswer(e, invalid)).toBe(false);
    }
  });
  it("clamps trace navigation and resets to the beginning", () => {
    expect(tracePosition(0, "previous", 5)).toBe(0);
    expect(tracePosition(4, "next", 5)).toBe(4);
    expect(tracePosition(2, "next", 5)).toBe(3);
    expect(tracePosition(2, "previous", 5)).toBe(1);
    expect(tracePosition(4, "reset", 5)).toBe(0);
  });
  it("resolves the exact core order and keeps other sections independent", () => {
    expect(programmingPath).toEqual([
      "variables-data-types",
      "operators-expressions",
      "conditionals",
      "loops",
      "functions",
      "recursion",
      "debugging",
    ]);
    programmingPath.forEach((id, i) => {
      const topic = topics.find((t) => t.id === id)!;
      expect(lessonNeighbors(topic).previous?.id).toBe(programmingPath[i - 1]);
      expect(lessonNeighbors(topic).next?.id).toBe(programmingPath[i + 1]);
      for (const prerequisite of topic.prerequisites ?? [])
        expect(programmingPath.indexOf(prerequisite)).toBeLessThan(i);
    });
    expect(
      lessonNeighbors(topics.find((t) => t.id === "big-o-notation")!).next,
    ).toHaveProperty("id", "searching");
  });
  it("keeps original v1 completions and separates global and core counts", () => {
    const ids = parseProgress(
      '{"version":1,"completed":["variables-data-types","binary-number-representation","big-o-notation"]}',
    );
    expect(ids).toHaveLength(3);
    expect(progressSummary(ids)).toEqual({
      completed: 3,
      available: 11,
      percentage: 27,
    });
    expect(pathProgress([...ids, ids[0], "propositional-logic"])).toEqual({
      completed: 1,
      available: 7,
      percentage: 14,
      recommendedId: "operators-expressions",
    });
    expect(pathProgress(programmingPath).recommendedId).toBeUndefined();
  });
});

describe("interactive teaching", () => {
  it("navigates a loop trace with correct states, boundaries and reset using the keyboard", async () => {
    const user = userEvent.setup();
    render(<CodeTrace trace={trace} />);
    expect(
      screen.getByRole("button", { name: "Previous step" }),
    ).toBeDisabled();
    const next = screen.getByRole("button", { name: "Next step" });
    next.focus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("status")).toHaveTextContent("Iteration 1");
    expect(
      within(screen.getByRole("status")).getByText("i"),
    ).toBeInTheDocument();
    await user.click(next);
    expect(screen.getByRole("status")).toHaveTextContent("store 1");
    await user.click(screen.getByRole("button", { name: "Previous step" }));
    expect(screen.getByRole("status")).toHaveTextContent("Get the first item");
    for (let i = 0; i < trace.steps.length; i++) await user.click(next);
    expect(next).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Final result: Three iterations accumulate 6",
    );
    await user.click(screen.getByRole("button", { name: "Reset trace" }));
    expect(screen.getByRole("status")).toHaveTextContent("step 1 of");
  });
  it("starts a new walkthrough at its first step when the lesson changes", async () => {
    const user = userEvent.setup();
    const view = render(
      <LessonDemonstration demonstration={lessons.loops.demonstration} />,
    );
    for (let i = 1; i < trace.steps.length; i++)
      await user.click(screen.getByRole("button", { name: "Next step" }));
    expect(screen.getByRole("status")).toHaveTextContent("Finished");
    view.rerender(
      <LessonDemonstration demonstration={lessons.functions.demonstration} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent("step 1 of 7");
    expect(
      screen.getByRole("button", { name: "Previous step" }),
    ).toBeDisabled();
  });
  for (const id of [
    "operators-expressions",
    "conditionals",
    "loops",
    "functions",
  ]) {
    it(`shows ${id} final state and authored explanation`, async () => {
      const user = userEvent.setup();
      const demo = lessons[id].demonstration;
      if (demo.kind !== "trace") throw new Error("Missing trace");
      render(<CodeTrace trace={demo} />);
      const next = screen.getByRole("button", { name: "Next step" });
      for (let i = 1; i < demo.steps.length; i++) await user.click(next);
      expect(screen.getByRole("status")).toHaveTextContent(demo.result);
      expect(screen.getByRole("status")).toHaveTextContent(
        demo.steps.at(-1)!.output.join("\n"),
      );
    });
  }
  it("shows incorrect and correct prediction feedback, resets, and never writes progress", async () => {
    const user = userEvent.setup();
    const e = lessons.functions.exercises![1];
    localStorage.setItem(
      PROGRESS_KEY,
      '{"version":1,"completed":["variables-data-types"]}',
    );
    const before = localStorage.getItem(PROGRESS_KEY);
    render(<PracticeExercise exercise={e} />);
    const check = screen.getByRole("button", { name: "Check prediction" });
    expect(check).toBeDisabled();
    await user.click(screen.getByLabelText(e.options[0]));
    await user.click(check);
    expect(screen.getByRole("status")).toHaveTextContent("Not quite.");
    expect(screen.getByRole("status")).toHaveTextContent(e.explanation);
    await user.click(screen.getByRole("button", { name: "Retry exercise" }));
    expect(
      screen.getByRole("button", { name: "Check prediction" }),
    ).toBeDisabled();
    await user.click(screen.getByLabelText(e.options[e.correctIndex]));
    await user.click(screen.getByRole("button", { name: "Check prediction" }));
    expect(screen.getByRole("status")).toHaveTextContent("Correct.");
    expect(localStorage.getItem(PROGRESS_KEY)).toBe(before);
  });
  it("recommends the first incomplete core lesson and identifies the current lesson", () => {
    localStorage.setItem(
      PROGRESS_KEY,
      '{"version":1,"completed":["variables-data-types"]}',
    );
    render(
      <ProgressProvider>
        <LearningPath currentId="operators-expressions" />
      </ProgressProvider>,
    );
    expect(screen.getByText("Lesson 2 of 7")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Operators and Expressions" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByText("Available · Recommended next step").parentElement,
    ).toHaveTextContent("Operators and Expressions");
  });
  it("renders contextual previous and next links and connects Functions to Recursion", () => {
    const topic = topics.find((t) => t.id === "functions")!;
    render(
      <ProgressProvider>
        <LessonLayout topic={topic} lesson={lessons.functions} />
      </ProgressProvider>,
    );
    const nav = screen.getByRole("navigation", { name: "Continue learning" });
    expect(
      within(nav).getByRole("link", { name: "Previous Lesson: Loops" }),
    ).toHaveAttribute("href", "/lessons/loops");
    expect(
      within(nav).getByRole("link", { name: "Next Lesson: Recursion" }),
    ).toHaveAttribute("href", "/lessons/recursion");
  });
});
