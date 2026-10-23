import type { Metadata } from "next";
import Link from "next/link";
import { RetrievalPractice } from "@/components/retrieval-practice";
export const metadata: Metadata = { title: "Retrieval practice" };
export default async function RetrievalPage({
  searchParams,
}: {
  searchParams: Promise<{ question?: string }>;
}) {
  const { question } = await searchParams;
  return (
    <article className="shell activity-shell lesson-article">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/learning">Learning insights</Link>
        <span>/</span>
        <span>Retrieval practice</span>
      </nav>
      <span className="eyebrow">RECALL & EXPLAIN</span>
      <h1>Retrieval practice</h1>
      <p>
        Predict before selecting an answer. Explanations appear after
        submission. Return later for a scheduled review.
      </p>
      <RetrievalPractice initialId={question} />
      <p>
        <Link href="/learning">Return to learning insights →</Link>
      </p>
    </article>
  );
}
