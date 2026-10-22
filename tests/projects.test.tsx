import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { projects } from "@/content/projects";
import { lessons } from "@/content/lessons";
import { topics } from "@/content/curriculum";
import { validateProjects } from "@/lib/project-validation";
import {
  emptyProjectProgress,
  parseProjectProgress,
  projectProgressKey,
  projectStages,
  serializeProjectProgress,
} from "@/lib/project-progress";
import { PROGRESS_KEY } from "@/lib/progress";
import { GuidedProject } from "@/components/guided-project";
import { ProgressProvider } from "@/components/progress-provider";
import { LessonPractice } from "@/components/lesson-practice";
import ProjectPage, { generateStaticParams } from "@/app/projects/[slug]/page";
const project = projects[0];
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
const storedKey = projectProgressKey(project.id);
const legacy = '{"version":1,"completed":["variables-data-types","functions"]}';
const renderProject = () =>
  render(
    <ProgressProvider>
      <GuidedProject project={project} />
    </ProgressProvider>,
  );

describe("reusable guided-project contracts", () => {
  it("validates prerequisites, links, milestone content and global assessment identities", () => {
    const assessmentIds = Object.values(lessons).flatMap((l) =>
      [...l.questions, ...(l.exercises ?? [])].map((q) => q.id),
    );
    expect(validateProjects(projects, topics, assessmentIds)).toEqual([]);
    const invalid = structuredClone(project);
    invalid.prerequisites = ["testing"];
    invalid.milestones[1].id = invalid.milestones[0].id;
    invalid.milestones[1].question.id = invalid.milestones[0].question.id;
    invalid.milestones[0].hints = [];
    invalid.milestones[0].question.correctIndex = NaN;
    expect(validateProjects([invalid], topics).join()).toMatch(
      /Duplicate milestone/,
    );
    expect(validateProjects([invalid], topics).join()).toMatch(
      /Invalid project prerequisite/,
    );
    expect(validateProjects([invalid], topics).join()).toMatch(
      /Incomplete milestone/,
    );
    expect(validateProjects([invalid], topics).join()).toMatch(
      /Invalid project assessment/,
    );
  });
  it("statically enumerates project routes and rejects unknown slugs", async () => {
    expect(generateStaticParams()).toEqual([{ slug: project.slug }]);
    await expect(
      ProjectPage({ params: Promise.resolve({ slug: "unknown" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });
  it.each([
    null,
    "",
    "{bad",
    "null",
    "[]",
    "42",
    '{"version":2}',
    JSON.stringify({
      version: 1,
      projectId: "other",
      answers: {},
      checked: [],
    }),
    JSON.stringify({
      version: 1,
      projectId: project.id,
      answers: [],
      checked: [],
    }),
  ])("rejects malformed, foreign and unsupported progress: %s", (raw) => {
    expect(parseProjectProgress(raw, project)).toEqual(
      emptyProjectProgress(project),
    );
  });
  it("filters answer indices and checklist identities, never trusts a saved completion flag", () => {
    const value = {
      ...emptyProjectProgress(project),
      answers: {
        "project-compare-check": 1,
        "project-validate-check": -1,
        "project-round-check": 1.5,
        "project-terminal-check": 999,
        unknown: 0,
      },
      checked: ["compare-written", "compare-written", "unknown", 3],
      completed: true,
    };
    const parsed = parseProjectProgress(JSON.stringify(value), project);
    expect(parsed.answers).toEqual({ "project-compare-check": 1 });
    expect(parsed.checked).toEqual(["compare-written"]);
    expect(projectStages(project, parsed).map((s) => s.complete)).toEqual([
      true,
      false,
      false,
      false,
      false,
    ]);
    expect(
      parseProjectProgress(serializeProjectProgress(parsed, project), project),
    ).toEqual(parsed);
    expect(projectStages(project, { ...parsed, answers: {} })[0].complete).toBe(
      false,
    );
  });
  it("keeps later stages locked even if their saved checklists are forged", () => {
    const progress = emptyProjectProgress(project);
    progress.checked = project.milestones.flatMap((m) =>
      m.checklist.map((c) => c.id),
    );
    project.milestones.slice(1).forEach((m) => {
      progress.answers[m.question.id] = m.question.correctIndex;
    });
    expect(
      projectStages(project, progress).filter((s) => s.unlocked),
    ).toHaveLength(1);
    expect(projectStages(project, progress).some((s) => s.complete)).toBe(
      false,
    );
  });
});

describe("project learning flow", () => {
  it("shows advisory prerequisites, stages implementation, reveals hints incrementally and persists completion separately", async () => {
    const user = userEvent.setup();
    localStorage.setItem(PROGRESS_KEY, legacy);
    const view = renderProject();
    expect(localStorage.getItem(storedKey)).toBeNull();
    expect(localStorage.getItem(PROGRESS_KEY)).toBe(legacy);
    const prerequisites = screen.getByRole("region", {
      name: "Project prerequisites",
    });
    expect(within(prerequisites).getAllByRole("link")).toHaveLength(6);
    expect(
      within(prerequisites).getByRole("link", { name: "Basic Debugging" }),
    ).toHaveAttribute("href", "/lessons/debugging");
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(
      screen.queryByText(project.milestones[0].hints[0]),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Compare with the worked solution"),
    ).not.toBeInTheDocument();
    for (const [index, milestone] of project.milestones.entries()) {
      const region = screen.getByRole("region", {
        name: `${index + 1}. ${milestone.title}`,
      });
      const scope = within(region);
      const check = scope.getByRole("button", { name: "Check reasoning" });
      expect(check).toBeDisabled();
      expect(
        scope
          .getAllByRole("checkbox")
          .every((box) => (box as HTMLInputElement).disabled),
      ).toBe(true);
      if (index === 0) {
        const hint = scope.getByRole("button", { name: "Reveal next hint" });
        hint.focus();
        await user.keyboard("{Enter}");
        expect(
          scope.getByText(`Hint 1: ${milestone.hints[0]}`),
        ).toBeInTheDocument();
        expect(
          scope.queryByText(`Hint 2: ${milestone.hints[1]}`),
        ).not.toBeInTheDocument();
        await user.click(hint);
        expect(hint).toBeDisabled();
        await user.click(scope.getByLabelText(milestone.question.options[0]));
        await user.click(check);
        expect(
          scope.getByText(milestone.question.explanation, { exact: false }),
        ).toHaveTextContent("Not quite.");
        const solution = scope.getByText("Compare with the worked solution");
        expect(solution.closest("details")).not.toHaveAttribute("open");
        await user.click(solution);
        expect(solution.closest("details")).toHaveAttribute("open");
        await user.click(scope.getByRole("button", { name: "Retry exercise" }));
      }
      await user.click(
        scope.getByLabelText(
          milestone.question.options[milestone.question.correctIndex],
        ),
      );
      await user.click(scope.getByRole("button", { name: "Check reasoning" }));
      expect(
        scope.getByText(milestone.question.explanation, { exact: false }),
      ).toHaveTextContent("Correct.");
      for (const box of scope.getAllByRole("checkbox")) await user.click(box);
    }
    expect(screen.getByText(/Guided project completed/)).toBeInTheDocument();
    expect(
      screen.getByText("Reveal the full reference").closest("details"),
    ).not.toHaveAttribute("open");
    await user.click(screen.getByText("Reveal the full reference"));
    expect(
      screen.getByText("Reveal the full reference").closest("details"),
    ).toHaveAttribute("open");
    expect(localStorage.getItem(PROGRESS_KEY)).toBe(legacy);
    expect(
      projectStages(
        project,
        parseProjectProgress(localStorage.getItem(storedKey), project),
      ).every((s) => s.complete),
    ).toBe(true);
    const saved = localStorage.getItem(storedKey);
    view.unmount();
    renderProject();
    expect(localStorage.getItem(storedKey)).toBe(saved);
    expect(screen.getByText(/Guided project completed/)).toBeInTheDocument();
    expect(
      screen.getByText("Reveal the full reference").closest("details"),
    ).not.toHaveAttribute("open");
    expect(screen.getAllByText("0 of 2 hints revealed.")).toHaveLength(4);
    await user.click(screen.getAllByRole("checkbox")[0]);
    expect(
      screen.queryByText("Reveal the full reference"),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(3);
  });
  it("ignores corrupt storage without rewriting it, and responds to a storage event", () => {
    localStorage.setItem(storedKey, "{bad");
    renderProject();
    expect(localStorage.getItem(storedKey)).toBe("{bad");
    const value = emptyProjectProgress(project);
    value.answers[project.milestones[0].question.id] =
      project.milestones[0].question.correctIndex;
    value.checked = ["compare-written"];
    localStorage.setItem(storedKey, serializeProjectProgress(value, project));
    fireEvent(window, new StorageEvent("storage", { key: storedKey }));
    expect(screen.getByText(/1 of 5 milestones complete/)).toBeInTheDocument();
  });
  it("keeps a session fallback when writes are denied without touching legacy storage", async () => {
    const user = userEvent.setup();
    localStorage.setItem(PROGRESS_KEY, legacy);
    const view = renderProject();
    const blocked = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("denied");
      });
    try {
      await user.click(screen.getByLabelText("11, 12, 13"));
      await user.click(screen.getByRole("button", { name: "Check reasoning" }));
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Project progress is kept for this session only",
      );
      expect(screen.getByRole("checkbox")).toBeEnabled();
      expect(localStorage.getItem(PROGRESS_KEY)).toBe(legacy);
      view.unmount();
      renderProject();
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Project progress is kept for this session only",
      );
      expect(screen.getByRole("checkbox")).toBeEnabled();
    } finally {
      blocked.mockRestore();
    }
  });
});

it("summarizes assessment evidence without awarding reading completion or mastery", async () => {
  const user = userEvent.setup();
  const lesson = lessons.recursion;
  render(<LessonPractice lesson={lesson} />);
  const summary = screen.getByRole("region", { name: "Understanding summary" });
  expect(summary).toHaveTextContent("0 of 5 checks attempted");
  for (const exercise of lesson.exercises!) {
    const group = screen.getByRole("group", { name: exercise.prompt });
    await user.click(
      within(group).getByLabelText(exercise.options[exercise.correctIndex]),
    );
    await user.click(
      within(group.closest("form")!).getByRole("button", {
        name: "Check prediction",
      }),
    );
  }
  for (const q of lesson.questions)
    await user.click(
      within(
        screen.getByRole("group", {
          name: new RegExp(q.prompt.replace(/[?()]/g, "\\$&")),
        }),
      ).getByLabelText(q.options[q.correctIndex]),
    );
  await user.click(screen.getByRole("button", { name: "Check answers" }));
  expect(summary).toHaveTextContent("5 of 5 checks attempted · 5 correct");
  expect(summary).toHaveTextContent("do not establish mastery");
  expect(localStorage.getItem(PROGRESS_KEY)).toBeNull();
  await user.click(screen.getByRole("button", { name: "Try again" }));
  expect(summary).toHaveTextContent("2 of 5 checks attempted · 2 correct");
});
