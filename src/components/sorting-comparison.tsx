"use client";
import { useId, useMemo, useState } from "react";
import {
  generateAlgorithmSteps,
  sortingAlgorithms,
  sortingScenarios,
} from "@/lib/algorithm-steps";

const notes = {
  "bubble-sort":
    "Early exit makes an already sorted input linear; reverse order still takes quadratic comparisons and many adjacent swaps.",
  "selection-sort":
    "Every unsorted suffix is scanned, even when already ordered. A self-swap is skipped.",
  "insertion-sort":
    "Already ordered keys need one comparison each and no shifts. Reverse order requires quadratic shifts.",
} as const;
const titles = {
  "bubble-sort": "Bubble sort",
  "selection-sort": "Selection sort",
  "insertion-sort": "Insertion sort",
} as const;

export function SortingComparison() {
  const id = useId();
  const [scenarioId, setScenarioId] = useState(sortingScenarios[0].id);
  const scenario = sortingScenarios.find((item) => item.id === scenarioId)!;
  const results = useMemo(
    () =>
      sortingAlgorithms.map((algorithm) => ({
        algorithm,
        final: generateAlgorithmSteps(algorithm, scenario).at(-1)!,
      })),
    [scenario],
  );
  return (
    <section className="sorting-comparison" aria-labelledby={`${id}-title`}>
      <h3 id={`${id}-title`}>Compare the same input</h3>
      <p>
        These counts come from the same step generators as the players above.
        They describe this input and these implementation variants.
      </p>
      <label htmlFor={`${id}-scenario`}>Shared sorting input</label>{" "}
      <select
        id={`${id}-scenario`}
        value={scenarioId}
        onChange={(event) => setScenarioId(event.target.value)}
      >
        {sortingScenarios.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      <p>Input: [{scenario.values.join(", ")}]</p>
      <div className="sorting-comparison-grid">
        {results.map(({ algorithm, final }) => (
          <div key={algorithm}>
            <h4>{titles[algorithm]}</h4>
            <p>Output: [{final.values.join(", ")}]</p>
            <p>
              Comparisons: {final.comparisons} · Swaps: {final.sorting!.swaps} ·
              Array writes: {final.sorting!.writes}
            </p>
            <p>{notes[algorithm]}</p>
          </div>
        ))}
      </div>
      <p>
        All three have O(n²) average and worst-case time on this educational
        implementation. Bubble and insertion have O(n) best-case time; selection
        remains O(n²). Each uses O(1) auxiliary array space. Operation counts
        are not elapsed time or a claim about which implementation is fastest in
        practice.
      </p>
    </section>
  );
}
