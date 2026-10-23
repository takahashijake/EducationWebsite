import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CodeLab } from "@/components/code-lab";
import { codingExercises } from "@/content/coding-exercises";
import { workspaceKey, serializeWorkspace } from "@/lib/workspace";
import type {
  ExecutionEngine,
  ExecutionEvent,
  ExecutionRequest,
  ExecutionResult,
} from "@/lib/execution/python-types";
const exercise = codingExercises.loops;
const successful: ExecutionResult = {
  kind: "success",
  stdout: "6\n",
  stderr: "",
  tests: [],
  truncated: false,
};
function engineWith(result: ExecutionResult) {
  return {
    execute: vi.fn(
      async (
        _request: ExecutionRequest,
        events: (event: ExecutionEvent) => void,
      ) => {
        events({ state: "running" });
        events({ state: result.kind === "success" ? "completed" : "failed" });
        return result;
      },
    ),
    cancel: vi.fn(),
    dispose: vi.fn(),
  } satisfies ExecutionEngine;
}
describe("instructional Code Lab", () => {
  it("runs by keyboard, preserves normal Tab behavior, and separates execution from tests", async () => {
    const user = userEvent.setup();
    const engine = engineWith(successful);
    render(
      <CodeLab
        exercise={exercise}
        workspaceId="test:lab"
        createEngine={() => engine}
      />,
    );
    const source = screen.getByLabelText("Python source");
    source.focus();
    await user.keyboard("{Control>}{Enter}{/Control}");
    expect(engine.execute).toHaveBeenCalledWith(
      expect.objectContaining({ source: exercise.starter, tests: [] }),
      expect.any(Function),
    );
    expect(
      screen.getByRole("region", { name: "Execution result" }),
    ).toHaveTextContent("Program completed successfully");
    expect(
      screen.getByRole("region", { name: "Test result" }),
    ).toHaveTextContent("Tests have not run");
    source.focus();
    await user.tab();
    expect(source).not.toHaveFocus();
    expect(
      screen.getByRole("region", { name: "Learning guidance" }),
    ).toHaveTextContent("not complete understanding");
  });
  it("reports failed labels and authored conceptual guidance without changing old progress", async () => {
    const user = userEvent.setup();
    const before = '{"version":1,"completed":["loops"]}';
    localStorage.setItem("cs-fundamentals:progress:v1", before);
    const engine = engineWith({
      ...successful,
      kind: "test-failure",
      tests: [
        { id: exercise.tests[0].id, status: "passed" },
        {
          id: exercise.tests[1].id,
          status: "failed",
          error: "Expected 6, observed 3",
        },
      ],
    });
    render(
      <CodeLab
        exercise={exercise}
        workspaceId="test:feedback"
        createEngine={() => engine}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Run Tests" }));
    expect(
      screen.getByRole("region", { name: "Test result" }),
    ).toHaveTextContent("1 passed · 1 failed · 0 not run");
    const guidance = screen.getByRole("region", { name: "Learning guidance" });
    expect(guidance).toHaveTextContent(exercise.tests[1].guidance);
    expect(
      within(guidance).getByRole("link", { name: "Basic Debugging" }),
    ).toHaveAttribute("href", "/lessons/debugging");
    expect(localStorage.getItem("cs-fundamentals:progress:v1")).toBe(before);
    fireEvent.change(screen.getByLabelText("Python source"), {
      target: { value: "print('changed')" },
    });
    expect(
      screen.getByRole("region", { name: "Test result" }),
    ).not.toHaveTextContent("1 passed");
  });
  it("requires explicit confirmation to reset or carry forward and copies only saved learner source", async () => {
    const user = userEvent.setup();
    const previous = "test:previous";
    localStorage.setItem(
      workspaceKey(previous),
      serializeWorkspace(previous, "# my implementation"),
    );
    render(
      <CodeLab
        exercise={exercise}
        workspaceId="test:reset"
        carryFrom={{ workspaceId: previous, title: "My earlier component" }}
      />,
    );
    const source = screen.getByLabelText("Python source");
    fireEvent.change(source, { target: { value: "# keep this" } });
    await user.click(screen.getByRole("button", { name: "Reset Code" }));
    expect(source).toHaveValue("# keep this");
    expect(screen.getByRole("button", { name: "Keep my code" })).toHaveFocus();
    await user.click(screen.getByRole("button", { name: "Keep my code" }));
    expect(source).toHaveValue("# keep this");
    await user.click(
      screen.getByRole("button", { name: "Carry forward my previous code" }),
    );
    expect(source).toHaveValue("# keep this");
    await user.click(
      screen.getByRole("button", { name: "Confirm carry forward" }),
    );
    expect(source).toHaveValue(`# my implementation\n\n${exercise.starter}`);
    await user.click(screen.getByRole("button", { name: "Reset Code" }));
    await user.click(screen.getByRole("button", { name: "Confirm reset" }));
    expect(source).toHaveValue(exercise.starter);
  });
  it("stops a running engine, disposes on unmount, and ignores late route responses", async () => {
    const user = userEvent.setup();
    let finish!: (result: ExecutionResult) => void;
    let events!: (event: ExecutionEvent) => void;
    const engine = {
      execute: vi.fn(
        (_r: ExecutionRequest, callback: (event: ExecutionEvent) => void) => {
          events = callback;
          callback({ state: "running" });
          return new Promise<ExecutionResult>((resolve) => {
            finish = resolve;
          });
        },
      ),
      cancel: vi.fn(),
      dispose: vi.fn(),
    };
    const view = render(
      <CodeLab
        exercise={exercise}
        workspaceId="test:cancel"
        createEngine={() => engine}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Run" }));
    expect(screen.getByRole("button", { name: "Stop" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Stop" }));
    expect(engine.cancel).toHaveBeenCalled();
    view.unmount();
    expect(engine.dispose).toHaveBeenCalled();
    await act(async () => {
      events({ state: "completed" });
      finish(successful);
    });
    expect(
      screen.queryByText("Program completed successfully"),
    ).not.toBeInTheDocument();
  });
  it("withdraws test evidence after a cross-tab edit without writing the external source back", async () => {
    const user = userEvent.setup();
    const id = "test:external";
    const engine = engineWith({
      ...successful,
      tests: exercise.tests.map((t) => ({ id: t.id, status: "passed" })),
    });
    render(
      <CodeLab
        exercise={exercise}
        workspaceId={id}
        createEngine={() => engine}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Run Tests" }));
    expect(
      screen.getByRole("region", { name: "Test result" }),
    ).toHaveTextContent("2 passed");
    localStorage.setItem(workspaceKey(id), serializeWorkspace(id, "print(99)"));
    const spy = vi.spyOn(Storage.prototype, "setItem");
    fireEvent(window, new StorageEvent("storage", { key: workspaceKey(id) }));
    expect(screen.getByLabelText("Python source")).toHaveValue("print(99)");
    expect(
      screen.getByRole("region", { name: "Test result" }),
    ).not.toHaveTextContent("2 passed");
    expect(spy).not.toHaveBeenCalled();
  });
});

it("preserves edited work and explains a carry-forward source-size rejection", async () => {
  const user = userEvent.setup();
  localStorage.setItem(
    workspaceKey("test:large-previous"),
    serializeWorkspace("test:large-previous", "#".repeat(24000)),
  );
  render(
    <CodeLab
      exercise={exercise}
      workspaceId="test:carry-limit"
      carryFrom={{ workspaceId: "test:large-previous", title: "Large draft" }}
    />,
  );
  const source = screen.getByLabelText("Python source");
  fireEvent.change(source, { target: { value: "# keep this edited draft" } });
  await user.click(
    screen.getByRole("button", { name: "Carry forward my previous code" }),
  );
  await user.click(
    screen.getByRole("button", { name: "Confirm carry forward" }),
  );
  expect(screen.getByLabelText("Error and traceback")).toHaveTextContent(
    "Combined code exceeds the editor limit",
  );
  expect(source).toHaveValue("# keep this edited draft");
  expect(screen.getByRole("region", { name: "Test result" })).toHaveTextContent(
    "Tests have not run",
  );
});
