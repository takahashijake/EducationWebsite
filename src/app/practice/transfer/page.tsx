import type { Metadata } from "next";
import Link from "next/link";
import { CodeLab } from "@/components/code-lab";
import { transferChallenge } from "@/content/transfer-challenge";
export const metadata: Metadata = {
  title: "Expense summary transfer challenge",
};
export default function TransferPage() {
  return (
    <article className="shell activity-shell lesson-article">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/learning">Learning insights</Link>
        <span>/</span>
        <span>Transfer challenge</span>
      </nav>
      <span className="eyebrow">APPLY YOUR LEARNING</span>
      <h1>{transferChallenge.title}</h1>
      <p>
        Build a reusable function from an incomplete start. Reveal hints only
        when needed, then explain your solution in your own words.
      </p>
      <p>
        Public examples: <code>summarize_expenses([125, 75], 200)</code> →{" "}
        <code>(200, False)</code>;{" "}
        <code>summarize_expenses([125, 76], 200)</code> →{" "}
        <code>(201, True)</code>; <code>summarize_expenses([], 0)</code> →{" "}
        <code>(0, False)</code>.
      </p>
      <CodeLab
        exercise={transferChallenge}
        workspaceId="transfer:expense-summary"
      />
      <section className="insight-panel" aria-labelledby="transfer-rubric">
        <h2 id="transfer-rubric">Self-explanation rubric</h2>
        <p>After testing, explain each point without looking at the hints:</p>
        <ol>
          <li>
            State what <code>total</code> represents before and after every loop
            iteration.
          </li>
          <li>
            Explain why an empty list returns zero and why equality with the
            limit is allowed.
          </li>
          <li>
            Show where negative input is rejected and name another boundary case
            you would test.
          </li>
          <li>Identify one behavior the public checks do not establish.</li>
        </ol>
      </section>
      <p>
        <Link href="/learning">Return to learning insights →</Link>
      </p>
    </article>
  );
}
