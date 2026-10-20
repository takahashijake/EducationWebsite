import type { Lesson } from "@/content/types";
export function CodeExample({ code }: { code: Lesson["code"] }) {
  return (
    <figure className="code-example">
      <figcaption>
        <span>{code.title}</span>
        <span>{code.language}</span>
      </figcaption>
      <pre tabIndex={0} aria-label={code.title}>
        <code>{code.source}</code>
      </pre>
      <p>{code.explanation}</p>
    </figure>
  );
}
