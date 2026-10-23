import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { CodeTrace } from "@/components/code-trace";
import {
  conditionalsTrace,
  functionsTrace,
  operatorsTrace,
  loopsTrace,
} from "@/content/programming-traces";
import { tracePosition, validateTrace } from "@/lib/trace";
import type { CodeTrace as Trace } from "@/content/types";

describe("trace contracts and instructional states", () => {
  it.each([null, {}, { steps: [null] }, { ...loopsTrace, steps: [null, {}] }])(
    "rejects incomplete runtime data without throwing: %j",
    (value) => {
      expect(validateTrace(value).length).toBeGreaterThan(0);
    },
  );
  it("renders a readable fallback for an incomplete definition", () => {
    render(<CodeTrace trace={{ ...loopsTrace, steps: [] }} />);
    expect(screen.getByRole("note")).toHaveTextContent("unavailable");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
  it("rejects lost output, invalid frames and invalid scenarios", () => {
    const lostOutput = {
      ...loopsTrace,
      steps: [...loopsTrace.steps, { ...loopsTrace.steps.at(-1)!, output: [] }],
    };
    expect(validateTrace(lostOutput).join()).toContain("cumulative");
    const missingReturn = structuredClone(functionsTrace);
    delete missingReturn.steps[4].frames![1].returnValue;
    expect(validateTrace(missingReturn).join()).toContain("Invalid frames");
    const replacedCaller = structuredClone(functionsTrace);
    replacedCaller.steps[5].frames![0].id = "different";
    expect(validateTrace(replacedCaller).join()).toContain(
      "Invalid frame transition",
    );
    const missingFrames = structuredClone(functionsTrace);
    delete missingFrames.steps[3].frames;
    expect(validateTrace(missingFrames).join()).toContain("Invalid frames");
    expect(
      validateTrace({
        ...conditionalsTrace,
        scenarios: [
          conditionalsTrace.scenarios![0],
          conditionalsTrace.scenarios![0],
        ],
      }).join(),
    ).toContain("Duplicate scenario");
    expect(
      validateTrace({
        ...conditionalsTrace,
        scenarios: [{ id: "broken", label: "Broken" }],
      }).join(),
    ).toContain("Incomplete trace");
  });
  it("separates intermediate evaluation from assignment and preserves loop iteration state", () => {
    expect(operatorsTrace.steps[2].detail).toContain("24 + 2");
    expect(
      operatorsTrace.steps[2].variables.some((v) => v.name === "total"),
    ).toBe(false);
    expect(
      operatorsTrace.steps[3].variables.find((v) => v.name === "total")?.value,
    ).toBe(26);
    expect(
      loopsTrace.steps
        .filter((s) => s.detail?.includes("complete"))
        .map((s) => s.variables.find((v) => v.name === "total")?.value),
    ).toEqual([1, 3, 6]);
    expect(loopsTrace.steps.at(-2)?.detail).toContain("Termination");
    expect(loopsTrace.steps.at(-1)?.output).toEqual(["6"]);
    expect(tracePosition(NaN, "next", 0)).toBe(0);
    expect(tracePosition(999, "next", 3)).toBe(2);
  });
  it("shows Python primitive values without using JavaScript boolean spellings", () => {
    const valueTrace: Trace = {
      ...operatorsTrace,
      steps: operatorsTrace.steps.slice(0, 2).map((s) => ({
        ...s,
        variables: [
          { name: "flag", value: true, scope: "global" },
          { name: "missing", value: null, scope: "global" },
          { name: "word", value: "hello", scope: "global" },
        ],
      })),
    };
    render(<CodeTrace trace={valueTrace} />);
    expect(screen.getByRole("status")).toHaveTextContent("True");
    expect(screen.getByRole("status")).toHaveTextContent("None");
    expect(screen.getByRole("status")).toHaveTextContent('"hello"');
  });
});

describe("selectable branches and call frames", () => {
  it("replays every threshold input and resets position on input changes", async () => {
    const user = userEvent.setup();
    render(<CodeTrace trace={conditionalsTrace} />);
    const select = screen.getByRole("combobox", {
      name: "Choose a quiz score",
    });
    const next = screen.getByRole("button", { name: "Next step" });
    for (const [id, output] of [
      ["below-60", "review"],
      ["at-60", "ready"],
      ["below-80", "ready"],
      ["at-80", "advanced"],
      ["above-80", "advanced"],
    ]) {
      await user.selectOptions(select, id);
      expect(screen.getByRole("status")).toHaveTextContent("step 1 of");
      while (!(next as HTMLButtonElement).disabled) await user.click(next);
      const status = screen.getByRole("status");
      expect(
        within(status).getByText(output, { selector: "pre" }),
      ).toBeInTheDocument();
      if (output === "advanced")
        expect(status).toHaveTextContent("step 4 of 4");
      await user.click(screen.getByRole("button", { name: "Reset trace" }));
      expect(select).toHaveValue(id);
    }
  });
  it("suspends the caller, returns a value and restores the caller when moving in either direction", async () => {
    const user = userEvent.setup();
    render(<CodeTrace trace={functionsTrace} />);
    const frames = screen.getByRole("region", { name: "Call frames" });
    const next = screen.getByRole("button", { name: "Next step" });
    expect(within(frames).getAllByRole("listitem")).toHaveLength(1);
    await user.click(next);
    await user.click(next);
    expect(frames).toHaveTextContent("Caller (module) · suspended");
    expect(frames).toHaveTextContent("amount = 10; fee = 2");
    expect(frames).toHaveTextContent("Caller resumes at line 6");
    await user.click(next);
    await user.click(next);
    expect(frames).toHaveTextContent("Returning 12");
    expect(frames).toHaveTextContent("total = 12");
    await user.click(next);
    expect(within(frames).getAllByRole("listitem")).toHaveLength(1);
    expect(frames).toHaveTextContent("Caller (module) · active");
    expect(frames).toHaveTextContent("result = 12");
    await user.click(screen.getByRole("button", { name: "Previous step" }));
    expect(frames).toHaveTextContent("Returning 12");
  });
});
