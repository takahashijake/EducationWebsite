import type { Metadata } from "next";
import Link from "next/link";
import { LearningInsights } from "@/components/learning-insights";
export const metadata: Metadata = { title: "Learning insights" };
export default function LearningPage() {
  return (
    <article className="shell activity-shell lesson-article">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/roadmap">Roadmap</Link>
        <span>/</span>
        <span>Learning insights</span>
      </nav>
      <span className="eyebrow">YOUR LOCAL LEARNING PROFILE</span>
      <h1>Learning insights</h1>
      <p>
        See what you have studied, what your answers suggest, what needs another
        try, and where to practice next. This is guidance from authored checks,
        not a grade or proof of mastery.
      </p>
      <LearningInsights />
    </article>
  );
}
