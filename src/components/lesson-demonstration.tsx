import { CodeTrace } from "./code-trace";
import type { Lesson } from "@/content/types";
import { AlgorithmVisualizer } from "./algorithm-visualizer";
import { SortingComparison } from "./sorting-comparison";
import { LinkedListVisualizer } from "./linked-list-visualizer";
import { StackQueueVisualizer } from "./stack-queue-visualizer";
import { GraphVisualizer } from "./graph-visualizer";
import { WeightedGraphVisualizer } from "./weighted-graph-visualizer";
import { TreeVisualizer } from "./tree-visualizer";
export function LessonDemonstration({
  demonstration,
}: {
  demonstration: Lesson["demonstration"];
}) {
  if (demonstration.kind === "trace")
    return <CodeTrace key={demonstration.source} trace={demonstration} />;
  if (demonstration.kind === "algorithm")
    return (
      <AlgorithmVisualizer
        algorithm={demonstration.algorithm}
        caption={demonstration.caption}
      />
    );
  if (demonstration.kind === "sorting-comparison") return <SortingComparison />;
  if (demonstration.kind === "stacks-queues")
    return <StackQueueVisualizer caption={demonstration.caption} />;
  if (demonstration.kind === "tree-bst")
    return <TreeVisualizer caption={demonstration.caption} />;
  if (demonstration.kind === "weighted-dijkstra")
    return <WeightedGraphVisualizer caption={demonstration.caption} />;
  if (demonstration.kind === "graph-traversal")
    return <GraphVisualizer caption={demonstration.caption} />;
  if (demonstration.kind === "linked-list")
    return <LinkedListVisualizer caption={demonstration.caption} />;
  return (
    <figure className={`concept-demo ${demonstration.kind}`}>
      {demonstration.kind === "types" && (
        <div className="type-values">
          {[
            { value: "3", type: "int", label: "A whole number" },
            { value: "4.5", type: "float", label: "A floating-point number" },
            { value: '"3"', type: "str", label: "A string of text" },
            { value: "True", type: "bool", label: "A logical value" },
          ].map((item) => (
            <div key={item.type}>
              <code>{item.value}</code>
              <strong>{item.type}</strong>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
      {demonstration.kind === "binary" && (
        <div
          className="binary-places"
          role="img"
          aria-label="Binary 1101 with place values 8, 4, 2, 1"
        >
          {[8, 4, 2, 1].map((weight, index) => (
            <div key={weight}>
              <span>
                2<sup>{3 - index}</sup> = {weight}
              </span>
              <strong className={index === 2 ? "off" : ""}>
                {index === 2 ? "0" : "1"}
              </strong>
              <span>{index === 2 ? "+ 0" : `+ ${weight}`}</span>
            </div>
          ))}
        </div>
      )}
      {demonstration.kind === "complexity" && (
        <div className="table-scroll">
          <table>
            <caption className="sr-only">
              Operation counts by input size
            </caption>
            <thead>
              <tr>
                <th scope="col">Input size n</th>
                <th scope="col">Constant · 1</th>
                <th scope="col">Linear · n</th>
                <th scope="col">Quadratic · n²</th>
              </tr>
            </thead>
            <tbody>
              {[10, 20, 40].map((n) => (
                <tr key={n}>
                  <th scope="row">{n}</th>
                  <td>1</td>
                  <td>{n}</td>
                  <td>{n * n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <figcaption>{demonstration.caption}</figcaption>
    </figure>
  );
}
