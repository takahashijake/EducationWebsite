import type { Metadata } from "next";
import Link from "next/link";
import { AdaptivePractice } from "@/components/adaptive-practice";

export const metadata: Metadata = { title: "Adaptive practice" };
export default async function AdaptivePracticePage({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string }>;
}) {
  const { skill } = await searchParams;
  const initialSkill = typeof skill === "string" ? skill : undefined;
  return (
    <article className="shell activity-shell lesson-article">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/learning">Learning insights</Link>
        <span>/</span>
        <span>Adaptive practice</span>
      </nav>
      <span className="eyebrow">REASON → CHECK → REVIEW → TRY AGAIN</span>
      <h1>Adaptive practice</h1>
      <p>
        Work through five authored, changing problems. Your local answers help
        select a concept to practice next. You can choose a concept yourself at
        any time. Hints and explanations support learning; they do not turn a
        correct answer into independent evidence.
      </p>
      <AdaptivePractice
        key={initialSkill ?? "recommended"}
        initialSkill={initialSkill}
      />
      <p>
        <Link href="/practice/retrieval">
          Browse the fixed retrieval questions →
        </Link>
        {" · "}
        <Link href="/practice/cpp">Explore C++ coding practice →</Link>
      </p>
    </article>
  );
}
