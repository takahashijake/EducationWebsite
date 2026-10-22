import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  parseWorkspace,
  serializeWorkspace,
  workspaceKey,
} from "@/lib/workspace";
import { SOURCE_LIMIT } from "@/lib/execution/types";
import { useWorkspace } from "@/components/use-workspace";
const id = "lesson:loops:loops-inclusive-sum";
function Draft({ name = id }: { name?: string }) {
  const workspace = useWorkspace(name, "# starter");
  return (
    <>
      <label>
        Draft
        <textarea
          value={workspace.source}
          onChange={(e) => workspace.save(e.target.value)}
        />
      </label>
      <p>{workspace.storageError ? "Session only" : "Stored"}</p>
    </>
  );
}
describe("versioned code workspaces", () => {
  it.each([
    null,
    "",
    "{bad",
    "null",
    "[]",
    "42",
    '{"version":2}',
    JSON.stringify({ version: 1, workspaceId: "other", source: "print(1)" }),
    JSON.stringify({ version: 1, workspaceId: id, source: 3 }),
  ])("rejects invalid data: %s", (raw) => {
    expect(parseWorkspace(raw, id)).toBeUndefined();
  });
  it("bounds storage and preserves empty code", () => {
    expect(parseWorkspace(serializeWorkspace(id, ""), id)?.source).toBe("");
    expect(() =>
      serializeWorkspace(id, "x".repeat(SOURCE_LIMIT + 1)),
    ).toThrow();
    expect(
      parseWorkspace(
        JSON.stringify({
          version: 1,
          workspaceId: id,
          source: "x".repeat(SOURCE_LIMIT + 1),
        }),
        id,
      ),
    ).toBeUndefined();
    expect(
      parseWorkspace(" ".repeat(SOURCE_LIMIT * 6 + 1001), id),
    ).toBeUndefined();
  });
  it("does no hydration writes, restores drafts, isolates exercises, and accepts cross-tab updates", () => {
    const legacy = '{"version":1,"completed":["loops"]}';
    localStorage.setItem("cs-fundamentals:progress:v1", legacy);
    localStorage.setItem(workspaceKey(id), serializeWorkspace(id, "print(1)"));
    const set = vi.spyOn(Storage.prototype, "setItem");
    const view = render(<Draft />);
    expect(set).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Draft")).toHaveValue("print(1)");
    fireEvent.change(screen.getByLabelText("Draft"), {
      target: { value: "print(2)" },
    });
    expect(
      parseWorkspace(localStorage.getItem(workspaceKey(id)), id)?.source,
    ).toBe("print(2)");
    view.rerender(<Draft name="lesson:functions:functions-return" />);
    expect(screen.getByLabelText("Draft")).toHaveValue("# starter");
    expect(localStorage.getItem("cs-fundamentals:progress:v1")).toBe(legacy);
    view.rerender(<Draft />);
    localStorage.setItem(workspaceKey(id), serializeWorkspace(id, "print(3)"));
    fireEvent(window, new StorageEvent("storage", { key: workspaceKey(id) }));
    expect(screen.getByLabelText("Draft")).toHaveValue("print(3)");
  });
  it("leaves malformed storage untouched on load", () => {
    localStorage.setItem(workspaceKey(id), "{bad");
    render(<Draft />);
    expect(screen.getByLabelText("Draft")).toHaveValue("# starter");
    expect(localStorage.getItem(workspaceKey(id))).toBe("{bad");
  });
  it("retains a usable session draft when storage is denied, including remounts", () => {
    const view = render(<Draft name="test:denied" />);
    const set = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw Error("quota");
      });
    fireEvent.change(screen.getByLabelText("Draft"), {
      target: { value: "print('kept')" },
    });
    expect(screen.getByText("Session only")).toBeInTheDocument();
    view.unmount();
    render(<Draft name="test:denied" />);
    expect(screen.getByLabelText("Draft")).toHaveValue("print('kept')");
    set.mockRestore();
  });
});
