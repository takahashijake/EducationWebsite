import type { CodingCase } from "@/content/cpp-exercises";
import type { ProgramResult } from "./execution/types";

// A final line ending is optional; all other whitespace is significant.
export function normalizeOutput(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/\n$/, "");
}
export function evaluateCases(cases: CodingCase[], results: ProgramResult[]) {
  return cases.map((test, index) => {
    const result =
      results[index] ??
      (results[0]?.kind === "compilation-error" ? results[0] : undefined);
    const kind: ProgramResult["kind"] = !result
      ? "cancelled"
      : result.kind !== "success"
        ? result.kind
        : normalizeOutput(result.stdout) === normalizeOutput(test.stdout)
          ? "success"
          : "incorrect-output";
    return {
      id: test.id,
      label: test.label,
      kind,
      passed: kind === "success",
      result,
    };
  });
}
