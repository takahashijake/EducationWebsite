import {
  renderHook,
  render,
  screen,
  act,
  fireEvent,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { useLearningEvidence } from "@/components/use-learning-evidence";
import { EVIDENCE_KEY, makeEvidence } from "@/lib/learning-evidence";
import { PROGRESS_KEY } from "@/lib/progress";
import { KnowledgeCheck } from "@/components/knowledge-check";
import { lessons } from "@/content/lessons";
describe("learning evidence browser store", () => {
  it("does not write during hydration and clears independently", () => {
    localStorage.removeItem(EVIDENCE_KEY);
    const reading = '{"version":1,"completed":["loops"]}';
    localStorage.setItem(PROGRESS_KEY, reading);
    const spy = vi.spyOn(Storage.prototype, "setItem");
    const { result } = renderHook(() => useLearningEvidence());
    expect(result.current.ready).toBe(true);
    expect(spy).not.toHaveBeenCalled();
    act(() =>
      result.current.record([makeEvidence("variables-q2", true, "record-001")]),
    );
    expect(result.current.evidence).toHaveLength(1);
    act(() => result.current.clear());
    expect(result.current.evidence).toHaveLength(0);
    expect(localStorage.getItem(PROGRESS_KEY)).toBe(reading);
    spy.mockRestore();
  });
  it("does not create learning evidence from an unmapped non-programming check", async () => {
    localStorage.removeItem(EVIDENCE_KEY);
    const spy = vi.spyOn(Storage.prototype, "setItem");
    const question = lessons["binary-number-representation"].questions[0];
    const user = userEvent.setup();
    render(<KnowledgeCheck questions={[question]} />);
    await user.click(
      screen.getByLabelText(question.options[question.correctIndex]),
    );
    await user.click(screen.getByRole("button", { name: "Check answers" }));
    expect(spy).not.toHaveBeenCalled();
    expect(localStorage.getItem(EVIDENCE_KEY)).toBeNull();
    spy.mockRestore();
  });
  it("records a completed quiz submission only once until retry", async () => {
    localStorage.removeItem(EVIDENCE_KEY);
    const question = lessons["variables-data-types"].questions[0];
    const onResult = vi.fn();
    const user = userEvent.setup();
    const { container } = render(
      <KnowledgeCheck questions={[question]} onResult={onResult} />,
    );
    await user.click(
      screen.getByLabelText(question.options[question.correctIndex]),
    );
    await user.click(screen.getByRole("button", { name: "Check answers" }));
    fireEvent.submit(container.querySelector("form")!);
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(
      JSON.parse(localStorage.getItem(EVIDENCE_KEY)!).records,
    ).toHaveLength(1);
  });
});
