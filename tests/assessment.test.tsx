import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import AssessmentPage from "@/app/assessments/programming-fundamentals/page";
import { KnowledgeCheck } from "@/components/knowledge-check";
import { projects } from "@/content/projects";
import { fundamentalsAssessment as assessment } from "@/content/assessments";
import { PROGRESS_KEY } from "@/lib/progress";
import { projectProgressKey } from "@/lib/project-progress";
const project = projects[0];
describe("integrated assessment", () => {
  it("hides explanations before submission, scores a mixed attempt, links missed topics, and retries cleanly", async () => {
    const user = userEvent.setup();
    const raw = '{"version":1,"completed":["recursion"]}';
    localStorage.setItem(PROGRESS_KEY, raw);
    localStorage.setItem(
      projectProgressKey(project.id),
      JSON.stringify({
        version: 1,
        projectId: project.id,
        answers: {},
        checked: [],
      }),
    );
    const savedProject = localStorage.getItem(projectProgressKey(project.id));
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
    expect(localStorage.getItem(projectProgressKey(project.id))).toBe(
      savedProject,
    );
  });
});

it("preserves lesson evidence callbacks on submit and retry", async () => {
  const user = userEvent.setup();
  const onResult = vi.fn();
  const q = assessment.questions[0];
  render(<KnowledgeCheck questions={[q]} onResult={onResult} />);
  await user.click(screen.getByLabelText(q.options[q.correctIndex]));
  await user.click(screen.getByRole("button", { name: "Check answers" }));
  expect(onResult).toHaveBeenLastCalledWith([true]);
  await user.click(screen.getByRole("button", { name: "Try again" }));
  expect(onResult).toHaveBeenLastCalledWith(undefined);
});
