import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { cppExercises } from "@/content/cpp-exercises";
import { CppPlayground } from "@/components/cpp-playground";
import { ProgressProvider } from "@/components/progress-provider";
import type { ExecutionEngine, ProgramResult } from "@/lib/execution/types";
import {
  defaultPractice,
  PRACTICE_KEY,
  serializePractice,
} from "@/lib/practice-progress";
import { PROGRESS_KEY } from "@/lib/progress";
vi.mock("@/components/code-editor", () => ({
  CodeEditor: ({
    value,
    onChange,
    label,
  }: {
    value: string;
    onChange: (text: string) => void;
    label: string;
  }) => (
    <textarea
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));
const exercise = cppExercises[3];
const successful: ProgramResult[] = exercise.tests.map((test) => ({
  kind: "success",
  stdout: test.stdout,
  stderr: "",
  diagnostics: "",
  exitCode: 0,
}));
function setup() {
  const engine: ExecutionEngine = {
    execute: vi.fn().mockResolvedValue(successful),
    cancel: vi.fn(),
    dispose: vi.fn(),
  };
  const createEngine = () => engine;
  const ui = (
    <ProgressProvider>
      <CppPlayground exercise={exercise} createEngine={createEngine} />
    </ProgressProvider>
  );
  return { ...render(ui), ui, engine };
}
describe("coding lesson workspace", () => {
  it("saves drafts, confirms reset, and restores history without touching reading progress", async () => {
    const legacy = '{"version":1,"completed":["functions"]}';
    localStorage.setItem(PROGRESS_KEY, legacy);
    const user = userEvent.setup();
    const first = setup();
    const editor = screen.getByRole("textbox", { name: /C\+\+ source/ });
    fireEvent.change(editor, { target: { value: "int main(){}" } });
    expect(localStorage.getItem(PRACTICE_KEY)).toContain("int main(){}");
    await user.click(screen.getByRole("button", { name: "Reset to starter" }));
    expect(screen.getByRole("button", { name: "Keep my code" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Keep my code" }));
    expect(editor).toHaveValue("int main(){}");
    await user.click(screen.getByRole("button", { name: "Reset to starter" }));
    await user.click(screen.getByRole("button", { name: "Replace code" }));
    expect(editor).toHaveValue(exercise.starter);
    await user.click(screen.getByRole("button", { name: "Submit solution" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "4 of 4 public tests passed. Exercise complete.",
      ),
    );
    expect(localStorage.getItem(PROGRESS_KEY)).toBe(legacy);
    first.unmount();
    setup();
    expect(
      screen.getByText(/Previously passed all public tests/),
    ).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /C\+\+ source/ })).toHaveValue(
      exercise.starter,
    );
    fireEvent.change(screen.getByLabelText("Program input (stdin)"), {
      target: { value: "9\n" },
    });
    expect(screen.getByRole("status")).not.toHaveTextContent(
      "Exercise complete",
    );
  });
  it("withholds completion for partial, missing, failed, or ordinary Run results", async () => {
    const { engine } = setup();
    const user = userEvent.setup();
    vi.mocked(engine.execute).mockResolvedValueOnce([
      {
        kind: "compilation-error",
        stdout: "",
        stderr: "",
        diagnostics: "main.cpp: error: expected ;",
      },
    ]);
    await user.click(screen.getByRole("button", { name: "Submit solution" }));
    await waitFor(() =>
      expect(
        screen.getByText("main.cpp: error: expected ;"),
      ).toBeInTheDocument(),
    );
    expect(screen.getByRole("status")).toHaveTextContent("0 of 4");
    await user.click(screen.getByRole("button", { name: /^Run$/ }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Successful execution",
      ),
    );
    expect(localStorage.getItem(PRACTICE_KEY)).not.toContain("completedAt");
  });
  it("cancels stale work after a cross-tab draft change and rejects its eventual success", async () => {
    const { engine } = setup();
    let finish!: (results: ProgramResult[]) => void;
    vi.mocked(engine.execute).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Submit solution" }));
    act(() => {
      localStorage.setItem(
        PRACTICE_KEY,
        serializePractice({
          [exercise.id]: { ...defaultPractice(exercise), source: "new code" },
        }),
      );
      window.dispatchEvent(new StorageEvent("storage", { key: PRACTICE_KEY }));
    });
    expect(screen.getByRole("textbox", { name: /C\+\+ source/ })).toHaveValue(
      "new code",
    );
    await act(async () => finish(successful));
    expect(screen.getByRole("status")).toHaveTextContent("Ready to run");
    expect(localStorage.getItem(PRACTICE_KEY)).not.toContain("completedAt");
    expect(engine.cancel).toHaveBeenCalled();
  });
  it("does not write malformed storage during hydration", () => {
    localStorage.setItem(PRACTICE_KEY, "malformed");
    setup();
    expect(screen.getByRole("textbox", { name: /C\+\+ source/ })).toHaveValue(
      exercise.starter,
    );
    expect(localStorage.getItem(PRACTICE_KEY)).toBe("malformed");
  });
  it("keeps session drafts with a notice when storage is denied", () => {
    setup();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    fireEvent.change(screen.getByRole("textbox", { name: /C\+\+ source/ }), {
      target: { value: "session code" },
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "kept for this session only",
    );
    expect(screen.getByRole("textbox", { name: /C\+\+ source/ })).toHaveValue(
      "session code",
    );
  });
});
