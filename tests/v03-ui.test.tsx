import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CodeTrace } from "@/components/code-trace";
import { PracticeExercise } from "@/components/practice-exercise";
import { GuidedProject } from "@/components/guided-project";
import { ProgressProvider } from "@/components/progress-provider";
import { LessonLayout } from "@/components/lesson-layout";
import AssessmentPage from "@/app/assessments/programming-fundamentals/page";
import { numberGuessingProject as project } from "@/content/projects";
import { fundamentalsAssessment as assessment } from "@/content/assessments";
import { recursionTrace } from "@/content/recursion-lesson";
import { lessons } from "@/content/lessons";
import { topics } from "@/content/curriculum";
import { PROGRESS_KEY } from "@/lib/progress";
import {
  PROJECT_PROGRESS_KEY,
  serializeProjectProgress,
} from "@/lib/project-progress";

describe("recursive call-stack player", () => {
  it("uses keyboard controls to push, reach the base, return, pop, step backward, and reset", async () => {
    const user = userEvent.setup();
    render(<CodeTrace trace={recursionTrace} />);
    const next = screen.getByRole("button", { name: "Next step" });
    const stack = screen.getByRole("region", { name: "Call stack" });
    expect(stack).toHaveTextContent("No active function calls");
    next.focus();
    await user.keyboard("{Enter}");
    expect(stack).toHaveTextContent("Stack event: push");
    expect(within(stack).getAllByRole("listitem")).toHaveLength(1);
    for (let i = 0; i < 3; i++) await user.click(next);
    expect(within(stack).getAllByRole("listitem")).toHaveLength(4);
    expect(within(stack).getAllByRole("listitem")[0]).toHaveTextContent("n=3");
    expect(within(stack).getAllByRole("listitem")[3]).toHaveAttribute(
      "aria-current",
      "step",
    );
    await user.click(next);
    expect(stack).toHaveTextContent("Stack event: base");
    await user.click(next);
    expect(stack).toHaveTextContent("Returning 1");
    expect(within(stack).getAllByRole("listitem")).toHaveLength(4);
    await user.click(next);
    expect(stack).toHaveTextContent("Stack event: pop");
    expect(within(stack).getAllByRole("listitem")).toHaveLength(3);
    await user.click(screen.getByRole("button", { name: "Previous step" }));
    expect(within(stack).getAllByRole("listitem")).toHaveLength(4);
    expect(stack).toHaveTextContent("Returning 1");
    for (let i = 0; i < recursionTrace.steps.length; i++)
      await user.click(next);
    expect(next).toBeDisabled();
    expect(screen.getByRole("status")).toHaveTextContent(recursionTrace.result);
    await user.click(screen.getByRole("button", { name: "Reset trace" }));
    expect(stack).toHaveTextContent("depth 0");
    expect(
      screen.getByRole("button", { name: "Previous step" }),
    ).toBeDisabled();
  });
});

describe("debugging and guided checkpoints", () => {
  for (const exercise of lessons.debugging.exercises!)
    it(`explains wrong and corrected diagnosis: ${exercise.id}`, async () => {
      const user = userEvent.setup();
      render(<PracticeExercise exercise={exercise} />);
      await user.click(
        screen.getByLabelText(
          exercise.options[
            (exercise.correctIndex + 1) % exercise.options.length
          ],
        ),
      );
      await user.click(
        screen.getByRole("button", { name: "Check prediction" }),
      );
      expect(screen.getByRole("status")).toHaveTextContent("Not quite.");
      expect(screen.getByRole("status")).toHaveTextContent(
        exercise.explanation,
      );
      await user.click(screen.getByRole("button", { name: "Retry exercise" }));
      await user.click(
        screen.getByLabelText(exercise.options[exercise.correctIndex]),
      );
      await user.click(
        screen.getByRole("button", { name: "Check prediction" }),
      );
      expect(screen.getByRole("status")).toHaveTextContent("Correct.");
    });
  it("records checkpoints separately, allows retry/navigation/undo, restores completion, and focuses the new heading", async () => {
    const user = userEvent.setup();
    const lessonRaw = '{"version":1,"completed":["variables-data-types"]}';
    localStorage.setItem(PROGRESS_KEY, lessonRaw);
    const view = render(<GuidedProject project={project} />);
    expect(
      screen.getByRole("button", { name: "Mark checkpoint complete" }),
    ).toBeDisabled();
    const e = project.checkpoints[0].exercise!;
    await user.click(screen.getByLabelText(e.options[e.correctIndex]));
    await user.click(screen.getByRole("button", { name: "Check prediction" }));
    await user.click(
      screen.getByRole("button", { name: "Mark checkpoint complete" }),
    );
    expect(JSON.parse(localStorage.getItem(PROJECT_PROGRESS_KEY)!)).toEqual({
      version: 1,
      projectId: project.id,
      completed: ["understand"],
    });
    await user.click(screen.getByRole("button", { name: "Next checkpoint" }));
    expect(
      screen.getByRole("heading", { name: "Implement the logic" }),
    ).toHaveFocus();
    expect(
      screen.getByRole("button", { name: /2\. Implement the logic/ }),
    ).toHaveAttribute("aria-current", "step");
    await user.click(
      screen.getByRole("button", { name: "Previous checkpoint" }),
    );
    expect(
      screen.getByRole("button", { name: "Checkpoint completed · Undo" }),
    ).toHaveAttribute("aria-pressed", "true");
    view.unmount();
    render(<GuidedProject project={project} />);
    expect(
      screen.getByRole("button", { name: "Checkpoint completed · Undo" }),
    ).toBeEnabled();
    await user.click(
      screen.getByRole("button", { name: "Checkpoint completed · Undo" }),
    );
    expect(
      screen.getByText(/Checkpoints completed: 0 of 6/),
    ).toBeInTheDocument();
    expect(localStorage.getItem(PROGRESS_KEY)).toBe(lessonRaw);
  });
  it("reflects cross-tab project changes without modifying lesson storage", () => {
    render(<GuidedProject project={project} />);
    localStorage.setItem(
      PROJECT_PROGRESS_KEY,
      serializeProjectProgress(["understand", "logic"]),
    );
    fireEvent(
      window,
      new StorageEvent("storage", { key: PROJECT_PROGRESS_KEY }),
    );
    expect(
      screen.getByText(/Checkpoints completed: 2 of 6/),
    ).toBeInTheDocument();
    expect(localStorage.getItem(PROGRESS_KEY)).toBeNull();
  });
  it("keeps checkpoint navigation advisory so the reference can be opened directly", async () => {
    const user = userEvent.setup();
    render(<GuidedProject project={project} />);
    await user.click(
      screen.getByRole("button", { name: /6\. Review and extend/ }),
    );
    expect(
      screen.getByRole("heading", { name: "Review and extend" }),
    ).toHaveFocus();
    expect(
      screen.getByRole("button", { name: "Next checkpoint" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Mark checkpoint complete" }),
    ).toBeEnabled();
  });
});

describe("integrated assessment", () => {
  it("hides explanations before submission, scores a mixed attempt, links missed topics, and retries cleanly", async () => {
    const user = userEvent.setup();
    const raw = '{"version":1,"completed":["recursion"]}';
    localStorage.setItem(PROGRESS_KEY, raw);
    localStorage.setItem(
      PROJECT_PROGRESS_KEY,
      serializeProjectProgress(["logic"]),
    );
    const savedProject = localStorage.getItem(PROJECT_PROGRESS_KEY);
    render(<AssessmentPage />);
    const submit = screen.getByRole("button", { name: "Submit assessment" });
    expect(submit).toBeDisabled();
    expect(
      screen.queryByText(assessment.questions[0].explanation, { exact: false }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /Review Recursion/ }),
    ).not.toBeInTheDocument();
    const groups = screen.getAllByRole("group");
    for (const [i, q] of assessment.questions.entries())
      await user.click(
        within(groups[i]).getByLabelText(
          q.options[
            i === 8 ? (q.correctIndex + 1) % q.options.length : q.correctIndex
          ],
        ),
      );
    await user.click(submit);
    expect(screen.getByRole("status")).toHaveTextContent("11 of 12 correct");
    expect(
      screen.getByRole("link", { name: "Review Recursion" }),
    ).toHaveAttribute("href", "/lessons/recursion");
    expect(screen.getByText(/Suggested review:/)).toHaveTextContent(
      "Recursion",
    );
    expect(
      screen.getByText(assessment.questions[8].explanation, { exact: false }),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("radio")
        .every((r) => (r as HTMLInputElement).disabled),
    ).toBe(true);
    await user.click(screen.getByRole("button", { name: "Retry assessment" }));
    expect(
      screen.getByRole("button", { name: "Submit assessment" }),
    ).toBeDisabled();
    expect(
      screen.getAllByRole("radio").some((r) => (r as HTMLInputElement).checked),
    ).toBe(false);
    expect(
      screen.queryByRole("link", { name: "Review Recursion" }),
    ).not.toBeInTheDocument();
    expect(localStorage.getItem(PROGRESS_KEY)).toBe(raw);
    expect(localStorage.getItem(PROJECT_PROGRESS_KEY)).toBe(savedProject);
  });
});

it("navigates through the last two lessons without treating recursion as a debugging prerequisite", () => {
  const topic = topics.find((t) => t.id === "debugging")!;
  render(
    <ProgressProvider>
      <LessonLayout topic={topic} lesson={lessons.debugging} />
    </ProgressProvider>,
  );
  expect(screen.getByText("Lesson 7 of 7")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Previous Lesson: Recursion" }),
  ).toHaveAttribute("href", "/lessons/recursion");
  expect(
    screen.queryByRole("link", { name: /Next Lesson:/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Build a Number Guessing Game" }),
  ).toHaveAttribute("href", "/projects/number-guessing");
  const foundations = document.querySelector(
    ".prerequisite-links",
  )! as HTMLElement;
  expect(
    within(foundations).queryByRole("link", { name: /Recursion/ }),
  ).not.toBeInTheDocument();
});
