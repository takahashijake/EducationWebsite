import { fireEvent, render, screen } from "@testing-library/react";
import { EditorState } from "@codemirror/state";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CodeEditor } from "@/components/code-editor";

afterEach(() => vi.restoreAllMocks());

describe("C++ code editor recovery", () => {
  it("uses an editable fallback and records the initialization error", () => {
    const error = new Error("editor mount failed");
    vi.spyOn(EditorState, "create").mockImplementationOnce(() => {
      throw error;
    });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const onChange = vi.fn();
    const onRun = vi.fn();

    render(
      <CodeEditor
        label="Exercise C++ source"
        value="int main() {}"
        onChange={onChange}
        onRun={onRun}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("plain editor");
    expect(screen.queryByText(/Loading editable C\+\+ code editor/)).toBeNull();
    const editor = screen.getByRole("textbox", { name: "Exercise C++ source" });
    expect(editor).toHaveValue("int main() {}");
    fireEvent.change(editor, { target: { value: "int main() { return 0; }" } });
    expect(onChange).toHaveBeenCalledWith("int main() { return 0; }");
    fireEvent.keyDown(editor, { key: "Enter", ctrlKey: true });
    expect(onRun).toHaveBeenCalledOnce();
    expect(log).toHaveBeenCalledWith(
      "C++ editor initialization failed; using plain editor.",
      error,
    );
  });
});
